require('dotenv').config();
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Racing API credentials
const USERNAME = 'KQ9W7rQeAHWMUgxH93ie3yEc';
const PASSWORD = 'T5BoPivL3Q2h6RhCdLv4EwZu';

console.log('🔄 CATCHUP MASTER RESULTS: Processing historical dates');

// CATCHUP DATES - Edit these dates for historical data processing
const CATCHUP_DATES = [
  '2025-06-17'  // Processing June 17th when the BSP script was broken
];

// Enhanced API request with proper pagination and error handling
const fetchRacingResults = async (date, maxRetries = 3) => {
  console.log(`🚨 Fetching results for date: ${date}`);
  
  let allRaces = [];
  let skip = 0;
  const limit = 50; // Optimal batch size
  let totalExpected = 0;
  let retryCount = 0;

  try {
    while (true) {
      const apiUrl = `https://api.theracingapi.com/v1/results?start_date=${date}&end_date=${date}&limit=${limit}&skip=${skip}`;
      console.log(`📄 Fetching batch: limit=${limit}, skip=${skip}`);

      let pageData;
      let success = false;
      
      // Retry logic for individual requests
      while (retryCount < maxRetries && !success) {
        try {
          pageData = await new Promise((resolve, reject) => {
            const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
            const options = {
              headers: {
                'Authorization': `Basic ${auth}`,
                'User-Agent': 'Node.js/Catchup-Master-Results'
              }
            };

            const req = https.get(apiUrl, options, (res) => {
              let data = '';
              res.on('data', (chunk) => { data += chunk; });
              res.on('end', () => {
                try {
                  resolve(JSON.parse(data));
                } catch (parseError) {
                  reject(new Error(`JSON Parse Error: ${parseError.message}`));
                }
              });
            });

            req.on('error', reject);
            req.setTimeout(45000, () => {
              req.destroy();
              reject(new Error('Request timeout after 45s'));
            });
          });
          success = true;
        } catch (error) {
          retryCount++;
          if (retryCount < maxRetries) {
            console.log(`⚠️  Request failed (attempt ${retryCount}/${maxRetries}): ${error.message}, retrying...`);
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount)); // Exponential backoff
          } else {
            throw error;
          }
        }
      }

      if (totalExpected === 0) {
        totalExpected = pageData.total || 0;
        console.log(`🎯 Total races available for ${date}: ${totalExpected}`);
      }

      if (pageData.results && pageData.results.length > 0) {
        allRaces = allRaces.concat(pageData.results);
        const batchRunners = pageData.results.reduce((sum, race) => sum + (race.runners?.length || 0), 0);
        console.log(`📊 Fetched ${pageData.results.length} races, ${batchRunners} runners (Total: ${allRaces.length}/${totalExpected} races)`);
      }

      // Exit conditions
      if (!pageData.results || pageData.results.length === 0 || allRaces.length >= totalExpected) {
        console.log(`✅ Pagination complete for ${date}: ${allRaces.length}/${totalExpected} races`);
        break;
      }

      skip += limit;
      // Rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const totalRunners = allRaces.reduce((sum, race) => sum + (race.runners?.length || 0), 0);
    return { results: allRaces, total: totalExpected, fetched: allRaces.length, totalRunners };

  } catch (error) {
    console.error(`❌ Error fetching results for ${date}:`, error.message);
    throw error;
  }
};

// Enhanced data retrieval functions with better error handling
const getRunnerData = async (raceId, horseId) => {
  try {
    const { data, error } = await supabase
      .from('runners')
      .select('*')
      .eq('race_id', raceId)
      .eq('horse_id', horseId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.log(`⚠️  Runner data error for ${horseId}: ${error.message}`);
      return null;
    }
    return data;
  } catch (error) {
    console.log(`⚠️  Runner data exception for ${horseId}: ${error.message}`);
    return null;
  }
};

const getRaceData = async (raceId) => {
  try {
    const { data, error } = await supabase
      .from('races')
      .select('*')
      .eq('race_id', raceId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.log(`⚠️  Race data error for ${raceId}: ${error.message}`);
      return null;
    }
    return data;
  } catch (error) {
    console.log(`⚠️  Race data exception for ${raceId}: ${error.message}`);
    return null;
  }
};

const getOddsData = async (raceId, horseId) => {
  try {
    const { data, error } = await supabase
      .from('odds')
      .select('*')
      .eq('race_id', raceId)
      .eq('horse_id', horseId)
      .single();
    
    if (error && error.code !== 'PGRST116') {
      console.log(`⚠️  Odds data error for ${horseId}: ${error.message}`);
      return null;
    }
    return data;
  } catch (error) {
    console.log(`⚠️  Odds data exception for ${horseId}: ${error.message}`);
    return null;
  }
};

const getBspData = async (horseName, raceDate, region) => {
  try {
    let tableName = (region === 'IRE') ? 'IRE_BSP_Historical' : 'UK_BSP_Historical';
    
    // Convert date format from YYYY-MM-DD to DD-MM-YYYY
    const dateParts = raceDate.split('-');
    const bspDateFormat = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    
    // Try exact match first
    let { data, error } = await supabase
      .from(tableName)
      .select('*')
      .eq('selection_name', horseName)
      .ilike('event_dt', `${bspDateFormat}%`)
      .single();
    
    // Try partial match if no exact match
    if (!data && error?.code === 'PGRST116') {
      const cleanHorseName = horseName.replace(/\s*\([A-Z]{2,3}\)$/, '').trim();
      ({ data, error } = await supabase
        .from(tableName)
        .select('*')
        .ilike('selection_name', `%${cleanHorseName}%`)
        .ilike('event_dt', `${bspDateFormat}%`)
        .single());
    }

    if (error && error.code !== 'PGRST116') {
      console.log(`⚠️  BSP data error for ${horseName}: ${error.message}`);
      return null;
    }
    return data;
  } catch (error) {
    console.log(`⚠️  BSP data exception for ${horseName}: ${error.message}`);
    return null;
  }
};

// Enhanced derived fields calculation
const calculateDerivedFields = (runner, oddsData) => {
  const position = parseInt(runner.position) || null;
  
  // Calculate average opening odds if odds data available
  let averageOpeningOdds = null;
  if (oddsData) {
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
      .map(field => parseFloat(oddsData[field]))
      .filter(odd => !isNaN(odd) && odd > 0);
    
    if (validOdds.length > 0) {
      averageOpeningOdds = (validOdds.reduce((sum, odd) => sum + odd, 0) / validOdds.length).toFixed(2);
    }
  }
  
  return {
    win_flag: position === 1,
    place_flag: position && position <= 3,
    favorite_flag: false, // Would need market-wide calculation
    beaten_distance_numeric: parseFloat(runner.btn) || null,
    overall_beaten_distance_numeric: parseFloat(runner.ovr_btn) || null,
    
    // New calculated fields - placeholders for now
    price_movement_direction: null,
    price_movement_magnitude: null,
    market_confidence_score: null,
    early_money_indicator: null,
    late_money_indicator: null,
    opening_price_mentioned: averageOpeningOdds
  };
};

// Complete master results row builder matching new schema
const buildMasterResultsRow = (race, runner, raceData, runnerData, oddsData, bspData) => {
  const derivedFields = calculateDerivedFields(runner, oddsData);
  
  // Build comprehensive row with all required columns
  const masterRow = {
    // Core identifiers
    race_id: race.race_id,
    horse_id: runner.horse_id,
    horse: runner.horse,
    
    // Race information
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
    
    // Runner information
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
    rpr: runner.rpr || null,
    comment: runnerData?.comment || null,
    
    // Analytics from runners table
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
    
    // Result information
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
    
    // Race results
    winning_time_detail: race.winning_time_detail,
    race_comments: race.comments,
    non_runners: race.non_runners,
    tote_win: race.tote_win,
    tote_place: race.tote_pl,
    tote_exacta: race.tote_ex,
    tote_csf: race.tote_csf,
    tote_tricast: race.tote_tricast,
    tote_trifecta: race.tote_trifecta,
    
    // BSP data
    betfair_event_id: bspData?.event_id || null,
    betfair_selection_id: bspData?.selection_id || null,
    bsp: bspData?.bsp || null,
    ppwap: bspData?.ppwap || null,
    morningwap: bspData?.morningwap || null,
    ppmax: bspData?.ppmax || null,
    ppmin: bspData?.ppmin || null,
    ipmax: bspData?.ipmax || null,
    ipmin: bspData?.ipmin || null,
    total_traded_volume: bspData ? (bspData.morningtradedvol || 0) + (bspData.pptradedvol || 0) + (bspData.iptradedvol || 0) : null,
    
    // Derived fields
    ...derivedFields
  };
  
  // Add all odds columns if available
  if (oddsData) {
    // Opening odds (only columns that exist in database)
    const openingColumns = [
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
    
    // History columns (only columns that exist in database)
    const historyColumns = [
      'bet365_history', 'william_hill_history', 'paddy_power_history', 'sky_bet_history',
      'ladbrokes_history', 'coral_history', 'betfair_history', 'betfred_history',
      'unibet_history', 'bet_goodwin_history', 'bet_victor_history', 'ten_bet_history',
      'seven_bet_history', 'bet442_history', 'betmgm_history', 'betway_history',
      'boyle_sports_history', 'dragon_bet_history', 'gentlemen_jim_history',
      'grosvenor_sports_history', 'matchbook_history', 'midnite_history',
      'pricedup_bet_history', 'quinn_bet_history', 'sporting_index_history',
      'spreadex_history', 'star_sports_history', 'virgin_bet_history',
      'talksport_bet_history', 'betfair_exchange_history'
    ];
    
    // Place odds (only columns that exist in database)
    const placeColumns = [
      'bet365_places', 'william_hill_places', 'paddy_power_places', 'sky_bet_places',
      'ladbrokes_places', 'coral_places', 'betfair_places', 'betfred_places',
      'unibet_places', 'bet_goodwin_places', 'bet_victor_places', 'ten_bet_places',
      'betmgm_places', 'betway_places', 'boyle_sports_places', 'dragon_bet_places',
      'gentlemen_jim_places', 'grosvenor_sports_places', 'midnite_places',
      'pricedup_bet_places', 'quinn_bet_places', 'sporting_index_places'
    ];
    
    [...openingColumns, ...historyColumns, ...placeColumns].forEach(col => {
      masterRow[col] = oddsData[col] || (col.includes('_history') ? '' : null);
    });
  }
  
  return masterRow;
};

// Check if record exists
const recordExists = async (raceId, horseId) => {
  try {
    const { data, error } = await supabase
      .from('master_results')
      .select('id')
      .eq('race_id', raceId)
      .eq('horse_id', horseId)
      .single();
    return !!data && !error;
  } catch (error) {
    return false;
  }
};

// Enhanced insert with better error handling
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
      console.error(`❌ Error ${isUpdate ? 'updating' : 'inserting'} ${resultRow.horse}:`, result.error.message);
      if (result.error.details) {
        console.error(`   Details: ${result.error.details}`);
      }
      return false;
    }
    return true;
  } catch (error) {
    console.error(`❌ Exception ${isUpdate ? 'updating' : 'inserting'} ${resultRow.horse}:`, error.message);
    return false;
  }
};

// CRITICAL FIX: ALWAYS INSERT philosophy - never skip a horse (CATCHUP VERSION)
const processResults = async (results, isUpdate, targetDate) => {
  let totalProcessed = 0;
  let totalInserted = 0;
  let totalUpdated = 0;
  let totalErrors = 0;
  let basicInsertions = 0; // Count horses inserted with basic data only

  console.log(`\n🔄 Processing ${results.results?.length || 0} races for ${targetDate}...`);

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
        
        // ALWAYS INSERT PHILOSOPHY: Try comprehensive data first, fall back to basic if needed
        let resultRow = null;
        let insertionType = 'complete';
        
        try {
          // Attempt full data retrieval and processing
          const raceData = await getRaceData(race.race_id);
          const [runnerData, oddsData, bspData] = await Promise.all([
            getRunnerData(race.race_id, runner.horse_id),
            getOddsData(race.race_id, runner.horse_id),
            getBspData(runner.horse, race.date, race.region)
          ]);
          
          // Try to build complete row
          resultRow = buildMasterResultsRow(race, runner, raceData, runnerData, oddsData, bspData);
          
          const dataStatus = [
            runnerData ? 'Runner✅' : 'Runner❌',
            oddsData ? 'Odds✅' : 'Odds❌', 
            bspData ? 'BSP✅' : 'BSP❌'
          ].join(' ');
          console.log(`📊 ${runner.horse}: ${dataStatus}`);
          
        } catch (complexError) {
          console.warn(`⚠️  Complex data processing failed for ${runner.horse}: ${complexError.message}`);
          console.log(`🔄 Falling back to BASIC insertion for ${runner.horse}...`);
          
          // FALLBACK: Create basic row with just API data
          resultRow = createBasicMasterResultRow(race, runner);
          insertionType = 'basic';
          basicInsertions++;
        }
        
        // CRITICAL: If we still don't have a row, create minimal one
        if (!resultRow) {
          console.warn(`🚨 Creating MINIMAL row for ${runner.horse} to ensure insertion...`);
          resultRow = createMinimalMasterResultRow(race, runner);
          insertionType = 'minimal';
          basicInsertions++;
        }
        
        // Insert or update the record
        const shouldUpdate = exists && (isUpdate || needsUpdate);
        const success = await insertMasterResult(resultRow, shouldUpdate);
        
        if (success) {
          if (shouldUpdate) {
            totalUpdated++;
            console.log(`✅ Updated ${runner.horse} (${insertionType} data)`);
          } else {
            totalInserted++;
            console.log(`✅ Inserted ${runner.horse} (${insertionType} data)`);
          }
        } else {
          totalErrors++;
          console.error(`❌ FAILED to insert ${runner.horse} - this should not happen!`);
        }
        
      } catch (error) {
        totalErrors++;
        console.error(`❌ Error processing ${runner.horse}:`, error.message);
        
        // LAST RESORT: Try absolute minimal insertion
        try {
          console.log(`🆘 LAST RESORT: Attempting minimal insertion for ${runner.horse}...`);
          const minimalRow = createMinimalMasterResultRow(race, runner);
          const lastChance = await insertMasterResult(minimalRow, false);
          if (lastChance) {
            totalInserted++;
            basicInsertions++;
            console.log(`🆘 Successfully inserted ${runner.horse} with minimal data`);
          }
        } catch (lastError) {
          console.error(`💥 Complete failure for ${runner.horse}: ${lastError.message}`);
        }
      }
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }

  console.log(`\n📊 FINAL PROCESSING SUMMARY for ${targetDate}:`);
  console.log(`   Total processed: ${totalProcessed}`);
  console.log(`   Successfully inserted: ${totalInserted}`);
  console.log(`   Successfully updated: ${totalUpdated}`);
  console.log(`   Basic/Minimal insertions: ${basicInsertions}`);
  console.log(`   Errors: ${totalErrors}`);
  
  return {
    totalProcessed,
    totalInserted,
    totalUpdated,
    totalErrors,
    basicInsertions
  };
};

// Create basic master results row with just API data and safe defaults
const createBasicMasterResultRow = (race, runner) => {
  return {
    // Core identifiers - ALWAYS available from API
    race_id: race.race_id,
    horse_id: runner.horse_id,
    horse: runner.horse,
    
    // Race information - always from API
    course: race.course,
    course_id: race.course_id,
    race_date: race.date,
    off_time: race.off,
    off_dt: race.off_dt,
    race_name: race.race_name,
    dist: race.dist,
    pattern: race.pattern,
    race_class: race.class,
    type: race.type,
    age_band: race.age_band,
    rating_band: race.rating_band,
    sex_rest: race.sex_rest,
    going: race.going,
    surface: race.surface,
    jumps: race.jumps,
    region: race.region,
    
    // Runner information - always from API
    number: runner.number,
    draw: runner.draw,
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
    
    // Results - always from API
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
    
    // Race results - from API
    winning_time_detail: race.winning_time_detail,
    race_comments: race.comments,
    non_runners: race.non_runners,
    tote_win: race.tote_win,
    tote_place: race.tote_pl,
    tote_exacta: race.tote_ex,
    tote_csf: race.tote_csf,
    tote_tricast: race.tote_tricast,
    tote_trifecta: race.tote_trifecta,
    
    // All other fields as null - will be updated by subsequent runs
    distance_f: null,
    distance_round: null,
    going_detailed: null,
    prize: null,
    field_size: null,
    big_race: false,
    is_abandoned: false,
    runner_id: null,
    dob: null,
    comment: null,
    
    // Set all technical analysis fields to null
    "5_moving_average": null,
    "20_moving_average": null,
    "60_moving_average": null,
    // ... all other complex fields as null
  };
};

// Create absolute minimal row for emergency insertions
const createMinimalMasterResultRow = (race, runner) => {
  return {
    race_id: race.race_id,
    horse_id: runner.horse_id,
    horse: runner.horse,
    course: race.course,
    race_date: race.date,
    position: runner.position,
    sp: runner.sp,
    sp_dec: runner.sp_dec
  };
};

// Main function for catchup processing
const main = async () => {
  try {
    console.log('🚀 Starting CATCHUP Master Results Population');
    console.log(`📅 CATCHUP DATES: ${CATCHUP_DATES.join(', ')}`);
    
    // Always run in UPDATE mode to ensure complete data
    const isUpdate = true;
    console.log(`🔄 Mode: UPDATE (updating existing records with latest data)`);
    
    let totalSummary = {
      totalProcessed: 0,
      totalInserted: 0,
      totalUpdated: 0,
      totalErrors: 0,
      totalSkipped: 0
    };
    
    for (const targetDate of CATCHUP_DATES) {
      console.log(`\n🎯 PROCESSING: ${targetDate}`);
      
      try {
        const results = await fetchRacingResults(targetDate);
        
        if (!results.results || results.results.length === 0) {
          console.log(`ℹ️  No results found for ${targetDate}`);
          continue;
        }
        
        console.log(`📋 Found ${results.results.length} races with ${results.totalRunners} total runners for ${targetDate}`);
        
        const summary = await processResults(results, isUpdate, targetDate);
        
        // Add to total summary
        totalSummary.totalProcessed += summary.totalProcessed;
        totalSummary.totalInserted += summary.totalInserted;
        totalSummary.totalUpdated += summary.totalUpdated;
        totalSummary.totalErrors += summary.totalErrors;
        totalSummary.totalSkipped += summary.totalSkipped;
        
        console.log(`✅ Completed ${targetDate}`);
        
        // Small delay between dates
        await new Promise(resolve => setTimeout(resolve, 1000));
        
      } catch (error) {
        console.error(`❌ Error processing ${targetDate}:`, error.message);
        totalSummary.totalErrors++;
      }
    }
    
    console.log(`\n🎉 CATCHUP MASTER RESULTS COMPLETED!`);
    console.log(`📊 TOTAL SUMMARY:`);
    console.log(`   Dates Processed: ${CATCHUP_DATES.length}`);
    console.log(`   Total Runners: ${totalSummary.totalProcessed}`);
    console.log(`   Successfully Processed: ${totalSummary.totalInserted + totalSummary.totalUpdated}`);
    console.log(`   New Records: ${totalSummary.totalInserted}`);
    console.log(`   Updated Records: ${totalSummary.totalUpdated}`);
    console.log(`   Skipped: ${totalSummary.totalSkipped}`);
    console.log(`   Errors: ${totalSummary.totalErrors}`);
    
    if (totalSummary.totalErrors === 0) {
      console.log(`✅ 100% SUCCESS - All runners processed!`);
    } else if (totalSummary.totalErrors > 0) {
      console.log(`⚠️  PARTIAL SUCCESS - ${totalSummary.totalErrors} errors occurred`);
    }
    
  } catch (error) {
    console.error('❌ CATCHUP Script failed:', error.message);
    process.exit(1);
  }
};

main(); 