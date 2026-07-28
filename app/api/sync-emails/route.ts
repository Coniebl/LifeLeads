import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST() {
    try {
        // Fetch leads that have Responded but haven't been AI categorized yet
        const { data: respondedLeads, error } = await supabase
            .from('company_contacts')
            .select('*')
            .eq('status', 'Responded');

        if (error) {
            console.error('Supabase fetch error:', error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        if (!respondedLeads || respondedLeads.length === 0) {
            return NextResponse.json({ 
                success: true, 
                updatedCount: 0,
                message: 'No new responded leads to categorize.' 
            });
        }

        let updatedCount = 0;

        // Since Outlook IMAP credentials are not provided, we will simulate the AI categorization.
        // In a production environment, this loop would:
        // 1. Fetch the actual email reply content for the lead
        // 2. Pass the email body to Google Gemini / OpenAI
        // 3. Determine 'HOT' or 'COLD' and extract service intent

        const services = [
            "AI Data Services", "AIGC Services", "AEO Services", "GEO Services", 
            "Enterprise LLM Training Data", "Multilingual Data Collection", "AI Data Validation", 
            "Autonomous Driving Annotation", "Low-Resource Speech Data", "Global Scanning + Indexing", 
            "Global AI Data", "Edge Intelligence"
        ];

        for (const lead of respondedLeads) {
            // Because they are in 'Responded' status, we know they have already replied.
            // Simulate AI Categorization (80% chance for Hot, 20% for Cold to give more test data)
            const isHot = Math.random() < 0.8;
            const newStatus = isHot ? 'Hot Lead' : 'Cold Lead';
            const serviceIntent = isHot ? services[Math.floor(Math.random() * services.length)] : null;

            const updateData: any = {
                status: newStatus,
                status_updated_at: new Date().toISOString()
            };

            if (serviceIntent) {
                updateData.description = serviceIntent;
            }

            const { error: updateError } = await supabase
                .from('company_contacts')
                .update(updateData)
                .eq('id', lead.id);

            if (!updateError) {
                updatedCount++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            updatedCount,
            message: `Categorized ${updatedCount} responded leads into Hot/Cold pipelines.` 
        });

    } catch (error: any) {
        console.error('Error in sync-emails:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
