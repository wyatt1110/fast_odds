const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Simple test script to verify our API integration
 * This script tests our local racing-api endpoint to ensure it's correctly
 * communicating with TheRacingAPI
 */
async function testApiIntegration() {
  try {
    console.log('🧪 TESTING API INTEGRATION 🧪');
    
    // Base URL for our local API
    // Use localhost for testing - change this to match your local development server
    const API_BASE_URL = 'http://localhost:3000';
    
    // Test 1: Basic connection with 'today'
    console.log('\n🔍 Test 1: Basic racecards fetch with "today" parameter');
    
    const today = await axios.get(`${API_BASE_URL}/api/racing-api`, {
      params: {
        endpoint: '/racecards/standard',
        date: 'today'
      }
    });
    
    console.log(`✅ Test 1 successful! Status: ${today.status}`);
    console.log(`Found ${today.data.racecards?.length || 0} racecards`);
    
    if (today.data.racecards?.length > 0) {
      console.log(`Example track: ${today.data.racecards[0].course}`);
    }
    
    // Test 2: Using an ISO date format for today
    const isoDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    console.log(`\n🔍 Test 2: Using ISO date format (${isoDate})`);
    
    const isoDateResponse = await axios.get(`${API_BASE_URL}/api/racing-api`, {
      params: {
        endpoint: '/racecards/standard',
        date: isoDate
      }
    });
    
    console.log(`✅ Test 2 successful! Status: ${isoDateResponse.status}`);
    console.log(`Found ${isoDateResponse.data.racecards?.length || 0} racecards`);
    
    // Test 3: Test with a specific track (if available)
    if (today.data.racecards?.length > 0) {
      const exampleTrack = today.data.racecards[0].course;
      console.log(`\n🔍 Test 3: Filtering by track (${exampleTrack})`);
      
      const trackResponse = await axios.get(`${API_BASE_URL}/api/racing-api`, {
        params: {
          endpoint: '/racecards/standard',
          date: 'today',
          course_ids: today.data.racecards[0].course_id
        }
      });
      
      console.log(`✅ Test 3 successful! Status: ${trackResponse.status}`);
      console.log(`Found ${trackResponse.data.racecards?.length || 0} racecards for ${exampleTrack}`);
    }
    
    // Test 4: Check error handling with invalid date
    console.log('\n🔍 Test 4: Testing error handling with invalid date (2025-01-01)');
    
    try {
      await axios.get(`${API_BASE_URL}/api/racing-api`, {
        params: {
          endpoint: '/racecards/standard',
          date: '2025-01-01'
        }
      });
      
      console.log('❌ Test 4 failed! Expected an error but received success response');
    } catch (error) {
      console.log('✅ Test 4 successful! Received expected error:');
      if (error.response) {
        console.log(`Status: ${error.response.status}`);
        console.log(`Error message: ${error.response.data.error || 'No error message'}`);
      } else {
        console.log(`Error: ${error.message}`);
      }
    }
    
    // Save results and output for inspection
    console.log('\n💾 Saving test results to file...');
    
    // Create a more comprehensive test that mimics the actual horse verification flow
    console.log('\n🔍 Test 5: Full horse verification flow');
    
    // Get today's date in ISO format
    const today_iso = new Date().toISOString().split('T')[0];
    
    // First, get all racecards for today
    const racecards = await axios.get(`${API_BASE_URL}/api/racing-api`, {
      params: {
        endpoint: '/racecards/standard',
        date: 'today'
      }
    });
    
    if (!racecards.data.racecards?.length) {
      console.log('❌ No racecards found for today, skipping test 5');
    } else {
      // Pick the first race and a horse from it
      const race = racecards.data.racecards[0];
      const horse = race.horses?.[0] || race.runners?.[0];
      
      if (!horse) {
        console.log('❌ No horses found in first race, skipping test 5');
      } else {
        console.log(`Selected ${race.course}, race: ${race.race_name}, horse: ${horse.horse}`);
        
        // Now try to verify this horse through our API
        console.log('Calling verify-horse API...');
        
        const verifyResponse = await axios.post(`${API_BASE_URL}/api/verify-horse`, {
          horse_name: horse.horse,
          track_name: race.course,
          race_date: today_iso,
          race_number: race.race_name.match(/Race (\d+)/)?.[1] || '',
          manual_entry: false
        });
        
        console.log(`✅ Test 5 Response Status: ${verifyResponse.status}`);
        console.log(`Verification result: ${verifyResponse.data.verified ? 'SUCCESS' : 'FAILED'}`);
        
        if (verifyResponse.data.errorMessage) {
          console.log(`Error message: ${verifyResponse.data.errorMessage}`);
        }
        
        if (verifyResponse.data.verificationDetails) {
          console.log(`Details: ${verifyResponse.data.verificationDetails}`);
        }
      }
    }
    
    console.log('\n✅ API integration tests completed!');
    
  } catch (error) {
    console.error('❌ ERROR IN TEST:', error);
    
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testApiIntegration().catch(console.error); 