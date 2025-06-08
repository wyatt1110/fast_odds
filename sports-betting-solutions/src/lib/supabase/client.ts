import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// We're using environment variables in the browser, which need to be prefixed with NEXT_PUBLIC_
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to get the current user
export const getCurrentUser = async () => {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  
  if (!session) {
    return null;
  }
  
  // Add email as the primary identifier
  return {
    ...session.user,
    primaryId: session.user.email // Use email as the primary ID
  };
};

// Helper function to get user settings
export const getUserSettings = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single();
  
  if (error) {
    console.error('Error getting user settings:', error);
    return null;
  }
  
  return data;
};

// Helper function to get user bankrolls
export const getUserBankrolls = async (userId: string) => {
  const { data, error } = await supabase
    .from('bankrolls')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error getting user bankrolls:', error);
    return [];
  }
  
  return data;
};

// Helper function to get user bets
export const getUserBets = async (userId: string, bankrollId?: string) => {
  let query = supabase
    .from('bets')
    .select(`
      *,
      bankrolls (name)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (bankrollId) {
    query = query.eq('bankroll_id', bankrollId);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('Error getting user bets:', error);
    return [];
  }
  
  return data;
};

// Helper function to get pending bets (bets without profit_loss or with status 'pending')
export const getPendingBets = async (userId: string) => {
  const { data, error } = await supabase
    .from('bets')
    .select(`
      *,
      bankrolls (name)
    `)
    .eq('user_id', userId)
    .or('profit_loss.is.null,status.eq.pending')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error getting pending bets:', error);
    return [];
  }
  
  return data;
};

// Helper function to get sport-specific bet details
export const getSportBetDetails = async (betId: string, sport: string) => {
  let tableName = '';
  
  switch (sport.toLowerCase()) {
    case 'horse racing':
      tableName = 'horse_racing_bets';
      break;
    case 'football':
    case 'soccer':
      tableName = 'football_bets';
      break;
    case 'basketball':
      tableName = 'basketball_bets';
      break;
    default:
      return null;
  }
  
  const { data, error } = await supabase
    .from(tableName)
    .select('*')
    .eq('bet_id', betId)
    .single();
  
  if (error) {
    console.error(`Error getting ${sport} bet details:`, error);
    return null;
  }
  
  return data;
}; 

// Helper function to get user racing bets
export const getUserRacingBets = async (userId: string) => {
  const { data, error } = await supabase
    .from('racing_bets')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching user racing bets:', error);
    return [];
  }
  
  return data || [];
}; 