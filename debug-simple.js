const https = require('https');

const USERNAME = 'KQ9W7rQeAHWMUgxH93ie3yEc';
const PASSWORD = 'T5BoPivL3Q2h6RhCdLv4EwZu';

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const date = yesterday.toISOString().split('T')[0];

const url = `https://api.theracingapi.com/v1/results?start_date=${date}&end_date=${date}`;
const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

console.log('=== INDEPENDENT API TEST ===');
console.log('Testing API for date:', date);
console.log('URL:', url);

const req = https.get(url, {
  headers: {
    'Authorization': `Basic ${auth}`,
    'User-Agent': 'Independent-Test'
  }
}, (res) => {
  console.log('Response status:', res.statusCode);
  
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response received, length:', data.length);
    
    try {
      const json = JSON.parse(data);
      console.log('=== API RESULTS ===');
      console.log('Total races found:', json.results?.length || 0);
      console.log('API total property:', json.total);
      console.log('Response keys:', Object.keys(json));
      
      if (json.results && json.results.length > 0) {
        console.log('=== SAMPLE RACES ===');
        json.results.slice(0, 5).forEach((race, i) => {
          console.log(`${i+1}. ${race.race_name} at ${race.course} (${race.region}) - ${race.runners?.length || 0} runners`);
        });
        
        console.log('=== REGION BREAKDOWN ===');
        const regions = {};
        json.results.forEach(race => {
          const region = race.region || 'Unknown';
          regions[region] = (regions[region] || 0) + 1;
        });
        Object.entries(regions).forEach(([region, count]) => {
          console.log(`${region}: ${count} races`);
        });
        
        console.log('=== SUMMARY ===');
        const totalRunners = json.results.reduce((sum, race) => sum + (race.runners?.length || 0), 0);
        console.log(`Total runners across all races: ${totalRunners}`);
        console.log(`Average runners per race: ${(totalRunners / json.results.length).toFixed(1)}`);
      } else {
        console.log('No races found in response');
      }
      
    } catch (e) {
      console.error('JSON parse error:', e.message);
      console.log('Raw response preview:', data.substring(0, 500));
    }
  });
});

req.on('error', err => {
  console.error('Request error:', err.message);
});

req.setTimeout(30000, () => {
  console.error('Request timeout');
  req.destroy();
});

console.log('API request sent, waiting for response...'); 