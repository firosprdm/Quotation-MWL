import { NextResponse } from 'next/server';
import { EGS, EGSUnitInfo, ZATCAInvoice, ZATCAInvoiceProps, ZATCAInvoiceTypes, ZATCAPaymentMethods, ZATCAInvoiceLineItem } from 'zatca-xml-ts';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { quotation, client, settings, pih, icv } = await req.json();

    if (!settings.zatca || !settings.zatca.privateKey || !settings.zatca.productionCertificate) {
      return NextResponse.json({ success: false, error: 'ZATCA Onboarding not complete. Missing Private Key or Certificate in settings.' }, { status: 400 });
    }

    // Mock Bypass Check
    if (settings.zatca.privateKey === 'mock-private-key') {
      const getTLV = (tag: number, value: string) => {
        const valBuf = Buffer.from(String(value));
        return Buffer.concat([Buffer.from([tag]), Buffer.from([valBuf.length]), valBuf]);
      };
      
      const tlvBuf = Buffer.concat([
        getTLV(1, settings.name || "Test Company"),
        getTLV(2, settings.vatNumber || "300000000000003"),
        getTLV(3, new Date(quotation.invoiceDate || quotation.date).toISOString()),
        getTLV(4, String(quotation.grandTotal.toFixed(2))),
        getTLV(5, String(quotation.vatAmount.toFixed(2))),
        getTLV(6, "mock-invoice-hash"),
        getTLV(7, "mock-digital-signature"),
        getTLV(8, "mock-public-key"),
        getTLV(9, "mock-certificate-signature")
      ]);

      return NextResponse.json({
        success: true,
        data: {
          invoiceHash: 'mock-hash-1234567890',
          qrCode: tlvBuf.toString('base64'),
          clearedAt: new Date().toISOString()
        }
      });
    }

    // Reconstruct EGSUnitInfo from settings
    const egsInfo: EGSUnitInfo = {
      uuid: crypto.randomUUID(), // Unit UUID doesn't strictly matter for signing, but required by type
      custom_id: `EGS-${settings.vatNumber}`,
      model: 'AntigravityERP',
      CRN_number: settings.crNumber || '1010000000',
      VAT_name: settings.name,
      VAT_number: settings.vatNumber,
      branch_name: 'Main Branch',
      branch_industry: 'Construction',
      private_key: settings.zatca.privateKey,
      production_certificate: settings.zatca.productionCertificate,
      production_api_secret: settings.zatca.productionApiSecret,
    };

    const isStandard = !!client.vatNumber;
    
    // Map Quotation Items to ZATCAInvoiceLineItem
    const line_items: ZATCAInvoiceLineItem[] = quotation.items
      .filter((it: any) => !it._isWorkflowMetadata)
      .map((item: any, index: number) => {
        const price = item.unitPrice !== undefined ? item.unitPrice : (item.price || 0);
        return {
          id: (index + 1).toString(),
          name: item.description,
          quantity: item.quantity,
          tax_exclusive_price: price,
          VAT_percent: 0.15,
        };
      });

    // Handle Invoice Serial Number
    const invoiceYear = new Date(quotation.invoiceDate || quotation.date).getFullYear();
    const rawNum = String(quotation.invoiceNumber || quotation.number || '0').replace(/[^0-9]/g, '');
    const formattedNum = rawNum.slice(-4).padStart(4, '0');
    const invoice_serial_number = `INV-${invoiceYear}-${formattedNum}`;

    // Date and Time
    const issue_date = new Date(quotation.invoiceDate || quotation.date).toISOString().split('T')[0];
    const issue_time = new Date(quotation.invoiceDate || quotation.date).toISOString().split('T')[1].split('.')[0];

    const invoiceProps: ZATCAInvoiceProps = {
      egs_info: egsInfo,
      invoice_counter_number: icv,
      invoice_serial_number,
      issue_date,
      issue_time,
      previous_invoice_hash: pih || 'NWZob3Jh', // Base64 placeholder if no previous hash
      line_items,
      invoice_type: ZATCAInvoiceTypes.INVOICE,
      invoice_code: isStandard ? "0100000" : "0200000",
    };

    // Create Invoice
    const invoice = new ZATCAInvoice({ props: invoiceProps, acceptWarning: true });
    
    // Sign Invoice
    const { signed_invoice_string, invoice_hash, qr } = invoice.sign(
      settings.zatca.productionCertificate,
      settings.zatca.privateKey
    );

    // Initialize EGS to call APIs
    const egs = new EGS(egsInfo, "development");
    
    let clearanceResult;
    if (isStandard) {
      // B2B Standard Invoice needs Clearance
      console.log('Sending Clearance request to ZATCA...');
      clearanceResult = await egs.clearanceInvoice(signed_invoice_string, invoice_hash);
    } else {
      // B2C Simplified Invoice needs Reporting
      console.log('Sending Reporting request to ZATCA...');
      clearanceResult = await egs.reportInvoice(signed_invoice_string, invoice_hash);
    }

    return NextResponse.json({
      success: true,
      data: {
        clearedInvoice: clearanceResult?.clearedInvoice || signed_invoice_string,
        invoiceHash: invoice_hash,
        qrCode: qr,
        zatcaResponse: clearanceResult,
      }
    });

  } catch (error: any) {
    console.error("ZATCA Clearance Error:", error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'Failed to clear invoice with ZATCA',
      details: error?.response?.data || String(error)
    }, { status: 500 });
  }
}
