/**
 * Racing API Client
 * 
 * This file contains functions for interacting with theracingapi.com.
 * It uses a server-side proxy to avoid CORS issues and protect API credentials.
 */

import { Horse, RacingApiError, HorseMatch, Racecard, ErrorType } from './types';

/**
 * Make a request to the racing API via our server-side proxy
 */
async function apiRequest(endpoint: string) {
  try {
    // Remove leading slash if present
    const path = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    
    // Log the request (for debugging)
    console.log(`Making API request to proxy for: ${path}`);
    
    // Make the request through our server-side proxy (using dynamic route)
    const response = await fetch(`/api/racing/${path}`);
    
    // Check if response is OK before parsing
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`API Error (${response.status}):`, errorData);
      throw new RacingApiError(
        errorData.error || `API request failed with status ${response.status}`,
        response.status,
        ErrorType.API_RESPONSE
      );
    }
    
    // Parse the JSON response
    try {
      const data = await response.json();
      return data;
    } catch (jsonError) {
      console.error('JSON parse error:', jsonError);
      throw new RacingApiError(
        'Failed to parse API response',
        500,
        ErrorType.API_RESPONSE
      );
    }
  } catch (error) {
    if (error instanceof RacingApiError) {
      throw error;
    }
    
    // Network or connection error
    console.error('API connection error:', error);
    throw new RacingApiError(
      'Failed to connect to Racing API. Please check your internet connection and try again.',
      500,
      ErrorType.API_CONNECTION
    );
  }
}

/**
 * Get racecards (races with details) for today or a specific date
 * Uses the Pro endpoint which has the most detailed information
 */
export async function getRacecards(date?: string): Promise<Racecard[]> {
  try {
    // Prepare query parameters if date provided
    let endpoint = 'racecards/pro';
    if (date) {
      // Use proper query parameter format
      endpoint += `?date=${date}`;
    }
    
    // Make API request
    const data = await apiRequest(endpoint);
    
    // Check if racecards exists in response
    if (!data.racecards) {
      console.warn('API response missing racecards property:', data);
      return [];
    }
    
    return data.racecards;
  } catch (error) {
    console.error('Error getting racecards:', error);
    throw error;
  }
}

/**
 * Get racecards for a specific course/track on a specific date
 */
export async function getRacecardsByTrack(trackName: string, date: string): Promise<Racecard[]> {
  try {
    // Validate required parameters
    if (!trackName || !date) {
      throw new RacingApiError(
        'Track name and date are required to get racecards',
        400,
        ErrorType.DATA_MISSING
      );
    }
    
    // Get all racecards for the date
    const endpoint = `racecards/pro?date=${date}`;
    const data = await apiRequest(endpoint);
    
    // Check if racecards exists in response
    if (!data.racecards) {
      console.warn('API response missing racecards property:', data);
      return [];
    }
    
    // Filter racecards by track name (case-insensitive)
    const racecards = data.racecards;
    return racecards.filter((card: Racecard) => {
      // Handle different course property formats
      if (typeof card.course === 'string') {
        return card.course.toLowerCase().includes(trackName.toLowerCase());
      } else if (card.course && typeof card.course === 'object' && card.course.name) {
        return card.course.name.toLowerCase().includes(trackName.toLowerCase());
      }
      return false;
    });
  } catch (error) {
    console.error('Error getting racecards by track:', error);
    throw error;
  }
}

/**
 * Get detailed information about a specific race by ID
 */
export async function getRaceById(raceId: string): Promise<Racecard> {
  try {
    // Validate required parameters
    if (!raceId) {
      throw new RacingApiError(
        'Race ID is required to get race details',
        400,
        ErrorType.DATA_MISSING
      );
    }
    
    // Make API request
    const data = await apiRequest(`racecards/${raceId}/pro`);
    
    // Check response structure
    if (!data.racecard) {
      throw new RacingApiError(
        'Race not found or invalid response format',
        404,
        ErrorType.API_RESPONSE
      );
    }
    
    return data.racecard;
  } catch (error) {
    console.error('Error getting race details:', error);
    throw error;
  }
}

/**
 * Search for horses by name
 */
export async function searchHorses(name: string, date?: string): Promise<Horse[]> {
  try {
    // Validate required parameters
    if (!name) {
      throw new RacingApiError(
        'Horse name is required for search',
        400,
        ErrorType.DATA_MISSING
      );
    }
    
    // Get all racecards for the day
    const racecards = await getRacecards(date);
    
    // Search for horses in all racecards
    const horses: Horse[] = [];
    
    // Check for API-specific field names in the response
    racecards.forEach(racecard => {
      // Handle different API response formats - some use 'horses', some use 'runners'
      const horsesList = racecard.horses || racecard.runners || [];
      
      horsesList
        .filter(horse => 
          (horse.name && horse.name.toLowerCase().includes(name.toLowerCase())) ||
          (horse.horse && horse.horse.toLowerCase().includes(name.toLowerCase()))
        )
        .forEach(horse => {
          // Standardize horse data regardless of source format
          horses.push({
            id: horse.id || horse.horse_id,
            name: horse.name || horse.horse,
            trainer: {
              id: horse.trainer?.id || horse.trainer_id,
              name: horse.trainer?.name || horse.trainer,
            },
            jockey: {
              id: horse.jockey?.id || horse.jockey_id,
              name: horse.jockey?.name || horse.jockey,
            },
            age: horse.age ? parseInt(horse.age.toString()) : undefined,
            weight: horse.weight || horse.lbs,
            form: horse.form,
            odds: Array.isArray(horse.odds) ? horse.odds[0]?.price : horse.odds,
            race_id: racecard.race_id
          });
        });
    });
    
    return horses;
  } catch (error) {
    console.error('Error searching for horses:', error);
    throw error;
  }
}

/**
 * Find a horse in racecards by track name, date and optionally race number/time
 */
export async function findHorseInRacecards(
  horseName: string, 
  trackName: string, 
  date: string, 
  raceNumberOrTime?: string
): Promise<HorseMatch | null> {
  try {
    // Validate required parameters
    if (!horseName || !trackName || !date) {
      throw new RacingApiError(
        'Horse name, track name, and date are required to find a horse',
        400,
        ErrorType.DATA_MISSING
      );
    }
    
    // Get racecards for the specified track and date
    const racecards = await getRacecardsByTrack(trackName, date);
    
    if (!racecards.length) {
      console.log(`No racecards found for track: ${trackName}, date: ${date}`);
      return null;
    }
    
    // Filter by race number or time if provided
    let targetRacecards = racecards;
    if (raceNumberOrTime) {
      targetRacecards = racecards.filter(card => {
        // Match either by race number, time or off_time
        return (card.race_number?.toString() === raceNumberOrTime) || 
               (card.time === raceNumberOrTime) ||
               (card.off_time === raceNumberOrTime);
      });
      
      // If no racecards match the race number/time, revert to all racecards
      if (targetRacecards.length === 0) {
        console.log(`No specific race found with number/time: ${raceNumberOrTime}, falling back to all races`);
        targetRacecards = racecards;
      }
    }
    
    // Check each racecard for the horse
    for (const racecard of targetRacecards) {
      // Handle both horses and runners property names in the API response
      const horsesList = racecard.horses || racecard.runners || [];
      
      // Use fuzzy matching for horse name (case-insensitive partial match)
      const matchedHorse = horsesList.find(horse => {
        const horseName1 = horse.name?.toLowerCase() || '';
        const horseName2 = horse.horse?.toLowerCase() || '';
        const searchName = horseName.toLowerCase();
        
        return horseName1.includes(searchName) || 
               searchName.includes(horseName1) ||
               horseName2.includes(searchName) || 
               searchName.includes(horseName2);
      });
      
      if (matchedHorse) {
        // Standardize horse data
        const standardizedHorse: Horse = {
          id: matchedHorse.id || matchedHorse.horse_id,
          name: matchedHorse.name || matchedHorse.horse || 'Unknown Horse',
          trainer: {
            id: matchedHorse.trainer_id || matchedHorse.trainer?.id,
            name: matchedHorse.trainer_name || (matchedHorse.trainer?.name || 'Unknown Trainer'),
          },
          jockey: {
            id: matchedHorse.jockey_id || matchedHorse.jockey?.id,
            name: matchedHorse.jockey_name || (matchedHorse.jockey?.name || 'Unknown Jockey'),
          },
          age: matchedHorse.age ? parseInt(String(matchedHorse.age)) : undefined,
          weight: matchedHorse.weight || matchedHorse.lbs,
          form: matchedHorse.form,
          odds: Array.isArray(matchedHorse.odds) ? matchedHorse.odds[0]?.price : matchedHorse.odds,
        };
        
        // Standardize racecard data
        const standardizedRacecard: Racecard = {
          race_id: racecard.race_id,
          race_name: racecard.race_name,
          course: typeof racecard.course === 'string' 
            ? { name: racecard.course, id: racecard.course_id || '', country: '' } 
            : racecard.course || { name: 'Unknown Course', country: '' },
          date: racecard.date,
          time: racecard.time || racecard.off_time,
          race_number: racecard.race_number,
          distance: racecard.distance || racecard.distance_round,
          class: racecard.class || racecard.race_class,
          age_range: racecard.age_range || racecard.age_band,
          going: racecard.going || racecard.going_detailed,
          prize: racecard.prize || racecard.prize_money,
          race_type: racecard.race_type || racecard.type,
          number_of_runners: racecard.number_of_runners || 
                            (typeof racecard.field_size === 'string' 
                              ? parseInt(racecard.field_size) 
                              : racecard.field_size || 0),
          horses: racecard.horses || racecard.runners || [],
        };
        
        console.log(`Found horse match: ${standardizedHorse.name} in race: ${standardizedRacecard.race_name}`);
        return { 
          horse: standardizedHorse, 
          racecard: standardizedRacecard 
        };
      }
    }
    
    console.log(`No horse found matching name: ${horseName} at track: ${trackName}`);
    return null;
  } catch (error) {
    console.error('Error finding horse in racecards:', error);
    throw error;
  }
}

/**
 * Match a horse using the available data
 */
export async function matchHorse(
  horseName: string, 
  trackName: string, 
  date: string, 
  raceNumberOrTime?: string
): Promise<HorseMatch | null> {
  try {
    // Validate required parameters
    if (!horseName || !trackName || !date) {
      throw new RacingApiError(
        'Missing required information: please provide horse name, track name, and race date',
        400,
        ErrorType.DATA_MISSING
      );
    }
    
    console.log(`Attempting to match horse: ${horseName}, track: ${trackName}, date: ${date}, race: ${raceNumberOrTime || 'any'}`);
    
    // Try to find the horse in racecards at the specified track
    const result = await findHorseInRacecards(horseName, trackName, date, raceNumberOrTime);
    
    if (result) {
      return result;
    }
    
    // If not found, try a broader search for horses by name across all tracks for the date
    console.log('No direct match found, searching more broadly...');
    const horses = await searchHorses(horseName, date);
    
    if (horses.length > 0) {
      console.log(`Found ${horses.length} horses matching name: ${horseName}`);
      // Get the first matching horse and its racecard
      const matchedHorse = horses[0];
      
      // Ensure race_id exists before attempting to fetch the race
      if (matchedHorse.race_id) {
        try {
          const racecard = await getRaceById(matchedHorse.race_id);
          
          return { 
            horse: matchedHorse, 
            racecard: racecard 
          };
        } catch (raceError) {
          console.error('Error getting race details:', raceError);
          throw new RacingApiError(
            'Found horse but could not retrieve race details',
            500,
            ErrorType.API_RESPONSE
          );
        }
      } else {
        console.log('Horse found but no race_id available');
        throw new RacingApiError(
          'Found horse but race information is missing',
          404,
          ErrorType.NO_MATCH
        );
      }
    }
    
    console.log('No match found in any race for this date');
    throw new RacingApiError(
      'No matching horse found. Please check the name, track, and date you entered.',
      404,
      ErrorType.NO_MATCH
    );
  } catch (error) {
    console.error('Error matching horse:', error);
    
    // Return specific error message based on error type
    if (error instanceof RacingApiError) {
      throw error;
    } else {
      throw new RacingApiError(
        'Unexpected error occurred while matching horse',
        500,
        ErrorType.API_CONNECTION
      );
    }
  }
} 