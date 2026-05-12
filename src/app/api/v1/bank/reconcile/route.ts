import { NextRequest, NextResponse } from 'next/server';
import { erpnextGet } from '@/lib/erpnext-client';

export async function POST(req: NextRequest) {
  try {
    const { transactions } = await req.json(); // Array of {date, description, amount, type}

    // 1. Fetch Open Invoices (Customers) and Bills (Vendors) from ERPNext
    // Sales Invoice for Customer Invoices
    // Purchase Invoice for Vendor Bills
    const [invoices, bills] = await Promise.all([
      erpnextGet('Sales Invoice', [
        ['docstatus', '=', 1],
        ['status', '!=', 'Paid']
      ], ['name', 'customer', 'grand_total', 'posting_date', 'po_no']),
      erpnextGet('Purchase Invoice', [
        ['docstatus', '=', 1],
        ['status', '!=', 'Paid']
      ], ['name', 'supplier', 'grand_total', 'posting_date', 'bill_no'])
    ]);

    // 2. Map ERPNext data to the internal format used by matching logic
    const mappedInvoices = invoices.map((inv: any) => ({
      id: inv.name,
      name: inv.name,
      partner_name: inv.customer,
      amount_total: inv.grand_total,
      date: inv.posting_date,
      ref: inv.po_no || ''
    }));

    const mappedBills = bills.map((bill: any) => ({
      id: bill.name,
      name: bill.name,
      partner_name: bill.supplier,
      amount_total: bill.grand_total,
      date: bill.posting_date,
      ref: bill.bill_no || ''
    }));

    // 3. Intelligent Matching Logic
    const matches = transactions.map((tx: any) => {
      const txAmount = Math.abs(tx.amount);
      const isIncome = tx.amount > 0;
      
      const potentialMatches = (isIncome ? mappedInvoices : mappedBills).map((doc: any) => {
        let score = 0;
        
        // Match by amount (High Weight)
        if (Math.abs(doc.amount_total - txAmount) < 0.01) score += 70;
        
        // Match by description / reference (Medium Weight)
        const desc = tx.description.toLowerCase();
        const partnerName = (doc.partner_name || '').toLowerCase();
        const docRef = (doc.ref || '').toLowerCase();
        const docName = doc.name.toLowerCase();

        if (partnerName && (desc.includes(partnerName) || partnerName.includes(desc))) score += 20;
        if (docRef && desc.includes(docRef)) score += 25;
        if (desc.includes(docName.replace(/\//g, '').replace(/-/g, ''))) score += 15;

        return { ...doc, score };
      })
      .filter((m: any) => m.score > 30) // Only keep decent matches
      .sort((a: any, b: any) => b.score - a.score);

      return {
        transaction: tx,
        suggestedMatch: potentialMatches[0] || null,
        otherOptions: potentialMatches.slice(1, 4)
      };
    });

    return NextResponse.json(matches);
  } catch (error: any) {
    console.error('Reconciliation API Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
