// Test script to debug TheRacingAPI horse matching issues
require('dotenv').config({ path: '../.env' });
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// API credentials
const RACING_API_USERNAME = process.env.RACING_API_USERNAME || 'KQ9W7rQeAHWMUgxH93ie3yEc';
const RACING_API_PASSWORD = process.env.RACING_API_PASSWORD || 'T5BoPivL3Q2h6RhCdLv4EwZu';

// Target track and horse to test
const TARGET_TRACK = 'Chelmsford'; // Try with both "Chelmsford" and "Chelmsford City"
const ALTERNATE_TRACK_NAMES = ['Chelmsford', 'Chelmsford City', 'Chelmsford (AW)'];
const TARGET_HORSES = ['Asmund', 'Juddmonte Blue', 'Green Team']; // Try multiple horses to test

// Results directory
const RESULTS_DIR = path.join(__dirname, 'results');
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Helper function to save results
function saveResults(filename, data) {
  const filePath = path.join(RESULTS_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Results saved to ${filePath}`);
}

// Levenshtein distance for string similarity
function levenshteinDistance(a, b) {
  const m = a.length;
  const n = b.length;
  
  // Create matrix
  const d = Array(m + 1).fill().map(() => Array(n + 1).fill(0));
  
  // Initialize first row and column
  for (let i = 0; i <= m; i++) d[i][0] = i;
  for (let j = 0; j <= n; j++) d[0][j] = j;
  
  // Fill matrix
  for (let j = 1; j <= n; j++) {
    for (let i = 1; i <= m; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i-1][j] + 1,      // deletion
        d[i][j-1] + 1,      // insertion
        d[i-1][j-1] + cost  // substitution
      );
    }
  }
  
  return d[m][n];
}

// Calculate similarity score (0-1)
function calculateSimilarity(a, b) {
  if (!a || !b) return 0;
  a = a.toLowerCase();
  b = b.toLowerCase();
  if (a === b) return 1.0;
  const maxLength = Math.max(a.length, b.length);
  if (maxLength === 0) return 1.0;
  return 1.0 - (levenshteinDistance(a, b) / maxLength);
}

// Fetch racecards from TheRacingAPI
async function fetchRacecards() {
  try {
    console.log('Fetching racecards from TheRacingAPI...');
    
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];
    
    // Make the API request
    const response = await axios.get('https://api.theracingapi.com/v1/racecards/pro', {
      params: {
        date: todayFormatted
      },
      auth: {
        username: RACING_API_USERNAME,
        password: RACING_API_PASSWORD
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching racecards:', error.message);
    if (error.response) {
      console.error('API response error:', error.response.status, error.response.data);
    }
    throw error;
  }
}

// Main function
async function testHorseMatching() {
  try {
    // Fetch all racecards
    const allRacecardsData = await fetchRacecards();
    const racecards = allRacecardsData.racecards || [];
    
    // Save all racecards for reference
    saveResults('all-racecards.json', racecards);
    
    console.log(`\nFetched ${racecards.length} racecards`);
    
    // List all available tracks
    const allTracks = [...new Set(racecards.map(card => card.course))];
    console.log('\nAVAILABLE TRACKS:');
    console.log(allTracks.join(', '));
    
    // Try to find our target track
    console.log(`\nSEARCHING FOR TRACK: ${TARGET_TRACK}`);
    
    // Try each alternate track name
    let targetTrackFound = false;
    let trackRacecards = [];
    
    for (const trackName of ALTERNATE_TRACK_NAMES) {
      // First check for exact matches
      const exactMatches = racecards.filter(card => 
        card.course.toLowerCase() === trackName.toLowerCase()
      );
      
      if (exactMatches.length > 0) {
        console.log(`✅ Found ${exactMatches.length} racecards with exact match for "${trackName}"`);
        trackRacecards = exactMatches;
        targetTrackFound = true;
        break;
      }
      
      // Then check for partial matches
      const partialMatches = racecards.filter(card => {
        const similarity = calculateSimilarity(card.course, trackName);
        return similarity >= 0.7; // Using 0.7 as threshold
      });
      
      if (partialMatches.length > 0) {
        console.log(`✅ Found ${partialMatches.length} racecards with partial match for "${trackName}"`);
        
        // Log each match and similarity score
        partialMatches.forEach(card => {
          const similarity = calculateSimilarity(card.course, trackName);
          console.log(`- ${card.course} (score: ${similarity.toFixed(2)})`);
        });
        
        trackRacecards = partialMatches;
        targetTrackFound = true;
        break;
      }
    }
    
    if (!targetTrackFound) {
      console.log(`❌ Track "${TARGET_TRACK}" not found in any racecards`);
      
      // Find the most similar tracks
      const trackSimilarities = allTracks.map(track => ({
        track,
        score: ALTERNATE_TRACK_NAMES.map(name => calculateSimilarity(track, name))
          .reduce((max, score) => Math.max(max, score), 0)
      }));
      
      const sortedTracks = trackSimilarities
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      
      console.log('\nMOST SIMILAR TRACKS:');
      sortedTracks.forEach(item => {
        console.log(`- ${item.track} (similarity: ${item.score.toFixed(2)})`);
      });
      
      return;
    }
    
    // Save track racecards for reference
    saveResults('track-racecards.json', trackRacecards);
    
    // Now examine each race at the track
    console.log(`\nEXAMINING ${trackRacecards.length} RACES AT ${trackRacecards[0].course}`);
    
    trackRacecards.forEach((race, index) => {
      console.log(`\nRACE ${index + 1}: ${race.race_name} at ${race.off_time}`);
      
      // Check for horses property first, then runners
      const horses = race.runners || race.horses || [];
      
      if (horses.length === 0) {
        console.log(`❌ No horses found in this race`);
        return;
      }
      
      console.log(`Found ${horses.length} horses in race:`);
      
      // Print all horses in this race
      horses.forEach(horse => {
        console.log(`- ${horse.horse} (Jockey: ${horse.jockey})`);
      });
      
      // Try to find our target horses
      for (const targetHorse of TARGET_HORSES) {
        console.log(`\nSEARCHING FOR HORSE: ${targetHorse}`);
        
        // Exact match first
        const exactMatch = horses.find(h => h.horse.toLowerCase() === targetHorse.toLowerCase());
        
        if (exactMatch) {
          console.log(`✅ EXACT MATCH: ${exactMatch.horse}`);
          continue;
        }
        
        // Then try fuzzy matching with different thresholds
        const thresholds = [0.9, 0.8, 0.7, 0.6, 0.5];
        let foundWithThreshold = false;
        
        for (const threshold of thresholds) {
          const matches = horses
            .map(h => ({ 
              horse: h, 
              score: calculateSimilarity(h.horse, targetHorse)
            }))
            .filter(result => result.score >= threshold)
            .sort((a, b) => b.score - a.score);
          
          if (matches.length > 0) {
            console.log(`✅ FOUND WITH THRESHOLD ${threshold}:`);
            matches.forEach(match => {
              console.log(`- ${match.horse.horse} (score: ${match.score.toFixed(2)})`);
            });
            foundWithThreshold = true;
            break;
          }
        }
        
        if (!foundWithThreshold) {
          console.log(`❌ No matches found for "${targetHorse}" at any threshold`);
          
          // Show the top 5 closest matches regardless of threshold
          const allMatches = horses
            .map(h => ({ 
              horse: h, 
              score: calculateSimilarity(h.horse, targetHorse)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 5);
          
          console.log('TOP 5 CLOSEST HORSES:');
          allMatches.forEach(match => {
            console.log(`- ${match.horse.horse} (score: ${match.score.toFixed(2)})`);
          });
        }
      }
    });
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testHorseMatching(); 