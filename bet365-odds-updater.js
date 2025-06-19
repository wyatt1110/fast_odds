#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const http = require('http');

console.log('🏇 BET365 FAST ODDS TRACKER - RAILWAY DEPLOYMENT');
console.log('📅 Started:', new Date().toLocaleString("en-GB", { timeZone: "Europe/London", hour12: false }));
console.log('🌍 Railway TZ:', process.env.TZ || 'UTC');

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Performance optimization: Cache daily horses in memory
let dailyHorsesCache = new Map();
let lastCacheUpdate = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getUKTime() {
  return new Date().toLocaleString("en-GB", { timeZone: "Europe/London", hour12: false });
}

function isActiveHours() {
  const now = new Date();
  // Railway runs in UTC, UK time is GMT+0, so same timezone during standard time
  const ukTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/London" }));
  const hour = ukTime.getHours();
  return hour >= 7 && hour <= 21;
}

function isTrackMatch(apiTrack, dbTrack) {
  // Normalize both track names for flexible matching
  const apiNormalized = apiTrack.toLowerCase().trim();
  const dbNormalized = dbTrack.toLowerCase().trim();
  
  // Remove content in brackets from DB track name (e.g., "Chelmsford (AW)" becomes "Chelmsford")
  const dbWithoutBrackets = dbNormalized.replace(/\s*\([^)]*\)\s*/g, '').trim();
  
  // Multiple matching strategies:
  // 1. Exact match (after normalization)
  if (apiNormalized === dbNormalized || apiNormalized === dbWithoutBrackets) {
    return true;
  }
  
  // 2. Either contains the other
  if (apiNormalized.includes(dbNormalized) || dbNormalized.includes(apiNormalized)) {
    return true;
  }
  
  // 3. API track contains DB track without brackets, or vice versa
  if (apiNormalized.includes(dbWithoutBrackets) || dbWithoutBrackets.includes(apiNormalized)) {
    return true;
  }
  
  // 4. Handle common variations (City suffix, etc.)
  const apiWithoutCity = apiNormalized.replace(/\s*city\s*$/g, '').trim();
  const dbWithoutCity = dbWithoutBrackets.replace(/\s*city\s*$/g, '').trim();
  
  if (apiWithoutCity === dbWithoutCity || 
      apiWithoutCity.includes(dbWithoutCity) || 
      dbWithoutCity.includes(apiWithoutCity)) {
    return true;
  }
  
  return false;
}

function normalizeHorseName(horseName) {
  return horseName
    .toLowerCase()                    // Convert to lowercase
    .replace(/[''`]/g, "'")          // Normalize different apostrophe types
    .replace(/[^\w\s']/g, " ")       // Replace special chars (except apostrophes) with spaces
    .replace(/\s+/g, " ")            // Replace multiple spaces with single space
    .trim();                         // Remove leading/trailing spaces
}

function isHorseActive(raceTime) {
  if (!raceTime) return true; // If no race time, assume active
  
  try {
    // Get current UK time (GMT+0)
    const now = new Date();
    const ukNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/London" }));
    
    // Parse race time (assuming format like "14:30" or "2:30 PM")
    const today = ukNow.toISOString().split('T')[0];
    let raceDateTime;
    
    // Try parsing as HH:MM format first
    if (raceTime.match(/^\d{1,2}:\d{2}$/)) {
      raceDateTime = new Date(`${today}T${raceTime.padStart(5, '0')}:00.000Z`);
    } else {
      // Try parsing other formats
      raceDateTime = new Date(`${today} ${raceTime}`);
    }
    
    // Convert to UK time zone
    const ukRaceTime = new Date(raceDateTime.toLocaleString("en-US", { timeZone: "Europe/London" }));
    
    // Add 30 minutes to race time
    const thirtyMinutesAfterRace = new Date(ukRaceTime.getTime() + 30 * 60 * 1000);
    
    // Return true if we're still within 30 minutes of race time
    return ukNow <= thirtyMinutesAfterRace;
  } catch (parseError) {
    // If we can't parse race time, assume active
    return true;
  }
}

async function loadDailyHorsesCache() {
  const now = Date.now();
  
  // Check if cache is still valid
  if (lastCacheUpdate && (now - lastCacheUpdate) < CACHE_DURATION) {
    return;
  }
  
  try {
    console.log('🔄 Refreshing daily horses cache...');
    const { data: horses, error } = await supabase
      .from('bet365_fast_odds')
      .select('id, horse_name, track_name, odds, race_time, is_active')
      .eq('race_date', new Date().toISOString().split('T')[0]);
    
    if (error) {
      console.log(`❌ Error loading horses cache: ${error.message}`);
      return;
    }
    
    // Clear and rebuild cache
    dailyHorsesCache.clear();
    
    for (const horse of horses || []) {
      const normalizedName = normalizeHorseName(horse.horse_name);
      if (!dailyHorsesCache.has(normalizedName)) {
        dailyHorsesCache.set(normalizedName, []);
      }
      dailyHorsesCache.get(normalizedName).push(horse);
    }
    
    lastCacheUpdate = now;
    console.log(`✅ Cache loaded: ${horses?.length || 0} horses, ${dailyHorsesCache.size} unique names`);
    
  } catch (error) {
    console.log(`❌ Cache loading failed: ${error.message}`);
  }
}

async function fetchBet365Data() {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '116.202.109.99',
      port: 80,
      path: '/v2/bet365/sports/horse-racing/races',
      method: 'GET',
      headers: { 
        'accept': '*/*',
        'x-rapidapi-proxy-secret': '84cc5f87-13fa-4333-b8ba-1b92674f41d7' 
      },
      timeout: 8000  // Reduced timeout for faster fails
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          reject(new Error(`API returned ${res.statusCode}`));
          return;
        }
        
        try {
          const json = JSON.parse(data);
          const formattedOdds = [];
          
          for (const race of json.races || []) {
            const raceName = race.league || 'Unknown Race';
            const raceTime = race.time || null;
            
            for (const horse of race.horses || []) {
              if (horse.na && horse.OD && horse.OD !== 'SP') {
                let decimalOdds = parseFloat(horse.OD);
                
                // Convert fractional to decimal if needed
                if (horse.OD.includes('/')) {
                  const [num, den] = horse.OD.split('/');
                  decimalOdds = (parseFloat(num) / parseFloat(den)) + 1;
                }
                
                if (!isNaN(decimalOdds) && decimalOdds > 0) {
                  formattedOdds.push({
                    horse_name: horse.na.trim(),
                    race_name: raceName.trim(),
                    race_time: raceTime,
                    track_name: raceName.trim(),
                    odds: Number(decimalOdds.toFixed(2))
                  });
                }
              }
            }
          }
          
          console.log(`📊 ${json.races?.length || 0} races, ${formattedOdds.length} horses from API`);
          resolve(formattedOdds);
          
        } catch (e) {
          reject(new Error(`Parse error: ${e.message}`));
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

async function updateOddsDatabase(newOdds) {
  if (newOdds.length === 0) {
    console.log('📭 No odds data to update');
    return;
  }
  
  // Ensure cache is loaded
  await loadDailyHorsesCache();
  
  let activeUpdatedCount = 0;
  let unmatchedApiHorses = [];
  
  // Batch updates for performance
  const updates = [];
  
  for (const horse of newOdds) {
    try {
      // Use cache instead of database query for each horse
      const normalizedApiHorse = normalizeHorseName(horse.horse_name);
      const nameMatches = dailyHorsesCache.get(normalizedApiHorse) || [];
      
      if (nameMatches.length > 0) {
        // Try flexible track matching within the name matches
        const exactMatch = nameMatches.find(m => isTrackMatch(horse.track_name, m.track_name));
        if (exactMatch) {
          // Determine if horse should be active (has live odds AND within race time)
          const shouldBeActive = isHorseActive(exactMatch.race_time);
          
          activeUpdatedCount++;
          const now = new Date().toISOString();
          
          // Check if odds have changed (more than 1 cent difference)
          if (Math.abs(exactMatch.odds - horse.odds) > 0.01) {
            // Batch the update
            updates.push({
              id: exactMatch.id,
              previous_odds: exactMatch.odds,
              odds: horse.odds,
              odds_changed_at: now,
              last_updated_at: now,
              is_active: shouldBeActive
            });
            
            // Only log significant odds changes (> 10% change)
            const percentChange = Math.abs((horse.odds - exactMatch.odds) / exactMatch.odds * 100);
            if (percentChange > 10) {
              console.log(`📈 ${horse.horse_name}: ${exactMatch.odds} → ${horse.odds} (${percentChange.toFixed(1)}%)`);
            }
            
            // Update cache
            exactMatch.odds = horse.odds;
          } else {
            // Batch the timestamp update
            updates.push({
              id: exactMatch.id,
              last_updated_at: now,
              is_active: shouldBeActive
            });
          }
        } else {
          unmatchedApiHorses.push({
            horse_name: horse.horse_name,
            track_name: horse.track_name,
            odds: horse.odds,
            db_tracks: nameMatches.map(m => m.track_name)
          });
        }
      } else {
        // API horse has no match in Supabase table at all
        unmatchedApiHorses.push({
          horse_name: horse.horse_name,
          track_name: horse.track_name,
          odds: horse.odds,
          db_tracks: []
        });
      }
      
    } catch (error) {
      console.log(`❌ Error processing ${horse.horse_name}: ${error.message}`);
    }
  }
  
  // Execute batch updates
  if (updates.length > 0) {
    try {
      // Process updates in chunks for better performance
      const chunkSize = 50;
      for (let i = 0; i < updates.length; i += chunkSize) {
        const chunk = updates.slice(i, i + chunkSize);
        
        // Execute all updates in this chunk
        await Promise.all(chunk.map(update => 
          supabase
            .from('bet365_fast_odds')
            .update(update)
            .eq('id', update.id)
        ));
      }
    } catch (error) {
      console.log(`❌ Batch update error: ${error.message}`);
    }
  }
  
  // Summary logging
  console.log(`✅ ${activeUpdatedCount}/${newOdds.length} horses processed${unmatchedApiHorses.length > 0 ? `, ${unmatchedApiHorses.length} unmatched` : ''}`);
  
  // Only show unmatched horses if there are any (and limit to first 3)
  if (unmatchedApiHorses.length > 0) {
    unmatchedApiHorses.slice(0, 3).forEach(horse => {
      if (horse.db_tracks.length > 0) {
        console.log(`   ❌ "${horse.horse_name}" - API:"${horse.track_name}" vs DB:"${horse.db_tracks.join(',')}"`);
      } else {
        console.log(`   ❌ "${horse.horse_name}" @ ${horse.track_name} - NOT IN DB`);
      }
    });
    if (unmatchedApiHorses.length > 3) {
      console.log(`   ... and ${unmatchedApiHorses.length - 3} more unmatched`);
    }
  }
}

async function runUpdate() {
  if (!isActiveHours()) {
    console.log(`🛌 Outside active hours (07:00-21:00 UK time) - Current: ${getUKTime()}`);
    return;
  }
  
  try {
    const odds = await fetchBet365Data();
    if (odds.length > 0) {
      await updateOddsDatabase(odds);
      console.log(`✅ Update complete at ${getUKTime()}\n`);
    } else {
      console.log(`⚠️ No horses returned from API\n`);
    }
  } catch (error) {
    console.log(`❌ Update failed: ${error.message}\n`);
  }
}

// Graceful shutdown for Railway
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Initial run
console.log(`🚀 Starting Bet365 fast odds tracker for Railway at ${getUKTime()}`);
runUpdate();

// Schedule updates every 10 seconds (optimized for Railway)
setInterval(runUpdate, 10000); 
