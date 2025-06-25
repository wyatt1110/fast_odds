const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });
require('dotenv').config({ path: '.env.local' });

// Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// The Racing API configuration
const API_BASE_URL = 'https://api.theracingapi.com/v1';
const API_USERNAME = process.env.RACING_API_USERNAME || 'KQ9W7rQeAHWMUgxH93ie3yEc';
const API_PASSWORD = process.env.RACING_API_PASSWORD || 'T5BoPivL3Q2h6RhCdLv4EwZu';

// Entity caches to avoid duplicate searches
const entityCache = {
  jockeys: new Map(),
  trainers: new Map(),
  owners: new Map(),
  courses: new Map()
};

// Rate limiting configuration
const RATE_LIMIT_DELAY = 8000; // 8 seconds between API calls (safer margin)
const MAX_RETRIES = 5; // Increased retries for rate limit handling

// Helper function to clean names (remove bracketed content)
function cleanName(name) {
  if (!name || typeof name !== 'string') return '';
  return name.replace(/\s*\([^)]*\)/g, '').trim();
}

// Helper function to get age band format
function getAgeBand(age) {
  if (!age) return null;
  const ageNum = parseInt(age);
  if (ageNum <= 5) return `${ageNum}yo`;
  if (ageNum <= 8) return '6-8yo';
  return '9yo+';
}

// Helper function to format stats as comma-separated string
function formatStats(runs, wins, winPercentage, profitLoss) {
  const runs_val = parseInt(runs) || 0;
  const wins_val = parseInt(wins) || 0;
  const winPct = parseFloat(winPercentage) || 0;
  const pl = parseFloat(profitLoss) || 0;
  
  return `${runs_val},${wins_val},${winPct.toFixed(1)},${pl.toFixed(2)}`;
}

// Improved API call function with better rate limiting
async function makeAPICall(endpoint, retries = MAX_RETRIES) {
  // Wait between API calls to respect rate limits
  await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
  
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`Making API call to: ${endpoint} (attempt ${attempt}/${retries})`);
      console.log(`Using API credentials: ${API_USERNAME ? 'USERNAME_SET' : 'NO_USERNAME'} / ${API_PASSWORD ? 'PASSWORD_SET' : 'NO_PASSWORD'}`);
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64')}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30 second timeout
      });

      if (response.status === 429) {
        // Rate limited - exponential backoff
        const retryDelay = Math.min(15000 * attempt, 60000); // Up to 60 seconds
        console.log(`⚠️  Rate limited, retrying in ${retryDelay / 1000}s... (attempt ${attempt}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        continue;
      }

      if (response.status === 401) {
        console.error(`❌ Authentication failed (401) - check API credentials`);
        console.error(`❌ API Response: ${response.status} ${response.statusText}`);
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      if (!response.ok) {
        console.error(`❌ API call failed: ${response.status} ${response.statusText}`);
        const responseText = await response.text();
        console.error(`❌ Response body: ${responseText}`);
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ API call successful`);
      return data;
    } catch (error) {
      console.error(`❌ API call failed for ${endpoint} (attempt ${attempt}):`, error.message);
      
      if (attempt === retries) {
        console.error(`🚫 Max retries (${retries}) exceeded for ${endpoint}`);
        throw error;
      }
      
      // Progressive retry delay
      const retryDelay = Math.min(8000 * attempt, 30000);
      console.log(`⏳ Retrying in ${retryDelay / 1000}s...`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

// Cached entity search to avoid duplicate API calls
async function searchEntityIdCached(entityType, name) {
  if (!name) return null;
  
  const cleanedName = cleanName(name);
  const cacheKey = cleanedName.toLowerCase();
  
  // Check cache first
  if (entityCache[entityType].has(cacheKey)) {
    const cachedId = entityCache[entityType].get(cacheKey);
    console.log(`📋 Using cached ${entityType}: ${name} (ID: ${cachedId})`);
    return cachedId;
  }
  
  try {
    console.log(`🔍 Searching for ${entityType}: ${name}`);
    const searchResult = await makeAPICall(`/${entityType}/search?name=${encodeURIComponent(cleanedName)}`);
    
    if (searchResult?.search_results?.length > 0) {
      const entity = searchResult.search_results[0];
      console.log(`✅ Found ${entityType}: ${entity.name} (ID: ${entity.id})`);
      
      // Cache the result
      entityCache[entityType].set(cacheKey, entity.id);
      return entity.id;
    }
    
    console.log(`❌ No ${entityType} found for: ${name}`);
    // Cache null results to avoid repeated searches
    entityCache[entityType].set(cacheKey, null);
    return null;
  } catch (error) {
    console.error(`❌ Error searching for ${entityType} ${name}:`, error.message);
    return null;
  }
}

// Get today's date in YYYY-MM-DD format
function getTodayDate() {
  return new Date().toISOString().split('T')[0];
}

// Get date ranges for analysis
function getDateRanges() {
  const today = new Date();
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(today.getMonth() - 3);
  
  const twelveMonthsAgo = new Date(today);
  twelveMonthsAgo.setMonth(today.getMonth() - 12);
  
  return {
    today: today.toISOString().split('T')[0],
    threeMonthsAgo: threeMonthsAgo.toISOString().split('T')[0],
    twelveMonthsAgo: twelveMonthsAgo.toISOString().split('T')[0]
  };
}

// Calculate stats from results data
function calculateStatsFromResults(results, jockeyName) {
  if (!results || !results.length) {
    return { rides: 0, wins: 0, win_percentage: 0, profit_loss: 0 };
  }
  
  let rides = 0;
  let wins = 0;
  let profit_loss = 0;
  
  results.forEach(race => {
    if (race.runners) {
      const jockeyRuns = race.runners.filter(runner => 
        runner.jockey && runner.jockey.toLowerCase().includes(jockeyName.toLowerCase())
      );
      
      jockeyRuns.forEach(run => {
        rides++;
        if (run.position === '1') wins++;
        
        // Calculate profit/loss (simplified)
        if (run.position === '1' && run.sp_dec) {
          profit_loss += (parseFloat(run.sp_dec) - 1);
        } else {
          profit_loss -= 1;
        }
      });
    }
  });
  
  const win_percentage = rides > 0 ? (wins / rides * 100) : 0;
  
  return {
    rides,
    wins,
    win_percentage: parseFloat(win_percentage.toFixed(1)),
    profit_loss: parseFloat(profit_loss.toFixed(2))
  };
}

// Optimized jockey analysis with reduced API calls
async function analyzeJockey(jockeyId, jockeyName, trainerId, courseId, ownerId, horseAge) {
  console.log(`\n🏇 Analyzing Jockey: ${jockeyName} (${jockeyId})`);
  
  const analysis = {};
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // 1. Get lifetime stats from courses analysis (this gives us comprehensive data)
    console.log('📊 Getting jockey lifetime stats...');
    const lifetimeData = await makeAPICall(`/jockeys/${jockeyId}/analysis/courses`);
    
    if (lifetimeData && lifetimeData.courses) {
      const totalRides = lifetimeData.total_rides || 0;
      const totalWins = lifetimeData.courses.reduce((sum, c) => sum + (c['1st'] || 0), 0);
      const totalPL = lifetimeData.courses.reduce((sum, c) => sum + parseFloat(c['1_pl'] || 0), 0);
      
      analysis.lifetime = formatStats(
        totalRides,
        totalWins,
        totalRides > 0 ? (totalWins / totalRides * 100) : 0,
        totalPL
      );
      console.log(`✅ Lifetime: ${analysis.lifetime}`);
      
      // Extract course-specific data from lifetime stats (avoid extra API call)
      if (courseId) {
        const courseMatch = lifetimeData.courses.find(c => {
          if (!c.course) return false;
          const cleanCourseName = cleanName(c.course);
          const cleanTargetCourse = cleanName(courseId);
          return cleanCourseName.toLowerCase() === cleanTargetCourse.toLowerCase();
        });
        
        if (courseMatch) {
          analysis.course = formatStats(
            courseMatch.rides || 0,
            courseMatch['1st'] || 0,
            courseMatch['win_%'] ? courseMatch['win_%'] * 100 : 0,
            parseFloat(courseMatch['1_pl'] || 0)
          );
          console.log(`✅ Jockey/Course (${courseMatch.course}): ${analysis.course}`);
        } else {
          analysis.course = formatStats(0, 0, 0, 0);
        }
      }
    }
    
    // 2. Get recent results for 12-month and 3-month analysis (combined call with larger limit)
    console.log('📈 Getting jockey recent results...');
    const twelveMonthsAgoStr = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const recentResults = await makeAPICall(`/jockeys/${jockeyId}/results?start_date=${twelveMonthsAgoStr}&end_date=${today}&limit=100`);
    
    if (recentResults && recentResults.results) {
      // Calculate 12-month stats
      const stats12Month = calculateStatsFromResults(recentResults.results, jockeyName);
      analysis.twelve_months = formatStats(stats12Month.rides, stats12Month.wins, stats12Month.win_percentage, stats12Month.profit_loss);
      console.log(`✅ 12 months: ${analysis.twelve_months}`);
      
      // Calculate 3-month stats from the same dataset
      const threeMonthsAgoStr = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const recent3MonthResults = recentResults.results.filter(race => 
        race.date >= threeMonthsAgoStr
      );
      const stats3Month = calculateStatsFromResults(recent3MonthResults, jockeyName);
      analysis.three_months = formatStats(stats3Month.rides, stats3Month.wins, stats3Month.win_percentage, stats3Month.profit_loss);
      console.log(`✅ 3 months: ${analysis.three_months}`);
      
      // Calculate trainer partnership from recent results (avoid extra API call)
      if (trainerId && recent3MonthResults.length > 0) {
        let trainerRides = 0, trainerWins = 0, trainerPL = 0;
        
        recent3MonthResults.forEach(race => {
          if (race.runners) {
            const jockeyTrainerRuns = race.runners.filter(runner => 
              runner.jockey && runner.jockey.toLowerCase().includes(jockeyName.toLowerCase()) &&
              runner.trainer_id === trainerId
            );
            
            jockeyTrainerRuns.forEach(run => {
              trainerRides++;
              if (run.position === '1') trainerWins++;
              if (run.position === '1' && run.sp_dec) {
                trainerPL += (parseFloat(run.sp_dec) - 1);
              } else {
                trainerPL -= 1;
              }
            });
          }
        });
        
        analysis.trainer_3_months = formatStats(
          trainerRides,
          trainerWins,
          trainerRides > 0 ? (trainerWins / trainerRides * 100) : 0,
          trainerPL
        );
        console.log(`✅ Jockey/Trainer 3-month: ${analysis.trainer_3_months}`);
      }
    }
    
    // 3. Only make additional API calls for critical missing data
    if (trainerId && !analysis.trainer) {
      console.log('📊 Getting jockey/trainer partnership stats...');
      try {
        const trainerData = await makeAPICall(`/jockeys/${jockeyId}/analysis/trainers`);
        if (trainerData?.trainers?.length > 0) {
          const trainerMatch = trainerData.trainers.find(t => t.trainer_id === trainerId);
          if (trainerMatch) {
            analysis.trainer = formatStats(
              trainerMatch.rides || 0,
              trainerMatch['1st'] || 0,
              trainerMatch['win_%'] ? trainerMatch['win_%'] * 100 : 0,
              parseFloat(trainerMatch['1_pl'] || 0)
            );
            console.log(`✅ Jockey/Trainer: ${analysis.trainer}`);
          }
        }
      } catch (error) {
        console.error(`⚠️  Could not get jockey/trainer data: ${error.message}`);
        analysis.trainer = formatStats(0, 0, 0, 0);
      }
    }
    
    // 4. Owner partnership (only if critically needed)
    if (ownerId) {
      console.log('📊 Getting jockey/owner partnership stats...');
      try {
        const ownerData = await makeAPICall(`/jockeys/${jockeyId}/analysis/owners`);
        if (ownerData?.owners?.length > 0) {
          const ownerMatch = ownerData.owners.find(o => o.owner_id === ownerId);
          if (ownerMatch) {
            analysis.owner = formatStats(
              ownerMatch.rides || 0,
              ownerMatch['1st'] || 0,
              ownerMatch['win_%'] ? ownerMatch['win_%'] * 100 : 0,
              parseFloat(ownerMatch['1_pl'] || 0)
            );
            console.log(`✅ Jockey/Owner: ${analysis.owner}`);
          }
        }
      } catch (error) {
        console.error(`⚠️  Could not get jockey/owner data: ${error.message}`);
        analysis.owner = formatStats(0, 0, 0, 0);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error analyzing jockey ${jockeyName}:`, error.message);
  }
  
  return analysis;
}

// Optimized trainer analysis with reduced API calls
async function analyzeTrainer(trainerId, trainerName, jockeyId, courseId, ownerId, horseAge) {
  console.log(`\n🎯 Analyzing Trainer: ${trainerName} (${trainerId})`);
  
  const analysis = {};
  const today = new Date().toISOString().split('T')[0];
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  try {
    // 1. Get comprehensive lifetime stats
    console.log('📊 Getting trainer lifetime stats...');
    const lifetimeData = await makeAPICall(`/trainers/${trainerId}/analysis/courses`);
    
    if (lifetimeData && lifetimeData.courses) {
      const totalRunners = lifetimeData.courses.reduce((sum, c) => sum + (c.runners || 0), 0);
      const totalWins = lifetimeData.courses.reduce((sum, c) => sum + (c['1st'] || 0), 0);
      const totalPL = lifetimeData.courses.reduce((sum, c) => sum + parseFloat(c['1_pl'] || 0), 0);
      
      analysis.lifetime = formatStats(
        totalRunners,
        totalWins,
        totalRunners > 0 ? (totalWins / totalRunners * 100) : 0,
        totalPL
      );
      console.log(`✅ Lifetime: ${analysis.lifetime}`);
      
      // Extract course-specific data from lifetime stats
      if (courseId) {
        const courseMatch = lifetimeData.courses.find(c => {
          if (!c.course) return false;
          const cleanCourseName = cleanName(c.course);
          const cleanTargetCourse = cleanName(courseId);
          return cleanCourseName.toLowerCase() === cleanTargetCourse.toLowerCase();
        });
        
        if (courseMatch) {
          analysis.course = formatStats(
            courseMatch.runners || 0,
            courseMatch['1st'] || 0,
            courseMatch['win_%'] ? courseMatch['win_%'] * 100 : 0,
            parseFloat(courseMatch['1_pl'] || 0)
          );
          console.log(`✅ Trainer/Course (${courseMatch.course}): ${analysis.course}`);
        } else {
          analysis.course = formatStats(0, 0, 0, 0);
        }
      }
    }
    
    // 2. Get time-specific data with single calls
    console.log('📈 Getting trainer 12-month stats...');
    try {
      const twelveMonthData = await makeAPICall(`/trainers/${trainerId}/analysis/courses?start_date=${twelveMonthsAgo.toISOString().split('T')[0]}&end_date=${today}`);
      if (twelveMonthData && twelveMonthData.courses) {
        const totalRunners = twelveMonthData.courses.reduce((sum, c) => sum + (c.runners || 0), 0);
        const totalWins = twelveMonthData.courses.reduce((sum, c) => sum + (c['1st'] || 0), 0);
        const totalPL = twelveMonthData.courses.reduce((sum, c) => sum + parseFloat(c['1_pl'] || 0), 0);
        
        analysis.twelve_months = formatStats(
          totalRunners,
          totalWins,
          totalRunners > 0 ? (totalWins / totalRunners * 100) : 0,
          totalPL
        );
        console.log(`✅ 12 months: ${analysis.twelve_months}`);
      }
    } catch (error) {
      console.error(`⚠️  Could not get trainer 12-month data: ${error.message}`);
      analysis.twelve_months = formatStats(0, 0, 0, 0);
    }
    
    console.log('📈 Getting trainer 3-month stats...');
    try {
      const threeMonthData = await makeAPICall(`/trainers/${trainerId}/analysis/courses?start_date=${threeMonthsAgo.toISOString().split('T')[0]}&end_date=${today}`);
      if (threeMonthData && threeMonthData.courses) {
        const totalRunners = threeMonthData.courses.reduce((sum, c) => sum + (c.runners || 0), 0);
        const totalWins = threeMonthData.courses.reduce((sum, c) => sum + (c['1st'] || 0), 0);
        const totalPL = threeMonthData.courses.reduce((sum, c) => sum + parseFloat(c['1_pl'] || 0), 0);
        
        analysis.three_months = formatStats(
          totalRunners,
          totalWins,
          totalRunners > 0 ? (totalWins / totalRunners * 100) : 0,
          totalPL
        );
        console.log(`✅ 3 months: ${analysis.three_months}`);
      }
    } catch (error) {
      console.error(`⚠️  Could not get trainer 3-month data: ${error.message}`);
      analysis.three_months = formatStats(0, 0, 0, 0);
    }
    
    // 3. Only get partnership data if critical
    if (jockeyId) {
      console.log('📊 Getting trainer/jockey partnership stats...');
      try {
        const jockeyData = await makeAPICall(`/trainers/${trainerId}/analysis/jockeys`);
        if (jockeyData?.jockeys?.length > 0) {
          const jockeyMatch = jockeyData.jockeys.find(j => j.jockey_id === jockeyId);
          if (jockeyMatch) {
            analysis.jockey = formatStats(
              jockeyMatch.runners || 0,
              jockeyMatch['1st'] || 0,
              jockeyMatch['win_%'] ? jockeyMatch['win_%'] * 100 : 0,
              parseFloat(jockeyMatch['1_pl'] || 0)
            );
            console.log(`✅ Trainer/Jockey: ${analysis.jockey}`);
          }
        }
      } catch (error) {
        console.error(`⚠️  Could not get trainer/jockey data: ${error.message}`);
        analysis.jockey = formatStats(0, 0, 0, 0);
      }
    }
    
  } catch (error) {
    console.error(`❌ Error analyzing trainer ${trainerName}:`, error.message);
  }
  
  return analysis;
}

// Check if runner needs analysis (has null or failed data)
function needsAnalysis(runner) {
  const jockeyFields = [
    'jockey_lifetime', 'jockey_12_months', 'jockey_3_months', 
    'jockey_trainer', 'jockey_trainer_3_months',
    'jockey_course', 'jockey_owner'
  ];
  
  const trainerFields = [
    'trainer_lifetime', 'trainer_12_months', 'trainer_3_months',
    'trainer_jockey', 'trainer_jockey_3_months',
    'trainer_course', 'trainer_owner'
  ];
  
  const allFields = [...jockeyFields, ...trainerFields];
  
  // Check if any field is null, empty, or contains failed data (0,0,0.0,0.00)
  for (const field of allFields) {
    const value = runner[field];
    if (!value || 
        value === null || 
        value === '' || 
        value === '0,0,0.0,0.00' ||
        value === '0,0,0,0' ||
        value.startsWith('0,0,0')) {
      return true;
    }
  }
  
  return false;
}

// Update runner with analysis data
async function updateRunnerAnalysis(runnerId, jockeyAnalysis, trainerAnalysis) {
  try {
    const updateData = {
      // Jockey analysis
      jockey_lifetime: jockeyAnalysis.lifetime || null,
      jockey_12_months: jockeyAnalysis.twelve_months || null,
      jockey_3_months: jockeyAnalysis.three_months || null,
      jockey_trainer: jockeyAnalysis.trainer || null,
      jockey_trainer_3_months: jockeyAnalysis.trainer_3_months || null,
      jockey_course: jockeyAnalysis.course || null,
      jockey_owner: jockeyAnalysis.owner || null,
      
      // Trainer analysis
      trainer_lifetime: trainerAnalysis.lifetime || null,
      trainer_12_months: trainerAnalysis.twelve_months || null,
      trainer_3_months: trainerAnalysis.three_months || null,
      trainer_jockey: trainerAnalysis.jockey || null,
      trainer_jockey_3_months: trainerAnalysis.jockey_3_months || null,
      trainer_course: trainerAnalysis.course || null,
      trainer_owner: trainerAnalysis.owner || null,

      
      updated_at: new Date().toISOString()
    };
    
    const { error } = await supabase
      .from('runners')
      .update(updateData)
      .eq('id', runnerId);
    
    if (error) {
      console.error(`Error updating runner ${runnerId}:`, error);
      return false;
    }
    
    console.log(`✅ Successfully updated runner ${runnerId} with analysis data`);
    return true;
  } catch (error) {
    console.error(`Error updating runner ${runnerId}:`, error.message);
    return false;
  }
}

// Main function to process today's runners
async function processTodaysRunners() {
  console.log('=== Daily Jockey & Trainer Analysis Script ===');
  console.log(`Processing runners for: ${getTodayDate()}\n`);
  
  try {
    // First get today's race IDs
    const { data: todayRaces, error: racesError } = await supabase
      .from('races')
      .select('race_id')
      .eq('race_date', getTodayDate());
    
    if (racesError) {
      console.error('Error fetching today\'s races:', racesError);
      return;
    }
    
    if (!todayRaces || todayRaces.length === 0) {
      console.log('No races found for today');
      return;
    }
    
    const raceIds = todayRaces.map(race => race.race_id);
    console.log(`Found ${raceIds.length} races for today`);
    
    // Get today's runners that need analysis (including those with incomplete/failed data)
    const { data: runners, error } = await supabase
      .from('runners')
      .select(`
        id,
        race_id,
        horse_name,
        jockey,
        jockey_id,
        trainer,
        trainer_id,
        owner,
        age,
        jockey_lifetime,
        jockey_12_months,
        jockey_3_months,
        jockey_trainer,
        jockey_trainer_3_months,
        jockey_course,
        jockey_owner,
        trainer_lifetime,
        trainer_12_months,
        trainer_3_months,
        trainer_jockey,
        trainer_jockey_3_months,
        trainer_course,
        trainer_owner
      `)
      .in('race_id', raceIds);
    
    if (error) {
      console.error('Error fetching runners:', error);
      return;
    }
    
    if (!runners || runners.length === 0) {
      console.log('No runners found for today');
      return;
    }
    
    // Filter runners that need analysis (null or failed data)
    const runnersNeedingAnalysis = runners.filter(needsAnalysis);
    
    if (runnersNeedingAnalysis.length === 0) {
      console.log(`Found ${runners.length} runners for today, but all have complete analysis data`);
      return;
    }
    
    console.log(`Found ${runners.length} total runners for today`);
    console.log(`${runnersNeedingAnalysis.length} runners need analysis (have null or incomplete data)\n`);
    
    // Get race details for context
    const analysisRaceIds = [...new Set(runnersNeedingAnalysis.map(r => r.race_id))];
    const { data: races, error: raceDetailsError } = await supabase
      .from('races')
      .select('race_id, course, course_id')
      .in('race_id', analysisRaceIds);
    
    if (raceDetailsError) {
      console.error('Error fetching race details:', raceDetailsError);
      return;
    }
    
    // Create race lookup
    const raceMap = {};
    races.forEach(race => {
      raceMap[race.race_id] = race;
    });
    
      // Process ALL runners for the day
  console.log(`⚡ Processing all ${runnersNeedingAnalysis.length} runners for today`);
  
  // Show estimated time
  const estimatedMinutes = Math.ceil((runnersNeedingAnalysis.length * 6 * RATE_LIMIT_DELAY) / 60000); // 6 API calls per runner
  console.log(`⏱️  Estimated completion time: ${estimatedMinutes} minutes\n`);
  
  // Process each runner that needs analysis
  let processedCount = 0;
  let successCount = 0;
  
  for (const runner of runnersNeedingAnalysis) {
      processedCount++;
      console.log(`\n=== Processing Runner ${processedCount}/${runnersNeedingAnalysis.length} ===`);
      console.log(`Horse: ${runner.horse_name}`);
      console.log(`Jockey: ${runner.jockey} (${runner.jockey_id})`);
      console.log(`Trainer: ${runner.trainer} (${runner.trainer_id})`);
      console.log(`Owner: ${runner.owner}`);
      console.log(`Age: ${runner.age}`);
      
      const race = raceMap[runner.race_id];
      if (race) {
        console.log(`Course: ${race.course} (${race.course_id})`);
      }
      
      // Show which fields need updating
      const nullFields = [];
      const allAnalysisFields = [
        'jockey_lifetime', 'jockey_12_months', 'jockey_3_months', 
        'jockey_trainer', 'jockey_trainer_3_months',
        'jockey_course', 'jockey_owner',
        'trainer_lifetime', 'trainer_12_months', 'trainer_3_months',
        'trainer_jockey', 'trainer_jockey_3_months',
        'trainer_course', 'trainer_owner'
      ];
      
      allAnalysisFields.forEach(field => {
        const value = runner[field];
        if (!value || value === null || value === '' || value === '0,0,0.0,0.00' || value === '0,0,0,0' || value.startsWith('0,0,0')) {
          nullFields.push(field);
        }
      });
      
      console.log(`Fields needing update: ${nullFields.length > 0 ? nullFields.join(', ') : 'All fields complete'}`);
      
      try {
        // Get entity IDs and course name
        const courseName = race?.course || '';
        const ownerId = await searchEntityIdCached('owner', runner.owner);
        
        // Analyze jockey
        let jockeyAnalysis = {};
        if (runner.jockey_id) {
          jockeyAnalysis = await analyzeJockey(
            runner.jockey_id,
            runner.jockey,
            runner.trainer_id,
            courseName,  // Pass course name instead of course_id
            ownerId,
            runner.age
          );
        }
        
        // Analyze trainer
        let trainerAnalysis = {};
        if (runner.trainer_id) {
          trainerAnalysis = await analyzeTrainer(
            runner.trainer_id,
            runner.trainer,
            runner.jockey_id,
            courseName,  // Pass course name instead of course_id
            ownerId,
            runner.age
          );
        }
        
        // Update runner with analysis
        const success = await updateRunnerAnalysis(runner.id, jockeyAnalysis, trainerAnalysis);
        if (success) {
          successCount++;
        }
        
      } catch (error) {
        console.error(`Error processing runner ${runner.horse_name}:`, error.message);
      }
    }
    
    console.log(`\n=== Processing Complete ===`);
    console.log(`Total runners processed: ${processedCount}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Failed: ${processedCount - successCount}`);
    
  } catch (error) {
    console.error('Script error:', error.message);
  }
}

// Run the script
if (require.main === module) {
  processTodaysRunners()
    .then(() => {
      console.log('\n=== Script Complete ===');
      process.exit(0);
    })
    .catch(error => {
      console.error('Script failed:', error);
      process.exit(1);
    });
}

module.exports = {
  cleanName,
  getAgeBand,
  makeAPICall,
  searchEntityIdCached,
  formatStats,
  calculateStatsFromResults,
  analyzeJockey,
  analyzeTrainer,
  needsAnalysis,
  processTodaysRunners
}; 