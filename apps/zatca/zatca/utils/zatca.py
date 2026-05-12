from typing import Dict, Tuple, Optional, Any
import hashlib
import base64
import json
import requests
import uuid
import frappe
from cryptography import x509
from cryptography.x509.oid import NameOID
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import ec
from lxml import etree

class ZatcaSigner:
    """
    Handles cryptographic operations for ZATCA Phase 2.
    Includes invoice hashing and ECDSA digital signing.
    """
    
    def __init__(self, private_key_pem: str, certificate_pem: Optional[str] = None):
        """
        Initializes the signer with a private key.

        Args:
            private_key_pem (str): The ECDSA private key in PEM format.
            certificate_pem (str, optional): The public certificate in PEM format.
        """
        self.private_key = serialization.load_pem_private_key(
            private_key_pem.encode(), password=None
        )
        self.certificate = certificate_pem

    def generate_invoice_hash(self, xml_content: bytes) -> str:
        """
        Generates a SHA-256 hash of the canonicalized XML.
        Note: The hash must be generated from the XML *without* the UBLExtensions.

        Args:
            xml_content (bytes): The raw XML content of the invoice.

        Returns:
            str: Base64-encoded SHA-256 hash.
        """
        parser = etree.XMLParser(remove_blank_text=True)
        root = etree.fromstring(xml_content, parser)
        
        namespaces: Dict[str, str] = {
            'ext': 'urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2'
        }
        extensions = root.xpath('//ext:UBLExtensions', namespaces=namespaces)
        for ext in extensions:
            ext.getparent().remove(ext)

        canonical_xml: bytes = etree.tostring(root, method="c14n", exclusive=False)
        digest: bytes = hashlib.sha256(canonical_xml).digest()
        return base64.b64encode(digest).decode('utf-8')

    def sign_hash(self, invoice_hash: str) -> str:
        """
        Signs the invoice hash using the ECDSA private key.

        Args:
            invoice_hash (str): The Base64-encoded invoice hash.

        Returns:
            str: Base64-encoded digital signature.
        """
        signature: bytes = self.private_key.sign(
            invoice_hash.encode('utf-8'),
            ec.ECDSA(hashes.SHA256())
        )
        return base64.b64encode(signature).decode('utf-8')

def generate_zatca_csr(config: Dict[str, str]) -> Tuple[str, str]:
    """
    Generates a private key and a ZATCA-compliant Certificate Signing Request (CSR).

    Args:
        config (Dict[str, str]): Dictionary containing common_name, organization_unit, etc.

    Returns:
        Tuple[str, str]: (private_key_pem, csr_pem).
    """
    private_key = ec.generate_private_key(ec.SECP256R1())
    
    subject = x509.Name([
        x509.NameAttribute(NameOID.COMMON_NAME, config['common_name']),
        x509.NameAttribute(NameOID.ORGANIZATIONAL_UNIT_NAME, config['organization_unit']),
        x509.NameAttribute(NameOID.ORGANIZATION_NAME, config['organization_name']),
        x509.NameAttribute(NameOID.COUNTRY_NAME, config['country']),
        x509.NameAttribute(NameOID.TITLE, config['invoice_type']),
        x509.NameAttribute(NameOID.STREET_ADDRESS, config['registered_address']),
        x509.NameAttribute(NameOID.BUSINESS_CATEGORY, config['business_category']),
    ])

    csr_builder = x509.CertificateSigningRequestBuilder().subject_name(subject)
    
    # ZATCA Extension: Certificate Template Name (required by Fatoora)
    csr_builder = csr_builder.add_extension(
        x509.UnrecognizedExtension(
            x509.ObjectIdentifier("1.3.6.1.4.1.311.20.2"), 
            b"\x1e\x12\x00Z\x00A\x00T\x00C\x00A\x00-\x00C\x00o\x00d\x00e\x00-\x00S\x00i\x00g\x00n\x00i\x00n\x00g"
        ),
        critical=False
    )

    csr = csr_builder.sign(private_key, hashes.SHA256())

    private_key_pem: str = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.TraditionalOpenSSL,
        encryption_algorithm=serialization.NoEncryption()
    ).decode('utf-8')

    csr_pem: str = csr.public_bytes(serialization.Encoding.PEM).decode('utf-8')
    return private_key_pem, csr_pem

def call_zatca_api(
    endpoint_type: str, 
    payload: Dict[str, Any], 
    auth: Optional[str] = None, 
    mode: str = "Developer"
) -> Dict[str, Any]:
    """
    Universal helper to interact with ZATCA's REST APIs.

    Args:
        endpoint_type (str): Type of request (compliance, production, clearance, reporting).
        payload (Dict[str, Any]): JSON payload to send.
        auth (str, optional): OTP or Basic Auth token.
        mode (str): Execution environment (Developer, Simulation, Production).

    Returns:
        Dict[str, Any]: The parsed JSON response from ZATCA.

    Raises:
        frappe.ValidationError: If the API call fails or returns an error status.
    """
    base_urls: Dict[str, str] = {
        "Developer": "https://gw-fatoora.zatca.gov.sa/api/sandbox",
        "Simulation": "https://gw-fatoora.zatca.gov.sa/api/simulation",
        "Production": "https://gw-fatoora.zatca.gov.sa/api/production"
    }
    
    url_map: Dict[str, str] = {
        "compliance": "/compliance",
        "production": "/production/csid",
        "clearance": "/invoices/clearance/single",
        "reporting": "/invoices/reporting/single"
    }
    
    base_url: str = base_urls.get(mode, base_urls["Developer"])
    url: str = base_url + url_map.get(endpoint_type, "")
    
    headers: Dict[str, str] = {
        "Content-Type": "application/json",
        "Accept-Version": "V2"
    }
    
    if auth:
        if endpoint_type == "compliance":
            headers["OTP"] = auth
        else:
            headers["Authorization"] = f"Basic {auth}"
            
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        frappe.log_error(f"ZATCA API Error ({endpoint_type}): {str(e)}", "ZATCA Integration")
        frappe.throw(frappe._("ZATCA API Error: {0}").format(str(e)))
