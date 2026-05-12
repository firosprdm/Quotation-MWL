import { NextRequest, NextResponse } from 'next/server';
import { erpnextGet, erpnextCreate, erpnextUpdate, erpnextDelete, erpnextGetDoc } from '@/lib/erpnext-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ── helpers ────────────────────────────────────────────────────────────────────

/** Fetch the linked Address document for a Customer (returns null if not found) */
async function fetchCustomerAddress(customerName: string) {
  try {
    const addresses = await erpnextGet(
      'Address',
      [['Dynamic Link', 'link_doctype', '=', 'Customer'], ['Dynamic Link', 'link_name', '=', customerName]],
      ['name', 'address_title', 'address_line1', 'address_line2', 'city', 'pincode', 'county'],
      1
    );
    return addresses.length > 0 ? addresses[0] : null;
  } catch {
    return null;
  }
}

/** Upsert (create-or-update) an Address record linked to a Customer */
async function upsertCustomerAddress(customerName: string, data: {
  streetName?: string; district?: string; city?: string;
  postalCode?: string; buildingNumber?: string;
}) {
  const existing = await fetchCustomerAddress(customerName);
  const payload = {
    address_title: customerName,
    address_type: 'Billing',
    address_line1: [data.buildingNumber, data.streetName].filter(Boolean).join(', ') || 'N/A',
    address_line2: data.district || '',
    city: data.city || 'N/A',
    pincode: data.postalCode || '',
    county: data.buildingNumber || '',   // store building number in "county" custom field
    country: 'Saudi Arabia',
    links: [{ link_doctype: 'Customer', link_name: customerName }],
  };

  if (existing) {
    await erpnextUpdate('Address', existing.name, payload);
  } else {
    await erpnextCreate('Address', payload);
  }
}

/** Map ERPNext Customer + Address → frontend Client object */
function mapToFrontend(c: any, addr: any) {
  // Parse building number out of "county" or from the beginning of address_line1
  const buildingNumber = addr?.county || '';
  const streetName = addr?.address_line1?.replace(/^\d+,\s*/, '') || addr?.address_line1 || '';

  return {
    id: c.name,
    name: c.customer_name || c.name || '',
    email: c.email_id || '',
    phone: c.mobile_no || '',
    vatNumber: c.tax_id || '',
    otherId: c.customer_primary_contact || '',
    address: addr ? `${streetName}, ${addr.city}` : '',
    splitAddress: addr ? {
      buildingNumber,
      streetName,
      district: addr.address_line2 || '',
      city: addr.city || '',
      postalCode: addr.pincode || '',
      countryCode: 'SA',
    } : undefined,
    createdAt: Date.now(),
  };
}

// ── GET — list all clients ─────────────────────────────────────────────────────
export async function GET() {
  console.log('GET /api/erpnext/clients called');
  try {
    const fields = ['name', 'customer_name', 'email_id', 'mobile_no', 'tax_id'];
    const customers = await erpnextGet('Customer', [], fields, 1000);
    console.log(`Fetched ${customers.length} customers from ERPNext`);

    const clients = customers.map((c: any) => mapToFrontend(c, null));

    return NextResponse.json(clients);
  } catch (error: any) {
    console.error('Clients GET Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── POST — create client ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  console.log('POST /api/erpnext/clients called');
  try {
    const client = await req.json();
    console.log('Client data received:', client);

    const erpnextCustomer = {
      customer_name: client.name,
      customer_type: 'Company',
      email_id: client.email || '',
      mobile_no: client.phone || '',
      tax_id: client.vatNumber || '',
    };

    const created = await erpnextCreate('Customer', erpnextCustomer);
    console.log('Customer created:', created.name);

    // Save address (from either splitAddress or flat fields)
    const split = client.splitAddress;
    const hasAddress = split?.streetName || split?.city || client.streetName || client.city;
    if (hasAddress) {
      await upsertCustomerAddress(created.name, {
        buildingNumber: split?.buildingNumber || client.buildingNumber || '',
        streetName:     split?.streetName    || client.streetName    || '',
        district:       split?.district      || client.district      || '',
        city:           split?.city          || client.city          || '',
        postalCode:     split?.postalCode    || client.postalCode    || '',
      }).catch(err => console.error('Non-fatal Address save error:', err.message));
    }

    return NextResponse.json({ id: created.name, ...client });
  } catch (error: any) {
    console.error('Clients POST Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── PUT — update client ────────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const { id, ...client } = await req.json();
    console.log(`PUT /api/erpnext/clients called for ${id}`);

    // Update core Customer fields
    const erpnextCustomer: any = {};
    if (client.name      !== undefined) erpnextCustomer.customer_name = client.name;
    if (client.email     !== undefined) erpnextCustomer.email_id      = client.email;
    if (client.phone     !== undefined) erpnextCustomer.mobile_no     = client.phone;
    if (client.vatNumber !== undefined) erpnextCustomer.tax_id        = client.vatNumber;

    if (Object.keys(erpnextCustomer).length > 0) {
      await erpnextUpdate('Customer', id, erpnextCustomer);
      console.log(`Updated Customer ${id}`);
    }

    // Update address (from either splitAddress or flat fields)
    const split = client.splitAddress;
    const hasAddress = split?.streetName || split?.city || split?.district ||
                       client.streetName || client.city || client.district;
    if (hasAddress) {
      await upsertCustomerAddress(id, {
        buildingNumber: split?.buildingNumber || client.buildingNumber || '',
        streetName:     split?.streetName    || client.streetName    || '',
        district:       split?.district      || client.district      || '',
        city:           split?.city          || client.city          || '',
        postalCode:     split?.postalCode    || client.postalCode    || '',
      }).catch(err => console.error('Non-fatal Address update error:', err.message));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Clients PUT Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── DELETE — remove client ─────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    console.log(`DELETE /api/erpnext/clients called for ${id}`);
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    // Delete linked Address first to avoid FK constraint errors
    const addr = await fetchCustomerAddress(id);
    if (addr) {
      await erpnextDelete('Address', addr.name).catch(() => {});
    }

    await erpnextDelete('Customer', id);
    console.log(`Deleted Customer ${id}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Clients DELETE Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
