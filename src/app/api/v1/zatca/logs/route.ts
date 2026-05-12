import { NextRequest, NextResponse } from 'next/server';
import { erpnextGet } from '@/lib/erpnext-client';

export async function GET() {
  try {
    const logs = await erpnextGet(
      'ZATCA Log',
      [],
      ['name', 'invoice', 'status', 'timestamp', 'xml_content', 'api_response'],
      50
    );
    
    return NextResponse.json(logs);
  } catch (error: any) {
    console.error('ZATCA Logs GET Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
