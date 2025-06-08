import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth/auth-utils';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface RouteParams {
  params: {
    id: string;
  };
}

/**
 * GET handler to fetch a specific bet by ID
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const betId = params.id;
    
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Fetch the bet with related sport-specific details
    const { data: bet, error } = await supabase
      .from('bets')
      .select(`
        *,
        horse_racing_bets (*),
        football_bets (*),
        basketball_bets (*)
      `)
      .eq('id', betId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Bet not found' },
          { status: 404 }
        );
      }
      
      console.error('Error fetching bet:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bet' },
        { status: 500 }
      );
    }

    return NextResponse.json({ bet });
  } catch (error) {
    console.error('Error in GET /api/bets/[id]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * PUT handler to update an existing bet
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const betId = params.id;
    
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

    // Check if the bet exists and belongs to the user
    const { data: existingBet, error: fetchError } = await supabase
      .from('bets')
      .select('id, user_id, sport')
      .eq('id', betId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Bet not found' },
          { status: 404 }
        );
      }
      
      console.error('Error fetching bet for update:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch bet for update' },
        { status: 500 }
      );
    }

    // Prepare the update data for the base bet
    const betUpdate = {
      event_name: body.event_name,
      selection: body.selection,
      stake: body.stake,
      odds: body.odds,
      status: body.status,
      result: body.result,
      profit_loss: body.profit_loss,
      settled_at: body.status !== 'pending' ? new Date().toISOString() : null,
      closing_odds: body.closing_odds,
      notes: body.notes,
      competition: body.competition,
      event_date: body.event_date,
      metadata: body.metadata
    };

    // Update the bet
    const { data: updatedBet, error: updateError } = await supabase
      .from('bets')
      .update(betUpdate)
      .eq('id', betId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating bet:', updateError);
      return NextResponse.json(
        { error: 'Failed to update bet' },
        { status: 500 }
      );
    }

    // Handle updating sport-specific details if needed
    if (existingBet.sport === 'horse_racing' && body.horse_racing_details) {
      const hrDetails = {
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
        .update(hrDetails)
        .eq('bet_id', betId);

      if (hrError) {
        console.error('Error updating horse racing details:', hrError);
        // Continue anyway, we have updated the base bet
      }
    } else if (existingBet.sport === 'football' && body.football_details) {
      const fbDetails = {
        home_team: body.football_details.home_team,
        away_team: body.football_details.away_team,
        league: body.football_details.league,
        match_time: body.football_details.match_time,
        bet_market: body.football_details.bet_market,
        handicap: body.football_details.handicap
      };

      const { error: fbError } = await supabase
        .from('football_bets')
        .update(fbDetails)
        .eq('bet_id', betId);

      if (fbError) {
        console.error('Error updating football details:', fbError);
        // Continue anyway, we have updated the base bet
      }
    } else if (existingBet.sport === 'basketball' && body.basketball_details) {
      const bbDetails = {
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
        .update(bbDetails)
        .eq('bet_id', betId);

      if (bbError) {
        console.error('Error updating basketball details:', bbError);
        // Continue anyway, we have updated the base bet
      }
    }

    return NextResponse.json({ bet: updatedBet });
  } catch (error) {
    console.error('Error in PUT /api/bets/[id]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler to remove a bet
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const betId = params.id;
    
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if the bet exists and belongs to the user
    const { data: existingBet, error: fetchError } = await supabase
      .from('bets')
      .select('id, user_id, sport')
      .eq('id', betId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Bet not found' },
          { status: 404 }
        );
      }
      
      console.error('Error fetching bet for deletion:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch bet for deletion' },
        { status: 500 }
      );
    }

    // Delete sport-specific details first (due to foreign key constraints)
    if (existingBet.sport === 'horse_racing') {
      await supabase
        .from('horse_racing_bets')
        .delete()
        .eq('bet_id', betId);
    } else if (existingBet.sport === 'football') {
      await supabase
        .from('football_bets')
        .delete()
        .eq('bet_id', betId);
    } else if (existingBet.sport === 'basketball') {
      await supabase
        .from('basketball_bets')
        .delete()
        .eq('bet_id', betId);
    }

    // Delete the base bet
    const { error: deleteError } = await supabase
      .from('bets')
      .delete()
      .eq('id', betId);

    if (deleteError) {
      console.error('Error deleting bet:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete bet' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/bets/[id]:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 