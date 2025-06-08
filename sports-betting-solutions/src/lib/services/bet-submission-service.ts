import { createClient } from '@supabase/supabase-js';

// Environment variables for Supabase connection
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gwvnmzflxttdlhrkejmy.supabase.co';

// For authenticated operations, use the service role key instead of anon key
// This allows bypassing RLS policies
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3dm5temZseHR0ZGxocmtlam15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzkwODc5NSwiZXhwIjoyMDQ5NDg0Nzk1fQ.5FcuTSXJJLGhfnAVhOEKACTBGCxiDMdMIQeOR2n19eI';

// Anonymous key for public operations
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3dm5temZseHR0ZGxocmtlam15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5MDg3OTUsImV4cCI6MjA0OTQ4NDc5NX0.SppgaGx3B0NVXOqM-Myqn2GSW7JxO-lpP7Akr5I3I2g';

// Create Supabase clients
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Constants - match those in bet-entry-form
const VERIFIED_HORSES_STORAGE_KEY = 'verified_horses_data';

// Define bet type information (number of horses needed and bet components)
interface BetTypeInfo {
  requiredHorses: number;
  components: { type: string; count: number }[];
  description: string;
}

// Bet type definitions
const BET_TYPES: Record<string, BetTypeInfo> = {
  'single': {
    requiredHorses: 1,
    components: [{ type: 'single', count: 1 }],
    description: 'Bet on a single horse'
  },
  'double': {
    requiredHorses: 2,
    components: [{ type: 'double', count: 1 }],
    description: 'Bet on 2 horses to win'
  },
  'treble': {
    requiredHorses: 3,
    components: [{ type: 'treble', count: 1 }],
    description: 'Bet on 3 horses to win'
  },
  '4fold': {
    requiredHorses: 4,
    components: [{ type: '4fold', count: 1 }],
    description: 'Bet on 4 horses to win'
  },
  '5fold': {
    requiredHorses: 5,
    components: [{ type: '5fold', count: 1 }],
    description: 'Bet on 5 horses to win'
  },
  'trixie': {
    requiredHorses: 3,
    components: [
      { type: 'double', count: 3 },
      { type: 'treble', count: 1 }
    ],
    description: '4 bets: 3 doubles and 1 treble'
  },
  'patent': {
    requiredHorses: 3,
    components: [
      { type: 'single', count: 3 },
      { type: 'double', count: 3 },
      { type: 'treble', count: 1 }
    ],
    description: '7 bets: 3 singles, 3 doubles and 1 treble'
  },
  'yankee': {
    requiredHorses: 4,
    components: [
      { type: 'double', count: 6 },
      { type: 'treble', count: 4 },
      { type: '4fold', count: 1 }
    ],
    description: '11 bets: 6 doubles, 4 trebles, and 1 four-fold'
  },
  'super_yankee': {
    requiredHorses: 5,
    components: [
      { type: 'double', count: 10 },
      { type: 'treble', count: 10 },
      { type: '4fold', count: 5 },
      { type: '5fold', count: 1 }
    ],
    description: '26 bets: 10 doubles, 10 trebles, 5 four-folds, and 1 five-fold'
  },
  'lucky_15': {
    requiredHorses: 4,
    components: [
      { type: 'single', count: 4 },
      { type: 'double', count: 6 },
      { type: 'treble', count: 4 },
      { type: '4fold', count: 1 }
    ],
    description: '15 bets: 4 singles, 6 doubles, 4 trebles, and 1 four-fold'
  },
  'lucky_31': {
    requiredHorses: 5,
    components: [
      { type: 'single', count: 5 },
      { type: 'double', count: 10 },
      { type: 'treble', count: 10 },
      { type: '4fold', count: 5 },
      { type: '5fold', count: 1 }
    ],
    description: '31 bets: 5 singles, 10 doubles, 10 trebles, 5 four-folds, and 1 five-fold'
  }
};

interface HorseData {
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
  odds?: string; // Individual horse odds
}

interface StoredHorseData {
  horses: HorseData[];
  timestamp: number;
}

interface BetFormData {
  bet_type: string;
  each_way: boolean;
  stake: string;
  odds: string;
  bookmaker: string;
  model_tipster: string;
  notes: string;
}

/**
 * Database fields - matches exactly the schema we have in Supabase
 * This only includes fields that exist in the database
 */
interface DbBetRecord {
  id?: string;
  user_id: string;
  track_name: string;
  race_number: number | null;
  race_date: string;
  scheduled_race_time: string | null;
  race_location: string | null;
  bet_type: string;
  stake: number;
  odds: number;
  each_way: boolean;
  status: 'Pending' | 'Won' | 'Lost' | 'Void' | 'Cash Out';
  returns: number | null;
  profit_loss: number | null;
  closing_odds: number | null;
  closing_line_value: number | null;
  rule_4_applied: boolean | null;
  rule_4_deduction: number | null;
  rule_4_adjusted_odds: number | null;
  model: string | null;
  bookmaker: string | null;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
  post_position: string | null;
  jockey: string | null;
  trainer: string | null;
  best_odds: number | null;
  class_type: string | null;
  purse: string | null;
  distance: string | null;
  horse_name: string;
  surface: string | null;
  going: string | null;
  horse_number: string | null;
}

/**
 * BetRecord combines database fields with client-side properties
 */
interface BetRecord extends DbBetRecord {
  // Client-side only fields (not in DB)
  additional_horses?: AdditionalHorseRecord[];
  parent_bet_id?: string | null;
  component_type?: string | null; 
  manual_entry?: boolean; 
  verification_details?: string | null;
}

interface AdditionalHorseRecord {
  bet_id: string;
  horse_name: string;
  track_name: string;
  race_number: number | null;
  race_date: string;
  jockey: string | null;
  trainer: string | null;
  odds: number | null;
  class_type: string | null;
  distance: string | null;
  scheduled_race_time: string | null;
  post_position: string | null;
  best_odds: number | null;
  surface: string | null;
  going: string | null;
  purse: string | null;
  horse_number: string | null;
}

interface SubmissionResult {
  success: boolean;
  data?: BetRecord;
  error?: string;
  details?: string;
}

// Define a combination generator helper function
function getCombinations(array: any[], size: number): any[][] {
  if (size === 1) return array.map(item => [item]);
  
  return array.reduce((acc, item, i) => {
    const remainingItems = array.slice(i + 1);
    const combinations = getCombinations(remainingItems, size - 1);
    const result = combinations.map(combination => [item, ...combination]);
    return [...acc, ...result];
  }, []);
}

export class BetSubmissionService {
  private static instance: BetSubmissionService;

  private constructor() {
    console.log('Initializing BetSubmissionService with service role for admin operations');
  }

  public static getInstance(): BetSubmissionService {
    if (!BetSubmissionService.instance) {
      BetSubmissionService.instance = new BetSubmissionService();
    }
    return BetSubmissionService.instance;
  }

  /**
   * Get stored horse data from localStorage
   */
  private getStoredHorseData(): StoredHorseData | null {
    try {
      // Safe check for browser environment
      if (typeof window === 'undefined') return null;
      
      const savedHorsesJSON = localStorage.getItem(VERIFIED_HORSES_STORAGE_KEY);
      if (!savedHorsesJSON) return null;
      
      return JSON.parse(savedHorsesJSON) as StoredHorseData;
    } catch (error) {
      console.error('Error retrieving stored horse data:', error);
      return null;
    }
  }

  /**
   * Get the currently authenticated user
   */
  private async getCurrentUser(): Promise<{ id: string; email: string | null } | null> {
    try {
      console.log('Getting current user session from server-side...');
      
      // First try the getSession method (server-side)
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        return null;
      }
      
      if (!session) {
        console.log('No active session found, checking for user in context...');
        
        // Try getting the user directly as a fallback
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error('User error:', userError);
          return null;
        }
        
        if (user) {
          console.log(`Found authenticated user: ${user.id} (${user.email || 'unknown email'})`);
          return {
            id: user.id,
            email: user.email || null
          };
        }
        
        console.error('No authenticated user found in either session or direct user check');
        return null;
      }
      
      console.log(`Found user session for ${session.user.email || 'unknown email'}`);
      return {
        id: session.user.id,
        email: session.user.email || null
      };
    } catch (error) {
      console.error('Error getting user session:', error);
      return null;
    }
  }

  /**
   * Parse odds from a string to decimal format
   */
  private parseOdds(oddsString: string): number | null {
    try {
      if (!oddsString || oddsString.trim() === '') return null;
      
      if (oddsString.includes('/')) {
        // Parse fractional odds (e.g., "6/4" becomes 2.5)
        const [numerator, denominator] = oddsString.split('/').map(Number);
        if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
          console.error('Invalid fractional odds format:', oddsString);
          return null;
        }
        return (numerator / denominator) + 1;
      } else {
        const odds = parseFloat(oddsString);
        if (isNaN(odds) || odds <= 0) {
          console.error('Invalid decimal odds:', oddsString);
          return null;
        }
        return odds;
      }
    } catch (e) {
      console.error('Error parsing odds:', e);
      return null;
    }
  }
  
  /**
   * Calculate combined odds for multiple selections
   */
  private calculateCombinedOdds(horseOdds: number[]): number {
    // Multiply all odds together to get the accumulator odds
    return horseOdds.reduce((total, odds) => total * odds, 1);
  }
  
  /**
   * Process race number to ensure consistent format
   */
  private processRaceNumber(raceNumberStr: string | undefined): number | null {
    try {
      if (!raceNumberStr || raceNumberStr.trim() === '') return null;
      
      // Try to extract just numeric values if it's a time format
      if (raceNumberStr.includes(':')) {
        // Convert time format (e.g. "2:32") to numeric format (e.g. 232)
        const numericValue = parseInt(raceNumberStr.replace(/:/g, ''));
        return isNaN(numericValue) ? null : numericValue;
      } else {
        const numericValue = parseInt(raceNumberStr);
        return isNaN(numericValue) ? null : numericValue;
      }
    } catch (e) {
      console.warn('Error parsing race_number:', e);
      return null;
    }
  }
  
  /**
   * Format multiple horse names for display
   */
  private formatMultipleHorseNames(horses: HorseData[]): string {
    return horses.map(horse => horse.horse_name).join(' / ');
  }
  
  /**
   * Format multiple track names for display
   */
  private formatMultipleTrackNames(horses: HorseData[]): string {
    return horses.map(horse => horse.track_name).join(' / ');
  }
  
  /**
   * Format multiple jockey names for display
   */
  private formatMultipleJockeys(horses: HorseData[]): string {
    return horses.map(horse => horse.jockey || horse.jockey_name || '').join(' / ');
  }
  
  /**
   * Format multiple trainer names for display
   */
  private formatMultipleTrainers(horses: HorseData[]): string {
    return horses.map(horse => horse.trainer || horse.trainer_name || '').join(' / ');
  }
  
  /**
   * Format multiple post positions for display
   */
  private formatMultiplePostPositions(horses: HorseData[]): string | null {
    const positions = horses.map(horse => 
      horse.post_position ? horse.post_position.toString() : ''
    ).filter(pos => pos !== '');
    
    return positions.length > 0 ? positions.join(' / ') : null;
  }
  
  /**
   * Format multiple horse numbers for display
   */
  private formatMultipleHorseNumbers(horses: HorseData[]): string | null {
    const numbers = horses.map(horse => 
      horse.horse_number ? horse.horse_number.toString() : ''
    ).filter(num => num !== '');
    
    return numbers.length > 0 ? numbers.join(' / ') : null;
  }
  
  /**
   * Format multiple race dates for display
   */
  private formatMultipleRaceDates(horses: HorseData[]): string {
    const dates = horses.map(horse => horse.race_date).filter(date => date && date.trim() !== '');
    
    if (dates.length === 0) {
      // If no valid dates, use today's date as fallback
      const today = new Date();
      return today.toISOString().split('T')[0]; // YYYY-MM-DD format
    }
    
    // For multiple horses, use the earliest date
    if (dates.length > 1) {
      try {
        // Convert strings to Date objects for comparison
        const dateObjects = dates.map(dateStr => new Date(dateStr));
        
        // Sort dates in ascending order
        dateObjects.sort((a, b) => a.getTime() - b.getTime());
        
        // Return the earliest date in YYYY-MM-DD format
        return dateObjects[0].toISOString().split('T')[0];
      } catch (e) {
        console.warn('Error sorting dates:', e);
        // Return the first date as fallback
        return dates[0];
      }
    }
    
    return dates[0];
  }
  
  /**
   * Format multiple race numbers for display
   */
  private formatMultipleRaceNumbers(horses: HorseData[]): number | null {
    const raceNumbers = horses.map(horse => {
      // Safely extract the race number by checking if it's defined first
      if (horse.race_number || horse.scheduled_time) {
        return this.extractRaceNumber(
          typeof horse.race_number === 'string' ? horse.race_number : undefined, 
          typeof horse.scheduled_time === 'string' ? horse.scheduled_time : undefined
        );
      }
      return null;
    }).filter(num => num !== null);
    
    return raceNumbers.length > 0 ? parseInt(raceNumbers.join('')) : null;
  }
  
  /**
   * Format multiple scheduled race times for display
   */
  private formatMultipleScheduledTimes(horses: HorseData[]): string | null {
    const times = horses.map(horse => 
      this.formatRaceTime(horse.scheduled_time)
    ).filter(time => time !== null) as string[];
    
    if (times.length === 0) return null;
    
    // For multiple horses, use the earliest time instead of joining with slashes
    if (times.length > 1) {
      // Sort times in ascending order
      times.sort((a, b) => a.localeCompare(b));
      // Return the earliest time
      return times[0];
    }
    
    return times[0];
  }
  
  /**
   * Format multiple class types for display
   */
  private formatMultipleClassTypes(horses: HorseData[]): string | null {
    const classes = horses.map(horse => {
      // Get class from either class_type or race_class field
      let classType = horse.class_type || horse.race_class || '';
      
      // If still empty, try to infer from other data
      if (!classType && horse.verification_details) {
        // Check if verification details mention class
        const details = horse.verification_details.toLowerCase();
        if (details.includes('handicap')) {
          classType = 'Handicap';
        } else if (details.includes('maiden')) {
          classType = 'Maiden';
        } else if (details.includes('claimer') || details.includes('claiming')) {
          classType = 'Claimer';
        } else if (details.includes('group')) {
          classType = details.includes('group 1') ? 'G1' : 
                     details.includes('group 2') ? 'G2' : 
                     details.includes('group 3') ? 'G3' : 'Group';
        } else if (details.includes('listed')) {
          classType = 'Listed';
        } else if (details.includes('stakes')) {
          classType = 'Stakes';
        } else if (details.includes('novice')) {
          classType = 'Novice';
        } else if (details.includes('g1') || details.includes('grade 1')) {
          classType = 'G1';
        } else if (details.includes('g2') || details.includes('grade 2')) {
          classType = 'G2';
        } else if (details.includes('g3') || details.includes('grade 3')) {
          classType = 'G3';
        } else if (details.includes('class 1')) {
          classType = 'Class 1';
        } else if (details.includes('class 2')) {
          classType = 'Class 2';
        } else if (details.includes('class 3')) {
          classType = 'Class 3';
        } else if (details.includes('class 4')) {
          classType = 'Class 4';
        } else if (details.includes('class 5')) {
          classType = 'Class 5';
        } else if (details.includes('class 6')) {
          classType = 'Class 6';
        } else if (details.includes('class 7')) {
          classType = 'Class 7';
        }
      }
      
      return classType;
    }).filter(cls => cls !== '');
    
    return classes.length > 0 ? classes.join(' / ') : null;
  }
  
  /**
   * Format multiple distances for display
   */
  private formatMultipleDistances(horses: HorseData[]): string | null {
    const distances = horses.map(horse => 
      this.convertDistanceToFurlongs(horse.race_distance)
    ).filter(dist => dist !== null);
    
    return distances.length > 0 ? distances.join(' / ') : null;
  }
  
  /**
   * Format multiple surface types for display
   */
  private formatMultipleSurfaces(horses: HorseData[]): string | null {
    const surfaces = horses.map(horse => 
      horse.surface_type || ''
    ).filter(surface => surface !== '');
    
    return surfaces.length > 0 ? surfaces.join(' / ') : null;
  }
  
  /**
   * Format multiple going/conditions for display
   */
  private formatMultipleGoings(horses: HorseData[]): string | null {
    const goings = horses.map(horse => 
      horse.going || ''
    ).filter(going => going !== '');
    
    return goings.length > 0 ? goings.join(' / ') : null;
  }
  
  /**
   * Format multiple purse values for display
   */
  private formatMultiplePurses(horses: HorseData[]): string | null {
    const purses = horses.map(horse => {
      const value = this.parsePurseValue(horse);
      return value !== null ? value.toString() : '';
    }).filter(purse => purse !== '');
    
    return purses.length > 0 ? purses.join(' / ') : null;
  }
  
  /**
   * Format multiple best odds for display
   */
  private formatMultipleBestOdds(horses: HorseData[]): number | null {
    // First parse and validate each horse's odds
    const bestOdds = horses.map(horse => {
      let odds = null;
      
      // Try best_odds first
      if (horse.best_odds && !isNaN(parseFloat(horse.best_odds))) {
        odds = parseFloat(horse.best_odds);
      } 
      // Fall back to morning_line_odds
      else if (horse.morning_line_odds && !isNaN(parseFloat(horse.morning_line_odds))) {
        odds = parseFloat(horse.morning_line_odds);
      }
      
      // Ensure any valid odds are rounded to 2 decimal places
      return odds !== null ? this.roundToTwoDecimals(odds) : null;
    }).filter(odds => odds !== null) as number[];
    
    if (bestOdds.length === 0) return null;
    
    // If we have multiple horses, calculate combined odds by multiplying them
    if (bestOdds.length > 1) {
      return this.roundToTwoDecimals(this.calculateCombinedOdds(bestOdds));
    }
    
    // Single horse case
    return bestOdds[0]; // Already rounded above
  }
  
  /**
   * Format multiple race locations for display
   */
  private formatMultipleRaceLocations(horses: HorseData[]): string | null {
    const locations = horses.map(horse => 
      this.getRaceLocation(horse.track_name)
    );
    
    return locations.length > 0 ? locations.join(' / ') : null;
  }

  /**
   * Determine the race location (country) based on track name
   */
  private getRaceLocation(trackName: string): string {
    if (!trackName) return 'Unknown';
    
    const lowerTrack = trackName.toLowerCase().trim();
    
    // Check for explicitly mentioned countries
    if (lowerTrack.includes('(uk)') || lowerTrack.includes(' uk ') || lowerTrack.includes('uk)') || lowerTrack.includes('(gb)')) {
      return 'UK';
    }
    
    if (lowerTrack.includes('(ire)') || lowerTrack.includes('(ie)') || lowerTrack.includes(' ire ') || lowerTrack.includes('ireland')) {
      return 'Ireland';
    }
    
    if (lowerTrack.includes('(fr)') || lowerTrack.includes(' fr ') || lowerTrack.includes('france')) {
      return 'France';
    }
    
    if (lowerTrack.includes('(usa)') || lowerTrack.includes(' usa ') || lowerTrack.includes('(us)')) {
      return 'USA';
    }
    
    if (lowerTrack.includes('(aus)') || lowerTrack.includes(' aus ') || lowerTrack.includes('australia')) {
      return 'Australia';
    }
    
    if (lowerTrack.includes('(nz)') || lowerTrack.includes(' nz ') || lowerTrack.includes('zealand')) {
      return 'New Zealand';
    }
    
    if (lowerTrack.includes('(jpn)') || lowerTrack.includes(' jpn ') || lowerTrack.includes('japan')) {
      return 'Japan';
    }
    
    if (lowerTrack.includes('(uae)') || lowerTrack.includes(' uae ') || lowerTrack.includes('dubai') || lowerTrack.includes('meydan')) {
      return 'UAE';
    }
    
    if (lowerTrack.includes('(can)') || lowerTrack.includes(' can ') || lowerTrack.includes('canada')) {
      return 'Canada';
    }
    
    if (lowerTrack.includes('(sa)') || lowerTrack.includes('south africa')) {
      return 'South Africa';
    }
    
    if (lowerTrack.includes('(hk)') || lowerTrack.includes(' hk ') || lowerTrack.includes('hong kong')) {
      return 'Hong Kong';
    }
    
    if (lowerTrack.includes('(sin)') || lowerTrack.includes('singapore')) {
      return 'Singapore';
    }
    
    // Check for common track names in different countries
    // UK tracks
    const ukTracks = [
      'ascot', 'newmarket', 'goodwood', 'york', 'epsom', 'cheltenham', 'aintree', 'doncaster', 
      'sandown', 'kempton', 'lingfield', 'windsor', 'newbury', 'haydock', 'leicester', 'nottingham',
      'pontefract', 'redcar', 'ripon', 'southwell', 'thirsk', 'wetherby', 'wolverhampton', 'yarmouth',
      'musselburgh', 'perth', 'ayr', 'kelso', 'hamilton', 'hexham', 'fontwell', 'bath', 'beverley', 
      'brighton', 'carlisle', 'catterick', 'chepstow', 'exeter', 'fakenham', 'ffos las', 'hereford', 
      'huntingdon', 'ludlow', 'market rasen', 'newton abbot', 'plumpton', 'salisbury', 'sedgefield',
      'stratford', 'taunton', 'towcester', 'uttoxeter', 'warwick', 'wincanton', 'worcester'
    ];
    
    // Irish tracks
    const irishTracks = [
      'curragh', 'dundalk', 'fairyhouse', 'galway', 'leopardstown', 'punchestown', 'naas', 
      'gowran park', 'tipperary', 'tramore', 'cork', 'limerick', 'listowel', 'navan', 'sligo', 
      'down royal', 'downpatrick', 'ballinrobe', 'bellewstown', 'clonmel', 'kilbeggan', 'killarney', 
      'laytown', 'roscommon', 'thurles', 'wexford'
    ];
    
    // French tracks
    const frenchTracks = [
      'longchamp', 'chantilly', 'deauville', 'auteuil', 'saint-cloud', 'maisons-laffitte', 
      'compiegne', 'clairefontaine', 'vichy', 'lyon', 'marseille', 'cagnes-sur-mer', 'pau'
    ];
    
    // USA tracks
    const usaTracks = [
      'belmont', 'saratoga', 'churchill downs', 'santa anita', 'aqueduct', 'keeneland', 'del mar', 
      'pimlico', 'gulfstream', 'monmouth', 'oaklawn', 'turfway', 'arlington', 'laurel', 'tampa bay', 
      'golden gate', 'fair grounds', 'remington', 'woodbine', 'finger lakes', 'hawthorne', 'parx'
    ];
    
    // Check track name against each country's track list
    for (const track of ukTracks) {
      if (lowerTrack.includes(track)) {
        return 'UK';
      }
    }
    
    for (const track of irishTracks) {
      if (lowerTrack.includes(track)) {
        return 'Ireland';
      }
    }
    
    for (const track of frenchTracks) {
      if (lowerTrack.includes(track)) {
        return 'France';
      }
    }
    
    for (const track of usaTracks) {
      if (lowerTrack.includes(track)) {
        return 'USA';
      }
    }
    
    // If we couldn't identify the country based on track name, return a default
    console.log(`Could not identify country for track: ${trackName}, using "Unknown"`);
    return 'Unknown';
  }

  /**
   * Convert race distance to furlongs
   * Examples: "6f" -> 6, "7f 100y" -> 7.5, "1m" -> 8, "1m 2f" -> 10
   */
  private convertDistanceToFurlongs(distanceStr: string | undefined): number | null {
    try {
      if (!distanceStr || distanceStr.trim() === '') return null;
      
      const distanceString = distanceStr.toLowerCase().trim();
      let furlongs = 0;
      
      // Extract miles
      if (distanceString.includes('m')) {
        const milesMatch = distanceString.match(/(\d+)m/);
        if (milesMatch && milesMatch[1]) {
          const miles = parseInt(milesMatch[1]);
          furlongs += miles * 8; // 1 mile = 8 furlongs
        }
      }
      
      // Extract furlongs
      if (distanceString.includes('f')) {
        const furlongsMatch = distanceString.match(/(\d+)f/);
        if (furlongsMatch && furlongsMatch[1]) {
          furlongs += parseInt(furlongsMatch[1]);
        }
      }
      
      // Extract yards and convert to furlongs (1 furlong = 220 yards)
      if (distanceString.includes('y')) {
        const yardsMatch = distanceString.match(/(\d+)y/);
        if (yardsMatch && yardsMatch[1]) {
          const yards = parseInt(yardsMatch[1]);
          furlongs += yards / 220;
        }
      }
      
      // Handle fractions (e.g., "1/2f")
      if (distanceString.includes('/')) {
        const fractionMatch = distanceString.match(/(\d+)\/(\d+)f/);
        if (fractionMatch && fractionMatch[1] && fractionMatch[2]) {
          const numerator = parseInt(fractionMatch[1]);
          const denominator = parseInt(fractionMatch[2]);
          if (denominator !== 0) {
            furlongs += numerator / denominator;
          }
        }
      }
      
      return parseFloat(furlongs.toFixed(2)); // Round to 2 decimal places
    } catch (e) {
      console.warn('Error parsing race distance:', e);
      return null;
    }
  }
  
  /**
   * Round a number to 2 decimal places
   */
  private roundToTwoDecimals(num: number | null): number | null {
    if (num === null) return null;
    return Math.round((num + Number.EPSILON) * 100) / 100;
  }
  
  /**
   * Format a race time from "2:32" to a proper time format "14:32:00"
   */
  private formatRaceTime(timeStr: string | undefined): string | null {
    if (!timeStr || timeStr.trim() === '') return null;
    
    try {
      // Check if it already has the right format
      if (timeStr.match(/^\d{2}:\d{2}:\d{2}$/)) return timeStr;
      
      // Format "2:32" to "14:32:00" assuming all races are PM
      if (timeStr.match(/^\d{1,2}:\d{2}$/)) {
        const [hours, minutes] = timeStr.split(':').map(n => parseInt(n));
        const formattedHours = (hours < 12) ? hours + 12 : hours;
        return `${formattedHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
      }
      
      return timeStr;
    } catch (e) {
      console.warn('Error formatting race time:', e);
      return timeStr;
    }
  }
  
  /**
   * Extract race number from time or directly from race_number field
   */
  private extractRaceNumber(raceNumber: string | undefined, scheduledTime: string | undefined): number | null {
    // If we have a numeric race number already, use it
    if (raceNumber && /^\d+$/.test(raceNumber)) {
      return parseInt(raceNumber);
    }
    
    // If we have a time-based race number (like "2:32"), convert to numeric by removing colons
    if (typeof raceNumber === 'string' && raceNumber.includes(':')) {
      return parseInt(raceNumber.replace(/:/g, ''));
    }
    
    // If we have a scheduled time but no race number, try to use that
    if (typeof scheduledTime === 'string' && scheduledTime.includes(':')) {
      return parseInt(scheduledTime.replace(/:/g, ''));
    }
    
    // If we still can't determine, default to null
    return null;
  }

  /**
   * Create a bet record for a specific selection or combination
   */
  private createBetRecord(
    userId: string,
    baseFormData: BetFormData,
    selectedHorses: HorseData[],
    componentType: string,
    betUnit: number,
    parentBetId?: string
  ): BetRecord {
    // Calculate the odds for this specific combination
    const horseOdds: number[] = [];
    
    for (const horse of selectedHorses) {
      const odds = horse.odds 
        ? this.parseOdds(horse.odds)
        : horse.best_odds 
          ? this.parseOdds(horse.best_odds) 
          : horse.morning_line_odds
            ? this.parseOdds(horse.morning_line_odds)
            : null;
            
      if (odds) {
        horseOdds.push(odds);
      } else {
        console.warn(`Missing odds for horse ${horse.horse_name}, using default 1.0`);
        horseOdds.push(1.0);
      }
    }
    
    const combinedOdds = this.calculateCombinedOdds(horseOdds);
    const stake = parseFloat(baseFormData.stake) * betUnit;
    
    // For Pending bets, don't calculate returns or profit/loss (leave them null)
    // These will be filled in when the bet status is updated
    const returns = null;
    const profitLoss = null;
    
    // Format all horse-specific fields for multi-horse display
    const horseNames = this.formatMultipleHorseNames(selectedHorses);
    const trackNames = this.formatMultipleTrackNames(selectedHorses);
    const jockeys = this.formatMultipleJockeys(selectedHorses);
    const trainers = this.formatMultipleTrainers(selectedHorses);
    const postPositions = this.formatMultiplePostPositions(selectedHorses);
    const horseNumbers = this.formatMultipleHorseNumbers(selectedHorses);
    const raceDates = this.formatMultipleRaceDates(selectedHorses);
    const raceNumbers = this.formatMultipleRaceNumbers(selectedHorses);
    const scheduledRaceTimes = this.formatMultipleScheduledTimes(selectedHorses);
    const classTypes = this.formatMultipleClassTypes(selectedHorses);
    const distances = this.formatMultipleDistances(selectedHorses);
    const surfaces = this.formatMultipleSurfaces(selectedHorses);
    const goings = this.formatMultipleGoings(selectedHorses);
    const purses = this.formatMultiplePurses(selectedHorses);
    const bestOdds = this.formatMultipleBestOdds(selectedHorses);
    const raceLocations = this.formatMultipleRaceLocations(selectedHorses);
    
    return {
      user_id: userId,
      bet_type: componentType,
      component_type: componentType,
      parent_bet_id: parentBetId || null,
      horse_name: horseNames,
      track_name: trackNames,
      race_number: raceNumbers,
      race_date: raceDates,
      jockey: jockeys,
      trainer: trainers,
      each_way: baseFormData.each_way,
      stake: this.roundToTwoDecimals(stake) || 0,
      odds: this.roundToTwoDecimals(combinedOdds) || 0,
      bookmaker: baseFormData.bookmaker || null,
      model: baseFormData.model_tipster || null,
      notes: baseFormData.notes || null,
      status: 'Pending',
      returns: returns, // Now null for pending bets
      profit_loss: profitLoss, // Now null for pending bets
      class_type: classTypes,
      distance: distances,
      scheduled_race_time: scheduledRaceTimes,
      post_position: postPositions,
      best_odds: bestOdds,
      manual_entry: false, // Not in DB schema
      verification_details: null, // Not in DB schema
      surface: surfaces,
      going: goings,
      purse: purses,
      horse_number: horseNumbers,
      race_location: raceLocations,
      closing_odds: null,
      closing_line_value: null,
      rule_4_applied: null,
      rule_4_deduction: null,
      rule_4_adjusted_odds: null,
    };
  }
  
  /**
   * Generate all the component bets for a complex bet type
   */
  private generateComponentBets(
    userId: string,
    formData: BetFormData,
    horses: HorseData[]
  ): BetRecord[] {
    const betTypeKey = formData.bet_type as keyof typeof BET_TYPES;
    const betTypeInfo = BET_TYPES[betTypeKey];
    
    if (!betTypeInfo) {
      console.error(`Unknown bet type: ${formData.bet_type}`);
      return [];
    }
    
    // For simple bet types like single, double, treble, etc.
    if (betTypeInfo.components.length === 1 && 
        betTypeInfo.components[0].type === formData.bet_type && 
        betTypeInfo.components[0].count === 1) {
      return [this.createBetRecord(userId, formData, horses, formData.bet_type, 1)];
    }
    
    // For complex bet types like trixie, patent, yankee, etc.
    const componentBets: BetRecord[] = [];
    
    // Create a "parent" bet record to group all components
    const parentBet = this.createBetRecord(userId, formData, horses, formData.bet_type, 1);
    componentBets.push(parentBet);
    
    // Generate all the component bets
    if (!parentBet.id) {
      // This is a temporary ID for linking the bets before database insert
      parentBet.id = `temp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    
    // Calculate the unit stake (total stake divided by number of bets)
    let totalBets = 0;
    for (const component of betTypeInfo.components) {
      totalBets += component.count;
    }
    
    const unitStake = 1 / totalBets;
    console.log(`Total bets: ${totalBets}, unit stake: ${unitStake}`);
    
    // Generate each component type
    for (const component of betTypeInfo.components) {
      const { type, count } = component;
      const selectionSize = this.getSelectionSizeForType(type);
      
      if (selectionSize > 0 && selectionSize <= horses.length) {
        // Generate all combinations of the required size
        const combinations = getCombinations(horses, selectionSize);
        
        for (const combination of combinations) {
          const componentBet = this.createBetRecord(
            userId, 
            formData, 
            combination, 
            type, 
            unitStake,
            parentBet.id
          );
          componentBets.push(componentBet);
        }
      }
    }
    
    return componentBets;
  }
  
  /**
   * Get the number of horses needed for a bet type
   */
  private getSelectionSizeForType(betType: string): number {
    switch (betType) {
      case 'single': return 1;
      case 'double': return 2;
      case 'treble': return 3;
      case '4fold': return 4;
      case '5fold': return 5;
      default: return 0;
    }
  }

  /**
   * Get and log the database schema for horse_racing_bets table
   * This is useful for debugging database errors
   */
  private async logDatabaseSchema(): Promise<void> {
    try {
      console.log('📊 Fetching racing_bets table schema...');
      const { data, error } = await supabaseAdmin.rpc('get_table_schema', {
        table_name: 'racing_bets'
      });

      if (error) {
        console.error('Error fetching schema:', error);
        
        // Try alternative approach - query a row and inspect columns
        console.log('📊 Trying alternative approach to get schema...');
        try {
          const { data: sampleRow, error: rowError } = await supabaseAdmin
            .from('racing_bets')
            .select('*')
            .limit(1)
            .single();
            
          if (rowError) {
            console.error('Could not fetch sample row:', rowError);
          } else if (sampleRow) {
            console.log('📊 Table columns from sample row:', Object.keys(sampleRow));
          }
        } catch (e) {
          console.error('Error in alternative schema approach:', e);
        }
        
        return;
      }
      
      if (data && data.length > 0) {
        console.log('📊 Table schema:', data);
        
        // Check if our record matches the schema
        const columnNames = data.map((col: any) => col.column_name);
        console.log('📊 Available columns:', columnNames.join(', '));
      } else {
        console.log('No schema information available');
      }
    } catch (e) {
      console.error('Exception fetching schema:', e);
    }
  }

  /**
   * Validate and sanitize a bet record to ensure all data types are correct
   */
  private validateAndSanitizeBetRecord(record: BetRecord): BetRecord {
    // Create a sanitized copy
    const sanitized = { ...record };
    
    // Ensure numeric fields are actually numbers
    if (sanitized.stake !== null && sanitized.stake !== undefined) {
      sanitized.stake = typeof sanitized.stake === 'number' ? 
                       sanitized.stake : 
                       parseFloat(String(sanitized.stake));
    }
    
    if (sanitized.odds !== null && sanitized.odds !== undefined) {
      sanitized.odds = typeof sanitized.odds === 'number' ? 
                      sanitized.odds : 
                      parseFloat(String(sanitized.odds));
    }
    
    if (sanitized.returns !== null && sanitized.returns !== undefined) {
      sanitized.returns = typeof sanitized.returns === 'number' ? 
                         sanitized.returns : 
                         parseFloat(String(sanitized.returns));
    }
    
    if (sanitized.profit_loss !== null && sanitized.profit_loss !== undefined) {
      sanitized.profit_loss = typeof sanitized.profit_loss === 'number' ? 
                             sanitized.profit_loss : 
                             parseFloat(String(sanitized.profit_loss));
    }
    
    // Handle post_position (stall number) 
    if (sanitized.post_position !== null && sanitized.post_position !== undefined) {
      sanitized.post_position = typeof sanitized.post_position === 'string' ? 
                              sanitized.post_position : 
                              String(sanitized.post_position);
    }
    
    // Handle race_number - convert from time format if needed
    if (sanitized.race_number !== null && sanitized.race_number !== undefined) {
      const raceNumberStr = String(sanitized.race_number);
      
      if (typeof sanitized.race_number === 'string') {
        // For string race numbers, check if it's a time format
        if (raceNumberStr.includes(':')) {
          // Remove colons for time-based race numbers
          sanitized.race_number = parseInt(raceNumberStr.replace(/:/g, ''));
        } else {
          // Otherwise convert to integer
          sanitized.race_number = parseInt(raceNumberStr);
        }
      } else if (typeof sanitized.race_number === 'number') {
        // Already a number, nothing to do
      } else {
        // For any other type, convert to string then parse
        sanitized.race_number = parseInt(raceNumberStr);
      }
    }
    
    if (sanitized.best_odds !== null && sanitized.best_odds !== undefined) {
      sanitized.best_odds = typeof sanitized.best_odds === 'number' ? 
                           sanitized.best_odds : 
                           parseFloat(String(sanitized.best_odds));
    }
    
    if (sanitized.purse !== null && sanitized.purse !== undefined) {
      sanitized.purse = typeof sanitized.purse === 'string' ? 
                       sanitized.purse : 
                       String(sanitized.purse);
    }
    
    // Handle horse_number (entry number/rank) 
    if (sanitized.horse_number !== null && sanitized.horse_number !== undefined) {
      sanitized.horse_number = typeof sanitized.horse_number === 'string' ? 
                              sanitized.horse_number : 
                              String(sanitized.horse_number);
    }
    
    // Ensure boolean fields are actually booleans
    if (sanitized.each_way !== null && sanitized.each_way !== undefined) {
      sanitized.each_way = Boolean(sanitized.each_way);
    }
    
    if (sanitized.manual_entry !== null && sanitized.manual_entry !== undefined) {
      sanitized.manual_entry = Boolean(sanitized.manual_entry);
    }
    
    // Format date fields
    if (sanitized.race_date && typeof sanitized.race_date === 'string') {
      // Check if race_date contains multiple dates separated by slashes
      if (sanitized.race_date.includes(' / ')) {
        console.log(`Multiple dates detected: "${sanitized.race_date}", extracting earliest date`);
        // Split the dates and use the first one (earliest)
        const dates = sanitized.race_date.split(' / ');
        sanitized.race_date = dates[0];
      }
      
      // Check if race_date is actually a time value (e.g., "2:32")
      if (sanitized.race_date.includes(':')) {
        // We need to use today's date since the race_date is actually a time
        const today = new Date();
        sanitized.race_date = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        console.log(`Converted time-based race_date "${record.race_date}" to today's date: ${sanitized.race_date}`);
      }
      // Ensure race_date is in YYYY-MM-DD format
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(sanitized.race_date)) {
        try {
          // Try to parse and format the date
          const date = new Date(sanitized.race_date);
          sanitized.race_date = date.toISOString().split('T')[0];
        } catch (e) {
          console.warn('Failed to parse date:', sanitized.race_date, e);
          // If parsing fails, use today's date as fallback
          const today = new Date();
          sanitized.race_date = today.toISOString().split('T')[0];
          console.log(`Using today's date as fallback: ${sanitized.race_date}`);
        }
      }
    }
    
    // Ensure we have proper data for required fields
    if (!sanitized.user_id) {
      console.error('Missing required field: user_id');
    }
    
    if (!sanitized.horse_name) {
      console.error('Missing required field: horse_name');
    }
    
    return sanitized;
  }

  /**
   * Create a database-ready object by removing client-side-only fields
   */
  private prepareForDatabaseInsertion(record: BetRecord): DbBetRecord {
    // Create a copy without client-only fields that aren't in the schema
    const { 
      additional_horses, 
      parent_bet_id, 
      component_type,
      manual_entry, 
      verification_details,
      ...initialDbRecord 
    } = record;
    
    // Cast to appropriate type and return
    return initialDbRecord as DbBetRecord;
  }

  /**
   * Parse purse/prize money value from horse data
   * Handles both purse and prize fields and removes currency symbols
   */
  private parsePurseValue(horse: HorseData): number | null {
    try {
      // Check for purse field first
      if (horse.purse) {
        // Remove any non-numeric characters except decimal point
        const purseString = horse.purse.toString().replace(/[^0-9.]/g, '');
        const purseValue = parseFloat(purseString);
        if (!isNaN(purseValue)) {
          return purseValue;
        }
      }
      
      // If no purse, check for prize field
      if (horse.prize) {
        // Remove any non-numeric characters except decimal point
        const prizeString = horse.prize.toString().replace(/[^0-9.]/g, '');
        const prizeValue = parseFloat(prizeString);
        if (!isNaN(prizeValue)) {
          return prizeValue;
        }
      }
      
      return null;
    } catch (error) {
      console.warn('Error parsing purse value:', error);
      return null;
    }
  }

  /**
   * Submits a bet to Supabase with all horse data
   */
  public async submitBet(
    userId: string,
    formData: BetFormData,
    horses: HorseData[]
  ): Promise<SubmissionResult> {
    console.log('Starting bet submission process...');
    console.log('Form data:', formData);
    console.log('Horses data:', horses);
    
    // Log schema to help debug issues
    await this.logDatabaseSchema();
    
    try {
      // Verify user authentication for validation purposes
      console.log('Verifying user authentication...');
      console.log('Using provided userId:', userId);
      
      // Override user authentication check if we have a valid userId provided
      let currentUser = null;
      
      if (userId && userId.length > 10) {
        console.log('Valid userId provided, will use this as fallback if auth check fails');
        currentUser = await this.getCurrentUser();
        
        // If auth check failed but we have a valid userId, create a synthetic user
        if (!currentUser && userId) {
          console.log('Auth check failed but using provided userId as fallback');
          currentUser = {
            id: userId,
            email: null
          };
        }
      } else {
        // Standard auth check
        currentUser = await this.getCurrentUser();
      }
      
      if (!currentUser) {
        console.error('User not authenticated. Please log in again.');
        return {
          success: false,
          error: 'User not authenticated. Please log in again.'
        };
      }
      
      // Ensure the provided userId matches the authenticated user
      if (!userId || userId !== currentUser.id) {
        console.log(`Using authenticated user ID (${currentUser.id}) instead of provided ID (${userId})`);
        userId = currentUser.id;
      }
      
      console.log(`Proceeding with bet submission for user: ${userId}, email: ${currentUser.email || 'unknown'}`);
      console.log('Note: We are using service role for database insertions to bypass RLS policies');

      // Validate required fields
      if (!formData.stake) {
        console.error('Missing required bet field: stake');
        return {
          success: false,
          error: 'Missing required bet details (stake)'
        };
      }

      // Validate stake format
      let stake = 0;
      try {
        stake = parseFloat(formData.stake);
        if (isNaN(stake) || stake <= 0) {
          console.error('Invalid stake:', formData.stake);
          return {
            success: false,
            error: 'Stake must be a positive number'
          };
        }
      } catch (e) {
        console.error('Error parsing stake:', e);
        return {
          success: false,
          error: `Invalid stake format: ${formData.stake}. Please enter a valid number.`
        };
      }

      // Check bet type and validate required horses
      const betTypeKey = formData.bet_type as keyof typeof BET_TYPES;
      const betTypeInfo = BET_TYPES[betTypeKey];
      
      if (!betTypeInfo) {
        console.error(`Unknown bet type: ${formData.bet_type}`);
        return {
          success: false,
          error: `Unknown bet type: ${formData.bet_type}`
        };
      }
      
      // Ensure we have enough horses for this bet type
      if (horses.length < betTypeInfo.requiredHorses) {
        console.error(`Bet type ${formData.bet_type} requires ${betTypeInfo.requiredHorses} horses, but only ${horses.length} provided`);
        return {
          success: false,
          error: `Bet type ${formData.bet_type} requires ${betTypeInfo.requiredHorses} horses, but only ${horses.length} provided`
        };
      }

      // Ensure horses have required data
      console.log(`Validating ${horses.length} horses...`);
      for (let i = 0; i < horses.length; i++) {
        const horse = horses[i];
        console.log(`Validating horse ${i + 1}: ${horse.horse_name || 'unnamed'}`);
        
        if (!horse.horse_name || !horse.track_name || !horse.race_date) {
          console.error(`Missing data for horse at position ${i}:`, horse);
          return {
            success: false,
            error: `Missing required horse data for ${horse.horse_name || 'unnamed horse'}`
          };
        }
        
        // If horse is not verified and manual_entry is not set, return an error
        if (!horse.verified && !horse.manual_entry) {
          console.error(`Horse "${horse.horse_name}" is neither verified nor marked as manual entry`);
          return {
            success: false,
            error: `Horse "${horse.horse_name}" is not verified. Please either verify the horse data or check manual entry.`
          };
        }
      }

      // Generate all the bets to insert based on the bet type
      console.log(`Generating bets for bet type: ${formData.bet_type}`);
      const betsToInsert = this.generateComponentBets(userId, formData, horses);
      
      if (betsToInsert.length === 0) {
        console.error('Failed to generate bet components');
          return {
            success: false,
          error: 'Failed to generate bet components'
        };
      }
      
      console.log(`Generated ${betsToInsert.length} bets to insert`);
      
      // Insert all the bets
      let parentBet: BetRecord | undefined = undefined;
      const componentBets: BetRecord[] = [];
      
      // First, insert the parent bet if we have component bets
      if (betsToInsert.length > 1) {
        parentBet = betsToInsert[0];
        
        console.log('Inserting parent bet:', parentBet);
        
        try {
          // Remove the temporary ID if present
          if (parentBet.id && parentBet.id.startsWith('temp_')) {
            delete parentBet.id;
          }
          
          // Prepare for database insertion
          const dbReadyParentBet = this.prepareForDatabaseInsertion(parentBet);
          console.log('Database-ready parent bet data:', JSON.stringify(dbReadyParentBet, null, 2));
          
          const response = await supabaseAdmin
            .from('racing_bets')
            .insert(dbReadyParentBet)
            .select('*')
            .single();
            
          if (response.error) {
            console.error('Error saving parent bet:', response.error);
            return {
              success: false,
              error: `Failed to save parent bet: ${response.error.message}`,
              details: response.error.details || response.error.hint || 'Check database constraints and data types'
            };
          }
          
          parentBet = response.data;
          console.log('Successfully saved parent bet:', parentBet);
          
          // Now update component bets with the real parent ID
          for (let i = 1; i < betsToInsert.length; i++) {
            const bet = betsToInsert[i];
            if (parentBet && parentBet.id) {
              bet.parent_bet_id = parentBet.id;
            }
            componentBets.push(bet);
          }
        } catch (error) {
          console.error('Exception during parent bet insert:', error);
        return {
          success: false,
            error: 'Failed to save parent bet',
            details: error instanceof Error ? error.message : String(error)
          };
        }
      } else {
        // Just a single bet (like a single, double, etc.)
        console.log('Single bet type, inserting directly');
        const singleBet = betsToInsert[0];
        
        try {
          console.log('Preparing to insert bet with data:', JSON.stringify(singleBet, null, 2));
          
          // Sanitize the data
          const sanitizedBet = this.validateAndSanitizeBetRecord(singleBet);
          console.log('Sanitized bet data:', JSON.stringify(sanitizedBet, null, 2));
          
          // Prepare for database insertion
          const dbReadyBet = this.prepareForDatabaseInsertion(sanitizedBet);
          console.log('Database-ready bet data:', JSON.stringify(dbReadyBet, null, 2));
          
          // Check connection to Supabase
          console.log('Testing Supabase connection...');
          try {
            const { data: connectionTest, error: connectionError } = await supabaseAdmin.from('racing_bets').select('count').limit(1);
            if (connectionError) {
              console.error('Supabase connection test failed:', connectionError);
          } else {
              console.log('Supabase connection test successful');
            }
          } catch (connectionTestError) {
            console.error('Error testing Supabase connection:', connectionTestError);
          }
          
          // Attempt to insert the bet
          const response = await supabaseAdmin
            .from('racing_bets')
            .insert(dbReadyBet)
            .select('*')
            .single();
            
          if (response.error) {
            console.error('Error saving bet:', {
              message: response.error.message,
              details: response.error.details,
              hint: response.error.hint,
              code: response.error.code,
              fullError: JSON.stringify(response.error, null, 2),
              statusText: response.error.message || 'Unknown error'
            });
            
            // Log the prepared data for debugging
            console.error('Data that failed to insert:', JSON.stringify(dbReadyBet, null, 2));
            
            // Check if the error is related to a missing column
            if (response.error.message && response.error.message.includes("column") && response.error.message.includes("not")) {
              const missingColumnMatch = response.error.message.match(/'([^']+)'/);
              const missingColumn = missingColumnMatch ? missingColumnMatch[1] : 'unknown';
              
              console.error(`Missing column detected: ${missingColumn}`);
              
              // Try to insert without this field
              console.log(`Attempting insert without the problematic field: ${missingColumn}`);
              const cleanedData = { ...dbReadyBet };
              delete (cleanedData as any)[missingColumn];
              
              try {
                // Try without the problematic field
                const retryResponse = await supabaseAdmin
                  .from('racing_bets')
                  .insert(cleanedData)
          .select('*')
          .single();
          
                if (retryResponse.error) {
                  console.error('Retry also failed:', retryResponse.error);
                } else {
                  console.log('Retry succeeded without the problematic field!');
                  // Typecast the data to the correct type
                  parentBet = retryResponse.data as BetRecord;
                  return {
                    success: true,
                    data: parentBet,
                    details: `Bet was saved successfully, but had to remove field: ${missingColumn}`
                  };
                }
              } catch (retryError) {
                console.error('Exception during retry:', retryError);
              }
            }
            
            // Enhanced error reporting
            let errorMessage = 'Database error';
            let errorDetails = 'Check database constraints and data types';
            
            if (response.error.message) errorMessage = response.error.message;
            if (response.error.details) errorDetails = response.error.details;
            
            if (response.status === 401 || response.status === 403) {
              errorMessage = 'Authentication error';
              errorDetails = 'Not authorized to insert data. Please check your Supabase credentials.';
            } else if (response.status === 404) {
              errorMessage = 'Table not found';
              errorDetails = 'The racing_bets table was not found in the database.';
            } else if (response.status === 409) {
              errorMessage = 'Database conflict';
              errorDetails = 'The insert operation conflicts with existing data.';
            } else if (response.status >= 500) {
              errorMessage = 'Database server error';
              errorDetails = 'There was an error on the database server. Please try again later.';
            }
        
        return {
          success: false,
              error: `Failed to save bet: ${errorMessage}`,
              details: errorDetails
            };
          }
          
          parentBet = response.data;
          console.log('Successfully saved single bet:', parentBet);
        } catch (error) {
          console.error('Exception during single bet insert:', error);
          // If it's an object with properties, try to stringify it
          let errorDetails = 'Unknown error';
          try {
            errorDetails = typeof error === 'object' ? JSON.stringify(error, null, 2) : String(error);
          } catch (e) {
            errorDetails = 'Error could not be stringified';
          }
          
          // Try to get more info about the error
          let errorMessage = 'Failed to save bet';
          if (error instanceof Error) {
            errorMessage = `Failed to save bet: ${error.message}`;
            console.error('Error stack:', error.stack);
          } else if (typeof error === 'object' && error !== null) {
            try {
              // Try to get error info for common error types
              if ('message' in error) errorMessage = `Failed to save bet: ${(error as any).message}`;
              if ('code' in error) errorDetails = `Error code: ${(error as any).code}`;
            } catch (e) {
              // Ignore errors in error handling
            }
          }
          
          return {
            success: false,
            error: errorMessage,
            details: errorDetails
          };
        }
      }
      
      // Insert component bets if we have any
      if (componentBets.length > 0 && parentBet) {
        console.log(`Inserting ${componentBets.length} component bets...`);
        
        try {
          // Prepare all component bets for database insertion
          const dbReadyComponentBets = componentBets.map(bet => this.prepareForDatabaseInsertion(bet));
          console.log(`Inserting ${dbReadyComponentBets.length} database-ready component bets...`);
          
          const response = await supabaseAdmin
            .from('racing_bets')
            .insert(dbReadyComponentBets);
            
          if (response.error) {
            console.error('Error saving component bets:', response.error);
            // We continue anyway since the parent bet was saved
            return {
              success: true,
              data: parentBet,
              details: `Parent bet saved successfully, but there was an error saving component bets: ${response.error.message || 'Unknown error'}`
            };
          }
          
          console.log('Successfully saved all component bets');
        } catch (error) {
          console.error('Exception during component bets insert:', error);
          // Continue with parent bet success
          return {
            success: true,
            data: parentBet,
            details: `Parent bet saved successfully, but there was an error saving component bets: ${error instanceof Error ? error.message : String(error)}`
          };
        }
      }
      
      // Insert additional horses for the parent bet
      if (horses.length > 1 && parentBet && parentBet.id) {
        console.log(`Processing additional horses for bet ID ${parentBet.id}...`);
        
        const additionalHorses = horses.slice(1).map(horse => {
          // String values for fields that were updated to text type
          const postPosition = horse.post_position || null;
          const horseNumber = horse.horse_number || null;
          const purseString = horse.purse || horse.prize || null;
          
          // Numeric values for odds
          const oddsValue = horse.odds ? this.parseOdds(horse.odds) : 
                           horse.best_odds ? this.parseOdds(horse.best_odds) : 
                           horse.morning_line_odds ? this.parseOdds(horse.morning_line_odds) : null;
          const bestOddsValue = horse.best_odds ? parseFloat(horse.best_odds) : 
                               horse.morning_line_odds ? parseFloat(horse.morning_line_odds) : null;
                   
          // Convert distance to furlongs
          const distance = this.convertDistanceToFurlongs(horse.race_distance);
          
          // Format the scheduled race time
          const scheduledRaceTime = this.formatRaceTime(horse.scheduled_time);
          
          // Extract proper race number (1-10)
          const raceNumber = this.extractRaceNumber(horse.race_number, horse.scheduled_time);
          
          // Determine race location (country)
          const raceLocation = this.getRaceLocation(horse.track_name);

          // Parse class type
          const classType = horse.class_type || horse.race_class || null;

          // Create full horse record
          const fullHorse = {
            bet_id: parentBet!.id,
            horse_name: horse.horse_name,
            track_name: horse.track_name,
            race_number: raceNumber,
            race_date: horse.race_date,
            jockey: horse.jockey || horse.jockey_name || null,
            trainer: horse.trainer || horse.trainer_name || null,
            odds: this.roundToTwoDecimals(oddsValue),
            class_type: classType,
            distance: distance !== null ? distance.toString() : null,
            scheduled_race_time: scheduledRaceTime,
            post_position: postPosition,
            best_odds: this.roundToTwoDecimals(bestOddsValue),
            surface: horse.surface_type || null,
            going: horse.going || null,
            purse: purseString,
            horse_number: horseNumber,
            race_location: raceLocation
          };

          return fullHorse;
        });

        console.log(`Adding ${additionalHorses.length} additional horses to bet ${parentBet.id}`);
        
        let additionalError = null;
        try {
          const response = await supabaseAdmin
            .from('racing_additional_horses')
            .insert(additionalHorses as any);
            
          additionalError = response.error || null;
          
          if (additionalError && additionalError.code === 'PGRST204') {
            console.log('Trying alternative table name: additional_horses');
            const fallbackResponse = await supabaseAdmin
            .from('additional_horses')
            .insert(additionalHorses as any);
            
            additionalError = fallbackResponse.error || null;
          }
        } catch (additionalInsertError) {
          console.error('Exception during additional horses insert:', additionalInsertError);
          additionalError = {
            message: additionalInsertError instanceof Error ? additionalInsertError.message : String(additionalInsertError)
          };
        }

        if (additionalError) {
          console.error('Error saving additional horses:', additionalError);
          // We continue anyway since the main bet was saved
          return {
            success: true,
            data: parentBet,
            details: `Bet saved successfully, but there was an error saving additional horses: ${additionalError.message || 'Unknown error'}`
          };
        }
      }

      // After successful submission, clear the localStorage
      try {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(VERIFIED_HORSES_STORAGE_KEY);
          console.log('Cleared verified horses data from localStorage after successful submission');
        }
      } catch (e) {
        console.warn('Unable to clear localStorage:', e);
      }

      console.log('Bet submission completed successfully');
      return {
        success: true,
        data: parentBet || undefined
      };
    } catch (error) {
      console.error('Unhandled error in bet submission:', error);
      // Extract error details if possible
      let errorMessage = 'Unknown error';
      let errorDetails = '';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        errorDetails = error.stack || '';
        console.error('Error stack:', error.stack);
      } else {
        // Attempt to stringify the error for better visibility
        try {
          errorDetails = JSON.stringify(error);
        } catch (e) {
          errorDetails = 'Error could not be stringified';
        }
      }
      
      return {
        success: false,
        error: `Failed to submit bet: ${errorMessage}`,
        details: errorDetails
      };
    }
  }

  /**
   * Fetch a bet by ID
   */
  public async getBetById(betId: string): Promise<BetRecord | null> {
    try {
      console.log(`Fetching bet with ID: ${betId}`);
      const { data, error } = await supabaseAdmin
        .from('racing_bets')
        .select('*')
        .eq('id', betId)
        .single();

      if (error) {
        console.error('Error fetching bet:', error);
        return null;
      }

      console.log('Retrieved bet data:', data);
      return data as BetRecord;
    } catch (error) {
      console.error('Error fetching bet:', error);
      return null;
    }
  }

  /**
   * Fetch additional horses for a multiple bet
   */
  public async getAdditionalHorses(betId: string): Promise<AdditionalHorseRecord[]> {
    try {
      console.log(`Fetching additional horses for bet ID: ${betId}`);
      
      // Try with racing_additional_horses first
      let data: any = null;
      let error: any = null;
      
      const additionalHorsesResult = await supabaseAdmin
        .from('racing_additional_horses')
        .select('*')
        .eq('bet_id', betId);
      
      error = additionalHorsesResult.error;
      data = additionalHorsesResult.data;
      
      // If error, try alternative table name
      if (error && error.code === '42P01') { // Table does not exist error
        console.log('Trying alternative table name: additional_horses');
        const alternativeResult = await supabaseAdmin
        .from('additional_horses')
        .select('*')
        .eq('bet_id', betId);
        
        error = alternativeResult.error;
        data = alternativeResult.data;
      }

      if (error) {
        console.error('Error fetching additional horses:', error);
        return [];
      }

      console.log(`Retrieved ${data.length} additional horses`);
      return data as AdditionalHorseRecord[];
    } catch (error) {
      console.error('Error fetching additional horses:', error);
      return [];
    }
  }

  /**
   * Fetch all bets for a user
   */
  public async getUserBets(userId: string): Promise<BetRecord[]> {
    try {
      console.log(`Fetching bets for user: ${userId}`);
      
      // Verify user authentication
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        console.error('User not authenticated');
        return [];
      }
      
      // Ensure the provided userId matches the authenticated user
      if (userId !== currentUser.id) {
        console.log(`Using authenticated user ID (${currentUser.id}) instead of provided ID (${userId})`);
        userId = currentUser.id;
      }
      
      const { data, error } = await supabaseAdmin
        .from('racing_bets')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user bets:', error);
        return [];
      }

      console.log(`Retrieved ${data.length} bets for user ${userId}`);
      return data as BetRecord[];
    } catch (error) {
      console.error('Error fetching user bets:', error);
      return [];
    }
  }

  /**
   * Update bet status and results
   */
  public async updateBetResult(
    betId: string, 
    status: 'Won' | 'Lost' | 'Void' | 'Cash Out',
    actualReturns?: number
  ): Promise<boolean> {
    try {
      console.log(`Updating bet result for bet ID: ${betId}, status: ${status}`);
      
      // Verify user authentication first
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        console.error('User not authenticated');
        return false;
      }

      // Get the current bet data
      const bet = await this.getBetById(betId);
      if (!bet) {
        console.error('Bet not found');
        return false;
      }
      
      // Make sure the user owns this bet
      if (bet.user_id !== currentUser.id) {
        console.error('Unauthorized: User does not own this bet');
        return false;
      }

      // Calculate profit/loss based on the new status and returns
      let profitLoss = -bet.stake; // Default to losing the stake
      let returns = 0;

      if (status === 'Won') {
        returns = actualReturns !== undefined ? actualReturns : (bet.returns || 0);
        profitLoss = returns - bet.stake;
      } else if (status === 'Cash Out') {
        if (actualReturns === undefined) {
          console.error('Cash out requires an actual return amount');
          return false; // Cash out requires an actual return amount
        }
        returns = actualReturns;
        profitLoss = returns - bet.stake;
      } else if (status === 'Void') {
        returns = bet.stake;
        profitLoss = 0;
      }

      console.log(`Calculated returns: ${returns}, profit/loss: ${profitLoss}`);

      // Update the bet record
      const { error } = await supabaseAdmin
        .from('racing_bets')
        .update({
          status,
          returns,
          profit_loss: profitLoss,
          updated_at: new Date().toISOString()
        })
        .eq('id', betId);

      if (error) {
        console.error('Error updating bet result:', error);
        return false;
      }

      console.log(`Successfully updated bet ${betId} to status: ${status}`);
      return true;
    } catch (error) {
      console.error('Error updating bet result:', error);
      return false;
    }
  }

  /**
   * Determine if a track is in the UK based on name
   * (Maintained for backward compatibility)
   */
  private isUKTrack(trackName: string): boolean {
    return this.getRaceLocation(trackName) === 'UK';
  }
}

// Export a singleton instance
export const betSubmissionService = BetSubmissionService.getInstance(); 