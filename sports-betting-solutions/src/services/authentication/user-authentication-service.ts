import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { NextRequest } from 'next/server';
import { config } from '@/lib/config';

// Initialize Supabase client (server-side)
const createServerSupabaseClient = () => {
  const cookieStore = cookies();
  return createClient(
      config.supabase.url,
  config.supabase.anonKey,
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
        config.supabase.url,
  config.supabase.anonKey
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
      config.supabase.url,
      config.supabase.serviceKey
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
      config.supabase.url,
      config.supabase.serviceKey
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