import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth/auth-utils';

import { config } from '@/lib/config';

// Initialize Supabase client
const supabaseUrl = config.supabase.url;
const supabaseServiceKey = config.supabase.serviceKey;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * GET handler to fetch bets for the authenticated user
 * Supports filtering by sport, date range, and status
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const sport = searchParams.get('sport');
    const status = searchParams.get('status');
    const fromDate = searchParams.get('from');
    const toDate = searchParams.get('to');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // Build the query
    let query = supabase
      .from('bets')
      .select(`
        *,
        horse_racing_bets (*),
        football_bets (*),
        basketball_bets (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters if provided
    if (sport) {
      query = query.eq('sport', sport);
    }
    
    if (status) {
      query = query.eq('status', status);
    }
    
    if (fromDate) {
      query = query.gte('created_at', fromDate);
    }
    
    if (toDate) {
      query = query.lte('created_at', toDate);
    }

    // Execute the query
    const { data: bets, error } = await query;

    if (error) {
      console.error('Error fetching bets:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bets' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bets });
  } catch (error) {
    console.error('Error in GET /api/bets:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * POST handler to create a new bet
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['sport', 'event_name', 'selection', 'stake', 'odds', 'bet_type', 'bankroll_id'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }

    // Create the base bet
    const baseBet = {
      user_id: user.id,
      sport: body.sport,
      event_name: body.event_name,
      selection: body.selection,
      stake: body.stake,
      odds: body.odds,
      bet_type: body.bet_type,
      bankroll_id: body.bankroll_id,
      status: body.status || 'pending',
      competition: body.competition,
      event_date: body.event_date,
      notes: body.notes,
      metadata: body.metadata || {}
    };

    // Insert the base bet
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .insert(baseBet)
      .select()
      .single();

    if (betError) {
      console.error('Error creating bet:', betError);
      return NextResponse.json(
        { error: 'Failed to create bet' },
        { status: 500 }
      );
    }

    // Handle sport-specific details if provided
    if (body.sport === 'horse_racing' && body.horse_racing_details) {
      const hrDetails = {
        bet_id: bet.id,
        track_name: body.horse_racing_details.track_name,
        race_number: body.horse_racing_details.race_number,
        horse_name: body.horse_racing_details.horse_name,
        jockey: body.horse_racing_details.jockey,
        trainer: body.horse_racing_details.trainer,
        race_distance: body.horse_racing_details.race_distance,
        race_type: body.horse_racing_details.race_type,
        track_condition: body.horse_racing_details.track_condition,
        barrier_position: body.horse_racing_details.barrier_position,
        weight_carried: body.horse_racing_details.weight_carried
      };

      const { error: hrError } = await supabase
        .from('horse_racing_bets')
        .insert(hrDetails);

      if (hrError) {
        console.error('Error adding horse racing details:', hrError);
        // Continue anyway, we have the base bet
      }
    } else if (body.sport === 'football' && body.football_details) {
      const fbDetails = {
        bet_id: bet.id,
        home_team: body.football_details.home_team,
        away_team: body.football_details.away_team,
        league: body.football_details.league,
        match_time: body.football_details.match_time,
        bet_market: body.football_details.bet_market,
        handicap: body.football_details.handicap
      };

      const { error: fbError } = await supabase
        .from('football_bets')
        .insert(fbDetails);

      if (fbError) {
        console.error('Error adding football details:', fbError);
        // Continue anyway, we have the base bet
      }
    } else if (body.sport === 'basketball' && body.basketball_details) {
      const bbDetails = {
        bet_id: bet.id,
        home_team: body.basketball_details.home_team,
        away_team: body.basketball_details.away_team,
        league: body.basketball_details.league,
        match_time: body.basketball_details.match_time,
        bet_market: body.basketball_details.bet_market,
        handicap: body.basketball_details.handicap,
        quarter: body.basketball_details.quarter,
        player_name: body.basketball_details.player_name
      };

      const { error: bbError } = await supabase
        .from('basketball_bets')
        .insert(bbDetails);

      if (bbError) {
        console.error('Error adding basketball details:', bbError);
        // Continue anyway, we have the base bet
      }
    }

    return NextResponse.json({ bet }, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/bets:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 