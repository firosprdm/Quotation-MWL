from typing import Dict, List, Tuple, Optional
from decimal import Decimal
import frappe
import base64
from frappe.model.document import Document
from frappe.utils import now_datetime
from zatca.utils.zatca import generate_zatca_csr, call_zatca_api

class ZATCASettings(Document):
    """
    Controller for ZATCA Settings DocType.
    Handles CSR generation and onboarding handshake with ZATCA Fatoora portal.
    """

    @frappe.whitelist()
    def generate_keys_and_csr(self) -> str:
        """
        Generates the private key and CSR based on Company info.
        Idempotency: Blocks generation if already onboarded.
        """
        if self.status == "Onboarded":
            frappe.throw(frappe._("Unit is already onboarded. To re-generate, reset status to Pending first."))

        if not self.company:
            frappe.throw(frappe._("Please select a Company first."))
            
        company = frappe.get_doc("Company", self.company)
        
        # Mapping Company fields to ZATCA CSR requirements
        config: Dict[str, str] = {
            "common_name": company.company_name,
            "organization_unit": company.registration_details or "1010000000",
            "organization_name": company.company_name,
            "country": "SA",
            "invoice_type": "1100", # Default to Standard & Simplified
            "registered_address": company.registration_address or "Saudi Arabia",
            "business_category": "Construction"
        }
        
        private_key, csr = generate_zatca_csr(config)
        
        self.private_key = private_key
        self.csr = csr
        self.status = "Pending"
        self.save()
        
        return frappe._("Keys and CSR generated successfully.")

    @frappe.whitelist()
    def onboard_with_zatca(self) -> str:
        """
        Initiates the onboarding process with ZATCA.
        Step 1: Get Compliance Certificate using CSR and OTP.
        Idempotency: Blocks process if already onboarded.
        """
        if self.status == "Onboarded":
            return frappe._("Unit is already onboarded.")

        if not self.csr or not self.otp:
            frappe.throw(frappe._("CSR and OTP are required for onboarding."))
            
        payload: Dict[str, str] = {
            "csr": base64.b64encode(self.csr.encode()).decode()
        }
        
        # Call Compliance API
        response: Dict = call_zatca_api("compliance", payload, auth=self.otp, mode=self.mode)
        
        if response.get("dispositionMessage") == "ISSUED":
            self.compliance_certificate = response.get("binarySecurityToken")
            self.production_api_secret = response.get("secret")
            self.status = "Compliance Passed"
            self.save()
            
            # Step 2: Automatically request Production CSID if in Developer/Simulation
            self.request_production_certificate()
            
            return frappe._("Onboarding successful. Certificates updated.")
        else:
            errors: List[Dict] = response.get("validationResults", {}).get("errorMessages", [])
            error_msg: str = ", ".join([e.get('message', 'Unknown Error') for e in errors])
            frappe.throw(frappe._("ZATCA Onboarding Failed: {0}").format(error_msg))

    def request_production_certificate(self) -> None:
        """
        Exchanges the Compliance Token for a Production Token (CSID).
        This is Step 2 of the ZATCA onboarding journey.
        """
        if not self.compliance_certificate or not self.production_api_secret:
            return
            
        # Basic Auth for Production Request
        auth_string: str = f"{self.compliance_certificate}:{self.production_api_secret}"
        auth_base64: str = base64.b64encode(auth_string.encode()).decode()
        
        payload: Dict[str, str] = {
            "compliance_request_id": str(now_datetime().timestamp()) 
        }
        
        try:
            response: Dict = call_zatca_api("production", payload, auth=auth_base64, mode=self.mode)
            if response.get("dispositionMessage") == "ISSUED":
                self.production_certificate = response.get("binarySecurityToken")
                self.production_api_secret = response.get("secret") 
                self.status = "Onboarded"
                self.save()
        except Exception as e:
            frappe.msgprint(
                frappe._("Production certificate request failed: {0}. You may need to retry manually.").format(str(e))
            )
