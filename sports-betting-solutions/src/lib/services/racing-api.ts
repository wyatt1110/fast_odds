import axios from 'axios';
import { formatISO, parseISO, isValid, format } from 'date-fns';
// Remove direct imports that cause issues in browser
// import * as fs from 'fs';
// import * as path from 'path';

const RACING_API_BASE_URL = 'https://api.theracingapi.com/v1';
const RACING_API_USERNAME = 'KQ9W7rQeAHWMUgxH93ie3yEc';
const RACING_API_PASSWORD = 'T5BoPivL3Q2h6RhCdLv4EwZu';

// In-memory track codes data
// Built from TheRacingAPI /courses endpoint (updated 2025-03-25)
const FALLBACK_TRACK_CODES: Record<string, string> = {
  "aintree": "crs_832",
  "ascot": "crs_52",
  "ayr": "crs_78",
  "bangor": "crs_104",
  "bangor-on-dee": "crs_104",
  "bath": "crs_130",
  "beverley": "crs_156",
  "brighton": "crs_182",
  "carlisle": "crs_208",
  "cartmel": "crs_234",
  "catterick": "crs_260",
  "chelmsford": "crs_34164",
  "cheltenham": "crs_286",
  "chepstow": "crs_312",
  "chester": "crs_338",
  "doncaster": "crs_390",
  "epsom": "crs_442",
  "exeter": "crs_364",
  "fakenham": "crs_468",
  "ffos las": "crs_31512",
  "fontwell": "crs_520",
  "goodwood": "crs_546",
  "hamilton": "crs_572",
  "haydock": "crs_598",
  "hereford": "crs_624",
  "hexham": "crs_650",
  "huntingdon": "crs_676",
  "kelso": "crs_702",
  "kempton": "crs_728",
  "kempton-aw": "crs_28054",
  "leicester": "crs_780",
  "lingfield": "crs_806",
  "lingfield-aw": "crs_10218",
  "ludlow": "crs_884",
  "market rasen": "crs_910",
  "musselburgh": "crs_416",
  "newbury": "crs_936",
  "newcastle": "crs_962",
  "newcastle-aw": "crs_35178",
  "newcastle (aw)": "crs_35178",
  "newmarket": "crs_988",
  "newton abbot": "crs_1014",
  "nottingham": "crs_1040",
  "perth": "crs_1066",
  "plumpton": "crs_1144",
  "pontefract": "crs_1196",
  "redcar": "crs_1222",
  "ripon": "crs_1274",
  "salisbury": "crs_1352",
  "sandown": "crs_1404",
  "sedgefield": "crs_1482",
  "southwell": "crs_1586",
  "southwell-aw": "crs_10244",
  "stratford": "crs_1742",
  "taunton": "crs_1898",
  "thirsk": "crs_2080",
  "uttoxeter": "crs_2184",
  "warwick": "crs_2210",
  "wetherby": "crs_2262",
  "wincanton": "crs_2340",
  "windsor": "crs_2418",
  "wolverhampton": "crs_2470",
  "wolverhampton-aw": "crs_13338",
  "worcester": "crs_2626",
  "yarmouth": "crs_2704",
  "york": "crs_2782",
  // Irish tracks
  "curragh": "crs_31648",
  "dundalk": "crs_31653",
  "fairyhouse": "crs_31656",
  "galway": "crs_31659", 
  "leopardstown": "crs_31669",
  "punchestown": "crs_31732"
};

/**
 * Types for TheRacingAPI responses
 */
export interface RacingAPIResponse {
  racecards: RacingAPIRacecard[];
}

/**
 * Extended interface for PRO API horse/runner data
 */
export interface RacingAPIRunner {
  horse_id: string;
  horse: string;
  number: string | number;
  jockey: string;
  trainer: string;
  age: string | number;
  weight: string;
  form: string;
  // Additional fields from PRO API
  odds?: {
    fractional?: string;
    decimal?: number;
    best?: number;
  };
}

/**
 * Standard API horse data
 */
export interface RacingAPIHorse {
  horse_id: string;
  horse: string;
  number: string | number;
  jockey: string;
  trainer: string;
  age: string | number;
  weight: string;
  form: string;
}

/**
 * Racecard data from TheRacingAPI
 */
export interface RacingAPIRacecard {
  race_id: string;
  course: string;
  course_id: string;
  race_name: string;
  race_type: string;
  race_class: string;
  race_age: string;
  race_country: string;
  region_code: string;
  region: string;
  off_time: string;
  distance_f: string;
  runners_number: number;
  horses?: RacingAPIHorse[];
  runners?: RacingAPIRunner[];
  // Additional fields from PRO API
  prize?: string | number;
  going?: string;
  surface?: string;
  distance?: string;
}

/**
 * Service for interacting with TheRacingAPI
 */
export class RacingAPIService {
  private static instance: RacingAPIService;
  private trackCodes: Record<string, string> = FALLBACK_TRACK_CODES;
  private lastFetchTime: number = 0;
  private cachedRacecards: RacingAPIRacecard[] | null = null;
  
  // Cache duration in milliseconds (5 minutes)
  private readonly CACHE_DURATION = 5 * 60 * 1000;
  
  private constructor() {
    this.loadTrackCodes();
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): RacingAPIService {
    if (!RacingAPIService.instance) {
      RacingAPIService.instance = new RacingAPIService();
    }
    return RacingAPIService.instance;
  }

  /**
   * Load track codes from file, or use fallback if file is not available
   */
  private loadTrackCodes(): void {
    try {
      // Client-side checks to avoid file system errors in the browser
      if (typeof window !== 'undefined') {
        console.log('Running in browser environment, using fallback track codes');
        return;
      }
      
      // Server-side: attempt to load from file
      try {
        // Use dynamic imports for Node.js modules
        const loadServerSideOnly = async () => {
          try {
            // We need to dynamically import these modules only on the server
            const fs = require('fs');
            const path = require('path');
            
            const trackCodesPath = path.join(process.cwd(), 'track-codes.json');
            if (fs.existsSync(trackCodesPath)) {
              const trackCodesData = fs.readFileSync(trackCodesPath, 'utf8');
              const trackCodes = JSON.parse(trackCodesData);
              this.trackCodes = { ...FALLBACK_TRACK_CODES, ...trackCodes };
              console.log(`Loaded ${Object.keys(this.trackCodes).length} track codes from file`);
            }
          } catch (err) {
            console.warn('Error loading track codes from file:', err);
          }
        };
        
        // Execute the async function immediately
        loadServerSideOnly();
      } catch (fsError) {
        console.warn('Error loading track codes from root directory:', fsError);
      }
      
      // If we get here, use the fallback
      console.log('Using fallback track codes');
    } catch (error) {
      console.error('Error loading track codes:', error);
      console.log('Falling back to default track codes');
    }
  }
  
  /**
   * Get Course ID from track name - uses an improved flexible matching algorithm
   */
  private getCourseId(trackName: string): string | null {
    if (!trackName) return null;
    
    // Clean track name to match format in our codes
    const normalizedTrackName = trackName.toLowerCase().trim()
      .replace(/\s+/g, ' ')
      .replace(/\([^)]*\)/g, '')
      .trim();
    
    // Direct match first
    if (this.trackCodes[normalizedTrackName]) {
      console.log(`Found direct track match for "${trackName}" → "${normalizedTrackName}": ${this.trackCodes[normalizedTrackName]}`);
      return this.trackCodes[normalizedTrackName];
    }
    
    // Check if it's an AW track 
    const awTrackName = `${normalizedTrackName}-aw`;
    if (this.trackCodes[awTrackName]) {
      console.log(`Found AW track match for "${trackName}" → "${awTrackName}": ${this.trackCodes[awTrackName]}`);
      return this.trackCodes[awTrackName];
    }

    // Handle "(AW)" suffix
    const awTrackMatch = trackName.match(/(.+?)\s*(\(AW\))?$/i);
    if (awTrackMatch && awTrackMatch[2]) {
      const baseTrackName = awTrackMatch[1].toLowerCase().trim();
      // Try direct match for base name
      if (this.trackCodes[baseTrackName]) {
        console.log(`Found base track match for "${trackName}" → "${baseTrackName}": ${this.trackCodes[baseTrackName]}`);
        return this.trackCodes[baseTrackName];
      }
      
      // Try AW variant
      const awVariant = `${baseTrackName}-aw`;
      if (this.trackCodes[awVariant]) {
        console.log(`Found AW variant match for "${trackName}" → "${awVariant}": ${this.trackCodes[awVariant]}`);
        return this.trackCodes[awVariant];
      }
    }
    
    // Try substring matching - track name contains our key
    const keys = Object.keys(this.trackCodes);
    for (const key of keys) {
      if (normalizedTrackName.includes(key)) {
        console.log(`Found substring match for "${trackName}" → "${key}": ${this.trackCodes[key]}`);
        return this.trackCodes[key];
      }
    }
    
    // Try substring matching - our key contains track name
    for (const key of keys) {
      if (key.includes(normalizedTrackName)) {
        console.log(`Found reverse substring match for "${trackName}" → "${key}": ${this.trackCodes[key]}`);
        return this.trackCodes[key];
      }
    }
    
    // Log all track codes for debugging
    console.warn(`No course ID found for track: "${trackName}" (normalized: "${normalizedTrackName}")`);
    console.log('Available track codes:', Object.keys(this.trackCodes).join(', '));
    
    return null;
  }
  
  /**
   * Format date for the API request
   */
  private formatDate(dateString: string): string {
    try {
      // Handle legacy 'today' or 'tomorrow' strings - convert to YYYY-MM-DD
      if (dateString === 'today') {
        const today = new Date();
        return format(today, 'yyyy-MM-dd');
      }
      
      if (dateString === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return format(tomorrow, 'yyyy-MM-dd');
      }
      
      // Parse the date string to a Date object
      const inputDate = parseISO(dateString);
      
      // Check if it's a valid date
      if (!isValid(inputDate)) {
        throw new Error('Invalid date format');
      }
      
      // Format the date for the API (YYYY-MM-DD)
      return format(inputDate, 'yyyy-MM-dd');
    } catch (error) {
      // For any parsing errors, log and throw an error
      console.warn(`Invalid date format: ${dateString}`);
      throw new Error('Invalid date format. Please use a valid date in YYYY-MM-DD format');
    }
  }
  
  /**
   * Make an HTTP request to the Racing API
   */
  private async fetchFromAPI<T>(endpoint: string, params: Record<string, any> = {}): Promise<T> {
    try {
      console.log(`Making API request to ${endpoint} with params:`, params);
      
      // Use our internal API proxy to avoid CORS issues
      const queryParams = new URLSearchParams({
        endpoint,
        ...params
      });
      
      // FIXED: Use relative URL paths instead of hardcoding the origin/port
      // This ensures requests work on any port the server is running on
      
      // In the browser, we can use relative paths
      // In server-side code, we need a full URL but don't hardcode the port
      let url = '';
      
      if (typeof window !== 'undefined') {
        // Client-side: Use a relative path (no origin needed)
        url = `/api/racing-api?${queryParams.toString()}`;
      } else {
        // Server-side: We need a full URL, but don't hardcode the port
        // Use environment variable or default to 3000
        const port = process.env.PORT || 3000;
        url = `http://localhost:${port}/api/racing-api?${queryParams.toString()}`;
      }
      
      console.log(`Using proxy URL: ${url}`);
      
      // Set a timeout to prevent hanging requests
      const timeoutMs = 15000; // 15 seconds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      try {
        const response = await axios.get<T>(url, {
          signal: controller.signal,
          timeout: timeoutMs
        });
        
        // Clear the timeout if request completed successfully
        clearTimeout(timeoutId);
        
        console.log(`✅ API request successful - Status: ${response.status}`);
        return response.data;
      } catch (axiosError) {
        // Clear the timeout if we got an error response
        clearTimeout(timeoutId);
        
        if (axios.isAxiosError(axiosError)) {
          if (axiosError.code === 'ECONNABORTED' || axiosError.message.includes('timeout')) {
            console.error(`❌ API request timed out after ${timeoutMs}ms`, axiosError);
            throw new Error(`Racing API request timed out. Please try again.`);
          }
          
          if (axiosError.response) {
            // The request was made and the server responded with a status code
            console.error(`❌ API responded with error ${axiosError.response.status}:`, axiosError.response.data);
            
            if (axiosError.response.status === 422) {
              throw new Error(`The Racing API could not process this request. Please check your parameters.`);
            }
            
            if (axiosError.response.status === 404) {
              throw new Error(`The requested racing data was not found.`);
            }
            
            if (axiosError.response.status === 403 || axiosError.response.status === 401) {
              throw new Error(`Unable to authenticate with The Racing API. Please check your credentials.`);
            }
            
            throw new Error(`Racing API Error: ${axiosError.response.status} - ${axiosError.response.statusText}`);
          } else if (axiosError.request) {
            // The request was made but no response was received
            console.error('❌ No response received from Racing API:', axiosError.message);
            throw new Error(`Unable to connect to Racing API. Please check your internet connection and try again.`);
          } else {
            // Something happened in setting up the request
            console.error('❌ Error setting up request:', axiosError.message);
            throw new Error(`Error setting up Racing API request: ${axiosError.message}`);
          }
        }
        
        // Re-throw other errors
        throw axiosError;
      }
    } catch (error) {
      console.error(`Error fetching from Racing API endpoint ${endpoint}:`, error);
      
      if (axios.isAxiosError(error) && error.response) {
        console.error('API Error Response:', error.response.status, error.response.data);
      }
      
      throw error;
    }
  }

  /**
   * Get racecards for a specific date and optionally filtered by track name
   */
  public async getRacecards(date: string = 'today', trackName?: string, usePro: boolean = false): Promise<RacingAPIRacecard[]> {
    try {
      // Format the date for the API
      const formattedDate = this.formatDate(date);
      console.log(`Getting racecards for date: ${formattedDate}, track: ${trackName || 'all'}, usePro: ${usePro}`);
      
      // If we're looking for a specific track, try to get the course ID
      let courseIds: string[] = [];
      if (trackName) {
        const courseId = this.getCourseId(trackName);
        if (courseId) {
          courseIds = [courseId];
          console.log(`Filtered by course ID: ${courseId} for track: ${trackName}`);
        } else {
          console.warn(`No course ID found for track: ${trackName}, returning all racecards`);
        }
      }
      
      // Check cache first
      const now = Date.now();
      if (
        this.cachedRacecards && 
        (now - this.lastFetchTime < this.CACHE_DURATION) && 
        !courseIds.length && // Only use cache for unfiltered requests
        !usePro // Don't use cache for PRO API requests
      ) {
        console.log('Using cached racecards');
        return this.cachedRacecards;
      }
      
      // Build the request params - TheRacingAPI expects 'day' parameter instead of 'date'
      // Our API route handles this conversion, but we'll use the 'date' parameter consistently
      // in our code for clarity
      const params: Record<string, any> = { date: formattedDate };
      if (courseIds.length) {
        params.course_ids = courseIds.join(',');
      }
      
      // Log the parameters we're sending to help with debugging
      console.log(`Request parameters: ${JSON.stringify(params)}`);
      
      // Make the request to the standard or pro endpoint based on usePro flag
      const endpoint = usePro ? '/racecards/pro' : '/racecards/standard';
      console.log(`Using API endpoint: ${endpoint}`);
      
      const response = await this.fetchFromAPI<RacingAPIResponse>(endpoint, params);
      
      if (!response || !response.racecards) {
        throw new Error('Invalid response from API: No racecards found');
      }
      
      console.log(`Received ${response.racecards.length} racecards from API`);
      
      // Check if we have any racecards
      if (response.racecards.length === 0) {
        console.warn(`No racecards found for ${trackName || 'any track'} on ${formattedDate}`);
      }
      
      // Cache the results for unfiltered requests
      if (!courseIds.length && !usePro) {
        this.cachedRacecards = response.racecards;
        this.lastFetchTime = now;
      }
      
      return response.racecards;
    } catch (error) {
      console.error('Error fetching racecards:', error);
      throw error;
    }
  }
  
  /**
   * Find a race by track name, date, and race number
   */
  public async findRace(trackName: string, date: string, raceNumber?: string): Promise<RacingAPIRacecard | null> {
    try {
      console.log(`Finding race - Track: ${trackName}, Date: ${date}, Race #: ${raceNumber || 'any'}`);
      
      // Get racecards, filtered by track if possible
      const racecards = await this.getRacecards(date, trackName);
      
      if (!racecards || racecards.length === 0) {
        console.log(`No racecards found for ${trackName} on ${date}`);
        return null;
      }
      
      console.log(`Found ${racecards.length} racecards`);
      
      // If we have a specific race number, try to find that race
      if (raceNumber) {
        // Extract numeric part if race number contains text like "Race 3"
        const numericRaceNumber = raceNumber.replace(/\D/g, '');
        
        // Try to find a race that matches by name or time
        for (const card of racecards) {
          // Check if the race name contains the race number
          if (card.race_name.includes(`Race ${numericRaceNumber}`) || 
              card.race_name.includes(`Race ${raceNumber}`)) {
            console.log(`Found race by name: ${card.race_name}`);
            return card;
          }
          
          // Check off time - some APIs format race numbers by time
          const offTimeHour = card.off_time.split(':')[0];
          const offTimeMinute = card.off_time.split(':')[1];
          
          if (offTimeHour === numericRaceNumber || 
              `${offTimeHour}:${offTimeMinute}` === raceNumber) {
            console.log(`Found race by time: ${card.off_time}`);
            return card;
          }
        }
        
        // If specific race not found, but we have racecards for the track and date,
        // return the first one as a fallback
        console.log(`Specific race #${raceNumber} not found, using first available race`);
        return racecards[0];
      }
      
      // If no race number provided, just return the first race at the track
      return racecards[0];
    } catch (error) {
      console.error('Error finding race:', error);
      throw error;
    }
  }
  
  /**
   * Find a horse in a race using fuzzy matching
   */
  public async findHorseWithFuzzyMatch(race: RacingAPIRacecard, horseName: string, threshold: number = 0.8): Promise<RacingAPIHorse | null> {
    if (!race) {
      console.log('No race provided');
      return null;
    }
    
    // Check if the race has horses or runners (different API responses use different fields)
    const horses = race.horses || [];
    const runners = race.runners || [];
    
    if (horses.length === 0 && runners.length === 0) {
      console.log(`No horses/runners in race: ${race.course} ${race.race_name}`);
      return null;
    }
    
    // Log what we're working with
    const horseSource = horses.length > 0 ? 'horses' : 'runners';
    const horseCount = horses.length > 0 ? horses.length : runners.length;
    console.log(`Looking for horse "${horseName}" among ${horseCount} entries in ${horseSource} array`);
    
    // Clean the horse name for comparison
    const cleanHorseName = horseName.toLowerCase().trim();
    
    if (horses.length > 0) {
      // Using horses array
      // Try exact match first
      const exactMatch = horses.find(
        h => h.horse.toLowerCase().trim() === cleanHorseName
      );
      
      if (exactMatch) {
        console.log(`Found exact match in horses: ${exactMatch.horse}`);
        return exactMatch;
      }
      
      // Try fuzzy matching using Levenshtein distance
      let bestMatch: RacingAPIHorse | null = null;
      let bestScore = 0;
      
      for (const horse of horses) {
        const score = this.levenshteinSimilarity(cleanHorseName, horse.horse.toLowerCase().trim());
        
        if (score > bestScore && score >= threshold) {
          bestScore = score;
          bestMatch = horse;
        }
      }
      
      if (bestMatch) {
        console.log(`Found fuzzy match in horses: "${bestMatch.horse}" with score ${bestScore.toFixed(2)}`);
        return bestMatch;
      }
    } else if (runners.length > 0) {
      // Using runners array
      // Try exact match first
      const exactMatch = runners.find(
        h => h.horse.toLowerCase().trim() === cleanHorseName
      );
      
      if (exactMatch) {
        console.log(`Found exact match in runners: ${exactMatch.horse}`);
        // Convert runner to horse format
        return this.convertRunnerToHorse(exactMatch);
      }
      
      // Try fuzzy matching using Levenshtein distance
      let bestMatch: RacingAPIRunner | null = null;
      let bestScore = 0;
      
      for (const runner of runners) {
        const score = this.levenshteinSimilarity(cleanHorseName, runner.horse.toLowerCase().trim());
        
        if (score > bestScore && score >= threshold) {
          bestScore = score;
          bestMatch = runner;
        }
      }
      
      if (bestMatch) {
        console.log(`Found fuzzy match in runners: "${bestMatch.horse}" with score ${bestScore.toFixed(2)}`);
        // Convert runner to horse format
        return this.convertRunnerToHorse(bestMatch);
      }
    }
    
    console.log(`No horse matched "${horseName}" above threshold ${threshold}`);
    return null;
  }
  
  /**
   * Convert a RacingAPIRunner to RacingAPIHorse for consistent API
   */
  private convertRunnerToHorse(runner: RacingAPIRunner): RacingAPIHorse {
    return {
      horse_id: runner.horse_id,
      horse: runner.horse,
      number: runner.number || "",
      jockey: runner.jockey,
      trainer: runner.trainer,
      age: runner.age,
      weight: runner.weight || "",
      form: runner.form || ""
    };
  }
  
  /**
   * Calculate similarity between two strings using Levenshtein distance
   * Returns a value between 0 and 1, where 1 means exact match
   */
  private levenshteinSimilarity(a: string, b: string): number {
    if (a === b) return 1;
    
    const aLen = a.length;
    const bLen = b.length;
    
    if (aLen === 0 || bLen === 0) {
      return 0;
    }
    
    const matrix: number[][] = Array(aLen + 1).fill(null).map(() => Array(bLen + 1).fill(0));
    
    for (let i = 0; i <= aLen; i++) {
      matrix[i][0] = i;
    }
    
    for (let j = 0; j <= bLen; j++) {
      matrix[0][j] = j;
    }
    
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
}

// Export a singleton instance
export const racingAPIService = RacingAPIService.getInstance(); 