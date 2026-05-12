import { NextRequest, NextResponse } from 'next/server';
import { erpnextGet, erpnextCreate, erpnextUpdate, erpnextDelete } from '@/lib/erpnext-client';

export async function GET() {
  try {
    const fields = [
      'name', 'account_name', 'account_type', 'root_type'
    ];
    
    const accounts = await erpnextGet('Account', [], fields, 1000);

    const formattedAccounts = accounts.map((a: any) => ({
      id: a.name,
      code: a.name.split(' - ')[0] || '',
      name: a.account_name || '',
      type: a.account_type || a.root_type || 'Equity',
    }));

    return NextResponse.json(formattedAccounts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const acc = await req.json();
    
    const erpnextAccount: any = {
      account_name: acc.name,
      account_type: acc.type || 'Bank',
      is_group: 0,
      parent_account: 'Current Assets - ' // Needs valid parent
    };

    const created = await erpnextCreate('Account', erpnextAccount);
    
    return NextResponse.json({ id: created.name, ...acc });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...acc } = await req.json();
    
    const erpnextAccount: any = {};
    if (acc.name !== undefined) erpnextAccount.account_name = acc.name;
    if (acc.type !== undefined) erpnextAccount.account_type = acc.type;
    
    await erpnextUpdate('Account', id, erpnextAccount);
    
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
    
    await erpnextDelete('Account', id);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
