import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing credentials");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function migrateRoles() {
  console.log("Starting role migration...");
  
  // Update all admins to superadmin
  const { data: admins, error: adminError } = await supabase
    .from('profiles')
    .update({ role: 'superadmin' })
    .eq('role', 'admin')
    .select();
    
  if (adminError) {
    console.error("Failed to migrate admins:", adminError);
  } else {
    console.log(`Admins migrated to superadmin successfully. Count: ${admins?.length}`);
  }

  // Update all users to admin
  const { data: users, error: userError } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('role', 'user')
    .select();
    
  if (userError) {
    console.error("Failed to migrate users:", userError);
  } else {
    console.log(`Users migrated to admin successfully. Count: ${users?.length}`);
  }
  
  console.log("Migration complete.");
}

migrateRoles();
