const axios = require('axios');
const fs = require('fs');
const path = require('path');

// API Credentials
const RACING_API_BASE_URL = 'https://api.theracingapi.com/v1';
const RACING_API_USERNAME = 'KQ9W7rQeAHWMUgxH93ie3yEc';
const RACING_API_PASSWORD = 'T5BoPivL3Q2h6RhCdLv4EwZu';

/**
 * Test script for TheRacingAPI
 * Gets a variety of tracks and race information to understand the structure of the API response
 */
async function testRacingAPI() {
  try {
    console.log('---------------- TESTING RACING API ----------------');
    console.log('Attempting to fetch courses...');
    
    // STEP 1: Get all courses to check availability
    const coursesResponse = await axios.get(`${RACING_API_BASE_URL}/courses`, {
      auth: {
        username: RACING_API_USERNAME,
        password: RACING_API_PASSWORD
      }
    });
    
    console.log(`✅ Courses API successful (${coursesResponse.status})`);
    
    // Create a mapping of course names to IDs
    const courseMapping = {};
    if (coursesResponse.data && coursesResponse.data.courses) {
      const ukCourses = coursesResponse.data.courses.filter(course => 
        course.region_code === 'gb' || course.region_code === 'ie'
      );
      
      console.log(`\nFound ${ukCourses.length} UK/Irish courses:`);
      ukCourses.forEach(course => {
        console.log(`- ${course.course} (ID: ${course.id}, Region: ${course.region})`);
        courseMapping[course.course.toLowerCase()] = course.id;
      });
      
      // Save the track codes to a file for reference
      const outputPath = path.join(__dirname, 'track-codes-output.json');
      fs.writeFileSync(outputPath, JSON.stringify(courseMapping, null, 2));
      console.log(`\nSaved track codes to ${outputPath}`);
    }
    
    // STEP 2: Get racecards for "today"
    console.log('\n---------------- TESTING RACECARDS (TODAY) ----------------');
    const todayRacecardsResponse = await axios.get(`${RACING_API_BASE_URL}/racecards/standard`, {
      params: { day: 'today' },
      auth: {
        username: RACING_API_USERNAME,
        password: RACING_API_PASSWORD
      }
    });
    
    console.log(`✅ Today's Racecards API successful (${todayRacecardsResponse.status})`);
    console.log(`Found ${todayRacecardsResponse.data.racecards.length} racecards for today`);
    
    // Save the full response for analysis
    const todayOutputPath = path.join(__dirname, 'today-racecards-output.json');
    fs.writeFileSync(todayOutputPath, JSON.stringify(todayRacecardsResponse.data, null, 2));
    console.log(`Saved today's racecards to ${todayOutputPath}`);
    
    // Extract unique tracks running today
    const todayTracks = [...new Set(todayRacecardsResponse.data.racecards.map(race => race.course))];
    console.log(`\nTracks running today: ${todayTracks.join(', ')}`);
    
    // STEP 3: Try to get racecards for specific course (Newcastle if available)
    console.log('\n---------------- TESTING COURSE FILTERING ----------------');
    
    // Find Newcastle or use the first UK track as an example
    const exampleTrack = todayTracks.find(track => track.toLowerCase().includes('newcastle')) || todayTracks[0];
    
    // Create a more flexible way to find course IDs that handles AW tracks
    const findCourseId = (trackName) => {
      // Direct match
      if (courseMapping[trackName.toLowerCase()]) {
        return courseMapping[trackName.toLowerCase()];
      }
      
      // Try to match with course name containing our track name
      const courseKey = Object.keys(courseMapping).find(key => 
        key.toLowerCase().includes(trackName.toLowerCase().replace(' (aw)', '').replace('-aw', ''))
      );
      
      if (courseKey) {
        return courseMapping[courseKey];
      }
      
      return null;
    };
    
    // Find the course ID using the more flexible method
    const exampleTrackId = findCourseId(exampleTrack);
    
    console.log(`Testing course filter for ${exampleTrack} (ID: ${exampleTrackId || 'Unknown'})`);
    
    if (exampleTrackId) {
      const trackRacecardsResponse = await axios.get(`${RACING_API_BASE_URL}/racecards/standard`, {
        params: { 
          day: 'today',
          course_ids: exampleTrackId
        },
        auth: {
          username: RACING_API_USERNAME,
          password: RACING_API_PASSWORD
        }
      });
      
      console.log(`✅ ${exampleTrack} Racecards API successful (${trackRacecardsResponse.status})`);
      console.log(`Found ${trackRacecardsResponse.data.racecards.length} racecards for ${exampleTrack}`);
      
      // Save the example track response for analysis
      const trackOutputPath = path.join(__dirname, `${exampleTrack.toLowerCase().replace(/\s+/g, '-')}-racecards-output.json`);
      fs.writeFileSync(trackOutputPath, JSON.stringify(trackRacecardsResponse.data, null, 2));
      console.log(`Saved ${exampleTrack} racecards to ${trackOutputPath}`);
      
      // STEP 4: Examine the first race in detail to understand horse structure
      if (trackRacecardsResponse.data.racecards.length > 0) {
        const firstRace = trackRacecardsResponse.data.racecards[0];
        console.log(`\n---------------- EXAMINING RACE STRUCTURE ----------------`);
        console.log(`Race: ${firstRace.race_name}`);
        console.log(`Course: ${firstRace.course}`);
        console.log(`Date/Time: ${firstRace.date} ${firstRace.off_time}`);
        console.log(`Race ID: ${firstRace.race_id}`);
        
        // Check if horses property exists and what it contains
        console.log(`\nHorse data structure:`);
        if (firstRace.horses) {
          console.log(`Found ${firstRace.horses.length} horses in race`);
          if (firstRace.horses.length > 0) {
            console.log('First horse example:');
            console.log(JSON.stringify(firstRace.horses[0], null, 2));
          }
        } else if (firstRace.runners) {
          console.log(`Found ${firstRace.runners.length} runners in race`);
          if (firstRace.runners.length > 0) {
            console.log('First horse example:');
            console.log(JSON.stringify(firstRace.runners[0], null, 2));
          }
        } else {
          console.log('⚠️ No horses or runners property found in race!');
          console.log('Race object keys:', Object.keys(firstRace));
        }
      }
    } else {
      console.log(`⚠️ Could not find course ID for ${exampleTrack}`);
    }
    
    console.log('\n---------------- TEST COMPLETE ----------------');
  } catch (error) {
    console.error('Error testing Racing API:', error);
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('API Error Response:', error.response.status, error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
    }
  }
}

// Run the test
testRacingAPI(); 