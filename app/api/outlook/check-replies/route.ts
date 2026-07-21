import { NextResponse } from 'next/server';
import { ConfidentialClientApplication } from '@azure/msal-node';
import { Client } from '@microsoft/microsoft-graph-client';
import { createClient } from '@supabase/supabase-js';

const msalConfig = {
    auth: {
        clientId: process.env.AZURE_CLIENT_ID || '',
        authority: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}`,
        clientSecret: process.env.AZURE_CLIENT_SECRET || '',
    }
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET() {
    try {
        // Require Azure credentials for real Outlook integration
        if (!process.env.AZURE_CLIENT_ID || 
            process.env.AZURE_CLIENT_ID.includes('your_azure') || 
            !process.env.AZURE_TENANT_ID || 
            process.env.AZURE_TENANT_ID.includes('your_azure') || 
            !process.env.AZURE_CLIENT_SECRET) {
            // Return 200 OK instead of 400 so the browser console doesn't show a scary red error,
            // but return success: false so the frontend knows it didn't run.
            return NextResponse.json({ 
                success: false, 
                message: 'Missing or placeholder Azure credentials. Real Outlook detection is paused until .env.local is configured.' 
            }, { status: 200 });
        }

        // REAL OUTLOOK INTEGRATION MODE
        const cca = new ConfidentialClientApplication(msalConfig);
        const clientCredentialRequest = {
            scopes: ['https://graph.microsoft.com/.default'],
        };

        const authResponse = await cca.acquireTokenByClientCredential(clientCredentialRequest);
        if (!authResponse?.accessToken) {
            throw new Error('Failed to acquire access token.');
        }

        const graphClient = Client.init({
            authProvider: (done) => {
                done(null, authResponse.accessToken);
            }
        });

        // Fetch emails from the Inbox that are unread
        const response = await graphClient
            .api(`/users/${process.env.OUTLOOK_EMAIL_ADDRESS}/mailFolders/inbox/messages`)
            .filter('isRead eq false')
            .select('sender,subject,bodyPreview,receivedDateTime')
            .top(50)
            .get();

        const messages = response.value || [];
        let updatedCount = 0;

        for (const message of messages) {
            const senderEmail = message.sender?.emailAddress?.address;
            if (!senderEmail) continue;

            const { data: leads, error } = await supabase
                .from('company_contacts')
                .select('*')
                .eq('email', senderEmail)
                .eq('status', 'Pending');

            if (error) {
                console.error('Supabase fetch error:', error);
                continue;
            }

            if (leads && leads.length > 0) {
                for (const lead of leads) {
                    const { error: updateError } = await supabase
                        .from('company_contacts')
                        .update({ 
                            status: 'Responded',
                            status_updated_at: new Date().toISOString()
                        })
                        .eq('id', lead.id);

                    if (!updateError) {
                        updatedCount++;
                    }
                }
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Checked emails. Updated ${updatedCount} leads to Responded.` 
        });

    } catch (error: any) {
        console.error('Error in check-replies:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
