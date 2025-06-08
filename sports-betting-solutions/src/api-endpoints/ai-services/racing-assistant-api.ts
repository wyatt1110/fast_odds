import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth/auth-utils';
import { callClaude } from '@/lib/claude/client';
import { callDeepseek } from '@/lib/deepseek/client';
import { RACING_ASSISTANT_PROMPT } from '@/lib/prompts/racing-assistant-prompt';
import { 
  createRacingBetWorkflow,
  getRacingBetWorkflow,
  updateRacingBetStatusWorkflow
} from '@/lib/workflows/racing-bet-workflow';
import { v4 as uuidv4 } from 'uuid';
import { getTrackCode } from '@/lib/data/track-codes';
import { EquibaseScraper } from '../equibase/scraper';
import { racingAPIService } from '@/lib/services/racing-api';
import { isUKTrack, findUKTrackByFuzzyMatch } from '@/lib/data/uk-tracks';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Define the action result type
interface ActionResult {
  action: string | null;
  data: any;
  error?: string;
  optionalFields?: string[];
  needsMoreInfo?: {
    type: 'track_not_found' | 'race_not_found' | 'horse_not_found' | 'missing_fields' | 'optional_fields';
    message: string;
    currentData: any;
  };
}

// Function to calculate string similarity (Levenshtein distance)
function stringSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();
  const costs: number[] = [];
  
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[s2.length] = lastValue;
    }
  }
  return 1 - (costs[s2.length] / Math.max(s1.length, s2.length));
}

// Function to find best matching horse
function findBestMatchingHorse(horseName: string, entries: any[]): any | null {
  const threshold = 0.8; // 80% similarity threshold
  let bestMatch = null;
  let bestSimilarity = 0;
  
  for (const entry of entries) {
    const similarity = stringSimilarity(horseName, entry.horseName);
    if (similarity > threshold && similarity > bestSimilarity) {
      bestMatch = entry;
      bestSimilarity = similarity;
    }
  }
  
  return bestMatch;
}

// Function to construct Equibase URL for USA races
function constructEquibaseUrl(track: string, date: string, raceNumber: string): string | null {
  try {
    // Parse date into MMDDYY format
    const parsedDate = new Date(date);
    const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
    const day = String(parsedDate.getDate()).padStart(2, '0');
    const year = String(parsedDate.getFullYear()).slice(-2);
    const dateCode = `${month}${day}${year}`;
    
    // Get track code from our database
    const trackCode = getTrackCode(track);
    if (!trackCode) {
      throw new Error(`Unknown track code for: ${track}`);
    }
    
    return `https://www.equibase.com/static/entry/${trackCode}${dateCode}USA${raceNumber}-EQB.html`;
  } catch (error) {
    console.error('Error constructing Equibase URL:', error);
    throw error;
  }
}

// Function to scrape race data from Equibase with retries
async function scrapeRaceData(url: string, maxRetries = 3): Promise<any> {
  let lastError = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const scraper = new EquibaseScraper();
      await scraper.init();
      
      const result = await scraper.scrapeRaceCard(url);
      
      if (!result.success || !result.race) {
        throw new Error(result.error || 'Failed to scrape race data');
      }
      
      return result.race;
    } catch (error: any) {
      lastError = error;
      console.error(`Scraping attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }
  
  throw lastError;
}

/**
 * Try to find race data from either Equibase (USA) or Racing API (UK)
 */
async function findRaceData(betData: any): Promise<any> {
  // Check if this is a UK track
  const isUK = isUKTrack(betData.track);
  const fuzzyUKMatch = !isUK ? findUKTrackByFuzzyMatch(betData.track) : null;

  // First try UK races if it's a UK track or has a fuzzy match
  if (isUK || fuzzyUKMatch) {
    try {
      // If we found a fuzzy match, update the track name
      if (fuzzyUKMatch) {
        const originalTrack = betData.track;
        betData.track = fuzzyUKMatch.name;
        console.log(`Using UK track "${fuzzyUKMatch.name}" for "${originalTrack}"`);
      }

      const ukRace = await racingAPIService.findRace(
        betData.track,
        betData.date,
        betData.race_number,
        betData.post_time
      );

      if (ukRace) {
        // Found UK race data
        const raceData = {
          raceType: ukRace.type,
          raceClass: ukRace.race_class,
          purse: ukRace.prize,
          distance: ukRace.distance_f,
          surface: ukRace.surface,
          going: ukRace.going,
          allEntries: ukRace.runners.map(runner => ({
            horseName: runner.horse,
            jockey: runner.jockey,
            trainer: runner.trainer,
            postPosition: runner.number,
            morningLineOdds: runner.ofr,
            weight: runner.lbs,
            age: runner.age,
            sex: runner.sex,
            owner: runner.owner,
            form: runner.form,
            lastRun: runner.last_run,
            headgear: runner.headgear
          }))
        };

        // Try to find the horse
        if (betData.horse) {
          const horseEntry = await racingAPIService.findHorseWithFuzzyMatch(ukRace, betData.horse);
          if (horseEntry) {
            return {
              success: true,
              race: raceData,
              horse: horseEntry,
              source: 'uk'
            };
          }
        }

        return {
          success: true,
          race: raceData,
          source: 'uk'
        };
      }
    } catch (error) {
      console.error('Error fetching UK race data:', error);
      // If it was a fuzzy match that failed, try USA
      if (fuzzyUKMatch) {
        console.log('Fuzzy UK track match failed, trying USA tracks...');
      } else {
        // It was a definite UK track, so return the error
        throw error;
      }
    }
  }

  // Try USA races with Equibase
  try {
    const equibaseUrl = constructEquibaseUrl(betData.track, betData.date, betData.race_number);
    if (equibaseUrl) {
      const raceData = await scrapeRaceData(equibaseUrl);
      return {
        success: true,
        race: raceData,
        source: 'usa'
      };
    }
  } catch (error) {
    // If we already tried UK (and failed) and now USA fails too, combine the error info
    if (isUK || fuzzyUKMatch) {
      throw new Error('Race not found in either UK or USA sources. Please verify the track name and race details.');
    }
    console.error('Error fetching USA race data:', error);
    throw error;
  }

  return {
    success: false,
    error: 'Could not find race data in UK or USA sources'
  };
}

/**
 * Detect if the message contains a specific action request related to racing bets
 */
export async function detectRacingAction(message: string): Promise<ActionResult> {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('record bet') || 
      lowerMessage.includes('add bet') || 
      lowerMessage.includes('new bet') ||
      lowerMessage.includes('track this bet')) {
    
    const betData: any = {};
    
    // Extract details with regex
    const horseNameMatch = message.match(/Horse:?\s*([^\n]+)/i);
    if (horseNameMatch) betData.horse = horseNameMatch[1].trim();
    
    const trackMatch = message.match(/Track:?\s*([^\n]+)/i);
    if (trackMatch) betData.track = trackMatch[1].trim();
    
    const dateMatch = message.match(/Date:?\s*([^\n]+)/i);
    if (dateMatch) betData.date = dateMatch[1].trim();
    
    // Extract race number or post time
    const raceNumberMatch = message.match(/Race (?:Number|#):?\s*(\d+)/i) || 
                          message.match(/Race:?\s*(\d+)/i);
    if (raceNumberMatch) betData.race_number = raceNumberMatch[1];
    
    const postTimeMatch = message.match(/Post Time:?\s*([^\n]+)/i);
    if (postTimeMatch) betData.post_time = postTimeMatch[1].trim();
    
    const stakeMatch = message.match(/Stake:?\s*\$?(\d+)/i);
    if (stakeMatch) betData.stake = parseFloat(stakeMatch[1]);
    
    const oddsMatch = message.match(/Odds:?\s*([^\n]+)/i);
    if (oddsMatch) betData.odds = oddsMatch[1].trim();
    
    const raceDistanceMatch = message.match(/Distance:?\s*([^\n]+)/i);
    if (raceDistanceMatch) betData.race_distance = raceDistanceMatch[1].trim();
    
    const raceSurfaceMatch = message.match(/Surface:?\s*([^\n]+)/i);
    if (raceSurfaceMatch) betData.race_surface = raceSurfaceMatch[1].trim();
    
    const bookmakerMatch = message.match(/Bookmaker:?\s*([^\n]+)/i);
    if (bookmakerMatch) betData.bookmaker = bookmakerMatch[1].trim();
    
    const eachWayMatch = message.match(/Each Way:?\s*(yes|y|true|no|n|false)/i);
    if (eachWayMatch) {
      const eachWayValue = eachWayMatch[1].toLowerCase();
      betData.each_way = ['yes', 'y', 'true'].includes(eachWayValue);
    }
    
    // Check for required fields first
    const missingFields = [];
    if (!betData.horse) missingFields.push('Horse Name');
    if (!betData.track) missingFields.push('Track');
    if (!betData.race_number && !betData.post_time) missingFields.push('Race Number or Post Time');
    if (!betData.date) missingFields.push('Race Date');
    if (!betData.stake) missingFields.push('Stake');
    if (!betData.odds) missingFields.push('Odds');
    if (!betData.bookmaker) missingFields.push('Bookmaker');
    
    if (missingFields.length > 0) {
      return {
        action: 'add_racing_bet',
        data: betData,
        needsMoreInfo: {
          type: 'missing_fields',
          message: `I need a few more details to record your bet. Could you please provide:\n\n${missingFields.map(field => `- ${field}`).join('\n')}\n\nYou can reply with just these missing details or provide all the information again.`,
          currentData: betData
        }
      };
    }
    
    // Try to find race data from either UK or USA sources
    if (betData.track && betData.date && (betData.race_number || betData.post_time)) {
      try {
        const raceResult = await findRaceData(betData);
        
        if (raceResult.success) {
          // Merge race data with bet data
          betData.race_type = raceResult.race.raceType;
          betData.race_class = raceResult.race.raceClass;
          betData.purse = raceResult.race.purse;
          betData.race_distance = raceResult.race.distance;
          betData.race_surface = raceResult.race.surface;
          betData.going = raceResult.race.going;
          betData.region = raceResult.source.toUpperCase();
          
          // Try to find the horse
          const horseEntry = betData.horse ? 
            raceResult.race.allEntries.find((entry: any) => 
              entry.horseName.toLowerCase() === betData.horse.toLowerCase()
            ) : null;
          
          if (horseEntry) {
            // Update horse details
            const originalName = betData.horse;
            betData.horse = horseEntry.horseName;
            betData.jockey = horseEntry.jockey;
            betData.trainer = horseEntry.trainer;
            betData.post_position = horseEntry.postPosition;
            betData.morning_line_odds = horseEntry.morningLineOdds;
            betData.weight = horseEntry.weight;
            
            // Additional UK-specific fields
            if (raceResult.source === 'uk') {
              betData.horse_age = horseEntry.age;
              betData.horse_sex = horseEntry.sex;
              betData.owner = horseEntry.owner;
              betData.form = horseEntry.form;
              betData.last_run = horseEntry.lastRun;
              betData.headgear = horseEntry.headgear;
            }
            
            // If the name was corrected, let the user know
            if (originalName.toLowerCase() !== horseEntry.horseName.toLowerCase()) {
              return {
                action: 'add_racing_bet',
                data: betData,
                needsMoreInfo: {
                  type: 'horse_not_found',
                  message: `I found "${horseEntry.horseName}" which seems to match your entry "${originalName}". Is this the correct horse? If yes, I'll use the official spelling. If not, please provide the exact horse name.`,
                  currentData: betData
                }
              };
            }
          } else if (betData.horse) {
            // Horse not found in the race
            return {
              action: 'add_racing_bet',
              data: betData,
              needsMoreInfo: {
                type: 'horse_not_found',
                message: `I couldn't find "${betData.horse}" in race ${betData.race_number || betData.post_time} at ${betData.track}. Here are the horses in this race:\n\n${raceResult.race.allEntries.map((entry: any) => `- ${entry.horseName}`).join('\n')}\n\nPlease verify the horse name and provide the correct one.`,
                currentData: betData
              }
            };
          }
        } else {
          // Race not found in either source
          return {
            action: 'add_racing_bet',
            data: betData,
            needsMoreInfo: {
              type: 'race_not_found',
              message: `I couldn't find the race at ${betData.track} on ${betData.date}${betData.race_number ? ` (Race ${betData.race_number})` : ''}${betData.post_time ? ` (Post time: ${betData.post_time})` : ''}. Could you please verify:\n\n1. The track name is spelled correctly\n2. The race number or post time is correct\n3. The date is correct (format: YYYY-MM-DD)\n\nOr, if you'd prefer, we can record this as a manual entry without the race details.`,
              currentData: betData
            }
          };
        }
      } catch (error: any) {
        console.error('Error finding race data:', error);
        return {
          action: 'add_racing_bet',
          data: betData,
          needsMoreInfo: {
            type: 'race_not_found',
            message: `I encountered an error while looking up the race details. Would you like to:\n\n1. Try again with corrected information\n2. Proceed with a manual entry\n\nError details: ${error.message}`,
            currentData: betData
          }
        };
      }
    }
    
    // Check for optional fields
    const optionalFields = [];
    if (!betData.race_type) optionalFields.push('Race Type');
    if (!betData.race_class) optionalFields.push('Race Class');
    if (!betData.race_distance) optionalFields.push('Race Distance');
    if (!betData.race_surface) optionalFields.push('Surface');
    if (!betData.jockey) optionalFields.push('Jockey');
    if (!betData.trainer) optionalFields.push('Trainer');
    if (!betData.morning_line_odds) optionalFields.push('Morning Line Odds');
    
    if (optionalFields.length > 0) {
      return {
        action: 'add_racing_bet',
        data: betData,
        needsMoreInfo: {
          type: 'optional_fields',
          message: `I have all the required information for your bet. Would you like to add any of these optional details?\n\n${optionalFields.map(field => `- ${field}`).join('\n')}\n\nYou can provide any of these details or say "continue" to save the bet as is.`,
          currentData: betData
        }
      };
    }
    
    // All good - return the bet data
    return {
      action: 'add_racing_bet',
      data: betData
    };
  }
  
  // Check for updating bet status
  if (lowerMessage.includes('update bet') || 
      lowerMessage.includes('change bet status') || 
      lowerMessage.includes('bet status')) {
      
    const betData: any = {};
    
    // Extract the bet ID
    const betIdMatch = message.match(/bet [iI][dD]:?\s*([a-zA-Z0-9-]+)/i);
    if (betIdMatch) betData.id = betIdMatch[1].trim();
    
    // Extract the new status
    const statusMatch = message.match(/status:?\s*([^\n]+)/i);
    if (statusMatch) betData.status = statusMatch[1].trim();
    
    if (betData.id && betData.status) {
      return {
        action: 'update_racing_bet',
        data: betData
      };
    }
  }
  
  // Check for getting a specific bet
  if (lowerMessage.includes('get bet') || 
      lowerMessage.includes('view bet') || 
      lowerMessage.includes('show bet')) {
      
    const betIdMatch = message.match(/bet [iI][dD]:?\s*([a-zA-Z0-9-]+)/i);
    if (betIdMatch) {
      return {
        action: 'get_racing_bet',
        data: {
          id: betIdMatch[1].trim()
        }
      };
    }
  }
  
  // No specific action detected
  return {
    action: null,
    data: {}
  };
}

/**
 * POST handler for the horse racing AI chat
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    
    // Check for custom user data in request (for testing)
    const body = await request.json();
    const customUser = body.user || null;
    
    // Use authenticated user or custom user data
    const activeUser = user || customUser;
    
    if (!activeUser) {
      return NextResponse.json(
        { error: 'Authentication required or custom user data needed' },
        { status: 401 }
      );
    }

    // Extract custom table name if provided
    const customTable = customUser?.table || null;
    
    // Extract Equibase data if provided by test script
    const equibaseData = body.equibaseData || null;
    
    // Validate that we have messages
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'Messages are required and must be an array' },
        { status: 400 }
      );
    }

    // Check if this is a direct action request
    const lastUserMessage = [...body.messages].reverse().find(msg => msg.role === 'user');
    let actionResult = null;
    
    if (lastUserMessage) {
      const { action, data, needsMoreInfo } = await detectRacingAction(lastUserMessage.content);
      
      // If we need more information, return that to the user
      if (needsMoreInfo) {
        return NextResponse.json({
          message: needsMoreInfo.message,
          action: action,
          current_data: needsMoreInfo.currentData,
          needs_more_info: needsMoreInfo.type
        });
      }
      
      // Add custom table information to the data if provided
      if (customTable) {
        data.table = customTable;
      }
      
      // Add Equibase data to bet data if available
      if (action === 'add_racing_bet' && equibaseData) {
        // Merge Equibase data with extracted data, but don't override existing values
        Object.entries(equibaseData).forEach(([key, value]) => {
          const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase(); // Convert camelCase to snake_case
          if (!data[dbKey] && value) {
            data[dbKey] = value;
          }
        });
      }
      
      if (action === 'add_racing_bet' && Object.keys(data).length > 0) {
        // Execute add racing bet workflow
        actionResult = await createRacingBetWorkflow(activeUser.id, data);
      } else if (action === 'update_racing_bet' && data.id) {
        // Execute update racing bet workflow
        actionResult = await updateRacingBetStatusWorkflow(
          activeUser.id, 
          data.id, 
          data.status || 'Complete',
          customTable // Pass custom table
        );
      } else if (action === 'get_racing_bet' && data.id) {
        // Execute get racing bet workflow
        actionResult = await getRacingBetWorkflow(
          activeUser.id, 
          data.id,
          customTable // Pass custom table
        );
      }
    }

    // Check if we need to fetch recent bets for context
    const includeBets = body.includeBets !== false; // Default to including bets
    let bettingContext = '';
    
    if (includeBets) {
      // Fetch recent racing bets (limit to 5) to provide context
      const { data: recentBets, error: betsError } = await supabase
        .from('horse_racing_bets')
        .select('*')
        .eq('user_id', activeUser.id)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (!betsError && recentBets && recentBets.length > 0) {
        bettingContext = `
Recent Racing Bets:
${recentBets.map((bet, index) => `
Bet ${index + 1}:
- Horse: ${bet.horse_name || 'Not specified'}
- Track: ${bet.track_name}
- Race #: ${bet.race_number || 'Not specified'}
- Date: ${bet.race_date}
- Stake: ${bet.stake}
- Odds: ${bet.odds}
- Status: ${bet.status}
${bet.bet_type ? `- Bet Type: ${bet.bet_type}` : ''}
${bet.profit_loss ? `- Profit/Loss: ${bet.profit_loss}` : ''}
${bet.id ? `- Bet ID: ${bet.id}` : ''}
`).join('')}
`;
      }
    }

    // Add action result to context if available
    let actionContext = '';
    if (actionResult) {
      actionContext = `
Action Result:
${JSON.stringify(actionResult, null, 2)}

Please incorporate this information in your response.
`;
    }

    // Prepare the system prompt with context
    const systemPrompt = [RACING_ASSISTANT_PROMPT, bettingContext, actionContext]
      .filter(Boolean)
      .join('\n\n');

    // Determine if this is a simple task (for AI model selection)
    const isSimpleTask = !actionResult || actionResult !== null; // Use cheaper model for successful actions
    
    // Call the appropriate AI service
    let response;
    if (isSimpleTask && !body.isPremiumUser) {
      response = await callDeepseek(
        body.messages,
        activeUser.id,
        systemPrompt,
        body.maxTokens || 1000
      );
    } else {
      response = await callClaude(
        body.messages, 
        activeUser.id,
        systemPrompt,
        body.maxTokens || 1000
      );
    }

    // Return the AI response with action result
    return NextResponse.json({
      message: response.response,
      usage: response.usage,
      model_used: isSimpleTask && !body.isPremiumUser ? 'deepseek' : 'claude',
      action_result: actionResult
    });
  } catch (error: any) {
    console.error('Error in Racing Chat API:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 