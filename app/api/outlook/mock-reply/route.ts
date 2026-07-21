import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
    try {
        const { companyId } = await req.json();

        if (!companyId) {
            return NextResponse.json({ error: 'Missing companyId' }, { status: 400 });
        }

        const { error: updateError } = await supabase
            .from('company_contacts')
            .update({ 
                status: 'Responded',
                status_updated_at: new Date().toISOString()
            })
            .eq('id', companyId);

        if (updateError) throw updateError;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
