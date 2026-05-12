from typing import Tuple, Dict, Any, List, Optional
from decimal import Decimal, ROUND_HALF_UP
import frappe
from frappe.utils import now_datetime


def get_invoice_type(is_b2b: bool, is_credit_note: bool = False) -> Tuple[str, str]:
    """
    Determines the ZATCA InvoiceTypeCode and Subtype based on the invoice nature.

    Args:
        is_b2b (bool): True if the customer has a VAT ID.
        is_credit_note (bool, optional): True if this is a return/credit note. Defaults to False.

    Returns:
        Tuple[str, str]: A tuple containing (InvoiceTypeCode, InvoiceSubtype).
    """
    type_code: str = "381" if is_credit_note else "388"
    subtype: str = "0100000" if is_b2b else "0200000"
    return type_code, subtype


def generate_ubl_xml(
    invoice_doc: Any, 
    company_doc: Any, 
    customer_doc: Any, 
    icv: int, 
    pih: str, 
    uuid: str
) -> str:
    """
    Constructs a ZATCA-compliant UBL 2.1 XML document for reporting or clearance.
    Uses high-precision Decimal arithmetic for all financial calculations.

    Args:
        invoice_doc (frappe.Document): The Sales Invoice document.
        company_doc (frappe.Document): The Company document.
        customer_doc (frappe.Document): The Customer document.
        icv (int): Current Invoice Counter Value.
        pih (str): Previous Invoice Hash (Base64).
        uuid (str): Unique identifier (UUID4) for the invoice.

    Returns:
        str: The generated UBL 2.1 XML string.
    """
    is_b2b: bool = bool(getattr(customer_doc, "tax_id", None))
    is_credit_note: bool = bool(getattr(invoice_doc, "is_return", 0))
    type_code, subtype = get_invoice_type(is_b2b, is_credit_note)

    issue_date: str = str(invoice_doc.posting_date)
    issue_time: str = str(invoice_doc.posting_time or "00:00:00")
    invoice_id: str = str(invoice_doc.name)

    # ── Financial Math with Decimal ────────────────────────
    def to_decimal(val: Any) -> Decimal:
        return Decimal(str(val or 0)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    vat_rate: Decimal = Decimal('0.15')
    items_xml: str = ""
    
    for i, item in enumerate(invoice_doc.items, start=1):
        # Precise line-level calculations
        line_net: Decimal = to_decimal(item.amount)
        line_vat: Decimal = (line_net * vat_rate).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        line_gross: Decimal = line_net + line_vat
        
        items_xml += f"""
    <cac:InvoiceLine>
        <cbc:ID>{i}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="{item.uom or 'EA'}">{Decimal(str(item.qty)).quantize(Decimal('0.00'))}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="SAR">{line_net}</cbc:LineExtensionAmount>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="SAR">{line_vat}</cbc:TaxAmount>
            <cbc:RoundingAmount currencyID="SAR">{line_gross}</cbc:RoundingAmount>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Name>{frappe.utils.escape_html(item.item_name or item.description or "Item")}</cbc:Name>
            <cac:ClassifiedTaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>15</cbc:Percent>
                <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
            </cac:ClassifiedTaxCategory>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="SAR">{to_decimal(item.rate)}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>"""

    net_total: Decimal = to_decimal(invoice_doc.net_total)
    vat_total: Decimal = to_decimal(invoice_doc.total_taxes_and_charges)
    grand_total: Decimal = to_decimal(invoice_doc.grand_total)
    discount_total: Decimal = to_decimal(getattr(invoice_doc, "discount_amount", 0))

    xml: str = f"""<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2"
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2"
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2"
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2">
    <ext:UBLExtensions>
        <ext:UBLExtension>
            <ext:ExtensionURI>urn:oasis:names:specification:ubl:dsig:enveloped:xades</ext:ExtensionURI>
            <ext:ExtensionContent/>
        </ext:UBLExtension>
    </ext:UBLExtensions>
    <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
    <cbc:ID>{invoice_id}</cbc:ID>
    <cbc:UUID>{uuid}</cbc:UUID>
    <cbc:IssueDate>{issue_date}</cbc:IssueDate>
    <cbc:IssueTime>{issue_time}</cbc:IssueTime>
    <cbc:InvoiceTypeCode name="{subtype}">{type_code}</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
    <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>

    <cac:AdditionalDocumentReference>
        <cbc:ID>ICV</cbc:ID>
        <cbc:UUID>{icv}</cbc:UUID>
    </cac:AdditionalDocumentReference>
    <cac:AdditionalDocumentReference>
        <cbc:ID>PIH</cbc:ID>
        <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">{pih}</cbc:EmbeddedDocumentBinaryObject>
    </cac:AdditionalDocumentReference>

    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="CRN">{getattr(company_doc, 'registration_details', '1010000000')}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PostalAddress>
                <cbc:StreetName>{frappe.utils.escape_html(getattr(company_doc, 'company_address', ''))}</cbc:StreetName>
                <cbc:CityName>{frappe.utils.escape_html(getattr(company_doc, 'city', 'Riyadh'))}</cbc:CityName>
                <cbc:PostalZone>{getattr(company_doc, 'pin', '12211')}</cbc:PostalZone>
                <cac:Country><cbc:IdentificationCode>SA</cbc:IdentificationCode></cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>{company_doc.tax_id or ''}</cbc:CompanyID>
                <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>{frappe.utils.escape_html(company_doc.company_name)}</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>

    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>{getattr(customer_doc, 'tax_id', '') or ''}</cbc:CompanyID>
                <cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>{frappe.utils.escape_html(customer_doc.customer_name)}</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingCustomerParty>

    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="SAR">{vat_total}</cbc:TaxAmount>
    </cac:TaxTotal>

    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="SAR">{net_total}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="SAR">{(net_total - discount_total).quantize(Decimal('0.01'))}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="SAR">{grand_total}</cbc:TaxInclusiveAmount>
        <cbc:AllowanceTotalAmount currencyID="SAR">{discount_total}</cbc:AllowanceTotalAmount>
        <cbc:PayableAmount currencyID="SAR">{grand_total}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>
    {items_xml}
</Invoice>"""

    return xml
