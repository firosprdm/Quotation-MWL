import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Manually parse .env.local to avoid extra dependencies
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');

let ERPNEXT_URL = '';
let ERPNEXT_API_KEY = '';
let ERPNEXT_API_SECRET = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key === 'ERPNEXT_URL') ERPNEXT_URL = value?.trim();
    if (key === 'ERPNEXT_API_KEY') ERPNEXT_API_KEY = value?.trim();
    if (key === 'ERPNEXT_API_SECRET') ERPNEXT_API_SECRET = value?.trim();
  });
}

if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET || ERPNEXT_API_KEY === 'your_api_key_here') {
  console.error('Error: Missing or default ERPNext credentials in .env.local');
  process.exit(1);
}

const headers = {
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `token ${ERPNEXT_API_KEY}:${ERPNEXT_API_SECRET}`
};

async function erpnextRequest(method, endpoint, body = null) {
  const url = `${ERPNEXT_URL}${endpoint}`;
  const options = {
    method,
    headers,
    ...(body ? { body: JSON.stringify(body) } : {})
  };

  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`ERPNext Error [${method} ${endpoint}]: ${JSON.stringify(data.message || data.exc || res.statusText)}`);
  }
  return data.data || data.message || data;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function randomDateLast6Months() {
  const end = new Date();
  const start = new Date();
  start.setMonth(start.getMonth() - 6);
  const randomTs = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTs).toISOString().split('T')[0];
}

function randomId(prefix) {
  return `${prefix}-${Math.floor(1000 + Math.random() * 9000)}`;
}

// ── Async Queue Limiter ───────────────────────────────────────────────────────

async function processQueue(tasks, limit) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const currentIndex = index++;
      try {
        await tasks[currentIndex]();
      } catch (err) {
        console.error(`Task ${currentIndex} failed:`, err.message);
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// ── Main Generation Logic ─────────────────────────────────────────────────────

const TARGET_RECORDS = 75000;
const CONCURRENCY = 20; // 20 simultaneous requests
const CLIENT_NAME = "Kholoud khalid Al-Qahtani Est.";
const INCOME_ACCOUNT = "4110 - Sales - MWL";
const DEBTOR_ACCOUNT = "1310 - Debtors - MWL";

async function generateSingleRecord(i) {
  const date = randomDateLast6Months();
  const poNumber = randomId('PO');
  const ticketNumber = randomId('TKT');
  const amount = Math.floor(1000 + Math.random() * 9000);

  // 1. Create Quotation
  const quoteDoc = {
    naming_series: 'mwl-.####',
    quotation_to: 'Customer',
    party_name: CLIENT_NAME,
    transaction_date: date,
    po_no: poNumber,
    ticket_no: ticketNumber,
    mwl_status: 'sent',
    sales_status: 'PO recieved',
    work_status: 'Work Done',
    items: [
      {
        item_code: 'Custom Item',
        item_name: 'Consulting Services',
        qty: 1,
        rate: amount,
        uom: 'Nos'
      }
    ]
  };
  
  const createdQuote = await erpnextRequest('POST', '/api/resource/Quotation', quoteDoc);

  // 2. Create Sales Invoice
  const invoiceDoc = {
    naming_series: 'INV-.YYYY.-.####',
    customer: CLIENT_NAME,
    posting_date: date,
    due_date: date,
    po_no: poNumber,
    quotation_ref: createdQuote.name,
    mwl_status: 'draft',
    items: [
      {
        item_code: 'Custom Item',
        item_name: 'Consulting Services',
        qty: 1,
        rate: amount,
        uom: 'Nos',
        income_account: INCOME_ACCOUNT
      }
    ]
  };
  
  const createdInvoice = await erpnextRequest('POST', '/api/resource/Sales Invoice', invoiceDoc);

  // 3. Create Journal Entry (White Ledger)
  const journalDoc = {
    voucher_type: 'Journal Entry',
    posting_date: date,
    user_remark: `Invoice ${createdInvoice.name} for PO ${poNumber}`,
    accounts: [
      {
        account: DEBTOR_ACCOUNT,
        party_type: 'Customer',
        party: CLIENT_NAME,
        debit_in_account_currency: amount,
        credit_in_account_currency: 0
      },
      {
        account: INCOME_ACCOUNT,
        debit_in_account_currency: 0,
        credit_in_account_currency: amount
      }
    ]
  };
  
  await erpnextRequest('POST', '/api/resource/Journal Entry', journalDoc);
  
  if (i % 100 === 0) {
    console.log(`✅ Progress: Created ${i} / ${TARGET_RECORDS} records.`);
  }
}

async function main() {
  console.log(`🚀 Starting Massive Data Generation...`);
  console.log(`Target: ${TARGET_RECORDS} records`);
  console.log(`Client: ${CLIENT_NAME}`);
  console.log(`Concurrency: ${CONCURRENCY} requests at a time`);
  
  // Test ERPNext connection and verify accounts exist
  try {
      const dbCheck = await erpnextRequest('GET', '/api/resource/Account?limit_page_length=1');
      console.log('✅ ERPNext Connection Successful.');
  } catch (e) {
      console.error('❌ Failed to connect to ERPNext. Is the server running?');
      process.exit(1);
  }

  const startTime = Date.now();
  
  const tasks = Array.from({ length: TARGET_RECORDS }, (_, i) => () => generateSingleRecord(i + 1));
  
  console.log(`Starting execution loop... this will take a long time.`);
  await processQueue(tasks, CONCURRENCY);
  
  const endTime = Date.now();
  console.log(`🎉 Finished generating ${TARGET_RECORDS} records in ${((endTime - startTime) / 1000 / 60).toFixed(2)} minutes.`);
}

main().catch(console.error);
