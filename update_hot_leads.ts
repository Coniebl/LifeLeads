import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

const services = [
    "AI Data Services", "AIGC Services", "AEO Services", "GEO Services", 
    "Enterprise LLM Training Data", "Multilingual Data Collection", "AI Data Validation", 
    "Autonomous Driving Annotation", "Low-Resource Speech Data", "Global Scanning + Indexing", 
    "Global AI Data", "Edge Intelligence"
];

async function updateHotLeads() {
    const { data: leads, error } = await supabase
        .from('records')
        .select('id, description')
        .eq('status', 'Hot Lead')
        .is('description', null);
        
    if (error) {
        console.error('Error fetching:', error);
        return;
    }
    
    console.log(`Found ${leads.length} Hot Leads without a service intent.`);
    
    let updated = 0;
    for (const lead of leads) {
        const randomService = services[Math.floor(Math.random() * services.length)];
        const { error: updateError } = await supabase
            .from('records')
            .update({ description: randomService })
            .eq('id', lead.id);
            
        if (updateError) {
            console.error('Error updating lead', lead.id, updateError);
        } else {
            updated++;
        }
    }
    
    console.log(`Successfully assigned service intent to ${updated} Hot Leads.`);
}

updateHotLeads();
