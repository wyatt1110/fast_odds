#!/usr/bin/env node

// Fast API Betting Signals Detector - William Hill & Bet365 Only (Jan 8, 2025)
const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const http = require('http');

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Fast API configuration
const FAST_API_URL = process.env.FAST_API_URL || 'http://localhost:8000';
console.log(`🔧 FAST_API_URL configured as: ${FAST_API_URL}`);

// Only William Hill and Bet365 for fast API
const FAST_API_BOOKMAKERS = ['william_hill', 'bet365'];

// Get UK time for logging
function getUKTime() {
  return new Date().toLocaleString("en-GB", {
    timeZone: "Europe/London",
    hour12: false
  });
}

// Check if we're in betting hours (07:00-21:00 UK time)
function isBettingHours() {
  const now = new Date();
  const ukTimeString = now.toLocaleString("en-GB", {
    timeZone: "Europe/London",
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const [hour, minute] = ukTimeString.split(':').map(Number);
  const ukMinutes = hour * 60 + minute;
  const startMinutes = 7 * 60; // 07:00
  const endMinutes = 21 * 60; // 21:00
  
  const inBettingHours = ukMinutes >= startMinutes && ukMinutes <= endMinutes;
  console.log(`🕐 UK Time: ${ukTimeString}, Betting Hours: ${inBettingHours}`);
  return inBettingHours;
}

// Fetch live odds from fast API
async function fetchFastAPIData() {
  return new Promise((resolve, reject) => {
    const url = `${FAST_API_URL}/odds`;
    
    // Choose the correct module based on protocol
    const urlObj = new URL(url);
    const client = urlObj.protocol === "https:" ? https : http;
    
    client.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          reject(new Error(`Failed to parse JSON: ${error.message}`));
        }
      });
    }).on('error', (error) => {
      reject(new Error(`HTTP request failed: ${error.message}`));
    });
  });
}

// Parse the latest value from a bookmaker history column
function parseLatestValue(historyText) {
  if (!historyText || typeof historyText !== 'string') return null;
  
  const entries = historyText.split(' / ').filter(entry => entry.trim());
  if (entries.length === 0) return null;
  
  const latestEntry = entries[entries.length - 1];
  const [odds] = latestEntry.split('_');
  const parsedOdds = parseFloat(odds);
  
  return isNaN(parsedOdds) ? null : parsedOdds;
}

// Parse the latest value from momentum/market pressure columns
function parseLatestPercentage(historyText) {
  if (!historyText || typeof historyText !== 'string') return null;
  
  const entries = historyText.split(' / ').filter(entry => entry.trim());
  if (entries.length === 0) return null;
  
  const latestEntry = entries[entries.length - 1];
  const [percentage] = latestEntry.split('_');
  const parsedPercentage = parseFloat(percentage);
  
  return isNaN(parsedPercentage) ? null : parsedPercentage;
}

// Calculate average odds from William Hill and Bet365 from fast API
function calculateFastAPIOddsAverage(liveOddsData, horseName) {
  const validOdds = [];
  
  // Find the horse in live odds data
  const horseData = liveOddsData.find(horse => 
    horse.horse_name.toLowerCase() === horseName.toLowerCase()
  );
  
  if (!horseData) return null;
  
  // Check William Hill odds
  if (horseData.william_hill_odds && horseData.william_hill_odds > 0) {
    validOdds.push(horseData.william_hill_odds);
  }
  
  // Check Bet365 odds
  if (horseData.bet365_odds && horseData.bet365_odds > 0) {
    validOdds.push(horseData.bet365_odds);
  }
  
  if (validOdds.length === 0) return null;
  
  const sum = validOdds.reduce((acc, odds) => acc + odds, 0);
  return sum / validOdds.length;
}

// Parse the latest sharp average odds value
function parseLatestSharpAverageOdds(sharpAverageOddsText) {
  if (!sharpAverageOddsText || typeof sharpAverageOddsText !== 'string') return null;
  
  const entries = sharpAverageOddsText.split(' / ').filter(entry => entry.trim());
  if (entries.length === 0) return null;
  
  const latestEntry = entries[entries.length - 1];
  const [odds] = latestEntry.split('_');
  const parsedOdds = parseFloat(odds);
  
  return isNaN(parsedOdds) ? null : parsedOdds;
}

// Find fast API bookmakers with odds 8% higher than sharp average
function findFastAPIPremiumBookmakers(liveOddsData, horseName, sharpAverageOdds) {
  const premiumBookmakers = [];
  const sharpThreshold = sharpAverageOdds * 1.08; // 8% higher than sharp average
  
  // Find the horse in live odds data
  const horseData = liveOddsData.find(horse => 
    horse.horse_name.toLowerCase() === horseName.toLowerCase()
  );
  
  if (!horseData) return premiumBookmakers;
  
  // Check William Hill
  if (horseData.william_hill_odds && horseData.william_hill_odds >= sharpThreshold) {
    const sharpPremiumPercentage = ((horseData.william_hill_odds - sharpAverageOdds) / sharpAverageOdds) * 100;
    premiumBookmakers.push({
      bookmaker: 'william_hill',
      odds: horseData.william_hill_odds,
      sharpPremiumPercentage
    });
  }
  
  // Check Bet365
  if (horseData.bet365_odds && horseData.bet365_odds >= sharpThreshold) {
    const sharpPremiumPercentage = ((horseData.bet365_odds - sharpAverageOdds) / sharpAverageOdds) * 100;
    premiumBookmakers.push({
      bookmaker: 'bet365',
      odds: horseData.bet365_odds,
      sharpPremiumPercentage
    });
  }
  
  return premiumBookmakers;
}

// Check for existing signal to avoid duplicates (per horse AND bookmaker within 30 minutes)
async function hasRecentSignal(horseId, raceId, bookmaker) {
  try {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('ov_signals')
      .select('id')
      .eq('horse_id', horseId)
      .eq('race_id', raceId)
      .eq('bookmaker', bookmaker)
      .gte('signal_timestamp', thirtyMinutesAgo)
      .limit(1);
    
    if (error) {
      console.error('❌ Error checking recent signals:', error);
      return false;
    }
    
    return data && data.length > 0;
  } catch (error) {
    console.error('❌ Error in hasRecentSignal:', error);
    return false;
  }
}

// Insert a betting signal into the database
async function insertBettingSignal(signalData) {
  try {
    const { error } = await supabase
      .from('ov_signals')
      .insert([signalData]);
    
    if (error) {
      console.error('❌ Error inserting betting signal:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error in insertBettingSignal:', error);
    return false;
  }
}

// Main fast API betting signals detection function
async function detectFastAPIBettingSignals() {
  if (!isBettingHours()) {
    console.log('⏰ Outside betting hours (07:00-21:00 UK) - skipping signals detection');
    return;
  }
  
  console.log('🎯 Starting fast API betting signals detection...');
  console.log(`🕐 UK Time: ${getUKTime()}`);
  
  try {
    // Get live odds data from fast API
    console.log('📡 Fetching live odds from fast API...');
    const apiResponse = await fetchFastAPIData();
    
    if (!apiResponse || !apiResponse.horses) {
      console.log('📊 No live odds data available from fast API');
      return;
    }
    
    // Convert API response to the format expected by the script
    const allHorses = apiResponse.horses;
    const liveOddsData = [];
    
    // Group horses by name to combine bet365 and william hill odds
    const horseOddsMap = new Map();
    
    allHorses.forEach(horse => {
      // Use horse name + race as unique key to avoid conflicts across races
      const key = `${horse.horse.toLowerCase()}|${horse.race.toLowerCase()}`;
      
      if (!horseOddsMap.has(key)) {
        horseOddsMap.set(key, {
          horse_name: horse.horse,
          race_name: horse.race,
          track: horse.race, // Use race name as track for now
          bet365_odds: null,
          william_hill_odds: null
        });
      }
      
      // Add odds based on bookmaker
      if (horse.bookmaker === 'bet365') {
        horseOddsMap.get(key).bet365_odds = horse.odds;
      } else if (horse.bookmaker === 'william_hill') {
        horseOddsMap.get(key).william_hill_odds = horse.odds;
      }
    });
    
    // Convert map to array
    liveOddsData.push(...horseOddsMap.values());
    
    const bet365Count = allHorses.filter(h => h.bookmaker === 'bet365').length;
    const williamHillCount = allHorses.filter(h => h.bookmaker === 'william_hill').length;
    
    console.log(`📊 Found ${allHorses.length} odds entries (${bet365Count} Bet365 + ${williamHillCount} William Hill) for ${liveOddsData.length} unique horses`);
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
    
    // Step 1: Get today's active races (not finished more than 15 minutes ago)
    const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    
    const { data: races, error: racesError } = await supabase
      .from('races')
      .select('race_id, course, race_name, off_dt')
      .eq('race_date', today)
      .gte('off_dt', fifteenMinutesAgo);
    
    if (racesError) {
      console.error('❌ Error fetching races:', racesError);
      return;
    }
    
    if (!races || races.length === 0) {
      console.log('📅 No active races found for today');
      return;
    }
    
    console.log(`🏁 Found ${races.length} active races for today`);
    
    // Step 2: Get all runners for these races with all required data
    // Exclude non-runners (horses with number = 'NR') as they have stale odds data
    const raceIds = races.map(race => race.race_id);
    
    const { data: runners, error: runnersError } = await supabase
      .from('runners')
      .select(`
        id, horse_id, horse_name, race_id, number,
        momentum_steaming, market_pressure_shortening,
        average_odds, sharp_average_odds
      `)
      .in('race_id', raceIds)
      .neq('number', 'NR'); // Exclude non-runners
    
    if (runnersError) {
      console.error('❌ Error fetching runners:', runnersError);
      return;
    }
    
    if (!runners || runners.length === 0) {
      console.log('🐎 No runners found for active races');
      return;
    }
    
    console.log(`🐎 Analyzing ${runners.length} active runners for betting signals (non-runners excluded)...`);
    
    let signalsFound = 0;
    let signalsInserted = 0;
    
    // Step 3: Analyze each runner for betting criteria
    for (const runner of runners) {
      try {
        // Parse momentum steaming
        const momentumSteaming = parseLatestPercentage(runner.momentum_steaming);
        if (!momentumSteaming || momentumSteaming <= 20) continue;
        
        // Parse market pressure shortening
        const marketPressure = parseLatestPercentage(runner.market_pressure_shortening);
        if (!marketPressure || marketPressure <= 30) continue;
        
        console.log(`🔥 Criteria 1&2 met for ${runner.horse_name}: Momentum=${momentumSteaming}%, Pressure=${marketPressure}%`);
        
        // Parse sharp average odds
        const sharpAverageOdds = parseLatestSharpAverageOdds(runner.sharp_average_odds);
        if (!sharpAverageOdds) {
          console.log(`⚠️ No sharp average odds data for ${runner.horse_name}`);
          continue;
        }
        
        // Calculate fast API average odds (William Hill + Bet365 only)
        const fastAPIAverageOdds = calculateFastAPIOddsAverage(liveOddsData, runner.horse_name);
        if (!fastAPIAverageOdds) {
          console.log(`⚠️ No fast API odds data for ${runner.horse_name}`);
          continue;
        }
        
        console.log(`📊 ${runner.horse_name}: fast_api_avg=${fastAPIAverageOdds.toFixed(2)}, sharp_avg=${sharpAverageOdds.toFixed(2)}`);
        
        // Find fast API bookmakers with 8%+ premium over sharp average
        const premiumBookmakers = findFastAPIPremiumBookmakers(liveOddsData, runner.horse_name, sharpAverageOdds);
        if (premiumBookmakers.length === 0) {
          console.log(`📊 No premium fast API bookmakers found for ${runner.horse_name} (fast api avg: ${fastAPIAverageOdds.toFixed(2)}, sharp avg: ${sharpAverageOdds.toFixed(2)})`);
          continue;
        }
        
        console.log(`💰 Found ${premiumBookmakers.length} premium fast API bookmakers for ${runner.horse_name}`);
        premiumBookmakers.forEach(bm => {
          console.log(`   ${bm.bookmaker}: ${bm.odds} (+${bm.sharpPremiumPercentage.toFixed(1)}% vs sharp)`);
        });
        
        // Check each premium bookmaker - all criteria now met
        for (const bookmaker of premiumBookmakers) {
          console.log(`🎯 FAST API SIGNAL FOUND for ${runner.horse_name} at ${bookmaker.bookmaker}!`);
          console.log(`   Odds: ${bookmaker.odds} vs Sharp: ${sharpAverageOdds.toFixed(2)} (+${bookmaker.sharpPremiumPercentage.toFixed(1)}%)`);
          console.log(`   Momentum: ${momentumSteaming}%, Pressure: ${marketPressure}%`);
          
          signalsFound++;
         
          // Check for recent signal to avoid duplicates (per bookmaker within 30 minutes)
          const hasRecent = await hasRecentSignal(runner.horse_id, runner.race_id, bookmaker.bookmaker);
          if (hasRecent) {
            console.log(`⚠️ Recent signal already exists for ${runner.horse_name} at ${bookmaker.bookmaker} within 30 minutes, skipping`);
            continue;
          }
          
          // Find race info
          const race = races.find(r => r.race_id === runner.race_id);
          
          // Prepare signal data
          const signalData = {
            horse_name: runner.horse_name,
            horse_id: runner.horse_id,
            race_name: race?.race_name,
            race_id: runner.race_id,
            race_date: today,
            race_time: race?.off_dt ? new Date(race.off_dt).toLocaleTimeString('en-GB', { timeZone: 'Europe/London' }) : null,
            course: race?.course,
            stake: 1,
            odds: bookmaker.odds,
            bookmaker: bookmaker.bookmaker,
            average_odds_at_time: fastAPIAverageOdds,
            sharp_average_odds_at_time: sharpAverageOdds,
            result: 'PENDING',
            momentum_steaming_value: momentumSteaming,
            market_pressure_shortening_value: marketPressure,
            odds_premium_percentage: null, // Not applicable for fast API version
            sharp_odds_premium_percentage: bookmaker.sharpPremiumPercentage, // Premium vs sharp average odds
            race_status: 'PENDING',
            fast_odds: true // Mark as fast API signal for comparison analysis
          };
          
          // Insert the signal
          const inserted = await insertBettingSignal(signalData);
          if (inserted) {
            signalsInserted++;
            console.log(`✅ Fast API signal recorded for ${runner.horse_name} at ${bookmaker.bookmaker}`);
          }
        }
        
      } catch (error) {
        console.error(`❌ Error analyzing runner ${runner.horse_name}:`, error);
      }
    }
    
    console.log(`🎯 Fast API betting signals detection completed:`);
    console.log(`   📊 Signals found: ${signalsFound}`);
    console.log(`   💾 Signals inserted: ${signalsInserted}`);
    console.log(`   🕐 Completed at: ${getUKTime()}`);
    
  } catch (error) {
    console.error('❌ Error in detectFastAPIBettingSignals:', error);
  }
}

// Run the script if called directly
if (require.main === module) {
  detectFastAPIBettingSignals()
    .then(() => {
      console.log('✅ Fast API betting signals detection script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { detectFastAPIBettingSignals }; 