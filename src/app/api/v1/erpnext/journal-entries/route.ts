import { NextRequest, NextResponse } from 'next/server';
import { erpnextGet, erpnextCreate, erpnextUpdate, erpnextDelete, erpnextSubmit } from '@/lib/erpnext-client';

export async function GET() {
  try {
    const fields = [
      'name', 'posting_date', 'user_remark', 'total_debit', 'docstatus'
    ];
    
    const entries = await erpnextGet('Journal Entry', [], fields, 1000);

    const formattedEntries = entries.map((e: any) => ({
      id: e.name,
      date: e.posting_date ? new Date(e.posting_date).getTime() : Date.now(),
      description: e.user_remark || '',
      reference: e.name,
      amount: e.total_debit || 0,
      status: e.docstatus === 1 ? 'posted' : 'draft',
    }));

    return NextResponse.json(formattedEntries);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const entry = await req.json();
    
    const formatDate = (ts?: number) => ts ? new Date(ts).toISOString().split('T')[0] : null;

    const erpnextEntry: any = {
      posting_date: formatDate(entry.date) || formatDate(Date.now()),
      user_remark: entry.description || '',
      accounts: entry.lines ? entry.lines.map((l: any) => ({
        account: l.accountId || 'Debtors - ',
        debit_in_account_currency: l.debit || 0,
        credit_in_account_currency: l.credit || 0
      })) : []
    };

    // ── Strict Validation: Debits must equal Credits ────────
    const totalDebit = erpnextEntry.accounts.reduce((sum: number, l: any) => sum + (l.debit_in_account_currency || 0), 0);
    const totalCredit = erpnextEntry.accounts.reduce((sum: number, l: any) => sum + (l.credit_in_account_currency || 0), 0);
    
    // Using a small epsilon for float precision
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      return NextResponse.json({ 
        error: `Accounting Integrity Error: Total Debit (${totalDebit}) must equal Total Credit (${totalCredit}).` 
      }, { status: 400 });
    }

    // ── Idempotency Check ────────────────────────────────────
    if (entry.id) {
      const existing = await erpnextGet('Journal Entry', [['idempotency_key', '=', entry.id]], ['name']);
      if (existing && existing.length > 0) {
        console.log('Duplicate Journal Entry detected:', existing[0].name);
        return NextResponse.json({ id: existing[0].name, duplicate: true });
      }
      erpnextEntry.idempotency_key = entry.id;
    }

    const created = await erpnextCreate('Journal Entry', erpnextEntry);
    console.log('Journal Entry created:', created.name);
    
    if (entry.status === 'posted') {
      await erpnextSubmit('Journal Entry', created.name);
    }
    
    return NextResponse.json({ id: created.name, ...entry });
  } catch (error: any) {
    console.error('Journal Entry POST Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...entry } = await req.json();
    
    const formatDate = (ts?: number) => ts ? new Date(ts).toISOString().split('T')[0] : null;

    const erpnextEntry: any = {};
    if (entry.date !== undefined) erpnextEntry.posting_date = formatDate(entry.date);
    if (entry.description !== undefined) erpnextEntry.user_remark = entry.description;
    
    await erpnextUpdate('Journal Entry', id, erpnextEntry);
    
    if (entry.status === 'posted') {
      await erpnextSubmit('Journal Entry', id);
    }
    
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
    
    // ── Immutable Ledger: Block deletion of submitted entries ──
    try {
      const existing = await erpnextGet('Journal Entry', [['name', '=', id]], ['docstatus']);
      if (existing && existing.length > 0 && existing[0].docstatus === 1) {
        return NextResponse.json({ 
          error: 'Immutable Ledger Error: Submitted Journal Entries cannot be deleted. Please Cancel and Amend instead.' 
        }, { status: 403 });
      }
    } catch {}

    await erpnextDelete('Journal Entry', id);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
