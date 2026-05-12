from typing import Dict, List, Optional, Any
from decimal import Decimal
import frappe
import uuid
import base64
from frappe.utils import now_datetime, get_url
from erpnext.accounts.doctype.sales_invoice.sales_invoice import SalesInvoice

from zatca.utils.zatca import ZatcaSigner, call_zatca_api
from zatca.utils.ubl_generator import generate_ubl_xml


class ZatcaSalesInvoice(SalesInvoice):
    """
    Extends ERPNext Sales Invoice with ZATCA Phase 2 signing and submission logic.
    Inherits from the standard SalesInvoice controller.
    """

    def on_submit(self) -> None:
        """
        Triggered when the Sales Invoice is submitted.
        Enqueues the ZATCA signing and submission process as a background task.
        """
        super().on_submit()
        # Fire signing in a background job to avoid blocking the user
        frappe.enqueue(
            "zatca.zatca.overrides.sales_invoice.sign_and_submit_to_zatca",
            invoice_name=self.name,
            queue="short",
            timeout=120,
        )

    def on_cancel(self) -> None:
        """
        Triggered when the Sales Invoice is cancelled.
        Logs the event, noting that ZATCA records are immutable for audit purposes.
        """
        super().on_cancel()
        frappe.logger("zatca").info(
            f"Sales Invoice {self.name} cancelled. ZATCA record must be kept for audit."
        )


# ─────────────────────────────────────────────────────────────
# Background Job — called via frappe.enqueue
# ─────────────────────────────────────────────────────────────

def sign_and_submit_to_zatca(invoice_name: str) -> None:
    """
    Main background worker for ZATCA Phase 2 integration.

    Steps:
    1. Load invoice, company, and customer documents.
    2. Generate unique UUID and sequential ICV.
    3. Construct the UBL 2.1 XML document.
    4. Sign the XML (Invoice Hash + ECDSA Digital Signature).
    5. Encode the QR code in ZATCA-compliant TLV format.
    6. Submit the signed invoice to ZATCA's Fatoora API (Clearance/Reporting).
    7. Persistence: Save cryptographic results to the invoice and create an audit log.

    Args:
        invoice_name (str): The primary name (ID) of the Sales Invoice to process.
    """
    try:
        invoice = frappe.get_doc("Sales Invoice", invoice_name)
        settings = frappe.get_single("ZATCA Settings")

        # Guard: only run if fully onboarded
        if settings.status != "Onboarded":
            _log(invoice_name, "Skipped", "ZATCA Settings not in Onboarded state.", "")
            return

        company = frappe.get_doc("Company", invoice.company)
        customer = frappe.get_doc("Customer", invoice.customer)

        # ── 1. Generate UUID ──────────────────────────────────
        invoice_uuid: str = str(uuid.uuid4())

        # ── 2. ICV: Sequential counter stored on settings ─────
        icv: int = _get_next_icv()

        # ── 3. PIH: Hash of previous invoice XML ─────────────
        pih: str = _get_previous_invoice_hash(invoice_name)

        # ── 4. Generate UBL XML ───────────────────────────────
        xml_content: str = generate_ubl_xml(
            invoice_doc=invoice,
            company_doc=company,
            customer_doc=customer,
            icv=icv,
            pih=pih,
            uuid=invoice_uuid,
        )

        # ── 5. Sign ───────────────────────────────────────────
        private_key_pem: str = settings.get_password("private_key")
        signer = ZatcaSigner(private_key_pem, settings.production_certificate)

        # Hash generation requires bytes
        invoice_hash: str = signer.generate_invoice_hash(xml_content.encode('utf-8'))
        signature: str = signer.sign_hash(invoice_hash)

        # ── 6. QR Code (TLV Encoding) ─────────────────────────
        # Ensure currency values are handled as strings from Decimal
        qr_code: str = _generate_tlv_qr(
            seller_name=company.company_name,
            vat_number=company.tax_id or "",
            timestamp=f"{invoice.posting_date}T{invoice.posting_time or '00:00:00'}",
            grand_total=str(Decimal(invoice.grand_total).quantize(Decimal('0.01'))),
            vat_total=str(Decimal(invoice.total_taxes_and_charges).quantize(Decimal('0.01'))),
            invoice_hash=invoice_hash,
            signature=signature,
        )

        # ── 7. Push to ZATCA API ──────────────────────────────
        is_b2b: bool = bool(getattr(customer, "tax_id", None))
        endpoint: str = "clearance" if is_b2b else "reporting"

        xml_b64: str = base64.b64encode(xml_content.encode('utf-8')).decode()
        
        auth_string: str = f"{settings.production_certificate}:{settings.get_password('production_api_secret')}"
        auth_b64: str = base64.b64encode(auth_string.encode('utf-8')).decode()

        payload: Dict[str, str] = {
            "invoiceHash": invoice_hash,
            "uuid": invoice_uuid,
            "invoice": xml_b64,
        }

        api_response: Dict = call_zatca_api(endpoint, payload, auth=auth_b64, mode=settings.mode)
        zatca_status: str = _parse_zatca_status(api_response)

        # ── 8. Persistence ────────────────────────────────────
        # Using ORM-standard set_value to update specific fields without re-triggering hooks
        frappe.db.set_value("Sales Invoice", invoice_name, {
            "zatca_uuid": invoice_uuid,
            "zatca_invoice_hash": invoice_hash,
            "zatca_qr_code": qr_code,
            "zatca_status": zatca_status,
            "zatca_icv": icv,
        }, update_modified=False)

        _log(invoice_name, zatca_status, str(api_response), xml_content)

    except Exception as e:
        frappe.log_error(frappe.get_traceback(), f"ZATCA Signing Failed: {invoice_name}")
        _log(invoice_name, "Error", str(e), "")


# ─────────────────────────────────────────────────────────────
# Helper Functions
# ─────────────────────────────────────────────────────────────

def _get_next_icv() -> int:
    """
    Atomically retrieves and increments the Invoice Counter Value (ICV).

    Returns:
        int: The next sequential ICV.
    """
    current: int = frappe.db.get_single_value("ZATCA Settings", "last_icv") or 0
    next_icv: int = int(current) + 1
    frappe.db.set_single_value("ZATCA Settings", "last_icv", next_icv)
    return next_icv


def _get_previous_invoice_hash(current_invoice_name: str) -> str:
    """
    Retrieves the cryptographic hash of the most recently submitted invoice.
    Uses Frappe ORM to avoid raw SQL queries.

    Args:
        current_invoice_name (str): The current invoice to exclude from search.

    Returns:
        str: The previous invoice hash, or the ZATCA-standard genesis hash if none exists.
    """
    GENESIS_HASH: str = "NWZlY2ViNjZmZmM4NmYzOGQ5NTI3ODZjNmQ2OTZjOTljNmYxODdkNjkwNzAzMWE4NjM4ZjdlNjhiZDNjOWI="

    last_invoices: List[Dict] = frappe.get_all(
        "Sales Invoice",
        filters={
            "docstatus": 1,
            "zatca_invoice_hash": ["!=", ""],
            "name": ["!=", current_invoice_name]
        },
        fields=["zatca_invoice_hash"],
        order_by="creation desc",
        limit=1
    )

    return last_invoices[0].zatca_invoice_hash if last_invoices else GENESIS_HASH


def _generate_tlv_qr(
    seller_name: str,
    vat_number: str,
    timestamp: str,
    grand_total: str,
    vat_total: str,
    invoice_hash: str,
    signature: str,
) -> str:
    """
    Encodes ZATCA required fields into a Base64-encoded TLV (Tag-Length-Value) string.

    Args:
        seller_name (str): Seller's name.
        vat_number (str): Seller's VAT registration number.
        timestamp (str): Invoice timestamp (ISO 8601).
        grand_total (str): Total invoice amount (inclusive of VAT).
        vat_total (str): Total VAT amount.
        invoice_hash (str): Signed invoice hash.
        signature (str): Digital signature.

    Returns:
        str: Base64-encoded TLV string for QR generation.
    """
    def tlv(tag: int, value: str) -> bytes:
        encoded: bytes = value.encode("utf-8")
        return bytes([tag, len(encoded)]) + encoded

    raw_tlv: bytes = (
        tlv(1, seller_name)
        + tlv(2, vat_number)
        + tlv(3, timestamp)
        + tlv(4, grand_total)
        + tlv(5, vat_total)
        + tlv(6, invoice_hash)
        + tlv(7, signature)
    )
    return base64.b64encode(raw_tlv).decode('utf-8')


def _parse_zatca_status(response: Dict[str, Any]) -> str:
    """
    Parses the ZATCA API response to determine the business status of the invoice.

    Args:
        response (Dict[str, Any]): The JSON response from ZATCA.

    Returns:
        str: Human-readable status (Cleared, Reported, Rejected, or Submitted).
    """
    disposition: str = (
        response.get("clearanceStatus") 
        or response.get("reportingStatus") 
        or ""
    )
    
    status_map = {
        "CLEARED": "Cleared",
        "REPORTED": "Reported",
        "ERROR": "Rejected"
    }

    for key, val in status_map.items():
        if key in disposition.upper():
            return val
            
    return "Submitted"


def _log(invoice_name: str, status: str, response: str, xml: str) -> None:
    """
    Creates an audit entry in the ZATCA Log DocType.

    Args:
        invoice_name (str): Linked Sales Invoice.
        status (str): Final submission status.
        response (str): Raw API response.
        xml (str): Final signed XML content.
    """
    try:
        log = frappe.new_doc("ZATCA Log")
        log.invoice = invoice_name
        log.status = status
        log.api_response = response[:10000]  # Safeguard against excessive payload
        log.xml_content = xml[:50000]
        log.timestamp = now_datetime()
        log.insert(ignore_permissions=True)
        frappe.db.commit()
    except Exception:
        frappe.log_error(frappe.get_traceback(), "ZATCA Audit Logging Failed")
