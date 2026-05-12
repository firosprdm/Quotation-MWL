import { NextRequest, NextResponse } from 'next/server';
import { erpnextGetDoc, erpnextUpdate } from '@/lib/erpnext-client';

export async function GET() {
  try {
    // Fetch the ZATCA Settings singleton
    const settings = await erpnextGetDoc('ZATCA Settings', 'ZATCA Settings');
    
    // Sanitize sensitive data for frontend (don't send private key)
    const sanitized = {
      status: settings.status || 'Pending',
      company: settings.company,
      mode: settings.mode || 'Developer',
      last_icv: settings.last_icv || 0,
      onboarded_date: settings.modified,
      certificate_info: settings.certificate ? 'Active' : 'Missing',
      public_key: settings.public_key ? true : false,
    };

    return NextResponse.json(sanitized);
  } catch (error: any) {
    console.error('ZATCA Settings GET Error:', error.message);

    // Graceful fallback: if the zatca Frappe app module hasn't been restarted yet,
    // return a safe default so the dashboard doesn't crash.
    if (error.message?.includes('ImportError') || error.message?.includes('Module import failed')) {
      console.warn('ZATCA app not loaded in Frappe — bench restart required.');
      return NextResponse.json({
        status: 'Pending',
        company: null,
        mode: 'Developer',
        last_icv: 0,
        onboarded_date: null,
        certificate_info: 'Missing',
        public_key: false,
        _warning: 'ZATCA app not loaded. Run: bench restart in OrbStack.'
      });
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    
    // Update the ZATCA Settings singleton
    await erpnextUpdate('ZATCA Settings', 'ZATCA Settings', data);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('ZATCA Settings POST Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
