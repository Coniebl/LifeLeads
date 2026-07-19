const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://vicujxfzwgxtvzvnulha.supabase.co';
const supabaseKey = 'sb_publishable_Oi4_ocIOTWTPuAQkIVjMIA_pAr5Dfkx';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('Testing Supabase Connection...');
  
  // Try querying common tables
  const tables = ['companies', 'leads', 'portfolio', 'users', 'profiles'];
  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table)
        .select('*', { count: 'exact' })
        .limit(5);
        
      if (error) {
        console.log(`Table "${table}": Error -> ${error.message}`);
      } else {
        console.log(`Table "${table}": Success! Found ${data ? data.length : 0} rows (Total: ${count}). Sample:`, data);
      }
    } catch (err) {
      console.log(`Table "${table}": Exception -> ${err.message}`);
    }
  }
}

checkDatabase();
