import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials not found. Skipping DB setup.");
  process.exit(0);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  console.log("Setting up Supabase tables if they don't exist...");

  // Since we are using anon key, we cannot create tables via REST API easily.
  // We can only check if they exist or insert seed data.
  // We will assume the user has run Supabase migrations or we will create a SQL function they need to run.
  // However, I will check if company_contacts is accessible.
  try {
    const { data, error } = await supabase.from('company_contacts').select('id').limit(1);
    
    if (error) {
      console.error("Error accessing company_contacts table:", error.message);
      console.log("Please ensure your Supabase database has the necessary tables.");
    } else {
      console.log("Database connection successful. company_contacts exists.");
    }

  } catch (err) {
    console.error("Setup failed:", err);
  }
}

setupDatabase();
