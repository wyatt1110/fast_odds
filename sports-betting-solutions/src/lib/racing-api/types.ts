/**
 * Racing API Types
 * These types represent the data structures used in the Racing API
 */

// Error types for better error handling
export enum ErrorType {
  API_CONNECTION = 'api_connection', 
  API_RESPONSE = 'api_response',
  DATA_MISSING = 'data_missing',
  NO_MATCH = 'no_match',
  SUPABASE = 'SUPABASE'              // Supabase error
}

// Horse information
export interface Horse {
  horse_id: string;
  horse: string;
  dob: string;
  age: string;
  sex: string;
  sex_code: string;
  colour: string;
  region: string;
  trainer: string;
  trainer_id: string;
  trainer_location: string;
  owner: string;
  owner_id?: string;
  jockey: string;
  jockey_id: string;
  silk_url?: string;
  lbs?: string;
  last_run?: string;
  form?: string;
  course?: string | { name: string };
  // Add other fields as needed
}

// Race information (basic structure)
export interface Race {
  id: string;
  name: string;
  course: {
    id: string;
    name: string;
    country: string;
  };
  date: string;
  time: string;
  distance: string;
  class: string;
  age_range: string;
  going: string;
  prize_money: string;
  race_type: string;
  number_of_runners: number;
  horses: Horse[];
}

// Racecard from theracingapi.com
export interface Racecard {
  race_id: string;
  course: string | { name: string };
  course_id?: string;
  date: string;
  off_time: string;
  race_name: string;
  distance: string;
  going: string;
  runners: Horse[];
  // Add other fields as needed
}

// API error
export class RacingApiError extends Error {
  status: number;
  type: ErrorType;
  
  constructor(message: string, status: number, type: ErrorType) {
    super(message);
    this.name = 'RacingApiError';
    this.status = status;
    this.type = type;
  }
}

// Horse match result (matches Supabase schema)
export interface HorseMatch {
  id: string;
  horse_name: string;
  jockey: string;
  trainer: string;
  track_name: string;
  race_number: number | null;
  race_date: string;
  scheduled_race_time: string;
  race_location: string;
  post_position: number | null;
  class_type: string;
  distance: string;
  purse: string | number | null;
} 