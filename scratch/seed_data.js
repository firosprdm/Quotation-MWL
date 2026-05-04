const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line.includes('='))
    .map(line => {
        const parts = line.split('=');
        return [parts[0].trim(), parts[1].trim()];
    })
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const ACCOUNTS = {
  BANK: 'acc-2',
  REVENUE: 'acc-9',
  OPEX: 'acc-11',
  VAT_INPUT: 'acc-14',
  VAT_OUTPUT: 'acc-6',
  SALARIES: 'acc-17',
  EQUIPMENT: 'acc-26',
  LOAN: 'acc-loan-01',
};

async function seed() {
  console.log('Cleaning up existing data...');
  await supabase.from('journal_entries').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  const entries = [];
  const getTs = (month, day) => new Date(2024, month - 1, day).getTime();

  // JAN
  entries.push({ date: getTs(1, 1), description: 'Initial Capital', reference: 'CAP-01', lines: [{ accountId: ACCOUNTS.BANK, debit: 200000, credit: 0 }, { accountId: 'acc-7', debit: 0, credit: 200000 }] });
  entries.push({ date: getTs(1, 5), description: 'Bank Loan', reference: 'LOAN-01', lines: [{ accountId: ACCOUNTS.BANK, debit: 100000, credit: 0 }, { accountId: ACCOUNTS.LOAN, debit: 0, credit: 100000 }] });
  
  // FEB
  entries.push({ date: getTs(2, 1), description: 'Rent', reference: 'EXP-01', lines: [{ accountId: ACCOUNTS.OPEX, debit: 10000, credit: 0 }, { accountId: ACCOUNTS.BANK, debit: 0, credit: 10000 }] });
  entries.push({ date: getTs(2, 15), description: 'Revenue 1', reference: 'INV-01', lines: [{ accountId: ACCOUNTS.BANK, debit: 57500, credit: 0 }, { accountId: ACCOUNTS.REVENUE, debit: 0, credit: 50000 }, { accountId: ACCOUNTS.VAT_OUTPUT, debit: 0, credit: 7500 }] });

  // MAR
  entries.push({ date: getTs(3, 1), description: 'Salaries', reference: 'SAL-01', lines: [{ accountId: ACCOUNTS.SALARIES, debit: 30000, credit: 0 }, { accountId: ACCOUNTS.BANK, debit: 0, credit: 30000 }] });

  // APR
  entries.push({ date: getTs(4, 20), description: 'Revenue 2', reference: 'INV-02', lines: [{ accountId: ACCOUNTS.BANK, debit: 115000, credit: 0 }, { accountId: ACCOUNTS.REVENUE, debit: 0, credit: 100000 }, { accountId: ACCOUNTS.VAT_OUTPUT, debit: 0, credit: 15000 }] });

  // MAY
  entries.push({ date: getTs(5, 10), description: 'Marketing', reference: 'EXP-02', lines: [{ accountId: ACCOUNTS.OPEX, debit: 5000, credit: 0 }, { accountId: ACCOUNTS.BANK, debit: 0, credit: 5000 }] });

  // JUN
  entries.push({ date: getTs(6, 15), description: 'Loan Repayment', reference: 'PAY-01', lines: [{ accountId: ACCOUNTS.LOAN, debit: 10000, credit: 0 }, { accountId: ACCOUNTS.BANK, debit: 0, credit: 10000 }] });
  entries.push({ date: getTs(6, 28), description: 'Revenue 3', reference: 'INV-03', lines: [{ accountId: ACCOUNTS.BANK, debit: 28750, credit: 0 }, { accountId: ACCOUNTS.REVENUE, debit: 0, credit: 25000 }, { accountId: ACCOUNTS.VAT_OUTPUT, debit: 0, credit: 3750 }] });

  console.log('Inserting into Supabase...');
  await supabase.from('journal_entries').insert(entries);

  console.log('Calculating and updating balances...');
  const { data: accs } = await supabase.from('accounts').select('*');
  const balMap = {};
  accs.forEach(a => balMap[a.id] = 0);
  
  entries.forEach(e => {
    e.lines.forEach(l => {
      const a = accs.find(acc => acc.id === l.accountId);
      if (!a) return;
      const factor = (a.type === 'Asset' || a.type === 'Expense') ? 1 : -1;
      balMap[l.accountId] += (l.debit - l.credit) * factor;
    });
  });

  for (const [id, balance] of Object.entries(balMap)) {
    await supabase.from('accounts').update({ balance }).eq('id', id);
  }

  console.log('Done!');
}

seed();
