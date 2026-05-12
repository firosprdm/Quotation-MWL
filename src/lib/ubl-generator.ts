import { Quotation, Client, CompanySettings } from '../types';

/**
 * Generates a ZATCA-compliant UBL 2.1 XML string for an invoice.
 * Note: This is a simplified template. In a production environment, 
 * use a robust XML builder and validate against ZATCA Schematrons.
 */
export function generateUBL21XML(params: {
  quotation: Quotation;
  client: Client;
  settings: CompanySettings;
  pih: string;
  icv: number;
  uuid: string;
  signature?: string;
  certificate?: string;
}): string {
  const { quotation, client, settings, pih, icv, uuid, signature, certificate } = params;
  const issueDate = new Date(quotation.invoiceDate || quotation.date).toISOString().split('T')[0];
  const issueTime = new Date(quotation.invoiceDate || quotation.date).toISOString().split('T')[1].split('.')[0];

  // Mapping invoice type (Simplified vs Standard)
  const isStandard = !!client.vatNumber;
  const invoiceType = isStandard ? '388' : '388';
  const invoiceSubtype = isStandard ? '0100000' : '0200000';

  const invoiceYear = new Date(quotation.invoiceDate || quotation.date).getFullYear();
  const rawNum = String(quotation.number || '0').replace(/[^0-9]/g, '');
  const formattedNum = rawNum.slice(-4).padStart(4, '0');
  const invoiceID = `INV-${invoiceYear}-${formattedNum}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" 
         xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" 
         xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2" 
         xmlns:ext="urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2"
         xmlns:sig="urn:oasis:names:specification:ubl:schema:xsd:CommonSignatureComponents-2"
         xmlns:sac="urn:oasis:names:specification:ubl:schema:xsd:SignatureAggregateComponents-2"
         xmlns:sbc="urn:oasis:names:specification:ubl:schema:xsd:SignatureBasicComponents-2"
         xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
    ${signature ? `
    <ext:UBLExtensions>
        <ext:UBLExtension>
            <ext:ExtensionURI>urn:oasis:names:specification:ubl:dsig:enveloped:xades</ext:ExtensionURI>
            <ext:ExtensionContent>
                <sig:UBLDocumentSignatures>
                    <sac:SignatureInformation>
                        <cbc:ID>urn:oasis:names:specification:ubl:signature:1</cbc:ID>
                        <sbc:ReferencedSignatureID>urn:oasis:names:specification:ubl:signature:Invoice</sbc:ReferencedSignatureID>
                        <ds:Signature Id="signature">
                            <ds:SignedInfo>
                                <ds:CanonicalizationMethod Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
                                <ds:SignatureMethod Algorithm="http://www.w3.org/2001/04/xmldsig-more#ecdsa-sha256"/>
                                <ds:Reference Id="invoiceReference" URI="">
                                    <ds:Transforms>
                                        <ds:Transform Algorithm="http://www.w3.org/TR/1999/REC-xpath-19991116">
                                            <ds:XPath>not(//ancillary:Signature)</ds:XPath>
                                        </ds:Transform>
                                        <ds:Transform Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"/>
                                    </ds:Transforms>
                                    <ds:DigestMethod Algorithm="http://www.w3.org/2001/04/xmlenc#sha256"/>
                                    <ds:DigestValue>HASH_PLACEHOLDER</ds:DigestValue>
                                </ds:Reference>
                            </ds:SignedInfo>
                            <ds:SignatureValue>${signature}</ds:SignatureValue>
                            <ds:KeyInfo>
                                <ds:X509Data>
                                    <ds:X509Certificate>${certificate}</ds:X509Certificate>
                                </ds:X509Data>
                            </ds:KeyInfo>
                        </ds:Signature>
                    </sac:SignatureInformation>
                </sig:UBLDocumentSignatures>
            </ext:ExtensionContent>
        </ext:UBLExtension>
    </ext:UBLExtensions>` : ''}
    <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
    <cbc:ID>${invoiceID}</cbc:ID>
    <cbc:UUID>${uuid}</cbc:UUID>
    <cbc:IssueDate>${issueDate}</cbc:IssueDate>
    <cbc:IssueTime>${issueTime}</cbc:IssueTime>
    <cbc:InvoiceTypeCode name="${invoiceSubtype}">${invoiceType}</cbc:InvoiceTypeCode>
    <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
    <cbc:TaxCurrencyCode>SAR</cbc:TaxCurrencyCode>
    
    <cac:AdditionalDocumentReference>
        <cbc:ID>ICV</cbc:ID>
        <cbc:UUID>${icv}</cbc:UUID>
    </cac:AdditionalDocumentReference>
    <cac:AdditionalDocumentReference>
        <cbc:ID>PIH</cbc:ID>
        <cbc:EmbeddedDocumentBinaryObject mimeCode="text/plain">${pih}</cbc:EmbeddedDocumentBinaryObject>
    </cac:AdditionalDocumentReference>

    <cac:AccountingSupplierParty>
        <cac:Party>
            <cac:PartyIdentification>
                <cbc:ID schemeID="CRN">${settings.crNumber || '1010000000'}</cbc:ID>
            </cac:PartyIdentification>
            <cac:PostalAddress>
                <cbc:StreetName>${settings.splitAddress?.streetName || ''}</cbc:StreetName>
                <cbc:BuildingNumber>${settings.splitAddress?.buildingNumber || ''}</cbc:BuildingNumber>
                <cbc:CitySubdivisionName>${settings.splitAddress?.district || ''}</cbc:CitySubdivisionName>
                <cbc:CityName>${settings.splitAddress?.city || ''}</cbc:CityName>
                <cbc:PostalZone>${settings.splitAddress?.postalCode || ''}</cbc:PostalZone>
                <cac:Country>
                    <cbc:IdentificationCode>SA</cbc:IdentificationCode>
                </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>${settings.vatNumber}</cbc:CompanyID>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>${settings.name}</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingSupplierParty>

    <cac:AccountingCustomerParty>
        <cac:Party>
            <cac:PostalAddress>
                <cbc:StreetName>${client.splitAddress?.streetName || ''}</cbc:StreetName>
                <cbc:BuildingNumber>${client.splitAddress?.buildingNumber || ''}</cbc:BuildingNumber>
                <cbc:CitySubdivisionName>${client.splitAddress?.district || ''}</cbc:CitySubdivisionName>
                <cbc:CityName>${client.splitAddress?.city || ''}</cbc:CityName>
                <cbc:PostalZone>${client.splitAddress?.postalCode || ''}</cbc:PostalZone>
                <cac:Country>
                    <cbc:IdentificationCode>SA</cbc:IdentificationCode>
                </cac:Country>
            </cac:PostalAddress>
            <cac:PartyTaxScheme>
                <cbc:CompanyID>${client.vatNumber || ''}</cbc:CompanyID>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:PartyTaxScheme>
            <cac:PartyLegalEntity>
                <cbc:RegistrationName>${client.name}</cbc:RegistrationName>
            </cac:PartyLegalEntity>
        </cac:Party>
    </cac:AccountingCustomerParty>

    <cac:AllowanceCharge>
        <cbc:ChargeIndicator>false</cbc:ChargeIndicator>
        <cbc:AllowanceChargeReason>Discount</cbc:AllowanceChargeReason>
        <cbc:Amount currencyID="SAR">${quotation.discount.toFixed(2)}</cbc:Amount>
        <cac:TaxCategory>
            <cbc:ID>S</cbc:ID>
            <cbc:Percent>15</cbc:Percent>
            <cac:TaxScheme>
                <cbc:ID>VAT</cbc:ID>
            </cac:TaxScheme>
        </cac:TaxCategory>
    </cac:AllowanceCharge>

    <cac:TaxTotal>
        <cbc:TaxAmount currencyID="SAR">${quotation.vatAmount.toFixed(2)}</cbc:TaxAmount>
    </cac:TaxTotal>

    <cac:LegalMonetaryTotal>
        <cbc:LineExtensionAmount currencyID="SAR">${quotation.subtotal.toFixed(2)}</cbc:LineExtensionAmount>
        <cbc:TaxExclusiveAmount currencyID="SAR">${(quotation.subtotal - quotation.discount).toFixed(2)}</cbc:TaxExclusiveAmount>
        <cbc:TaxInclusiveAmount currencyID="SAR">${quotation.grandTotal.toFixed(2)}</cbc:TaxInclusiveAmount>
        <cbc:AllowanceTotalAmount currencyID="SAR">${quotation.discount.toFixed(2)}</cbc:AllowanceTotalAmount>
        <cbc:PayableAmount currencyID="SAR">${quotation.grandTotal.toFixed(2)}</cbc:PayableAmount>
    </cac:LegalMonetaryTotal>

    ${quotation.items.map((item: any, index: number) => {
        const price = item.unitPrice !== undefined ? item.unitPrice : (item.price || 0);
        const total = item.total !== undefined ? item.total : (item.quantity * price);
        const vatAmount = item.vatAmount !== undefined ? item.vatAmount : (total * 0.15);
        const totalWithVat = item.totalWithVat !== undefined ? item.totalWithVat : (total + vatAmount);
        
        return `
    <cac:InvoiceLine>
        <cbc:ID>${index + 1}</cbc:ID>
        <cbc:InvoicedQuantity unitCode="EA">${item.quantity}</cbc:InvoicedQuantity>
        <cbc:LineExtensionAmount currencyID="SAR">${total.toFixed(2)}</cbc:LineExtensionAmount>
        <cac:TaxTotal>
            <cbc:TaxAmount currencyID="SAR">${vatAmount.toFixed(2)}</cbc:TaxAmount>
            <cbc:RoundingAmount currencyID="SAR">${totalWithVat.toFixed(2)}</cbc:RoundingAmount>
        </cac:TaxTotal>
        <cac:Item>
            <cbc:Name>${item.description}</cbc:Name>
            <cac:ClassifiedTaxCategory>
                <cbc:ID>S</cbc:ID>
                <cbc:Percent>15</cbc:Percent>
                <cac:TaxScheme>
                    <cbc:ID>VAT</cbc:ID>
                </cac:TaxScheme>
            </cac:ClassifiedTaxCategory>
        </cac:Item>
        <cac:Price>
            <cbc:PriceAmount currencyID="SAR">${price.toFixed(2)}</cbc:PriceAmount>
        </cac:Price>
    </cac:InvoiceLine>
    `;
    }).join('')}
</Invoice>`;
}
