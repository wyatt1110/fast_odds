#!/usr/bin/env node

const https = require('https');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// API credentials (same as in fetch-racecards.js)
const USERNAME = 'KQ9W7rQeAHWMUgxH93ie3yEc';
const PASSWORD = 'T5BoPivL3Q2h6RhCdLv4EwZu';

// Supabase configuration
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Get yesterday's date in YYYY-MM-DD format - NEVER CHANGE THIS FOR GITHUB
const getYesterdayDate = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

// Make API request to get racing results with FULL PAGINATION
const fetchRacingResults = async (date) => {
  console.log(`🚨 ENTERING fetchRacingResults function for date: ${date}`);
  
  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
  const options = {
    headers: {
      'Authorization': `Basic ${auth}`,
      'User-Agent': 'Node.js/Results-Fetcher'
    }
  };

  let allRaces = [];
  let skip = 0;
  let limit = 50; // Maximum allowed by API
  let totalExpected = 0;
  let totalFetched = 0;
  let requestCount = 0;

  console.log(`🔍 Starting paginated fetch for ${date} using limit=${limit} and skip...`);

  try {
    // Keep fetching until we have all races
    while (true) {
      requestCount++;
      const apiUrl = `https://api.theracingapi.com/v1/results?start_date=${date}&end_date=${date}&limit=${limit}&skip=${skip}`;
      console.log(`📄 Request ${requestCount}: ${apiUrl}`);

      const pageData = await new Promise((resolve, reject) => {
        const req = https.get(apiUrl, options, (res) => {
          console.log(`📡 Request ${requestCount} response status: ${res.statusCode}`);
          
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });

          res.on('end', () => {
            try {
              const jsonData = JSON.parse(data);
              resolve(jsonData);
            } catch (error) {
              console.error(`❌ Error parsing request ${requestCount} response:`, error.message);
              reject(error);
            }
          });
        });

        req.on('error', (error) => {
          console.error(`❌ Error making API request ${requestCount}:`, error.message);
          reject(error);
        });

        req.setTimeout(30000, () => {
          console.error(`❌ Request timeout for request ${requestCount}`);
          req.destroy();
          reject(new Error(`Request timeout for request ${requestCount}`));
        });
      });

      // Set total expected from first request
      if (requestCount === 1) {
        totalExpected = pageData.total || 0;
        console.log(`🎯 TOTAL RACES EXPECTED: ${totalExpected}`);
        
        if (totalExpected === 0) {
          console.log(`ℹ️  No races found for ${date}`);
          break;
        }
      }

      // Add races from this request
      const pageRaces = pageData.results || [];
      allRaces = allRaces.concat(pageRaces);
      totalFetched += pageRaces.length;

      console.log(`📊 Request ${requestCount}: Got ${pageRaces.length} races (Total so far: ${totalFetched}/${totalExpected})`);

      // Break if no more races on this request or we have all races
      if (pageRaces.length === 0 || totalFetched >= totalExpected) {
        console.log(`✅ Finished pagination. Got all ${totalFetched} races.`);
        break;
      }

      // Update skip for next request
      skip += limit;
      
      // Safety check to prevent infinite loops
      if (requestCount > 10) {
        console.warn(`⚠️  Safety break: Stopped at request ${requestCount} to prevent infinite loop`);
        break;
      }

      // Small delay between requests to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Final validation
    if (totalFetched !== totalExpected && totalExpected > 0) {
      console.warn(`⚠️  WARNING: Expected ${totalExpected} races but got ${totalFetched}`);
    }

    // Save complete response to file for debugging
    const completeResponse = {
      total: totalExpected,
      fetched: totalFetched,
      requests: requestCount,
      results: allRaces
    };
    
    require('fs').writeFileSync(`debug-response-${date}-COMPLETE.json`, JSON.stringify(completeResponse, null, 2));
    console.log(`💾 Saved COMPLETE response to debug-response-${date}-COMPLETE.json`);
    
    console.log(`✅ Successfully fetched ALL results from API`);
    console.log(`📊 FINAL RESULT: ${totalFetched} races fetched (expected: ${totalExpected})`);
    
    return {
      total: totalExpected,
      results: allRaces
    };

  } catch (error) {
    console.error('❌ Error in paginated fetch:', error.message);
    throw error;
  }
};

// Get runner data from supabase
const getRunnerData = async (raceId, horseId) => {
  try {
    const { data, error } = await supabase
      .from('runners')
      .select('*')
      .eq('race_id', raceId)
      .eq('horse_id', horseId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
      console.warn(`⚠️  Error fetching runner data for ${horseId} in race ${raceId}:`, error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.warn(`⚠️  Exception fetching runner data for ${horseId} in race ${raceId}:`, error.message);
    return null;
  }
};

// Get race data from supabase
const getRaceData = async (raceId) => {
  try {
    const { data, error } = await supabase
      .from('races')
      .select('*')
      .eq('race_id', raceId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn(`⚠️  Error fetching race data for ${raceId}:`, error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.warn(`⚠️  Exception fetching race data for ${raceId}:`, error.message);
    return null;
  }
};

// Get odds data from supabase
const getOddsData = async (raceId, horseId) => {
  try {
    const { data, error } = await supabase
      .from('odds')
      .select('*')
      .eq('race_id', raceId)
      .eq('horse_id', horseId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn(`⚠️  Error fetching odds data for ${horseId} in race ${raceId}:`, error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.warn(`⚠️  Exception fetching odds data for ${horseId} in race ${raceId}:`, error.message);
    return null;
  }
};

// Get BSP data from UK or Ireland tables
const getBspData = async (horseName, raceDate, region) => {
  try {
    // Map region to correct table name based on actual database structure
    let tableName;
    if (region === 'IRE') {
      tableName = 'IRE_BSP_Historical';  // Ireland BSP table
    } else if (region === 'GBR' || region === 'UK' || !region) {
      tableName = 'UK_BSP_Historical';   // UK BSP table
    } else {
      // For other regions (USA, SAF, etc.) try UK table first as fallback
      tableName = 'UK_BSP_Historical';
    }
    
    // Convert date format from YYYY-MM-DD to DD-MM-YYYY for BSP table matching
    // BSP table uses format like "02-01-2025 16:05"
    const dateParts = raceDate.split('-'); // Split "2025-06-07"
    const bspDateFormat = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`; // Convert to "07-06-2025"
    
    console.log(`🔍 BSP lookup: ${tableName} for "${horseName}" on ${bspDateFormat}`);
    
    // Try multiple matching strategies for BSP data
    let data = null;
    let error = null;
    
    // Strategy 1: Exact horse name match with date (ignoring time component)
    ({ data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('selection_name', horseName)
      .ilike('event_dt', `${bspDateFormat}%`) // Match date part, ignore time
      .single());
    
    // Strategy 2: If no exact match, try partial name match
    if (!data && error?.code === 'PGRST116') {
      // Remove country codes and common suffixes for better matching
      const cleanHorseName = horseName.replace(/\s*\([A-Z]{2,3}\)$/, '').trim();
      console.log(`🔍 BSP fallback: searching for "${cleanHorseName}" on ${bspDateFormat}`);
      
      ({ data, error } = await supabase
        .from(tableName)
        .select('*')
        .ilike('selection_name', `%${cleanHorseName}%`)
        .ilike('event_dt', `${bspDateFormat}%`) // Match date part, ignore time
        .single());
    }

    if (error && error.code !== 'PGRST116') {
      console.warn(`⚠️  Error fetching BSP data for ${horseName} on ${raceDate}:`, error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.warn(`⚠️  Exception fetching BSP data for ${horseName} on ${raceDate}:`, error.message);
    return null;
  }
};

// Advanced Market Analysis Functions
const calculateAverageOpeningOdds = (oddsData) => {
  if (!oddsData) return null;
  
  const bookmakerFields = [
    'bet365_opening', 'william_hill_opening', 'paddy_power_opening', 'sky_bet_opening',
    'ladbrokes_opening', 'coral_opening', 'betfair_opening', 'betfred_opening',
    'unibet_opening', 'bet_uk_opening', 'bet_goodwin_opening', 'bet_victor_opening',
    'ten_bet_opening', 'seven_bet_opening', 'bet442_opening', 'betmgm_opening',
    'betway_opening', 'boyle_sports_opening', 'copybet_opening', 'dragon_bet_opening',
    'gentlemen_jim_opening', 'grosvenor_sports_opening', 'hollywood_bets_opening',
    'matchbook_opening', 'midnite_opening', 'pricedup_bet_opening', 'quinn_bet_opening',
    'sporting_index_opening', 'spreadex_opening', 'star_sports_opening',
    'virgin_bet_opening', 'talksport_bet_opening', 'betfair_exchange_opening'
  ];
  
  const validOdds = [];
  bookmakerFields.forEach(field => {
    const oddsValue = oddsData[field];
    if (oddsValue && !isNaN(parseFloat(oddsValue))) {
      validOdds.push(parseFloat(oddsValue));
    }
  });
  
  if (validOdds.length === 0) return null;
  
  const average = validOdds.reduce((sum, odds) => sum + odds, 0) / validOdds.length;
  return Math.round(average * 100) / 100;
};

const parseAverageOddsTimeSeries = (averageOddsString) => {
  if (!averageOddsString || typeof averageOddsString !== 'string') return [];
  
  // Parse format: "4.45_08:15 / 4.50_08:20 / 4.42_08:25"
  const entries = averageOddsString.split(' / ').map(entry => {
    const [odds, time] = entry.split('_');
    return {
      odds: parseFloat(odds),
      time: time,
      timestamp: time // for sorting if needed
    };
  }).filter(entry => !isNaN(entry.odds));
  
  return entries.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
};

const calculatePriceMovementMetrics = (averageOpeningOdds, averageOddsString) => {
  if (!averageOpeningOdds || !averageOddsString) {
    return {
      direction: null,
      magnitude: null
    };
  }
  
  const oddsEntries = parseAverageOddsTimeSeries(averageOddsString);
  if (oddsEntries.length === 0) {
    return {
      direction: null,
      magnitude: null
    };
  }
  
  const finalOdds = oddsEntries[oddsEntries.length - 1].odds;
  const percentageChange = ((finalOdds - averageOpeningOdds) / averageOpeningOdds) * 100;
  
  let direction = 'Neutral';
  let magnitude = Math.round(percentageChange * 100) / 100;
  
  if (Math.abs(percentageChange) >= 15) {
    if (percentageChange < 0) {
      direction = 'Positive'; // Odds got shorter (decreased)
      magnitude = Math.abs(magnitude); // Make positive for shorter odds
    } else {
      direction = 'Negative'; // Odds got longer (increased)
      magnitude = -magnitude; // Make negative for longer odds
    }
  }
  
  return {
    direction,
    magnitude: magnitude
  };
};

const calculateMarketConfidenceScore = (averageOddsString) => {
  if (!averageOddsString) return null;
  
  const oddsEntries = parseAverageOddsTimeSeries(averageOddsString);
  if (oddsEntries.length < 3) return null; // Need minimum data points
  
  let trendConsistency = 0;
  let directionChanges = 0;
  const tolerance = 0.03; // 3% tolerance for "no change"
  
  for (let i = 1; i < oddsEntries.length; i++) {
    const prevOdds = oddsEntries[i - 1].odds;
    const currentOdds = oddsEntries[i].odds;
    const change = (currentOdds - prevOdds) / prevOdds;
    
    // Skip if change is within tolerance
    if (Math.abs(change) <= tolerance) continue;
    
    // Check if direction changed from previous significant movement
    if (i > 1) {
      const prevChange = (prevOdds - oddsEntries[i - 2].odds) / oddsEntries[i - 2].odds;
      if (Math.abs(prevChange) > tolerance) {
        if ((prevChange > 0 && change < 0) || (prevChange < 0 && change > 0)) {
          directionChanges++;
        } else {
          trendConsistency++;
        }
      }
    }
  }
  
  const totalSignificantMoves = trendConsistency + directionChanges;
  if (totalSignificantMoves === 0) return 3; // Neutral if no significant moves
  
  const consistencyRatio = trendConsistency / totalSignificantMoves;
  
  // Adjust for market volatility (more data points = more volatile)
  const volatilityAdjustment = Math.min(1, oddsEntries.length / 50); // Max adjustment at 50+ data points
  const adjustedConsistency = consistencyRatio * (1 + volatilityAdjustment * 0.2);
  
  // Map to 1-5 scale
  if (adjustedConsistency >= 0.8) return 5; // Very confident/direct
  if (adjustedConsistency >= 0.6) return 4; // Confident
  if (adjustedConsistency >= 0.4) return 3; // Neutral
  if (adjustedConsistency >= 0.2) return 2; // Low confidence
  return 1; // Very low confidence/erratic
};

const calculateMoneyIndicators = (averageOpeningOdds, averageOddsString) => {
  if (!averageOpeningOdds || !averageOddsString) {
    return {
      earlyMoney: false,
      lateMoney: false
    };
  }
  
  const oddsEntries = parseAverageOddsTimeSeries(averageOddsString);
  if (oddsEntries.length === 0) {
    return {
      earlyMoney: false,
      lateMoney: false
    };
  }
  
  const finalOdds = oddsEntries[oddsEntries.length - 1].odds;
  const totalMovement = Math.abs((finalOdds - averageOpeningOdds) / averageOpeningOdds * 100);
  
  // Only analyze if movement is significant (>20%)
  if (totalMovement < 20) {
    return {
      earlyMoney: false,
      lateMoney: false
    };
  }
  
  // Find the 11:00 cutoff point or use first entry if no time data
  let earlyMoveSize = 0;
  let lateMoveSize = 0;
  let cutoffIndex = 0;
  
  // Find 11:00 cutoff
  for (let i = 0; i < oddsEntries.length; i++) {
    const time = oddsEntries[i].time;
    if (time && time >= '11:00') {
      cutoffIndex = i;
      break;
    }
  }
  
  // If no 11:00 found, use 60% of entries as cutoff
  if (cutoffIndex === 0) {
    cutoffIndex = Math.floor(oddsEntries.length * 0.6);
  }
  
  // Calculate early movement (opening to 11:00)
  if (cutoffIndex > 0) {
    const elevenAmOdds = oddsEntries[cutoffIndex].odds;
    earlyMoveSize = Math.abs((elevenAmOdds - averageOpeningOdds) / averageOpeningOdds * 100);
  }
  
  // Calculate late movement (11:00 to close)
  if (cutoffIndex < oddsEntries.length - 1) {
    const elevenAmOdds = oddsEntries[cutoffIndex].odds;
    lateMoveSize = Math.abs((finalOdds - elevenAmOdds) / elevenAmOdds * 100);
  }
  
  return {
    earlyMoney: earlyMoveSize >= (totalMovement * 0.6),
    lateMoney: lateMoveSize >= (totalMovement * 0.6)
  };
};

// Calculate derived fields
const calculateDerivedFields = (runner, results, runnerData, oddsData) => {
  const derived = {};
  
  // Win/place flags
  derived.win_flag = runner.position === '1';
  derived.place_flag = ['1', '2', '3'].includes(runner.position);
  
  // Favorite indicator
  derived.favorite_indicator = runner.sp && runner.sp.includes('F') ? 'F' : null;
  derived.joint_favorite_indicator = runner.sp && runner.sp.includes('JF');
  
  // Extract opening price from comment
  const comment = runner.comment || '';
  const openingMatch = comment.match(/\(op ([^)]+)\)/);
  derived.opening_price_mentioned = openingMatch ? openingMatch[1] : null;
  
  const touchedMatch = comment.match(/tchd ([^)]+)/);
  derived.price_touched_mentioned = touchedMatch ? touchedMatch[1] : null;
  
  // Convert beaten lengths to numeric
  derived.beaten_distance_numeric = runner.btn && runner.btn !== '0' ? parseFloat(runner.btn) : 0;
  derived.overall_beaten_distance_numeric = runner.ovr_btn && runner.ovr_btn !== '0' ? parseFloat(runner.ovr_btn) : 0;
  
  // NEW ADVANCED MARKET ANALYSIS FIELDS
  
  // 1. Average opening odds
  derived.average_opening_odds = calculateAverageOpeningOdds(oddsData);
  
  // 2 & 3. Price movement direction and magnitude
  const priceMovement = calculatePriceMovementMetrics(
    derived.average_opening_odds, 
    runnerData?.average_odds
  );
  derived.price_movement_direction = priceMovement.direction;
  derived.price_movement_magnitude = priceMovement.magnitude;
  
  // 4. Market confidence score
  derived.market_confidence_score = calculateMarketConfidenceScore(runnerData?.average_odds);
  
  // 5 & 6. Early and late money indicators
  const moneyIndicators = calculateMoneyIndicators(
    derived.average_opening_odds,
    runnerData?.average_odds
  );
  derived.early_money_indicator = moneyIndicators.earlyMoney;
  derived.late_money_indicator = moneyIndicators.lateMoney;
  

  
  return derived;
};

// Build master results row
const buildMasterResultsRow = (race, runner, raceData, runnerData, oddsData, bspData) => {
  const derivedFields = calculateDerivedFields(runner, race, runnerData, oddsData);
  
  return {
    // Race Information
    race_id: race.race_id,
    course: race.course,
    course_id: race.course_id,
    race_date: race.date,
    off_time: race.off,
    off_dt: race.off_dt,
    race_name: race.race_name,
    dist: race.dist,
    distance_f: raceData?.distance_f || null,
    distance_round: raceData?.distance_round || null,
    dist_y: race.dist_y,
    dist_m: race.dist_m,
    dist_f: race.dist_f,
    pattern: race.pattern,
    race_class: race.class,
    type: race.type,
    age_band: race.age_band,
    rating_band: race.rating_band,
    sex_rest: race.sex_rest,
    going: race.going,
    going_detailed: raceData?.going_detailed || null,
    surface: race.surface,
    jumps: race.jumps,
    prize: raceData?.prize || null,
    field_size: raceData?.field_size || null,
    region: race.region,
    big_race: raceData?.big_race || false,
    is_abandoned: raceData?.is_abandoned || false,
    
    // Runner/Horse Information
    runner_id: runnerData?.id || null,
    horse_id: runner.horse_id,
    horse: runner.horse,
    number: runner.number,
    draw: runner.draw,
    dob: runnerData?.dob || null,
    age: runner.age,
    sex: runner.sex,
    sex_code: runnerData?.sex_code || null,
    colour: runnerData?.colour || null,
    sire: runner.sire,
    sire_id: runner.sire_id,
    dam: runner.dam,
    dam_id: runner.dam_id,
    damsire: runner.damsire,
    damsire_id: runner.damsire_id,
    trainer: runner.trainer,
    trainer_id: runner.trainer_id,
    jockey: runner.jockey,
    jockey_id: runner.jockey_id,
    jockey_claim_lbs: runner.jockey_claim_lbs,
    owner: runner.owner,
    owner_id: runner.owner_id,
    weight_lbs: runner.weight_lbs,
    headgear: runner.headgear,
    comment: runnerData?.comment || null,
    
    // Technical Analysis (from runners table)
    "5_moving_average": runnerData?.["5_moving_average"] || null,
    "20_moving_average": runnerData?.["20_moving_average"] || null,
    "60_moving_average": runnerData?.["60_moving_average"] || null,
    "5_bollinger_bands": runnerData?.["5_bollinger_bands"] || null,
    "20_bollinger_bands": runnerData?.["20_bollinger_bands"] || null,
    "60_bollinger_bands": runnerData?.["60_bollinger_bands"] || null,
    support_levels: runnerData?.support_levels || null,
    resistance_levels: runnerData?.resistance_levels || null,
    price_change: runnerData?.price_change || null,
    average_odds: runnerData?.average_odds || null,
    market_pressure_shortening: runnerData?.market_pressure_shortening || null,
    market_pressure_drifting: runnerData?.market_pressure_drifting || null,
    momentum_steaming: runnerData?.momentum_steaming || null,
    momentum_drifting: runnerData?.momentum_drifting || null,
    sharp_average_odds: runnerData?.sharp_average_odds || null,
    
    // Opening Odds (mapping all bookmakers)
    bet365_opening: oddsData?.bet365_opening || null,
    william_hill_opening: oddsData?.william_hill_opening || null,
    paddy_power_opening: oddsData?.paddy_power_opening || null,
    sky_bet_opening: oddsData?.sky_bet_opening || null,
    ladbrokes_opening: oddsData?.ladbrokes_opening || null,
    coral_opening: oddsData?.coral_opening || null,
    betfair_opening: oddsData?.betfair_opening || null,
    betfred_opening: oddsData?.betfred_opening || null,
    unibet_opening: oddsData?.unibet_opening || null,
    bet_uk_opening: oddsData?.bet_uk_opening || null,
    bet_goodwin_opening: oddsData?.bet_goodwin_opening || null,
    bet_victor_opening: oddsData?.bet_victor_opening || null,
    ten_bet_opening: oddsData?.ten_bet_opening || null,
    seven_bet_opening: oddsData?.seven_bet_opening || null,
    bet442_opening: oddsData?.bet442_opening || null,
    betmgm_opening: oddsData?.betmgm_opening || null,
    betway_opening: oddsData?.betway_opening || null,
    boyle_sports_opening: oddsData?.boyle_sports_opening || null,
    copybet_opening: oddsData?.copybet_opening || null,
    dragon_bet_opening: oddsData?.dragon_bet_opening || null,
    gentlemen_jim_opening: oddsData?.gentlemen_jim_opening || null,
    grosvenor_sports_opening: oddsData?.grosvenor_sports_opening || null,
    hollywood_bets_opening: oddsData?.hollywood_bets_opening || null,
    matchbook_opening: oddsData?.matchbook_opening || null,
    midnite_opening: oddsData?.midnite_opening || null,
    pricedup_bet_opening: oddsData?.pricedup_bet_opening || null,
    quinn_bet_opening: oddsData?.quinn_bet_opening || null,
    sporting_index_opening: oddsData?.sporting_index_opening || null,
    spreadex_opening: oddsData?.spreadex_opening || null,
    star_sports_opening: oddsData?.star_sports_opening || null,
    virgin_bet_opening: oddsData?.virgin_bet_opening || null,
    talksport_bet_opening: oddsData?.talksport_bet_opening || null,
    betfair_exchange_opening: oddsData?.betfair_exchange_opening || null,
    
    // Odds History
    bet365_history: oddsData?.bet365_history || '',
    william_hill_history: oddsData?.william_hill_history || '',
    paddy_power_history: oddsData?.paddy_power_history || '',
    sky_bet_history: oddsData?.sky_bet_history || '',
    ladbrokes_history: oddsData?.ladbrokes_history || '',
    coral_history: oddsData?.coral_history || '',
    betfair_history: oddsData?.betfair_history || '',
    betfred_history: oddsData?.betfred_history || '',
    unibet_history: oddsData?.unibet_history || '',
    bet_uk_history: oddsData?.bet_uk_history || '',
    bet_goodwin_history: oddsData?.bet_goodwin_history || '',
    bet_victor_history: oddsData?.bet_victor_history || '',
    ten_bet_history: oddsData?.ten_bet_history || '',
    seven_bet_history: oddsData?.seven_bet_history || '',
    bet442_history: oddsData?.bet442_history || '',
    betmgm_history: oddsData?.betmgm_history || '',
    betway_history: oddsData?.betway_history || '',
    boyle_sports_history: oddsData?.boyle_sports_history || '',
    copybet_history: oddsData?.copybet_history || '',
    dragon_bet_history: oddsData?.dragon_bet_history || '',
    gentlemen_jim_history: oddsData?.gentlemen_jim_history || '',
    grosvenor_sports_history: oddsData?.grosvenor_sports_history || '',
    hollywood_bets_history: oddsData?.hollywood_bets_history || '',
    matchbook_history: oddsData?.matchbook_history || '',
    midnite_history: oddsData?.midnite_history || '',
    pricedup_bet_history: oddsData?.pricedup_bet_history || '',
    quinn_bet_history: oddsData?.quinn_bet_history || '',
    sporting_index_history: oddsData?.sporting_index_history || '',
    spreadex_history: oddsData?.spreadex_history || '',
    star_sports_history: oddsData?.star_sports_history || '',
    virgin_bet_history: oddsData?.virgin_bet_history || '',
    talksport_bet_history: oddsData?.talksport_bet_history || '',
    betfair_exchange_history: oddsData?.betfair_exchange_history || '',
    
    // Place Odds
    bet365_places: oddsData?.bet365_places || null,
    william_hill_places: oddsData?.william_hill_places || null,
    paddy_power_places: oddsData?.paddy_power_places || null,
    sky_bet_places: oddsData?.sky_bet_places || null,
    ladbrokes_places: oddsData?.ladbrokes_places || null,
    coral_places: oddsData?.coral_places || null,
    betfair_places: oddsData?.betfair_places || null,
    betfred_places: oddsData?.betfred_places || null,
    unibet_places: oddsData?.unibet_places || null,
    bet_uk_places: oddsData?.bet_uk_places || null,
    bet_goodwin_places: oddsData?.bet_goodwin_places || null,
    bet_victor_places: oddsData?.bet_victor_places || null,
    ten_bet_places: oddsData?.ten_bet_places || null,
    seven_bet_places: oddsData?.seven_bet_places || null,
    bet442_places: oddsData?.bet442_places || null,
    betmgm_places: oddsData?.betmgm_places || null,
    betway_places: oddsData?.betway_places || null,
    boyle_sports_places: oddsData?.boyle_sports_places || null,
    copybet_places: oddsData?.copybet_places || null,
    dragon_bet_places: oddsData?.dragon_bet_places || null,
    gentlemen_jim_places: oddsData?.gentlemen_jim_places || null,
    grosvenor_sports_places: oddsData?.grosvenor_sports_places || null,
    hollywood_bets_places: oddsData?.hollywood_bets_places || null,
    matchbook_places: oddsData?.matchbook_places || null,
    midnite_places: oddsData?.midnite_places || null,
    pricedup_bet_places: oddsData?.pricedup_bet_places || null,
    quinn_bet_places: oddsData?.quinn_bet_places || null,
    sporting_index_places: oddsData?.sporting_index_places || null,
    
    // Post-Race Results
    position: runner.position,
    sp: runner.sp,
    sp_dec: runner.sp_dec,
    btn: runner.btn,
    ovr_btn: runner.ovr_btn,
    time: runner.time,
    or_rating: runner.or,
    rpr_result: runner.rpr,
    tsr_result: runner.tsr,
    prize_won: runner.prize,
    comment_result: runner.comment,
    
    // Race Result Details
    winning_time_detail: race.winning_time_detail,
    race_comments: race.comments,
    non_runners: race.non_runners,
    tote_win: race.tote_win,
    tote_place: race.tote_pl,
    tote_exacta: race.tote_ex,
    tote_csf: race.tote_csf,
    tote_tricast: race.tote_tricast,
    tote_trifecta: race.tote_trifecta,
    
    // BSP Data (Betfair Starting Prices and Market Data) - Only columns that exist in DB
    betfair_event_id: bspData?.event_id || null,
    betfair_selection_id: bspData?.selection_id || null,
    bsp: bspData?.bsp || null,
    ppwap: bspData?.ppwap || null,
    morningwap: bspData?.morningwap || null,
    ppmax: bspData?.ppmax || null,
    ppmin: bspData?.ppmin || null,
    ipmax: bspData?.ipmax || null,
    ipmin: bspData?.ipmin || null,
    total_traded_volume: bspData ? 
      (bspData.morningtradedvol || 0) + (bspData.pptradedvol || 0) + (bspData.iptradedvol || 0) : null,
    
    // Derived ML Fields
    ...derivedFields
  };
};

// Check if record already exists
const recordExists = async (raceId, horseId) => {
  try {
    const { data, error } = await supabase
      .from('master_results')
      .select('id')
      .eq('race_id', raceId)
      .eq('horse_id', horseId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn(`⚠️  Error checking existing record for ${horseId} in race ${raceId}:`, error.message);
      return false;
    }

    return !!data;
  } catch (error) {
    console.warn(`⚠️  Exception checking existing record for ${horseId} in race ${raceId}:`, error.message);
    return false;
  }
};

// Insert or update master results record
const insertMasterResult = async (resultRow, isUpdate = false) => {
  try {
    let result;
    
    if (isUpdate) {
      // Update existing record
      result = await supabase
        .from('master_results')
        .update(resultRow)
        .eq('race_id', resultRow.race_id)
        .eq('horse_id', resultRow.horse_id);
    } else {
      // Insert new record
      result = await supabase
        .from('master_results')
        .insert([resultRow]);
    }

    if (result.error) {
      console.error(`❌ Error ${isUpdate ? 'updating' : 'inserting'} record for ${resultRow.horse} in race ${resultRow.race_id}:`, result.error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`❌ Exception ${isUpdate ? 'updating' : 'inserting'} record for ${resultRow.horse} in race ${resultRow.race_id}:`, error.message);
    return false;
  }
};

// Main processing function
const processResults = async (results, isUpdate = false) => {
  let totalProcessed = 0;
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalErrors = 0;

  console.log(`\n🔄 Processing ${results.results?.length || 0} races...`);

  for (const race of results.results || []) {
    console.log(`\n📍 Processing race: ${race.race_name} at ${race.course} (${race.race_id})`);
    
    // Get race data from supabase
    const raceData = await getRaceData(race.race_id);
    
    for (const runner of race.runners || []) {
      totalProcessed++;
      
      try {
        // Check if record already exists
        const exists = await recordExists(race.race_id, runner.horse_id);
        
        if (exists && !isUpdate) {
          console.log(`⏭️  Record already exists for ${runner.horse}, skipping...`);
          continue;
        }
        
        console.log(`${exists ? '🔄 Updating' : '➕ Creating'} ${runner.horse} (${runner.horse_id})...`);
        
        // Get all the supplementary data
        const [runnerData, oddsData, bspData] = await Promise.all([
          getRunnerData(race.race_id, runner.horse_id),
          getOddsData(race.race_id, runner.horse_id),
          getBspData(runner.horse, race.date, race.region)
        ]);
        
        // Log data availability for key sources
        const dataStatus = [
          runnerData ? 'Runner✅' : 'Runner❌',
          oddsData ? 'Odds✅' : 'Odds❌', 
          bspData ? 'BSP✅' : 'BSP❌'
        ].join(' ');
        console.log(`📊 ${runner.horse}: ${dataStatus}`);
        
        // Build the master results row
        const resultRow = buildMasterResultsRow(race, runner, raceData, runnerData, oddsData, bspData);
        
        // Insert or update the record - use isUpdate flag properly
        const shouldUpdate = exists && isUpdate;
        const success = await insertMasterResult(resultRow, shouldUpdate);
        
        if (success) {
          if (shouldUpdate) {
            totalUpdated++;
            console.log(`✅ Updated record for ${runner.horse}`);
          } else {
            totalInserted++;
            console.log(`✅ Inserted record for ${runner.horse}`);
          }
        } else {
          totalErrors++;
        }
        
        // Small delay to avoid overwhelming the database
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        totalErrors++;
        console.error(`❌ Error processing ${runner.horse}:`, error.message);
      }
    }
  }

  console.log(`\n📊 Processing Summary:`);
  console.log(`   Total processed: ${totalProcessed}`);
  console.log(`   Successfully inserted: ${totalInserted}`);
  console.log(`   Successfully updated: ${totalUpdated}`);
  console.log(`   Errors: ${totalErrors}`);
  
  return {
    totalProcessed,
    totalInserted,
    totalUpdated,
    totalErrors
  };
};

// Main execution function
const main = async () => {
  try {
    console.log('🚀 Starting Master Results Population Script');
    
    const targetDate = getYesterdayDate();
    console.log(`📅 Target date (yesterday): ${targetDate}`);
    
    // Always run in UPDATE mode to ensure complete data
    const isUpdate = true;
    console.log(`🔄 Run mode: UPDATE (updating existing records with latest data)`)
    
    // Fetch results from API
    const results = await fetchRacingResults(targetDate);
    
    console.log(`📊 API Response: ${results.results?.length || 0} races, ${results.total} total available`);
    
    if (!results.results || results.results.length === 0) {
      console.log('ℹ️  No results found for the target date');
      return;
    }
    
    console.log(`📋 Found ${results.results.length} races with results`);
    
    // Process all results
    const summary = await processResults(results, isUpdate);
    
    console.log('\n🎉 Script completed successfully!');
    console.log(`📈 Final stats: ${summary.totalInserted} inserted, ${summary.totalUpdated} updated, ${summary.totalErrors} errors`);
    
  } catch (error) {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, processResults, fetchRacingResults }; 