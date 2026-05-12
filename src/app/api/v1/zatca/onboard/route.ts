import { NextRequest, NextResponse } from 'next/server';
import { erpnextCall } from '@/lib/erpnext-client';

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();
    
    let message = '';
    if (action === 'generate_keys') {
      message = await erpnextCall('frappe.client.run_doc_method', {
        dt: 'ZATCA Settings',
        dn: 'ZATCA Settings',
        method: 'generate_keys_and_csr'
      });
    } else if (action === 'onboard') {
      message = await erpnextCall('frappe.client.run_doc_method', {
        dt: 'ZATCA Settings',
        dn: 'ZATCA Settings',
        method: 'onboard_with_zatca'
      });
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
    
    return NextResponse.json({ success: true, message });
  } catch (error: any) {
    console.error('ZATCA Onboard Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
