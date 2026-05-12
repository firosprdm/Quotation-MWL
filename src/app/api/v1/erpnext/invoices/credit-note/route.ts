import { NextRequest, NextResponse } from 'next/server';
import { erpnextCreate, erpnextGet, erpnextGetDoc } from '@/lib/erpnext-client';

/**
 * POST /api/v1/erpnext/invoices/credit-note
 * Creates a ZATCA-compliant return Sales Invoice (Credit Note).
 *
 * Idempotency: Returns the existing credit note if one already exists for
 * the same original invoice, preventing double-issuance on network retries.
 */
export async function POST(req: NextRequest) {
  console.log('POST /api/v1/erpnext/invoices/credit-note called');
  try {
    const { invoiceId, reason } = await req.json();
    if (!invoiceId) {
      return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 });
    }

    // ── Idempotency: prevent two credit notes for the same invoice ──────────
    const existingCreditNotes = await erpnextGet(
      'Sales Invoice',
      [
        ['return_against', '=', invoiceId],
        ['is_return', '=', 1],
        ['docstatus', '!=', 2], // exclude cancelled
      ],
      ['name']
    );
    if (existingCreditNotes && existingCreditNotes.length > 0) {
      console.log(`Credit note already exists for ${invoiceId}:`, existingCreditNotes[0].name);
      return NextResponse.json({
        id: existingCreditNotes[0].name,
        invoiceNumber: existingCreditNotes[0].name,
        duplicate: true,
      });
    }

    // ── Fetch the original invoice to copy its details ──────────────────────
    const original = await erpnextGetDoc('Sales Invoice', invoiceId);
    console.log('Original invoice:', original.name, '| ZATCA status:', original.zatca_status);

    // ── Build the Credit Note payload ───────────────────────────────────────
    const creditNote: any = {
      naming_series: 'CRED-.YYYY.-.####',
      customer: original.customer,
      posting_date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      is_return: 1,
      is_credit_note: 1,
      return_against: invoiceId,
      terms: reason || 'Credit Note',
      remarks: `Credit Note for ${invoiceId}: ${reason || ''}`,
      mwl_status: 'draft',
      zatca_status: '',
      quotation_ref: original.quotation_ref || '',
      // Copy items with negative quantities (ZATCA requirement for returns)
      items: (original.items || []).map((it: any) => ({
        item_code: it.item_code,
        item_name: it.item_name,
        qty: -(Math.abs(it.qty || 1)),
        rate: it.rate || 0,
        uom: it.uom || 'Nos',
      })),
    };

    console.log('Creating Credit Note in ERPNext...');
    const created = await erpnextCreate('Sales Invoice', creditNote);
    console.log('Credit Note created:', created.name);

    return NextResponse.json({ id: created.name, invoiceNumber: created.name });
  } catch (error: any) {
    console.error('Credit Note POST Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
