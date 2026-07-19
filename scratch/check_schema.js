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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkSchema() {
  const testRow = {
    company_name: 'Test Schema check'
  };
  const { data: insData, error: insErr } = await supabase.from('company_contacts').insert([testRow]).select();
  if (insErr) {
    console.log('Insert failed:', insErr.message);
  } else {
    console.log('Insert succeeded! Inserted row keys:', Object.keys(insData[0]));
    console.log('Row object:', insData[0]);
    await supabase.from('company_contacts').delete().eq('id', insData[0].id);
  }
}

checkSchema();
