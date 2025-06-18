#!/usr/bin/env node

const https = require('https');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// API credentials
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

// Get yesterday's date in YYYY-MM-DD format
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
  let limit = 50;
  let totalExpected = 0;
  let totalFetched = 0;
  let requestCount = 0;

  console.log(`🔍 Starting paginated fetch for ${date} using limit=${limit} and skip...`);

  try {
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

      if (requestCount === 1) {
        totalExpected = pageData.total || 0;
        console.log(`🎯 TOTAL RACES EXPECTED: ${totalExpected}`);
        
        if (totalExpected === 0) {
          console.log(`ℹ️  No races found for ${date}`);
          break;
        }
      }

      const pageRaces = pageData.results || [];
      allRaces = allRaces.concat(pageRaces);
      totalFetched += pageRaces.length;

      console.log(`📊 Request ${requestCount}: Got ${pageRaces.length} races (Total so far: ${totalFetched}/${totalExpected})`);

      if (pageRaces.length === 0 || totalFetched >= totalExpected) {
        console.log(`✅ Finished pagination. Got all ${totalFetched} races.`);
        break;
      }

      skip += limit;
      
      if (requestCount > 10) {
        console.warn(`⚠️  Safety break: Stopped at request ${requestCount} to prevent infinite loop`);
        break;
      }

      await new Promise(resolve => setTimeout(resolve, 500));
    }

    if (totalFetched !== totalExpected && totalExpected > 0) {
      console.warn(`⚠️  WARNING: Expected ${totalExpected} races but got ${totalFetched}`);
    }

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

    if (error && error.code !== 'PGRST116') {
      return null;
    }

    return data;
  } catch (error) {
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
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
};

// Get odds data from supabase
const getOddsData = async (raceId, horseId) => {
  try {
    const { data, error } = await supabase
      .from('odds_tracking')
      .select('*')
      .eq('race_id', raceId)
      .eq('horse_id', horseId)
      .single();

    if (error && error.code !== 'PGRST116') {
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
};

// Get BSP data from Betfair table
const getBspData = async (horseName, raceDate, region) => {
  try {
    if (region === 'GB' || region === 'IRE') {
      const { data, error } = await supabase
        .from('UK_BSP_Historical')
        .select('*')
        .eq('horse_name', horseName)
        .eq('date', raceDate)
        .single();

      if (data && !error) {
        return {
          event_id: data.event_id,
          selection_id: data.selection_id,
          bsp: data.bsp,
          ppwap: data.ppwap,
          morningwap: data.morningwap,
          ppmax: data.ppmax,
          ppmin: data.ppmin,
          ipmax: data.ipmax,
          ipmin: data.ipmin,
          morningtradedvol: data.morningtradedvol,
          pptradedvol: data.pptradedvol,
          iptradedvol: data.iptradedvol
        };
      }
    }

    const cleanHorseName = horseName.replace(/\s*\([^)]*\)\s*$/, '').trim();
    
    if (cleanHorseName !== horseName && (region === 'GB' || region === 'IRE')) {
      const { data, error } = await supabase
        .from('UK_BSP_Historical')
        .select('*')
        .eq('horse_name', cleanHorseName)
        .eq('date', raceDate)
        .single();

      if (data && !error) {
        return {
          event_id: data.event_id,
          selection_id: data.selection_id,
          bsp: data.bsp,
          ppwap: data.ppwap,
          morningwap: data.morningwap,
          ppmax: data.ppmax,
          ppmin: data.ppmin,
          ipmax: data.ipmax,
          ipmin: data.ipmin,
          morningtradedvol: data.morningtradedvol,
          pptradedvol: data.pptradedvol,
          iptradedvol: data.iptradedvol
        };
      }
    }

    return null;
  } catch (error) {
    return null;
  }
};

// Calculate average opening odds from bookmaker odds
const calculateAverageOpeningOdds = (oddsData) => {
  if (!oddsData) return null;
  
  const bookmakers = [
    'bet365_opening', 'william_hill_opening', 'paddy_power_opening', 
    'sky_bet_opening', 'ladbrokes_opening', 'coral_opening', 'betfair_opening',
    'betfred_opening', 'unibet_opening', 'bet_goodwin_opening', 'bet_victor_opening',
    'ten_bet_opening', 'seven_bet_opening', 'bet442_opening', 'betmgm_opening',
    'betway_opening', 'boyle_sports_opening', 'dragon_bet_opening',
    'gentlemen_jim_opening', 'grosvenor_sports_opening', 'matchbook_opening',
    'midnite_opening', 'pricedup_bet_opening', 'quinn_bet_opening',
    'sporting_index_opening', 'spreadex_opening', 'star_sports_opening',
    'virgin_bet_opening', 'talksport_bet_opening'
  ];
  
  const validOdds = bookmakers
    .map(bookmaker => {
      const odds = oddsData[bookmaker];
      return odds && odds !== 'N/A' ? parseFloat(odds) : null;
    })
    .filter(odds => odds && odds > 0);
  
  if (validOdds.length === 0) return null;
  
  return (validOdds.reduce((sum, odds) => sum + odds, 0) / validOdds.length).toFixed(2);
};

// Build master results row with EXACT schema mapping
const buildMasterResultsRow = (race, runner, raceData, runnerData, oddsData, bspData) => {
  // Calculate derived fields
  const averageOpeningOdds = calculateAverageOpeningOdds(oddsData);
  const winFlag = runner.position === '1';
  const placeFlag = ['1', '2', '3'].includes(runner.position);
  
  // Build row with EXACT column names from user's schema
  return {
    // Core identifiers (REQUIRED)
    race_id: race.race_id,
    horse_id: runner.horse_id,
    horse: runner.horse,
    
    // Race Information
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
    
    // Technical Analysis (exact column names from schema)
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
    
    // Opening Odds (exact column names from schema)
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
    
    // History Odds (exact column names from schema)
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
    
    // Place Odds (exact column names from schema)
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
    
    // Post-Race Results (exact column names from schema)
    position: runner.position,
    sp: runner.sp,
    sp_dec: runner.sp_dec,
    time: runner.time,
    or_rating: runner.or,
    rpr_result: runner.rpr,
    tsr_result: runner.tsr,
    prize_won: runner.prize,
    comment_result: runner.comment,
    
    // Race Result Details (exact column names from schema)
    winning_time_detail: race.winning_time_detail,
    race_comments: race.comments,
    non_runners: race.non_runners,
    tote_win: race.tote_win,
    tote_place: race.tote_pl,
    tote_exacta: race.tote_ex,
    tote_csf: race.tote_csf,
    tote_tricast: race.tote_tricast,
    tote_trifecta: race.tote_trifecta,
    
    // Flags (exact column names from schema)
    win_flag: winFlag,
    place_flag: placeFlag,
    favorite_flag: false,
    
    // Price Movement (exact column names from schema)
    price_movement_direction: null,
    price_movement_magnitude: null,
    market_confidence_score: null,
    early_money_indicator: null,
    late_money_indicator: null,
    
    // Timestamps (exact column names from schema)
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    
    // BSP Data (Betfair - exact column names from schema)
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
    
    // Derived Fields (exact column names from schema)
    opening_price_mentioned: averageOpeningOdds,
    beaten_distance_numeric: null,
    overall_beaten_distance_numeric: null,
    average_opening_odds: averageOpeningOdds
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
      return false;
    }

    return !!data;
  } catch (error) {
    return false;
  }
};

// Insert or update master result with detailed logging
const insertMasterResult = async (resultRow, isUpdate = false) => {
  try {
    let result;
    
    if (isUpdate) {
      result = await supabase
        .from('master_results')
        .update(resultRow)
        .eq('race_id', resultRow.race_id)
        .eq('horse_id', resultRow.horse_id);
    } else {
      result = await supabase
        .from('master_results')
        .insert([resultRow]);
    }

    if (result.error) {
      console.error(`❌ Error ${isUpdate ? 'updating' : 'inserting'} record for ${resultRow.horse}:`, result.error.message);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`❌ Exception ${isUpdate ? 'updating' : 'inserting'} record for ${resultRow.horse}:`, error.message);
    return false;
  }
};

// Enhanced logging for data sources
const logDataSources = (runner, raceData, runnerData, oddsData, bspData) => {
  const sources = {
    race_data: !!raceData,
    runner_data: !!runnerData,
    odds_data: !!oddsData,
    bsp_data: !!bspData
  };
  
  const foundSources = Object.entries(sources)
    .filter(([key, found]) => found)
    .map(([key]) => key);
  
  const missingSources = Object.entries(sources)
    .filter(([key, found]) => !found)
    .map(([key]) => key);
  
  console.log(`📊 ${runner.horse}:`);
  console.log(`   ✅ Found: ${foundSources.join(', ') || 'none'}`);
  if (missingSources.length > 0) {
    console.log(`   ❌ Missing: ${missingSources.join(', ')}`);
  }
  
  return { foundSources, missingSources };
};

// Process results with enhanced logging
const processResults = async (results, isUpdate = false) => {
  let totalProcessed = 0;
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  let totalHorsesFound = 0;
  
  // Track missing fields
  const missingFieldsTracker = {
    race_data: 0,
    runner_data: 0,
    odds_data: 0,
    bsp_data: 0
  };

  console.log(`\n🔄 Processing ${results.results?.length || 0} races...`);

  // Count total horses
  for (const race of results.results || []) {
    totalHorsesFound += race.runners?.length || 0;
  }
  
  console.log(`🐎 Total horses found: ${totalHorsesFound}`);

  for (const race of results.results || []) {
    console.log(`\n📍 Processing race: ${race.race_name} at ${race.course} (${race.race_id})`);
    
    for (const runner of race.runners || []) {
      totalProcessed++;
      
      console.log(`\n${totalProcessed}. Processing ${runner.horse} (${runner.horse_id})...`);
      
      try {
        // Check if record already exists
        const exists = await recordExists(race.race_id, runner.horse_id);
        
        if (exists && !isUpdate) {
          console.log(`⏭️  Record already exists for ${runner.horse}, skipping...`);
          continue;
        }
        
        // Fetch all data sources
        const [raceData, runnerData, oddsData, bspData] = await Promise.all([
          getRaceData(race.race_id),
          getRunnerData(race.race_id, runner.horse_id),
          getOddsData(race.race_id, runner.horse_id),
          getBspData(runner.horse, race.date, race.region)
        ]);
        
        // Log data sources with enhanced detail
        const { foundSources, missingSources } = logDataSources(runner, raceData, runnerData, oddsData, bspData);
        
        // Track missing fields (only count as missing if completely not found, not null)
        if (!raceData) missingFieldsTracker.race_data++;
        if (!runnerData) missingFieldsTracker.runner_data++;
        if (!oddsData) missingFieldsTracker.odds_data++;
        if (!bspData) missingFieldsTracker.bsp_data++;
        
        // Build the complete row
        const resultRow = buildMasterResultsRow(race, runner, raceData, runnerData, oddsData, bspData);
        
        // Insert or update the record
        const shouldUpdate = exists && isUpdate;
        const success = await insertMasterResult(resultRow, shouldUpdate);
        
        if (success) {
          if (shouldUpdate) {
            totalUpdated++;
            console.log(`✅ Updated ${runner.horse} with ${foundSources.length}/4 data sources`);
          } else {
            totalInserted++;
            console.log(`✅ Inserted ${runner.horse} with ${foundSources.length}/4 data sources`);
          }
        } else {
          totalErrors++;
          console.error(`❌ FAILED to ${shouldUpdate ? 'update' : 'insert'} ${runner.horse}`);
        }
        
      } catch (error) {
        totalErrors++;
        console.error(`❌ Error processing ${runner.horse}:`, error.message);
      }
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  // Calculate completion percentage
  const successfulOperations = totalInserted + totalUpdated;
  const completionPercentage = totalHorsesFound > 0 ? ((successfulOperations / totalHorsesFound) * 100).toFixed(1) : 0;

  console.log(`\n📊 FINAL PROCESSING SUMMARY:`);
  console.log(`🐎 Total horses found: ${totalHorsesFound}`);
  console.log(`✅ Successfully inserted: ${totalInserted}`);
  console.log(`🔄 Successfully updated: ${totalUpdated}`);
  console.log(`❌ Errors: ${totalErrors}`);
  console.log(`📈 Completion rate: ${completionPercentage}%`);
  
  console.log(`\n📋 MISSING DATA FIELDS SUMMARY:`);
  console.log(`❌ Missing race_data (not found in database): ${missingFieldsTracker.race_data} horses`);
  console.log(`❌ Missing runner_data (not found in database): ${missingFieldsTracker.runner_data} horses`);
  console.log(`❌ Missing odds_data (not found in database): ${missingFieldsTracker.odds_data} horses`);
  console.log(`❌ Missing bsp_data (not found in database): ${missingFieldsTracker.bsp_data} horses`);
  
  if (completionPercentage == 100) {
    console.log(`🎉 INSERTION WAS 100% COMPLETE!`);
  } else {
    console.log(`⚠️  Insertion was ${completionPercentage}% complete`);
  }
  
  return {
    totalHorsesFound,
    totalProcessed,
    totalInserted,
    totalUpdated,
    totalErrors,
    completionPercentage,
    missingFieldsTracker
  };
};

// Main execution function
const main = async () => {
  try {
    console.log('🚀 Starting Master Results Population Script - FIXED VERSION');
    
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
    console.log(`🏁 Completion rate: ${summary.completionPercentage}%`);
    
  } catch (error) {
    console.error('💥 Script failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
}

module.exports = { main, processResults, fetchRacingResults }; 