import { NextRequest, NextResponse } from 'next/server';

// API credentials for The Racing API
const USERNAME = 'KQ9W7rQeAHWMUgxH93ie3yEc';
const PASSWORD = 'T5BoPivL3Q2h6RhCdLv4EwZu';
const BASE_URL = 'https://api.theracingapi.com/v1';

// Mock data for when the API is unavailable
const MOCK_RACECARDS = {
  "success": true,
  "data": [
    {
      "course": "Cheltenham",
      "date": "2024-03-13",
      "off_time": "3:20",
      "off_dt": "2024-03-13T15:20:00Z",
      "race_name": "Gold Cup Chase (Grade 1)",
      "distance_f": "3m 2f 70y",
      "region": "GB",
      "pattern": "Grade 1",
      "race_class": "1",
      "type": "Chase",
      "age_band": "5yo+",
      "rating_band": "0-0",
      "prize": "£625,000",
      "field_size": "11",
      "going": "Good to Soft",
      "surface": "Turf",
      "runners": [
        {
          "horse": "Fact To File",
          "age": "7",
          "sex": "Gelding",
          "sex_code": "g",
          "colour": "Bay",
          "region": "IRE",
          "dam": "Bonny And Bright",
          "sire": "Fame And Glory",
          "damsire": "Oscar",
          "trainer": "W P Mullins",
          "owner": "Mr & Mrs S Ricci",
          "number": "1",
          "draw": "",
          "headgear": "",
          "lbs": "11-07",
          "ofr": "",
          "jockey": "M P Walsh",
          "last_run": "14",
          "form": "1-111"
        },
        {
          "horse": "Galopin Des Champs",
          "age": "8",
          "sex": "Gelding",
          "sex_code": "g",
          "colour": "Bay",
          "region": "FR",
          "dam": "Clairica",
          "sire": "Timos",
          "damsire": "Maille Pistolet",
          "trainer": "W P Mullins",
          "owner": "Mrs Audrey Turley",
          "number": "2",
          "draw": "",
          "headgear": "",
          "lbs": "11-07",
          "ofr": "",
          "jockey": "P Townend",
          "last_run": "45",
          "form": "11111"
        },
        {
          "horse": "Shishkin",
          "age": "9",
          "sex": "Gelding",
          "sex_code": "g",
          "colour": "Bay",
          "region": "IRE",
          "dam": "Trophee",
          "sire": "Sholokhov",
          "damsire": "Hawk Wing",
          "trainer": "N Henderson",
          "owner": "Mrs J Donnelly",
          "number": "3",
          "draw": "",
          "headgear": "",
          "lbs": "11-07",
          "ofr": "",
          "jockey": "N de Boinville",
          "last_run": "83",
          "form": "31U11"
        },
        {
          "horse": "Bravemansgame",
          "age": "9",
          "sex": "Gelding",
          "sex_code": "g",
          "colour": "Bay",
          "region": "FR",
          "dam": "Griffiness",
          "sire": "Brave Mansonnien",
          "damsire": "Kings Theatre",
          "trainer": "P Nicholls",
          "owner": "Bryan Drew",
          "number": "4",
          "draw": "",
          "headgear": "",
          "lbs": "11-07",
          "ofr": "",
          "jockey": "H Cobden",
          "last_run": "38",
          "form": "21332"
        }
      ]
    }
  ]
};

/**
 * Handler for UK racing data requests
 * Uses The Racing API to fetch official racing data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      course, 
      date = new Date().toISOString().split('T')[0], // Default to today
      horseName,
      raceTime 
    } = body;

    console.log(`UK Racing API request: ${JSON.stringify({ course, date, horseName, raceTime })}`);

    if (!course) {
      return NextResponse.json(
        { error: 'Course name is required' },
        { status: 400 }
      );
    }

    try {
      // Create basic auth header
      const authHeader = `Basic ${Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64')}`;

      // Build the URL for racecards
      // If specific race time provided, we could filter later
      let endpoint = `${BASE_URL}/racecards`;
      
      // Add query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('course', course);
      queryParams.append('date', date);
      
      const apiUrl = `${endpoint}?${queryParams.toString()}`;
      
      // Make the API request
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Racing API error: ${response.status} - ${errorText}`);
        
        // If we have auth errors or rate limits (401/429), return mock data for demo
        if (response.status === 401 || response.status === 429) {
          console.log('Using mock data due to API limitations');
          
          // If horse name provided, filter the mock data
          if (horseName) {
            const matchingHorse = MOCK_RACECARDS.data[0].runners.find(runner => 
              runner.horse.toLowerCase().includes(horseName.toLowerCase())
            );
            
            if (!matchingHorse) {
              return NextResponse.json({
                success: false,
                message: `Horse '${horseName}' not found in mock data for ${course}`,
                data: null
              });
            }
            
            // Return the single race with only the matching horse
            const raceWithHorse = {
              ...MOCK_RACECARDS.data[0],
              runners: [matchingHorse]
            };
            
            return NextResponse.json({
              success: true,
              message: 'Using mock data (API limit reached)',
              data: raceWithHorse
            });
          }
          
          // Return all mock data
          return NextResponse.json({
            success: true,
            message: 'Using mock data (API limit reached)',
            data: MOCK_RACECARDS.data
          });
        }
        
        return NextResponse.json(
          { 
            error: `Failed to fetch racing data: ${response.status}`,
            details: errorText
          },
          { status: response.status }
        );
      }

      // Parse the response
      const data = await response.json();
      
      // If a specific horse name is provided, filter the results
      if (horseName) {
        // Find races that contain the horse
        const matchingRaces = data.racecards.filter((racecard: any) => {
          return racecard.runners.some((runner: any) => 
            runner.horse.toLowerCase().includes(horseName.toLowerCase())
          );
        });
        
        if (matchingRaces.length === 0) {
          return NextResponse.json(
            {
              success: false,
              message: `Horse '${horseName}' not found at ${course} on ${date}`,
              data: null
            },
            { status: 404 }
          );
        }
        
        // If race time is provided, further filter by that
        if (raceTime) {
          const raceWithTime = matchingRaces.find((race: any) => 
            race.off_time.includes(raceTime)
          );
          
          if (raceWithTime) {
            return NextResponse.json({
              success: true,
              data: raceWithTime
            });
          } else {
            // Return all matches if specific time not found
            return NextResponse.json({
              success: true,
              message: `Horse found but not at specified time ${raceTime}`,
              data: matchingRaces
            });
          }
        }
        
        // Return all matching races
        return NextResponse.json({
          success: true,
          data: matchingRaces
        });
      }
      
      // If we just want all races at the course on the date
      return NextResponse.json({
        success: true,
        data: data.racecards
      });
    } catch (apiError: any) {
      console.error('Error calling Racing API:', apiError);
      
      // Fallback to mock data if API call fails
      console.log('Using mock data due to API error');
      
      // If horse name provided, filter the mock data
      if (horseName) {
        const matchingHorse = MOCK_RACECARDS.data[0].runners.find(runner => 
          runner.horse.toLowerCase().includes(horseName.toLowerCase())
        );
        
        if (!matchingHorse) {
          return NextResponse.json({
            success: false,
            message: `Horse '${horseName}' not found in mock data for ${course}`,
            data: null
          });
        }
        
        // Return the single race with only the matching horse
        const raceWithHorse = {
          ...MOCK_RACECARDS.data[0],
          runners: [matchingHorse]
        };
        
        return NextResponse.json({
          success: true,
          message: 'Using mock data (API error)',
          data: raceWithHorse
        });
      }
      
      // Return all mock data
      return NextResponse.json({
        success: true,
        message: 'Using mock data (API error)',
        data: MOCK_RACECARDS.data
      });
    }
  } catch (error: any) {
    console.error('Error in UK Racing API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process racing request',
        details: error.message 
      },
      { status: 500 }
    );
  }
} 