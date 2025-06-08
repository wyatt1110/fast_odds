import { supabase } from '@/lib/supabase';

// Import Json type from Supabase
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Race {
  race_id: string;
  course: string;
  course_id: string;
  race_date: string;
  off_time: string | null;
  off_dt: string | null;
  race_name: string | null;
  distance: string | null;
  distance_f: number | null;
  distance_round: string | null;
  pattern: string | null;
  race_class: string | null;
  type: string | null;
  age_band: string | null;
  rating_band: string | null;
  sex_restriction: string | null;
  going: string | null;
  going_detailed: string | null;
  surface: string | null;
  weather: string | null;
  jumps: string | null;
  prize: string | null;
  field_size: number | null;
  rail_movements: string | null;
  stalls: string | null;
  region: string | null;
  big_race: boolean | null;
  is_abandoned: boolean | null;
  tip: string | null;
  verdict: string | null;
  betting_forecast: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Runner {
  id: number;
  race_id: string | null;
  horse_id: string;
  horse_name: string;
  number: string | null;
  draw: string | null;
  dob: string | null;
  age: number | null;
  sex: string | null;
  sex_code: string | null;
  colour: string | null;
  region: string | null;
  breeder: string | null;
  sire: string | null;
  sire_id: string | null;
  sire_region: string | null;
  dam: string | null;
  dam_id: string | null;
  dam_region: string | null;
  damsire: string | null;
  damsire_id: string | null;
  damsire_region: string | null;
  trainer: string | null;
  trainer_id: string | null;
  trainer_location: string | null;
  trainer_rtf: string | null;
  trainer_14_days_runs: number | null;
  trainer_14_days_wins: number | null;
  trainer_14_days_percent: string | null;
  jockey: string | null;
  jockey_id: string | null;
  owner: string | null;
  owner_id: string | null;
  weight_lbs: string | null;
  headgear: string | null;
  headgear_run: string | null;
  wind_surgery: string | null;
  wind_surgery_run: string | null;
  form: string | null;
  last_run: string | null;
  ofr: string | null;
  rpr: string | null;
  ts: string | null;
  comment: string | null;
  spotlight: string | null;
  silk_url: string | null;
  past_results_flags: Json | null;
  prev_trainers: Json | null;
  prev_owners: Json | null;
  quotes: Json | null;
  stable_tour: Json | null;
  medical: Json | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface TrackData {
  name: string;
  races: RaceData[];
}

export interface RaceData {
  race_id: string;
  time: string;
  name: string;
  distance: string;
  prize: string;
  runners: number;
  raceType: string;
  course: string;
  going: string;
  weather: string;
  field_size: number;
  big_race: boolean;
  off_dt: string;
  race_class: string | null;
  pattern: string | null;
}

export interface RacecardsStats {
  totalTracks: number;
  totalRaces: number;
  totalRunners: number;
  totalPrizeMoney: string;
}

// Get current UK date in YYYY-MM-DD format
// After 00:30 GMT, it shows the current day's races
// Before 00:30 GMT, it shows the previous day's races (to allow for overnight data upload)
const getCurrentUKRaceDate = (): string => {
  // Get current time in UK timezone (GMT/BST)
  const now = new Date();
  const ukTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/London"}));
  
  // If it's before 00:30 GMT, use previous day's date
  // This gives time for new racecards to be uploaded after midnight
  if (ukTime.getHours() === 0 && ukTime.getMinutes() < 30) {
    const yesterday = new Date(ukTime);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday.toISOString().split('T')[0];
  }
  
  // Otherwise use current UK date
  return ukTime.toISOString().split('T')[0];
};

// Get race type from race data
const getRaceType = (race: Race): string => {
  if (race.type) {
    const type = race.type.toLowerCase();
    if (type.includes('flat')) return 'Flat';
    if (type.includes('hurdle')) return 'Hurdle';
    if (type.includes('chase')) return 'Chase';
    if (type.includes('national hunt')) return 'Hurdle';
  }
  
  // Fallback to surface or distance analysis
  if (race.surface && race.surface.toLowerCase() === 'turf') {
    if (race.jumps && race.jumps.length > 0) {
      return race.jumps.toLowerCase().includes('hurdle') ? 'Hurdle' : 'Chase';
    }
    return 'Flat';
  }
  
  return 'Flat'; // Default
};

// Format time from off_time or off_dt
const formatRaceTime = (race: Race): string => {
  if (race.off_time) {
    return race.off_time;
  }
  
  if (race.off_dt) {
    const date = new Date(race.off_dt);
    return date.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  }
  
  return 'TBC';
};

// Format prize money
const formatPrizeMoney = (prize: string | null): string => {
  if (!prize) return '£0';
  
  // If already formatted, return as is
  if (prize.startsWith('£')) return prize;
  
  // Try to parse and format
  const numericValue = parseFloat(prize.replace(/[^\d.]/g, ''));
  if (!isNaN(numericValue)) {
    return `£${numericValue.toLocaleString()}`;
  }
  
  return prize;
};

// Fetch today's races from Supabase (UK date-based)
export const getTodaysRaces = async (): Promise<Race[]> => {
  const currentUKDate = getCurrentUKRaceDate();
  
  console.log(`Fetching races for UK date: ${currentUKDate}`);
  
  const { data, error } = await supabase
    .from('races')
    .select('*')
    .eq('race_date', currentUKDate)
    .eq('is_abandoned', false)
    .order('off_dt', { ascending: true });
  
  if (error) {
    console.error('Error fetching races:', error);
    throw new Error('Failed to fetch races');
  }
  
  console.log(`Found ${data?.length || 0} races for ${currentUKDate}`);
  return data || [];
};

// Get runner count for a specific race (only for today's races)
export const getRaceRunnerCount = async (raceId: string): Promise<number> => {
  const currentUKDate = getCurrentUKRaceDate();
  
  // First verify the race is for today
  const { data: raceData, error: raceError } = await supabase
    .from('races')
    .select('race_date')
    .eq('race_id', raceId)
    .eq('race_date', currentUKDate)
    .single();
  
  if (raceError || !raceData) {
    console.log(`Race ${raceId} not found for current UK date ${currentUKDate}`);
    return 0;
  }
  
  const { count, error } = await supabase
    .from('runners')
    .select('*', { count: 'exact', head: true })
    .eq('race_id', raceId);
  
  if (error) {
    console.error('Error fetching runner count:', error);
    return 0;
  }
  
  return count || 0;
};

// Get runner counts for multiple races (only for today's races)
export const getMultipleRaceRunnerCounts = async (raceIds: string[]): Promise<Record<string, number>> => {
  const currentUKDate = getCurrentUKRaceDate();
  
  if (raceIds.length === 0) {
    return {};
  }
  
  // First get valid race IDs for today
  const { data: validRaces, error: raceError } = await supabase
    .from('races')
    .select('race_id')
    .in('race_id', raceIds)
    .eq('race_date', currentUKDate);
  
  if (raceError) {
    console.error('Error validating race dates:', raceError);
    return {};
  }
  
  const validRaceIds = validRaces?.map(r => r.race_id) || [];
  
  if (validRaceIds.length === 0) {
    return {};
  }
  
  const { data, error } = await supabase
    .from('runners')
    .select('race_id')
    .in('race_id', validRaceIds);
  
  if (error) {
    console.error('Error fetching runner counts:', error);
    return {};
  }
  
  // Count runners per race
  const counts: Record<string, number> = {};
  data?.forEach(runner => {
    if (runner.race_id) {
      counts[runner.race_id] = (counts[runner.race_id] || 0) + 1;
    }
  });
  
  return counts;
};

// Transform races into track-grouped format (UK date-based)
export const getTrackGroupedRaces = async (): Promise<TrackData[]> => {
  const races = await getTodaysRaces();
  
  if (races.length === 0) {
    return [];
  }
  
  // Get runner counts for all races
  const raceIds = races.map(race => race.race_id);
  const runnerCounts = await getMultipleRaceRunnerCounts(raceIds);
  
  // Group races by course
  const trackMap = new Map<string, RaceData[]>();
  
  races.forEach(race => {
    const raceData: RaceData = {
      race_id: race.race_id,
      time: formatRaceTime(race),
      name: race.race_name || 'Unnamed Race',
      distance: race.distance_round || race.distance || 'Unknown',
      prize: formatPrizeMoney(race.prize),
      runners: runnerCounts[race.race_id] || race.field_size || 0,
      raceType: getRaceType(race),
      course: race.course,
      going: race.going || 'Unknown',
      weather: race.weather || 'Unknown',
      field_size: race.field_size || 0,
      big_race: race.big_race || false,
      off_dt: race.off_dt || '',
      race_class: race.race_class,
      pattern: race.pattern
    };
    
    if (!trackMap.has(race.course)) {
      trackMap.set(race.course, []);
    }
    
    trackMap.get(race.course)!.push(raceData);
  });
  
  // Convert to array and sort races within each track by time
  const tracks: TrackData[] = Array.from(trackMap.entries()).map(([course, races]) => ({
    name: course,
    races: races.sort((a, b) => {
      // Sort by off_dt if available, otherwise by time string
      if (a.off_dt && b.off_dt) {
        return new Date(a.off_dt).getTime() - new Date(b.off_dt).getTime();
      }
      return a.time.localeCompare(b.time);
    })
  }));
  
  // Sort tracks alphabetically
  tracks.sort((a, b) => a.name.localeCompare(b.name));
  
  return tracks;
};

// Calculate racecards statistics (UK date-based)
export const getRacecardsStats = async (): Promise<RacecardsStats> => {
  const tracks = await getTrackGroupedRaces();
  
  const totalTracks = tracks.length;
  const totalRaces = tracks.reduce((sum, track) => sum + track.races.length, 0);
  const totalRunners = tracks.reduce((sum, track) => 
    sum + track.races.reduce((raceSum, race) => raceSum + race.runners, 0), 0
  );
  
  // Calculate total prize money
  let totalPrizeValue = 0;
  tracks.forEach(track => {
    track.races.forEach(race => {
      const prizeValue = parseFloat(race.prize.replace(/[£,]/g, '')) || 0;
      totalPrizeValue += prizeValue;
    });
  });
  
  const totalPrizeMoney = `£${totalPrizeValue.toLocaleString()}`;
  
  return {
    totalTracks,
    totalRaces,
    totalRunners,
    totalPrizeMoney
  };
};

// Get runners for a specific race (allow any date for debugging)
export const getRaceRunners = async (raceId: string): Promise<Runner[]> => {
  console.log(`Fetching runners for race ID: ${raceId}`);
  
  const { data, error } = await supabase
    .from('runners')
    .select('*')
    .eq('race_id', raceId)
    .order('number', { ascending: true });
  
  if (error) {
    console.error('Error fetching race runners:', error);
    throw new Error('Failed to fetch race runners');
  }
  
  console.log(`Found ${data?.length || 0} runners for race ${raceId}`);
  if (data && data.length > 0) {
    console.log('Sample runner:', data[0]);
  }
  
  return data || [];
};

// Get odds for a specific race (allow any date for debugging)
export const getRaceOdds = async (raceId: string) => {
  console.log(`Fetching odds for race ID: ${raceId}`);
  
  const { data, error } = await supabase
    .from('odds')
    .select('*')
    .eq('race_id', raceId);
  
  if (error) {
    console.error('Error fetching race odds:', error);
    return [];
  }
  
  console.log(`Found ${data?.length || 0} odds records for race ${raceId}`);
  if (data && data.length > 0) {
    console.log('Sample odds record:', data[0]);
  }
  
  return data || [];
};

// Get odds for multiple races (only for today's races)
export const getMultipleRaceOdds = async (raceIds: string[]) => {
  const currentUKDate = getCurrentUKRaceDate();
  
  if (raceIds.length === 0) {
    return {};
  }
  
  // First get valid race IDs for today
  const { data: validRaces, error: raceError } = await supabase
    .from('races')
    .select('race_id')
    .in('race_id', raceIds)
    .eq('race_date', currentUKDate);
  
  if (raceError) {
    console.error('Error validating race dates for odds:', raceError);
    return {};
  }
  
  const validRaceIds = validRaces?.map(r => r.race_id) || [];
  
  if (validRaceIds.length === 0) {
    return {};
  }
  
  const { data, error } = await supabase
    .from('odds')
    .select('*')
    .in('race_id', validRaceIds)
    .eq('race_date', currentUKDate);
  
  if (error) {
    console.error('Error fetching multiple race odds:', error);
    return {};
  }
  
  // Group odds by race_id
  const oddsMap: Record<string, any[]> = {};
  data?.forEach(odd => {
    if (!oddsMap[odd.race_id]) {
      oddsMap[odd.race_id] = [];
    }
    oddsMap[odd.race_id].push(odd);
  });
  
  return oddsMap;
};

// Check if races are still live (not finished) - UK time based
export const filterLiveRaces = (races: Race[]): Race[] => {
  const currentUKDate = getCurrentUKRaceDate();
  const now = new Date();
  const ukTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/London"}));
  const tenMinutesAgo = new Date(ukTime.getTime() - 10 * 60 * 1000);
  
  return races.filter(race => {
    // Only include races for current UK date
    if (race.race_date !== currentUKDate) {
      return false;
    }
    
    if (!race.off_dt) return true; // Keep races without off_dt
    
    const raceTime = new Date(race.off_dt);
    return raceTime > tenMinutesAgo; // Keep races that started less than 10 minutes ago
  });
};

// Utility function to get current UK date info for debugging
export const getCurrentUKDateInfo = () => {
  const now = new Date();
  const ukTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/London"}));
  const currentUKDate = getCurrentUKRaceDate();
  
  return {
    utcTime: now.toISOString(),
    ukTime: ukTime.toISOString(),
    ukHour: ukTime.getHours(),
    ukMinute: ukTime.getMinutes(),
    raceDate: currentUKDate,
    isAfterCutoff: !(ukTime.getHours() === 0 && ukTime.getMinutes() < 30)
  };
}; 