
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    });
  }
}

loadEnv();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkData() {
  console.log('Checking Supabase connection...');
  console.log('URL:', supabaseUrl);
  
  try {
    const { data: clients, error: clientsError } = await supabase.from('clients').select('*');
    if (clientsError) console.error('Clients Error:', clientsError);
    else console.log('Clients count:', clients?.length);

    const { data: quotations, error: quotationsError } = await supabase.from('quotations').select('*');
    if (quotationsError) console.error('Quotations Error:', quotationsError);
    else console.log('Quotations count:', quotations?.length);

    const { data: inventory, error: inventoryError } = await supabase.from('inventory').select('*');
    if (inventoryError) console.error('Inventory Error:', inventoryError);
    else console.log('Inventory count:', inventory?.length);
  } catch (e) {
    console.error('Unexpected error:', e);
  }
}

checkData();
