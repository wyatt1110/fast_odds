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

// Get BSP data from UK_BSP_Historical or IRE_BSP_Historical tables
const getBspData = async (horseName, raceDate, region) => {
  try {
    // Map region to correct BSP table
    let tableName;
    if (region === 'IRE') {
      tableName = 'IRE_BSP_Historical';  // Ireland BSP table
    } else if (region === 'GBR' || region === 'UK' || !region) {
      tableName = 'UK_BSP_Historical';   // UK BSP table (default)
    } else {
      // For other regions (USA, SAF, etc.) try UK table first as fallback
      tableName = 'UK_BSP_Historical';
    }
    
    // Clean the horse name for matching
    const cleanHorseName = horseName
      .replace(/\s*\([^)]*\)/, '') // Remove country codes like (GB), (IRE)
      .trim();

    // Convert date format from YYYY-MM-DD to DD-MM-YYYY for BSP table matching
    // BSP table uses format like "02-01-2025 16:05"
    const dateParts = raceDate.split('-'); // Split "2025-06-18"
    const bspDateFormat = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`; // Convert to "18-06-2025"
    
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
      ({ data, error } = await supabase
        .from(tableName)
        .select('*')
        .ilike('selection_name', `%${cleanHorseName}%`)
        .ilike('event_dt', `${bspDateFormat}%`) // Match date part, ignore time
        .single());
    }

    if (error && error.code !== 'PGRST116') {
      // Don't log BSP misses as warnings - they're expected to be missing often
      return null;
    }

    return data;
  } catch (error) {
    // BSP data is often missing, don't log as error
    return null;
  }
};

// Get timeform data from supabase
const getTimeformData = async (raceId, horseId) => {
  try {
    const { data, error } = await supabase
      .from('timeform')
      .select('*')
      .eq('race_id', raceId)
      .eq('horse_id', horseId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn(`⚠️  Error fetching timeform data for ${horseId} in race ${raceId}:`, error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.warn(`⚠️  Exception fetching timeform data for ${horseId} in race ${raceId}:`, error.message);
    return null;
  }
};

// Get pace figures data from supabase - SPECIAL HANDLING for horse_id
const getPaceFigsData = async (raceId, horseId) => {
  try {
    // Extract numeric part from horse_id (remove 'hrs_' prefix)
    const numericHorseId = horseId.replace(/^hrs_/, '');
    
    const { data, error } = await supabase
      .from('pace_figs')
      .select('*')
      .eq('race_id', raceId)
      .eq('horse_id', numericHorseId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.warn(`⚠️  Error fetching pace_figs data for ${horseId} (${numericHorseId}) in race ${raceId}:`, error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.warn(`⚠️  Exception fetching pace_figs data for ${horseId} in race ${raceId}:`, error.message);
    return null;
  }
};

// Helper function to extract numeric value from adjusted timeform figures
const extractNumericFromAdj = (adjValue) => {
  if (!adjValue) return null;
  // Remove 'p' prefix and '+' suffix, then convert to number
  const numericString = adjValue.toString().replace(/^p/, '').replace(/\+$/, '');
  const numeric = parseFloat(numericString);
  return isNaN(numeric) ? null : numeric;
};

// Calculate timeform averages from past performance data
const calculateTimeformAverages = (timeformData) => {
  if (!timeformData) {
    return {
      lto_adj_tfr: null,
      avr_adj_tfr: null,
      lto_tfig: null,
      avr_tfig: null,
      lto_tfr: null,
      avr_tfr: null
    };
  }

  // Extract LTO (Last Time Out) values from pp_1 columns
  const lto_adj_tfr = extractNumericFromAdj(timeformData.pp_1_adj);
  const lto_tfig = timeformData.pp_1_tfig ? parseFloat(timeformData.pp_1_tfig) : null;
  const lto_tfr = timeformData.pp_1_tfr ? parseFloat(timeformData.pp_1_tfr) : null;

  // Calculate averages from all past performances (pp_1 to pp_6)
  const adjValues = [];
  const tfigValues = [];
  const tfrValues = [];

  for (let i = 1; i <= 6; i++) {
    const adjField = `pp_${i}_adj`;
    const tfigField = `pp_${i}_tfig`;
    const tfrField = `pp_${i}_tfr`;

    if (timeformData[adjField]) {
      const adjNumeric = extractNumericFromAdj(timeformData[adjField]);
      if (adjNumeric !== null) adjValues.push(adjNumeric);
    }

    if (timeformData[tfigField]) {
      const tfigNumeric = parseFloat(timeformData[tfigField]);
      if (!isNaN(tfigNumeric)) tfigValues.push(tfigNumeric);
    }

    if (timeformData[tfrField]) {
      const tfrNumeric = parseFloat(timeformData[tfrField]);
      if (!isNaN(tfrNumeric)) tfrValues.push(tfrNumeric);
    }
  }

  // Calculate averages
  const avr_adj_tfr = adjValues.length > 0 ? 
    adjValues.reduce((sum, val) => sum + val, 0) / adjValues.length : null;
  const avr_tfig = tfigValues.length > 0 ? 
    tfigValues.reduce((sum, val) => sum + val, 0) / tfigValues.length : null;
  const avr_tfr = tfrValues.length > 0 ? 
    tfrValues.reduce((sum, val) => sum + val, 0) / tfrValues.length : null;

  return {
    lto_adj_tfr,
    avr_adj_tfr: avr_adj_tfr ? parseFloat(avr_adj_tfr.toFixed(2)) : null,
    lto_tfig,
    avr_tfig: avr_tfig ? parseFloat(avr_tfig.toFixed(2)) : null,
    lto_tfr,
    avr_tfr: avr_tfr ? parseFloat(avr_tfr.toFixed(2)) : null
  };
};

// Calculate average opening odds from odds data
const calculateAverageOpeningOdds = (oddsData) => {
  if (!oddsData) return null;

  const openingOddsFields = [
    'bet365_opening', 'william_hill_opening', 'paddy_power_opening', 'sky_bet_opening',
    'ladbrokes_opening', 'coral_opening', 'betfair_opening', 'betfred_opening',
    'unibet_opening', 'bet_goodwin_opening', 'bet_victor_opening', 'ten_bet_opening',
    'seven_bet_opening', 'bet442_opening', 'betmgm_opening', 'betway_opening',
    'boyle_sports_opening', 'dragon_bet_opening', 'gentlemen_jim_opening',
    'grosvenor_sports_opening', 'matchbook_opening', 'midnite_opening',
    'pricedup_bet_opening', 'quinn_bet_opening', 'sporting_index_opening',
    'spreadex_opening', 'star_sports_opening', 'virgin_bet_opening',
    'talksport_bet_opening', 'betfair_exchange_opening'
  ];

  const validOdds = openingOddsFields
    .map(field => oddsData[field])
    .filter(odds => odds && !isNaN(parseFloat(odds)))
    .map(odds => parseFloat(odds));

  if (validOdds.length === 0) return null;

  const average = validOdds.reduce((sum, odds) => sum + odds, 0) / validOdds.length;
  return average.toFixed(2);
};

// Parse average odds time series from history string
const parseAverageOddsTimeSeries = (averageOddsString) => {
  if (!averageOddsString || averageOddsString.trim() === '') return [];
  
  try {
    // Parse time series data from comma-separated values or other format
    const entries = averageOddsString.split(',').map(entry => {
      const parts = entry.trim().split(':');
      if (parts.length >= 2) {
        return {
          time: parts[0],
          odds: parseFloat(parts[1])
        };
      }
      return null;
    }).filter(entry => entry !== null);
    
    return entries;
  } catch (error) {
    return [];
  }
};

// Calculate price movement metrics
const calculatePriceMovementMetrics = (averageOpeningOdds, averageOddsString) => {
  const openingOdds = parseFloat(averageOpeningOdds);
  const timeSeries = parseAverageOddsTimeSeries(averageOddsString);
  
  if (!openingOdds || timeSeries.length === 0) {
    return {
      price_movement_direction: null,
      price_movement_magnitude: null
    };
  }
  
  const latestOdds = timeSeries[timeSeries.length - 1].odds;
  const change = latestOdds - openingOdds;
  const percentChange = ((change / openingOdds) * 100).toFixed(1);
  
  let direction = 'stable';
  if (Math.abs(change) > 0.1) {
    direction = change > 0 ? 'drifting' : 'shortening';
  }
  
  return {
    price_movement_direction: direction,
    price_movement_magnitude: `${percentChange}%`
  };
};

// Calculate market confidence score
const calculateMarketConfidenceScore = (averageOddsString) => {
  const timeSeries = parseAverageOddsTimeSeries(averageOddsString);
  
  if (timeSeries.length < 3) return null;
  
  // Calculate variance in odds to determine market confidence
  const odds = timeSeries.map(entry => entry.odds);
  const mean = odds.reduce((sum, odd) => sum + odd, 0) / odds.length;
  const variance = odds.reduce((sum, odd) => sum + Math.pow(odd - mean, 2), 0) / odds.length;
  const stdDev = Math.sqrt(variance);
  
  // Lower standard deviation indicates higher confidence
  const confidenceScore = Math.max(0, 100 - (stdDev / mean * 100)).toFixed(1);
  
  let confidenceLevel = 'low';
  if (confidenceScore > 80) confidenceLevel = 'high';
  else if (confidenceScore > 60) confidenceLevel = 'medium';
  
  return `${confidenceLevel} (${confidenceScore}%)`;
};

// Calculate early and late money indicators
const calculateMoneyIndicators = (averageOpeningOdds, averageOddsString) => {
  const timeSeries = parseAverageOddsTimeSeries(averageOddsString);
  const openingOdds = parseFloat(averageOpeningOdds);
  
  if (!openingOdds || timeSeries.length < 3) {
    return {
      early_money_indicator: null,
      late_money_indicator: null
    };
  }
  
  // Split time series into early (first third) and late (last third) periods
  const thirdPoint = Math.floor(timeSeries.length / 3);
  const twoThirdsPoint = Math.floor(timeSeries.length * 2 / 3);
  
  const earlyPeriod = timeSeries.slice(0, thirdPoint);
  const latePeriod = timeSeries.slice(twoThirdsPoint);
  
  if (earlyPeriod.length === 0 || latePeriod.length === 0) {
    return {
      early_money_indicator: null,
      late_money_indicator: null
    };
  }
  
  // Calculate average odds for each period
  const earlyAverage = earlyPeriod.reduce((sum, entry) => sum + entry.odds, 0) / earlyPeriod.length;
  const lateAverage = latePeriod.reduce((sum, entry) => sum + entry.odds, 0) / latePeriod.length;
  
  // Determine money indicators based on movement
  const earlyChange = ((earlyAverage - openingOdds) / openingOdds * 100).toFixed(1);
  const lateChange = ((lateAverage - earlyAverage) / earlyAverage * 100).toFixed(1);
  
  let earlyIndicator = 'neutral';
  if (Math.abs(earlyChange) > 5) {
    earlyIndicator = earlyChange > 0 ? 'drifting' : 'backed';
  }
  
  let lateIndicator = 'neutral';
  if (Math.abs(lateChange) > 5) {
    lateIndicator = lateChange > 0 ? 'drifting' : 'backed';
  }
  
  return {
    early_money_indicator: `${earlyIndicator} (${earlyChange}%)`,
    late_money_indicator: `${lateIndicator} (${lateChange}%)`
  };
};

// Calculate derived fields for machine learning
const calculateDerivedFields = (runner, results, runnerData, oddsData) => {
  // Calculate average opening odds
  const averageOpeningOdds = calculateAverageOpeningOdds(oddsData);
  
  // Get average odds time series from runner data if available
  const averageOddsString = runnerData?.average_odds || '';
  
  // Calculate price movement metrics
  const priceMovement = calculatePriceMovementMetrics(averageOpeningOdds, averageOddsString);
  
  // Calculate market confidence
  const marketConfidence = calculateMarketConfidenceScore(averageOddsString);
  
  // Calculate money indicators
  const moneyIndicators = calculateMoneyIndicators(averageOpeningOdds, averageOddsString);
  
  // Calculate result flags
  const position = parseInt(runner.position);
  const winFlag = position === 1;
  const placeFlag = position <= 3; // Assuming place pays to 3rd
  
  // Determine if favorite (lowest odds)
  const sp = parseFloat(runner.sp_dec || runner.sp);
  const favoriteFlag = sp && sp <= 3.0; // Rough favorite threshold
  
  return {
    average_opening_odds: averageOpeningOdds,
    win_flag: winFlag,
    place_flag: placeFlag,
    favorite_flag: favoriteFlag,
    ...priceMovement,
    market_confidence_score: marketConfidence,
    ...moneyIndicators
  };
};

// Build complete master results row with all available data
const buildMasterResultsRow = (race, runner, raceData, runnerData, oddsData, bspData, timeformData, paceFigsData) => {
  const derivedFields = calculateDerivedFields(runner, race, runnerData, oddsData);
  const timeformAverages = calculateTimeformAverages(timeformData);
  
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
    rpr: runner.rpr,
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
    
    // Opening Odds (only columns that exist in database)
    bet365_opening: oddsData?.bet365_opening || null,
    william_hill_opening: oddsData?.william_hill_opening || null,
    paddy_power_opening: oddsData?.paddy_power_opening || null,
    sky_bet_opening: oddsData?.sky_bet_opening || null,
    ladbrokes_opening: oddsData?.ladbrokes_opening || null,
    coral_opening: oddsData?.coral_opening || null,
    betfair_opening: oddsData?.betfair_opening || null,
    betfred_opening: oddsData?.betfred_opening || null,
    unibet_opening: oddsData?.unibet_opening || null,
    bet_goodwin_opening: oddsData?.bet_goodwin_opening || null,
    bet_victor_opening: oddsData?.bet_victor_opening || null,
    ten_bet_opening: oddsData?.ten_bet_opening || null,
    seven_bet_opening: oddsData?.seven_bet_opening || null,
    bet442_opening: oddsData?.bet442_opening || null,
    betmgm_opening: oddsData?.betmgm_opening || null,
    betway_opening: oddsData?.betway_opening || null,
    boyle_sports_opening: oddsData?.boyle_sports_opening || null,
    dragon_bet_opening: oddsData?.dragon_bet_opening || null,
    gentlemen_jim_opening: oddsData?.gentlemen_jim_opening || null,
    grosvenor_sports_opening: oddsData?.grosvenor_sports_opening || null,
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
    
    // Odds History (only columns that exist in database)
    bet365_history: oddsData?.bet365_history || '',
    william_hill_history: oddsData?.william_hill_history || '',
    paddy_power_history: oddsData?.paddy_power_history || '',
    sky_bet_history: oddsData?.sky_bet_history || '',
    ladbrokes_history: oddsData?.ladbrokes_history || '',
    coral_history: oddsData?.coral_history || '',
    betfair_history: oddsData?.betfair_history || '',
    betfred_history: oddsData?.betfred_history || '',
    unibet_history: oddsData?.unibet_history || '',
    bet_goodwin_history: oddsData?.bet_goodwin_history || '',
    bet_victor_history: oddsData?.bet_victor_history || '',
    ten_bet_history: oddsData?.ten_bet_history || '',
    seven_bet_history: oddsData?.seven_bet_history || '',
    bet442_history: oddsData?.bet442_history || '',
    betmgm_history: oddsData?.betmgm_history || '',
    betway_history: oddsData?.betway_history || '',
    boyle_sports_history: oddsData?.boyle_sports_history || '',
    dragon_bet_history: oddsData?.dragon_bet_history || '',
    gentlemen_jim_history: oddsData?.gentlemen_jim_history || '',
    grosvenor_sports_history: oddsData?.grosvenor_sports_history || '',
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
    
    // Place Odds (only columns that exist in database)
    bet365_places: oddsData?.bet365_places || null,
    william_hill_places: oddsData?.william_hill_places || null,
    paddy_power_places: oddsData?.paddy_power_places || null,
    sky_bet_places: oddsData?.sky_bet_places || null,
    ladbrokes_places: oddsData?.ladbrokes_places || null,
    coral_places: oddsData?.coral_places || null,
    betfair_places: oddsData?.betfair_places || null,
    betfred_places: oddsData?.betfred_places || null,
    unibet_places: oddsData?.unibet_places || null,
    bet_goodwin_places: oddsData?.bet_goodwin_places || null,
    bet_victor_places: oddsData?.bet_victor_places || null,
    ten_bet_places: oddsData?.ten_bet_places || null,
    betmgm_places: oddsData?.betmgm_places || null,
    betway_places: oddsData?.betway_places || null,
    boyle_sports_places: oddsData?.boyle_sports_places || null,
    dragon_bet_places: oddsData?.dragon_bet_places || null,
    gentlemen_jim_places: oddsData?.gentlemen_jim_places || null,
    grosvenor_sports_places: oddsData?.grosvenor_sports_places || null,
    midnite_places: oddsData?.midnite_places || null,
    pricedup_bet_places: oddsData?.pricedup_bet_places || null,
    quinn_bet_places: oddsData?.quinn_bet_places || null,
    sporting_index_places: oddsData?.sporting_index_places || null,
    
    // Post-Race Results
    position: runner.position,
    sp: runner.sp,
    sp_dec: runner.sp_dec,
    time: runner.time,
    or_rating: runner.or,
    rpr_result: runner.rpr,
    tsr_result: runner.tsr,
    prize_won: runner.prize,
    comment_result: runner.comment,
    
    // Beaten Distance Data (from API: ovr_btn -> overall_beaten_distance_numeric, btn -> beaten_distance_numeric)
    overall_beaten_distance_numeric: runner.ovr_btn ? parseFloat(runner.ovr_btn) : null,
    beaten_distance_numeric: runner.btn ? parseFloat(runner.btn) : null,
    
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
    
    // BSP Data (Betfair Starting Prices and Market Data) - From UK_BSP_Historical/IRE_BSP_Historical
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
    
    // Jockey Statistics (from runners table)
    jockey_lifetime: runnerData?.jockey_lifetime || null,
    jockey_12_months: runnerData?.jockey_12_months || null,
    jockey_3_months: runnerData?.jockey_3_months || null,
    jockey_trainer: runnerData?.jockey_trainer || null,
    jockey_trainer_3_months: runnerData?.jockey_trainer_3_months || null,
    jockey_course: runnerData?.jockey_course || null,
    jockey_owner: runnerData?.jockey_owner || null,
    
    // Trainer Statistics (from runners table)
    trainer_lifetime: runnerData?.trainer_lifetime || null,
    trainer_12_months: runnerData?.trainer_12_months || null,
    trainer_3_months: runnerData?.trainer_3_months || null,
    trainer_course: runnerData?.trainer_course || null,
    trainer_jockey: runnerData?.trainer_jockey || null,
    trainer_jockey_3_months: runnerData?.trainer_jockey_3_months || null,
    trainer_owner: runnerData?.trainer_owner || null,
    
    // Timeform Data (from timeform table)
    timeform_rating: timeformData?.timeform_rating || null,
    pacemap_1: timeformData?.pacemap_1 || null,
    pacemap_2: timeformData?.pacemap_2 || null,
    pace_forecast: timeformData?.pace_forecast || null,
    draw_bias: timeformData?.draw_bias || null,
    specific_pace_hint: timeformData?.specific_pace_hint || null,
    
    // Timeform Calculated Averages
    lto_adj_tfr: timeformAverages.lto_adj_tfr,
    avr_adj_tfr: timeformAverages.avr_adj_tfr,
    lto_tfig: timeformAverages.lto_tfig,
    avr_tfig: timeformAverages.avr_tfig,
    lto_tfr: timeformAverages.lto_tfr,
    avr_tfr: timeformAverages.avr_tfr,
    
    // Pace Figures Data (from pace_figs table)
    pace_fig: paceFigsData?.pace_figure || null,
    pace_fig_lto: paceFigsData?.pace_figure_lto || null,
    pace_style: paceFigsData?.pace_style || null,
    race_average_pace: paceFigsData?.race_average || null,
    
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
      console.warn(`⚠️  Error checking if record exists for ${horseId} in race ${raceId}:`, error.message);
      return false;
    }

    return data !== null;
  } catch (error) {
    console.warn(`⚠️  Exception checking if record exists for ${horseId} in race ${raceId}:`, error.message);
    return false;
  }
};

// Insert or update master result with proper handling
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
      // Check if record exists first, then insert or update
      const { data: existingRecord, error: checkError } = await supabase
        .from('master_results')
        .select('id')
        .eq('race_id', resultRow.race_id)
        .eq('horse_id', resultRow.horse_id)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error(`❌ Error checking existing record:`, checkError.message);
        return false;
      }
      
      if (existingRecord) {
        // Record exists, update it
        result = await supabase
          .from('master_results')
          .update(resultRow)
          .eq('id', existingRecord.id);
      } else {
        // Record doesn't exist, insert it
        result = await supabase
          .from('master_results')
          .insert([resultRow]);
      }
    }

    if (result.error) {
      console.error(`❌ Error ${isUpdate ? 'updating' : 'upserting'} record for ${resultRow.horse}:`, result.error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`❌ Exception ${isUpdate ? 'updating' : 'upserting'} record for ${resultRow.horse}:`, error.message);
    return false;
  }
};

// ENHANCED: Process results with comprehensive logging and fallback strategy
const processResults = async (results, isUpdate = false) => {
  let totalProcessed = 0;
  let totalUpserted = 0;
  let totalErrors = 0;
  let missingDataCounts = {
    race_data: 0,
    runner_data: 0,
    odds_data: 0,
    bsp_data: 0
  };

  console.log(`\n🔄 Processing ${results.results?.length || 0} races...`);

  for (const race of results.results || []) {
    console.log(`\n📍 Processing race: ${race.race_name} at ${race.course} (${race.race_id})`);
    
    for (const runner of race.runners || []) {
      totalProcessed++;
      
      console.log(`\n${totalProcessed}. Processing ${runner.horse} (${runner.horse_id})...`);
      
      try {
        // Check if record already exists and what data it has
        const exists = await recordExists(race.race_id, runner.horse_id);
        let needsUpdate = false;
        let existingRecord = null;
        
        if (exists) {
          // Check if existing record has BSP data
          const { data: existing, error: fetchError } = await supabase
            .from('master_results')
            .select('bsp, horse')
            .eq('race_id', race.race_id)
            .eq('horse_id', runner.horse_id)
            .single();
          
          if (fetchError) {
            console.warn(`⚠️  Error fetching existing record for ${runner.horse}:`, fetchError.message);
          } else {
            existingRecord = existing;
            // Check if BSP data is missing or null
            const hasBspData = existing.bsp !== null;
            
            if (!hasBspData) {
              console.log(`🔄 Record exists for ${runner.horse} but BSP data is missing, updating...`);
              needsUpdate = true;
            } else if (!isUpdate) {
              console.log(`⏭️  Record already exists for ${runner.horse} with complete data, skipping...`);
              continue;
            } else {
              needsUpdate = true; // Force update in update mode
            }
          }
        }
        
        // Fetch all supplementary data
        const [raceData, runnerData, oddsData, bspData, timeformData, paceFigsData] = await Promise.all([
          getRaceData(race.race_id),
          getRunnerData(race.race_id, runner.horse_id),
          getOddsData(race.race_id, runner.horse_id),
          getBspData(runner.horse, race.date, race.region),
          getTimeformData(race.race_id, runner.horse_id),
          getPaceFigsData(race.race_id, runner.horse_id)
        ]);
        
        // Log data availability with matching format from error logs
        const dataAvailable = [];
        const dataMissing = [];
        
        if (raceData) dataAvailable.push('race_data');
        else { dataMissing.push('race_data'); missingDataCounts.race_data++; }
        
        if (runnerData) dataAvailable.push('runner_data');
        else { dataMissing.push('runner_data'); missingDataCounts.runner_data++; }
        
        if (oddsData) dataAvailable.push('odds_data');
        else { dataMissing.push('odds_data'); missingDataCounts.odds_data++; }
        
        if (bspData) dataAvailable.push('bsp_data');
        else { dataMissing.push('bsp_data'); missingDataCounts.bsp_data++; }
        
        if (timeformData) dataAvailable.push('timeform_data');
        else { dataMissing.push('timeform_data'); }
        
        if (paceFigsData) dataAvailable.push('pace_figs_data');
        else { dataMissing.push('pace_figs_data'); }
        
        console.log(`📊 ${runner.horse}:`);
        if (dataAvailable.length > 0) {
          console.log(`   ✅ Found: ${dataAvailable.join(', ')}`);
        }
        if (dataMissing.length > 0) {
          console.log(`   ❌ Missing: ${dataMissing.join(', ')}`);
        }
        
        // Build master results row with available data
        const resultRow = buildMasterResultsRow(race, runner, raceData, runnerData, oddsData, bspData, timeformData, paceFigsData);
        
        // Insert/update the record
        const success = await insertMasterResult(resultRow, exists && (isUpdate || needsUpdate));
        
        if (success) {
          totalUpserted++;
          console.log(`✅ Successfully upserted ${runner.horse}`);
        } else {
          totalErrors++;
          console.error(`❌ FAILED to upsert ${runner.horse}`);
        }
        
      } catch (error) {
        totalErrors++;
        console.error(`❌ Error upserting record for ${runner.horse}:`, error.message);
        console.error(`❌ FAILED to upsert ${runner.horse}`);
      }
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  const completionRate = totalProcessed > 0 ? ((totalUpserted / totalProcessed) * 100).toFixed(1) : '0.0';

  console.log(`\n📊 FINAL PROCESSING SUMMARY:`);
  console.log(`🐎 Total horses found: ${totalProcessed}`);
  console.log(`✅ Successfully upserted: ${totalUpserted}`);
  console.log(`❌ Errors: ${totalErrors}`);
  console.log(`📈 Completion rate: ${completionRate}%`);
  
  console.log(`\n📋 MISSING DATA FIELDS SUMMARY:`);
  console.log(`❌ Missing race_data (not found in database): ${missingDataCounts.race_data} horses`);
  console.log(`❌ Missing runner_data (not found in database): ${missingDataCounts.runner_data} horses`);
  console.log(`❌ Missing odds_data (not found in database): ${missingDataCounts.odds_data} horses`);
  console.log(`❌ Missing bsp_data (not found in database): ${missingDataCounts.bsp_data} horses`);
  console.log(`⚠️  Upsert was ${completionRate}% complete`);
  
  return {
    totalProcessed,
    totalUpserted,
    totalErrors,
    completionRate: parseFloat(completionRate),
    missingDataCounts
  };
};

// Main execution function
const main = async () => {
  console.log('🏁 Starting Master Results Population Script...');
  console.log(`📅 Processing date: ${getYesterdayDate()}`);
  
  try {
    // Fetch racing results
    console.log('\n📡 Fetching racing results from API...');
    const results = await fetchRacingResults(getYesterdayDate());
    
    if (!results.results || results.results.length === 0) {
      console.log('❌ No racing results found for the specified date');
      return;
    }
    
    console.log(`✅ Found ${results.results.length} races to process`);
    
    // Process and insert/update results
    console.log('\n🔄 Processing results and populating master_results table...');
    const summary = await processResults(results, false); // false = insert new records only
    
    console.log(`\n🎉 Script completed successfully!`);
    console.log(`📈 Final stats: ${summary.totalUpserted} upserted, ${summary.totalErrors} errors`);
    console.log(`🏁 Completion rate: ${summary.completionRate}%`);
    
  } catch (error) {
    console.error('💥 Script failed with error:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, processResults, fetchRacingResults }; 