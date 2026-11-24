const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
    const [key, ...values] = line.split('=');
    if (key && values.length > 0) {
        env[key.trim()] = values.join('=').trim().replace(/^["']|["']$/g, '');
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const services = [
    "AI Data Services", "AIGC Services", "AEO Services", "GEO Services", 
    "Enterprise LLM Training Data", "Multilingual Data Collection", "AI Data Validation", 
    "Autonomous Driving Annotation", "Low-Resource Speech Data", "Global Scanning + Indexing", 
    "Global AI Data", "Edge Intelligence"
];

async function updateHotLeads() {
    const { data: leads, error } = await supabase
        .from('company_contacts')
        .select('id, status, description');
        
    if (error) {
        console.error('Error fetching:', error);
        return;
    }
    
    console.log(`Total records: ${leads.length}`);
    const hotLeads = leads.filter(l => l.status === 'Hot Lead');
    console.log(`Hot Leads count: ${hotLeads.length}`);
    
    let updated = 0;
    for (const lead of hotLeads) {
        const randomService = services[Math.floor(Math.random() * services.length)];
        const { error: updateError } = await supabase
            .from('company_contacts')
            .update({ description: randomService })
            .eq('id', lead.id);
            
        if (updateError) {
            console.error('Error updating lead', lead.id, updateError);
        } else {
            updated++;
        }
    }
    
    console.log(`Successfully assigned service intent to ${updated} Hot Leads.`);
    process.exit(0);
}

updateHotLeads();
