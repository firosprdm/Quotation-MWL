import { NextRequest, NextResponse } from 'next/server';
import { erpnextGet, erpnextCreate, erpnextUpdate, erpnextDelete } from '@/lib/erpnext-client';

export async function GET() {
  try {
    const fields = [
      'name', 'asset_name', 'purchase_date', 'gross_purchase_amount', 'item_code', 'status'
    ];
    
    const assets = await erpnextGet('Asset', [], fields, 1000);

    const formattedAssets = assets.map((a: any) => ({
      id: a.name,
      name: a.asset_name || a.name || '',
      category: a.item_code || '',
      purchaseDate: a.purchase_date ? new Date(a.purchase_date).getTime() : Date.now(),
      purchaseValue: a.gross_purchase_amount || 0,
      currentValue: a.gross_purchase_amount || 0, // In reality, calculate via depreciation schedules
      status: a.status === 'Draft' ? 'draft' : (a.status === 'Submitted' ? 'active' : 'disposed'),
    }));

    return NextResponse.json(formattedAssets);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const asset = await req.json();
    const formatDate = (ts?: number) => ts ? new Date(ts).toISOString().split('T')[0] : null;

    const erpnextAsset: any = {
      asset_name: asset.name,
      item_code: asset.category || 'Asset Item',
      purchase_date: formatDate(asset.purchaseDate) || formatDate(Date.now()),
      gross_purchase_amount: asset.purchaseValue || 0,
      // Need location and other fields typically
      location: 'Main Location'
    };

    const created = await erpnextCreate('Asset', erpnextAsset);
    
    return NextResponse.json({ id: created.name, ...asset });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...asset } = await req.json();
    
    const erpnextAsset: any = {};
    if (asset.name !== undefined) erpnextAsset.asset_name = asset.name;
    if (asset.purchaseValue !== undefined) erpnextAsset.gross_purchase_amount = asset.purchaseValue;
    
    await erpnextUpdate('Asset', id, erpnextAsset);
    
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
    
    await erpnextDelete('Asset', id);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
