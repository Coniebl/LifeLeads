const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envPath = '.env.local';
const env = fs.readFileSync(envPath, 'utf8');
let URL='', KEY='';
env.split(/\r?\n/).forEach(line => {
  const parts = line.split('=');
  if (parts[0].trim() === 'NEXT_PUBLIC_SUPABASE_URL') URL = parts.slice(1).join('=').trim().replace(/['"`]/g, '');
  if (parts[0].trim() === 'SUPABASE_SERVICE_ROLE_KEY') KEY = parts.slice(1).join('=').trim().replace(/['"`]/g, '');
});

const supabase = createClient(URL, KEY);

async function run() {
  const manualFiles = ['Leads.xlsx', 'Business Cards.xlsx', 'filipino community organiztions.xlsx'];
  const manualStr = '(' + manualFiles.map(f => '"' + f + '"').join(',') + ')';
  
  // 1. Update scraped companies
  const { data: cData, error: cErr } = await supabase
    .from('company_contacts')
    .update({ category: 'Scraped Companies' })
    .eq('category', 'Companies')
    .not('source_file', 'in', manualStr);
    
  if (cErr) console.error('Error updating scraped companies:', cErr);
  else console.log('Updated scraped companies successfully.');

  // 2. Update scraped orgs
  const { data: oData, error: oErr } = await supabase
    .from('company_contacts')
    .update({ category: 'Scraped Orgs' })
    .eq('category', 'Filipino Community Organizations')
    .not('source_file', 'in', manualStr);
    
  if (oErr) console.error('Error updating scraped orgs:', oErr);
  else console.log('Updated scraped orgs successfully.');

  // Check new distribution
  const { data, error } = await supabase.from('company_contacts').select('source_file, category');
  if (error) return;
  const counts = {};
  data.forEach(row => {
    const key = (row.source_file||'none') + ' | ' + (row.category||'none');
    counts[key] = (counts[key] || 0) + 1;
  });
  console.log('New Data Distribution:', counts);
}
run();
