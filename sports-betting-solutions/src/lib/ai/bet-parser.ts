import { routeToAI } from './router';
import { supabase } from '../supabase/client';
import { fetchUKRaceData } from '../racing/uk-client';

// Define the structure of a parsed bet to match the database schema
export interface ParsedBet {
  sport: string;
  event_name: string;
  selection: string;
  stake: number;
  odds: number;
  bet_type: string;
  
  // Required fields for horse racing bets
  track_name: string;
  horse_name: string;
  race_date?: string;
  
  // Optional fields
  race_number?: string;
  scheduled_race_time?: string;
  race_location?: string;
  jockey?: string;
  trainer?: string;
  race_distance?: string;
  race_type?: string;
  track_condition?: string;
  barrier_position?: string;
  weight_carried?: number;
  post_position?: number;
  morning_line_odds?: number;
  class_type?: string;
  purse?: number;
  distance?: string;
  each_way?: boolean;
  bookmaker?: string;
  model?: string;
  notes?: string;
}

// System prompt for bet parsing
const BET_PARSING_SYSTEM_PROMPT = `
You are a specialized AI for parsing HORSE RACING betting information from user messages.
Your task is to extract structured horse racing betting data from natural language inputs.

REQUIRED FIELDS (must be extracted):
- Horse name (this is critical and MUST be extracted)
- Track name (this is critical and MUST be extracted)
- Stake (amount wagered)
- Odds (in DECIMAL format - CONVERT if given in fractional format like "6/4")
- Bet type (win, place, each way/E/W, etc.)

OPTIONAL BUT RECOMMENDED:
- Race date (formatted as YYYY-MM-DD)
- Race number or race time
- Jockey name
- Trainer name
- Race distance
- Race type or class
- Track condition/going
- Post position
- Bookmaker or betting site used
- Betting model (if mentioned)

IMPORTANT ODDS CONVERSION:
- If odds are given in fractional format (e.g., "6/4", "5/2"), convert to decimal:
  * 6/4 = 2.5 (divide 6 by 4 and add 1)
  * 5/2 = 3.5 (divide 5 by 2 and add 1)
  * 11/10 = 2.1 (divide 11 by 10 and add 1)
  * Evens or EVS = 2.0

UK TRACKS TO RECOGNIZE:
- Cheltenham, Ascot, Aintree, Newmarket, Epsom, Goodwood, York, Doncaster
- Kempton, Newbury, Sandown, Haydock, Lingfield, Windsor, Leicester
- Huntingdon, Musselburgh, Wolverhampton, Nottingham, Warwick

Return ONLY a JSON object with these fields. Do not include any explanations or additional text.
If a field cannot be determined, omit it from the JSON.

For example, input: "I bet £20 on Fact To File at 6/4 in the 3:20 at Cheltenham"
Output should be:
{
  "sport": "Horse Racing",
  "horse_name": "Fact To File",
  "track_name": "Cheltenham",
  "stake": 20,
  "odds": 2.5,
  "bet_type": "win",
  "race_number": "3:20"
}
`;

/**
 * Fetches additional race information from Equibase for North American races
 * NOTE: This requires a direct Equibase URL and is only useful if the AI has constructed one
 */
async function fetchRaceInfo(horseName: string, trackName: string, equibaseUrl?: string) {
  try {
    // If no Equibase URL was provided, we can't use the scraper
    if (!equibaseUrl || !equibaseUrl.includes('equibase.com')) {
      console.log('No Equibase URL provided, skipping race info fetch');
      return null;
    }
    
    const response = await fetch('/api/equibase', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        horseName: equibaseUrl, // Pass the URL as horseName since our scraper endpoint expects URLs here
        trackName, // Still pass track name for logging
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch race information');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching race information:', error);
    return null;
  }
}

/**
 * Fetches additional race information from The Racing API for UK races
 */
async function fetchUKRaceInfo(horseName: string, trackName: string) {
  try {
    console.log(`Fetching UK race info for ${horseName} at ${trackName}`);
    
    const response = await fetchUKRaceData({
      course: trackName,
      horseName: horseName
    });

    if (!response.success || !response.data) {
      console.log(`No UK race information found for ${horseName} at ${trackName}`);
      return null;
    }

    console.log(`Successfully found UK race data for ${horseName}`);
    return response;
  } catch (error) {
    console.error('Error fetching UK race information:', error);
    return null;
  }
}

/**
 * Parses a user message to extract betting information
 */
export async function parseBetFromMessage(message: string, userId: string, userEmail?: string) {
  console.log(`===== STARTING BET PARSING =====`);
  console.log(`Message to parse: "${message}"`);
  console.log(`User ID: ${userId}, Email: ${userEmail || 'not provided'}`);
  
  try {
    // Use DeepSeek for bet parsing since Claude is disabled
    const result = await routeToAI(
      [{ role: 'user', content: message }],
      userId,
      {
        forceModel: 'deepseek',
        systemPrompt: BET_PARSING_SYSTEM_PROMPT,
        userEmail: userEmail // Add email for context
      }
    );
    
    // Parse the JSON response
    console.log(`===== AI RESPONSE =====`);
    console.log(result.response);
    
    try {
      let parsedBet: ParsedBet;
      
      try {
        parsedBet = JSON.parse(result.response) as ParsedBet;
        console.log('✅ JSON parsing successful on first attempt');
      } catch (jsonError) {
        console.error('❌ Failed to parse JSON response:', jsonError);
        
        // Try to extract JSON from the response if it's embedded in text
        const jsonMatch = result.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonStr = jsonMatch[0];
          console.log('🔍 Extracted potential JSON from response:', jsonStr);
          try {
            parsedBet = JSON.parse(jsonStr) as ParsedBet;
            console.log('✅ Successfully parsed extracted JSON');
          } catch (extractError) {
            console.error('❌ Failed to parse extracted JSON:', extractError);
            throw new Error('Failed to extract valid JSON from AI response');
          }
        } else {
          throw new Error('Failed to extract betting information from response');
        }
      }
      
      // Force the sport to be Horse Racing
      parsedBet.sport = "Horse Racing";
      
      // Convert fractional odds to decimal if needed (in case the AI didn't do it)
      if (parsedBet.odds && typeof parsedBet.odds === 'string') {
        const fractionalMatch = String(parsedBet.odds).match(/^(\d+)\/(\d+)$/);
        if (fractionalMatch) {
          const [_, numerator, denominator] = fractionalMatch;
          parsedBet.odds = (Number(numerator) / Number(denominator)) + 1;
          console.log(`🔄 Converted fractional odds ${_} to decimal: ${parsedBet.odds}`);
        } else if (String(parsedBet.odds).toLowerCase() === 'evs' || 
                   String(parsedBet.odds).toLowerCase() === 'evens') {
          parsedBet.odds = 2.0;
        } else {
          // Try to convert to a number if it's not already
          parsedBet.odds = Number(parsedBet.odds);
        }
      }
      
      // Validate and set default values for required fields
      if (!parsedBet.horse_name && parsedBet.selection) {
        console.log('🔄 Using selection as horse_name:', parsedBet.selection);
        parsedBet.horse_name = parsedBet.selection; // Use selection as horse_name if missing
      }
      
      if (!parsedBet.horse_name) {
        console.error('❌ Missing crucial field: horse_name');
        parsedBet.horse_name = "Unknown Horse"; // Add default to prevent processing errors
      }
      
      if (!parsedBet.track_name) {
        console.error('❌ Missing crucial field: track_name');
        parsedBet.track_name = "Unknown Track"; // Add default to prevent processing errors
      }
      
      if (!parsedBet.stake) {
        console.log('⚠️ Missing stake, setting default of 10');
        parsedBet.stake = 10; // Default stake
      }
      
      if (!parsedBet.odds) {
        console.log('⚠️ Missing odds, setting default of 2.0');
        parsedBet.odds = 2.0; // Default odds (evens)
      }
      
      if (!parsedBet.bet_type) {
        console.log('⚠️ Missing bet type, setting default of "win"');
        parsedBet.bet_type = "win"; // Default bet type
      }
      
      // Make sure we have the required fields
      const missingFields = [];
      if (!parsedBet.horse_name || parsedBet.horse_name === "Unknown Horse") missingFields.push('horse_name');
      if (!parsedBet.track_name || parsedBet.track_name === "Unknown Track") missingFields.push('track_name');
      if (!parsedBet.stake) missingFields.push('stake');
      if (!parsedBet.odds) missingFields.push('odds');
      
      if (missingFields.length > 0) {
        console.error(`❌ Missing required fields: ${missingFields.join(', ')}`);
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      // Log the critical fields to ensure they're present
      console.log('===== CRITICAL BET FIELDS =====');
      console.log({
        horse_name: parsedBet.horse_name,
        track_name: parsedBet.track_name,
        stake: parsedBet.stake,
        odds: parsedBet.odds,
        bet_type: parsedBet.bet_type
      });
      
      // If we have both horse name and track name, try to get additional info 
      if (parsedBet.horse_name && parsedBet.track_name) {
        console.log('===== ATTEMPTING TO ENRICH BET DATA =====');
        // List of common UK tracks
        const ukTracksLowercase = [
          'cheltenham', 'aintree', 'ascot', 'epsom', 'goodwood', 'newmarket', 
          'york', 'doncaster', 'kempton', 'newbury', 'sandown', 'haydock', 
          'lingfield', 'musselburgh', 'wolverhampton', 'leicester', 'windsor',
          'huntingdon', 'nottingham', 'warwick'
        ];
        
        // List of common US tracks
        const usTracksLowercase = [
          'saratoga', 'belmont', 'churchill downs', 'santa anita', 
          'gulfstream', 'aqueduct', 'keeneland', 'del mar', 'oaklawn', 'turf paradise'
        ];
        
        // Check if it's a UK track first
        const trackNameLower = parsedBet.track_name.toLowerCase();
        if (ukTracksLowercase.some(track => trackNameLower.includes(track))) {
          console.log(`🇬🇧 ${parsedBet.track_name} appears to be a UK track, fetching data from Racing API`);
          
          try {
            // Fetch UK race information
            const raceInfo = await fetchUKRaceInfo(parsedBet.horse_name, parsedBet.track_name);
            
            // Enhance the parsed bet with UK race information
            if (raceInfo && raceInfo.data) {
              // Handle both single race and multiple races
              const raceData = Array.isArray(raceInfo.data) ? raceInfo.data[0] : raceInfo.data;
              
              if (raceData) {
                console.log(`✅ Found race data for ${parsedBet.horse_name} at ${parsedBet.track_name}`);
                
                // Find the specific runner (horse)
                const runner = raceData.runners.find(r => 
                  r.horse.toLowerCase().includes(parsedBet.horse_name?.toLowerCase() || '')
                );
                
                // Update bet with race data
                parsedBet.race_number = parsedBet.race_number || raceData.off_time;
                parsedBet.scheduled_race_time = raceData.off_time;
                parsedBet.race_location = parsedBet.track_name;
                parsedBet.distance = raceData.distance_f;
                parsedBet.class_type = raceData.pattern || raceData.race_class || raceData.type;
                parsedBet.track_condition = raceData.going;
                parsedBet.race_date = raceData.date;
                parsedBet.event_name = raceData.race_name;
                
                // Add runner-specific data if available
                if (runner) {
                  console.log(`✅ Found runner data for ${parsedBet.horse_name}:`, runner);
                  parsedBet.jockey = runner.jockey;
                  parsedBet.trainer = runner.trainer;
                  parsedBet.post_position = runner.draw ? parseInt(runner.draw, 10) : undefined;
                  parsedBet.weight_carried = runner.lbs ? parseFloat(runner.lbs) : undefined;
                }
                
                // Add a note about Racing API data
                parsedBet.notes = (parsedBet.notes || '') + ' Additional data fetched from The Racing API.';
              }
            } else {
              console.log('⚠️ No UK racing information found');
            }
          } catch (error) {
            console.error('❌ Error enhancing bet with UK racing data:', error);
          }
        } 
        // Check if it's a US track next
        else if (usTracksLowercase.some(track => trackNameLower.includes(track))) {
          try {
            // Check if the message contains an Equibase URL
            const equibaseUrlMatch = message.match(/(https?:\/\/(?:www\.)?equibase\.com\/[^\s]+)/i);
            const equibaseUrl = equibaseUrlMatch ? equibaseUrlMatch[0] : undefined;
            
            if (equibaseUrl) {
              console.log(`🇺🇸 Found Equibase URL in message: ${equibaseUrl}`);
              
              // Fetch race information using the scraper
              const raceInfo = await fetchRaceInfo(parsedBet.horse_name, parsedBet.track_name, equibaseUrl);
              
              // Enhance the parsed bet with additional information if available
              if (raceInfo && raceInfo.data) {
                const raceData = raceInfo.data.race_data;
                parsedBet.race_number = raceData.race_number?.toString();
                parsedBet.distance = raceData.race_distance;
                parsedBet.class_type = raceData.race_conditions;
                parsedBet.track_condition = raceData.surface;
                parsedBet.race_date = raceData.race_date;
                parsedBet.race_location = parsedBet.track_name;
                parsedBet.purse = raceData.purse ? parseFloat(raceData.purse.replace(/[$,]/g, '')) : undefined;
              }
              
              if (raceInfo.data.horse_data) {
                const horseData = raceInfo.data.horse_data;
                parsedBet.jockey = horseData.jockey;
                parsedBet.trainer = horseData.trainer;
                parsedBet.post_position = horseData.program_number ? parseInt(horseData.program_number, 10) : undefined;
                parsedBet.weight_carried = horseData.weight ? parseFloat(horseData.weight) : undefined;
                parsedBet.morning_line_odds = horseData.odds ? parseFloat(horseData.odds) : undefined;
              }
              
              // Add a note about Equibase data
              parsedBet.notes = (parsedBet.notes || '') + ' Additional data fetched from Equibase.';
            } else {
              console.log('⚠️ No Equibase URL found in message');
            }
          } catch (error) {
            console.error('❌ Error enhancing bet with Equibase data:', error);
          }
        } else {
          console.log(`ℹ️ ${parsedBet.track_name} appears to be neither a US nor UK track, no additional data lookup`);
        }
      }
      
      console.log('===== FINAL PARSED BET =====');
      console.log(JSON.stringify(parsedBet, null, 2));
      return parsedBet;
    } catch (error) {
      console.error('❌ Error parsing bet JSON:', error);
      throw new Error('Failed to parse betting information. Please try again with more details.');
    }
  } catch (error) {
    console.error('❌ Error in bet parsing:', error);
    throw error;
  }
}

/**
 * Saves a parsed bet to the database according to the exact table schema
 */
export async function saveParsedBet(parsedBet: ParsedBet, userId: string) {
  console.log('===== STARTING BET SAVE PROCESS =====');
  console.log(`User ID: ${userId}`);
  console.log('Bet data to save:', JSON.stringify(parsedBet, null, 2));
  
  try {
    // Validate required fields
    const requiredFields = ['horse_name', 'track_name', 'stake', 'odds', 'bet_type'];
    const missingFields = requiredFields.filter(field => !parsedBet[field as keyof ParsedBet]);
    
    if (missingFields.length > 0) {
      const errorMsg = `Missing required fields: ${missingFields.join(', ')}`;
      console.error(`❌ ${errorMsg}`);
      throw new Error(errorMsg);
    }
    
    // Verify Supabase connection
    if (!supabase) {
      console.error('❌ Supabase client is not initialized');
      throw new Error('Database connection error. Please try again later.');
    }
    
    // Format race number as integer if it's a time format
    let raceNumber: number | null = null;
    if (parsedBet.race_number) {
      // If it's a time format like "3:20", just store null for now
      if (parsedBet.race_number.includes(':')) {
        console.log(`ℹ️ Race number "${parsedBet.race_number}" is a time format, using for scheduled_race_time instead`);
        // We'll use this for scheduled_race_time instead
      } else {
        // Try to convert to integer if it's a number
        raceNumber = parseInt(parsedBet.race_number, 10);
        if (isNaN(raceNumber)) {
          console.log(`⚠️ Race number "${parsedBet.race_number}" is not a valid integer, setting to null`);
          raceNumber = null;
        } else {
          console.log(`✅ Converted race number "${parsedBet.race_number}" to integer: ${raceNumber}`);
        }
      }
    }
    
    // Parse the race time if available
    let scheduledRaceTime: string | null = null;
    if (parsedBet.scheduled_race_time) {
      scheduledRaceTime = parsedBet.scheduled_race_time;
      console.log(`✅ Using provided scheduled race time: ${scheduledRaceTime}`);
    } else if (parsedBet.race_number && parsedBet.race_number.includes(':')) {
      // Extract just the time portion
      scheduledRaceTime = parsedBet.race_number;
      console.log(`✅ Using race number as scheduled race time: ${scheduledRaceTime}`);
    }
    
    // Parse post position if available
    let postPosition: number | null = null;
    if (parsedBet.post_position) {
      postPosition = parsedBet.post_position;
      console.log(`✅ Using provided post position: ${postPosition}`);
    } else if (parsedBet.barrier_position) {
      postPosition = parseInt(parsedBet.barrier_position, 10);
      if (isNaN(postPosition)) {
        console.log(`⚠️ Barrier position "${parsedBet.barrier_position}" is not a valid integer, setting to null`);
        postPosition = null;
      } else {
        console.log(`✅ Converted barrier position "${parsedBet.barrier_position}" to post position: ${postPosition}`);
      }
    }
    
    // Calculate returns based on stake and odds
    const returns = parsedBet.stake * parsedBet.odds;
    const profitLoss = returns - parsedBet.stake;
    console.log(`ℹ️ Calculated returns: ${returns}, profit/loss: ${profitLoss}`);
    
    // Parse race date or use current date
    let raceDate = null;
    if (parsedBet.race_date) {
      try {
        // Try to parse the date
        raceDate = new Date(parsedBet.race_date).toISOString().split('T')[0];
        console.log(`✅ Parsed race date: ${raceDate}`);
      } catch (error) {
        console.error(`❌ Error parsing race date "${parsedBet.race_date}":`, error);
        // Default to today
        raceDate = new Date().toISOString().split('T')[0];
        console.log(`⚠️ Using today's date as fallback: ${raceDate}`);
      }
    } else {
      // Default to today
      raceDate = new Date().toISOString().split('T')[0];
      console.log(`ℹ️ No race date provided, using today: ${raceDate}`);
    }
    
    // Determine if bet is each way
    const eachWay = parsedBet.each_way || 
                    (parsedBet.bet_type && parsedBet.bet_type.toLowerCase().includes('each way')) || 
                    (parsedBet.bet_type && parsedBet.bet_type.toLowerCase().includes('e/w')) || 
                    false;
    
    console.log(`ℹ️ Each way bet: ${eachWay}`);
    
    // Format the data according to the exact schema provided
    const horseRacingBet = {
      // Required fields (marked as NOT NULL in schema)
        user_id: userId,
      track_name: parsedBet.track_name,
      horse_name: parsedBet.horse_name,
      race_date: raceDate,
      bet_type: parsedBet.bet_type || 'win',
      stake: parsedBet.stake || 0,
      odds: parsedBet.odds || 1,
      status: 'Pending', // Default status as specified in schema
      
      // Optional fields (can be NULL in schema)
      race_number: raceNumber,
      scheduled_race_time: scheduledRaceTime,
      race_location: parsedBet.race_location || parsedBet.track_name,
      each_way: eachWay,
      returns: returns,
      profit_loss: profitLoss,
      closing_odds: null, // To be updated later when result is known
      closing_line_value: null, // To be calculated later
      rule_4_applied: false, // Default to false
      rule_4_deduction: null,
      rule_4_adjusted_odds: null,
      model: parsedBet.model || null,
      bookmaker: parsedBet.bookmaker || null,
      notes: parsedBet.notes || null,
      post_position: postPosition,
      jockey: parsedBet.jockey || null,
      trainer: parsedBet.trainer || null,
      morning_line_odds: parsedBet.morning_line_odds || null,
      class_type: parsedBet.class_type || null,
      purse: parsedBet.purse || null,
      distance: parsedBet.distance || null
    };
    
    console.log('===== PREPARED BET DATA FOR DB INSERT =====');
    console.log(JSON.stringify(horseRacingBet, null, 2));
    
    // Use the correct table name for the database
    const tableName = 'horse_racing_bets';
    
    console.log(`ℹ️ Inserting into table: ${tableName}`);
    
    try {
      // Insert the horse racing bet into the database using type assertion to bypass 
      // TypeScript's type checking, since we know our schema is correct
      const { data: savedBet, error: betError } = await supabase
        .from(tableName)
        .insert(horseRacingBet as any)
      .select()
      .single();
    
    if (betError) {
        console.error('❌ Error inserting horse racing bet:', betError);
        
        // Provide a more detailed error message
        if (betError.message.includes('column') && betError.message.includes('does not exist')) {
          console.error('❌ Column mismatch error. Table schema:', betError.message);
          throw new Error(`Schema mismatch: ${betError.message}`);
        } else if (betError.message.includes('violates not-null constraint')) {
          console.error('❌ Missing required field:', betError.message);
          throw new Error(`Missing required field: ${betError.message}`);
        } else if (betError.message.includes('violates foreign key constraint')) {
          console.error('❌ Foreign key constraint violation:', betError.message);
          throw new Error(`Invalid reference: ${betError.message}`);
        } else if (betError.code === '42P01') {
          console.error('❌ Table does not exist:', betError.message);
          throw new Error(`Table '${tableName}' does not exist. Please check your database setup.`);
        } else if (betError.code === '23505') {
          console.error('❌ Unique constraint violation:', betError.message);
          throw new Error(`This bet appears to be a duplicate. Please check if it was already saved.`);
        } else if (betError.code === '28P01') {
          console.error('❌ Authentication error with database:', betError.message);
          throw new Error(`Database authentication error. Please check your credentials.`);
        } else {
          throw new Error(`Failed to save bet: ${betError.message}`);
        }
      }
      
      if (!savedBet) {
        console.error('❌ No bet data returned after insert');
        throw new Error('Failed to save bet: No data returned from database');
      }
      
      console.log('✅ Horse racing bet saved successfully:', savedBet);
      return savedBet;
    } catch (dbError) {
      console.error('❌ Database operation error:', dbError);
      throw dbError;
    }
  } catch (error) {
    console.error('❌ Error saving parsed bet:', error);
    throw error;
  }
} 