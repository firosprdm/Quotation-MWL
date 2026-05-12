import { NextRequest, NextResponse } from 'next/server';
import { erpnextGet, erpnextCreate, erpnextUpdate, erpnextDelete } from '@/lib/erpnext-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// ── helpers ────────────────────────────────────────────────────────────────────

async function fetchSupplierAddress(supplierName: string) {
  try {
    const addresses = await erpnextGet(
      'Address',
      [['Dynamic Link', 'link_doctype', '=', 'Supplier'], ['Dynamic Link', 'link_name', '=', supplierName]],
      ['name', 'address_title', 'address_line1', 'address_line2', 'city', 'pincode', 'county'],
      1
    );
    return addresses.length > 0 ? addresses[0] : null;
  } catch {
    return null;
  }
}

async function upsertSupplierAddress(supplierName: string, data: {
  streetName?: string; district?: string; city?: string;
  postalCode?: string; buildingNumber?: string;
}) {
  const existing = await fetchSupplierAddress(supplierName);
  const payload = {
    address_title: supplierName,
    address_type: 'Billing',
    address_line1: [data.buildingNumber, data.streetName].filter(Boolean).join(', ') || 'N/A',
    address_line2: data.district || '',
    city: data.city || 'N/A',
    pincode: data.postalCode || '',
    county: data.buildingNumber || '',
    country: 'Saudi Arabia',
    links: [{ link_doctype: 'Supplier', link_name: supplierName }],
  };

  if (existing) {
    await erpnextUpdate('Address', existing.name, payload);
  } else {
    await erpnextCreate('Address', payload);
  }
}

function mapToFrontend(s: any, addr: any) {
  const buildingNumber = addr?.county || '';
  const streetName = addr?.address_line1?.replace(/^\d+,\s*/, '') || addr?.address_line1 || '';

  return {
    id: s.name,
    name: s.supplier_name || s.name || '',
    email: s.email_id || '',
    phone: s.mobile_no || '',
    vatNumber: s.tax_id || '',
    otherId: s.supplier_primary_contact || '',
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

// ── GET — list all suppliers ───────────────────────────────────────────────────
export async function GET() {
  console.log('GET /api/v1/erpnext/suppliers called');
  try {
    const fields = ['name', 'supplier_name', 'email_id', 'mobile_no', 'tax_id'];
    const suppliers = await erpnextGet('Supplier', [], fields, 1000);
    console.log(`Fetched ${suppliers.length} suppliers from ERPNext`);

    // map without address for performance (address fetched on-demand in PUT/POST)
    const mappedSuppliers = suppliers.map((s: any) => mapToFrontend(s, null));

    return NextResponse.json(mappedSuppliers);
  } catch (error: any) {
    console.error('Suppliers GET Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── POST — create supplier ─────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  console.log('POST /api/erpnext/suppliers called');
  try {
    const supplier = await req.json();
    console.log('Supplier data received:', supplier);

    const erpnextSupplier = {
      supplier_name: supplier.name,
      supplier_group: 'All Supplier Groups', // Default group required by ERPNext
      supplier_type: 'Company',
      email_id: supplier.email || '',
      mobile_no: supplier.phone || '',
      tax_id: supplier.vatNumber || '',
    };

    const created = await erpnextCreate('Supplier', erpnextSupplier);
    console.log('Supplier created:', created.name);

    // Save address
    const split = supplier.splitAddress;
    const hasAddress = split?.streetName || split?.city || supplier.streetName || supplier.city;
    if (hasAddress) {
      await upsertSupplierAddress(created.name, {
        buildingNumber: split?.buildingNumber || supplier.buildingNumber || '',
        streetName:     split?.streetName    || supplier.streetName    || '',
        district:       split?.district      || supplier.district      || '',
        city:           split?.city          || supplier.city          || '',
        postalCode:     split?.postalCode    || supplier.postalCode    || '',
      }).catch(err => console.error('Non-fatal Address save error:', err.message));
    }

    return NextResponse.json({ id: created.name, ...supplier });
  } catch (error: any) {
    console.error('Suppliers POST Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── PUT — update supplier ──────────────────────────────────────────────────────
export async function PUT(req: NextRequest) {
  try {
    const { id, ...supplier } = await req.json();
    console.log(`PUT /api/erpnext/suppliers called for ${id}`);

    const erpnextSupplier: any = {};
    if (supplier.name      !== undefined) erpnextSupplier.supplier_name = supplier.name;
    if (supplier.email     !== undefined) erpnextSupplier.email_id      = supplier.email;
    if (supplier.phone     !== undefined) erpnextSupplier.mobile_no     = supplier.phone;
    if (supplier.vatNumber !== undefined) erpnextSupplier.tax_id        = supplier.vatNumber;

    if (Object.keys(erpnextSupplier).length > 0) {
      await erpnextUpdate('Supplier', id, erpnextSupplier);
      console.log(`Updated Supplier ${id}`);
    }

    const split = supplier.splitAddress;
    const hasAddress = split?.streetName || split?.city || split?.district ||
                       supplier.streetName || supplier.city || supplier.district;
    if (hasAddress) {
      await upsertSupplierAddress(id, {
        buildingNumber: split?.buildingNumber || supplier.buildingNumber || '',
        streetName:     split?.streetName    || supplier.streetName    || '',
        district:       split?.district      || supplier.district      || '',
        city:           split?.city          || supplier.city          || '',
        postalCode:     split?.postalCode    || supplier.postalCode    || '',
      }).catch(err => console.error('Non-fatal Address update error:', err.message));
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Suppliers PUT Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ── DELETE — remove supplier ───────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    console.log(`DELETE /api/erpnext/suppliers called for ${id}`);
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

    const addr = await fetchSupplierAddress(id);
    if (addr) {
      await erpnextDelete('Address', addr.name).catch(() => {});
    }

    await erpnextDelete('Supplier', id);
    console.log(`Deleted Supplier ${id}`);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Suppliers DELETE Error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
