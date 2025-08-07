import { NextRequest, NextResponse } from 'next/server';

// Racing API credentials
const RACING_API_USERNAME = process.env.RACING_API_USERNAME || 'KQ9W7rQeAHWMUgxH93ie3yEc';
const RACING_API_PASSWORD = process.env.RACING_API_PASSWORD || 'T5BoPivL3Q2h6RhCdLv4EwZu';
const BASE_URL = 'https://api.theracingapi.com/v1';

interface TrainerStats {
  rides: number;
  wins: number;
  win_percentage: number;
  profit_loss: number;
}

interface TrainerAnalysisRequest {
  trainer_name: string;
  jockey?: string;
  course?: string;
  owner?: string;
  horse_age?: string;
}

// Helper function to clean names by removing brackets and their contents
function cleanName(name: string | undefined | null): string {
  if (!name || typeof name !== 'string') return '';
  // Remove anything in parentheses/brackets and trim whitespace
  return name.replace(/\s*\([^)]*\)\s*/g, '').replace(/\s*\[[^\]]*\]\s*/g, '').trim();
}

// Function to convert horse age to correct API age band
function getAgeBand(age: string): string | null {
  const ageNum = parseInt(age);
  
  if (ageNum >= 2 && ageNum <= 5) {
    return `${ageNum}yo`;
  } else if (ageNum >= 6 && ageNum <= 8) {
    return '6-8yo';
  } else if (ageNum >= 9) {
    return '9yo+';
  }
  
  return null;
}

// Helper function for API calls with proper error handling and retry logic
async function makeAPICall(endpoint: string, params: Record<string, any> = {}, delayMs: number = 300, retries: number = 2): Promise<any> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Add delay to respect rate limits, increase delay on retries
      const actualDelay = delayMs + (attempt * 1000);
      if (actualDelay > 0) {
        await new Promise(resolve => setTimeout(resolve, actualDelay));
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

      if (response.status === 429 && attempt < retries) {
        // Rate limited, wait longer and retry
        console.log(`Rate limited on ${endpoint}, retrying in ${2000 + attempt * 1000}ms...`);
        await new Promise(resolve => setTimeout(resolve, 2000 + attempt * 1000));
        continue;
      }

      if (!response.ok) {
        throw new Error(`API call failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt === retries) {
        console.error(`API call failed for ${endpoint} after ${retries + 1} attempts:`, error);
        return null;
      }
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 + attempt * 500));
    }
  }
  return null;
}

// Main analysis function
async function analyzeTrainer(request: TrainerAnalysisRequest) {
  const startTime = Date.now();
  
  // Clean all input names to remove brackets
  const cleanedRequest = {
    ...request,
    trainer_name: cleanName(request.trainer_name) || request.trainer_name,
    jockey: request.jockey ? (cleanName(request.jockey) || request.jockey) : undefined,
    course: request.course ? (cleanName(request.course) || request.course) : undefined,
    owner: request.owner ? (cleanName(request.owner) || request.owner) : undefined,
    horse_age: request.horse_age ? (cleanName(request.horse_age) || request.horse_age) : undefined
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
    // Step 1: Search for trainer using cleaned name
    const trainerData = await makeAPICall('/trainers/search', { name: cleanedRequest.trainer_name }, 0);
    if (!trainerData?.search_results?.length) {
      throw new Error('Trainer not found');
    }
    
    const trainerId = trainerData.search_results[0].id;

    // Step 2: Make parallel API calls with increased delays to handle rate limiting
    const parallelCalls = [
      makeAPICall(`/trainers/${trainerId}/analysis/courses`, {}, 200),
      makeAPICall(`/trainers/${trainerId}/analysis/courses`, {
        start_date: twelveMonthsAgoStr,
        end_date: todayStr
      }, 500),
      makeAPICall(`/trainers/${trainerId}/analysis/courses`, {
        start_date: threeMonthsAgoStr,
        end_date: todayStr
      }, 800)
    ];

    // Add conditional parallel calls using cleaned data with increased delays
    if (cleanedRequest.jockey) {
      parallelCalls.push(makeAPICall(`/trainers/${trainerId}/analysis/jockeys`, {}, 1100));
    }
    if (cleanedRequest.owner) {
      parallelCalls.push(makeAPICall(`/trainers/${trainerId}/analysis/owners`, {}, 1400));
    }
    if (cleanedRequest.horse_age) {
      // Convert horse age to correct API age band format
      const ageBand = getAgeBand(cleanedRequest.horse_age);
      if (ageBand) {
        parallelCalls.push(makeAPICall(`/trainers/${trainerId}/analysis/horse-age`, {
          start_date: twelveMonthsAgoStr,
          end_date: todayStr,
          age_band: [ageBand]
        }, 1700));
      }
    }

    // Execute all parallel calls
    const results = await Promise.all(parallelCalls);
    
    let resultIndex = 0;
    const lifetimeData = results[resultIndex++];
    const last12MonthsData = results[resultIndex++];
    const last3MonthsData = results[resultIndex++];
    const jockeyData = cleanedRequest.jockey ? results[resultIndex++] : null;
    const ownerData = cleanedRequest.owner ? results[resultIndex++] : null;
    const ageData = cleanedRequest.horse_age ? results[resultIndex++] : null;

    // Process lifetime totals (using correct trainer API field names)
    let lifetimeTotals: TrainerStats = { rides: 0, wins: 0, win_percentage: 0, profit_loss: 0 };
    if (lifetimeData && lifetimeData.courses) {
      const totalRuns = lifetimeData.courses.reduce((sum: number, c: any) => sum + (c.runners || 0), 0);
      const totalWins = lifetimeData.courses.reduce((sum: number, c: any) => sum + (c['1st'] || 0), 0);
      const totalPL = lifetimeData.courses.reduce((sum: number, c: any) => sum + parseFloat(c['1_pl'] || 0), 0);
      
      lifetimeTotals = {
        rides: totalRuns,
        wins: totalWins,
        win_percentage: totalRuns > 0 ? parseFloat(((totalWins / totalRuns) * 100).toFixed(1)) : 0,
        profit_loss: parseFloat(totalPL.toFixed(2))
      };
    }

    // Process 12-month and 3-month data using analysis endpoints
    let last12Months: TrainerStats = { rides: 0, wins: 0, win_percentage: 0, profit_loss: 0 };
    if (last12MonthsData && last12MonthsData.courses) {
      const totalRuns = last12MonthsData.courses.reduce((sum: number, c: any) => sum + (c.runners || 0), 0);
      const totalWins = last12MonthsData.courses.reduce((sum: number, c: any) => sum + (c['1st'] || 0), 0);
      const totalPL = last12MonthsData.courses.reduce((sum: number, c: any) => sum + parseFloat(c['1_pl'] || 0), 0);
      
      last12Months = {
        rides: totalRuns,
        wins: totalWins,
        win_percentage: totalRuns > 0 ? parseFloat(((totalWins / totalRuns) * 100).toFixed(1)) : 0,
        profit_loss: parseFloat(totalPL.toFixed(2))
      };
    }

    let last3Months: TrainerStats = { rides: 0, wins: 0, win_percentage: 0, profit_loss: 0 };
    if (last3MonthsData && last3MonthsData.courses) {
      const totalRuns = last3MonthsData.courses.reduce((sum: number, c: any) => sum + (c.runners || 0), 0);
      const totalWins = last3MonthsData.courses.reduce((sum: number, c: any) => sum + (c['1st'] || 0), 0);
      const totalPL = last3MonthsData.courses.reduce((sum: number, c: any) => sum + parseFloat(c['1_pl'] || 0), 0);
      
      last3Months = {
        rides: totalRuns,
        wins: totalWins,
        win_percentage: totalRuns > 0 ? parseFloat(((totalWins / totalRuns) * 100).toFixed(1)) : 0,
        profit_loss: parseFloat(totalPL.toFixed(2))
      };
    }

    // Process course analysis with better matching
    let courseResults: TrainerStats = { rides: 0, wins: 0, win_percentage: 0, profit_loss: 0 };
    let courseResults12Month: TrainerStats = { rides: 0, wins: 0, win_percentage: 0, profit_loss: 0 };
    
    if (cleanedRequest.course && lifetimeData?.courses) {
      const courseMatch = lifetimeData.courses.find((c: any) => 
        c.course && c.course.toLowerCase().includes(cleanedRequest.course!.toLowerCase())
      );
      
      if (courseMatch) {
        courseResults = {
          rides: courseMatch.runners || 0,
          wins: courseMatch['1st'] || 0,
          win_percentage: parseFloat(((courseMatch['win_%'] || 0) * 100).toFixed(1)),
          profit_loss: parseFloat((courseMatch['1_pl'] || 0).toString())
        };
      }
      
      // Also get 12-month course data if available
      if (last12MonthsData?.courses) {
        const course12Match = last12MonthsData.courses.find((c: any) => 
          c.course && c.course.toLowerCase().includes(cleanedRequest.course!.toLowerCase())
        );
        
        if (course12Match) {
          courseResults12Month = {
            rides: course12Match.runners || 0,
            wins: course12Match['1st'] || 0,
            win_percentage: parseFloat(((course12Match['win_%'] || 0) * 100).toFixed(1)),
            profit_loss: parseFloat((course12Match['1_pl'] || 0).toString())
          };
        }
      }
    }

    // Process jockey analysis with better error handling
    let jockeyResults: TrainerStats = { rides: 0, wins: 0, win_percentage: 0, profit_loss: 0 };
    if (cleanedRequest.jockey && jockeyData?.jockeys) {
      const jockeyMatch = jockeyData.jockeys.find((j: any) => 
        j.jockey && j.jockey.toLowerCase().includes(cleanedRequest.jockey!.toLowerCase())
      );
      
      if (jockeyMatch) {
        jockeyResults = {
          rides: jockeyMatch.runners || 0,
          wins: jockeyMatch['1st'] || 0,
          win_percentage: parseFloat(((jockeyMatch['win_%'] || 0) * 100).toFixed(1)),
          profit_loss: parseFloat((jockeyMatch['1_pl'] || 0).toString())
        };
      }
    }

    // Process owner analysis with better error handling
    let ownerResults: TrainerStats = { rides: 0, wins: 0, win_percentage: 0, profit_loss: 0 };
    if (cleanedRequest.owner && ownerData?.owners) {
      const ownerMatch = ownerData.owners.find((o: any) => 
        o.owner && o.owner.toLowerCase().includes(cleanedRequest.owner!.toLowerCase())
      );
      
      if (ownerMatch) {
        ownerResults = {
          rides: ownerMatch.runners || 0,
          wins: ownerMatch['1st'] || 0,
          win_percentage: parseFloat(((ownerMatch['win_%'] || 0) * 100).toFixed(1)),
          profit_loss: parseFloat((ownerMatch['1_pl'] || 0).toString())
        };
      }
    }

    // Process horse age analysis using horse-age endpoint
    let ageResults: TrainerStats = { rides: 0, wins: 0, win_percentage: 0, profit_loss: 0 };
    if (cleanedRequest.horse_age && ageData?.horse_ages?.length) {
      const ageMatch = ageData.horse_ages[0]; // Should only be one age band result
      if (ageMatch) {
        ageResults = {
          rides: ageMatch.runners || 0,
          wins: ageMatch['1st'] || 0,
          win_percentage: parseFloat(((ageMatch['win_%'] || 0) * 100).toFixed(1)),
          profit_loss: parseFloat((ageMatch['1_pl'] || 0).toString())
        };
      }
    }

    // Build the response with proper validation
    const tableData: Record<string, TrainerStats> = {};
    
    // Always include basic stats with validation
    tableData['Total Results (Lifetime)'] = lifetimeTotals;
    tableData['Results Last 12 Months'] = last12Months;
    tableData['Results Last 3 Months'] = last3Months;

    // Add conditional stats with validation using original names for display
    if (request.course) {
      tableData[`Course Total (${request.course})`] = courseResults;
      tableData[`Course Last 12 Months (${request.course})`] = courseResults12Month;
    }

    if (request.jockey) {
      tableData[`Trainer/Jockey (${request.jockey})`] = jockeyResults;
    }

    if (request.owner) {
      tableData[`Trainer/Owner (${request.owner})`] = ownerResults;
    }

    if (request.horse_age) {
      tableData[`Horse Age (${request.horse_age})`] = ageResults;
    }

    const executionTime = ((Date.now() - startTime) / 1000).toFixed(2);

    // Debug logging
    console.log('Trainer Analysis Debug:');
    console.log('- Trainer ID:', trainerId);
    console.log('- Cleaned request:', cleanedRequest);
    console.log('- Execution time:', executionTime, 'seconds');
    console.log('- Table data keys:', Object.keys(tableData));
    console.log('- Lifetime stats:', tableData['Total Results (Lifetime)']);
    console.log('- 12-month stats:', tableData['Results Last 12 Months']);
    console.log('- Owner data available:', !!ownerData);
    console.log('- Age data available:', !!ageData);
    
    if (cleanedRequest.owner && ownerData) {
      console.log('- Owner search result:', ownerData.owners?.find((o: any) => 
        o.owner && o.owner.toLowerCase().includes(cleanedRequest.owner!.toLowerCase())
      ));
    }
    
    if (cleanedRequest.horse_age && ageData) {
      console.log('- Age data result:', ageData.horse_ages?.[0]);
    }

    return {
      scenario: request,
      trainer_id: trainerId,
      generated_at: new Date().toISOString(),
      execution_time_seconds: parseFloat(executionTime),
      table_data: tableData,
      table_headers: ['Variable', 'Rides', 'Wins', 'Win %', 'Profit/Loss']
    };

  } catch (error) {
    console.error('Error in trainer analysis:', error);
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: TrainerAnalysisRequest = await request.json();
    
    if (!body.trainer_name) {
      return NextResponse.json(
        { error: 'Trainer name is required' },
        { status: 400 }
      );
    }

    const result = await analyzeTrainer(body);
    
    return NextResponse.json(result);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
} 