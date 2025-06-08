import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';

// Initialize Supabase client (server-side)
const createServerSupabaseClient = () => {
  const cookieStore = cookies();
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false
      }
    }
  );
};

/**
 * Get the authenticated user from the request
 * @param request NextRequest object
 * @returns User object if authenticated, null otherwise
 */
export async function getAuthenticatedUser(request: NextRequest) {
  try {
    // Extract the token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
    
    if (!token) {
      return null;
    }
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      console.error('Error getting user:', error);
      return null;
    }
    
    return data.user;
  } catch (error) {
    console.error('Error in getAuthenticatedUser:', error);
    return null;
  }
}

/**
 * Get the user's profile data including settings
 * @param userId The user's ID
 * @returns User profile data
 */
export async function getUserProfile(userId: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: profile, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
    
    return profile;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
}

/**
 * Create a new user in auth and set up their profile
 */
export async function createNewUser(email: string, password: string, name?: string) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Create the user in auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name }
    });
    
    if (authError) {
      throw authError;
    }
    
    return authData.user;
  } catch (error) {
    console.error('Error creating new user:', error);
    throw error;
  }
} 