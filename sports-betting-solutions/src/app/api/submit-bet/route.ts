import { NextRequest, NextResponse } from 'next/server';
import { betSubmissionService } from '@/lib/services/bet-submission-service';

/**
 * POST /api/submit-bet
 * 
 * API endpoint for submitting bets to Supabase via the bet submission service
 * This endpoint correctly logs all server-side operations for debugging
 */
export async function POST(req: NextRequest) {
  console.log('⭐️ [API] Bet submission API endpoint called');
  
  try {
    const body = await req.json();
    const { userId, formData, horses } = body;
    
    console.log('📝 [API] Bet submission request received:', {
      userId: userId,
      formData: formData,
      horsesCount: horses.length
    });
    
    // Validate request
    if (!userId) {
      console.error('❌ [API] Missing required field: userId');
      return NextResponse.json(
        { error: 'Missing required field: userId' },
        { status: 400 }
      );
    }
    
    if (!formData) {
      console.error('❌ [API] Missing required field: formData');
      return NextResponse.json(
        { error: 'Missing required field: formData' },
        { status: 400 }
      );
    }
    
    if (!Array.isArray(horses) || horses.length === 0) {
      console.error('❌ [API] Missing or invalid horses data');
      return NextResponse.json(
        { error: 'Missing or invalid horses data' },
        { status: 400 }
      );
    }
    
    console.log('✅ [API] Request validation passed, calling bet submission service');
    
    // Call the bet submission service
    const result = await betSubmissionService.submitBet(
      userId,
      formData,
      horses
    );
    
    console.log('📊 [API] Bet submission service result:', result);
    
    // Return the result
    if (result.success) {
      return NextResponse.json(
        { success: true, data: result.data },
        { status: 200 }
      );
    } else {
      console.error('❌ [API] Bet submission failed:', result.error);
      return NextResponse.json(
        { success: false, error: result.error || 'Unknown error', details: result.details },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('❌ [API] Unexpected error in bet submission API:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json(
      { success: false, error: `Server error: ${errorMessage}` },
      { status: 500 }
    );
  }
} 