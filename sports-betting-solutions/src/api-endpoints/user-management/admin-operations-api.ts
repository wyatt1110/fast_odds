import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Create a Supabase client with the service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json();
    
    // Check for admin authorization (you should implement a proper auth check here)
    // This is just a placeholder for demonstration
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Handle different admin actions
    switch (action) {
      case 'create_user':
        return await createUser(data);
      case 'update_user_role':
        return await updateUserRole(data);
      case 'delete_user':
        return await deleteUser(data);
      case 'run_sql':
        return await runSQL(data);
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Admin API error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Create a new user
async function createUser(data: any) {
  const { email, password, metadata } = data;
  
  const { data: user, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: metadata
  });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json({ user });
}

// Update a user's role
async function updateUserRole(data: any) {
  const { userId, role } = data;
  
  // This would typically involve updating a role in your custom tables
  // For demonstration, we'll just update user metadata
  const { data: user, error } = await supabaseAdmin.auth.admin.updateUserById(
    userId,
    { user_metadata: { role } }
  );
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json({ user });
}

// Delete a user
async function deleteUser(data: any) {
  const { userId } = data;
  
  const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json({ success: true });
}

// Run a SQL query (be very careful with this!)
async function runSQL(data: any) {
  const { sql } = data;
  
  // This is potentially dangerous and should be very restricted
  // For demonstration purposes only
  const { data: result, error } = await supabaseAdmin.rpc('exec_sql', { sql });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json({ result });
} 