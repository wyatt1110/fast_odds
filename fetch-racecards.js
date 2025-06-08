#!/usr/bin/env node

const https = require('https');
const fs = require('fs');

// API credentials
const USERNAME = 'KQ9W7rQeAHWMUgxH93ie3yEc';
const PASSWORD = 'T5BoPivL3Q2h6RhCdLv4EwZu';

// Get today's date in YYYY-MM-DD format
const today = new Date();
const dateString = today.toISOString().split('T')[0];

console.log(`Fetching racecards for ${dateString}...`);

// Create the API URL
const apiUrl = `https://api.theracingapi.com/v1/racecards/pro?date=${dateString}`;

// Create basic auth header
const auth = Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64');

const options = {
  headers: {
    'Authorization': `Basic ${auth}`,
    'User-Agent': 'Node.js/Racecards-Fetcher'
  }
};

// Make the API request
https.get(apiUrl, options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      
      // Group races by course to create meetings
      const racesByMeeting = {};
      
      if (jsonData.racecards && Array.isArray(jsonData.racecards)) {
        jsonData.racecards.forEach(race => {
          const courseKey = `${race.course}_${race.course_id}`;
          
          if (!racesByMeeting[courseKey]) {
            racesByMeeting[courseKey] = {
              course: race.course,
              course_id: race.course_id,
              date: race.date,
              region: race.region,
              races: []
            };
          }
          
          racesByMeeting[courseKey].races.push(race);
        });
      }
      
      // Convert to array and sort by first race time
      const meetings = Object.values(racesByMeeting).map(meeting => {
        // Sort races by off_time
        meeting.races.sort((a, b) => {
          const timeA = a.off_time || '00:00';
          const timeB = b.off_time || '00:00';
          return timeA.localeCompare(timeB);
        });
        
        // Calculate meeting summary
        const totalPrize = meeting.races.reduce((sum, race) => {
          const prizeValue = race.prize ? parseInt(race.prize.replace(/[£,]/g, '')) || 0 : 0;
          return sum + prizeValue;
        }, 0);
        
        const totalRunners = meeting.races.reduce((sum, race) => {
          return sum + (race.runners ? race.runners.length : 0);
        }, 0);
        
        const firstRaceTime = meeting.races[0]?.off_time || 'TBC';
        
        return {
          ...meeting,
          summary: {
            total_races: meeting.races.length,
            total_prize_money: `£${totalPrize.toLocaleString()}`,
            total_runners: totalRunners,
            first_race_time: firstRaceTime
          }
        };
      });
      
      // Sort meetings by first race time
      meetings.sort((a, b) => {
        const timeA = a.summary.first_race_time || '00:00';
        const timeB = b.summary.first_race_time || '00:00';
        return timeA.localeCompare(timeB);
      });
      
      // Format the data similar to the Kempton results structure
      const formattedData = {
        date: dateString,
        meetings: meetings,
        total_meetings: meetings.length,
        total_races: jsonData.racecards ? jsonData.racecards.length : 0,
        fetched_at: new Date().toISOString()
      };

      // Write to JSON file
      const filename = `racecards-${dateString}.json`;
      fs.writeFileSync(filename, JSON.stringify(formattedData, null, 2));
      
      console.log(`✅ Successfully saved racecards to ${filename}`);
      console.log(`📊 Total meetings: ${formattedData.total_meetings}`);
      console.log(`🏁 Total races: ${formattedData.total_races}`);
      
      if (formattedData.meetings.length > 0) {
        console.log(`📍 Meetings today:`);
        formattedData.meetings.forEach((meeting, index) => {
          console.log(`   ${index + 1}. ${meeting.course} (${meeting.region}) - ${meeting.summary.total_races} races, ${meeting.summary.total_prize_money}, ${meeting.summary.total_runners} runners, starts ${meeting.summary.first_race_time}`);
        });
      }
      
    } catch (error) {
      console.error('❌ Error parsing JSON response:', error.message);
      console.log('Raw response:', data.substring(0, 500) + '...');
    }
  });

}).on('error', (error) => {
  console.error('❌ Error making API request:', error.message);
}); 