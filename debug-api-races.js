#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// API credentials (same as in populate-master-results.js)
const USERNAME = 'KQ9W7rQeAHWMUgxH93ie3yEc';
const PASSWORD = 'T5BoPivL3Q2h6RhCdLv4EwZu';

// Get yesterday's date in YYYY-MM-DD format
const getYesterdayDate = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

// Make API request to get racing results
const fetchRacingResults = (date) => {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://api.theracingapi.com/v1/results?start_date=${date}&end_date=${date}`;
    const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

    const options = {
      headers: {
        'Authorization': `Basic ${auth}`,
        'User-Agent': 'Node.js/Debug-Races-Fetcher'
      }
    };

    console.log(`🔍 Fetching results from API for ${date}...`);
    console.log(`🌐 API URL: ${apiUrl}`);

    const req = https.get(apiUrl, options, (res) => {
      console.log(`📡 Response status: ${res.statusCode}`);
      console.log(`📡 Response headers:`, res.headers);
      
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          console.log(`📊 Raw response size: ${data.length} characters`);
          
          // Save response to file for debugging
          const filename = `debug-api-response-${date}.json`;
          fs.writeFileSync(filename, data);
          console.log(`💾 Saved response to ${filename}`);
          
          const jsonData = JSON.parse(data);
          resolve(jsonData);
        } catch (error) {
          console.error('❌ Error parsing API response:', error.message);
          console.error('Raw response (first 1000 chars):', data.substring(0, 1000));
          reject(error);
        }
      });

    });

    req.on('error', (error) => {
      console.error('❌ Error making API request:', error.message);
      reject(error);
    });

    req.setTimeout(30000, () => {
      console.error('❌ Request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

// Analyze the API response
const analyzeResults = (results) => {
  console.log('\n🔍 DETAILED API RESPONSE ANALYSIS');
  console.log('=====================================');
  
  console.log(`📊 Top-level properties:`, Object.keys(results));
  console.log(`📊 Total property: ${results.total}`);
  console.log(`📊 Results array length: ${results.results?.length || 0}`);
  
  if (results.results && results.results.length > 0) {
    console.log('\n📋 RACE BREAKDOWN:');
    console.log('==================');
    
    const racesByCountry = {};
    const racesByCourse = {};
    const racesWithRunners = [];
    
    results.results.forEach((race, index) => {
      // Count by country/region
      const region = race.region || 'Unknown';
      racesByCountry[region] = (racesByCountry[region] || 0) + 1;
      
      // Count by course
      const course = race.course || 'Unknown';
      racesByCourse[course] = (racesByCourse[course] || 0) + 1;
      
      // Track races with runners
      const runnerCount = race.runners?.length || 0;
      racesWithRunners.push({
        index: index + 1,
        race_id: race.race_id,
        race_name: race.race_name,
        course: race.course,
        region: race.region,
        date: race.date,
        time: race.time,
        runners: runnerCount
      });
      
      console.log(`${index + 1}. ${race.race_name} at ${race.course} (${race.region}) - ${runnerCount} runners`);
    });
    
    console.log('\n📊 SUMMARY STATISTICS:');
    console.log('======================');
    console.log(`Total races found: ${results.results.length}`);
    console.log(`Races by country:`, racesByCountry);
    console.log(`Total unique courses: ${Object.keys(racesByCourse).length}`);
    
    const totalRunners = racesWithRunners.reduce((sum, race) => sum + race.runners, 0);
    console.log(`Total runners across all races: ${totalRunners}`);
    console.log(`Average runners per race: ${(totalRunners / results.results.length).toFixed(1)}`);
    
    // Show races with most/least runners
    const sortedByRunners = [...racesWithRunners].sort((a, b) => b.runners - a.runners);
    console.log(`\n🏆 Race with most runners: ${sortedByRunners[0].race_name} at ${sortedByRunners[0].course} (${sortedByRunners[0].runners} runners)`);
    console.log(`🏃 Race with least runners: ${sortedByRunners[sortedByRunners.length - 1].race_name} at ${sortedByRunners[sortedByRunners.length - 1].course} (${sortedByRunners[sortedByRunners.length - 1].runners} runners)`);
    
    // Check for any races with 0 runners (which might indicate data issues)
    const racesWithNoRunners = racesWithRunners.filter(race => race.runners === 0);
    if (racesWithNoRunners.length > 0) {
      console.log(`\n⚠️  WARNING: ${racesWithNoRunners.length} races have 0 runners:`);
      racesWithNoRunners.forEach(race => {
        console.log(`   - ${race.race_name} at ${race.course}`);
      });
    }
    
    // Save detailed analysis to file
    const analysisData = {
      summary: {
        total_races: results.results.length,
        total_runners: totalRunners,
        average_runners_per_race: totalRunners / results.results.length,
        races_by_country: racesByCountry,
        unique_courses: Object.keys(racesByCourse).length
      },
      races: racesWithRunners
    };
    
    const analysisFilename = `debug-race-analysis-${getYesterdayDate()}.json`;
    fs.writeFileSync(analysisFilename, JSON.stringify(analysisData, null, 2));
    console.log(`\n💾 Saved detailed analysis to ${analysisFilename}`);
    
  } else {
    console.log('❌ No races found in API response');
  }
};

// Main execution
const main = async () => {
  try {
    console.log('🚀 Starting API Race Diagnostic Script');
    
    const targetDate = getYesterdayDate();
    console.log(`📅 Target date: ${targetDate}`);
    
    // Fetch results from API
    const results = await fetchRacingResults(targetDate);
    
    // Analyze the results
    analyzeResults(results);
    
    console.log('\n✅ Diagnostic completed successfully!');
    
  } catch (error) {
    console.error('💥 Diagnostic failed:', error.message);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
} 