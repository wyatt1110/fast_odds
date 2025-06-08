const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

// TheRacingAPI credentials
const USERNAME = process.env.RACING_API_USERNAME;
const PASSWORD = process.env.RACING_API_PASSWORD;

/**
 * Test script to verify the field mapping from TheRacingAPI to our database
 */
async function testFieldMapping() {
  console.log('🔄 TESTING DATABASE FIELD MAPPING 🔄');
  
  // Create results directory if it doesn't exist
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir);
  }
  
  try {
    // Step 1: Define database field requirements from our schema
    console.log('\n📋 Step 1: Defining required database fields');
    
    const dbRequiredFields = ['track_name', 'race_date', 'horse_name'];
    
    const dbOptionalFields = [
      'race_number',
      'scheduled_race_time',
      'race_location',
      'post_position',
      'jockey',
      'trainer',
      'best_odds',
      'class_type',
      'purse',
      'distance',
      'surface',
      'going'
    ];
    
    console.log(`Required fields: ${dbRequiredFields.join(', ')}`);
    console.log(`Optional fields: ${dbOptionalFields.join(', ')}`);
    
    // Step 2: Get today's racecards from the PRO API
    console.log('\n📊 Step 2: Fetching today\'s PRO racecards');
    const proRacecardResponse = await fetchFromRacingAPI('racecards/pro', {
      date: new Date().toISOString().split('T')[0]  // Today in YYYY-MM-DD format
    });
    
    // Save response for reference
    fs.writeFileSync(
      path.join(resultsDir, 'field-mapping-racecards.json'),
      JSON.stringify(proRacecardResponse.data, null, 2)
    );
    
    console.log(`✅ Found ${proRacecardResponse.data.racecards?.length || 0} racecards`);
    
    if (!proRacecardResponse.data.racecards || proRacecardResponse.data.racecards.length === 0) {
      throw new Error('No racecards found to test with');
    }
    
    // Step 3: Find a race with runners to test against
    console.log('\n🔍 Step 3: Finding a race with runners');
    
    let testRace = null;
    let testHorse = null;
    
    // Find first race with runners
    for (const race of proRacecardResponse.data.racecards) {
      if (race.runners && race.runners.length > 0) {
        testRace = race;
        testHorse = race.runners[0];
        break;
      }
    }
    
    if (!testRace || !testHorse) {
      throw new Error('Could not find a race with runners to test with');
    }
    
    console.log(`✅ Selected race: ${testRace.race_name} at ${testRace.course}`);
    console.log(`✅ Selected horse: ${testHorse.horse}`);
    
    // Save test data for reference
    fs.writeFileSync(
      path.join(resultsDir, 'field-mapping-test-race.json'),
      JSON.stringify(testRace, null, 2)
    );
    
    fs.writeFileSync(
      path.join(resultsDir, 'field-mapping-test-horse.json'),
      JSON.stringify(testHorse, null, 2)
    );
    
    // Step 4: Create database record mapping
    console.log('\n🗄️ Step 4: Creating database record mapping');
    
    const dbRecord = {
      // Required fields
      track_name: testRace.course,
      race_date: new Date().toISOString().split('T')[0], // today
      horse_name: testHorse.horse,
      
      // Optional fields
      race_number: extractRaceNumber(testRace.race_name),
      scheduled_race_time: testRace.off_time,
      race_location: testRace.course,
      post_position: testHorse.number,
      jockey: testHorse.jockey,
      trainer: testHorse.trainer,
      best_odds: calculateBestOdds(testHorse.odds),
      class_type: testRace.race_class,
      purse: testRace.prize,
      distance: testRace.distance_f || testRace.distance,
      surface: extractSurface(testRace),
      going: testRace.going
    };
    
    // Save database record
    fs.writeFileSync(
      path.join(resultsDir, 'field-mapping-db-record.json'),
      JSON.stringify(dbRecord, null, 2)
    );
    
    // Step 5: Check field mapping completeness
    console.log('\n✅ Step 5: Checking field mapping completeness');
    
    // Check required fields first
    const missingRequiredFields = [];
    dbRequiredFields.forEach(field => {
      if (!dbRecord[field] || dbRecord[field] === null || dbRecord[field] === '') {
        missingRequiredFields.push(field);
      }
    });
    
    if (missingRequiredFields.length > 0) {
      console.log(`❌ Missing required fields: ${missingRequiredFields.join(', ')}`);
    } else {
      console.log('✅ All required fields are mapped correctly');
    }
    
    // Check optional fields
    const missingOptionalFields = [];
    const mappedOptionalFields = [];
    
    dbOptionalFields.forEach(field => {
      if (!dbRecord[field] || dbRecord[field] === null || dbRecord[field] === '') {
        missingOptionalFields.push(field);
      } else {
        mappedOptionalFields.push(field);
      }
    });
    
    console.log(`✅ Mapped optional fields: ${mappedOptionalFields.join(', ')}`);
    
    if (missingOptionalFields.length > 0) {
      console.log(`⚠️ Missing optional fields: ${missingOptionalFields.join(', ')}`);
    } else {
      console.log('✅ All optional fields are mapped correctly');
    }
    
    // Print database record
    console.log('\n📊 Final Database Record:');
    console.table(dbRecord);
    
    console.log('\n✅ FIELD MAPPING TEST COMPLETED ✅');
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
testFieldMapping(); 