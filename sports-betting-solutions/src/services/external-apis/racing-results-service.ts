import axios from 'axios';

const RACING_API_BASE_URL = 'https://api.theracingapi.com/v1';
const RACING_API_USERNAME = 'KQ9W7rQeAHWMUgxH93ie3yEc';
const RACING_API_PASSWORD = 'T5BoPivL3Q2h6RhCdLv4EwZu';

interface RacingAPIRunner {
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

interface RacingAPIRacecard {
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
  runners: RacingAPIRunner[];
}

interface RacingAPIResponse {
  racecards: RacingAPIRacecard[];
  query: any[][];
}

export class RacingAPIService {
  private static instance: RacingAPIService;
  private cachedRacecards: RacingAPIRacecard[] | null = null;
  private lastCacheTime: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private constructor() {}

  public static getInstance(): RacingAPIService {
    if (!RacingAPIService.instance) {
      RacingAPIService.instance = new RacingAPIService();
    }
    return RacingAPIService.instance;
  }

  private async fetchRacecards(): Promise<RacingAPIRacecard[]> {
    try {
      const response = await axios.get<RacingAPIResponse>(`${RACING_API_BASE_URL}/racecards/free`, {
        auth: {
          username: RACING_API_USERNAME,
          password: RACING_API_PASSWORD
        }
      });

      return response.data.racecards;
    } catch (error) {
      console.error('Error fetching racecards:', error);
      throw new Error('Failed to fetch UK race data');
    }
  }

  private isCacheValid(): boolean {
    return (
      this.cachedRacecards !== null &&
      Date.now() - this.lastCacheTime < this.CACHE_DURATION
    );
  }

  public async getRacecards(): Promise<RacingAPIRacecard[]> {
    if (!this.isCacheValid()) {
      this.cachedRacecards = await this.fetchRacecards();
      this.lastCacheTime = Date.now();
    }
    return this.cachedRacecards!;
  }

  public async findRace(track: string, date: string, raceNumber?: string, postTime?: string): Promise<RacingAPIRacecard | null> {
    const racecards = await this.getRacecards();
    const searchDate = new Date(date).toISOString().split('T')[0];

    return racecards.find(race => {
      const raceDate = race.date.split('T')[0];
      const courseMatch = race.course.toLowerCase() === track.toLowerCase();
      const dateMatch = raceDate === searchDate;
      
      if (raceNumber) {
        // Extract race number from race name if possible
        const raceNumberMatch = race.race_name.match(/Race (\d+)/i);
        if (raceNumberMatch && raceNumberMatch[1] === raceNumber) {
          return courseMatch && dateMatch;
        }
      }
      
      if (postTime) {
        // Compare post time if provided
        const raceTime = race.off_time;
        return courseMatch && dateMatch && raceTime === postTime;
      }
      
      return courseMatch && dateMatch;
    }) || null;
  }

  public async findHorse(race: RacingAPIRacecard, horseName: string): Promise<RacingAPIRunner | null> {
    const normalizedHorseName = horseName.toLowerCase().trim();
    
    return race.runners.find(runner => 
      runner.horse.toLowerCase().trim() === normalizedHorseName
    ) || null;
  }

  public async findHorseWithFuzzyMatch(race: RacingAPIRacecard, horseName: string, similarityThreshold: number = 0.8): Promise<RacingAPIRunner | null> {
    let bestMatch: RacingAPIRunner | null = null;
    let bestSimilarity = 0;
    
    const normalizedSearchName = horseName.toLowerCase().trim();
    
    for (const runner of race.runners) {
      const normalizedHorseName = runner.horse.toLowerCase().trim();
      const similarity = this.calculateStringSimilarity(normalizedSearchName, normalizedHorseName);
      
      if (similarity > similarityThreshold && similarity > bestSimilarity) {
        bestMatch = runner;
        bestSimilarity = similarity;
      }
    }
    
    return bestMatch;
  }

  private calculateStringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const costs: number[] = [];
    for (let i = 0; i <= shorter.length; i++) {
      let lastValue = i;
      for (let j = 0; j <= longer.length; j++) {
        if (i === 0) {
          costs[j] = j;
        } else if (j > 0) {
          let newValue = costs[j - 1];
          if (shorter.charAt(i - 1) !== longer.charAt(j - 1)) {
            newValue = Math.min(
              Math.min(newValue, lastValue),
              costs[j]
            ) + 1;
          }
          costs[j - 1] = lastValue;
          lastValue = newValue;
        }
      }
      if (i > 0) {
        costs[longer.length] = lastValue;
      }
    }
    
    return 1.0 - (costs[longer.length] / longer.length);
  }
}

// Export a singleton instance
export const racingAPIService = RacingAPIService.getInstance(); 