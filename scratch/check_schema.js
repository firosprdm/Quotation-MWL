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

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: q } = await supabase.from('quotations').select('*').limit(1);
  console.log('Quotations fields:', q ? Object.keys(q[0] || {}) : 'No data');
  const { data: c } = await supabase.from('company_settings').select('*').limit(1);
  console.log('Company settings fields:', c ? Object.keys(c[0] || {}) : 'No data');
}
check();
