import { NextRequest, NextResponse } from 'next/server';

// Racing API credentials
const RACING_API_USERNAME = process.env.RACING_API_USERNAME || 'KQ9W7rQeAHWMUgxH93ie3yEc';
const RACING_API_PASSWORD = process.env.RACING_API_PASSWORD || 'T5BoPivL3Q2h6RhCdLv4EwZu';
const BASE_URL = 'https://api.theracingapi.com/v1';

interface JockeyStats {
  rides: number;
  wins: number;
  win_percentage: number;
  profit_loss: number;
}

interface JockeyAnalysisRequest {
  jockey_name: string;
  trainer?: string;
  course?: string;
  owner?: string;
  distance?: string;
}

// Helper function to clean names by removing brackets and their contents
function cleanName(name: string | undefined | null): string {
  if (!name || typeof name !== 'string') return '';
  // Remove anything in parentheses/brackets and trim whitespace
  return name.replace(/\s*\([^)]*\)\s*/g, '').replace(/\s*\[[^\]]*\]\s*/g, '').trim();
}

// Helper function for API calls with proper error handling
async function makeAPICall(endpoint: string, params: Record<string, any> = {}, delayMs: number = 300): Promise<any> {
  try {
    // Add minimal delay to respect rate limits
    if (delayMs > 0) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
    
    const url = new URL(`${BASE_URL}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(v => url.searchParams.append(key, v));
      } else if (value !== undefined && value !== null) {
        url.searchParams.append(key, value.toString());
      }
    });

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${RACING_API_USERNAME}:${RACING_API_PASSWORD}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    return null;
  }
}

// Helper function to calculate stats from race results
function calculateStats(results: any[], jockeyName: string): JockeyStats {
  if (!results || !results.length) {
    return { rides: 0, wins: 0, win_percentage: 0, profit_loss: 0 };
  }
  
  let rides = 0;
  let wins = 0;
  let profit_loss = 0;
  
  results.forEach(race => {
    if (race.runners) {
      const jockeyRuns = race.runners.filter((runner: any) => 
        runner.jockey && runner.jockey.toLowerCase().includes(jockeyName.toLowerCase())
      );
      
      jockeyRuns.forEach((run: any) => {
        rides++;
        if (run.position === '1') wins++;
        
        // Calculate profit/loss (simplified)
        if (run.position === '1' && run.sp_dec) {
          profit_loss += (parseFloat(run.sp_dec) - 1);
        } else {
          profit_loss -= 1;
        }
      });
    }
  });
  
  const win_percentage = rides > 0 ? (wins / rides * 100) : 0;
  
  return {
    rides,
    wins,
    win_percentage: parseFloat(win_percentage.toFixed(1)),
    profit_loss: parseFloat(profit_loss.toFixed(2))
  };
}

// Main analysis function
async function analyzeJockey(request: JockeyAnalysisRequest) {
  const startTime = Date.now();
  
  // Clean all input names to remove brackets
  const cleanedRequest = {
    ...request,
    jockey_name: cleanName(request.jockey_name) || request.jockey_name,
    trainer: request.trainer ? (cleanName(request.trainer) || request.trainer) : undefined,
    course: request.course ? (cleanName(request.course) || request.course) : undefined,
    owner: request.owner ? (cleanName(request.owner) || request.owner) : undefined,
    distance: request.distance ? (cleanName(request.distance) || request.distance) : undefined
  };
  
  // Date calculations
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  
  const twelveMonthsAgo = new Date(today);
  twelveMonthsAgo.setFullYear(today.getFullYear() - 1);
  const twelveMonthsAgoStr = twelveMonthsAgo.toISOString().split('T')[0];
  
  const threeMonthsAgo = new Date(today);
  threeMonthsAgo.setMonth(today.getMonth() - 3);
  const threeMonthsAgoStr = threeMonthsAgo.toISOString().split('T')[0];

  try {
    // Step 1: Search for jockey using cleaned name
    const jockeyData = await makeAPICall('/jockeys/search', { name: cleanedRequest.jockey_name }, 0);
    if (!jockeyData?.search_results?.length) {
      throw new Error('Jockey not found');
    }
    
    const jockeyId = jockeyData.search_results[0].id;

    // Step 2: Make parallel API calls for better performance
    const parallelCalls = [
      makeAPICall(`/jockeys/${jockeyId}/analysis/courses`, {}, 100),
      makeAPICall(`/jockeys/${jockeyId}/results`, {
        start_date: twelveMonthsAgoStr,
        end_date: todayStr,
        limit: 50
      }, 200),
      makeAPICall(`/jockeys/${jockeyId}/results`, {
        start_date: threeMonthsAgoStr,
        end_date: todayStr,
        limit: 50
      }, 300)
    ];

    // Add conditional parallel calls using cleaned data
    if (cleanedRequest.distance) {
      parallelCalls.push(makeAPICall(`/jockeys/${jockeyId}/analysis/distances`, {}, 400));
    }
    if (cleanedRequest.trainer) {
      parallelCalls.push(makeAPICall(`/jockeys/${jockeyId}/analysis/trainers`, {}, 500));
    }
    if (cleanedRequest.owner) {
      parallelCalls.push(makeAPICall(`/jockeys/${jockeyId}/analysis/owners`, {}, 600));
    }

    // Execute all parallel calls
    const results = await Promise.all(parallelCalls);
    
    let resultIndex = 0;
    const lifetimeData = results[resultIndex++];
    const last12MonthsData = results[resultIndex++];
    const last3MonthsData = results[resultIndex++];
    const distanceData = cleanedRequest.distance ? results[resultIndex++] : null;
    const trainerData = cleanedRequest.trainer ? results[resultIndex++] : null;
    const ownerData = cleanedRequest.owner ? results[resultIndex++] : null;

    // Process lifetime totals
    let lifetimeTotals: JockeyStats = { rides: 0, wins: 0, win_percentage: 0, profit_loss: 0 };
    if (lifetimeData) {
      lifetimeTotals = {
        rides: lifetimeData.total_rides || 0,
        wins: lifetimeData.courses?.reduce((sum: number, c: any) => sum + (c['1st'] || 0), 0) || 0,
        win_percentage: lifetimeData.total_rides ? 
          parseFloat(((lifetimeData.courses?.reduce((sum: number, c: any) => sum + (c['1st'] || 0), 0) / lifetimeData.total_rides) * 100).toFixed(1)) : 
          0,
        profit_loss: parseFloat((lifetimeData.courses?.reduce((sum: number, c: any) => sum + parseFloat(c['1_pl'] || 0), 0) || 0).toFixed(2))
      };
    }

    // Process recent results using cleaned jockey name
    const last12Months = calculateStats(last12MonthsData?.results || [], cleanedRequest.jockey_name);
    const last3Months = calculateStats(last3MonthsData?.results || [], cleanedRequest.jockey_name);

    // Process distance analysis using cleaned distance
    let distanceResults: JockeyStats = { rides: 0, wins: 0, win_percentage: 0, profit_loss: 0 };
    if (cleanedRequest.distance && distanceData?.distances) {
      const distanceMatch = distanceData.distances.find((d: any) => 
        d.dist === cleanedRequest.distance || d.dist_f === cleanedRequest.distance
      );
      if (distanceMatch) {
        distanceResults = {
          rides: distanceMatch.rides,
          wins: distanceMatch['1st'],
          win_percentage: parseFloat((distanceMatch['win_%'] * 100).toFixed(1)),
          profit_loss: parseFloat(distanceMatch['1_pl'])
        };
      }
    }

    // Process course analysis using cleaned course name
    let courseResults: JockeyStats = { rides: 0, wins: 0, win_percentage: 0, profit_loss: 0 };
    if (cleanedRequest.course && lifetimeData?.courses) {
      const courseMatch = lifetimeData.courses.find((c: any) => 
        c.course.toLowerCase().includes(cleanedRequest.course!.toLowerCase())
      );
      if (courseMatch) {
        courseResults = {
          rides: courseMatch.rides,
          wins: courseMatch['1st'],
          win_percentage: parseFloat((courseMatch['win_%'] * 100).toFixed(1)),
          profit_loss: parseFloat(courseMatch['1_pl'])
        };
      }
    }

    // Process trainer analysis using cleaned trainer name
    let trainerResults: JockeyStats = { rides: 0, wins: 0, win_percentage: 0, profit_loss: 0 };
    if (cleanedRequest.trainer && trainerData?.trainers) {
      const trainerMatch = trainerData.trainers.find((t: any) => 
        t.trainer.toLowerCase().includes(cleanedRequest.trainer!.toLowerCase())
      );
      if (trainerMatch) {
        trainerResults = {
          rides: trainerMatch.rides,
          wins: trainerMatch['1st'],
          win_percentage: parseFloat((trainerMatch['win_%'] * 100).toFixed(1)),
          profit_loss: parseFloat(trainerMatch['1_pl'])
        };
      }
    }

    // Process owner analysis using cleaned owner name
    let ownerResults: JockeyStats = { rides: 0, wins: 0, win_percentage: 0, profit_loss: 0 };
    if (cleanedRequest.owner && ownerData?.owners) {
      const ownerMatch = ownerData.owners.find((o: any) => 
        o.owner.toLowerCase().includes(cleanedRequest.owner!.toLowerCase())
      );
      if (ownerMatch) {
        ownerResults = {
          rides: ownerMatch.rides,
          wins: ownerMatch['1st'],
          win_percentage: parseFloat((ownerMatch['win_%'] * 100).toFixed(1)),
          profit_loss: parseFloat(ownerMatch['1_pl'])
        };
      }
    }

    // Build the response
    const tableData: Record<string, JockeyStats> = {
      'Total Results (Lifetime)': lifetimeTotals,
      'Results Last 12 Months': last12Months,
      'Results Last 3 Months': last3Months,
    };

    if (request.distance) {
      tableData[`Distance (${request.distance})`] = distanceResults;
    }

    if (request.course) {
      tableData[`Course Total (${request.course})`] = courseResults;
    }

    if (request.trainer) {
      tableData[`Trainer Total (${request.trainer})`] = trainerResults;
    }

    if (request.owner) {
      tableData[`Owner Total (${request.owner})`] = ownerResults;
    }

    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);

    return {
      scenario: request,
      jockey_id: jockeyId,
      generated_at: new Date().toISOString(),
      execution_time_seconds: parseFloat(executionTime),
      table_data: tableData,
      table_headers: ['Variable', 'Rides', 'Wins', 'Win %', 'Profit/Loss']
    };

  } catch (error) {
    console.error('Error in jockey analysis:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: JockeyAnalysisRequest = await request.json();
    
    if (!body.jockey_name) {
      return NextResponse.json(
        { error: 'Jockey name is required' },
        { status: 400 }
      );
    }

    const result = await analyzeJockey(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 