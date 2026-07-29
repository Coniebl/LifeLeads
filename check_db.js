const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = '.env.local';
const env = fs.readFileSync(envPath, 'utf8');
let URL='', KEY='';
env.split(/\r?\n/).forEach(line => {
  const parts = line.split('=');
  if (parts[0].trim() === 'NEXT_PUBLIC_SUPABASE_URL') URL = parts.slice(1).join('=').trim().replace(/['"]/g, '');
  if (parts[0].trim() === 'SUPABASE_SERVICE_ROLE_KEY') KEY = parts.slice(1).join('=').trim().replace(/['"]/g, '');
});

const supabase = createClient(URL, KEY);

async function run() {
  const { data, error } = await supabase.from('company_contacts').select('id, source_file, category');
  if (error) {
    console.error('Error fetching data:', error);
    return;
  }
  
  const counts = {};
  data.forEach(row => {
    const key = (row.source_file||'none') + ' | ' + (row.category||'none');
    counts[key] = (counts[key] || 0) + 1;
  });
  console.log('Current Data Distribution:');
  console.log(counts);
}
run();
