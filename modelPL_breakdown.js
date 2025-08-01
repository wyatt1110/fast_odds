const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/**
 * Get UK date (accounting for timezone)
 */
function getUKDate(daysOffset = 0) {
    const now = new Date();
    const ukTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/London"}));
    ukTime.setDate(ukTime.getDate() + daysOffset);
    return ukTime.toISOString().split('T')[0]; // Return YYYY-MM-DD format
}

/**
 * Group bets by horse and take the best odds for each
 */
function getBestOddsPerHorse(bets) {
    const horseGroups = new Map();
    
    bets.forEach(bet => {
        const key = `${bet.horse_id}_${bet.race_date}`;
        
        if (!horseGroups.has(key)) {
            horseGroups.set(key, bet);
        } else {
            // Keep the bet with the highest odds (best value)
            const existingBet = horseGroups.get(key);
            if (parseFloat(bet.odds) > parseFloat(existingBet.odds)) {
                horseGroups.set(key, bet);
            }
        }
    });
    
    return Array.from(horseGroups.values());
}

/**
 * Calculate performance metrics
 */
function calculateMetrics(bets) {
    if (bets.length === 0) {
        return {
            totalBets: 0,
            wins: 0,
            winRate: 0,
            averageOdds: 0,
            totalStake: 0,
            totalReturns: 0,
            profitLoss: 0,
            roi: 0
        };
    }
    
    const wins = bets.filter(bet => bet.result === 'won').length;
    const totalStake = bets.reduce((sum, bet) => sum + parseFloat(bet.stake || 0), 0);
    const totalReturns = bets.reduce((sum, bet) => sum + parseFloat(bet.returns || 0), 0);
    const totalOdds = bets.reduce((sum, bet) => sum + parseFloat(bet.odds || 0), 0);
    
    return {
        totalBets: bets.length,
        wins: wins,
        winRate: (wins / bets.length * 100).toFixed(2),
        averageOdds: (totalOdds / bets.length).toFixed(2),
        totalStake: totalStake.toFixed(2),
        totalReturns: totalReturns.toFixed(2),
        profitLoss: (totalReturns - totalStake).toFixed(2),
        roi: totalStake > 0 ? (((totalReturns - totalStake) / totalStake) * 100).toFixed(2) : '0.00'
    };
}

/**
 * Filter bets by odds range
 */
function filterByOddsRange(bets, minOdds, maxOdds) {
    return bets.filter(bet => {
        const odds = parseFloat(bet.odds);
        return odds >= minOdds && odds < maxOdds;
    });
}

/**
 * Analyze table performance
 */
async function analyzeTablePerformance(tableName) {
    try {
        console.log(`\n📊 Analyzing ${tableName.toUpperCase()} performance...`);
        
        // Get all completed bets (not pending)
        const { data: allBets, error } = await supabase
            .from(tableName)
            .select('*')
            .not('result', 'eq', 'pending')
            .not('result', 'is', null);
        
        if (error) {
            console.error(`❌ Error fetching data from ${tableName}:`, error);
            return null;
        }
        
        if (!allBets || allBets.length === 0) {
            console.log(`⚠️  No completed bets found in ${tableName}`);
            return null;
        }
        
        console.log(`📋 Found ${allBets.length} total completed bets`);
        
        // Get best odds per horse
        const bestOddsBets = getBestOddsPerHorse(allBets);
        console.log(`🎯 After deduplication: ${bestOddsBets.length} unique horse bets`);
        
        // Calculate overall metrics
        const overallMetrics = calculateMetrics(bestOddsBets);
        
        // Filter for bets under 20.0 odds
        const under20Bets = bestOddsBets.filter(bet => parseFloat(bet.odds) < 20.0);
        const under20Metrics = calculateMetrics(under20Bets);
        
        // Calculate metrics by odds ranges
        const range1to5 = filterByOddsRange(bestOddsBets, 1.0, 5.0);
        const range5to10 = filterByOddsRange(bestOddsBets, 5.0, 10.0);
        const range10to20 = filterByOddsRange(bestOddsBets, 10.0, 20.0);
        const range20plus = filterByOddsRange(bestOddsBets, 20.0, 999.0);
        
        const range1to5Metrics = calculateMetrics(range1to5);
        const range5to10Metrics = calculateMetrics(range5to10);
        const range10to20Metrics = calculateMetrics(range10to20);
        const range20plusMetrics = calculateMetrics(range20plus);
        
        return {
            tableName,
            overall: overallMetrics,
            under20: under20Metrics,
            ranges: {
                '1.0-5.0': range1to5Metrics,
                '5.0-10.0': range5to10Metrics,
                '10.0-20.0': range10to20Metrics,
                '20.0+': range20plusMetrics
            }
        };
        
    } catch (error) {
        console.error(`💥 Error analyzing ${tableName}:`, error);
        return null;
    }
}

/**
 * Print performance breakdown
 */
function printBreakdown(analysis) {
    if (!analysis) return;
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`📈 ${analysis.tableName.toUpperCase()} PERFORMANCE BREAKDOWN`);
    console.log(`${'='.repeat(80)}`);
    
    // Overall performance
    console.log(`\n🎯 OVERALL PERFORMANCE (All Bets)`);
    console.log(`   Bets: ${analysis.overall.totalBets}`);
    console.log(`   Wins: ${analysis.overall.wins} (${analysis.overall.winRate}%)`);
    console.log(`   Avg Odds: ${analysis.overall.averageOdds}`);
    console.log(`   Total Stake: £${analysis.overall.totalStake}`);
    console.log(`   Total Returns: £${analysis.overall.totalReturns}`);
    console.log(`   P/L: £${analysis.overall.profitLoss}`);
    console.log(`   ROI: ${analysis.overall.roi}%`);
    
    // Under 20.0 performance
    console.log(`\n🎯 PERFORMANCE (Bets Under 20.0 Odds)`);
    console.log(`   Bets: ${analysis.under20.totalBets}`);
    console.log(`   Wins: ${analysis.under20.wins} (${analysis.under20.winRate}%)`);
    console.log(`   Avg Odds: ${analysis.under20.averageOdds}`);
    console.log(`   Total Stake: £${analysis.under20.totalStake}`);
    console.log(`   Total Returns: £${analysis.under20.totalReturns}`);
    console.log(`   P/L: £${analysis.under20.profitLoss}`);
    console.log(`   ROI: ${analysis.under20.roi}%`);
    
    // Odds ranges breakdown
    console.log(`\n📊 PERFORMANCE BY ODDS RANGES`);
    console.log(`${'-'.repeat(60)}`);
    
    Object.entries(analysis.ranges).forEach(([range, metrics]) => {
        console.log(`\n${range} Odds:`);
        console.log(`   Bets: ${metrics.totalBets}`);
        console.log(`   Wins: ${metrics.wins} (${metrics.winRate}%)`);
        console.log(`   Avg Odds: ${metrics.averageOdds}`);
        console.log(`   P/L: £${metrics.profitLoss}`);
        console.log(`   ROI: ${metrics.roi}%`);
    });
}

/**
 * Main function
 */
async function main() {
    const startTime = new Date();
    console.log(`🕐 Starting Model P/L Breakdown Analysis at: ${startTime.toISOString()}`);
    console.log(`📅 UK Date: ${getUKDate(0)}`);
    
    try {
        // Analyze all three tables
        const ovAnalysis = await analyzeTablePerformance('ov_signals');
        const sharpAnalysis = await analyzeTablePerformance('sharp_win_signals');
        const bankersAnalysis = await analyzeTablePerformance('ov_bankers');
        
        // Print breakdowns
        if (ovAnalysis) {
            printBreakdown(ovAnalysis);
        }
        
        if (sharpAnalysis) {
            printBreakdown(sharpAnalysis);
        }
        
        if (bankersAnalysis) {
            printBreakdown(bankersAnalysis);
        }
        
        // Summary comparison
        console.log(`\n${'='.repeat(80)}`);
        console.log(`📊 SUMMARY COMPARISON`);
        console.log(`${'='.repeat(80)}`);
        
        if (ovAnalysis && sharpAnalysis && bankersAnalysis) {
            console.log(`\nOV_SIGNALS vs SHARP_WIN_SIGNALS vs OV_BANKERS (All Bets):`);
            console.log(`   OV: ${ovAnalysis.overall.totalBets} bets, £${ovAnalysis.overall.profitLoss} P/L, ${ovAnalysis.overall.roi}% ROI`);
            console.log(`   Sharp: ${sharpAnalysis.overall.totalBets} bets, £${sharpAnalysis.overall.profitLoss} P/L, ${sharpAnalysis.overall.roi}% ROI`);
            console.log(`   Bankers: ${bankersAnalysis.overall.totalBets} bets, £${bankersAnalysis.overall.profitLoss} P/L, ${bankersAnalysis.overall.roi}% ROI`);
            
            console.log(`\nOV_SIGNALS vs SHARP_WIN_SIGNALS vs OV_BANKERS (Under 20.0):`);
            console.log(`   OV: ${ovAnalysis.under20.totalBets} bets, £${ovAnalysis.under20.profitLoss} P/L, ${ovAnalysis.under20.roi}% ROI`);
            console.log(`   Sharp: ${sharpAnalysis.under20.totalBets} bets, £${sharpAnalysis.under20.profitLoss} P/L, ${sharpAnalysis.under20.roi}% ROI`);
            console.log(`   Bankers: ${bankersAnalysis.under20.totalBets} bets, £${bankersAnalysis.under20.profitLoss} P/L, ${bankersAnalysis.under20.roi}% ROI`);
        }
        
    } catch (error) {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    }
    
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ Analysis completed at: ${endTime.toISOString()}`);
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    console.log(`${'='.repeat(80)}`);
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { analyzeTablePerformance, calculateMetrics }; 