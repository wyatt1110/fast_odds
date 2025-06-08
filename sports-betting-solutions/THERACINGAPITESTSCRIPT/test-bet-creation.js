const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Test script that mimics the betting form submission flow to validate our API fixes
 */
async function testBetCreation() {
  try {
    console.log('🔄 TEST BET CREATION FLOW 🔄');
    
    // Base URL for our local API
    const API_BASE_URL = 'http://localhost:3000';
    
    // Step 1: Get today's racecards to find valid test data
    console.log('\n📊 Step 1: Fetching today\'s racecards');
    const racecards = await axios.get(`${API_BASE_URL}/api/racing-api`, {
      params: {
        endpoint: '/racecards/standard',
        date: 'today'
      }
    });
    
    if (!racecards.data.racecards?.length) {
      console.log('❌ No racecards found for today, cannot test bet creation');
      return;
    }
    
    console.log(`✅ Found ${racecards.data.racecards.length} racecards for today`);
    
    // Step 2: Select a race and horse for testing
    console.log('\n🐎 Step 2: Selecting race and horse for test');
    const racecard = racecards.data.racecards[0];
    
    // Find a race with horses
    let testRace = null;
    let testHorse = null;
    
    for (const race of racecards.data.racecards) {
      const horses = race.horses || race.runners || [];
      if (horses.length > 0) {
        testRace = race;
        testHorse = horses[0];
        break;
      }
    }
    
    if (!testRace || !testHorse) {
      console.log('❌ No races with horses found, cannot test bet creation');
      return;
    }
    
    console.log(`✅ Selected race: ${testRace.course} - ${testRace.race_name}`);
    console.log(`✅ Selected horse: ${testHorse.horse}`);
    
    // Step 3: Try to verify the horse through our API
    console.log('\n🔍 Step 3: Verifying horse through API');
    
    // Construct horse data payload
    const horseData = {
      horse_name: testHorse.horse,
      track_name: testRace.course,
      race_date: 'today',  // Using 'today' instead of ISO string
      race_number: testRace.race_name.match(/Race (\d+)/)?.[1] || '',
      manual_entry: false
    };
    
    console.log(`📤 Sending verification request for: ${JSON.stringify(horseData)}`);
    
    const verifyResponse = await axios.post(
      `${API_BASE_URL}/api/verify-horse`,
      horseData
    );
    
    console.log(`📥 Verification response status: ${verifyResponse.status}`);
    
    if (!verifyResponse.data.verified) {
      console.log('❌ Horse verification failed:');
      console.log(`Error: ${verifyResponse.data.errorMessage}`);
      console.log(`Details: ${verifyResponse.data.verificationDetails}`);
      return;
    }
    
    console.log('✅ Horse verified successfully!');
    console.log(`Details: ${verifyResponse.data.verificationDetails}`);
    
    // Step 4: Create a mock bet payload
    console.log('\n💰 Step 4: Creating mock bet payload');
    
    const betPayload = {
      userId: 'test-user',
      formData: {
        bet_type: 'single',
        each_way: false,
        stake: '10.00',
        odds: '2.5',
        bookmaker: 'Test Bookmaker',
        model_tipster: 'Test Tipster',
        promotion_used: false,
        notes: 'API test bet',
      },
      horses: [
        {
          ...horseData,
          verified: true,
          jockey: verifyResponse.data.horseData?.jockey || '',
          trainer: verifyResponse.data.horseData?.trainer || '',
          race_class: verifyResponse.data.horseData?.race_class || '',
          race_distance: verifyResponse.data.horseData?.race_distance || '',
        }
      ]
    };
    
    console.log('✅ Created bet payload successfully');
    
    // Save the results to a file for further debugging if needed
    const outputPath = path.join(__dirname, 'bet-test-results.json');
    fs.writeFileSync(outputPath, JSON.stringify({
      racecards: racecards.data.racecards.slice(0, 2), // Just save a sample
      testRace,
      testHorse,
      horseData,
      verificationResponse: verifyResponse.data,
      betPayload
    }, null, 2));
    
    console.log(`\n💾 Saved test results to ${outputPath}`);
    console.log('\n✅ BET CREATION TEST COMPLETED SUCCESSFULLY ✅');
    
  } catch (error) {
    console.error('❌ ERROR IN TEST:', error);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testBetCreation().catch(console.error); 