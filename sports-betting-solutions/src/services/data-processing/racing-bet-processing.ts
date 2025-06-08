import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/supabase';
import { getEquibaseData } from '../equibase/api';
import { v4 as uuidv4 } from 'uuid';
import { EquibaseSearchResult } from '../equibase/scraper-agent';

// Fields that should be included in the sanitized bet data
const ALLOWED_FIELDS = [
  'id',
  'userId',
  'horse',
  'track',
  'date',
  'stake',
  'odds',
  'status',
  'result',
  'profit_loss',
  'returns',
  'race_distance',
  'race_surface',
  'race_restrictions',
  'race_conditions',
  'race_class',
];

// Check if a field name is allowed
const isAllowedField = (fieldName: string): boolean => {
  return ALLOWED_FIELDS.includes(fieldName);
};

// Sanitize bet data by removing any fields not in the allowed list
function sanitizeBetData(betData: any): any {
  const sanitized: any = {};
  
  for (const key in betData) {
    if (isAllowedField(key) && betData[key] !== undefined && betData[key] !== null) {
      sanitized[key] = betData[key];
    }
  }
  
  return sanitized;
}

// Main interface for racing bet data
interface RacingBetData {
  id?: string;
  userId: string;
  horse: string;
  track: string;
  date: string;
  stake: number;
  odds: string;
  status?: string;
  result?: string;
  profit_loss?: number;
  returns?: number;
  race_distance?: string;
  race_surface?: string;
  race_restrictions?: string;
  race_conditions?: string;
  race_class?: string;
}

// Interface for search results from Equibase
interface EquibaseData {
  horseName: string;
  trackName: string;
  raceDate?: string;
  horseData?: any;
  raceDistance?: string;
  raceSurface?: string;
  raceConditions?: string;
  raceRestrictions?: string;
  raceClass?: string;
}

/**
 * Get a racing bet from the database by ID
 */
export async function getRacingBetWorkflow(
  userId: string, 
  betId: string,
  customTable: string = 'racing_bets'
): Promise<RacingBetData | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseKey);
    
    // Fetch the bet from the database
    const { data: bet, error } = await supabase
      .from(customTable)
      .select('*')
      .eq('id', betId)
      .eq('userId', userId)
      .single();
    
    if (error) {
      console.error('Error fetching bet:', error);
      return null;
    }
    
    if (!bet) {
      return null;
    }
    
    // Return the sanitized bet data
    return sanitizeBetData(bet) as RacingBetData;
  } catch (error) {
    console.error('Error in getRacingBetWorkflow:', error);
    return null;
  }
}

/**
 * Fetch additional information from Equibase for a racing bet
 */
export async function getEquibaseBetData(
  betData: RacingBetData
): Promise<EquibaseData | null> {
  try {
    // Only proceed if we have the necessary data
    if (!betData.horse || !betData.track) {
      console.warn('Missing required horse or track data for Equibase lookup');
      return null;
    }
    
    // Create a simulated result for testing
    if (process.env.NODE_ENV === 'development' && process.env.USE_MOCK_DATA === 'true') {
      return {
        horseName: betData.horse,
        trackName: betData.track,
        raceDate: betData.date,
        horseData: {
          jockey: 'Test Jockey',
          trainer: 'Test Trainer',
          owner: 'Test Owner',
          weight: '126',
          morning_line_odds: '5-2'
        },
        raceDistance: '1 Mile',
        raceSurface: 'Dirt',
        raceConditions: 'For Three Year Olds',
        raceRestrictions: '3yo',
        raceClass: 'G1'
      };
    }
    
    // Call the Equibase API
    const data = await getEquibaseData({
      horseName: betData.horse,
      trackName: betData.track,
      raceDate: betData.date
    });
    
    if (!data || !data.metadata.search_success) {
      console.log('No Equibase data found');
      return null;
    }
    
    // Extract and return the relevant data
    return {
      horseName: data.data?.horse_data.horse_name || betData.horse,
      trackName: data.data?.race_data.track_name || betData.track,
      raceDate: data.data?.race_data.race_date || betData.date,
      horseData: data.data?.horse_data,
      raceDistance: data.data?.race_data.race_distance,
      raceSurface: data.data?.race_data.surface,
      raceConditions: data.data?.race_data.race_conditions,
      raceRestrictions: data.data?.race_data.race_restrictions,
      raceClass: data.data?.race_data.class_rating
    };
  } catch (error) {
    console.error('Error getting Equibase data:', error);
    return null;
  }
}

/**
 * Create a mock racing bet for testing
 */
export function createMockRacingBet(userId: string): RacingBetData {
  const betId = uuidv4();
  
  // Generate random date in the future (1-10 days)
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + Math.floor(Math.random() * 10) + 1);
  const dateString = futureDate.toISOString().split('T')[0];
  
  return {
    id: betId,
    userId: userId,
    horse: `Test Horse ${Math.floor(Math.random() * 100)}`,
    track: `Test Track ${Math.floor(Math.random() * 20)}`,
    date: dateString,
    stake: Math.floor(Math.random() * 100) + 10,
    odds: `${Math.floor(Math.random() * 10)}-${Math.floor(Math.random() * 10)}`,
    status: 'Pending',
    race_distance: `${Math.floor(Math.random() * 2) + 1} Miles`,
    race_surface: Math.random() > 0.5 ? 'Dirt' : 'Turf',
    race_conditions: 'For Three Year Olds and Upward',
    race_restrictions: '3yo+'
  };
}

/**
 * Update the status of a racing bet
 */
export async function updateRacingBetStatusWorkflow(
  userId: string,
  betId: string,
  status: string,
  customTable: string = 'racing_bets'
): Promise<RacingBetData | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseKey);
    
    // Fetch the current bet first
    const { data: existingBet, error: fetchError } = await supabase
      .from(customTable)
      .select('*')
      .eq('id', betId)
      .eq('userId', userId)
      .single();
    
    if (fetchError) {
      console.error('Error fetching existing bet:', fetchError);
      return null;
    }
    
    if (!existingBet) {
      console.error('Bet not found');
      return null;
    }
    
    // For complete bets, calculate the result and profit/loss
    let result = undefined;
    let calculatedProfitLoss = undefined;
    
    if (status === 'Complete') {
      // Simulate a result for testing
      result = Math.random() > 0.5 ? 'Win' : 'Lose';
      
      // Calculate profit/loss based on result
      if (result === 'Win') {
        // Parse odds in format like "5-2" and calculate payout
        const oddsString = existingBet.odds || '1-1';
        const [numerator, denominator] = oddsString.split('-').map(Number);
        const multiplier = numerator / denominator;
        calculatedProfitLoss = Math.round(existingBet.stake * multiplier * 100) / 100;
      } else {
        calculatedProfitLoss = -existingBet.stake;
      }
    }
    
    // Prepare the update data
    const updateData: any = { 
      status,
      result
    };
    
    // Only add profit_loss if we calculated it
    if (calculatedProfitLoss !== undefined) {
      updateData.profit_loss = calculatedProfitLoss;
      
      // Calculate returns (stake + profit for wins, 0 for losses)
      if (result === 'Win') {
        updateData.returns = existingBet.stake + calculatedProfitLoss;
      } else {
        updateData.returns = 0;
      }
    }
    
    // Update the bet
    const { data: updatedBet, error: updateError } = await supabase
      .from(customTable)
      .update(updateData)
      .eq('id', betId)
      .eq('userId', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating bet:', updateError);
      return null;
    }
    
    return sanitizeBetData(updatedBet) as RacingBetData;
  } catch (error) {
    console.error('Error in updateRacingBetStatusWorkflow:', error);
    return null;
  }
}

/**
 * Merge Equibase data with existing bet data
 */
export function mergeWithEquibaseData(
  betData: RacingBetData, 
  equibaseData: EquibaseData | null
): RacingBetData {
  if (!equibaseData) {
    return betData;
  }
  
  const mergedBetData = { ...betData };
  
  // Add race details if not already present
  if (!mergedBetData.race_distance && equibaseData.raceDistance) {
    mergedBetData.race_distance = equibaseData.raceDistance;
  }
  
  if (!mergedBetData.race_surface && equibaseData.raceSurface) {
    mergedBetData.race_surface = equibaseData.raceSurface;
  }
  
  if (!mergedBetData.race_conditions && equibaseData.raceConditions) {
    mergedBetData.race_conditions = equibaseData.raceConditions;
  }
  
  if (!mergedBetData.race_restrictions && equibaseData.raceRestrictions) {
    mergedBetData.race_restrictions = equibaseData.raceRestrictions;
  }
  
  if (!mergedBetData.race_class && equibaseData.raceClass) {
    mergedBetData.race_class = equibaseData.raceClass;
  }
  
  return mergedBetData;
}

/**
 * Create a new racing bet
 */
export async function createRacingBetWorkflow(
  userId: string,
  betData: Partial<RacingBetData>,
  customTable: string = 'racing_bets'
): Promise<RacingBetData | null> {
  try {
    // Ensure we have the required fields
    if (!betData.horse || !betData.track || !betData.date || !betData.stake || !betData.odds) {
      throw new Error('Missing required fields for racing bet');
    }
    
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured');
    }
    
    const supabase = createClient<Database>(supabaseUrl, supabaseKey);
    
    // Clean up the bet data
    const cleanedBetData: RacingBetData = {
      id: betData.id || uuidv4(),
      userId: userId,
      horse: betData.horse,
      track: betData.track,
      date: betData.date,
      stake: parseFloat(betData.stake?.toString() || '0'),
      odds: betData.odds,
      status: betData.status || 'Pending',
      race_distance: betData.race_distance,
      race_surface: betData.race_surface,
      race_restrictions: betData.race_restrictions,
      race_conditions: betData.race_conditions,
      race_class: betData.race_class,
    };
    
    // Try to enrich with Equibase data if available
    try {
      const equibaseData = await getEquibaseBetData(cleanedBetData);
      if (equibaseData) {
        // Merge Equibase data with bet data
        const mergedBetData = mergeWithEquibaseData(cleanedBetData, equibaseData);
        cleanedBetData.race_distance = mergedBetData.race_distance;
        cleanedBetData.race_surface = mergedBetData.race_surface;
        cleanedBetData.race_conditions = mergedBetData.race_conditions;
        cleanedBetData.race_restrictions = mergedBetData.race_restrictions;
        cleanedBetData.race_class = mergedBetData.race_class;
      }
    } catch (equibaseError) {
      console.error('Error enriching with Equibase data (continuing):', equibaseError);
      // Continue with original data if Equibase fails
    }
    
    // Insert the bet
    const { data: newBet, error } = await supabase
      .from(customTable)
      .insert({
        id: cleanedBetData.id,
        userId: cleanedBetData.userId,
        horse: cleanedBetData.horse,
        track: cleanedBetData.track,
        date: cleanedBetData.date,
        stake: cleanedBetData.stake,
        odds: cleanedBetData.odds,
        status: cleanedBetData.status,
        race_distance: cleanedBetData.race_distance,
        race_surface: cleanedBetData.race_surface,
        race_conditions: cleanedBetData.race_conditions,
        race_restrictions: cleanedBetData.race_restrictions,
        race_class: cleanedBetData.race_class,
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating bet:', error);
      return null;
    }
    
    return sanitizeBetData(newBet) as RacingBetData;
  } catch (error) {
    console.error('Error in createRacingBetWorkflow:', error);
    return null;
  }
} 