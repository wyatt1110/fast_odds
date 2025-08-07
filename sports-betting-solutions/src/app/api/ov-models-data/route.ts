import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';

// Create a Supabase client with the service role key (server-side only)
const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tabIndex = searchParams.get('tab');

    if (!tabIndex) {
      return NextResponse.json({ error: 'Missing tab index' }, { status: 400 });
    }

    // Determine table name based on tab index
    let tableName = 'ov-bankers';
    if (tabIndex === '0' || tabIndex === '1') {
      tableName = 'ov-bankers';
    } else if (tabIndex === '2' || tabIndex === '3') {
      tableName = 'sharp_win_signals';
    } else if (tabIndex === '4' || tabIndex === '5') {
      tableName = 'ov_signals';
    } else if (tabIndex === '6' || tabIndex === '7') {
      tableName = 'usa_signals';
    } else if (tabIndex === '8') {
      tableName = 'TFR_signals';
    }

    console.log(`🔍 [API] Fetching data from ${tableName} for tab ${tabIndex}`);

    // Fetch data from Supabase using service role key (bypasses RLS)
    const { data: signals, error } = await supabaseAdmin
      .from(tableName)
      .select('*')
      .limit(3000);

    if (error) {
      console.error(`❌ [API] Error fetching data from ${tableName}:`, error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }

    if (!signals || signals.length === 0) {
      console.log(`⚠️ [API] No data found in ${tableName}`);
      return NextResponse.json({
        totalBets: 0,
        totalWins: 0,
        winRate: "0.00",
        averageOdds: "0.00",
        totalStake: "0.00",
        totalProfit: "0.00",
        roi: "0.00"
      });
    }

    console.log(`✅ [API] Got ${signals.length} signals from ${tableName}`);

    // Log bookmaker distribution for debugging
    const bookmakerCounts = signals.reduce((acc: { [key: string]: number }, signal: any) => {
      const bookmaker = signal.bookmaker || 'unknown';
      acc[bookmaker] = (acc[bookmaker] || 0) + 1;
      return acc;
    }, {});
    console.log(`📊 [API] Bookmaker distribution:`, bookmakerCounts);

    // Filter data based on model type with improved bookmaker logic
    let filteredSignals;
    if (tabIndex === '0' || tabIndex === '2' || tabIndex === '4') {
      // Regular models: Exclude ALL exchange bookmakers
      filteredSignals = signals.filter((signal: any) => {
        const bookmaker = (signal.bookmaker || '').toLowerCase();
        return !bookmaker.includes('exchange') && 
               !bookmaker.includes('betfair') && 
               !bookmaker.includes('matchbook') &&
               bookmaker !== 'betfair_exchange';
      });
      console.log(`🔍 [API] Regular model filtering: excluded exchanges, got ${filteredSignals.length} signals`);
    } else if (tabIndex === '1' || tabIndex === '3' || tabIndex === '5') {
      // Exchange models: ONLY include exchange bookmakers
      filteredSignals = signals.filter((signal: any) => {
        const bookmaker = (signal.bookmaker || '').toLowerCase();
        return bookmaker.includes('exchange') || 
               bookmaker.includes('betfair') || 
               bookmaker.includes('matchbook') ||
               bookmaker === 'betfair_exchange';
      });
      console.log(`🔍 [API] Exchange model filtering: only exchanges, got ${filteredSignals.length} signals`);
    } else if (tabIndex === '6') {
      // USA Bet365: Only include Bet365 bookmaker
      filteredSignals = signals.filter((signal: any) => 
        signal.bookmaker === 'Bet365' || (signal.bookmaker || '').toLowerCase().includes('bet365')
      );
      console.log(`🔍 [API] USA Bet365 filtering: got ${filteredSignals.length} signals`);
    } else if (tabIndex === '7') {
      // USA Exchange: Only include Betfair Exchange bookmaker
      filteredSignals = signals.filter((signal: any) => {
        const bookmaker = (signal.bookmaker || '').toLowerCase();
        return bookmaker === 'betfair exchange' || bookmaker.includes('exchange');
      });
      console.log(`🔍 [API] USA Exchange filtering: got ${filteredSignals.length} signals`);
    } else if (tabIndex === '8') {
      // OV Basic (Free): Exclude ALL exchanges
      filteredSignals = signals.filter((signal: any) => {
        const bookmaker = (signal.bookmaker || '').toLowerCase();
        return !bookmaker.includes('exchange') && 
               !bookmaker.includes('betfair') && 
               !bookmaker.includes('matchbook') &&
               bookmaker !== 'betfair_exchange';
      });
      console.log(`🔍 [API] OV Basic filtering: excluded exchanges, got ${filteredSignals.length} signals`);
    } else {
      filteredSignals = [];
    }

    console.log(`🔍 [API] After filtering: ${filteredSignals.length} signals`);

    // Process data with improved unique bet logic
    const uniqueBets = new Map();
    
    filteredSignals.forEach((signal: any) => {
      const horseName = signal.horse_name || signal.horse;
      const raceDate = signal.race_date;
      
      if (!horseName || !raceDate) return;
      
      let finalResult = signal.result;
      
      // Special handling for USA signals table
      if (tableName === 'usa_signals') {
        // For USA signals: null = pending bet (horse hasn't run yet)
        if (!finalResult || finalResult === null) {
          return; // Skip pending bets
        }
        
        // Handle USA signals result values
        if (finalResult === 'Won') {
          finalResult = 'won';
        } else if (finalResult === 'Lost') {
          finalResult = 'loss';
        } else {
          return; // Skip any other result values
        }
      } else {
        // Handle other tables (existing logic)
        if (!finalResult || finalResult === 'PENDING') {
          if (signal.finish_position === '1' || signal.finish_position === 1) {
            finalResult = 'won';
          } else if (signal.finish_position && signal.finish_position !== '1' && signal.finish_position !== 1) {
            finalResult = 'loss';
          }
        }
        
        if (finalResult === 'Lost') finalResult = 'loss';
      }
      
      if (finalResult !== 'won' && finalResult !== 'loss') return;
      
      // Create unique key: horse_name + race_date (one bet per horse per day)
      const key = `${horseName}_${raceDate}`;
      
      if (!uniqueBets.has(key)) {
        // First bet for this horse on this date
        let profitLoss = signal.profit_loss || 0;
        let stake = signal.stake || 1;
        
        // For USA signals, calculate profit/loss based on result
        if (tableName === 'usa_signals') {
          if (finalResult === 'won') {
            // Use the returns field if available, otherwise calculate from odds
            if (signal.returns) {
              profitLoss = parseFloat(signal.returns) - parseFloat(signal.stake);
            } else if (signal.odds) {
              profitLoss = parseFloat(signal.stake) * (parseFloat(signal.odds) - 1);
            }
          } else if (finalResult === 'loss') {
            // Lost bet = -stake
            profitLoss = -parseFloat(signal.stake);
          }
        }
        
        uniqueBets.set(key, {
          horse_name: horseName,
          race_date: raceDate,
          result: finalResult,
          profit_loss: profitLoss,
          stake: stake,
          best_odds: signal.odds || 0,
          best_bookmaker: signal.bookmaker || 'unknown',
          finish_position: signal.finish_position
        });
      } else {
        // Update with better odds if this signal has higher odds
        const existing = uniqueBets.get(key);
        if (signal.odds && signal.odds > existing.best_odds) {
          existing.best_odds = signal.odds;
          existing.best_bookmaker = signal.bookmaker;
          // Also update result if this record has a better result determination
          if (finalResult && (!existing.result || existing.result === 'PENDING')) {
            existing.result = finalResult;
          }
        }
      }
    });

    const processedBets = Array.from(uniqueBets.values());
    console.log(`🔍 [API] Unique bets after processing: ${processedBets.length}`);
    
    // Calculate statistics
    const totalBets = processedBets.length;
    const totalWins = processedBets.filter(bet => bet.result === 'won').length;
    const winRate = totalBets > 0 ? (totalWins / totalBets) * 100 : 0;
    const totalStake = processedBets.reduce((sum, bet) => sum + (parseFloat(bet.stake) || 1), 0);
    const totalProfit = processedBets.reduce((sum, bet) => sum + (parseFloat(bet.profit_loss) || 0), 0);
    const roi = totalStake > 0 ? (totalProfit / totalStake) * 100 : 0;
    const averageOdds = totalBets > 0 ? 
      processedBets.reduce((sum, bet) => sum + (parseFloat(bet.best_odds) || 0), 0) / totalBets : 0;

    console.log(`📊 [API] Calculated stats: ${totalBets} bets, ${totalWins} wins, ${winRate.toFixed(2)}% win rate`);

    // Return processed data including individual bets for charting
    const individualBets = Array.from(uniqueBets.values()).map((bet, index) => ({
      betNumber: index + 1,
      horse_name: bet.horse_name,
      race_date: bet.race_date,
      result: bet.result,
      profit_loss: bet.profit_loss,
      stake: bet.stake,
      best_odds: bet.best_odds,
      best_bookmaker: bet.best_bookmaker
    }));

    return NextResponse.json({
      totalBets,
      totalWins,
      winRate: winRate.toFixed(2),
      averageOdds: averageOdds.toFixed(2),
      totalStake: totalStake.toFixed(2),
      totalProfit: totalProfit.toFixed(2),
      roi: roi.toFixed(2),
      individualBets // Add individual bet data for real charts
    });

  } catch (error) {
    console.error('❌ [API] Error in OV Models API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
