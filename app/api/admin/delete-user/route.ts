import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Define expected request body
interface DeleteUserRequest {
  userId: string;
}

export async function POST(request: Request) {
  try {
    // 1. Get the authorization header from the request to verify the admin caller
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Missing authorization header' }, { status: 401 });
    }
    const token = authHeader.replace('Bearer ', '');

    // 2. Initialize a standard client to verify the caller's token
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error("Missing environment variables");
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const standardClient = createClient(supabaseUrl, supabaseAnonKey);

    // 3. Verify the caller
    const { data: { user: caller }, error: callerError } = await standardClient.auth.getUser(token);
    if (callerError || !caller) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    // 4. Verify the caller is an admin by checking their profile
    const { data: profileData, error: profileError } = await standardClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single();

    if (profileError || !profileData || profileData.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // 5. Initialize the admin client with the service role key
    const adminAuthClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // 6. Parse the request body
    const body: DeleteUserRequest = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 });
    }

    // Prevent deleting oneself
    if (userId === caller.id) {
      return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
    }

    // 7. Delete the profile first to prevent foreign key constraint errors
    const { error: profileDeleteError } = await adminAuthClient.from('profiles').delete().eq('id', userId);
    
    if (profileDeleteError) {
      console.error("Profile delete error:", profileDeleteError);
      // We won't block deletion here just in case, but usually we should.
    }

    // 8. Delete the user using the Admin API
    const { error: deleteError } = await adminAuthClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Auth delete error:", deleteError);
      const errMsg = deleteError.message || (typeof deleteError === 'object' ? JSON.stringify(deleteError) : "Failed to delete user");
      // Sometimes Supabase returns {} if the error is unhandled, let's map {} to a readable string
      if (errMsg === "{}" || errMsg === "[object Object]") {
        return NextResponse.json({ error: "Failed to delete user due to server configuration or constraint." }, { status: 400 });
      }
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("Error deleting user:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
