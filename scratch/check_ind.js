const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const envFile = fs.readFileSync('.env.local', 'utf8');
envFile.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim().replace(/^"|"$/g, '').replace(/\r/g, '');
    process.env[key] = value;
  }
});

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

async function checkInd() {
  const { data, error } = await supabase.from('company_industries').select('*').limit(5);
  console.log('company_industries:', error ? error.message : data);
  const { data: d2, error: e2 } = await supabase.from('company_contacts').select('*').limit(5);
  console.log('company_contacts:', e2 ? e2.message : d2);
}

checkInd();
