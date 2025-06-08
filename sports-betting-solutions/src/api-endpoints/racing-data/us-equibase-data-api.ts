/**
 * Equibase scraper endpoint for North American horse racing data
 * This API calls the actual scraper to get data from Equibase.com
 */

import { EquibaseScraper } from '../../../../sports-betting-solutions/src/app/api/equibase/scraper';

interface EquibaseRequest {
  horseName: string;
  trackName: string;
  raceDate?: string;
}

interface HorseEntry {
  horseName: string;
  postPosition: string;
  ageSex: string;
  jockey: string;
  trainer: string;
  morningLineOdds: string;
  weight: string;
  medications: string;
  equipment: string;
}

export async function POST(request: Request) {
  try {
    console.log("*** EQUIBASE SCRAPER ENDPOINT ***");
    const body = await request.json() as EquibaseRequest;
    const { horseName, trackName, raceDate = new Date().toISOString().split('T')[0] } = body;

    console.log(`Equibase scraper request: ${JSON.stringify({ horseName, trackName, raceDate })}`);
    
    if (!horseName || !trackName) {
      return Response.json({
        metadata: {
          search_success: false,
          errors: ['Both horseName and trackName are required']
        }
      }, { status: 400 });
    }

    // Initialize the scraper
    const scraper = new EquibaseScraper();
    await scraper.init();
    
    // Try to build a URL to scrape based on available information
    // This is a simplified approach - in a real app, you'd have more robust URL construction
    let url = null;
    
    // Check if the URL was directly provided in the horseName (AI might include it)
    if (horseName.startsWith('http') && horseName.includes('equibase.com')) {
      url = horseName;
    } else {
      // This is where you would construct a URL or use a search mechanism
      // For now, we'll return an error that direct URL is required
      await scraper.close();
      return Response.json({
        metadata: {
          search_success: false,
          track_found: false,
          race_found: false,
          horse_found: false,
          search_date: raceDate,
          navigation_path: "",
          errors: [`Please provide a direct Equibase URL to scrape. The AI assistant should construct the correct Equibase URL.`]
        }
      });
    }
    
    // Scrape the race card
    const result = await scraper.scrapeRaceCard(url);
    await scraper.close();
    
    if (!result.success || !result.race) {
      return Response.json({
        metadata: {
          search_success: false,
          track_found: false,
          race_found: false,
          horse_found: false,
          search_date: raceDate,
          navigation_path: "",
          errors: [result.error || 'Failed to scrape race data']
        }
      });
    }
    
    // Find the specific horse in the entries
    const horseEntry = result.race.allEntries.find((entry: HorseEntry) => 
      entry.horseName.toLowerCase().includes(horseName.toLowerCase()));
    
    // Format the response to match the expected structure
    return Response.json({
      metadata: {
        search_success: true,
        track_found: true,
        race_found: true,
        horse_found: !!horseEntry,
        search_date: raceDate,
        navigation_path: `Equibase > ${result.race.track} > Race ${result.race.raceNumber}`,
        search_time: 1000
      },
      data: {
        race_data: {
          track_name: result.race.track,
          race_number: result.race.raceNumber,
          race_date: raceDate,
          post_time: result.race.raceType.includes('Post') ? result.race.raceType : 'TBD',
          race_type: result.race.raceType,
          race_distance: result.race.distance,
          surface: result.race.surface,
          purse: result.race.purse,
          race_conditions: result.race.raceClass,
          race_restrictions: "",
          weather_conditions: ""
        },
        horse_data: horseEntry ? {
          horse_name: horseEntry.horseName,
          program_number: parseInt(horseEntry.postPosition) || 0,
          morning_line_odds: horseEntry.morningLineOdds,
          jockey: horseEntry.jockey,
          trainer: horseEntry.trainer,
          owner: "",
          weight: horseEntry.weight,
          medications: horseEntry.medications,
          equipment: horseEntry.equipment,
          career_record: "",
          last_raced: "",
          breeding: "",
          color: "",
          age: parseInt(horseEntry.ageSex.split('/')[0]) || 0,
          sex: horseEntry.ageSex.split('/')[1] || ""
        } : null
      }
    });
  } catch (error) {
    console.error(`Equibase scraper error: ${error}`);
    return Response.json(
      {
        metadata: {
          search_success: false,
          track_found: false,
          race_found: false,
          horse_found: false,
          search_date: new Date().toISOString().split('T')[0],
          navigation_path: "",
          search_time: 0,
          errors: [(error as Error).message]
        }
      },
      { status: 500 }
    );
  }
} 