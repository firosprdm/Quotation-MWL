import { NextRequest, NextResponse } from 'next/server';
import { erpnextGet, erpnextCreate, erpnextUpdate, erpnextDelete, erpnextSubmit, erpnextGetDoc } from '@/lib/erpnext-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ── Helpers ───────────────────────────────────────────────────────────────────
function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDate(ts?: number | null) {
  return ts ? new Date(ts).toISOString().split('T')[0] : null;
}

function mapToFrontend(inv: any) {
  const isCreditNote = inv.is_credit_note === 1 || inv.is_return === 1;
  return {
    id: inv.name,
    invoiceId: inv.name,
    invoiceNumber: inv.name, // ERPNext auto-generates MINV- serial
    clientId: inv.customer || '',
    date: inv.posting_date ? new Date(inv.posting_date).getTime() : Date.now(),
    dueDate: inv.due_date ? new Date(inv.due_date).getTime() : Date.now(),
    invoiceDate: inv.posting_date ? new Date(inv.posting_date).getTime() : Date.now(),
    subtotal: inv.net_total || 0,
    vatRate: 15,
    vatAmount: inv.total_taxes_and_charges || 0,
    total: inv.net_total || 0,
    grandTotal: inv.grand_total || 0,
    discount: inv.discount_amount || 0,
    notes: inv.terms || '',
    termsAndConditions: inv.tc_name || '',
    status: inv.docstatus === 1 ? 'approved' : 'sent',
    salesStatus: 'PO recieved',
    workStatus: 'Work Done',
    mwlStatus: inv.mwl_status || 'draft',
    isVerified: inv.mwl_status === 'confirmed' || inv.mwl_status === 'zatca_done',
    isEdited: inv.mwl_status === 'confirmed',
    poNumber: inv.po_no || '',
    ticketNumber: inv.po_date || '', // reuse field
    subject: inv.remarks || '',
    quotationRef: inv.quotation_ref || '',
    // ZATCA fields
    uuid: inv.zatca_uuid || '',
    icv: inv.icv || 0,
    pih: inv.pih || '',
    invoiceHash: inv.invoice_hash || '',
    qrCode: inv.qr_code || '',
    zatcaStatus: inv.zatca_status || '',
    // Credit note
    isCreditNote,
    creditNoteRef: inv.return_against || '',
    // Payment
    paymentStatus: inv.docstatus === 1 && inv.outstanding_amount <= 0 && inv.grand_total > 0 ? 'Done' : 'unpaid',
    receivedAmount: inv.docstatus === 1 ? ((inv.grand_total || 0) - (inv.outstanding_amount || 0)) : 0,
    // Flags
    docstatus: inv.docstatus,
    items: (inv.items || []).map((it: any) => ({
      id: it.name || generateId(),
      itemId: it.item_code || 'Custom Item',
      description: it.item_name || it.description || '',
      unit: it.uom || 'Nos',
      quantity: it.qty || 0,
      price: it.rate || 0,
      total: it.amount || 0,
      vatAmount: (it.amount || 0) * 0.15,
      totalWithVat: (it.amount || 0) * 1.15,
    })),
  };
}

// ── GET — list all invoices ──────────────────────────────────────────────────
export async function GET() {
  console.log('GET /api/erpnext/invoices called');
  try {
    const fields = [
      'name', 'customer', 'posting_date', 'due_date', 'net_total',
      'total_taxes_and_charges', 'grand_total', 'outstanding_amount',
      'docstatus', 'terms', 'remarks', 'po_no', 'discount_amount',
      'mwl_status', 'zatca_status', 'qr_code', 'invoice_hash',
      'zatca_uuid', 'icv', 'pih', 'quotation_ref', 'is_credit_note',
      'return_against', 'is_return'
    ];

    const invoices = await erpnextGet('Sales Invoice', [], fields, 1000);
    console.log(`Fetched ${invoices.length} invoices from ERPNext`);

    const result = invoices.map((inv: any) => mapToFrontend(inv));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Invoices GET Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── POST — create invoice ───────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  console.log('POST /api/erpnext/invoices called');
  try {
    const body = await req.json();
    console.log('Invoice data received:', JSON.stringify(body, null, 2));

    const erpnextInv: any = {
      naming_series: 'INV-.YYYY.-.####',
      customer: body.clientId,
      posting_date: formatDate(body.date) || formatDate(Date.now()),
      due_date: formatDate(body.dueDate) || formatDate(Date.now()),
      terms: body.notes || '',
      remarks: body.subject || '',
      po_no: body.poNumber || '',
      mwl_status: body.mwlStatus || 'draft',
      zatca_status: body.zatcaStatus || '',
      qr_code: body.qrCode || '',
      invoice_hash: body.invoiceHash || '',
      zatca_uuid: body.uuid || '',
      icv: body.icv || 0,
      pih: body.pih || '',
      quotation_ref: body.quotationRef || '',
      is_credit_note: 0,
      items: (body.items || []).map((item: any) => ({
        item_code: item.itemId && item.itemId !== 'manual' ? item.itemId : 'Custom Item',
        item_name: item.description || 'Item',
        qty: item.quantity || 1,
        rate: item.price || 0,
        uom: item.unit || 'Nos',
      })),
    };

    console.log('Creating Sales Invoice in ERPNext...');
    
    // ── Idempotency Check ────────────────────────────────────
    if (body.id) {
      const existing = await erpnextGet('Sales Invoice', [['idempotency_key', '=', body.id]], ['name']);
      if (existing && existing.length > 0) {
        console.log('Duplicate request detected. Returning existing record:', existing[0].name);
        return NextResponse.json({ id: existing[0].name, invoiceNumber: existing[0].name, duplicate: true });
      }
      erpnextInv.idempotency_key = body.id;
    }

    const created = await erpnextCreate('Sales Invoice', erpnextInv);
    console.log('Invoice created:', created.name);
    
    return NextResponse.json({ id: created.name, invoiceNumber: created.name });
  } catch (error: any) {
    console.error('Invoices POST Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── PUT — update invoice ─────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const { id, ...body } = await req.json();
    console.log(`PUT /api/erpnext/invoices called for ${id}`);

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // Block updates on ZATCA-cleared invoices
    try {
      const existing = await erpnextGetDoc('Sales Invoice', id);
      if (existing.zatca_status === 'cleared') {
        console.warn(`Blocked update on ZATCA-cleared invoice ${id}`);
        return NextResponse.json({ error: 'This invoice is ZATCA-cleared and cannot be modified.' }, { status: 403 });
      }
    } catch {}

    const updates: any = {};
    if (body.clientId !== undefined) updates.customer = body.clientId;
    if (body.date !== undefined) updates.posting_date = formatDate(body.date);
    if (body.dueDate !== undefined) updates.due_date = formatDate(body.dueDate);
    if (body.notes !== undefined) updates.terms = body.notes;
    if (body.subject !== undefined) updates.remarks = body.subject;
    if (body.poNumber !== undefined) updates.po_no = body.poNumber;
    if (body.mwlStatus !== undefined) updates.mwl_status = body.mwlStatus;
    if (body.zatcaStatus !== undefined) updates.zatca_status = body.zatcaStatus;
    if (body.qrCode !== undefined) updates.qr_code = body.qrCode;
    if (body.invoiceHash !== undefined) updates.invoice_hash = body.invoiceHash;
    if (body.uuid !== undefined) updates.zatca_uuid = body.uuid;
    if (body.icv !== undefined) updates.icv = body.icv;
    if (body.pih !== undefined) updates.pih = body.pih;
    if (body.quotationRef !== undefined) updates.quotation_ref = body.quotationRef;

    if (body.items) {
      updates.items = body.items.map((item: any) => ({
        item_code: item.itemId && item.itemId !== 'manual' ? item.itemId : 'Custom Item',
        item_name: item.description || 'Item',
        qty: item.quantity || 1,
        rate: item.price || 0,
        uom: item.unit || 'Nos',
      }));
    }

    if (Object.keys(updates).length > 0) {
      await erpnextUpdate('Sales Invoice', id, updates);
      console.log(`Invoice ${id} updated successfully`);
    }

    // Submit invoice if moving to 'confirmed'
    if (body.mwlStatus === 'confirmed' || body.submit) {
      await erpnextSubmit('Sales Invoice', id).catch(err => {
        console.warn('Invoice submission warning:', err.message);
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Invoices PUT Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── DELETE — cancel invoice ───────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    console.log(`DELETE /api/erpnext/invoices called for ${id}`);
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // Block delete on ZATCA-cleared
    try {
      const existing = await erpnextGetDoc('Sales Invoice', id);
      if (existing.zatca_status === 'cleared') {
        return NextResponse.json({ error: 'Cannot delete a ZATCA-cleared invoice. Issue a Credit Note instead.' }, { status: 403 });
      }
    } catch {}

    await erpnextDelete('Sales Invoice', id).catch(() => {});
    console.log(`Invoice ${id} deleted`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Invoices DELETE Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
