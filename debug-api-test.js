#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
require('dotenv').config();

// API credentials
const USERNAME = 'KQ9W7rQeAHWMUgxH93ie3yEc';
const PASSWORD = 'T5BoPivL3Q2h6RhCdLv4EwZu';

// Get yesterday's date
const getYesterdayDate = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return yesterday.toISOString().split('T')[0];
};

const main = async () => {
  const date = getYesterdayDate();
  const apiUrl = `https://api.theracingapi.com/v1/results?start_date=${date}&end_date=${date}`;
  const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

  console.log(`🚀 API Debug Test for ${date}`);
  console.log(`🌐 URL: ${apiUrl}`);
  console.log(`🔑 Auth: ${auth.substring(0, 20)}...`);

  return new Promise((resolve, reject) => {
    const req = https.get(apiUrl, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'User-Agent': 'Node.js/API-Debug-Test'
      }
    }, (res) => {
      console.log(`📡 Status: ${res.statusCode}`);
      console.log(`📡 Headers:`, JSON.stringify(res.headers, null, 2));
      
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
        console.log(`📊 Received chunk: ${chunk.length} bytes`);
      });

      res.on('end', () => {
        console.log(`📊 Total response size: ${data.length} characters`);
        
        try {
          // Save raw response first
          const rawFilename = `raw-api-response-${date}.json`;
          fs.writeFileSync(rawFilename, data);
          console.log(`💾 Saved raw response to: ${rawFilename}`);
          
          // Parse and analyze
          const jsonData = JSON.parse(data);
          console.log(`\n🔍 ANALYSIS:`);
          console.log(`📊 Response keys: ${Object.keys(jsonData)}`);
          console.log(`📊 Total property: ${jsonData.total}`);
          console.log(`📊 Results array length: ${jsonData.results?.length || 0}`);
          
          if (jsonData.results && jsonData.results.length > 0) {
            console.log(`\n📋 FIRST 5 RACES:`);
            jsonData.results.slice(0, 5).forEach((race, i) => {
              console.log(`${i+1}. ${race.race_name} at ${race.course} (${race.region})`);
              console.log(`   - Race ID: ${race.race_id}`);
              console.log(`   - Date: ${race.date}, Time: ${race.time}`);
              console.log(`   - Runners: ${race.runners?.length || 0}`);
            });
            
            // Count by region
            const regionCounts = {};
            jsonData.results.forEach(race => {
              const region = race.region || 'Unknown';
              regionCounts[region] = (regionCounts[region] || 0) + 1;
            });
            
            console.log(`\n📊 RACES BY REGION:`);
            Object.entries(regionCounts).forEach(([region, count]) => {
              console.log(`   ${region}: ${count} races`);
            });
          }
          
          // Save formatted response
          const formattedFilename = `formatted-api-response-${date}.json`;
          fs.writeFileSync(formattedFilename, JSON.stringify(jsonData, null, 2));
          console.log(`💾 Saved formatted response to: ${formattedFilename}`);
          
          resolve(jsonData);
          
        } catch (error) {
          console.error('❌ Parse error:', error.message);
          console.log('Raw response preview:', data.substring(0, 1000));
          
          // Save error response for debugging
          const errorFilename = `error-api-response-${date}.txt`;
          fs.writeFileSync(errorFilename, data);
          console.log(`💾 Saved error response to: ${errorFilename}`);
          
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('❌ Request error:', error.message);
      reject(error);
    });

    req.setTimeout(30000, () => {
      console.error('❌ Request timeout');
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
};

// Run the test
main()
  .then(() => {
    console.log('\n✅ API test completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 API test failed:', error.message);
    process.exit(1);
  }); 