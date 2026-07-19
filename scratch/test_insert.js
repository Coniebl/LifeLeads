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

async function testInsert() {
  const { data, error } = await supabase.from('company_industries').upsert([{
    company_name: 'Test Corp',
    original_industry_input: 'Tech',
    general_industry_type: 'Technology',
    subcategory: 'Companies'
  }]).select();
  if (error) {
    console.log('company_industries insert error:', error.message);
  } else {
    console.log('company_industries insert success! Columns:', Object.keys(data[0]));
    await supabase.from('company_industries').delete().eq('company_name', 'Test Corp');
  }

  // Let's test what columns can be inserted into company_contacts without error
  const testContact = {
    company_name: 'Test Corp Contact',
    contact_person: 'John',
    status: 'Pending'
  };
  const { data: cData, error: cErr } = await supabase.from('company_contacts').insert([testContact]).select();
  if (cErr) {
    console.log('company_contacts insert error:', cErr.message);
  } else {
    console.log('company_contacts insert success! Columns:', Object.keys(cData[0]));
    await supabase.from('company_contacts').delete().eq('id', cData[0].id);
  }
}

testInsert();
