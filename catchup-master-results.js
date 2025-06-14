require('dotenv').config();
const https = require('https');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Racing API credentials
const USERNAME = 'KQ9W7rQeAHWMUgxH93ie3yEc';
const PASSWORD = 'T5BoPivL3Q2h6RhCdLv4EwZu';

console.log('🔄 CATCHUP MODE: Processing historical dates to fill missing data');

// CATCHUP DATES - Starting with 2025-06-10
const CATCHUP_DATES = [
  '2025-06-10',  // Now processing this date
  '2025-06-11', 
  '2025-06-12'
];

// Make API request with pagination (same logic as fixed main script)
const fetchRacingResults = async (date) => {
  console.log(`🚨 CATCHUP: Fetching results for date: ${date}`);
  
  let allRaces = [];
  let skip = 0;
  const limit = 50;
  let totalExpected = 0;

  try {
    while (true) {
      const apiUrl = `https://api.theracingapi.com/v1/results?start_date=${date}&end_date=${date}&limit=${limit}&skip=${skip}`;
      console.log(`📄 CATCHUP: Fetching batch: limit=${limit}, skip=${skip}`);

      const pageData = await new Promise((resolve, reject) => {
        const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');
        const options = {
          headers: {
            'Authorization': `Basic ${auth}`,
            'User-Agent': 'Node.js/Catchup-Results-Fetcher'
          }
        };

        const req = https.get(apiUrl, options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (parseError) {
              reject(parseError);
            }
          });
        });

        req.on('error', reject);
        req.setTimeout(30000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
      });

      if (totalExpected === 0) {
        totalExpected = pageData.total || 0;
        console.log(`🎯 CATCHUP: Total races available for ${date}: ${totalExpected}`);
      }

      if (pageData.results && pageData.results.length > 0) {
        allRaces = allRaces.concat(pageData.results);
        console.log(`📊 CATCHUP: Fetched ${pageData.results.length} races (Total: ${allRaces.length}/${totalExpected})`);
      }

      if (!pageData.results || pageData.results.length === 0 || allRaces.length >= totalExpected) {
        console.log(`✅ CATCHUP: Pagination complete for ${date}: ${allRaces.length}/${totalExpected} races`);
        break;
      }

      skip += limit;
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    return { results: allRaces, total: totalExpected, fetched: allRaces.length };

  } catch (error) {
    console.error(`❌ CATCHUP: Error fetching results for ${date}:`, error.message);
    throw error;
  }
};

// Get supplementary data functions
const getRunnerData = async (raceId, horseId) => {
  try {
    const { data, error } = await supabase.from('runners').select('*').eq('race_id', raceId).eq('horse_id', horseId).single();
    return (error && error.code !== 'PGRST116') ? null : data;
  } catch (error) { return null; }
};

const getRaceData = async (raceId) => {
  try {
    const { data, error } = await supabase.from('races').select('*').eq('race_id', raceId).single();
    return (error && error.code !== 'PGRST116') ? null : data;
  } catch (error) { return null; }
};

const getOddsData = async (raceId, horseId) => {
  try {
    const { data, error } = await supabase.from('odds').select('*').eq('race_id', raceId).eq('horse_id', horseId).single();
    return (error && error.code !== 'PGRST116') ? null : data;
  } catch (error) { return null; }
};

const getBspData = async (horseName, raceDate, region) => {
  try {
    let tableName = (region === 'IRE') ? 'IRE_BSP_Historical' : 'UK_BSP_Historical';
    
    // Convert date format from YYYY-MM-DD to DD-MM-YYYY
    const dateParts = raceDate.split('-');
    const bspDateFormat = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
    
    console.log(`🔍 CATCHUP BSP lookup: ${tableName} for "${horseName}" on ${bspDateFormat}`);
    
    // Try exact match first
    let { data, error } = await supabase.from(tableName).select('*').eq('selection_name', horseName).ilike('event_dt', `${bspDateFormat}%`).single();
    
    // Try partial match if no exact match
    if (!data && error?.code === 'PGRST116') {
      const cleanHorseName = horseName.replace(/\s*\([A-Z]{2,3}\)$/, '').trim();
      ({ data, error } = await supabase.from(tableName).select('*').ilike('selection_name', `%${cleanHorseName}%`).ilike('event_dt', `${bspDateFormat}%`).single());
    }

    return (error && error.code !== 'PGRST116') ? null : data;
  } catch (error) { return null; }
};

// Simplified derived fields
const calculateDerivedFields = (runner) => {
  const position = parseInt(runner.position) || null;
  return {
    win_flag: position === 1,
    place_flag: position && position <= 3,
    beaten_distance_numeric: parseFloat(runner.btn) || null,
    overall_beaten_distance_numeric: parseFloat(runner.ovr_btn) || null,
    favorite_flag: false,
    market_rank: null,
    favorite_indicator: 'Unknown',
    average_opening_odds: null,
    price_movement_direction: null,
    price_movement_magnitude: null,
    market_confidence_score: null,
    early_money_indicator: null,
    late_money_indicator: null,
    joint_favorite_indicator: null,
    opening_price_mentioned: null,
    price_touched_mentioned: null
  };
};

// Build master results row (only existing DB columns)
const buildMasterResultsRow = (race, runner, raceData, runnerData, oddsData, bspData) => {
  const derivedFields = calculateDerivedFields(runner);
  
  return {
    race_id: race.race_id, course: race.course, course_id: race.course_id, race_date: race.date, off_time: race.off, off_dt: race.off_dt, race_name: race.race_name, dist: race.dist, distance_f: raceData?.distance_f || null, distance_round: raceData?.distance_round || null, dist_y: race.dist_y, dist_m: race.dist_m, dist_f: race.dist_f, pattern: race.pattern, race_class: race.class, type: race.type, age_band: race.age_band, rating_band: race.rating_band, sex_rest: race.sex_rest, going: race.going, going_detailed: raceData?.going_detailed || null, surface: race.surface, jumps: race.jumps, prize: raceData?.prize || null, field_size: raceData?.field_size || null, region: race.region, big_race: raceData?.big_race || false, is_abandoned: raceData?.is_abandoned || false,
    runner_id: runnerData?.id || null, horse_id: runner.horse_id, horse: runner.horse, number: runner.number, draw: runner.draw, dob: runnerData?.dob || null, age: runner.age, sex: runner.sex, sex_code: runnerData?.sex_code || null, colour: runnerData?.colour || null, sire: runner.sire, sire_id: runner.sire_id, dam: runner.dam, dam_id: runner.dam_id, damsire: runner.damsire, damsire_id: runner.damsire_id, trainer: runner.trainer, trainer_id: runner.trainer_id, jockey: runner.jockey, jockey_id: runner.jockey_id, jockey_claim_lbs: runner.jockey_claim_lbs, owner: runner.owner, owner_id: runner.owner_id, weight_lbs: runner.weight_lbs, headgear: runner.headgear, comment: runnerData?.comment || null,
    "5_moving_average": runnerData?.["5_moving_average"] || null, "20_moving_average": runnerData?.["20_moving_average"] || null, "60_moving_average": runnerData?.["60_moving_average"] || null, "5_bollinger_bands": runnerData?.["5_bollinger_bands"] || null, "20_bollinger_bands": runnerData?.["20_bollinger_bands"] || null, "60_bollinger_bands": runnerData?.["60_bollinger_bands"] || null, support_levels: runnerData?.support_levels || null, resistance_levels: runnerData?.resistance_levels || null, price_change: runnerData?.price_change || null, average_odds: runnerData?.average_odds || null, market_pressure_shortening: runnerData?.market_pressure_shortening || null, market_pressure_drifting: runnerData?.market_pressure_drifting || null, momentum_steaming: runnerData?.momentum_steaming || null, momentum_drifting: runnerData?.momentum_drifting || null, sharp_average_odds: runnerData?.sharp_average_odds || null,
    bet365_opening: oddsData?.bet365_opening || null, william_hill_opening: oddsData?.william_hill_opening || null, paddy_power_opening: oddsData?.paddy_power_opening || null, sky_bet_opening: oddsData?.sky_bet_opening || null, ladbrokes_opening: oddsData?.ladbrokes_opening || null, coral_opening: oddsData?.coral_opening || null, betfair_opening: oddsData?.betfair_opening || null, betfred_opening: oddsData?.betfred_opening || null, unibet_opening: oddsData?.unibet_opening || null, bet_uk_opening: oddsData?.bet_uk_opening || null, bet_goodwin_opening: oddsData?.bet_goodwin_opening || null, bet_victor_opening: oddsData?.bet_victor_opening || null, ten_bet_opening: oddsData?.ten_bet_opening || null, seven_bet_opening: oddsData?.seven_bet_opening || null, bet442_opening: oddsData?.bet442_opening || null, betmgm_opening: oddsData?.betmgm_opening || null, betway_opening: oddsData?.betway_opening || null, boyle_sports_opening: oddsData?.boyle_sports_opening || null, copybet_opening: oddsData?.copybet_opening || null, dragon_bet_opening: oddsData?.dragon_bet_opening || null, gentlemen_jim_opening: oddsData?.gentlemen_jim_opening || null, grosvenor_sports_opening: oddsData?.grosvenor_sports_opening || null, hollywood_bets_opening: oddsData?.hollywood_bets_opening || null, matchbook_opening: oddsData?.matchbook_opening || null, midnite_opening: oddsData?.midnite_opening || null, pricedup_bet_opening: oddsData?.pricedup_bet_opening || null, quinn_bet_opening: oddsData?.quinn_bet_opening || null, sporting_index_opening: oddsData?.sporting_index_opening || null, spreadex_opening: oddsData?.spreadex_opening || null, star_sports_opening: oddsData?.star_sports_opening || null, virgin_bet_opening: oddsData?.virgin_bet_opening || null, talksport_bet_opening: oddsData?.talksport_bet_opening || null, betfair_exchange_opening: oddsData?.betfair_exchange_opening || null,
    bet365_history: oddsData?.bet365_history || '', william_hill_history: oddsData?.william_hill_history || '', paddy_power_history: oddsData?.paddy_power_history || '', sky_bet_history: oddsData?.sky_bet_history || '', ladbrokes_history: oddsData?.ladbrokes_history || '', coral_history: oddsData?.coral_history || '', betfair_history: oddsData?.betfair_history || '', betfred_history: oddsData?.betfred_history || '', unibet_history: oddsData?.unibet_history || '', bet_uk_history: oddsData?.bet_uk_history || '', bet_goodwin_history: oddsData?.bet_goodwin_history || '', bet_victor_history: oddsData?.bet_victor_history || '', ten_bet_history: oddsData?.ten_bet_history || '', seven_bet_history: oddsData?.seven_bet_history || '', bet442_history: oddsData?.bet442_history || '', betmgm_history: oddsData?.betmgm_history || '', betway_history: oddsData?.betway_history || '', boyle_sports_history: oddsData?.boyle_sports_history || '', copybet_history: oddsData?.copybet_history || '', dragon_bet_history: oddsData?.dragon_bet_history || '', gentlemen_jim_history: oddsData?.gentlemen_jim_history || '', grosvenor_sports_history: oddsData?.grosvenor_sports_history || '', hollywood_bets_history: oddsData?.hollywood_bets_history || '', matchbook_history: oddsData?.matchbook_history || '', midnite_history: oddsData?.midnite_history || '', pricedup_bet_history: oddsData?.pricedup_bet_history || '', quinn_bet_history: oddsData?.quinn_bet_history || '', sporting_index_history: oddsData?.sporting_index_history || '', spreadex_history: oddsData?.spreadex_history || '', star_sports_history: oddsData?.star_sports_history || '', virgin_bet_history: oddsData?.virgin_bet_history || '', talksport_bet_history: oddsData?.talksport_bet_history || '', betfair_exchange_history: oddsData?.betfair_exchange_history || '',
    bet365_places: oddsData?.bet365_places || null, william_hill_places: oddsData?.william_hill_places || null, paddy_power_places: oddsData?.paddy_power_places || null, sky_bet_places: oddsData?.sky_bet_places || null, ladbrokes_places: oddsData?.ladbrokes_places || null, coral_places: oddsData?.coral_places || null, betfair_places: oddsData?.betfair_places || null, betfred_places: oddsData?.betfred_places || null, unibet_places: oddsData?.unibet_places || null, bet_uk_places: oddsData?.bet_uk_places || null, bet_goodwin_places: oddsData?.bet_goodwin_places || null, bet_victor_places: oddsData?.bet_victor_places || null, ten_bet_places: oddsData?.ten_bet_places || null, seven_bet_places: oddsData?.seven_bet_places || null, bet442_places: oddsData?.bet442_places || null, betmgm_places: oddsData?.betmgm_places || null, betway_places: oddsData?.betway_places || null, boyle_sports_places: oddsData?.boyle_sports_places || null, copybet_places: oddsData?.copybet_places || null, dragon_bet_places: oddsData?.dragon_bet_places || null, gentlemen_jim_places: oddsData?.gentlemen_jim_places || null, grosvenor_sports_places: oddsData?.grosvenor_sports_places || null, hollywood_bets_places: oddsData?.hollywood_bets_places || null, matchbook_places: oddsData?.matchbook_places || null, midnite_places: oddsData?.midnite_places || null, pricedup_bet_places: oddsData?.pricedup_bet_places || null, quinn_bet_places: oddsData?.quinn_bet_places || null, sporting_index_places: oddsData?.sporting_index_places || null,
    position: runner.position, sp: runner.sp, sp_dec: runner.sp_dec, btn: runner.btn, ovr_btn: runner.ovr_btn, time: runner.time, or_rating: runner.or, rpr_result: runner.rpr, tsr_result: runner.tsr, prize_won: runner.prize, comment_result: runner.comment,
    winning_time_detail: race.winning_time_detail, race_comments: race.comments, non_runners: race.non_runners, tote_win: race.tote_win, tote_place: race.tote_pl, tote_exacta: race.tote_ex, tote_csf: race.tote_csf, tote_tricast: race.tote_tricast, tote_trifecta: race.tote_trifecta,
    betfair_event_id: bspData?.event_id || null, betfair_selection_id: bspData?.selection_id || null, bsp: bspData?.bsp || null, ppwap: bspData?.ppwap || null, morningwap: bspData?.morningwap || null, ppmax: bspData?.ppmax || null, ppmin: bspData?.ppmin || null, ipmax: bspData?.ipmax || null, ipmin: bspData?.ipmin || null, total_traded_volume: bspData ? (bspData.morningtradedvol || 0) + (bspData.pptradedvol || 0) + (bspData.iptradedvol || 0) : null,
    ...derivedFields
  };
};

// Check if record exists
const recordExists = async (raceId, horseId) => {
  try {
    const { data, error } = await supabase.from('master_results').select('id').eq('race_id', raceId).eq('horse_id', horseId).single();
    return !!data && !error;
  } catch (error) { return false; }
};

// Insert master result
const insertMasterResult = async (resultRow, isUpdate = false) => {
  try {
    let result;
    if (isUpdate) {
      result = await supabase.from('master_results').update(resultRow).eq('race_id', resultRow.race_id).eq('horse_id', resultRow.horse_id);
    } else {
      result = await supabase.from('master_results').insert([resultRow]);
    }

    if (result.error) {
      console.error(`❌ CATCHUP Error ${isUpdate ? 'updating' : 'inserting'} ${resultRow.horse}:`, result.error.message);
      return false;
    }
    return true;
  } catch (error) {
    console.error(`❌ CATCHUP Exception ${isUpdate ? 'updating' : 'inserting'} ${resultRow.horse}:`, error.message);
    return false;
  }
};

// Process results
const processResults = async (results, isUpdate, targetDate) => {
  let totalProcessed = 0, totalInserted = 0, totalUpdated = 0, totalErrors = 0;

  console.log(`\n🔄 CATCHUP: Processing ${results.results?.length || 0} races for ${targetDate}...`);

  for (const race of results.results || []) {
    console.log(`\n📍 CATCHUP: Processing race ${race.race_name} at ${race.course}`);
    
    const raceData = await getRaceData(race.race_id);
    
    for (const runner of race.runners || []) {
      totalProcessed++;
      
      try {
        const exists = await recordExists(race.race_id, runner.horse_id);
        
        if (exists && !isUpdate) {
          console.log(`⏭️  CATCHUP: Record exists for ${runner.horse}, skipping...`);
          continue;
        }
        
        console.log(`${exists ? '🔄' : '➕'} CATCHUP: Processing ${runner.horse}...`);
        
        const [runnerData, oddsData, bspData] = await Promise.all([
          getRunnerData(race.race_id, runner.horse_id),
          getOddsData(race.race_id, runner.horse_id),
          getBspData(runner.horse, race.date, race.region)
        ]);
        
        if (bspData) {
          console.log(`🎯 CATCHUP BSP found for ${runner.horse}: BSP=${bspData.bsp}`);
        }
        
        const resultRow = buildMasterResultsRow(race, runner, raceData, runnerData, oddsData, bspData);
        const shouldUpdate = exists && isUpdate;
        const success = await insertMasterResult(resultRow, shouldUpdate);
        
        if (success) {
          if (shouldUpdate) {
            totalUpdated++;
            console.log(`✅ CATCHUP: Updated ${runner.horse}`);
          } else {
            totalInserted++;
            console.log(`✅ CATCHUP: Inserted ${runner.horse}`);
          }
        } else {
          totalErrors++;
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        totalErrors++;
        console.error(`❌ CATCHUP: Error processing ${runner.horse}:`, error.message);
      }
    }
  }

  console.log(`\n📊 CATCHUP Summary for ${targetDate}:`);
  console.log(`   Processed: ${totalProcessed}, Inserted: ${totalInserted}, Updated: ${totalUpdated}, Errors: ${totalErrors}`);
  
  return { totalProcessed, totalInserted, totalUpdated, totalErrors };
};

// Main function
const main = async () => {
  try {
    console.log('🚀 CATCHUP: Starting Master Results Population');
    console.log(`📅 CATCHUP DATES: ${CATCHUP_DATES.join(', ')}`);
    
    const isUpdate = process.argv.includes('--update');
    console.log(`🔄 Mode: ${isUpdate ? 'UPDATE' : 'INSERT'}`);
    
    // Process first date: 2025-06-09
    const targetDate = CATCHUP_DATES[0];
    console.log(`\n🎯 CATCHUP TARGET: ${targetDate}`);
    
    const results = await fetchRacingResults(targetDate);
    
    if (!results.results || results.results.length === 0) {
      console.log(`ℹ️  CATCHUP: No results found for ${targetDate}`);
      return;
    }
    
    console.log(`📋 CATCHUP: Found ${results.results.length} races for ${targetDate}`);
    
    const summary = await processResults(results, isUpdate, targetDate);
    
    console.log(`\n🎉 CATCHUP COMPLETED for ${targetDate}!`);
    console.log(`📊 Final Summary: Date: ${targetDate}, Races: ${results.results.length}, Runners processed: ${summary.totalProcessed}, New records: ${summary.totalInserted}, Updated records: ${summary.totalUpdated}, Errors: ${summary.totalErrors}`);
    
    console.log(`\n🔄 NEXT: Modify CATCHUP_DATES[0] to process: ${CATCHUP_DATES.slice(1).join(', ')}`);
    
  } catch (error) {
    console.error('❌ CATCHUP Script failed:', error.message);
    process.exit(1);
  }
};

main(); 