#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const https = require('https');

console.log('🚀 COMPLETE BETTING SIGNALS DETECTOR');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

function getUKTime() {
  return new Date().toLocaleString("en-GB", { timeZone: "Europe/London", hour12: false });
}

function isBettingHours() {
  const [hour] = new Date().toLocaleString("en-GB", { timeZone: "Europe/London", hour12: false, hour: "2-digit" }).split(":");
  const ukHour = parseInt(hour);
  return ukHour >= 7 && ukHour <= 21;
}

function parseLatestPercentage(historyText) {
  if (!historyText) return null;
  const entries = historyText.split(' / ');
  if (entries.length === 0) return null;
  const latest = entries[entries.length - 1];
  const [percentage] = latest.split('_');
  const parsed = parseFloat(percentage);
  return isNaN(parsed) ? null : parsed;
}

function parseLatestValue(historyText) {
  if (!historyText) return null;
  const entries = historyText.split(' / ');
  if (entries.length === 0) return null;
  const latest = entries[entries.length - 1];
  const [value] = latest.split('_');
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
}

async function fetchBet365Odds() {
  return new Promise((resolve) => {
    console.log('📡 Fetching Bet365 odds...');
    const req = https.request({
      hostname: '116.202.109.99',
      path: '/v2/bet365/sports/horse-racing/races',
      headers: { 'x-rapidapi-proxy-secret': '84cc5f87-13fa-4333-b8ba-1b92674f41d7' },
      timeout: 8000
    }, (res) => {
      console.log(`📊 API Response: ${res.statusCode} ${res.statusMessage}`);
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`📥 Received ${data.length} bytes of data`);
        if (res.statusCode !== 200) {
          console.log(`❌ Bad status: ${res.statusCode} - ${data.substring(0, 200)}`);
          resolve([]);
          return;
        }
        try {
          const json = JSON.parse(data);
          const odds = [];
          for (const race of json.races || []) {
            const raceName = race.league || 'Unknown';
            for (const horse of race.horses || []) {
              if (horse.na && horse.OD && horse.OD !== 'SP') {
                let decimalOdds = parseFloat(horse.OD);
                if (horse.OD.includes('/')) {
                  const [num, den] = horse.OD.split('/');
                  decimalOdds = (parseFloat(num) / parseFloat(den)) + 1;
                }
                if (!isNaN(decimalOdds)) {
                  odds.push({ horse: horse.na, race: raceName, odds: decimalOdds });
                }
              }
            }
          }
          console.log(`✅ Bet365: ${odds.length} horses`);
          resolve(odds);
        } catch (e) {
          console.log(`❌ Bet365 parse error: ${e.message}`);
          console.log(`📄 Raw data: ${data.substring(0, 500)}`);
          resolve([]);
        }
      });
    });
    req.on('error', (err) => {
      console.log(`❌ Request error: ${err.message} (${err.code})`);
      resolve([]);
    });
    req.on('timeout', () => { 
      console.log(`⏰ Request timeout after 8 seconds`);
      req.destroy(); 
      resolve([]); 
    });
    req.end();
  });
}

async function detectSignals() {
  const startTime = Date.now();
  console.log(`🎯 Starting signal detection at ${getUKTime()}`);
  
  if (!isBettingHours()) {
    console.log('🛌 Outside betting hours');
    return;
  }
  
  // Fetch odds
  const odds = await fetchBet365Odds();
  if (odds.length === 0) {
    console.log('❌ No odds data');
    return;
  }
  
  // Get database runners
  const today = new Date().toISOString().split('T')[0];
  const { data: runners, error } = await supabase
    .from('results')
    .select('id, horse_name, race_id, race_name, momentum_steaming_percentage_new, market_pressure_percentage_new, sharp_average_odds_new')
    .eq('race_date', today)
    .not('momentum_steaming_percentage_new', 'is', null)
    .not('market_pressure_percentage_new', 'is', null);
  
  if (error || !runners?.length) {
    console.log(`❌ No runners: ${error?.message || 'empty'}`);
    return;
  }
  
  console.log(`🐎 Analyzing ${runners.length} runners...`);
  
  let signals = 0;
  for (const runner of runners) {
    try {
      const momentum = parseLatestPercentage(runner.momentum_steaming_percentage_new);
      const pressure = parseLatestPercentage(runner.market_pressure_percentage_new);
      const sharpAvg = parseLatestValue(runner.sharp_average_odds_new);
      
      if (momentum > 20 && pressure > 30 && sharpAvg) {
        const horseOdds = odds.find(o => o.horse.toLowerCase() === runner.horse_name.toLowerCase());
        if (horseOdds && horseOdds.odds > sharpAvg * 1.08) {
          const premium = ((horseOdds.odds - sharpAvg) / sharpAvg) * 100;
          console.log(`🎯 SIGNAL: ${runner.horse_name} - ${horseOdds.odds} (+${premium.toFixed(1)}%)`);
          
          // Insert signal
          await supabase.from('betting_signals').insert({
            horse_id: runner.id,
            horse_name: runner.horse_name,
            race_id: runner.race_id,
            race_name: runner.race_name,
            bookmaker: 'bet365',
            odds: horseOdds.odds,
            sharp_premium_percentage: premium,
            momentum_steaming_percentage: momentum,
            market_pressure_percentage: pressure,
            sharp_average_odds: sharpAvg,
            fast_odds: true,
            created_at: new Date().toISOString()
          });
          signals++;
        }
      }
    } catch (e) {
      console.log(`❌ Error analyzing ${runner.horse_name}: ${e.message}`);
    }
  }
  
  const duration = Date.now() - startTime;
  console.log(`✅ Complete: ${signals} signals found in ${duration}ms`);
}

async function run() {
  try {
    await detectSignals();
  } catch (e) {
    console.log(`❌ Error: ${e.message}`);
  }
  setTimeout(run, 30000);
}

run(); 