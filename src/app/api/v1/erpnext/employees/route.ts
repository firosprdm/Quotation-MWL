import { NextRequest, NextResponse } from 'next/server';
import { erpnextGet, erpnextCreate, erpnextUpdate, erpnextDelete } from '@/lib/erpnext-client';

export async function GET() {
  try {
    const fields = [
      'name', 'employee_name', 'designation', 'department', 'company_email', 'cell_number', 'date_of_joining'
    ];
    
    const employees = await erpnextGet('Employee', [], fields, 1000);

    const formattedEmployees = employees.map((e: any) => ({
      id: e.name,
      name: e.employee_name || e.name || '',
      position: e.designation || '',
      department: e.department || '',
      email: e.company_email || '',
      phone: e.cell_number || '',
      iqamaNumber: '', // Custom field needed in ERPNext for Iqama
      basicSalary: 0, // Salary is handled in Salary Structure Assignment in ERPNext
      housingAllowance: 0,
      transportAllowance: 0,
      otherAllowances: 0,
      gosiDeduction: 0,
      joiningDate: e.date_of_joining ? new Date(e.date_of_joining).getTime() : Date.now()
    }));

    return NextResponse.json(formattedEmployees);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const emp = await req.json();
    
    const formatDate = (ts?: number) => ts ? new Date(ts).toISOString().split('T')[0] : null;

    const erpnextEmp: any = {
      first_name: emp.name,
      designation: emp.position || '',
      company_email: emp.email || '',
      cell_number: emp.phone || '',
      date_of_joining: formatDate(emp.joiningDate) || formatDate(Date.now()),
      gender: 'Male',
      date_of_birth: '1990-01-01',
    };

    // ── Idempotency: check by company_email to avoid duplicate employees ────
    if (emp.email) {
      const existing = await erpnextGet('Employee', [['company_email', '=', emp.email]], ['name']);
      if (existing && existing.length > 0) {
        console.log('Duplicate employee request detected. Returning existing record:', existing[0].name);
        return NextResponse.json({ id: existing[0].name, ...emp, duplicate: true });
      }
    }

    const created = await erpnextCreate('Employee', erpnextEmp);
    
    return NextResponse.json({ id: created.name, ...emp });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...emp } = await req.json();
    
    const erpnextEmp: any = {};
    if (emp.name !== undefined) erpnextEmp.first_name = emp.name;
    if (emp.position !== undefined) erpnextEmp.designation = emp.position;
    if (emp.email !== undefined) erpnextEmp.company_email = emp.email;
    if (emp.phone !== undefined) erpnextEmp.cell_number = emp.phone;
    
    await erpnextUpdate('Employee', id, erpnextEmp);
    
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
      await erpnextDelete('Employee', id);
    } catch (e) {
      // Deleting employees often fails due to linked records. Status = Left
      await erpnextUpdate('Employee', id, { status: 'Left' });
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
