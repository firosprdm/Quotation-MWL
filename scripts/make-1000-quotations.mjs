import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../.env.local');

let ERPNEXT_URL = '';
let ERPNEXT_API_KEY = '';
let ERPNEXT_API_SECRET = '';

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const parts = trimmed.split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      if (key === 'ERPNEXT_URL') ERPNEXT_URL = value;
      if (key === 'ERPNEXT_API_KEY') ERPNEXT_API_KEY = value;
      if (key === 'ERPNEXT_API_SECRET') ERPNEXT_API_SECRET = value;
    }
  });
}

// Ensure port 8000 is present for API access if using the VM IP directly
if (ERPNEXT_URL && !ERPNEXT_URL.includes(':8000')) {
  // strip trailing slash if any
  ERPNEXT_URL = ERPNEXT_URL.replace(/\/$/, '') + ':8000';
}

if (!ERPNEXT_URL || !ERPNEXT_API_KEY || !ERPNEXT_API_SECRET) {
  console.error('Error: Missing ERPNext credentials in .env.local');
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

// Helper to process queue with concurrency limit
async function processQueue(tasks, limit) {
  const results = { successful: 0, failed: 0, errors: [] };
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const currentIndex = index++;
      try {
        await tasks[currentIndex]();
        results.successful++;
      } catch (err) {
        results.failed++;
        if (results.errors.length < 5) {
          results.errors.push(err.message);
        }
      }
      if ((results.successful + results.failed) % 100 === 0) {
        console.log(`⏳ Progress: Processed ${results.successful + results.failed} / ${tasks.length} Quotations...`);
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

async function main() {
  const TOTAL_QUOTATIONS = 1000;
  const CONCURRENCY = 15;

  console.log(`🚀 Starting High-Speed Quotation Load Test...`);
  console.log(`Target: ${TOTAL_QUOTATIONS} Quotations`);
  console.log(`Concurrency: ${CONCURRENCY} parallel streams`);
  console.log(`Backend API: ${ERPNEXT_URL}`);

  // 1. Fetch a valid customer to bind the quotations to
  let customerName = "Kholoud khalid Al-Qahtani Est.";
  try {
    const customers = await erpnextRequest('GET', '/api/resource/Customer?limit_page_length=1');
    if (customers && customers.length > 0) {
      customerName = customers[0].name;
      console.log(`✅ Connection OK. Using Client: "${customerName}"`);
    } else {
      console.log(`⚠️ No specific customers found, falling back to default client: "${customerName}"`);
    }
  } catch (err) {
    console.error('❌ Failed to connect to ERPNext API:', err.message);
    process.exit(1);
  }

  const startTime = Date.now();

  // Define tasks
  const tasks = Array.from({ length: TOTAL_QUOTATIONS }, (_, i) => async () => {
    const amount = Math.floor(1000 + Math.random() * 9000);
    const quoteDoc = {
      naming_series: 'mwl-.####',
      quotation_to: 'Customer',
      party_name: customerName,
      transaction_date: new Date().toISOString().split('T')[0],
      po_no: `PO-TEST-${Date.now().toString().slice(-6)}-${i+1}`,
      mwl_status: 'approved', // Pre-approve to test full workflow payload mapping
      sales_status: 'PO recieved',
      work_status: 'Work Done',
      items: [
        {
          item_code: 'Custom Item',
          item_name: `High-Speed Load Test Service #${i+1}`,
          qty: 1,
          rate: amount,
          uom: 'Nos'
        }
      ]
    };

    await erpnextRequest('POST', '/api/resource/Quotation', quoteDoc);
  });

  console.log(`\n⚡ Firing ${TOTAL_QUOTATIONS} API creation payloads...`);
  const results = await processQueue(tasks, CONCURRENCY);

  const endTime = Date.now();
  const durationSec = (endTime - startTime) / 1000;
  const speed = (TOTAL_QUOTATIONS / durationSec).toFixed(2);
  const accuracy = ((results.successful / TOTAL_QUOTATIONS) * 100).toFixed(2);

  console.log(`\n==================================================`);
  console.log(`🏁 LOAD TEST RESULTS`);
  console.log(`==================================================`);
  console.log(`⏱️  Total Time Taken : ${durationSec.toFixed(2)} seconds`);
  console.log(`⚡ Creation Speed   : ${speed} Quotations / second`);
  console.log(`🎯 Accuracy Rate    : ${accuracy}% Successful`);
  console.log(`✅ Successful Loads : ${results.successful}`);
  console.log(`❌ Failed Loads     : ${results.failed}`);

  if (results.errors.length > 0) {
    console.log(`\nSample Errors encountered:`);
    results.errors.forEach(e => console.log(` - ${e}`));
  }
  console.log(`==================================================\n`);
}

main().catch(console.error);
