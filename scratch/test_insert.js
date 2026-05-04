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

async function testInsert() {
  console.log('Testing Supabase Insert...');
  
  // Test 1: quotations table with termsAndConditions
  const mockQuotation = {
    id: "test-id-" + Date.now(),
    number: "TEST-0001",
    clientId: "dummy-client-id",
    date: Date.now(),
    dueDate: Date.now(),
    items: [],
    subtotal: 0,
    vatRate: 15,
    vatAmount: 0,
    discount: 0,
    total: 0,
    grandTotal: 0,
    revision: 1,
    status: 'waiting',
    termsAndConditions: 'Test terms and conditions'
  };

  const { error: qError } = await supabase.from('quotations').insert(mockQuotation);
  
  if (qError) {
    console.error('❌ Quotations Insert Error:', qError.message);
  } else {
    console.log('✅ Quotations Insert Success! (termsAndConditions column exists and works)');
    // Cleanup
    await supabase.from('quotations').delete().eq('id', mockQuotation.id);
  }

  // Test 2: company_settings table with defaultNotes
  // Note: App upserts ID 1. Let's just fetch it and update it, then revert.
  const { data: settings } = await supabase.from('company_settings').select('*').eq('id', 1).single();
  if (settings) {
    const originalNotes = settings.defaultNotes;
    const { error: sError } = await supabase.from('company_settings').upsert({ id: 1, defaultNotes: 'Test Note' });
    if (sError) {
      console.error('❌ Company Settings Update Error:', sError.message);
    } else {
      console.log('✅ Company Settings Update Success! (defaultNotes column exists and works)');
      // Revert
      await supabase.from('company_settings').upsert({ id: 1, defaultNotes: originalNotes || null });
    }
  } else {
    console.log('⚠️ Could not find settings ID 1 to test update.');
  }
}

testInsert();
