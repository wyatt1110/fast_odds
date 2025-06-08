/**
 * Format a number as currency (GBP)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format(amount);
}

/**
 * Format odds as a decimal value
 * Converts fractional odds (e.g., "5/1") to decimal (6.0)
 */
export function formatOddsToDecimal(odds: string): number {
  // If odds are already a decimal, return as number
  if (!odds.includes('/')) {
    return parseFloat(odds);
  }

  // Parse fractional odds
  const [numerator, denominator] = odds.split('/').map(num => parseInt(num, 10));
  if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
    return 0;
  }
  
  return numerator / denominator + 1;
}

/**
 * Calculate potential winnings from stake and odds
 */
export function calculateWinnings(stake: number, odds: string): number {
  const decimalOdds = formatOddsToDecimal(odds);
  return stake * decimalOdds - stake;
}

/**
 * Calculate return (stake + winnings) from stake and odds
 */
export function calculateReturn(stake: number, odds: string): number {
  const decimalOdds = formatOddsToDecimal(odds);
  return stake * decimalOdds;
} 