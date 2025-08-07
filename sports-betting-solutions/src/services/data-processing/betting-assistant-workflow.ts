import { createClient } from '@supabase/supabase-js';

import { config } from '@/lib/config';

// Initialize Supabase client
const supabaseUrl = config.supabase.url;
const supabaseServiceKey = config.supabase.serviceKey;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Workflow for adding a bet through the AI assistant
 */
export async function addBetWorkflow(userId: string, betData: any) {
  try {
    // Validate required fields
    const requiredFields = ['sport', 'event_name', 'selection', 'stake', 'odds', 'bet_type'];
    const missingFields = requiredFields.filter(field => !betData[field]);
    
    if (missingFields.length > 0) {
      return {
        success: false,
        error: `Missing required fields: ${missingFields.join(', ')}`,
        missingFields
      };
    }

    // Get user's default bankroll if not specified
    if (!betData.bankroll_id) {
      const { data: userSettings, error: settingsError } = await supabase
        .from('user_settings')
        .select('default_bankroll_id')
        .eq('user_id', userId)
        .single();
      
      if (settingsError) {
        return {
          success: false,
          error: 'Could not retrieve default bankroll',
          details: settingsError.message
        };
      }
      
      betData.bankroll_id = userSettings?.default_bankroll_id;
      
      // If still no bankroll, try to get any bankroll for the user
      if (!betData.bankroll_id) {
        const { data: bankrolls, error: bankrollError } = await supabase
          .from('bankrolls')
          .select('id')
          .eq('user_id', userId)
          .limit(1);
        
        if (bankrollError || !bankrolls || bankrolls.length === 0) {
          return {
            success: false,
            error: 'No bankroll found for user',
            details: bankrollError?.message || 'User has no bankrolls'
          };
        }
        
        betData.bankroll_id = bankrolls[0].id;
      }
    }

    // Create the base bet
    const baseBet = {
      user_id: userId,
      sport: betData.sport,
      event_name: betData.event_name,
      selection: betData.selection,
      stake: betData.stake,
      odds: betData.odds,
      bet_type: betData.bet_type,
      bankroll_id: betData.bankroll_id,
      status: betData.status || 'pending',
      competition: betData.competition,
      event_date: betData.event_date,
      notes: betData.notes,
      metadata: betData.metadata || {}
    };

    // Insert the base bet
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .insert(baseBet)
      .select()
      .single();

    if (betError) {
      return {
        success: false,
        error: 'Failed to create bet',
        details: betError.message
      };
    }

    // Handle sport-specific details if provided
    if (betData.sport === 'horse_racing' && betData.horse_racing_details) {
      const hrDetails = {
        bet_id: bet.id,
        track_name: betData.horse_racing_details.track_name,
        race_number: betData.horse_racing_details.race_number,
        horse_name: betData.horse_racing_details.horse_name,
        jockey: betData.horse_racing_details.jockey,
        trainer: betData.horse_racing_details.trainer,
        race_distance: betData.horse_racing_details.race_distance,
        race_type: betData.horse_racing_details.race_type,
        track_condition: betData.horse_racing_details.track_condition,
        barrier_position: betData.horse_racing_details.barrier_position,
        weight_carried: betData.horse_racing_details.weight_carried
      };

      await supabase
        .from('horse_racing_bets')
        .insert(hrDetails);
    } else if (betData.sport === 'football' && betData.football_details) {
      const fbDetails = {
        bet_id: bet.id,
        home_team: betData.football_details.home_team,
        away_team: betData.football_details.away_team,
        league: betData.football_details.league,
        match_time: betData.football_details.match_time,
        bet_market: betData.football_details.bet_market,
        handicap: betData.football_details.handicap
      };

      await supabase
        .from('football_bets')
        .insert(fbDetails);
    } else if (betData.sport === 'basketball' && betData.basketball_details) {
      const bbDetails = {
        bet_id: bet.id,
        home_team: betData.basketball_details.home_team,
        away_team: betData.basketball_details.away_team,
        league: betData.basketball_details.league,
        match_time: betData.basketball_details.match_time,
        bet_market: betData.basketball_details.bet_market,
        handicap: betData.basketball_details.handicap,
        quarter: betData.basketball_details.quarter,
        player_name: betData.basketball_details.player_name
      };

      await supabase
        .from('basketball_bets')
        .insert(bbDetails);
    }

    return {
      success: true,
      bet
    };
  } catch (error: any) {
    console.error('Error in addBetWorkflow:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    };
  }
}

/**
 * Workflow for retrieving user's betting statistics
 */
export async function getBettingStatsWorkflow(userId: string, filters: any = {}) {
  try {
    // Build the base bet query
    let query = supabase
      .from('bets')
      .select('*')
      .eq('user_id', userId);

    // Apply filters if provided
    if (filters.sport) {
      query = query.eq('sport', filters.sport);
    }
    
    if (filters.fromDate) {
      query = query.gte('created_at', filters.fromDate);
    }
    
    if (filters.toDate) {
      query = query.lte('created_at', filters.toDate);
    }
    
    if (filters.bankrollId) {
      query = query.eq('bankroll_id', filters.bankrollId);
    }

    // Execute the query
    const { data: bets, error } = await query;

    if (error) {
      return {
        success: false,
        error: 'Failed to fetch betting data',
        details: error.message
      };
    }

    // Calculate basic statistics
    if (!bets || bets.length === 0) {
      return {
        success: true,
        stats: {
          totalBets: 0,
          pendingBets: 0,
          settledBets: 0,
          wonBets: 0,
          lostBets: 0,
          totalStaked: 0,
          totalReturns: 0,
          profit: 0,
          roi: 0
        }
      };
    }

    const totalBets = bets.length;
    const pendingBets = bets.filter(bet => bet.status === 'pending').length;
    const settledBets = totalBets - pendingBets;
    const wonBets = bets.filter(bet => bet.status === 'won' || bet.status === 'half_won').length;
    const lostBets = bets.filter(bet => bet.status === 'lost' || bet.status === 'half_lost').length;
    
    const totalStaked = bets.reduce((sum, bet) => sum + (parseFloat(bet.stake) || 0), 0);
    const totalReturns = bets.reduce((sum, bet) => {
      if (bet.status === 'won') {
        return sum + ((parseFloat(bet.stake) * parseFloat(bet.odds)) || 0);
      } else if (bet.status === 'half_won') {
        return sum + ((parseFloat(bet.stake) * parseFloat(bet.odds) * 0.5) || 0);
      } else if (bet.status === 'void' || bet.status === 'push') {
        return sum + (parseFloat(bet.stake) || 0);
      }
      return sum;
    }, 0);
    
    const profit = totalReturns - totalStaked;
    const roi = totalStaked > 0 ? (profit / totalStaked) * 100 : 0;

    return {
      success: true,
      stats: {
        totalBets,
        pendingBets,
        settledBets,
        wonBets,
        lostBets,
        totalStaked,
        totalReturns,
        profit,
        roi: parseFloat(roi.toFixed(2))
      }
    };
  } catch (error: any) {
    console.error('Error in getBettingStatsWorkflow:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    };
  }
}

/**
 * Workflow for updating a bet's status (e.g., marking as won/lost)
 */
export async function updateBetStatusWorkflow(userId: string, betId: string, status: string, profitLoss?: number) {
  try {
    // Check if the bet exists and belongs to the user
    const { data: existingBet, error: fetchError } = await supabase
      .from('bets')
      .select('id, user_id, stake, odds')
      .eq('id', betId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      return {
        success: false,
        error: 'Bet not found or does not belong to user',
        details: fetchError.message
      };
    }

    // Calculate profit/loss if not provided
    let calculatedProfitLoss = profitLoss;
    
    if (calculatedProfitLoss === undefined) {
      const stake = parseFloat(existingBet.stake);
      const odds = parseFloat(existingBet.odds);
      
      if (status === 'won') {
        calculatedProfitLoss = stake * (odds - 1);
      } else if (status === 'half_won') {
        calculatedProfitLoss = stake * (odds - 1) * 0.5;
      } else if (status === 'lost') {
        calculatedProfitLoss = -stake;
      } else if (status === 'half_lost') {
        calculatedProfitLoss = -stake * 0.5;
      } else if (status === 'void' || status === 'push') {
        calculatedProfitLoss = 0;
      }
    }

    // Update the bet
    const { data: updatedBet, error: updateError } = await supabase
      .from('bets')
      .update({
        status,
        profit_loss: calculatedProfitLoss,
        settled_at: new Date().toISOString()
      })
      .eq('id', betId)
      .select()
      .single();

    if (updateError) {
      return {
        success: false,
        error: 'Failed to update bet status',
        details: updateError.message
      };
    }

    return {
      success: true,
      bet: updatedBet
    };
  } catch (error: any) {
    console.error('Error in updateBetStatusWorkflow:', error);
    return {
      success: false,
      error: 'An unexpected error occurred',
      details: error.message
    };
  }
} 