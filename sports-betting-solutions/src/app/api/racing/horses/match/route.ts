import { NextResponse } from 'next/server';
import { Horse } from '@/lib/racing-api/types';

const API_USERNAME = process.env.RACING_API_USERNAME || 'KQ9W7rQeAHWMUgxH93ie3yEc';
const API_PASSWORD = process.env.RACING_API_PASSWORD || 'T5BoPivL3Q2h6RhCdLv4EwZu';
const BASE_URL = 'https://api.theracingapi.com/v1';

/**
 * API route for matching horses by name
 * This route proxies requests to the theracingapi.com horse search endpoint
 */
export async function GET(request: Request) {
  try {
    // Get the name parameter from the query string
    const { searchParams } = new URL(request.url);
    const horseName = searchParams.get('name');
    
    // Make sure a name was provided
    if (!horseName) {
      return NextResponse.json(
        { error: 'Missing name parameter' },
        { status: 400 }
      );
    }
    
    // Create authorization header
    const auth = Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64');
    
    const url = `${BASE_URL}/horses/match?name=${encodeURIComponent(horseName)}`;
    console.log(`Server proxy making request to: ${url}`);
    
    // Make the authenticated request to the racing API
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Disable caching
    });
    
    // Get the response data
    const data = await response.json();
    
    // Check if the response was successful
    if (!response.ok) {
      console.error('API Error:', data);
      return NextResponse.json(
        { error: data.message || 'An error occurred with the Racing API' },
        { status: response.status }
      );
    }
    
    // Format the response to include all needed fields for our database schema
    if (data.horse) {
      const horse = data.horse;
      const racecard = data.racecard;
      
      // Make a better attempt to get jockey and trainer
      let jockey = 'Unknown';
      if (horse.jockey && horse.jockey !== '') {
        jockey = horse.jockey;
      } else if (racecard?.horses) {
        // Try to find the horse in the racecard and get the jockey
        const matchedHorse = racecard.horses.find((h: Horse) => h.horse_id === horse.horse_id || h.horse === horse.horse);
        if (matchedHorse && matchedHorse.jockey) {
          jockey = matchedHorse.jockey;
        }
      }
      
      // Same for trainer
      let trainer = 'Unknown';
      if (horse.trainer && horse.trainer !== '') {
        trainer = horse.trainer;
      } else if (racecard?.horses) {
        // Try to find the horse in the racecard and get the trainer
        const matchedHorse = racecard.horses.find((h: Horse) => h.horse_id === horse.horse_id || h.horse === horse.horse);
        if (matchedHorse && matchedHorse.trainer) {
          trainer = matchedHorse.trainer;
        }
      }
      
      // Extract race date and time if available
      let raceDate = '';
      let raceTime = '';
      if (racecard && racecard.date) {
        raceDate = racecard.date;
      }
      if (racecard && racecard.off_time) {
        raceTime = racecard.off_time;
      }
      
      // Extract race number if available (sometimes in the name)
      let raceNumber = null;
      if (racecard && racecard.race_name) {
        const match = racecard.race_name.match(/(\d+)/);
        if (match) {
          raceNumber = parseInt(match[1], 10);
        }
      }
      
      // Extract class information
      let classType = '';
      if (racecard && racecard.race_class) {
        classType = racecard.race_class;
      } else if (racecard && racecard.class) {
        classType = racecard.class;
      }
      
      // Extract purse/prize information
      let purse = null;
      if (racecard && racecard.prize) {
        // Remove currency symbol and commas
        purse = racecard.prize.replace(/[£,$,€,¥,₹,₽,₩,\s,comma]/g, '');
      } else if (racecard && racecard.prize_money) {
        purse = racecard.prize_money.replace(/[£,$,€,¥,₹,₽,₩,\s,comma]/g, '');
      }
      
      // Extract distance
      let distance = '';
      if (racecard && racecard.distance) {
        distance = racecard.distance;
      } else if (racecard && racecard.distance_round) {
        distance = racecard.distance_round;
      }
      
      // Format the track/course name
      let trackName = '';
      if (racecard && racecard.course) {
        if (typeof racecard.course === 'string') {
          trackName = racecard.course;
        } else if (racecard.course.name) {
          trackName = racecard.course.name;
        }
      }
      
      // Format post position if available (sometimes called 'number' or 'draw')
      let postPosition = null;
      if (horse.number) {
        postPosition = parseInt(horse.number, 10);
      } else if (horse.draw) {
        postPosition = parseInt(horse.draw, 10);
      }
      
      // Enhanced response data matching our DB schema
      const enhancedResponse = {
        horse: {
          ...horse,
          formatted: {
            horse_name: horse.horse || '',
            jockey: jockey,
            trainer: trainer,
            track_name: trackName,
            race_number: raceNumber,
            race_date: raceDate,
            scheduled_race_time: raceTime,
            race_location: trackName, // Often the same as track_name
            post_position: postPosition,
            class_type: classType,
            distance: distance,
            purse: purse
          }
        },
        racecard: racecard
      };
      
      console.log('Enhanced horse match:', JSON.stringify(enhancedResponse.horse.formatted, null, 2));
      
      // Return the enhanced API response
      return NextResponse.json(enhancedResponse);
    }
    
    // Return the original API response if no horse data
    return NextResponse.json(data);
  } catch (error) {
    console.error('Horse matching API error:', error);
    return NextResponse.json(
      { error: 'Failed to match horse' },
      { status: 500 }
    );
  }
} 