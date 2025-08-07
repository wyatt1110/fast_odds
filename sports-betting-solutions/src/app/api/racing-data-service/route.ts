import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';

// Create a Supabase client with the service role key (server-side only)
const supabaseAdmin = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);

// Global cache for racing data
let cachedData: {
  races: any[];
  runners: any[];
  odds: any[];
  timeform: any[];
  lastUpdated: Date;
} | null = null;

// Cache duration: 30 seconds
const CACHE_DURATION = 30 * 1000;

// Function to load fresh data from Supabase
async function loadRacingData() {
  try {
    console.log('🔄 [RACING DATA SERVICE] Loading fresh data from Supabase...');
    
    // Get current UK date
    const today = new Date();
    const ukDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
    
    // Fetch today's races
    const { data: races, error: racesError } = await supabaseAdmin
      .from('races')
      .select('*')
      .eq('race_date', ukDate)
      .order('off_time', { ascending: true });

    if (racesError) {
      console.error('❌ [RACING DATA SERVICE] Error fetching races:', racesError);
      throw racesError;
    }

    if (!races || races.length === 0) {
      console.log(`⚠️ [RACING DATA SERVICE] No races found for date: ${ukDate}`);
      return {
        races: [],
        runners: [],
        odds: [],
        lastUpdated: new Date()
      };
    }

    // Get all race IDs
    const raceIds = races.map(race => race.race_id);

    // Fetch all runners for today's races
    const { data: runners, error: runnersError } = await supabaseAdmin
      .from('runners')
      .select('*')
      .in('race_id', raceIds)
      .order('race_id', { ascending: true })
      .order('number', { ascending: true });

    if (runnersError) {
      console.error('❌ [RACING DATA SERVICE] Error fetching runners:', runnersError);
      throw runnersError;
    }

    // Fetch all odds for today's races
    const { data: odds, error: oddsError } = await supabaseAdmin
      .from('odds')
      .select('*')
      .in('race_id', raceIds);

    if (oddsError) {
      console.error('❌ [RACING DATA SERVICE] Error fetching odds:', oddsError);
      throw oddsError;
    }

    // Fetch all timeform data for today's races
    const { data: timeform, error: timeformError } = await supabaseAdmin
      .from('timeform')
      .select('*')
      .in('race_id', raceIds);

    if (timeformError) {
      console.error('❌ [RACING DATA SERVICE] Error fetching timeform:', timeformError);
      throw timeformError;
    }

    console.log(`✅ [RACING DATA SERVICE] Loaded ${races.length} races, ${runners?.length || 0} runners, ${odds?.length || 0} odds records, ${timeform?.length || 0} timeform records`);

    return {
      races: races || [],
      runners: runners || [],
      odds: odds || [],
      timeform: timeform || [],
      lastUpdated: new Date()
    };

  } catch (error) {
    console.error('❌ [RACING DATA SERVICE] Error loading data:', error);
    throw error;
  }
}

// Function to get cached data or load fresh data
async function getRacingData() {
  const now = new Date();
  
  // Check if cache is valid
  if (cachedData && (now.getTime() - cachedData.lastUpdated.getTime()) < CACHE_DURATION) {
    console.log('📦 [RACING DATA SERVICE] Returning cached data');
    return cachedData;
  }

  // Load fresh data
  console.log('🔄 [RACING DATA SERVICE] Cache expired, loading fresh data...');
  cachedData = await loadRacingData();
  return cachedData;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service'); // 'pro-dashboard' or 'handicap-cards'
    const raceId = searchParams.get('raceId'); // For handicap cards
    const filters = {
      minOdds: searchParams.get('minOdds') || '',
      maxOdds: searchParams.get('maxOdds') || '',
      minEV1: searchParams.get('minEV1') || '',
      minEV2: searchParams.get('minEV2') || '',
      minPriceChange: searchParams.get('minPriceChange') || ''
    };

    console.log(`🔍 [RACING DATA SERVICE] Request for service: ${service}, raceId: ${raceId}`);

    // Get racing data (cached or fresh)
    const data = await getRacingData();

    if (service === 'handicap-cards') {
      // Return data for specific race
      if (!raceId) {
        return NextResponse.json({ error: 'Missing raceId for handicap cards service' }, { status: 400 });
      }

      const race = data.races.find(r => r.race_id === raceId);
      if (!race) {
        return NextResponse.json({ error: 'Race not found' }, { status: 404 });
      }

      const raceRunners = data.runners.filter(r => r.race_id === raceId);
      const raceOdds = data.odds.filter(o => o.race_id === raceId);
      const raceTimeform = data.timeform.filter(t => t.race_id === raceId);

      // Attach timeform data to runners
      const runnersWithTimeform = raceRunners.map(runner => {
        const timeformData = raceTimeform.find(t => t.horse_id === runner.horse_id);
        return {
          ...runner,
          timeform: timeformData || null
        };
      });

      return NextResponse.json({
        race,
        runners: runnersWithTimeform,
        odds: raceOdds,
        lastUpdated: data.lastUpdated
      });

    } else if (service === 'pro-dashboard') {
      // Return all data for pro dashboard (frontend will filter)
      // Attach timeform data to runners
      const runnersWithTimeform = data.runners.map(runner => {
        const timeformData = data.timeform.find(t => t.horse_id === runner.horse_id);
        return {
          ...runner,
          timeform: timeformData || null
        };
      });

      return NextResponse.json({
        races: data.races,
        runners: runnersWithTimeform,
        odds: data.odds,
        lastUpdated: data.lastUpdated,
        filters
      });

    } else {
      return NextResponse.json({ error: 'Invalid service parameter' }, { status: 400 });
    }

  } catch (error) {
    console.error('❌ [RACING DATA SERVICE] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
