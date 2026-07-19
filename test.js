const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    acc[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^"|"$/g, '').replace(/\r/g, '');
  }
  return acc;
}, {});

const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
Promise.all([
  supabase.from('company_contacts').update({ processed_at: new Date().toISOString() }).eq('company_name', 'nonexistent'),
  supabase.from('company_contacts').update({ status_updated_at: new Date().toISOString() }).eq('company_name', 'nonexistent')
]).then(r => console.log(r.map(x => x.error?.message)));
