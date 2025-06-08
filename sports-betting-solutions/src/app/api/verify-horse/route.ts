import { NextResponse } from 'next/server';
import { horseVerificationService } from '@/lib/services/horse-verification-service';
import { parseISO, isValid, format } from 'date-fns';

/**
 * API route to verify horse information
 */
export async function POST(request: Request) {
  try {
    console.log('📝 Horse verification API request received');
    const horseData = await request.json();

    // Log incoming request
    console.log(`🔍 Horse verification request: ${JSON.stringify({
      horse: horseData.horse_name,
      track: horseData.track_name,
      date: horseData.race_date,
      race: horseData.race_number
    })}`);

    // Validate the request body
    if (!horseData || !horseData.horse_name || !horseData.track_name || !horseData.race_date) {
      console.error('❌ Missing required horse data');
      return NextResponse.json(
        { message: 'Missing required horse data (name, track, or date)' },
        { status: 400 }
      );
    }

    // Ensure we have a proper date format (YYYY-MM-DD)
    if (horseData.race_date) {
      try {
        // Handle legacy 'today' or 'tomorrow' strings
        if (horseData.race_date === 'today') {
          const today = new Date();
          horseData.race_date = format(today, 'yyyy-MM-dd');
          console.log(`📅 Converted 'today' to formatted date: ${horseData.race_date}`);
        } 
        else if (horseData.race_date === 'tomorrow') {
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          horseData.race_date = format(tomorrow, 'yyyy-MM-dd');
          console.log(`📅 Converted 'tomorrow' to formatted date: ${horseData.race_date}`);
        }
        // Otherwise, ensure the date is in correct format
        else {
          // Parse the date string
          const parsedDate = parseISO(horseData.race_date);
          
          if (!isValid(parsedDate)) {
            console.error(`❌ Invalid date format: ${horseData.race_date}`);
            return NextResponse.json(
              { message: 'Invalid date format. Please use a valid date in YYYY-MM-DD format.' },
              { status: 400 }
            );
          }
          
          // Ensure consistent YYYY-MM-DD format
          horseData.race_date = format(parsedDate, 'yyyy-MM-dd');
          console.log(`📅 Using formatted date: ${horseData.race_date}`);
        }
      } catch (error) {
        console.error(`❌ Error parsing date: ${horseData.race_date}`, error);
        return NextResponse.json(
          { message: 'Invalid date format. Please use a valid date in YYYY-MM-DD format.' },
          { status: 400 }
        );
      }
    }

    // Perform horse verification
    const verificationResult = await horseVerificationService.verifyHorseData(horseData);

    if (verificationResult.isVerified) {
      // Successful verification - return verified data with original fields preserved
      console.log('✅ Horse verified successfully, sending response to client');
      return NextResponse.json({
        isVerified: true,
        verificationDetails: verificationResult.verificationDetails || 'Horse data verified successfully',
        horse: verificationResult.horse
      });
    } else {
      // Verification failed
      console.log('❌ Horse verification failed, sending error to client');
      return NextResponse.json({
        isVerified: false,
        errorMessage: verificationResult.errorMessage || 'Verification failed',
        verificationDetails: verificationResult.verificationDetails
      });
    }
  } catch (error) {
    console.error('💥 Error in horse verification API:', error);
    
    return NextResponse.json(
      { 
        isVerified: false,
        errorMessage: error instanceof Error ? error.message : 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
} 