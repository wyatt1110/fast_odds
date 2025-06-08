const https = require('https');
const fs = require('fs');

// API credentials
const username = 'KQ9W7rQeAHWMUgxH93ie3yEc';
const password = 'T5BoPivL3Q2h6RhCdLv4EwZu';

// API endpoint
const apiUrl = 'https://api.theracingapi.com/v1/courses';

// Output file path
const outputFilePath = './uk-track-codes-list.json';

// Create authorization header
const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

// Configure API request options
const options = {
  headers: {
    'Authorization': authHeader
  }
};

console.log('Fetching track codes from theracingapi.com...');

// Make the API request
const req = https.get(apiUrl, options, (res) => {
  let data = '';

  // A chunk of data has been received
  res.on('data', (chunk) => {
    data += chunk;
  });

  // The whole response has been received
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error(`API request failed with status code ${res.statusCode}`);
      console.error(data);
      process.exit(1);
    }

    try {
      // Parse the JSON response
      const responseData = JSON.parse(data);
      
      // Write the data to file
      fs.writeFileSync(outputFilePath, JSON.stringify(responseData, null, 2));
      
      console.log(`Successfully fetched ${responseData.length || 0} track codes.`);
      console.log(`Track codes saved to ${outputFilePath}`);
    } catch (error) {
      console.error('Error processing API response:', error.message);
      process.exit(1);
    }
  });
});

// Handle request errors
req.on('error', (error) => {
  console.error('Error making API request:', error.message);
  process.exit(1);
});

req.end(); 