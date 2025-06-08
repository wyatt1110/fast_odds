/**
 * BETTING CALCULATIONS UTILITY
 * 
 * This file contains shared functions for processing and analyzing betting data across the application.
 * These utilities ensure consistent calculations for betting stats, multi-horse handling, and data formatting.
 */

export interface Bet {
  id: string;
  user_id: string;
  track_name: string;
  race_number: string | number | null;
  horse_name: string;
  bet_type: string;
  stake: number;
  odds: number;
  status: string;
  returns: number | null;
  profit_loss: number | null;
  created_at: string;
  bookmaker?: string | null;
  model?: string | null;
  multiple_odds?: number | null;
  race_date?: string | null;
  jockey?: string | null;
  trainer?: string | null;
  // ...any other fields that might be used in calculations
}

// Capitalize the first letter of each word in a string
export function capitalizeString(str: string): string {
  if (!str) return '';
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Process multi-horse entries and split data correctly
export function processMultiHorseBet<T extends Record<string, any>>(
  bets: T[],
  keyToProcess: keyof T,
  valueProcessor: (value: string) => string = (val) => val
): Record<string, number> {
  const counts: Record<string, number> = {};
  
  bets.forEach(bet => {
    const value = bet[keyToProcess];
    
    // Skip if value is null or undefined
    if (value === null || value === undefined) return;
    
    // Convert to string for processing
    const valueStr = String(value);
    
    // Check if this is a multi-value entry (containing '/')
    if (valueStr.includes('/')) {
      // Split the values and count each value
      const items = valueStr.split('/').map(t => valueProcessor(t.trim())).filter(t => t);
      const itemCount = items.length;
      
      // Add fractional count to each item
      items.forEach(item => {
        counts[item] = (counts[item] || 0) + (1 / itemCount);
      });
    } else {
      // Single value - increment by 1
      const processedValue = valueProcessor(valueStr);
      counts[processedValue] = (counts[processedValue] || 0) + 1;
    }
  });
  
  return counts;
}

// Process multi-horse bets for profit calculation
export function processMultiHorseProfits(
  bets: Bet[],
  keyToProcess: 'bookmaker' | 'model' | 'track_name'
): Record<string, number> {
  const profits: Record<string, number> = {};
  
  bets.forEach(bet => {
    const value = bet[keyToProcess];
    const betPL = (bet.returns || 0) - bet.stake;
    
    // Skip if value is null or undefined
    if (value === null || value === undefined) return;
    
    // Convert to string for processing
    const valueStr = String(value);
    
    // Check if this is a multi-value entry (containing '/')
    if (valueStr.includes('/')) {
      // Split the values
      const items = valueStr.split('/').map(t => capitalizeString(t.trim())).filter(t => t);
      const itemCount = items.length;
      
      // If multiple_odds exists, use it to calculate individual profits
      if (bet.multiple_odds !== undefined && bet.multiple_odds !== null) {
        items.forEach(item => {
          const individualPL = (bet.multiple_odds || 0) * bet.stake - bet.stake;
          profits[item] = (profits[item] || 0) + individualPL;
        });
      } else {
        // Otherwise, split profit/loss between horses
        items.forEach(item => {
          profits[item] = (profits[item] || 0) + (betPL / itemCount);
        });
      }
    } else {
      // Single value - add full profit/loss
      const processedValue = capitalizeString(valueStr);
      profits[processedValue] = (profits[processedValue] || 0) + betPL;
    }
  });
  
  return profits;
}

// Find most profitable item from a profit map
export function getMostProfitable(profitsObj: Record<string, number>): { name: string; profit: number } | null {
  if (Object.keys(profitsObj).length === 0) return null;
  
  let bestName = '';
  let highestProfit = -Infinity;
  
  Object.entries(profitsObj).forEach(([name, profit]) => {
    if (profit > highestProfit) {
      highestProfit = profit;
      bestName = name;
    }
  });
  
  return {
    name: bestName,
    profit: highestProfit
  };
}

// Filter settled bets (including void, won, lost, placed - everything not pending)
export function getSettledBets(bets: Bet[]): Bet[] {
  return bets.filter(bet => 
    bet.status.toLowerCase() !== 'pending'
  );
}

// Filter completed bets for profit calculations (won, lost, placed)
export function getCompletedBetsForProfitCalc(bets: Bet[]): Bet[] {
  return bets.filter(bet => 
    ['won', 'lost', 'placed'].includes(bet.status.toLowerCase())
  );
}

// Filter successful bets (won, placed)
export function getSuccessfulBets(bets: Bet[]): Bet[] {
  return bets.filter(bet => 
    ['won', 'placed'].includes(bet.status.toLowerCase())
  );
}

// Calculate key statistics from bets
export function calculateBetStats(bets: Bet[]) {
  const pendingBets = bets.filter(bet => 
    bet.status.toLowerCase() === 'pending'
  );
  
  const settledBets = getSettledBets(bets);
  const completedBets = getCompletedBetsForProfitCalc(bets);
  const successfulBets = getSuccessfulBets(bets);
  
  const totalBets = bets.length;
  const pendingBetsCount = pendingBets.length;
  const settledBetsCount = settledBets.length;
  
  const totalStaked = completedBets.reduce((sum, bet) => sum + bet.stake, 0);
  const totalReturned = completedBets.reduce((sum, bet) => sum + (bet.returns || 0), 0);
  const profitLoss = totalReturned - totalStaked;
  
  // Calculate ROI/Yield - (Returns - Stakes) / Stakes × 100
  const roi = totalStaked > 0 ? (profitLoss / totalStaked) * 100 : 0;
  
  // Average odds only on completed bets
  const oddsSum = completedBets.reduce((sum, bet) => sum + bet.odds, 0);
  const averageOdds = completedBets.length > 0 ? oddsSum / completedBets.length : 0;
  
  // Strike rate - count won and placed bets as successful from completed bets
  const strikeRate = completedBets.length > 0 ? (successfulBets.length / completedBets.length) * 100 : 0;
  
  return {
    totalBets,
    pendingBets: pendingBetsCount,
    settledBets: settledBetsCount,
    totalStaked,
    totalReturned,
    profitLoss,
    roi,
    averageOdds,
    strikeRate
  };
} 