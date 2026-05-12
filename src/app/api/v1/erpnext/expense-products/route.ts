import { NextRequest, NextResponse } from 'next/server';
import { erpnextGet } from '@/lib/erpnext-client';

export async function GET() {
  try {
    const fields = ['name', 'expense_type'];
    const types = await erpnextGet('Expense Claim Type', [], fields, 100);

    const products = types.map((t: any) => ({
      id: t.name,
      name: t.expense_type || t.name,
    }));

    return NextResponse.json(products);
  } catch (error: any) {
    // HR module may not be enabled — return sensible defaults
    console.warn('expense-products GET warning (HR module may be disabled):', error.message);
    return NextResponse.json([
      { id: 'Travel', name: 'Travel' },
      { id: 'Office Supplies', name: 'Office Supplies' },
      { id: 'Materials', name: 'Materials' },
      { id: 'Utilities', name: 'Utilities' },
      { id: 'Rent', name: 'Rent' },
      { id: 'Salaries', name: 'Salaries' },
      { id: 'Other', name: 'Other' },
    ]);
  }
}
