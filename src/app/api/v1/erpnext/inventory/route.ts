import { NextRequest, NextResponse } from 'next/server';
import { erpnextGet, erpnextCreate, erpnextUpdate, erpnextDelete } from '@/lib/erpnext-client';

export async function GET() {
  console.log('GET /api/erpnext/inventory called');
  try {
    const fields = [
      'name', 'item_name', 'description', 'standard_rate', 'stock_uom', 'item_group'
    ];
    
    console.log('Fetching Items from ERPNext...');
    const products = await erpnextGet('Item', [], fields, 1000);
    
    if (!Array.isArray(products)) {
      console.warn('ERPNext returned non-array products:', products);
      return NextResponse.json([], { headers: { 'X-Source': 'Antigravity-Fix-V1' } });
    }

    console.log(`Fetched ${products.length} items from ERPNext`);

    const stripHtml = (html: string) => html ? html.replace(/<[^>]*>?/gm, '') : '';
    const inventory = products.map((p: any) => ({
      id: p.name,
      name: p.item_name || p.name || '',
      description: stripHtml(p.description || ''),
      price: p.standard_rate || 0,
      unit: p.stock_uom || 'Nos',
      category: p.item_group || '',
      createdAt: Date.now() // Mock for UI
    }));

    return NextResponse.json(inventory, { headers: { 'X-Source': 'Antigravity-Fix-V1' } });
  } catch (error: any) {
    console.error('Inventory API Error:', error.message);
    // Return empty array instead of error object to keep UI stable
    return NextResponse.json([], { 
      status: 200, 
      headers: { 'X-Error-Message': error.message } 
    });
  }
}

export async function POST(req: NextRequest) {
  try {
    const item = await req.json();
    
    const erpnextItem = {
      item_code: item.name, // Usually item_code is the primary key
      item_name: item.name || item.description || 'Custom Item',
      item_group: 'Services', // Defaulting to Services
      stock_uom: 'Nos',
      is_stock_item: 0,
      description: item.description || '',
      standard_rate: item.price
    };

    const created = await erpnextCreate('Item', erpnextItem);
    
    return NextResponse.json({ id: created.name, ...item });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...item } = await req.json();
    
    const erpnextItem: any = {};
    if (item.name !== undefined) erpnextItem.item_name = item.name;
    if (item.price !== undefined) erpnextItem.standard_rate = item.price;
    if (item.description !== undefined) erpnextItem.description = item.description;
    
    await erpnextUpdate('Item', id, erpnextItem);
    
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
    
    try {
      await erpnextDelete('Item', id);
    } catch (e: any) {
      // Fallback to disabling if unlink fails due to links
      await erpnextUpdate('Item', id, { disabled: 1 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
