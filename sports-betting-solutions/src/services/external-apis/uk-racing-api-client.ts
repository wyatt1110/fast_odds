/**
 * UK Racing API Client
 * Client-side service to interact with UK racing data
 */

export interface UKRaceRequest {
  course: string;
  date?: string;
  horseName?: string;
  raceTime?: string;
}

export interface RaceRunner {
  horse: string;
  age: string;
  sex: string;
  sex_code: string;
  colour: string;
  region: string;
  dam: string;
  sire: string;
  damsire: string;
  trainer: string;
  owner: string;
  number: string;
  draw: string;
  headgear: string;
  lbs: string;
  ofr: string;
  jockey: string;
  last_run: string;
  form: string;
}

export interface RaceCard {
  course: string;
  date: string;
  off_time: string;
  off_dt: string;
  race_name: string;
  distance_f: string;
  region: string;
  pattern: string;
  race_class: string;
  type: string;
  age_band: string;
  rating_band: string;
  prize: string;
  field_size: string;
  going: string;
  surface: string;
  runners: RaceRunner[];
}

export interface UKRaceResponse {
  success: boolean;
  message?: string;
  data: RaceCard | RaceCard[] | null;
}

/**
 * Fetches UK racing data from our backend API
 */
export async function fetchUKRaceData(request: UKRaceRequest): Promise<UKRaceResponse> {
  try {
    console.log(`Fetching UK racing data for:`, request);
    
    // Normalize track name - remove "racecourse" suffix if present
    const normalizedCourse = request.course
      .replace(/\s+racecourse$/i, '')
      .replace(/\s+races$/i, '')
      .trim();
    
    const apiRequest = {
      ...request,
      course: normalizedCourse
    };
    
    // Make API request
    const response = await fetch('/api/racing/uk', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apiRequest),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error fetching UK race data:', errorData);
      return {
        success: false,
        message: errorData.error || `Failed to fetch race data: ${response.status}`,
        data: null
      };
    }

    const result = await response.json();
    console.log('UK Racing API response:', result);
    
    return result;
  } catch (error: any) {
    console.error('Error in UK racing client:', error);
    return {
      success: false,
      message: error.message || 'Failed to fetch UK racing data',
      data: null
    };
  }
}

/**
 * Formats a race card for display in the chat
 */
export function formatRaceCardForDisplay(raceCard: RaceCard): string {
  let formattedText = '';
  
  // Race details header
  formattedText += `**${raceCard.race_name}**\n`;
  formattedText += `📍 ${raceCard.course} | ${formatDate(raceCard.date)} | ${raceCard.off_time}\n`;
  formattedText += `🏁 ${raceCard.distance_f} | ${raceCard.type} | Class ${raceCard.race_class}\n`;
  formattedText += `🌱 Going: ${raceCard.going} | Surface: ${raceCard.surface} | Prize: ${raceCard.prize}\n\n`;
  
  // Runners table
  formattedText += `**Runners:**\n`;
  
  raceCard.runners.forEach(runner => {
    formattedText += `**${runner.number}. ${runner.horse}** (${runner.age}${runner.sex_code})\n`;
    formattedText += `🏇 Jockey: ${runner.jockey} | 👨‍🏫 Trainer: ${runner.trainer}\n`;
    formattedText += `⚖️ Weight: ${runner.lbs}`;
    if (runner.draw) formattedText += ` | 🔢 Draw: ${runner.draw}`;
    formattedText += `\n`;
    if (runner.form) formattedText += `📊 Form: ${runner.form}\n`;
    formattedText += '\n';
  });
  
  return formattedText;
}

/**
 * Takes an array of race cards and formats the basic details for display
 */
export function formatRaceSummariesForDisplay(raceCards: RaceCard[]): string {
  let formattedText = '';
  
  if (!raceCards || raceCards.length === 0) {
    return "No races found for the requested criteria.";
  }
  
  formattedText += `**Today's Races at ${raceCards[0].course}**\n\n`;
  
  raceCards.forEach((race, index) => {
    formattedText += `**${race.off_time}** - ${race.race_name}\n`;
    formattedText += `${race.distance_f} | ${race.type} | ${race.field_size} runners | Going: ${race.going}\n\n`;
  });
  
  return formattedText;
}

/**
 * Helper function to format a date string
 */
function formatDate(dateString: string): string {
  // Convert YYYY-MM-DD to a more readable format
  try {
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const day = parseInt(parts[2], 10);
    const month = months[parseInt(parts[1], 10) - 1];
    
    return `${day} ${month} ${parts[0]}`;
  } catch (e) {
    return dateString;
  }
}

/**
 * Find a horse in a race card by name
 */
export function findHorseInRace(raceCard: RaceCard, horseName: string): RaceRunner | null {
  if (!horseName || !raceCard.runners) return null;
  
  // Normalize the horse name for comparison
  const normalizedSearchName = horseName.toLowerCase().trim();
  
  // Find the best match
  return raceCard.runners.find(runner => 
    runner.horse.toLowerCase().includes(normalizedSearchName)
  ) || null;
}

/**
 * Format detailed horse information
 */
export function formatHorseDetails(horse: RaceRunner): string {
  let details = `**${horse.horse}**\n`;
  details += `🏇 Jockey: ${horse.jockey}\n`;
  details += `👨‍🏫 Trainer: ${horse.trainer}\n`;
  details += `👤 Owner: ${horse.owner}\n`;
  details += `ℹ️ Details: ${horse.age}${horse.sex_code}, ${horse.colour}\n`;
  
  if (horse.sire || horse.dam) {
    details += `🧬 Breeding: `;
    if (horse.sire) details += `Sire: ${horse.sire}`;
    if (horse.sire && horse.dam) details += ` | `;
    if (horse.dam) details += `Dam: ${horse.dam}`;
    details += `\n`;
  }
  
  details += `⚖️ Weight: ${horse.lbs}`;
  if (horse.draw) details += ` | 🔢 Draw: ${horse.draw}`;
  details += `\n`;
  
  if (horse.form) details += `📊 Form: ${horse.form}\n`;
  
  return details;
} 