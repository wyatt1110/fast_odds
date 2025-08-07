import { supabase } from '@/lib/supabase/client';
import { redirect } from 'next/navigation';

// Define membership tiers and their numeric values for comparison
export enum MembershipTier {
  Free = 0,
  Premium = 1, // Tier 1
  Pro = 2,     // Tier 2
  Elite = 3,   // Tier 3
  VIP = 4      // Tier 4
}

// Map string tier names to enum values
export const membershipTierMap: Record<string, MembershipTier> = {
  'Free': MembershipTier.Free,
  'Premium': MembershipTier.Premium,
  'Pro': MembershipTier.Pro,
  'Elite': MembershipTier.Elite,
  'VIP': MembershipTier.VIP,
};

// Interface for user profile with membership info
export interface UserProfileWithMembership {
  id: string;
  user_id: string;
  membership_tier: string | null;
  membership_end_date: string | null;
  [key: string]: any; // Allow other properties
}

// Check if a user is authenticated
export async function isAuthenticated(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

// Get the current user's profile with membership information
export async function getUserProfileWithMembership(): Promise<UserProfileWithMembership | null> {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    return null;
  }
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', session.user.id)
    .single();
  
  if (error || !data) {
    console.error('Error fetching user profile:', error);
    return null;
  }
  
  return data as UserProfileWithMembership;
}

// Convert string tier to enum value for comparison
export function getTierValue(tier: string | null): MembershipTier {
  if (!tier) return MembershipTier.Free;
  return membershipTierMap[tier] ?? MembershipTier.Free;
}

// Check if user has the required minimum membership tier (no expiration check)
export async function hasRequiredTier(minimumTier: MembershipTier): Promise<boolean> {
  const profile = await getUserProfileWithMembership();
  if (!profile) return false;
  
  const userTierValue = getTierValue(profile.membership_tier);
  return userTierValue >= minimumTier;
}

// Check if membership is active (not expired) - DEPRECATED: Use separate script for expiration checks
export async function hasMembershipExpired(): Promise<boolean> {
  // This function is deprecated. Expiration should be handled by a separate script
  // that updates the membership_tier column directly.
  return false;
}

// Middleware-style function to require authentication
export async function requireAuth(redirectTo: string = '/login'): Promise<void> {
  const isLoggedIn = await isAuthenticated();
  
  if (!isLoggedIn) {
    redirect(redirectTo);
  }
}

// Middleware-style function to require minimum tier
export async function requireTier(
  minimumTier: MembershipTier,
  redirectTo: string = '/membership',
  message: string = 'You need a higher membership tier to access this page'
): Promise<void> {
  const isLoggedIn = await isAuthenticated();
  
  if (!isLoggedIn) {
    redirect('/login');
  }
  
  const hasTier = await hasRequiredTier(minimumTier);
  
  if (!hasTier) {
    // Could store message in session/localStorage for displaying on redirect page
    redirect(redirectTo);
  }
}

// Helper function to get user's tier as a string
export async function getUserTierString(): Promise<string> {
  const profile = await getUserProfileWithMembership();
  return profile?.membership_tier || 'Free';
}

// Helper function to check if user is on a paid tier
export async function isOnPaidTier(): Promise<boolean> {
  const profile = await getUserProfileWithMembership();
  if (!profile || !profile.membership_tier) return false;
  return getTierValue(profile.membership_tier) > MembershipTier.Free;
}
