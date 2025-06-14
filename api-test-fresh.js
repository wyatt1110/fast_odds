const https = require('https');

const USERNAME = 'KQ9W7rQeAHWMUgxH93ie3yEc';
const PASSWORD = 'T5BoPivL3Q2h6RhCdLv4EwZu';

const yesterday = new Date();
yesterday.setDate(yesterday.getDate() - 1);
const date = yesterday.toISOString().split('T')[0];

const url = `https://api.theracingapi.com/v1/results?start_date=${date}&end_date=${date}`;
const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

console.log('=== API TEST SCRIPT ===');
console.log('Date:', date);
console.log('URL:', url);

const req = https.get(url, {
  headers: {
    'Authorization': `Basic ${auth}`,
    'User-Agent': 'Node.js/Test'
  }
}, (res) => {
  console.log('Status:', res.statusCode);
  
  let data = '';
  res.on('data', chunk => {
    data += chunk;
    console.log('Received chunk:', chunk.length, 'bytes');
  });
  
  res.on('end', () => {
    console.log('Total response length:', data.length);
    
    try {
      const json = JSON.parse(data);
      console.log('=== RESULTS ===');
      console.log('Total races:', json.results?.length || 0);
      console.log('API total property:', json.total);
      console.log('Response keys:', Object.keys(json));
      
      if (json.results) {
        console.log('=== FIRST 5 RACES ===');
        json.results.slice(0, 5).forEach((race, i) => {
          console.log(`${i+1}. ${race.race_name} at ${race.course} (${race.region})`);
        });
        
        console.log('=== RACE COUNT BY REGION ===');
        const regions = {};
        json.results.forEach(race => {
          const region = race.region || 'Unknown';
          regions[region] = (regions[region] || 0) + 1;
        });
        Object.entries(regions).forEach(([region, count]) => {
          console.log(`${region}: ${count} races`);
        });
      }
      
      require('fs').writeFileSync(`test-results-${date}.json`, JSON.stringify(json, null, 2));
      console.log(`Saved to test-results-${date}.json`);
      
    } catch (e) {
      console.error('Parse error:', e.message);
      console.log('Raw data preview:', data.substring(0, 200));
    }
  });
});

req.on('error', err => {
  console.error('Request error:', err.message);
});

req.setTimeout(30000, () => {
  console.error('Timeout');
  req.destroy();
});

console.log('Request sent...'); 