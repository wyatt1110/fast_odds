import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth/auth-utils';

import { config } from '@/lib/config';

// Initialize Supabase client
const supabaseUrl = config.supabase.url;
const supabaseServiceKey = config.supabase.serviceKey;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET handler to fetch betting statistics for the authenticated user
 * Supports filtering by sport, date range, and other parameters
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const bankrollId = searchParams.get('bankroll_id');

    // Build the base bet query
    let query = supabase
      .from('bets')
      .select('*')
      .eq('user_id', user.id);

    // Apply filters if provided
    if (sport) {
      query = query.eq('sport', sport);
    }
    
    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }
    
    if (toDate) {
      query = query.lte('created_at', toDate);
    }
    
    if (bankrollId) {
      query = query.eq('bankroll_id', bankrollId);
    }

    // Execute the query
    const { data: bets, error } = await query;

    if (error) {
      console.error('Error fetching bets for stats:', error);
      return NextResponse.json(
        { error: 'Failed to fetch betting data' },
        { status: 500 }
      );
    }

    // Calculate statistics
    const stats = calculateBettingStats(bets);

    // Fetch bankroll information
    const { data: bankrolls, error: bankrollError } = await supabase
      .from('bankrolls')
      .select('*')
      .eq('user_id', user.id);

    if (bankrollError) {
      console.error('Error fetching bankrolls:', bankrollError);
      // Continue without bankroll data
    }

    return NextResponse.json({ 
      stats,
      bankrolls: bankrolls || []
    });
  } catch (error) {
    console.error('Error in GET /api/stats:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * Calculate betting statistics from an array of bets
 */
function calculateBettingStats(bets: any[]) {
  if (!bets || bets.length === 0) {
    return {
      totalBets: 0,
      pendingBets: 0,
      settledBets: 0,
      wonBets: 0,
      lostBets: 0,
      voidBets: 0,
      totalStaked: 0,
      totalReturns: 0,
      profit: 0,
      roi: 0,
      winRate: 0,
      avgOdds: 0,
      sportBreakdown: {},
      streaks: {
        current: { type: 'none', count: 0 },
        longest: { type: 'none', count: 0 }
      },
      betTypeBreakdown: {}
    };
  }

  let totalBets = bets.length;
  let pendingBets = bets.filter(bet => bet.status === 'pending').length;
  let settledBets = totalBets - pendingBets;
  let wonBets = bets.filter(bet => bet.status === 'won' || bet.status === 'half_won').length;
  let lostBets = bets.filter(bet => bet.status === 'lost' || bet.status === 'half_lost').length;
  let voidBets = bets.filter(bet => bet.status === 'void' || bet.status === 'push').length;
  
  let totalStaked = bets.reduce((sum, bet) => sum + (parseFloat(bet.stake) || 0), 0);
  let totalReturns = bets.reduce((sum, bet) => {
    if (bet.status === 'won') {
      return sum + ((parseFloat(bet.stake) * parseFloat(bet.odds)) || 0);
    } else if (bet.status === 'half_won') {
      return sum + ((parseFloat(bet.stake) * parseFloat(bet.odds) * 0.5) || 0);
    } else if (bet.status === 'void' || bet.status === 'push') {
      return sum + (parseFloat(bet.stake) || 0);
    }
    return sum;
  }, 0);
  
  let profit = totalReturns - totalStaked;
  let roi = totalStaked > 0 ? (profit / totalStaked) * 100 : 0;
  let winRate = settledBets > 0 ? (wonBets / (settledBets - voidBets)) * 100 : 0;
  
  let totalOdds = bets.reduce((sum, bet) => sum + (parseFloat(bet.odds) || 0), 0);
  let avgOdds = totalBets > 0 ? totalOdds / totalBets : 0;
  
  // Calculate sport breakdown
  let sportBreakdown: Record<string, any> = {};
  bets.forEach(bet => {
    if (!sportBreakdown[bet.sport]) {
      sportBreakdown[bet.sport] = {
        count: 0,
        stake: 0,
        profit: 0
      };
    }
    
    sportBreakdown[bet.sport].count++;
    sportBreakdown[bet.sport].stake += parseFloat(bet.stake) || 0;
    
    if (bet.profit_loss) {
      sportBreakdown[bet.sport].profit += parseFloat(bet.profit_loss);
    }
  });
  
  // Calculate bet type breakdown
  let betTypeBreakdown: Record<string, any> = {};
  bets.forEach(bet => {
    if (!betTypeBreakdown[bet.bet_type]) {
      betTypeBreakdown[bet.bet_type] = {
        count: 0,
        stake: 0,
        profit: 0
      };
    }
    
    betTypeBreakdown[bet.bet_type].count++;
    betTypeBreakdown[bet.bet_type].stake += parseFloat(bet.stake) || 0;
    
    if (bet.profit_loss) {
      betTypeBreakdown[bet.bet_type].profit += parseFloat(bet.profit_loss);
    }
  });
  
  // Calculate streaks
  let currentStreak = { type: 'none', count: 0 };
  let longestStreak = { type: 'none', count: 0 };
  
  // Sort bets by settled_at
  const settledBetsArray = bets
    .filter(bet => bet.status !== 'pending')
    .sort((a, b) => {
      const dateA = a.settled_at ? new Date(a.settled_at) : new Date(a.created_at);
      const dateB = b.settled_at ? new Date(b.settled_at) : new Date(b.created_at);
      return dateB.getTime() - dateA.getTime();
    });
  
  if (settledBetsArray.length > 0) {
    // Calculate current streak
    let streakType = 'none';
    let streakCount = 0;
    
    for (const bet of settledBetsArray) {
      if (bet.status === 'won' || bet.status === 'half_won') {
        if (streakType === 'none' || streakType === 'won') {
          streakType = 'won';
          streakCount++;
        } else {
          break;
        }
      } else if (bet.status === 'lost' || bet.status === 'half_lost') {
        if (streakType === 'none' || streakType === 'lost') {
          streakType = 'lost';
          streakCount++;
        } else {
          break;
        }
      } else {
        // Void bets don't count towards streaks
        continue;
      }
    }
    
    currentStreak = { type: streakType, count: streakCount };
    
    // Calculate longest streak
    let currentLongestType = 'none';
    let currentLongestCount = 0;
    let tempStreakType = 'none';
    let tempStreakCount = 0;
    
    for (const bet of settledBetsArray) {
      if (bet.status === 'won' || bet.status === 'half_won') {
        if (tempStreakType === 'none' || tempStreakType === 'won') {
          tempStreakType = 'won';
          tempStreakCount++;
        } else {
          // End of streak
          if (tempStreakCount > currentLongestCount) {
            currentLongestType = tempStreakType;
            currentLongestCount = tempStreakCount;
          }
          tempStreakType = 'won';
          tempStreakCount = 1;
        }
      } else if (bet.status === 'lost' || bet.status === 'half_lost') {
        if (tempStreakType === 'none' || tempStreakType === 'lost') {
          tempStreakType = 'lost';
          tempStreakCount++;
        } else {
          // End of streak
          if (tempStreakCount > currentLongestCount) {
            currentLongestType = tempStreakType;
            currentLongestCount = tempStreakCount;
          }
          tempStreakType = 'lost';
          tempStreakCount = 1;
        }
      } else {
        // Void bets don't count towards streaks
        continue;
      }
    }
    
    // Check last streak
    if (tempStreakCount > currentLongestCount) {
      currentLongestType = tempStreakType;
      currentLongestCount = tempStreakCount;
    }
    
    longestStreak = { type: currentLongestType, count: currentLongestCount };
  }
  
  return {
    totalBets,
    pendingBets,
    settledBets,
    wonBets,
    lostBets,
    voidBets,
    totalStaked,
    totalReturns,
    profit,
    roi,
    winRate,
    avgOdds,
    sportBreakdown,
    streaks: {
      current: currentStreak,
      longest: longestStreak
    },
    betTypeBreakdown
  };
} 