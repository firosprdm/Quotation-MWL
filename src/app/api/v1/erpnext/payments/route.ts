import { NextRequest, NextResponse } from 'next/server';
import { erpnextGet, erpnextCreate, erpnextUpdate, erpnextDelete, erpnextSubmit } from '@/lib/erpnext-client';

export async function GET() {
  try {
    const fields = [
      'name', 'posting_date', 'party', 'paid_amount', 'payment_type', 'mode_of_payment', 'docstatus'
    ];
    
    const entries = await erpnextGet('Payment Entry', [], fields, 1000);

    const formattedPayments = entries.map((e: any) => ({
      id: e.name,
      date: e.posting_date ? new Date(e.posting_date).getTime() : Date.now(),
      clientId: e.party || '',
      amount: e.paid_amount || 0,
      paymentMethod: e.mode_of_payment || 'Cash',
      reference: e.name,
      status: e.docstatus === 1 ? 'completed' : 'pending',
    }));

    return NextResponse.json(formattedPayments);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const payment = await req.json();
    const formatDate = (ts?: number) => ts ? new Date(ts).toISOString().split('T')[0] : null;

    const erpnextPayment: any = {
      payment_type: 'Receive',
      party_type: 'Customer',
      party: payment.clientId,
      paid_amount: payment.amount || 0,
      received_amount: payment.amount || 0,
      mode_of_payment: payment.paymentMethod || 'Cash',
      posting_date: formatDate(payment.date) || formatDate(Date.now()),
      paid_to: 'Cash - ',
      paid_from: 'Debtors - ',
    };

    // ── Idempotency Check ────────────────────────────────────
    if (payment.id) {
      const existing = await erpnextGet('Payment Entry', [['idempotency_key', '=', payment.id]], ['name']);
      if (existing && existing.length > 0) {
        return NextResponse.json({ id: existing[0].name, duplicate: true });
      }
      erpnextPayment.idempotency_key = payment.id;
    }

    const created = await erpnextCreate('Payment Entry', erpnextPayment);
    
    if (payment.status === 'completed') {
      await erpnextSubmit('Payment Entry', created.name);
    }
    
    return NextResponse.json({ id: created.name, ...payment });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...payment } = await req.json();
    
    const erpnextPayment: any = {};
    if (payment.amount !== undefined) {
      erpnextPayment.paid_amount = payment.amount;
      erpnextPayment.received_amount = payment.amount;
    }
    if (payment.paymentMethod !== undefined) erpnextPayment.mode_of_payment = payment.paymentMethod;
    
    await erpnextUpdate('Payment Entry', id, erpnextPayment);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    
    // ── Immutable Ledger: Block deletion of submitted payments ──
    try {
      const existing = await erpnextGet('Payment Entry', [['name', '=', id]], ['docstatus']);
      if (existing && existing.length > 0 && existing[0].docstatus === 1) {
        return NextResponse.json({ 
          error: 'Immutable Ledger Error: Submitted Payment Entries cannot be deleted. Please Cancel and Amend instead.' 
        }, { status: 403 });
      }
    } catch {}

    await erpnextDelete('Payment Entry', id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
