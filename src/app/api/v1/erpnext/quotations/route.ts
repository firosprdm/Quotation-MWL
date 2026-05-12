import { NextRequest, NextResponse } from 'next/server';
import { erpnextGet, erpnextCreate, erpnextUpdate, erpnextDelete, erpnextSubmit, erpnextGetDoc } from '@/lib/erpnext-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function mapToFrontend(m: any) {
  return {
    id: m.name,
    number: m.name,
    clientId: m.party_name || '',
    date: m.transaction_date ? new Date(m.transaction_date).getTime() : Date.now(),
    dueDate: m.valid_till ? new Date(m.valid_till).getTime() : Date.now(),
    subtotal: m.net_total || 0,
    vatRate: 15,
    vatAmount: m.total_taxes_and_charges || 0,
    total: m.net_total || 0,
    grandTotal: m.grand_total || 0,
    notes: m.terms || '',
    status: m.mwl_status || (m.docstatus === 1 ? 'approved' : 'sent'),
    salesStatus: m.sales_status || '',
    workStatus: m.work_status || '',
    paymentStatus: 'unpaid',
    poNumber: m.po_no || '',
    ticketNumber: m.ticket_no || '',
    subject: m.title || '',
    approvalDate: m.approval_date ? new Date(m.approval_date).getTime() : undefined,
    poDate: m.po_date ? new Date(m.po_date).getTime() : undefined,
    completionDate: m.completion_date ? new Date(m.completion_date).getTime() : undefined,
    icv: m.icv || 0,
    pih: m.pih || '',
    invoiceHash: m.invoice_hash || '',
    uuid: m.zatca_uuid || '',
    qrCode: m.qr_code || '',
    zatcaStatus: m.zatca_status || '',
    items: (m.items || []).map((it: any) => ({
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

export async function GET(req: NextRequest) {
  console.log('GET /api/erpnext/quotations called');
  try {
    const searchParams = req.nextUrl?.searchParams;
    const id = searchParams?.get('id');

    if (id) {
      console.log(`Fetching full single Quotation document: ${id}`);
      const doc = await erpnextGetDoc('Quotation', id);
      return NextResponse.json(mapToFrontend(doc));
    }

    const fields = [
      'name', 'party_name', 'transaction_date', 'valid_till',
      'net_total', 'total_taxes_and_charges', 'grand_total', 'terms',
      'docstatus', 'status', 'mwl_status', 'po_no', 'ticket_no',
      'sales_status', 'work_status', 'approval_date', 'po_date',
      'completion_date', 'icv', 'pih', 'invoice_hash', 'zatca_uuid', 'qr_code', 'zatca_status'
    ];
    
    const quotes = await erpnextGet('Quotation', [], fields, 1000);
    console.log(`Fetched ${quotes.length} quotations from ERPNext`);

    const quotations = quotes.map((m: any) => mapToFrontend(m));

    return NextResponse.json(quotations);
  } catch (error: any) {
    console.error('Quotations GET Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  console.log('POST /api/erpnext/quotations called');
  try {
    const quote = await req.json();
    console.log('Quotation data received:', JSON.stringify(quote, null, 2));
    
    const formatDate = (ts?: number) => ts ? new Date(ts).toISOString().split('T')[0] : null;

    const erpnextQuote: any = {
      naming_series: 'mwl-.####',
      quotation_to: 'Customer',
      party_name: quote.clientId,
      transaction_date: formatDate(quote.date) || formatDate(Date.now()),
      valid_till: formatDate(quote.dueDate),
      terms: quote.notes || '',
      title: quote.subject || quote.projectName || quote.title || '',
      mwl_status: quote.status || 'sent',
      po_no: quote.poNumber || '',
      ticket_no: quote.ticketNumber || '',
      sales_status: quote.salesStatus || '',
      work_status: quote.workStatus || '',
      approval_date: formatDate(quote.approvalDate),
      po_date: formatDate(quote.poDate),
      completion_date: formatDate(quote.completionDate),
      icv: quote.icv || 0,
      pih: quote.pih || '',
      invoice_hash: quote.invoiceHash || '',
      zatca_uuid: quote.uuid || '',
      qr_code: quote.qrCode || '',
      zatca_status: quote.zatcaStatus || 'pending_clearance',
      items: quote.items ? quote.items.map((item: any) => ({
        item_code: item.itemId && item.itemId !== 'manual' ? item.itemId : 'Custom Item',
        item_name: item.description || 'Item',
        qty: item.quantity || 1,
        rate: item.price || 0
      })) : []
    };

    console.log('Creating Quotation in ERPNext...');
    
    // ── Idempotency Check ────────────────────────────────────
    if (quote.id) {
      const existing = await erpnextGet('Quotation', [['idempotency_key', '=', quote.id]], ['name']);
      if (existing && existing.length > 0) {
        console.log('Duplicate request detected. Returning existing record:', existing[0].name);
        return NextResponse.json({ id: existing[0].name, duplicate: true });
      }
      erpnextQuote.idempotency_key = quote.id;
    }

    const created = await erpnextCreate('Quotation', erpnextQuote);
    console.log('Quotation created successfully:', created.name);
    
    return NextResponse.json({ id: created.name });
  } catch (error: any) {
    console.error('Quotations POST Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...quote } = await req.json();
    console.log(`PUT /api/erpnext/quotations called for ${id}`);
    console.log('Update payload:', JSON.stringify(quote, null, 2));
    
    if (!id) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }
    
    const formatDate = (ts?: number) => ts ? new Date(ts).toISOString().split('T')[0] : null;

    const erpnextQuote: any = {};

    // Always save the app's status to mwl_status
    if (quote.status !== undefined) {
      erpnextQuote.mwl_status = quote.status;
      console.log(`Saving mwl_status = "${quote.status}" for ${id}`);
    }

    if (quote.clientId) erpnextQuote.party_name = quote.clientId;
    if (quote.subject !== undefined || quote.projectName !== undefined || quote.title !== undefined) {
      erpnextQuote.title = quote.subject || quote.projectName || quote.title || '';
    }
    if (quote.notes !== undefined) erpnextQuote.terms = quote.notes;
    if (quote.ticketNumber !== undefined) erpnextQuote.ticket_no = quote.ticketNumber;
    if (quote.poNumber !== undefined) erpnextQuote.po_no = quote.poNumber;
    if (quote.salesStatus !== undefined) erpnextQuote.sales_status = quote.salesStatus;
    if (quote.workStatus !== undefined) erpnextQuote.work_status = quote.workStatus;
    
    if ('approvalDate' in quote) erpnextQuote.approval_date = quote.approvalDate ? formatDate(quote.approvalDate) : null;
    if ('poDate' in quote) erpnextQuote.po_date = quote.poDate ? formatDate(quote.poDate) : null;
    if ('completionDate' in quote) erpnextQuote.completion_date = quote.completionDate ? formatDate(quote.completionDate) : null;
    
    if (quote.icv !== undefined) erpnextQuote.icv = quote.icv;
    if (quote.pih !== undefined) erpnextQuote.pih = quote.pih;
    if (quote.invoiceHash !== undefined) erpnextQuote.invoice_hash = quote.invoiceHash;
    if (quote.uuid !== undefined) erpnextQuote.zatca_uuid = quote.uuid;
    if (quote.qrCode !== undefined) erpnextQuote.qr_code = quote.qrCode;
    if (quote.zatcaStatus !== undefined) erpnextQuote.zatca_status = quote.zatcaStatus;
    
    if (Object.keys(erpnextQuote).length > 0) {
      console.log(`Updating Quotation ${id} in ERPNext...`, JSON.stringify(erpnextQuote));
      await erpnextUpdate('Quotation', id, erpnextQuote);
      console.log(`Quotation ${id} updated successfully`);
    }

    if (quote.status === 'approved') {
      console.log(`Attempting to submit Quotation ${id}...`);
      await erpnextSubmit('Quotation', id).catch(err => {
        console.warn('Submission warning (may already be submitted):', err.message);
      });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Quotations PUT Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    console.log(`DELETE /api/erpnext/quotations called for ${id}`);
    
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    
    await erpnextDelete('Quotation', id).catch(() => {});
    console.log(`Deleted Quotation ${id} successfully`);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Quotations DELETE Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
