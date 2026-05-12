import { NextRequest, NextResponse } from 'next/server';
import { erpnextGet, erpnextCreate, erpnextUpdate } from '@/lib/erpnext-client';

const SETTINGS_NOTE_TITLE = '[SYSTEM] Company Settings';

export async function GET() {
  try {
    // 1. Try to fetch from dedicated System Note
    const notes = await erpnextGet('Note', [['title', '=', SETTINGS_NOTE_TITLE]], ['name', 'content'], 1);
    
    if (notes.length > 0) {
      try {
        const settings = JSON.parse(notes[0].content);
        return NextResponse.json(settings);
      } catch (e) {
        console.error('Failed to parse settings JSON from Note');
      }
    }

    // 2. Fallback: Try to fetch from Company DocType for basic info
    const companies = await erpnextGet('Company', [['name', '=', 'Marina WorldLink Co']], ['company_name', 'tax_id', 'registration_details'], 1);
    
    const defaultSettings = {
      companyName: 'MARINA WORLDLINK',
      vatNumber: '300000000000003',
      crNumber: '1010000000',
      contact: '+966 11 000 0000',
      defaultNotes: '1. Payment: 50% Advance, 50% on completion.\n2. Validity: 30 days.\n3. Delivery: Within 7 days.',
      splitAddress: {
        streetName: 'King Fahd Road',
        district: 'Al Olaya',
        city: 'Riyadh',
        postalCode: '12211',
        countryCode: 'SA'
      }
    };

    if (companies.length > 0) {
      const c = companies[0];
      return NextResponse.json({
        ...defaultSettings,
        companyName: c.company_name || defaultSettings.companyName,
        vatNumber: c.tax_id || defaultSettings.vatNumber,
        crNumber: c.registration_details || defaultSettings.crNumber
      });
    }

    return NextResponse.json(defaultSettings);
  } catch (error: any) {
    console.error('Settings GET Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const settings = await req.json();
    
    // 1. Update/Create System Note for full persistence
    const notes = await erpnextGet('Note', [['title', '=', SETTINGS_NOTE_TITLE]], ['name'], 1);
    
    if (notes.length > 0) {
      await erpnextUpdate('Note', notes[0].name, {
        content: JSON.stringify(settings)
      });
    } else {
      await erpnextCreate('Note', {
        title: SETTINGS_NOTE_TITLE,
        content: JSON.stringify(settings),
        public: 0
      });
    }

    // 2. Sync basic info to Company DocType for ERP consistency
    const companies = await erpnextGet('Company', [['name', '=', 'Marina WorldLink Co']], ['name'], 1);
    if (companies.length > 0) {
      const erpnextCompany: any = {};
      if (settings.companyName) erpnextCompany.company_name = settings.companyName;
      if (settings.vatNumber) erpnextCompany.tax_id = settings.vatNumber;
      if (settings.crNumber) erpnextCompany.registration_details = settings.crNumber;
      
      await erpnextUpdate('Company', companies[0].name, erpnextCompany);
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Settings POST Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

