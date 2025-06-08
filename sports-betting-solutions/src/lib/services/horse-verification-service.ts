import { format } from 'date-fns';
import { racingAPIService, RacingAPIHorse, RacingAPIRunner } from './racing-api';
import axios from 'axios';

// Match the interface from the bet-entry-form component
interface HorseData {
  horse_name: string;
  track_name: string;
  race_number: string;
  race_date: string;
  jockey: string;
  trainer: string;
  jockey_name?: string;
  trainer_name?: string;
  race_class: string;
  race_distance: string;
  manual_entry: boolean;
  verified: boolean;
  scheduled_time?: string;
  post_position?: string;
  morning_line_odds?: string;
  verification_details?: string; // Added to store detailed verification message
  best_odds?: string; // Alias for morning_line_odds to match Supabase schema
  surface_type?: string;
  going?: string;
  prize?: string;
  purse?: string; // Alias for prize to match Supabase schema
  horse_number?: string; // Entry number (not stall)
  class_type?: string; // Alias for race_class to match Supabase schema
}

interface VerificationDetails {
  raceFound: boolean;
  horseFound: boolean;
  populatedFields: string[];
  missingFields: string[];
  errorDetails: string;
}

interface VerificationResult {
  isVerified: boolean;
  verificationDetails: string;
  errorMessage?: string;
  errorCode?: string;
  horse?: RacingAPIHorse | RacingAPIRunner;
}

interface HorseVerificationResult {
  isVerified: boolean;
  errorMessage?: string;
  verificationDetails?: string;
  horse?: any;
}

interface VerifiedHorse {
  horse_name: string;
  track_name: string;
  race_number: string;
  race_date: string;
  jockey: string;
  trainer: string;
  race_class: string;
  race_distance: string;
  manual_entry: boolean;
  verified: boolean;
  verification_details?: string;
  scheduled_time?: string;
  post_position?: string;
  morning_line_odds?: string;
  best_odds?: string; 
  jockey_name?: string;
  trainer_name?: string;
  surface_type?: string;
  going?: string;
  prize?: string;
  purse?: string;
  horse_number?: string;
  class_type?: string;
}

/**
 * Type guard to check if a horse object is a RacingAPIRunner (with odds)
 */
function isRacingAPIRunner(horse: RacingAPIHorse | RacingAPIRunner): horse is RacingAPIRunner {
  return 'odds' in horse;
}

/**
 * Service for verifying horse data against TheRacingAPI
 */
class HorseVerificationService {
  /**
   * Verify horse data against TheRacingAPI
   * 
   * @param horseData The horse data to verify
   * @returns Verification result
   */
  async verifyHorseData(horseData: HorseData): Promise<HorseVerificationResult> {
    // If manual entry is selected, just return success without verifying
    if (horseData.manual_entry) {
      return {
        isVerified: true,
        verificationDetails: 'Manual entry - data not verified with API'
      };
    }
    
    try {
      // Attempt to verify the horse data with TheRacingAPI
      return await this.verifyWithRacingAPI(horseData);
    } catch (error) {
      console.error('Error in horse verification:', error);
      return {
        isVerified: false,
        errorMessage: error instanceof Error ? error.message : 'Unknown error verifying horse',
      };
    }
  }
  
  /**
   * Verify horse data with TheRacingAPI
   * 
   * @param horseData The horse data to verify
   * @returns Verification result
   */
  private async verifyWithRacingAPI(horseData: HorseData): Promise<HorseVerificationResult> {
    // Log that we're attempting to fetch racecards
    console.log(`🔍 Fetching racecards for ${horseData.race_date} at ${horseData.track_name}`);
    
    try {
      // IMPORTANT: Check if this is a UK track first
      let isUkTrack = false;
      try {
        const { isUKTrack } = require('@/lib/data/uk-tracks');
        isUkTrack = isUKTrack(horseData.track_name);
        console.log(`🏇 Track "${horseData.track_name}" UK track detection: ${isUkTrack}`);
      } catch (error) {
        console.warn(`⚠️ Error checking if track is UK, proceeding anyway:`, error);
      }
      
      // We're going to proceed with the Racing API regardless of UK detection,
      // as we want to try both standard and pro APIs
      
      const racingAPIService = require('./racing-api').racingAPIService;
      
      // Let's try a different approach - first get ALL racecards for today
      // This will help us see what tracks are actually available
      console.log(`📅 Fetching ALL racecards for ${horseData.race_date} to see available tracks`);
      
      const allRacecards = await racingAPIService.getRacecards(
        horseData.race_date,
        undefined, // No track filter
        true // Use PRO API
      );
      
      console.log(`📊 Found ${allRacecards.length} total racecards for today`);
      
      // List all available tracks for debugging
      const availableTracks = Array.from(new Set(allRacecards.map((card: any) => card.course)));
      console.log(`🏇 Available tracks today: ${availableTracks.join(', ')}`);
      
      // Prepare alternate track name options for flexible matching
      const trackVariations = [
        horseData.track_name,                                     // Original name
        horseData.track_name.toLowerCase(),                       // Lowercase
        horseData.track_name + " (AW)",                           // With AW suffix
        horseData.track_name.replace(/ City$/, ""),               // Without "City"
        horseData.track_name.replace(/ Park$/, ""),               // Without "Park"
        horseData.track_name.replace(/ Racecourse$/, ""),         // Without "Racecourse"
        horseData.track_name.replace(/^(The) /, "")               // Without leading "The"
      ];
      
      // Try to find a match for our track in the available tracks
      let matchingRacecards: any[] = [];
      
      // First check for direct track name match (case insensitive)
      for (const trackVariation of trackVariations) {
        const exactMatches = allRacecards.filter((card: any) => 
          card.course.toLowerCase() === trackVariation.toLowerCase()
        );
        
        if (exactMatches.length > 0) {
          console.log(`✅ Found exact match for track "${trackVariation}"`);
          matchingRacecards = exactMatches;
          break;
        }
      }
      
      // If no direct match, try substring matching
      if (matchingRacecards.length === 0) {
        console.log(`🔍 No exact match for "${horseData.track_name}", trying substring matching`);
        
        // Try each track variation with substring matching
        for (const trackVariation of trackVariations) {
          const partialMatches = allRacecards.filter((card: any) => {
            const cardCourseName = card.course.toLowerCase().trim();
            const variation = trackVariation.toLowerCase().trim();
            return cardCourseName.includes(variation) || variation.includes(cardCourseName);
          });
          
          if (partialMatches.length > 0) {
            console.log(`✅ Found ${partialMatches.length} racecards using substring match for "${trackVariation}"`);
            matchingRacecards = partialMatches;
            break;
          }
        }
      }
      
      // If still no match, try fuzzy matching
      if (matchingRacecards.length === 0) {
        console.log(`🔍 No substring match, trying fuzzy matching with Levenshtein distance`);
        
        // Calculate similarity scores for each track
        const trackSimilarities = availableTracks.map((track: unknown) => {
          // Get best score across all variations
          const trackString = track as string;
          const bestScore = Math.max(...trackVariations.map(variation => {
            return this.calculateStringSimilarity(trackString.toLowerCase(), variation.toLowerCase());
          }));
          
          return { track: trackString, score: bestScore };
        });
        
        // Sort by similarity score (highest first)
        trackSimilarities.sort((a, b) => b.score - a.score);
        
        // If top match has good similarity, use it
        if (trackSimilarities.length > 0 && trackSimilarities[0].score >= 0.6) {
          const bestMatch = trackSimilarities[0];
          console.log(`✅ Found fuzzy match: "${bestMatch.track}" (score: ${bestMatch.score.toFixed(2)})`);
          
          matchingRacecards = allRacecards.filter((card: any) => card.course === bestMatch.track);
        }
      }
      
      // Log the results of our search
      if (matchingRacecards.length > 0) {
        console.log(`✅ Found ${matchingRacecards.length} racecards for ${horseData.track_name}`);
      } else {
        console.log(`❌ No racecards found for ${horseData.track_name} with any matching method`);
        
        // If we still can't find any races, return a more helpful error
        if (availableTracks.length > 0) {
          return {
            isVerified: false,
            errorMessage: `No races found for ${horseData.track_name} on ${horseData.race_date}`,
            verificationDetails: `Available tracks today: ${availableTracks.join(', ')}`
          };
        } else {
          return {
            isVerified: false,
            errorMessage: `No races found for ${horseData.race_date}`,
            verificationDetails: 'There appear to be no races in the database for today'
          };
        }
      }
      
      // *** IMPORTANT: NEW WORKFLOW ***
      // First, find the horse in ANY race at the track, then determine the correct race
      
      // Sort racecards by off_time for consistency
      const sortedRacecards = [...matchingRacecards].sort((a, b) => 
        a.off_time.localeCompare(b.off_time)
      );
      
      // Build a complete list of all horses at this track with their race details
      interface HorseWithRaceInfo {
        horse: any;  // The horse object
        race: any;   // The race object
        raceIndex: number;  // Race number on the card
      }
      
      const allHorsesAtTrack: HorseWithRaceInfo[] = [];
      
      console.log(`🔍 Building complete horse directory for ${horseData.track_name}`);
      
      // Parse all horses from all races at this track
      for (let i = 0; i < sortedRacecards.length; i++) {
        const race = sortedRacecards[i];
        const raceIndex = i + 1; // 1-based race index (this is the race number we want)
        
        // Log race details
        console.log(`Race ${raceIndex}: ${race.course} at ${race.off_time}`);
        
        // Parse horses from this race
        const raceHorses = race.runners || [];
        
        // Add each horse with its position in the race card (this is the horse number)
        for (let j = 0; j < raceHorses.length; j++) {
          const horse = raceHorses[j];
          
            allHorsesAtTrack.push({
            horse: horse,
            race: race,
            // This is the key change: raceIndex is the 1-10 race number we want
            raceIndex: raceIndex
          });
        }
      }
      
      console.log(`📊 Indexed ${allHorsesAtTrack.length} horses across ${sortedRacecards.length} races at ${horseData.track_name}`);
      
      // Now search for our specific horse
      let matchedHorseInfo: HorseWithRaceInfo | null = null;
      let userSpecifiedRaceFound = false;
      
      // If user specified a race time/number, try to find the horse in that race first
      if (horseData.race_number && horseData.race_number.trim() !== '') {
        console.log(`🔍 User specified race number/time: "${horseData.race_number}" - looking for an exact match first`);
        
        const specifiedRaceMatches = sortedRacecards.filter(race => {
          // Try to match race by time (18:30), formatted time (1830), or race number
          return race.off_time === horseData.race_number ||
                 race.off_time.replace(':', '') === horseData.race_number.replace(':', '') ||
                 race.race_name.includes(`Race ${horseData.race_number}`) ||
                 // Also check if just the hour matches (e.g., "14" matches "14:30")
                 race.off_time.startsWith(`${horseData.race_number}:`);
        });
        
        if (specifiedRaceMatches.length > 0) {
          const specifiedRace = specifiedRaceMatches[0];
          console.log(`✅ Found specified race at ${specifiedRace.off_time}`);
          userSpecifiedRaceFound = true;
          
          // Check all horses in this race
          const horsesInRace = specifiedRace.runners || specifiedRace.horses || [];
          
          // Try to find our horse in this specific race
          const foundHorse = this.findHorseInRace(horsesInRace, horseData);
          
          if (foundHorse) {
            // Found horse in the specified race!
            const raceIndex = sortedRacecards.findIndex(r => r.off_time === specifiedRace.off_time) + 1;
            matchedHorseInfo = {
              horse: foundHorse,
              race: specifiedRace,
              raceIndex
            };
            console.log(`✅ Found horse "${foundHorse.horse}" in specified race ${raceIndex} at ${specifiedRace.off_time}`);
          } else {
            console.log(`⚠️ Specified race at ${specifiedRace.off_time} does not contain horse "${horseData.horse_name}"`);
          }
        } else {
          console.log(`⚠️ Could not find race matching "${horseData.race_number}" - will search all races`);
        }
      }
      
      // If we haven't found the horse in a user-specified race, search all horses at the track
      if (!matchedHorseInfo) {
        console.log(`🔍 Searching for horse "${horseData.horse_name}" in all races at ${horseData.track_name}`);
        
        // Try exact name match first
        let matchedHorse = allHorsesAtTrack.find(info => 
          info.horse.horse && 
          info.horse.horse.toLowerCase() === horseData.horse_name.toLowerCase()
        );
        
        // If no exact match, try without country codes
        if (!matchedHorse) {
          const cleanHorseName = horseData.horse_name.replace(/\([A-Z]{2,3}\)$/, '').trim().toLowerCase();
          
          matchedHorse = allHorsesAtTrack.find(info => 
            info.horse.horse && 
            info.horse.horse.replace(/\([A-Z]{2,3}\)$/, '').trim().toLowerCase() === cleanHorseName
          );
          
          if (matchedHorse) {
            console.log(`✅ Found horse after removing country code: "${matchedHorse.horse.horse}"`);
          }
        }
        
        // If still no match, try substring matching
        if (!matchedHorse) {
          const potentialMatches = allHorsesAtTrack.filter(info => {
            const horseLower = info.horse.horse && info.horse.horse.toLowerCase();
            const searchLower = horseData.horse_name.toLowerCase();
            return horseLower && (horseLower.includes(searchLower) || searchLower.includes(horseLower));
          });
          
          if (potentialMatches.length > 0) {
            matchedHorse = potentialMatches[0];
            console.log(`✅ Found horse using substring match: "${matchedHorse.horse.horse}"`);
          }
        }
        
        // If still no match, try fuzzy matching
        if (!matchedHorse) {
          // Create array of just horse objects for fuzzy matching
          const allHorseObjects = allHorsesAtTrack.map(info => info.horse);
          
          // Use our existing findHorseInRace function for fuzzy matching
          const fuzzyMatchedHorse = this.findHorseInRace(allHorseObjects, horseData);
          
          if (fuzzyMatchedHorse) {
            // Now find the race info for this horse
            matchedHorse = allHorsesAtTrack.find(info => 
              info.horse.horse === fuzzyMatchedHorse.horse && 
              info.horse.horse_id === fuzzyMatchedHorse.horse_id
            );
            
            if (matchedHorse) {
              console.log(`✅ Found horse using fuzzy matching: "${matchedHorse.horse.horse}" in race at ${matchedHorse.race.off_time}`);
            }
          }
        }
        
        if (matchedHorse) {
          matchedHorseInfo = matchedHorse;
        }
      }
      
      // If we couldn't find the horse at all
      if (!matchedHorseInfo) {
        console.log(`❌ Horse "${horseData.horse_name}" not found in any race at ${horseData.track_name}`);
        
        // List all races and horses for debugging
        const allRacesWithHorses = sortedRacecards.map(race => {
          const horses = (race.runners || race.horses || [])
            .filter((h: any) => h && h.horse)
            .map((h: any) => h.horse);
          
          return `Race at ${race.off_time}: ${horses.join(', ')}`;
        }).join('\n');
        
        return {
          isVerified: false,
          errorMessage: `Horse '${horseData.horse_name}' not found in any race at ${horseData.track_name}`,
          verificationDetails: `Please check the horse name or try a different race:\n${allRacesWithHorses}`
        };
      }
      
      // Now we have the correct horse AND the correct race!
      const { horse, race, raceIndex } = matchedHorseInfo;
      
      console.log(`✅ Successfully found horse: "${horse.horse}" in Race ${raceIndex} at ${race.off_time}`);
      
      // If user specified a race but we found the horse in a DIFFERENT race, warn them
      if (horseData.race_number && userSpecifiedRaceFound && race.off_time !== horseData.race_number && 
          !race.off_time.includes(horseData.race_number) && !horseData.race_number.includes(race.off_time)) {
        console.log(`⚠️ NOTE: Horse was found in race at ${race.off_time}, NOT in specified race ${horseData.race_number}`);
      }
      
      // Extract surface type if available
      const surface = this.extractSurface(race);
      
      // Extract class type with our fallback logic
      const classType = this.extractClassType(race);
      
      // Create a structured response with the verified data
      const verifiedHorse = {
        horse_name: horse.horse || '',
        track_name: race.course || horseData.track_name,
        // Convert race_number from off_time (e.g., "2:32") to numeric format without colons (e.g., "232")
        race_number: race.off_time ? race.off_time.replace(/:/g, '') : raceIndex.toString(),
        // Use the actual date from horseData.race_date instead of the off_time which is causing issues
        race_date: horseData.race_date,
        jockey: horse.jockey || '',
        trainer: horse.trainer || '',
        race_class: classType, // Use our extracted class type with fallbacks
        race_distance: race.distance || '',
        manual_entry: false,
        verified: true,
        verification_details: `Verified via Racing API: ${horse.horse} at ${race.course} on ${race.off_time}`,
        scheduled_time: race.off_time || '',
        
        // The post_position field is the stall/gate number - check multiple possible API fields
        post_position: this.extractPostPosition(horse),
        
        morning_line_odds: horse.odds?.decimal?.toString() || '',
        best_odds: horse.odds?.decimal?.toString() || '',
        surface_type: surface,
        going: race.going || '',
        
        // For prize/purse, extract the numeric value by removing currency symbols and formatting
        prize: this.extractPrizeValue(race.prize),
        purse: this.extractPrizeValue(race.prize), // Same value, both fields for compatibility
        
        // This is the entry number (number on horse's colors)
        horse_number: horse.number || '',
        class_type: classType, // Use the same class type for both fields
        jockey_name: horse.jockey || '',
        trainer_name: horse.trainer || ''
      };
      
      // If we have bookmaker odds, calculate the best odds
      if (race.runners) {
        const matchingRunner = race.runners.find((r: any) => r.horse_id === horse.horse_id);
        if (matchingRunner && matchingRunner.odds) {
          // Get the horse's odds from different bookmakers
          const bestOdds = this.calculateBestOdds(matchingRunner.odds);
          if (bestOdds) {
            verifiedHorse.morning_line_odds = bestOdds.toString();
            verifiedHorse.best_odds = bestOdds.toString();
          }
        }
      }
      
      return {
        isVerified: true,
        horse: verifiedHorse,
        verificationDetails: `Verified via Racing API: ${horse.horse} at ${race.course} on ${race.off_time}`
      };
    } catch (error) {
      console.error(`❌ API connection error:`, error);
      
      // Provide more specific error messages based on the type of error
      let errorMessage = 'Error connecting to Racing API';
      
      if (error instanceof Error) {
        // Special handling for 402 Payment Required errors
        if (error.message.includes('402') || error.message.includes('Payment Required')) {
          return {
            isVerified: false,
            errorMessage: 'API subscription may need renewal. The Racing API returned a payment required error.',
            verificationDetails: 'Your subscription to The Racing API may need to be renewed or a payment is required to continue using the service.'
          };
        }
        
        // Handle connection refused errors
        if (error.message.includes('ECONNREFUSED')) {
          return {
            isVerified: false,
            errorMessage: 'Unable to connect to Racing API server. The server may be down.',
            verificationDetails: 'The connection to the Racing API server was refused. Please check your internet connection and try again later.'
          };
        }
        
        // Handle date range errors
        if (error.message.includes('only supports verification for races today or tomorrow') ||
            error.message.includes('Date restriction')) {
          return {
            isVerified: false,
            errorMessage: 'Date out of range. The Racing API only supports verification for races today or tomorrow.',
            verificationDetails: 'Only races scheduled for today or tomorrow can be verified.'
          };
        }
        
        // Handle no races found errors
        if (error.message.includes('No races found')) {
          return {
            isVerified: false,
            errorMessage: `No races found for ${horseData.track_name} on ${horseData.race_date}`,
            verificationDetails: 'No races were found for the specified track and date. Please check your input and try again.'
          };
        }
        
        // Handle horse not found errors
        if (error.message.includes('Horse not found')) {
          return {
            isVerified: false,
            errorMessage: `Horse '${horseData.horse_name}' not found in race at ${horseData.track_name}`,
            verificationDetails: 'The horse name could not be found in the available races. Please check the spelling or try manual entry.'
          };
        }
        
        // Handle timeout errors
        if (error.message.includes('timeout') || error.message.includes('timed out')) {
          return {
            isVerified: false,
            errorMessage: 'API request timed out. Please try again later.',
            verificationDetails: 'The request to The Racing API took too long to complete. This may be due to high server load or network issues.'
          };
        }
        
        // Use the actual error message
        errorMessage = `API Connection Error: ${error.message}`;
      }
      
      return {
        isVerified: false,
        errorMessage
      };
    }
  }
  
  /**
   * Extract surface type from race data
   */
  private extractSurface(race: any): string {
    if (!race) return 'Not specified';
    
    if (race.surface) return race.surface;
    
    // Try to infer from other fields
    if (race.race_type && race.race_type.toLowerCase().includes('aw')) {
      return 'All Weather';
    }
    
    if (race.course && race.course.toLowerCase().includes('(aw)')) {
      return 'All Weather';
    }
    
    // Default to Turf for UK racing unless specified otherwise
    return 'Turf';
  }
  
  /**
   * Calculate best odds from array of bookmaker odds
   * Excludes exchanges and pool betting platforms
   */
  private calculateBestOdds(odds: any[]): number | null {
    if (!odds || !Array.isArray(odds) || odds.length === 0) {
      return null;
    }
    
    // Exclude exchange and pool betting platforms
    const excludedBookmakers = [
      'Betfair Exchange', 
      'Spreadex', 
      'Matchbook', 
      'Tote', 
      'Exchange'
    ].map(b => b.toLowerCase());
    
    // Filter out excluded bookmakers
    const filteredOdds = odds.filter(odd => 
      odd.bookmaker && !excludedBookmakers.includes(odd.bookmaker.toLowerCase())
    );
    
    if (filteredOdds.length === 0) {
      // If all bookmakers were excluded, use all odds as fallback
      console.log('All bookmakers were excluded, using all odds as fallback');
    }
    
    // Use filtered odds if available, otherwise use all odds
    const oddsToUse = filteredOdds.length > 0 ? filteredOdds : odds;
    
    // Convert all odds to decimal for comparison
    const decimalOdds = oddsToUse.map(odd => {
      // If decimal is already provided, use it
      if (odd.decimal) {
        return parseFloat(odd.decimal);
      }
      
      // Otherwise, try to convert fractional odds to decimal
      if (odd.fractional) {
        // Handle special case for decimal format stored as fractional
        if (!isNaN(parseFloat(odd.fractional))) {
          return parseFloat(odd.fractional);
        }
        
        // Normal fractional format (e.g., "5/2")
        const parts = odd.fractional.split('/');
        if (parts.length === 2) {
          const numerator = parseFloat(parts[0]);
          const denominator = parseFloat(parts[1]);
          if (!isNaN(numerator) && !isNaN(denominator) && denominator !== 0) {
            return (numerator / denominator) + 1; // +1 to include stake
          }
        }
      }
      
      return 0; // Default if parsing fails
    });
    
    // Filter out any zeros from failed parsing
    const validOdds = decimalOdds.filter(odd => odd > 0);
    
    if (validOdds.length === 0) {
      return null;
    }
    
    // Find the maximum decimal odds (best for the bettor)
    const bestOdds = Math.max(...validOdds);
    
    // Log the best odds for debugging
    console.log(`Best odds: ${bestOdds.toFixed(2)} (from ${validOdds.length} valid bookmakers)`);
    
    // Return as a number with 2 decimal places (in decimal format)
    return parseFloat(bestOdds.toFixed(2));
  }
  
  /**
   * Calculate string similarity using Levenshtein distance
   * Returns a value between 0 and 1, where 1 is an exact match
   */
  private calculateStringSimilarity(a: string, b: string): number {
    if (!a || !b) return 0;
    if (a === b) return 1;
    
    const aLen = a.length;
    const bLen = b.length;
    
    if (aLen === 0 || bLen === 0) return 0;
    
    const matrix: number[][] = Array(aLen + 1).fill(null).map(() => Array(bLen + 1).fill(0));
    
    for (let i = 0; i <= aLen; i++) matrix[i][0] = i;
    for (let j = 0; j <= bLen; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= aLen; i++) {
      for (let j = 1; j <= bLen; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    
    const distance = matrix[aLen][bLen];
    const maxLen = Math.max(aLen, bLen);
    
    return 1 - distance / maxLen;
  }

  /**
   * Helper method to find a horse within a race using multiple matching techniques
   */
  private findHorseInRace(horses: any[], horseData: HorseData): any {
    // Guard against empty arrays
    if (!horses || horses.length === 0) {
      console.log(`⚠️ No horses to search through in this race`);
      return null;
    }
    
    // 1. First try exact match (case insensitive)
    let horse = horses.find((h: any) => 
      h.horse && h.horse.toLowerCase() === horseData.horse_name.toLowerCase()
    );
    
    if (horse) {
      console.log(`✅ Found exact match for horse: ${horse.horse}`);
      return horse;
    }
    
    // 2. Try removing parenthesized country codes like (IRE), (FR), etc.
    const cleanHorseName = horseData.horse_name.replace(/\([A-Z]{2,3}\)$/, '').trim();
    horse = horses.find((h: any) => 
      h.horse && h.horse.replace(/\([A-Z]{2,3}\)$/, '').trim().toLowerCase() === cleanHorseName.toLowerCase()
    );
    
    if (horse) {
      console.log(`✅ Found horse match after removing country code: ${horse.horse}`);
      return horse;
    }
    
    // 3. Try substring matching
    const substringMatches = horses.filter((h: any) => {
      const horseLower = h.horse && h.horse.toLowerCase();
      const searchLower = horseData.horse_name.toLowerCase();
      return horseLower && (horseLower.includes(searchLower) || searchLower.includes(horseLower));
    });
    
    if (substringMatches.length > 0) {
      horse = substringMatches[0];
      console.log(`✅ Found horse using substring match: ${horse.horse}`);
      return horse;
    }
    
    // 4. Finally try fuzzy matching with a lower threshold
    // We'll try using some utility method from the racing API service if available
    try {
      const racingAPIService = require('./racing-api').racingAPIService;
      const LOWER_THRESHOLD = 0.5; // Lower threshold for better matching
      
      // This assumes the racing API service has a fuzzy matching method
      if (typeof racingAPIService.findHorseWithFuzzyMatch === 'function') {
        console.log(`Looking for horse "${horseData.horse_name}" among ${horses.length} entries in horses array`);
        
        const fuzzyMatch = {
          runners: horses,
          horses: horses
        };
        
        const fuzzyHorse = racingAPIService.findHorseWithFuzzyMatch(
          fuzzyMatch, 
          horseData.horse_name,
          LOWER_THRESHOLD
        );
        
        if (fuzzyHorse && fuzzyHorse.horse) {
          console.log(`✅ Found horse using fuzzy matching: ${fuzzyHorse.horse}`);
          return fuzzyHorse;
        } else {
          console.log(`❌ No horse matched "${horseData.horse_name}" above threshold ${LOWER_THRESHOLD}`);
        }
      }
    } catch (error: any) {
      console.log(`⚠️ Error during fuzzy matching: ${error.message}`);
    }
    
    // No match found
    return null;
  }

  // Add a helper method to determine the race number properly
  private extractRaceNumberFromTime(timeStr: string): number {
    if (!timeStr) return 1; // Default to race 1
    
    // For now, we don't have a way to directly map time to race number
    // So we'll use a placeholder value
    return 1;
  }

  /**
   * Extract post position (stall/gate number) from horse data
   * Checks multiple API fields that might contain this information
   */
  private extractPostPosition(horse: any): string {
    // Debug the available data for post position
    console.log(`🔍 Extracting post position from horse:`, {
      draw: horse.draw,
      stall: horse.stall,
      barrier: horse.barrier,
      gate: horse.gate,
      number: horse.number
    });
    
    // First check the 'draw' field which is the most common field for stall number
    if (horse.draw !== undefined && horse.draw !== null && horse.draw !== '') {
      return horse.draw.toString();
    }
    
    // Check several possible fields that could contain the stall/gate number
    if (horse.stall !== undefined && horse.stall !== null && horse.stall !== '') {
      return horse.stall.toString();
    }
    
    // In some API responses, the stall info might be in other fields
    if (horse.barrier !== undefined && horse.barrier !== null && horse.barrier !== '') {
      return horse.barrier.toString();
    }
    
    // Some tracks might use gate instead of stall
    if (horse.gate !== undefined && horse.gate !== null && horse.gate !== '') {
      return horse.gate.toString();
    }
    
    // As a last resort, some APIs might use the number field for stall position
    if (horse.number !== undefined && horse.number !== null && horse.number !== '') {
      return horse.number.toString();
    }
    
    console.log('⚠️ No post position found in any field for horse:', horse.horse);
    return '';
  }

  /**
   * Extract race class type with fallbacks
   * Checks multiple fields in case the primary field is not available
   */
  private extractClassType(race: any): string {
    // First try race_class which is the primary field
    if (race.race_class && race.race_class.trim() !== '') {
      return race.race_class;
    }
    
    // If race_class is not present, try type
    if (race.type && race.type.trim() !== '') {
      return race.type;
    }
    
    // Last fallback to race_type
    if (race.race_type && race.race_type.trim() !== '') {
      return race.race_type;
    }
    
    return '';
  }

  /**
   * Extract numeric prize value from string
   * Removes currency symbols, commas, etc. and returns just the number
   */
  private extractPrizeValue(prizeString: string | undefined): string {
    if (!prizeString) return '';
    
    try {
      // Remove currency symbols, commas, and other non-numeric characters except decimal point
      const numericValue = prizeString.replace(/[^0-9.]/g, '');
      
      // If we have a valid number, return it
      if (!isNaN(parseFloat(numericValue))) {
        return numericValue;
      }
    } catch (error) {
      console.warn('Error extracting prize value:', error);
    }
    
    return '';
  }
}

// Export a singleton instance
export const horseVerificationService = new HorseVerificationService(); 
