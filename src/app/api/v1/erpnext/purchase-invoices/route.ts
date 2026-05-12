import { NextRequest, NextResponse } from 'next/server';
import { erpnextGet, erpnextCreate, erpnextUpdate, erpnextDelete, erpnextSubmit, erpnextGetDoc } from '@/lib/erpnext-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatDate(ts?: number | null) {
  return ts ? new Date(ts).toISOString().split('T')[0] : null;
}

function mapToFrontend(inv: any) {
  return {
    id: inv.name,
    number: inv.name, // ERPNext auto-generates PINV- serial
    supplierId: inv.supplier || '',
    date: inv.posting_date ? new Date(inv.posting_date).getTime() : Date.now(),
    dueDate: inv.due_date ? new Date(inv.due_date).getTime() : Date.now(),
    subtotal: inv.net_total || 0,
    vatRate: 15, // Defaulting for simple tracking
    vatAmount: inv.total_taxes_and_charges || 0,
    grandTotal: inv.grand_total || 0,
    notes: inv.remarks || '',
    status: inv.docstatus === 1 ? (inv.outstanding_amount <= 0 ? 'paid' : 'unpaid') : 'draft',
    receivedAmount: inv.docstatus === 1 ? ((inv.grand_total || 0) - (inv.outstanding_amount || 0)) : 0,
    projectId: inv.project || '',
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

// ── GET — list all purchase invoices ─────────────────────────────────────────
export async function GET() {
  console.log('GET /api/erpnext/purchase-invoices called');
  try {
    const fields = [
      'name', 'supplier', 'posting_date', 'due_date', 'net_total',
      'total_taxes_and_charges', 'grand_total', 'outstanding_amount',
      'docstatus', 'remarks', 'project'
    ];

    const invoices = await erpnextGet('Purchase Invoice', [], fields, 1000);
    console.log(`Fetched ${invoices.length} purchase invoices from ERPNext`);

    const result = invoices.map((inv: any) => mapToFrontend(inv));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Purchase Invoices GET Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── POST — create purchase invoice ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  console.log('POST /api/erpnext/purchase-invoices called');
  try {
    const body = await req.json();
    console.log('Purchase Invoice data received:', JSON.stringify(body, null, 2));

    const erpnextInv: any = {
      naming_series: 'PINV-.YYYY.-.####',
      supplier: body.supplierId,
      posting_date: formatDate(body.date) || formatDate(Date.now()),
      bill_date: formatDate(body.date) || formatDate(Date.now()),
      due_date: formatDate(body.dueDate) || formatDate(Date.now()),
      remarks: body.notes || '',
      project: body.projectId || '',
      items: (body.items || []).map((item: any) => ({
        item_code: item.itemId && item.itemId !== 'manual' ? item.itemId : 'Custom Item',
        item_name: item.description || 'Item',
        qty: item.quantity || 1,
        rate: item.price || 0,
        uom: item.unit || 'Nos',
      })),
    };

    console.log('Creating Purchase Invoice in ERPNext...');

    // ── Idempotency Check ────────────────────────────────────
    if (body.id) {
      const existing = await erpnextGet('Purchase Invoice', [['idempotency_key', '=', body.id]], ['name']);
      if (existing && existing.length > 0) {
        console.log('Duplicate request detected. Returning existing record:', existing[0].name);
        return NextResponse.json({ id: existing[0].name, number: existing[0].name, duplicate: true });
      }
      erpnextInv.idempotency_key = body.id;
    }

    const created = await erpnextCreate('Purchase Invoice', erpnextInv);
    console.log('Purchase Invoice created:', created.name);

    return NextResponse.json({ id: created.name, number: created.name });
  } catch (error: any) {
    console.error('Purchase Invoices POST Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── PUT — update purchase invoice ───────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const { id, ...body } = await req.json();
    console.log(`PUT /api/erpnext/purchase-invoices called for ${id}`);

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const updates: any = {};
    if (body.supplierId !== undefined) updates.supplier = body.supplierId;
    if (body.date !== undefined) updates.posting_date = formatDate(body.date);
    if (body.dueDate !== undefined) updates.due_date = formatDate(body.dueDate);
    if (body.notes !== undefined) updates.remarks = body.notes;
    if (body.projectId !== undefined) updates.project = body.projectId;

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
      await erpnextUpdate('Purchase Invoice', id, updates);
      console.log(`Purchase Invoice ${id} updated successfully`);
    }

    if (body.status === 'submitted') {
      await erpnextSubmit('Purchase Invoice', id).catch(err => {
        console.warn('Purchase Invoice submission warning:', err.message);
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Purchase Invoices PUT Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── DELETE — remove purchase invoice ────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    console.log(`DELETE /api/erpnext/purchase-invoices called for ${id}`);
    
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // ── Immutable Ledger: Block deletion of submitted invoices ──
    try {
      const existing = await erpnextGet('Purchase Invoice', [['name', '=', id]], ['docstatus']);
      if (existing && existing.length > 0 && existing[0].docstatus === 1) {
        return NextResponse.json({ 
          error: 'Immutable Ledger Error: Submitted Purchase Invoices cannot be deleted. Please Cancel and Amend instead.' 
        }, { status: 403 });
      }
    } catch {}

    await erpnextDelete('Purchase Invoice', id);
    console.log(`Purchase Invoice ${id} deleted successfully`);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Purchase Invoices DELETE Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
