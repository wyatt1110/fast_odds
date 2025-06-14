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

// Make API request to get racing results (copied from original script)
const fetchRacingResults = (date) => {
  return new Promise((resolve, reject) => {
    const apiUrl = `https://api.theracingapi.com/v1/results?start_date=${date}&end_date=${date}`;
    const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

    const options = {
      headers: {
        'Authorization': `Basic ${auth}`,
        'User-Agent': 'Node.js/Results-Fetcher'
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
          const debugFile = `debug-response-${date}.json`;
          fs.writeFileSync(debugFile, data);
          console.log(`💾 Saved response to ${debugFile}`);
          
          const jsonData = JSON.parse(data);
          console.log(`✅ Successfully fetched results from API`);
          console.log(`📊 Response structure: total=${jsonData.total}, results=${jsonData.results?.length || 0}`);
          console.log(`📅 Found ${jsonData.results?.length || 0} races for ${date}`);
          
          // DETAILED ANALYSIS
          console.log(`\n🔍 DETAILED API RESPONSE ANALYSIS:`);
          console.log(`📊 Top-level keys: ${Object.keys(jsonData)}`);
          console.log(`📊 Total property: ${jsonData.total}`);
          console.log(`📊 Results array length: ${jsonData.results?.length || 0}`);
          
          if (jsonData.results && jsonData.results.length > 0) {
            console.log(`\n📋 RACE BREAKDOWN BY REGION:`);
            const regionCounts = {};
            const courseCounts = {};
            let totalRunners = 0;
            
            jsonData.results.forEach((race, index) => {
              const region = race.region || 'Unknown';
              const course = race.course || 'Unknown';
              const runnerCount = race.runners?.length || 0;
              
              regionCounts[region] = (regionCounts[region] || 0) + 1;
              courseCounts[course] = (courseCounts[course] || 0) + 1;
              totalRunners += runnerCount;
              
              console.log(`${index + 1}. ${race.race_name} at ${race.course} (${race.region})`);
              console.log(`   - Race ID: ${race.race_id}`);
              console.log(`   - Date: ${race.date}, Time: ${race.time}`);
              console.log(`   - Runners: ${runnerCount}`);
            });
            
            console.log(`\n📊 SUMMARY STATISTICS:`);
            console.log(`Total races: ${jsonData.results.length}`);
            console.log(`Total runners: ${totalRunners}`);
            console.log(`Average runners per race: ${(totalRunners / jsonData.results.length).toFixed(1)}`);
            console.log(`Unique courses: ${Object.keys(courseCounts).length}`);
            
            console.log(`\n📊 RACES BY REGION:`);
            Object.entries(regionCounts).forEach(([region, count]) => {
              console.log(`   ${region}: ${count} races`);
            });
            
            console.log(`\n📊 RACES BY COURSE (Top 10):`);
            const sortedCourses = Object.entries(courseCounts)
              .sort(([,a], [,b]) => b - a)
              .slice(0, 10);
            sortedCourses.forEach(([course, count]) => {
              console.log(`   ${course}: ${count} races`);
            });
            
            // Save detailed analysis
            const analysisData = {
              date: date,
              total_races: jsonData.results.length,
              total_runners: totalRunners,
              average_runners_per_race: totalRunners / jsonData.results.length,
              races_by_region: regionCounts,
              races_by_course: courseCounts,
              api_total_property: jsonData.total,
              races: jsonData.results.map(race => ({
                race_id: race.race_id,
                race_name: race.race_name,
                course: race.course,
                region: race.region,
                date: race.date,
                time: race.time,
                runner_count: race.runners?.length || 0
              }))
            };
            
            const analysisFile = `race-analysis-${date}.json`;
            fs.writeFileSync(analysisFile, JSON.stringify(analysisData, null, 2));
            console.log(`\n💾 Saved detailed analysis to ${analysisFile}`);
          }
          
          resolve(jsonData);
        } catch (error) {
          console.error('❌ Error parsing API response:', error.message);
          console.error('Raw response (first 500 chars):', data.substring(0, 500));
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

// Main execution
const main = async () => {
  try {
    console.log('🚀 Starting Race Count Debug Script');
    
    const targetDate = getYesterdayDate();
    console.log(`📅 Target date: ${targetDate}`);
    
    // Fetch results from API
    const results = await fetchRacingResults(targetDate);
    
    console.log('\n✅ Debug script completed successfully!');
    console.log(`📈 Final count: ${results.results?.length || 0} races found`);
    
  } catch (error) {
    console.error('💥 Debug script failed:', error.message);
    process.exit(1);
  }
};

// Run the script
if (require.main === module) {
  main();
} 