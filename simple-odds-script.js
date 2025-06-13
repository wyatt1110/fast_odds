#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// Fetch Bet365 odds directly
async function fetchOdds() {
  return new Promise((resolve) => {
    https.request({
      hostname: '116.202.109.99',
      path: '/v2/bet365/sports/horse-racing/races',
      headers: { 'x-rapidapi-proxy-secret': '84cc5f87-13fa-4333-b8ba-1b92674f41d7' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data);
          const count = jsonData.races?.reduce((total, race) => total + (race.horses?.length || 0), 0) || 0;
          console.log(`✅ Fetched ${count} odds entries`);
          resolve(count);
        } catch (e) {
          console.log(`❌ Parse error: ${e.message}`);
          resolve(0);
        }
      });
    }).on('error', () => resolve(0)).end();
  });
}

// Main loop
async function run() {
  console.log(`🎯 ${new Date().toLocaleString()} - Fetching odds...`);
  await fetchOdds();
  setTimeout(run, 30000); // Run every 30 seconds
}

run(); 