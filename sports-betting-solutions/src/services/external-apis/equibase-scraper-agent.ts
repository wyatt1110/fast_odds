import OpenAI from 'openai';
import { EQUIBASE_SCRAPER_PROMPT } from '../prompts/equibase-scraper-prompt';

// Types for the scraper agent

export interface EquibaseRequestData {
  horseName: string;
  trackName: string;
  raceDate?: string;
}

export interface EquibaseSearchMetadata {
  search_success: boolean;
  track_found: boolean;
  race_found: boolean;
  horse_found: boolean;
  search_date: string;
  navigation_path: string;
  search_time?: number;
  errors?: string[];
}

export interface EquibaseRaceData {
  track_name: string;
  race_number: number;
  race_date: string;
  post_time: string;
  race_type: string;
  race_distance: string;
  surface: string;
  purse: string;
  race_conditions: string;
  race_restrictions: string;
  weather_conditions: string;
}

export interface EquibaseHorseData {
  horse_name: string;
  program_number: number;
  morning_line_odds: string;
  jockey: string;
  trainer: string;
  owner: string;
  weight: string;
  medications: string;
  equipment: string;
  career_record: string;
  last_raced: string;
  breeding: string;
  color: string;
  age: number;
  sex: string;
}

export interface EquibaseSearchResult {
  metadata: EquibaseSearchMetadata;
  data?: {
    race_data: EquibaseRaceData;
    horse_data: EquibaseHorseData;
  };
}

/**
 * Equibase Scraper Agent
 * This service uses the OpenAI API with browsing capabilities to navigate
 * Equibase website and extract structured data about horses and races
 */
export class EquibaseScraperAgent {
  private openai: OpenAI | null = null;
  private isInitialized = false;
  private cache: Map<string, EquibaseSearchResult> = new Map();

  constructor() {
    // Initialize OpenAI with environment variables
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.error('OPENAI_API_KEY environment variable not set');
      return;
    }

    this.openai = new OpenAI({
      apiKey: apiKey,
    });
    
    this.isInitialized = true;
  }

  /**
   * Generate a cache key for the request
   */
  private generateCacheKey(data: EquibaseRequestData): string {
    return `${data.horseName}|${data.trackName}|${data.raceDate || ''}`;
  }

  /**
   * Extract JSON from the AI response text
   */
  private extractJsonFromText(text: string): EquibaseSearchResult | null {
    try {
      // Find JSON-like content between triple backticks
      const jsonMatch = text.match(/```(?:json)?([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1].trim());
      }

      // Try to parse the whole response as JSON
      return JSON.parse(text.trim());
    } catch (e) {
      console.error('Failed to extract JSON from text:', e);
      // Return a basic error result
      return {
        metadata: {
          search_success: false,
          track_found: false,
          race_found: false,
          horse_found: false,
          search_date: new Date().toISOString().split('T')[0],
          navigation_path: '',
          errors: ['Failed to parse AI response']
        }
      };
    }
  }

  /**
   * Search Equibase for racing data
   */
  public async search(data: EquibaseRequestData): Promise<EquibaseSearchResult> {
    if (!this.isInitialized || !this.openai) {
      return {
        metadata: {
          search_success: false,
          track_found: false,
          race_found: false,
          horse_found: false,
          search_date: new Date().toISOString().split('T')[0],
          navigation_path: '',
          errors: ['Equibase scraper agent not initialized']
        }
      };
    }

    // Check cache first
    const cacheKey = this.generateCacheKey(data);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const startTime = Date.now();

    try {
      // Prepare the user message with search parameters
      let userMessage = `Please find information for horse "${data.horseName}" at track "${data.trackName}"`;
      if (data.raceDate) {
        userMessage += ` on race date ${data.raceDate}`;
      }
      
      userMessage += `. Return all available race and horse data in JSON format according to the required schema.`;

      // Call the OpenAI API with web browsing enabled
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: [
          { role: 'system', content: EQUIBASE_SCRAPER_PROMPT },
          { role: 'user', content: userMessage }
        ],
        // Use the correct format for tool calling
        tools: [{
          type: 'function',
          function: {
            name: 'search_equibase',
            description: 'Search Equibase for horse racing information',
            parameters: {
              type: 'object',
              properties: {
                horseName: {
                  type: 'string',
                  description: 'Name of the horse to search for'
                },
                trackName: {
                  type: 'string',
                  description: 'Name of the track'
                },
                raceDate: {
                  type: 'string',
                  description: 'Date of the race in YYYY-MM-DD format'
                }
              },
              required: ['horseName', 'trackName']
            }
          }
        }]
      });

      const responseText = response.choices[0]?.message?.content || '';
      console.log('Equibase search response:', responseText);

      // Extract the structured data from the response
      const result = this.extractJsonFromText(responseText);
      
      if (result) {
        // Add search time
        result.metadata.search_time = Date.now() - startTime;
        
        // Cache the result
        this.cache.set(cacheKey, result);
        
        return result;
      } else {
        // Return error result
        const errorResult: EquibaseSearchResult = {
          metadata: {
            search_success: false,
            track_found: false,
            race_found: false,
            horse_found: false,
            search_date: new Date().toISOString().split('T')[0],
            navigation_path: '',
            search_time: Date.now() - startTime,
            errors: ['Failed to extract structured data from response']
          }
        };
        return errorResult;
      }
    } catch (error: any) {
      console.error('Error searching Equibase:', error);
      
      // Return error result
      const errorResult: EquibaseSearchResult = {
        metadata: {
          search_success: false,
          track_found: false,
          race_found: false,
          horse_found: false,
          search_date: new Date().toISOString().split('T')[0],
          navigation_path: '',
          search_time: Date.now() - startTime,
          errors: [error.message || 'Unknown error']
        }
      };
      return errorResult;
    }
  }

  /**
   * Clear the cache
   */
  public clearCache(): void {
    this.cache.clear();
  }
}

// Export a singleton instance
export const equibaseScraperAgent = new EquibaseScraperAgent(); 