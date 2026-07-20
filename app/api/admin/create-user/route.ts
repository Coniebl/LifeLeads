import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Define expected request body
interface CreateUserRequest {
  email: string;
  password?: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'admin' | 'user';
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
    const body: CreateUserRequest = await request.json();
    const { email, password, firstName, lastName, phone, role } = body;

    if (!email || !firstName || !lastName || !role) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 7. Create the user using the Admin API
    const { data: newUser, error: createError } = await adminAuthClient.auth.admin.createUser({
      email,
      password: password || undefined,
      phone: phone || undefined,
      email_confirm: true,
      phone_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
        role: role
      }
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      user: newUser.user 
    });

  } catch (err: any) {
    console.error("Error creating user:", err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
