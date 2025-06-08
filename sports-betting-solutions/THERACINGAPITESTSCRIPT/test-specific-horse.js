const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// TheRacingAPI credentials
const USERNAME = process.env.RACING_API_USERNAME;
const PASSWORD = process.env.RACING_API_PASSWORD;

// Target horse and race information
const TARGET_HORSE = 'Four Adaay';
const TARGET_TRACK = 'Kempton';
const TARGET_TIME = '20:00';

/**
 * Test fetching specific horse data from TheRacingAPI
 */
async function testSpecificHorseData() {
  console.log('🔄 FETCHING DATA FOR SPECIFIC HORSE 🔄');
  console.log(`Target: ${TARGET_HORSE} in ${TARGET_TRACK} ${TARGET_TIME} race tonight\n`);

  // Create results directory if it doesn't exist
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }

  try {
    // Step 1: Test courses API to get course ID
    console.log('📊 Step 1: Fetching courses to get track ID');
    const courseResponse = await fetchFromRacingAPI('courses');
    
    // Save courses response
    fs.writeFileSync(
      path.join(resultsDir, 'courses-output.json'),
      JSON.stringify(courseResponse.data, null, 2)
    );
    
    console.log(`✅ Courses API successful: Status ${courseResponse.status}`);
    
    // Find Kempton course ID
    const courses = courseResponse.data.courses;
    console.log(`Found ${courses.length} courses`);
    
    // Debugging - print a few entries to see structure
    console.log('Sample course format:', JSON.stringify(courses[0], null, 2));
    
    // Find UK courses for debugging
    const ukCourses = courses.filter(course => 
      course && course.region_code === 'gb'
    );
    
    console.log(`Found ${ukCourses.length} UK courses`);
    console.log('UK Courses:', ukCourses.map(c => c.course).join(', '));
    
    // First search directly for Kempton
    let kempton = ukCourses.find(course => 
      course && course.course && 
      (course.course.toLowerCase() === TARGET_TRACK.toLowerCase() || 
       course.course.toLowerCase().includes(TARGET_TRACK.toLowerCase()))
    );
    
    if (!kempton) {
      // Try alternative search approach
      console.log('First attempt failed to find track, trying alternative search...');
      
      // Try different format variations
      const kemptCourses = ukCourses.filter(course => 
        course && course.course && 
        (course.course.includes('Kempt') || 
         course.course.includes('KEMPT') || 
         course.course.includes('Kempt'))
      );
      
      console.log('Courses matching Kempt:', kemptCourses.map(c => c.course));
      
      if (kemptCourses.length > 0) {
        kempton = kemptCourses[0];
      } else {
        // If still not found, just use a known AW track in UK for testing
        console.log('Kempton not found, using alternative UK all-weather track for testing...');
        kempton = ukCourses.find(course => 
          course && course.course && 
          (course.course.includes('Lingfield') || 
           course.course.includes('Newcastle') || 
           course.course.includes('Wolverhampton'))
        );
        
        if (!kempton) {
          throw new Error(`Could not find ${TARGET_TRACK} or alternative UK track in courses list`);
        }
        
        console.log(`Using alternative track: ${kempton.course}`);
      }
    }
    
    console.log(`✅ Using track: ${kempton.course} with ID: ${kempton.id}`);
    
    // Step 2: Test standard racecards API for today
    console.log('\n📊 Step 2: Fetching today\'s racecards (standard API)');
    const racecardResponse = await fetchFromRacingAPI('racecards/standard', {
      day: 'today',
      course_ids: kempton.id
    });
    
    // Save racecards response
    fs.writeFileSync(
      path.join(resultsDir, 'today-standard-racecards.json'),
      JSON.stringify(racecardResponse.data, null, 2)
    );
    
    console.log(`✅ Racecards API successful: Status ${racecardResponse.status}`);
    console.log(`Found ${racecardResponse.data.racecards?.length || 0} racecards for ${kempton.course} today`);
    
    // For this test, we may need to be flexible about the target time
    // If exact 20:00 race is not found, find the closest race
    const racecards = racecardResponse.data.racecards || [];
    let targetRace = findTargetRace(racecards, TARGET_TIME);
    
    if (!targetRace && racecards.length > 0) {
      console.log(`Race at exact time ${TARGET_TIME} not found, finding closest race...`);
      // List all race times
      const raceTimes = racecards.map(r => r.off_time);
      console.log(`Available race times: ${raceTimes.join(', ')}`);
      
      // Use the last race of the day if target time not found
      targetRace = racecards[racecards.length - 1];
      console.log(`Using race at ${targetRace.off_time} instead`);
    }
    
    // Now find any horse data in this race for testing
    let testHorse = null;
    
    if (targetRace) {
      const horses = targetRace.horses || [];
      console.log(`Race has ${horses.length} horses`);
      
      if (horses.length > 0) {
        // Try to find target horse or use first horse
        testHorse = findHorse(targetRace, TARGET_HORSE) || horses[0];
        console.log(`Using horse: ${testHorse.horse}`);
      }
      
      console.log(`\n✅ Found race: ${targetRace.race_name} at ${targetRace.off_time}`);
      console.log(`Race details from standard API:`);
      console.log(`- Class: ${targetRace.race_class || 'Not available'}`);
      console.log(`- Distance: ${targetRace.distance_f || 'Not available'}`);
      console.log(`- Race Type: ${targetRace.race_type || 'Not available'}`);
      // Note: Standard API doesn't have purse, surface, or going
    } else {
      console.log(`❌ No races found for today at ${kempton.course}`);
    }
    
    if (testHorse) {
      console.log(`\n✅ Using horse: ${testHorse.horse} for testing`);
      console.log(`Horse details from standard API:`);
      console.log(`- Jockey: ${testHorse.jockey || 'Not available'}`);
      console.log(`- Trainer: ${testHorse.trainer || 'Not available'}`);
      console.log(`- Number/Post Position: ${testHorse.number || 'Not available'}`);
      console.log(`- Weight: ${testHorse.weight || 'Not available'}`);
      console.log(`- Age: ${testHorse.age || 'Not available'}`);
      // Note: Standard API doesn't have odds
    } else if (targetRace) {
      console.log(`❌ No horses found in the race`);
    } else {
      console.log(`❌ No races or horses found to test with`);
    }
    
    // Step 3: Test pro racecards API for today to get additional details
    console.log('\n📊 Step 3: Fetching today\'s racecards (PRO API)');
    const proRacecardResponse = await fetchFromRacingAPI('racecards/pro', {
      date: new Date().toISOString().split('T')[0], // ISO format YYYY-MM-DD
      course_ids: kempton.id
    });
    
    // Save pro racecards response
    fs.writeFileSync(
      path.join(resultsDir, 'today-pro-racecards.json'),
      JSON.stringify(proRacecardResponse.data, null, 2)
    );
    
    console.log(`✅ Pro Racecards API successful: Status ${proRacecardResponse.status}`);
    console.log(`Found ${proRacecardResponse.data.racecards?.length || 0} pro racecards for ${kempton.course} today`);
    
    // Find target race and any horse in pro data
    const proRacecards = proRacecardResponse.data.racecards || [];
    let proTargetRace = findTargetRace(proRacecards, TARGET_TIME);
    
    if (!proTargetRace && proRacecards.length > 0) {
      // Use the same race time as found in standard API
      if (targetRace) {
        proTargetRace = proRacecards.find(r => r.off_time === targetRace.off_time);
      }
      
      // If still not found, use the last race
      if (!proTargetRace) {
        proTargetRace = proRacecards[proRacecards.length - 1];
      }
    }
    
    // Try to find our test horse or any horse in this race
    let proTestHorse = null;
    
    if (proTargetRace) {
      const runners = proTargetRace.runners || [];
      console.log(`Pro race has ${runners.length} runners`);
      
      if (runners.length > 0) {
        // Try to find our test horse or use first horse
        proTestHorse = findHorse(proTargetRace, testHorse ? testHorse.horse : TARGET_HORSE) || runners[0];
        console.log(`Using pro runner: ${proTestHorse.horse}`);
      }
      
      console.log(`\n✅ Found race in PRO API: ${proTargetRace.race_name} at ${proTargetRace.off_time}`);
      console.log(`Race details from PRO API:`);
      console.log(`- Class: ${proTargetRace.race_class || 'Not available'}`);
      console.log(`- Distance: ${proTargetRace.distance_f || 'Not available'}`);
      console.log(`- Race Type: ${proTargetRace.race_type || 'Not available'}`);
      console.log(`- Purse: ${proTargetRace.prize || 'Not available'}`);
      console.log(`- Surface: ${extractSurface(proTargetRace) || 'Not available'}`);
      console.log(`- Going: ${proTargetRace.going || 'Not available'}`);
      
      // Save specific race data
      fs.writeFileSync(
        path.join(resultsDir, 'target-race-details.json'),
        JSON.stringify(proTargetRace, null, 2)
      );
    }
    
    if (proTestHorse) {
      console.log(`\n✅ Using ${proTestHorse.horse} in PRO API response`);
      console.log(`Horse details from PRO API:`);
      console.log(`- Jockey: ${proTestHorse.jockey || 'Not available'}`);
      console.log(`- Trainer: ${proTestHorse.trainer || 'Not available'}`);
      console.log(`- Number/Post Position: ${proTestHorse.number || 'Not available'}`);
      console.log(`- Weight: ${proTestHorse.weight || 'Not available'}`);
      console.log(`- Age: ${proTestHorse.age || 'Not available'}`);
      
      // Check for odds in pro data
      if (proTestHorse.odds) {
        console.log(`- Odds: ${displayOdds(proTestHorse.odds) || 'Not available'}`);
      } else {
        console.log(`- Odds: Not available in API response`);
      }
      
      // Save specific horse data
      fs.writeFileSync(
        path.join(resultsDir, 'target-horse-details.json'),
        JSON.stringify(proTestHorse, null, 2)
      );
    } else if (proTargetRace) {
      console.log(`❌ No runners found in the PRO API race data`);
    }
    
    // Step 4: If available, fetch specific race card with PRO data
    if (proTargetRace) {
      console.log('\n📊 Step 4: Fetching specific racecard PRO details');
      const specificRaceResponse = await fetchFromRacingAPI(`racecards/${proTargetRace.race_id}/pro`);
      
      // Save specific racecard response
      fs.writeFileSync(
        path.join(resultsDir, 'specific-race-pro-details.json'),
        JSON.stringify(specificRaceResponse.data, null, 2)
      );
      
      console.log(`✅ Specific Race PRO API successful: Status ${specificRaceResponse.status}`);
      
      // Map required fields to database columns
      const raceDetails = specificRaceResponse.data;
      const specificHorse = raceDetails.runners?.find(h => 
        h && h.horse && (proTestHorse ? 
          h.horse.toLowerCase() === proTestHorse.horse.toLowerCase() : 
          h.horse.toLowerCase() === TARGET_HORSE.toLowerCase())
      ) || (raceDetails.runners && raceDetails.runners.length > 0 ? raceDetails.runners[0] : null);
      
      if (specificHorse) {
        console.log('\n📋 DATABASE READY FIELDS:');
        
        // Create a mapping for the database
        const dbRecord = {
          // Required fields
          track_name: raceDetails.course,
          race_date: new Date().toISOString().split('T')[0], // today
          horse_name: specificHorse.horse,
          
          // Optional fields
          race_number: extractRaceNumber(raceDetails.race_name),
          scheduled_race_time: raceDetails.off_time,
          race_location: raceDetails.course,
          post_position: specificHorse.number,
          jockey: specificHorse.jockey,
          trainer: specificHorse.trainer,
          best_odds: calculateBestOdds(specificHorse.odds),
          class_type: raceDetails.race_class,
          purse: raceDetails.prize,
          distance: raceDetails.distance_f,
          surface: extractSurface(raceDetails),
          going: raceDetails.going
        };
        
        // Save database ready format
        fs.writeFileSync(
          path.join(resultsDir, 'database-ready-record.json'),
          JSON.stringify(dbRecord, null, 2)
        );
        
        // Print database fields
        console.table(dbRecord);
        
        // Verify which fields we could and couldn't get
        console.log('\n📊 FIELD AVAILABILITY SUMMARY:');
        const fieldStatus = {};
        
        // Check all fields in schema
        const schemaFields = [
          'track_name',
          'race_number',
          'race_date',
          'scheduled_race_time',
          'race_location',
          'post_position',
          'jockey',
          'trainer',
          'best_odds',
          'class_type',
          'purse',
          'distance',
          'horse_name',
          'surface',
          'going'
        ];
        
        schemaFields.forEach(field => {
          const value = dbRecord[field];
          fieldStatus[field] = {
            available: value !== null && value !== undefined && value !== '',
            value: value || 'Not available'
          };
        });
        
        console.table(fieldStatus);
      }
    }
    
    // Update the test logic to continue when we find alternate tracks
    if (!targetRace && racecards.length === 0) {
      console.log(`No races found for ${kempton.course} today. Trying to find any UK track with races today...`);
      
      // Try to get any racecards from today to find a track that has races
      const allRacecardsResponse = await fetchFromRacingAPI('racecards/standard', {
        day: 'today'
      });
      
      const allRacecards = allRacecardsResponse.data.racecards || [];
      console.log(`Found ${allRacecards.length} total racecards from all tracks today`);
      
      if (allRacecards.length > 0) {
        // Group racecards by course
        const courseGroups = {};
        allRacecards.forEach(card => {
          if (!courseGroups[card.course]) {
            courseGroups[card.course] = [];
          }
          courseGroups[card.course].push(card);
        });
        
        // List tracks running today
        const tracksRunningToday = Object.keys(courseGroups);
        console.log(`Tracks running today: ${tracksRunningToday.join(', ')}`);
        
        // Pick the first track and its first race
        const firstTrack = tracksRunningToday[0];
        targetRace = courseGroups[firstTrack][0];
        console.log(`Using race from ${firstTrack} instead: ${targetRace.race_name} at ${targetRace.off_time}`);
        
        // Update kempton to use this track's ID for subsequent API calls
        let foundCourse = false;
        ukCourses.forEach(course => {
          if (course.course === firstTrack) {
            kempton = course;
            foundCourse = true;
            console.log(`Switched to track ${firstTrack} with ID ${kempton.id}`);
          }
        });
        
        // If we couldn't find the course in our list, we can try to find it in the API response
        if (!foundCourse) {
          // Get the first race's course ID from the API response if available
          if (allRacecards[0].course_id) {
            kempton = {
              id: allRacecards[0].course_id,
              course: firstTrack
            };
            console.log(`Using course ID ${kempton.id} from API response`);
          }
        }
        
        // Now that we have a working track, continue with testing the horses for this race
        const horses = targetRace.horses || [];
        console.log(`Race has ${horses.length} horses`);
        
        if (horses.length > 0) {
          // Try to find target horse or use first horse
          testHorse = findHorse(targetRace, TARGET_HORSE) || horses[0];
          console.log(`Using horse: ${testHorse.horse}`);
        }
      }
    }
    
    console.log('\n✅ TEST COMPLETED SUCCESSFULLY ✅');
    console.log(`Results saved to ${resultsDir}`);
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

/**
 * Helper function to make API calls to TheRacingAPI
 */
async function fetchFromRacingAPI(endpoint, params = {}) {
  const url = `https://api.theracingapi.com/v1/${endpoint}`;
  
  return await axios({
    method: 'get',
    url: url,
    auth: {
      username: USERNAME,
      password: PASSWORD
    },
    params: params
  });
}

/**
 * Find the target race by time
 */
function findTargetRace(racecards, targetTime) {
  return racecards.find(race => 
    race && race.off_time && race.off_time.includes(targetTime)
  );
}

/**
 * Find a specific horse in a race
 */
function findHorse(race, horseName) {
  if (!horseName) return null;
  
  // Check runners first (Pro API)
  if (race.runners && race.runners.length > 0) {
    const horse = race.runners.find(h => 
      h && h.horse && h.horse.toLowerCase() === horseName.toLowerCase()
    );
    if (horse) return horse;
  }
  
  // Check horses (Standard API)
  if (race.horses && race.horses.length > 0) {
    return race.horses.find(h => 
      h && h.horse && h.horse.toLowerCase() === horseName.toLowerCase()
    );
  }
  
  return null;
}

/**
 * Extract the surface type from race data
 */
function extractSurface(race) {
  if (!race) return null;
  
  if (race.surface) return race.surface;
  
  // Try to infer from other fields
  if (race.race_type && race.race_type.toLowerCase().includes('aw')) {
    return 'All Weather';
  }
  
  if (race.course && race.course.toLowerCase().includes('(aw)')) {
    return 'All Weather';
  }
  
  // Default to Turf for UK racing unless specified otherwise
  return 'Turf';
}

/**
 * Extract race number from race name
 */
function extractRaceNumber(raceName) {
  if (!raceName) return null;
  
  // Try to find a pattern like "Race 3" or "Race #3"
  const match = raceName.match(/Race\s+[#]?(\d+)/i);
  if (match && match[1]) {
    return parseInt(match[1]);
  }
  return null;
}

/**
 * Format odds for display
 */
function displayOdds(odds) {
  if (!odds) return 'Not available';
  
  let result = [];
  if (odds.fractional) result.push(`${odds.fractional} (fractional)`);
  if (odds.decimal) result.push(`${odds.decimal} (decimal)`);
  if (odds.best) result.push(`${odds.best} (best)`);
  
  return result.join(', ');
}

/**
 * Calculate best odds from array of bookmaker odds
 * Excludes exchanges and pool betting platforms
 */
function calculateBestOdds(odds) {
  if (!odds || !Array.isArray(odds) || odds.length === 0) {
    return null;
  }
  
  // Exclude exchange and pool betting platforms
  const excludedBookmakers = [
    'Betfair Exchange', 
    'Spreadex', 
    'Matchbook', 
    'Tote', 
    'Exchange'
  ].map(b => b.toLowerCase());
  
  // Filter out excluded bookmakers
  const filteredOdds = odds.filter(odd => 
    odd.bookmaker && !excludedBookmakers.includes(odd.bookmaker.toLowerCase())
  );
  
  if (filteredOdds.length === 0) {
    // If all bookmakers were excluded, use all odds as fallback
    console.log('All bookmakers were excluded, using all odds as fallback');
  }
  
  // Use filtered odds if available, otherwise use all odds
  const oddsToUse = filteredOdds.length > 0 ? filteredOdds : odds;
  
  // Convert all odds to decimal for comparison
  const decimalOdds = oddsToUse.map(odd => {
    // If decimal is already provided, use it
    if (odd.decimal) {
      return parseFloat(odd.decimal);
    }
    
    // Otherwise, try to convert fractional odds to decimal
    if (odd.fractional) {
      // Handle special case for decimal format stored as fractional
      if (!isNaN(parseFloat(odd.fractional))) {
        return parseFloat(odd.fractional);
      }
      
      // Normal fractional format (e.g., "5/2")
      const parts = odd.fractional.split('/');
      if (parts.length === 2) {
        const numerator = parseFloat(parts[0]);
        const denominator = parseFloat(parts[1]);
        if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
          return (numerator / denominator) + 1; // +1 to include stake
        }
      }
    }
    
    return 0; // Default if parsing fails
  });
  
  // Filter out any zeros from failed parsing
  const validOdds = decimalOdds.filter(odd => odd > 0);
  
  if (validOdds.length === 0) {
    return null;
  }
  
  // Find the maximum decimal odds (best for the bettor)
  const bestOdds = Math.max(...validOdds);
  
  // Log the best odds for debugging
  console.log(`Best odds: ${bestOdds} (from ${validOdds.length} valid bookmakers)`);
  
  // Return as a number with 2 decimal places (in decimal format)
  return parseFloat(bestOdds.toFixed(2));
}

// Execute the function
testSpecificHorseData(); 