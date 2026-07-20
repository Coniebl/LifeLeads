const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
let URL = '';
let KEY = '';
env.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) URL = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) KEY = line.split('=')[1].trim();
});

const supabase = createClient(URL, KEY);

async function check() {
  const { data, error } = await supabase.from('company_contacts').select('company_name');
  if (error) console.error(error);
  else {
    const counts = {};
    data.forEach(r => {
      const name = r.company_name.trim();
      counts[name] = (counts[name] || 0) + 1;
    });
    
    let dups = [];
    let blankCount = 0;
    for (const [name, count] of Object.entries(counts)) {
      if (count > 1) {
        dups.push({ name, count });
      }
      if (!name) blankCount += count;
    }
    
    console.log(`Total rows: ${data.length}`);
    console.log(`Unique names: ${Object.keys(counts).length}`);
    console.log(`Blank names: ${blankCount}`);
    console.log(`Duplicates:`, dups);
  }
}

check();
