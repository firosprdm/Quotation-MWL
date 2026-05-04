import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('='))
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

if (!supabaseUrl || !supabaseKey) {
  console.error('Keys not found in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const ACCOUNTS = {
  CASH: 'acc-1',
  BANK: 'acc-2',
  AR: 'acc-3',
  REVENUE: 'acc-9',
  COGS: 'acc-10',
  OPEX: 'acc-11',
  VAT_INPUT: 'acc-14',
  VAT_OUTPUT: 'acc-6',
  AP: 'acc-5',
  SALARIES: 'acc-17',
  EQUIPMENT: 'acc-26',
  LOAN: 'acc-loan-01',
};

async function seed() {
  console.log('Cleaning up existing data...');
  await supabase.from('journal_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log('Ensuring accounts exist...');
  await supabase.from('accounts').upsert([
    { id: ACCOUNTS.LOAN, name: 'Bank Loan (Long Term)', type: 'Liability', balance: 0, code: '2800' }
  ]);

  const entries = [];
  const getTs = (month: number, day: number) => new Date(2024, month - 1, day).getTime();

  // JAN: Investment + Loan + Equipment
  entries.push({
    id: crypto.randomUUID(),
    date: getTs(1, 1),
    description: 'Initial Capital Investment',
    reference: 'CAP-001',
    lines: [
      { accountId: ACCOUNTS.BANK, debit: 200000, credit: 0 },
      { accountId: 'acc-7', debit: 0, credit: 200000 },
    ]
  });
  entries.push({
    id: crypto.randomUUID(),
    date: getTs(1, 5),
    description: 'Business Loan from Bank',
    reference: 'LOAN-001',
    lines: [
      { accountId: ACCOUNTS.BANK, debit: 100000, credit: 0 },
      { accountId: ACCOUNTS.LOAN, debit: 0, credit: 100000 },
    ]
  });
  entries.push({
    id: crypto.randomUUID(),
    date: getTs(1, 10),
    description: 'Office Equipment Purchase',
    reference: 'PUR-001',
    lines: [
      { accountId: ACCOUNTS.EQUIPMENT, debit: 20000, credit: 0 },
      { accountId: ACCOUNTS.VAT_INPUT, debit: 3000, credit: 0 },
      { accountId: ACCOUNTS.BANK, debit: 0, credit: 23000 },
    ]
  });

  // FEB: Rent + First Sale
  entries.push({
    id: crypto.randomUUID(),
    date: getTs(2, 1),
    description: 'Monthly Office Rent',
    reference: 'EXP-001',
    lines: [
      { accountId: ACCOUNTS.OPEX, debit: 10000, credit: 0 },
      { accountId: ACCOUNTS.BANK, debit: 0, credit: 10000 },
    ]
  });
  entries.push({
    id: crypto.randomUUID(),
    date: getTs(2, 15),
    description: 'Consulting Services provided to Marina Client',
    reference: 'INV-001',
    lines: [
      { accountId: ACCOUNTS.BANK, debit: 57500, credit: 0 },
      { accountId: ACCOUNTS.REVENUE, debit: 0, credit: 50000 },
      { accountId: ACCOUNTS.VAT_OUTPUT, debit: 0, credit: 7500 },
    ]
  });

  // MAR: Salaries + Interest
  entries.push({
    id: crypto.randomUUID(),
    date: getTs(3, 1),
    description: 'Monthly Staff Salaries',
    reference: 'SAL-MAR',
    lines: [
      { accountId: ACCOUNTS.SALARIES, debit: 30000, credit: 0 },
      { accountId: ACCOUNTS.BANK, debit: 0, credit: 30000 },
    ]
  });
  entries.push({
    id: crypto.randomUUID(),
    date: getTs(3, 15),
    description: 'Bank Loan Interest Payment',
    reference: 'INT-001',
    lines: [
      { accountId: ACCOUNTS.OPEX, debit: 500, credit: 0 },
      { accountId: ACCOUNTS.BANK, debit: 0, credit: 500 },
    ]
  });

  // APR: Software + Large Revenue
  entries.push({
    id: crypto.randomUUID(),
    date: getTs(4, 5),
    description: 'Cloud Software Subscription',
    reference: 'EXP-002',
    lines: [
      { accountId: ACCOUNTS.OPEX, debit: 2000, credit: 0 },
      { accountId: ACCOUNTS.BANK, debit: 0, credit: 2000 },
    ]
  });
  entries.push({
    id: crypto.randomUUID(),
    date: getTs(4, 20),
    description: 'Project Alpha Milestone 1',
    reference: 'INV-002',
    lines: [
      { accountId: ACCOUNTS.BANK, debit: 115000, credit: 0 },
      { accountId: ACCOUNTS.REVENUE, debit: 0, credit: 100000 },
      { accountId: ACCOUNTS.VAT_OUTPUT, debit: 0, credit: 15000 },
    ]
  });

  // MAY: Utilities + Marketing
  entries.push({
    id: crypto.randomUUID(),
    date: getTs(5, 10),
    description: 'Electricity and Water Bills',
    reference: 'UTIL-MAY',
    lines: [
      { accountId: ACCOUNTS.OPEX, debit: 1500, credit: 0 },
      { accountId: ACCOUNTS.BANK, debit: 0, credit: 1500 },
    ]
  });
  entries.push({
    id: crypto.randomUUID(),
    date: getTs(5, 25),
    description: 'Digital Marketing Campaign',
    reference: 'MKT-001',
    lines: [
      { accountId: ACCOUNTS.OPEX, debit: 5000, credit: 0 },
      { accountId: ACCOUNTS.BANK, debit: 0, credit: 5000 },
    ]
  });

  // JUN: Loan Repayment + Revenue
  entries.push({
    id: crypto.randomUUID(),
    date: getTs(6, 15),
    description: 'Loan Principal Repayment',
    reference: 'LOAN-PAY-01',
    lines: [
      { accountId: ACCOUNTS.LOAN, debit: 10000, credit: 0 },
      { accountId: ACCOUNTS.BANK, debit: 0, credit: 10000 },
    ]
  });
  entries.push({
    id: crypto.randomUUID(),
    date: getTs(6, 28),
    description: 'Project Beta Final Payment',
    reference: 'INV-003',
    lines: [
      { accountId: ACCOUNTS.BANK, debit: 28750, credit: 0 },
      { accountId: ACCOUNTS.REVENUE, debit: 0, credit: 25000 },
      { accountId: ACCOUNTS.VAT_OUTPUT, debit: 0, credit: 3750 },
    ]
  });

  console.log('Inserting into Supabase...');
  await supabase.from('journal_entries').insert(entries);

  console.log('Updating account balances...');
  const { data: accountsData } = await supabase.from('accounts').select('*');
  const accountMap = new Map(accountsData?.map(a => [a.id, a]));
  const balances: Record<string, number> = {};

  for (const entry of entries) {
    for (const line of entry.lines) {
      const acc = accountMap.get(line.accountId);
      if (!acc) continue;
      if (balances[line.accountId] === undefined) balances[line.accountId] = acc.balance || 0;
      const isAssetOrExpense = acc.type === 'Asset' || acc.type === 'Expense';
      if (isAssetOrExpense) {
        balances[line.accountId] += (line.debit - line.credit);
      } else {
        balances[line.accountId] += (line.credit - line.debit);
      }
    }
  }

  for (const [id, balance] of Object.entries(balances)) {
    await supabase.from('accounts').update({ balance }).eq('id', id);
  }

  console.log('Seeding complete!');
}

seed();
