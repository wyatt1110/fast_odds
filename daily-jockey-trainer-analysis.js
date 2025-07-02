const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
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

// Persistent entity cache file path
const CACHE_FILE_PATH = path.join(__dirname, 'entity-cache.json');

// In-memory performance data cache (only persists during script execution)
const performanceCache = {
  jockey: {
    lifetime: {},
    twelve_months: {},
    three_months: {},
  },
  trainer: {
    lifetime: {},
    twelve_months: {},
    three_months: {},
  },
  stats: {
    jockey_api_calls_saved: 0,
    trainer_api_calls_saved: 0
  }
};

// Load persistent cache from file
function loadPersistentCache() {
  try {
    if (fs.existsSync(CACHE_FILE_PATH)) {
      const cacheData = JSON.parse(fs.readFileSync(CACHE_FILE_PATH, 'utf8'));
      console.log(`📁 Loaded persistent cache: ${Object.keys(cacheData.jockeys).length} jockeys, ${Object.keys(cacheData.trainers).length} trainers, ${Object.keys(cacheData.owners).length} owners`);
      return cacheData;
    }
  } catch (error) {
    console.error('⚠️  Error loading persistent cache:', error.message);
  }
  
  // Return empty cache if file doesn't exist or error
  return {
    jockeys: {},
    trainers: {},
    owners: {},
    last_updated: new Date().toISOString(),
    stats: { total_entities: 0, api_calls_saved: 0 }
  };
}

// Save persistent cache to file
function savePersistentCache(cacheData) {
  try {
    cacheData.last_updated = new Date().toISOString();
    cacheData.stats.total_entities = Object.keys(cacheData.jockeys).length + 
                                    Object.keys(cacheData.trainers).length + 
                                    Object.keys(cacheData.owners).length;
    
    fs.writeFileSync(CACHE_FILE_PATH, JSON.stringify(cacheData, null, 2));
    console.log(`💾 Saved persistent cache: ${cacheData.stats.total_entities} entities, ${cacheData.stats.api_calls_saved} API calls saved`);
  } catch (error) {
    console.error('⚠️  Error saving persistent cache:', error.message);
  }
}

// Load persistent cache at startup
const persistentCache = loadPersistentCache();

// In-memory cache for this session (keeps existing functionality)
const entityCache = {
  jockeys: new Map(),
  trainers: new Map(),
  owners: new Map(),
  courses: new Map()
};

// Rate limiting configuration
const RATE_LIMIT_DELAY = 1000; // Reduced to 1 second - API can handle this easily with our caching
const MAX_RETRIES = 3; // Reduced retries since we have good caching

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

// Helper function to make API calls with retry logic
async function makeAPICall(endpoint, description) {
  const startTime = Date.now();
  console.log(`🌐 Making API call to: ${endpoint} (attempt 1/${MAX_RETRIES})`);
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Add rate limiting delay before API call (but not on retries)
      if (attempt === 1) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_DELAY));
      }
      
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
      if (response.status === 429) {
          // Rate limited - back off exponentially but faster
          const backoffTime = Math.min(2000 * attempt, 5000); // Max 5 second backoff
          console.log(`⏳ Rate limited, backing off for ${backoffTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        continue;
      }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const callTime = Date.now() - startTime;
      console.log(`✅ API call successful (${callTime}ms): ${description || endpoint}`);
      return data;
      
    } catch (error) {
      const callTime = Date.now() - startTime;
      console.log(`❌ API call failed (attempt ${attempt}/${MAX_RETRIES}, ${callTime}ms): ${error.message}`);
      
      if (attempt === MAX_RETRIES) {
        console.log(`💥 All ${MAX_RETRIES} attempts failed for ${endpoint}`);
        throw error;
      }
      
      // Small delay before retry
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
}

// Cached entity search to avoid duplicate API calls
async function searchEntityIdCached(entityType, name) {
  if (!name) return null;
  
  const cleanedName = cleanName(name);
  const cacheKey = cleanedName.toLowerCase();
  
  // Initialize cache if not exists
  if (!entityCache[entityType]) {
    entityCache[entityType] = new Map();
  }
  
  // Check in-memory cache first
  if (entityCache[entityType].has(cacheKey)) {
    const cachedId = entityCache[entityType].get(cacheKey);
    console.log(`📋 Using session cache ${entityType}: ${name} (ID: ${cachedId})`);
    return cachedId;
  }
  
  // Check persistent cache second
  if (persistentCache[entityType][cacheKey]) {
    const cachedId = persistentCache[entityType][cacheKey];
    // Add to session cache for faster access
    entityCache[entityType].set(cacheKey, cachedId);
    persistentCache.stats.api_calls_saved++;
    console.log(`💾 Using persistent cache ${entityType}: ${name} (ID: ${cachedId}) - Saved API call!`);
    return cachedId;
  }
  
  try {
    console.log(`🔍 Searching for ${entityType}: ${name}`);
    const searchResult = await makeAPICall(`/${entityType}/search?name=${encodeURIComponent(cleanedName)}`, `Search ${entityType} "${cleanedName}"`);
    
    // Handle different API response structures
    let resultsArray = [];
    if (entityType === 'owners') {
      // Owner search returns {search_results: [...]}
      if (searchResult && searchResult.search_results && searchResult.search_results.length > 0) {
        resultsArray = searchResult.search_results;
      }
    } else {
      // Other searches return direct arrays
      if (searchResult && searchResult.length > 0) {
        resultsArray = searchResult;
      }
    }
    
    if (resultsArray.length > 0) {
      // Find the exact match
      const exactMatch = resultsArray.find(entity => 
        cleanName(entity.name).toLowerCase() === cleanedName.toLowerCase()
      );
      
      if (exactMatch) {
        console.log(`✅ Found ${entityType} ID for "${name}": ${exactMatch.id}`);
        // Cache in both session and persistent storage
        entityCache[entityType].set(cacheKey, exactMatch.id);
        persistentCache[entityType][cacheKey] = exactMatch.id;
        return exactMatch.id;
      } else {
        console.log(`⚠️  No exact match found for ${entityType} "${name}", found: ${resultsArray.map(e => e.name).join(', ')}`);
      }
    } else {
      console.log(`⚠️  No results found for ${entityType} "${name}"`);
    }
    
    // Cache null results to avoid repeated searches (session only)
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
    // Get lifetime performance (cached)
    const cacheKey = `${jockeyId}_lifetime`;
    let lifetimeStats = performanceCache.jockey.lifetime[cacheKey];
    
    if (!lifetimeStats) {
      const lifetimeData = await makeAPICall(`/jockeys/${jockeyId}/analysis/courses`, `Jockey ${jockeyName} lifetime stats`);
      
      if (lifetimeData && lifetimeData.courses) {
        const totalRides = lifetimeData.courses.reduce((sum, c) => sum + (c.rides || 0), 0);
        const totalWins = lifetimeData.courses.reduce((sum, c) => sum + (c['1st'] || 0), 0);
        const winPercentage = totalRides > 0 ? (totalWins / totalRides * 100) : 0;
        const totalPL = lifetimeData.courses.reduce((sum, c) => sum + parseFloat(c['1_pl'] || 0), 0);
        
        lifetimeStats = `${totalRides},${totalWins},${winPercentage.toFixed(1)},${totalPL.toFixed(2)}`;
        performanceCache.jockey.lifetime[cacheKey] = lifetimeStats;
        console.log(`🔥 Cached lifetime stats for jockey ${jockeyName}: ${lifetimeStats}`);
      } else {
        lifetimeStats = null;
        console.log(`⚠️  No lifetime data found for jockey ${jockeyName} - leaving null`);
      }
    } else {
      console.log(`🔥 Using cached lifetime stats for jockey ${jockeyName}: ${lifetimeStats}`);
    }
    
    // Get 12-month results using analysis/courses endpoint (cached)
    const twelveMonthCacheKey = `${jockeyId}_12month`;
    let recent12MonthResults = performanceCache.jockey.twelve_months[twelveMonthCacheKey];
    
    if (!recent12MonthResults) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
      const twelveMonthsAgoStr = twelveMonthsAgo.toISOString().split('T')[0];
      
      const recentResults = await makeAPICall(`/jockeys/${jockeyId}/analysis/courses?start_date=${twelveMonthsAgoStr}&end_date=${yesterdayStr}`, `Jockey ${jockeyName} 12-month analysis`);
      
      if (recentResults && recentResults.courses && recentResults.courses.length > 0) {
        const totalRunners = recentResults.courses.reduce((sum, c) => sum + (c.runners || 0), 0);
        const totalWins = recentResults.courses.reduce((sum, c) => sum + (c['1st'] || 0), 0);
        const winPercentage = totalRunners > 0 ? (totalWins / totalRunners * 100) : 0;
        const totalPL = recentResults.courses.reduce((sum, c) => sum + parseFloat(c['1_pl'] || 0), 0);
        
        recent12MonthResults = `${totalRunners},${totalWins},${winPercentage.toFixed(1)},${totalPL.toFixed(2)}`;
        performanceCache.jockey.twelve_months[twelveMonthCacheKey] = recent12MonthResults;
        console.log(`🔥 Cached 12-month stats for jockey ${jockeyName}: ${recent12MonthResults}`);
      } else {
        recent12MonthResults = null;
        console.log(`⚠️  No 12-month data found for jockey ${jockeyName} - leaving null`);
      }
    } else {
      console.log(`🔥 Using cached 12-month stats for jockey ${jockeyName}: ${recent12MonthResults}`);
    }
    
    // Get 3-month results using analysis/courses endpoint (cached)
    const threeMonthCacheKey = `${jockeyId}_3month`;
    let recent3MonthResults = performanceCache.jockey.three_months[threeMonthCacheKey];
    
    if (!recent3MonthResults) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
      const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0];
      
      const recentResults = await makeAPICall(`/jockeys/${jockeyId}/analysis/courses?start_date=${threeMonthsAgoStr}&end_date=${yesterdayStr}`, `Jockey ${jockeyName} 3-month analysis`);
      
      if (recentResults && recentResults.courses && recentResults.courses.length > 0) {
        const totalRunners = recentResults.courses.reduce((sum, c) => sum + (c.runners || 0), 0);
        const totalWins = recentResults.courses.reduce((sum, c) => sum + (c['1st'] || 0), 0);
        const winPercentage = totalRunners > 0 ? (totalWins / totalRunners * 100) : 0;
        const totalPL = recentResults.courses.reduce((sum, c) => sum + parseFloat(c['1_pl'] || 0), 0);
        
        recent3MonthResults = `${totalRunners},${totalWins},${winPercentage.toFixed(1)},${totalPL.toFixed(2)}`;
        performanceCache.jockey.three_months[threeMonthCacheKey] = recent3MonthResults;
        console.log(`🔥 Cached 3-month stats for jockey ${jockeyName}: ${recent3MonthResults}`);
      } else {
        recent3MonthResults = null;
        console.log(`⚠️  No 3-month data found for jockey ${jockeyName} - leaving null`);
      }
    } else {
      console.log(`🔥 Using cached 3-month stats for jockey ${jockeyName}: ${recent3MonthResults}`);
    }
    
    // Variable data - jockey/trainer partnerships (always fetch)
    let jockeyTrainerData = null;
    if (trainerId) {
      try {
        const trainerData = await makeAPICall(`/jockeys/${jockeyId}/analysis/trainers`, `Jockey ${jockeyName} trainer partnerships`);
        if (trainerData && trainerData.trainers && trainerData.trainers.length > 0) {
          const specificTrainerData = trainerData.trainers.find(t => String(t.trainer_id) === String(trainerId));
          if (specificTrainerData) {
            const winPercentage = specificTrainerData['win_%'] ? (specificTrainerData['win_%'] * 100) : 0;
            jockeyTrainerData = `${specificTrainerData.rides},${specificTrainerData['1st']},${winPercentage.toFixed(1)},${parseFloat(specificTrainerData['1_pl'] || 0).toFixed(2)}`;
            console.log(`✅ Found jockey-trainer partnership: ${jockeyTrainerData}`);
          } else {
            console.log(`⚠️  No trainer match found for ID ${trainerId} in ${trainerData.trainers.length} trainer partnerships`);
          }
        }
      } catch (error) {
        console.log(`⚠️  Error fetching jockey-trainer data: ${error.message}`);
      }
    }
    
    // Variable data - jockey/owner partnerships (always fetch)
    let jockeyOwnerData = null;
    if (ownerId) {
      try {
        const ownerData = await makeAPICall(`/jockeys/${jockeyId}/analysis/owners`, `Jockey ${jockeyName} owner partnerships`);
        if (ownerData && ownerData.owners && ownerData.owners.length > 0) {
          const specificOwnerData = ownerData.owners.find(o => String(o.owner_id) === String(ownerId));
          if (specificOwnerData) {
            const winPercentage = specificOwnerData['win_%'] ? (specificOwnerData['win_%'] * 100) : 0;
            jockeyOwnerData = `${specificOwnerData.rides},${specificOwnerData['1st']},${winPercentage.toFixed(1)},${parseFloat(specificOwnerData['1_pl'] || 0).toFixed(2)}`;
            console.log(`✅ Found jockey-owner partnership: ${jockeyOwnerData}`);
          } else {
            console.log(`⚠️  No owner match found for ID ${ownerId} in ${ownerData.owners.length} owner partnerships`);
          }
        }
      } catch (error) {
        console.log(`⚠️  Error fetching jockey-owner data: ${error.message}`);
      }
    }
    
    // Variable data - jockey/course partnerships (always fetch)
    let jockeyCourseData = null;
    if (courseId) {
      try {
        const courseData = await makeAPICall(`/jockeys/${jockeyId}/analysis/courses`, `Jockey ${jockeyName} course analysis`);
        if (courseData && courseData.courses && courseData.courses.length > 0) {
          const courseMatch = courseData.courses.find(c => String(c.course_id) === String(courseId) || c.course === courseId);
          if (courseMatch) {
            const winPercentage = courseMatch['win_%'] ? (courseMatch['win_%'] * 100) : 0;
            jockeyCourseData = `${courseMatch.runners},${courseMatch['1st']},${winPercentage.toFixed(1)},${parseFloat(courseMatch['1_pl'] || 0).toFixed(2)}`;
          }
        }
      } catch (error) {
        console.log(`⚠️  Error fetching jockey-course data: ${error.message}`);
      }
    }

    // Return complete analysis structure with all 6 jockey fields
    const analysis = {
      lifetime: lifetimeStats,
      twelve_months: recent12MonthResults, 
      three_months: recent3MonthResults,
      trainer: jockeyTrainerData,
      trainer_3_months: jockeyTrainerData, // Using same data as lifetime trainer partnerships
      course: jockeyCourseData,
      owner: jockeyOwnerData
    };
    
    return analysis;
  } catch (error) {
    console.error(`❌ Error analyzing jockey ${jockeyName}:`, error.message);
    return null;
  }
}

// Trainer analysis function with caching
async function analyzeTrainer(trainerId, trainerName, jockeyId, courseId, ownerId, horseAge) {
  console.log(`🔍 Analyzing trainer: ${trainerName} (ID: ${trainerId})`);

  try {
  // Cached lifetime stats
  let lifetimeStats = null;
  if (!performanceCache.trainer.lifetime[trainerId]) {
    const lifetimeData = await makeAPICall(`/trainers/${trainerId}/analysis/courses`, `Trainer ${trainerName} lifetime stats`);
    
    if (lifetimeData && lifetimeData.courses) {
      const totalRunners = lifetimeData.courses.reduce((sum, c) => sum + (c.runners || 0), 0);
      const totalWins = lifetimeData.courses.reduce((sum, c) => sum + (c['1st'] || 0), 0);
      const winPercentage = totalRunners > 0 ? (totalWins / totalRunners * 100) : 0;
      const totalPL = lifetimeData.courses.reduce((sum, c) => sum + parseFloat(c['1_pl'] || 0), 0);
      
      lifetimeStats = `${totalRunners},${totalWins},${winPercentage.toFixed(1)},${totalPL.toFixed(2)}`;
      performanceCache.trainer.lifetime[trainerId] = lifetimeStats;
      console.log(`🔥 Cached lifetime stats for trainer ${trainerName}: ${lifetimeStats}`);
    }
        } else {
    lifetimeStats = performanceCache.trainer.lifetime[trainerId];
    console.log(`🔥 Using cached lifetime stats for trainer ${trainerName}`);
  }
  
  // Cached 12-month stats
  let twelveMonthStats = null;
  if (!performanceCache.trainer.twelve_months[trainerId]) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);
    
    const twelveMonthData = await makeAPICall(`/trainers/${trainerId}/analysis/courses?start_date=${twelveMonthsAgo.toISOString().split('T')[0]}&end_date=${yesterdayStr}`, `Trainer ${trainerName} 12-month stats`);
    if (twelveMonthData && twelveMonthData.courses) {
      const totalRunners = twelveMonthData.courses.reduce((sum, c) => sum + (c.runners || 0), 0);
      const totalWins = twelveMonthData.courses.reduce((sum, c) => sum + (c['1st'] || 0), 0);
      const winPercentage = totalRunners > 0 ? (totalWins / totalRunners * 100) : 0;
      const totalPL = twelveMonthData.courses.reduce((sum, c) => sum + parseFloat(c['1_pl'] || 0), 0);
      
      twelveMonthStats = `${totalRunners},${totalWins},${winPercentage.toFixed(1)},${totalPL.toFixed(2)}`;
      performanceCache.trainer.twelve_months[trainerId] = twelveMonthStats;
      console.log(`🔥 Cached 12-month stats for trainer ${trainerName}: ${twelveMonthStats}`);
    }
  } else {
    twelveMonthStats = performanceCache.trainer.twelve_months[trainerId];
    console.log(`🔥 Using cached 12-month stats for trainer ${trainerName}`);
  }
  
  // Cached 3-month stats
  let threeMonthStats = null;
  if (!performanceCache.trainer.three_months[trainerId]) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    
    const threeMonthData = await makeAPICall(`/trainers/${trainerId}/analysis/courses?start_date=${threeMonthsAgo.toISOString().split('T')[0]}&end_date=${yesterdayStr}`, `Trainer ${trainerName} 3-month stats`);
    if (threeMonthData && threeMonthData.courses) {
      const totalRunners = threeMonthData.courses.reduce((sum, c) => sum + (c.runners || 0), 0);
      const totalWins = threeMonthData.courses.reduce((sum, c) => sum + (c['1st'] || 0), 0);
      const winPercentage = totalRunners > 0 ? (totalWins / totalRunners * 100) : 0;
      const totalPL = threeMonthData.courses.reduce((sum, c) => sum + parseFloat(c['1_pl'] || 0), 0);
      
      threeMonthStats = `${totalRunners},${totalWins},${winPercentage.toFixed(1)},${totalPL.toFixed(2)}`;
      performanceCache.trainer.three_months[trainerId] = threeMonthStats;
      console.log(`🔥 Cached 3-month stats for trainer ${trainerName}: ${threeMonthStats}`);
    }
  } else {
    threeMonthStats = performanceCache.trainer.three_months[trainerId];
    console.log(`🔥 Using cached 3-month stats for trainer ${trainerName}`);
  }
  
  // Variable data - trainer/jockey partnerships (always fetch)
  let trainerJockeyData = null;
  if (jockeyId) {
    try {
      const jockeyData = await makeAPICall(`/trainers/${trainerId}/analysis/jockeys`, `Trainer ${trainerName} jockey partnerships`);
              if (jockeyData && jockeyData.jockeys && jockeyData.jockeys.length > 0) {
        const jockeyMatch = jockeyData.jockeys.find(j => String(j.jockey_id) === String(jockeyId));
        if (jockeyMatch) {
          const winPercentage = jockeyMatch['win_%'] ? (jockeyMatch['win_%'] * 100) : 0;
          trainerJockeyData = `${jockeyMatch.runners},${jockeyMatch['1st']},${winPercentage.toFixed(1)},${parseFloat(jockeyMatch['1_pl'] || 0).toFixed(2)}`;
          console.log(`✅ Found trainer-jockey partnership: ${trainerJockeyData}`);
        } else {
          console.log(`⚠️  No jockey match found for ID ${jockeyId} in ${jockeyData.jockeys.length} jockey partnerships`);
        }
      }
    } catch (error) {
      console.log(`⚠️  Error fetching trainer-jockey data: ${error.message}`);
    }
  }
  
  // Variable data - trainer/owner partnerships (always fetch)
  let trainerOwnerData = null;
  if (ownerId) {
    try {
      const ownerData = await makeAPICall(`/trainers/${trainerId}/analysis/owners`, `Trainer ${trainerName} owner partnerships`);
      if (ownerData && ownerData.owners && ownerData.owners.length > 0) {
        const ownerMatch = ownerData.owners.find(o => String(o.owner_id) === String(ownerId));
        if (ownerMatch) {
          const winPercentage = ownerMatch['win_%'] ? (ownerMatch['win_%'] * 100) : 0;
          trainerOwnerData = `${ownerMatch.runners},${ownerMatch['1st']},${winPercentage.toFixed(1)},${parseFloat(ownerMatch['1_pl'] || 0).toFixed(2)}`;
          console.log(`✅ Found trainer-owner partnership: ${trainerOwnerData}`);
        } else {
          console.log(`⚠️  No owner match found for ID ${ownerId} in ${ownerData.owners.length} owner partnerships`);
        }
      }
    } catch (error) {
      console.log(`⚠️  Error fetching trainer-owner data: ${error.message}`);
    }
  }
  
  // Variable data - trainer/course partnerships (always fetch)
  let trainerCourseData = null;
  if (courseId) {
    try {
      const courseData = await makeAPICall(`/trainers/${trainerId}/analysis/courses`, `Trainer ${trainerName} course analysis`);
      if (courseData && courseData.courses && courseData.courses.length > 0) {
        const courseMatch = courseData.courses.find(c => String(c.course_id) === String(courseId) || c.course === courseId);
        if (courseMatch) {
          const winPercentage = courseMatch['win_%'] ? (courseMatch['win_%'] * 100) : 0;
          trainerCourseData = `${courseMatch.runners},${courseMatch['1st']},${winPercentage.toFixed(1)},${parseFloat(courseMatch['1_pl'] || 0).toFixed(2)}`;
        }
      }
    } catch (error) {
      console.log(`⚠️  Error fetching trainer-course data: ${error.message}`);
    }
  }

  // Return complete analysis structure with all 6 trainer fields
  const analysis = {
    lifetime: lifetimeStats,
    twelve_months: twelveMonthStats,
    three_months: threeMonthStats,
    jockey: trainerJockeyData,
    jockey_3_months: trainerJockeyData, // Using same data as lifetime jockey partnerships
    course: trainerCourseData,
    owner: trainerOwnerData
  };
  
  return analysis;
  
  } catch (error) {
    console.error(`❌ Error analyzing trainer ${trainerName}:`, error.message);
  return null;
  }
}

// Check if runner needs analysis (has null or failed data) - IMPROVED VERSION
function needsAnalysis(runner) {
  // Core essential fields that must be populated
  const coreJockeyFields = ['jockey_lifetime', 'jockey_12_months', 'jockey_3_months'];
  const coreTrainerFields = ['trainer_lifetime', 'trainer_12_months', 'trainer_3_months'];
  
  // Check if core jockey fields are missing
  let missingCoreJockey = 0;
  coreJockeyFields.forEach(field => {
    const value = runner[field];
    if (!value || value === null || value === '' || value === '0,0,0.0,0.00' || value === '0,0,0,0' || value.startsWith('0,0,0')) {
      missingCoreJockey++;
    }
  });
  
  // Check if core trainer fields are missing
  let missingCoreTrainer = 0;
  coreTrainerFields.forEach(field => {
    const value = runner[field];
    if (!value || value === null || value === '' || value === '0,0,0.0,0.00' || value === '0,0,0,0' || value.startsWith('0,0,0')) {
      missingCoreTrainer++;
    }
  });
  
  // Only process if missing 2 or more core fields (prioritize runners with most missing data)
  const totalMissingCore = missingCoreJockey + missingCoreTrainer;
  
  if (totalMissingCore >= 2) {
    console.log(`🎯 Runner ${runner.horse_name} needs analysis: ${totalMissingCore} core fields missing`);
      return true;
  }
  
  return false;
}

// Update runner with analysis data
async function updateRunnerAnalysis(runnerId, jockeyAnalysis, trainerAnalysis) {
  try {
    console.log(`\n💾 === UPDATING RUNNER ${runnerId} ===`);
    console.log(`📊 Jockey analysis received:`, jockeyAnalysis ? Object.keys(jockeyAnalysis).length : 0, 'fields');
    console.log(`📊 Trainer analysis received:`, trainerAnalysis ? Object.keys(trainerAnalysis).length : 0, 'fields');
    
    // Show what data we're about to save
    if (jockeyAnalysis) {
      console.log(`📝 Jockey data to save:`, JSON.stringify(jockeyAnalysis, null, 2));
    } else {
      console.log(`📝 Jockey data: NULL (analysis failed)`);
    }
    
    if (trainerAnalysis) {
      console.log(`📝 Trainer data to save:`, JSON.stringify(trainerAnalysis, null, 2));
    } else {
      console.log(`📝 Trainer data: NULL (analysis failed)`);
    }
    
    const updateData = {
      // Jockey analysis (only update if we have data)
      jockey_lifetime: jockeyAnalysis?.lifetime || null,
      jockey_12_months: jockeyAnalysis?.twelve_months || null,
      jockey_3_months: jockeyAnalysis?.three_months || null,
      jockey_trainer: jockeyAnalysis?.trainer || null,
      jockey_trainer_3_months: jockeyAnalysis?.trainer_3_months || null,
      jockey_course: jockeyAnalysis?.course || null,
      jockey_owner: jockeyAnalysis?.owner || null,
      
      // Trainer analysis (only update if we have data)
      trainer_lifetime: trainerAnalysis?.lifetime || null,
      trainer_12_months: trainerAnalysis?.twelve_months || null,
      trainer_3_months: trainerAnalysis?.three_months || null,
      trainer_jockey: trainerAnalysis?.jockey || null,
      trainer_jockey_3_months: trainerAnalysis?.jockey_3_months || null,
      trainer_course: trainerAnalysis?.course || null,
      trainer_owner: trainerAnalysis?.owner || null,

      updated_at: new Date().toISOString()
    };
    
    console.log(`📋 Final update data:`, JSON.stringify(updateData, null, 2));
    console.log(`🔄 Attempting Supabase update for runner ${runnerId}...`);
    
    const { data, error } = await supabase
      .from('runners')
      .update(updateData)
      .eq('id', runnerId)
      .select(); // Return the updated data to verify
    
    if (error) {
      console.error(`❌ Supabase error for runner ${runnerId}:`, error);
      console.error(`❌ Error details:`, JSON.stringify(error, null, 2));
      return false;
    }
    
    if (data && data.length > 0) {
      console.log(`✅ Successfully updated runner ${runnerId}`);
      console.log(`✅ Updated ${data.length} record(s)`);
      console.log(`✅ Verification - updated data:`, JSON.stringify(data[0], null, 2));
    return true;
    } else {
      console.error(`⚠️  Update completed but no data returned for runner ${runnerId}`);
      console.error(`⚠️  This might indicate the runner ID doesn't exist`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Exception updating runner ${runnerId}:`, error.message);
    console.error(`❌ Full error:`, error);
    return false;
  }
}

// Main function to process today's runners
async function processTodaysRunners() {
  console.log('=== Daily Jockey & Trainer Analysis Script ===');
  console.log(`Processing runners for: ${getTodayDate()}\n`);
  
  try {
    // Test Supabase connectivity first
    console.log('🔗 Testing Supabase connectivity...');
    const { data: testData, error: testError } = await supabase
      .from('runners')
      .select('id')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connectivity test failed:', testError);
      console.error('❌ Cannot proceed without database access');
      return;
    }
    console.log('✅ Supabase connectivity test passed');
    
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
    
    // OPTIMIZATION: Group unique jockeys and trainers
    const uniqueJockeys = {};
    const uniqueTrainers = {};
    const runnersByJockeyId = {};
    const runnersByTrainerId = {};
    
    console.log(`🔍 Finding unique jockeys and trainers for optimization...`);
    
    runnersNeedingAnalysis.forEach(runner => {
      // Group unique jockeys
      if (runner.jockey_id && !uniqueJockeys[runner.jockey_id]) {
        uniqueJockeys[runner.jockey_id] = runner.jockey;
      }
      
      // Group unique trainers
      if (runner.trainer_id && !uniqueTrainers[runner.trainer_id]) {
        uniqueTrainers[runner.trainer_id] = runner.trainer;
      }
      
      // Group runners by jockey
      if (runner.jockey_id) {
        if (!runnersByJockeyId[runner.jockey_id]) {
          runnersByJockeyId[runner.jockey_id] = [];
        }
        runnersByJockeyId[runner.jockey_id].push(runner);
      }
      
      // Group runners by trainer
      if (runner.trainer_id) {
        if (!runnersByTrainerId[runner.trainer_id]) {
          runnersByTrainerId[runner.trainer_id] = [];
        }
        runnersByTrainerId[runner.trainer_id].push(runner);
      }
    });
    
    const uniqueJockeyCount = Object.keys(uniqueJockeys).length;
    const uniqueTrainerCount = Object.keys(uniqueTrainers).length;
    
    console.log(`🏇 Found ${uniqueJockeyCount} unique jockeys for ${runnersNeedingAnalysis.length} runners`);
    console.log(`🎯 Found ${uniqueTrainerCount} unique trainers for ${runnersNeedingAnalysis.length} runners`);
    
    // Show estimated time with optimization
    const estimatedCalls = uniqueJockeyCount * 2 + uniqueTrainerCount * 2 + runnersNeedingAnalysis.length * 2;
    const estimatedMinutes = Math.ceil((estimatedCalls * RATE_LIMIT_DELAY) / 60000);
    console.log(`⏱️  Estimated completion time with optimization: ~${estimatedMinutes} minutes (down from ${Math.ceil((runnersNeedingAnalysis.length * 6 * RATE_LIMIT_DELAY) / 60000)} minutes)\n`);
  
  // Process each runner that needs analysis
  let processedCount = 0;
  let successCount = 0;
  
    // Process runners by jockey_id to maximize cache efficiency
  for (const runner of runnersNeedingAnalysis) {
      const runnerStartTime = Date.now();
      processedCount++;
      console.log(`\n=== Processing Runner ${processedCount}/${runnersNeedingAnalysis.length} ===`);
      console.log(`⏱️  Started at: ${new Date().toISOString()}`);
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
        const entityStartTime = Date.now();
        // Get entity IDs and course name
        const courseName = race?.course || '';
        const ownerId = await searchEntityIdCached('owners', runner.owner);
        console.log(`⏱️  Entity ID lookup took: ${Date.now() - entityStartTime}ms`);
        
        // Analyze jockey
        let jockeyAnalysis = null;
        if (runner.jockey_id) {
          const jockeyStartTime = Date.now();
          console.log(`🔍 Starting jockey analysis for: ${runner.jockey} (ID: ${runner.jockey_id})`);
          jockeyAnalysis = await analyzeJockey(
            runner.jockey_id,
            runner.jockey,
            runner.trainer_id,
            courseName,  // Pass course name instead of course_id
            ownerId,
            runner.age
          );
          if (jockeyAnalysis) {
            console.log(`✅ Jockey analysis complete: ${Object.keys(jockeyAnalysis).length} fields returned`);
          } else {
            console.log(`❌ Jockey analysis failed or returned null`);
          }
          console.log(`⏱️  Jockey analysis took: ${Date.now() - jockeyStartTime}ms`);
        } else {
          console.log(`⚠️  No jockey_id found for runner, skipping jockey analysis`);
        }
        
        // Analyze trainer
        let trainerAnalysis = null;
        if (runner.trainer_id) {
          const trainerStartTime = Date.now();
          console.log(`🔍 Starting trainer analysis for: ${runner.trainer} (ID: ${runner.trainer_id})`);
          trainerAnalysis = await analyzeTrainer(
            runner.trainer_id,
            runner.trainer,
            runner.jockey_id,
            courseName,  // Pass course name instead of course_id
            ownerId,
            runner.age
          );
          if (trainerAnalysis) {
            console.log(`✅ Trainer analysis complete: ${Object.keys(trainerAnalysis).length} fields returned`);
          } else {
            console.log(`❌ Trainer analysis failed or returned null`);
          }
          console.log(`⏱️  Trainer analysis took: ${Date.now() - trainerStartTime}ms`);
        } else {
          console.log(`⚠️  No trainer_id found for runner, skipping trainer analysis`);
        }
        
        // Update runner with analysis
        const updateStartTime = Date.now();
        console.log(`💾 About to update runner ${runner.id} with analysis data...`);
        console.log(`🎯 Has jockey data: ${jockeyAnalysis ? Object.keys(jockeyAnalysis).length : 0} fields`);
        console.log(`🎯 Has trainer data: ${trainerAnalysis ? Object.keys(trainerAnalysis).length : 0} fields`);
        
        const success = await updateRunnerAnalysis(runner.id, jockeyAnalysis, trainerAnalysis);
        console.log(`⏱️  Database update took: ${Date.now() - updateStartTime}ms`);
        
        if (success) {
          successCount++;
          console.log(`✅ Runner ${runner.id} updated successfully (Total successful: ${successCount})`);
        } else {
          console.log(`❌ Failed to update runner ${runner.id} (Total failed: ${processedCount - successCount})`);
        }
        
        const totalRunnerTime = Date.now() - runnerStartTime;
        console.log(`⏱️  TOTAL TIME FOR RUNNER: ${totalRunnerTime}ms (${(totalRunnerTime/1000).toFixed(1)}s)`);
        console.log(`⚡ Estimated time remaining: ${((totalRunnerTime * (runnersNeedingAnalysis.length - processedCount)) / 1000 / 60).toFixed(1)} minutes`);
        
      } catch (error) {
        console.error(`Error processing runner ${runner.horse_name}:`, error.message);
        console.log(`⏱️  Failed runner took: ${Date.now() - runnerStartTime}ms`);
      }
    }
    
    console.log(`\n=== Processing Complete ===`);
    console.log(`Total runners processed: ${processedCount}`);
    console.log(`Successfully updated: ${successCount}`);
    console.log(`Failed: ${processedCount - successCount}`);
    
    // Show cache performance
    console.log(`\n📊 Cache Performance:`);
    console.log(`💾 Persistent cache entities: ${persistentCache.stats.total_entities}`);
    console.log(`🚀 Entity API calls saved: ${persistentCache.stats.api_calls_saved}`);
    console.log(`🔥 Jockey performance API calls saved: ${performanceCache.stats.jockey_api_calls_saved}`);
    console.log(`🔥 Trainer performance API calls saved: ${performanceCache.stats.trainer_api_calls_saved}`);
    console.log(`📁 Cache file: ${CACHE_FILE_PATH}`);
    
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