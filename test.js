const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8').split('\n').reduce((acc, line) => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    acc[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^"|"$/g, '').replace(/\r/g, '');
  }
  return acc;
}, {});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function run() {
  const testRow = {
    company_name: "Unknown Company",
    contact_person: "",
    designation: "",
    contact_mobile: "",
    contact_telephone: "",
    contact_fax: "",
    contact_direct_line: "",
    contact_email: "",
    office_location: "",
    country: "",
    company_website: "",
    company_linkedin: "",
    industries: "",
    source_file: "test.xlsx",
    status: "Not Active"
  };

  const { error } = await supabase.from('company_contacts').insert([testRow]);
  console.log("Empty unknown company error:", error ? error.message : "Success");

  const validRow = {
    company_name: "Test Corp",
    contact_person: "John",
    designation: "CEO",
    contact_mobile: "123",
    contact_telephone: "",
    contact_fax: "",
    contact_direct_line: "",
    contact_email: "",
    office_location: "",
    country: "",
    company_website: "",
    company_linkedin: "",
    industries: "Tech",
    source_file: "test.xlsx",
    status: "Not Active"
  };

  const { error: e2 } = await supabase.from('company_contacts').insert([validRow]);
  console.log("Valid row error:", e2 ? e2.message : "Success");
}

run();
