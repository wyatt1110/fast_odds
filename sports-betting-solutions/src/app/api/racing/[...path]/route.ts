import { NextRequest, NextResponse } from 'next/server';

const API_USERNAME = process.env.RACING_API_USERNAME || 'KQ9W7rQeAHWMUgxH93ie3yEc';
const API_PASSWORD = process.env.RACING_API_PASSWORD || 'T5BoPivL3Q2h6RhCdLv4EwZu';
const BASE_URL = 'https://api.theracingapi.com/v1';

/**
 * Racing API proxy - handles any path and parameters dynamically
 * This route matches /api/racing/* and passes the path to the racing API
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  try {
    // Get the path from the URL
    const pathString = path.join('/');
    
    // Create full URL including search params
    const { searchParams } = new URL(request.url);
    const queryString = searchParams.toString();
    const url = `${BASE_URL}/${pathString}${queryString ? `?${queryString}` : ''}`;
    
    // Log the request
    console.log(`Server proxy making request to: ${url}`);
    
    // Create authorization header
    const auth = Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64');
    
    // Make the authenticated request to the racing API
    const response = await fetch(url, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Disable caching
    });
    
    // Check if response is OK
    if (!response.ok) {
      // Try to parse error message if it's JSON
      let errorMessage = 'An error occurred with the Racing API';
      try {
        const errorData = await response.json();
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If not JSON, try to get text
        const errorText = await response.text();
        if (errorText) errorMessage = errorText;
      }
      
      console.error(`API Error (${response.status}):`, errorMessage);
      return NextResponse.json({ error: errorMessage }, { status: response.status });
    }
    
    // Get the response data
    const data = await response.json();
    
    // Return the API response
    return NextResponse.json(data);
  } catch (error) {
    console.error('Racing API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to connect to Racing API' },
      { status: 500 }
    );
  }
} 