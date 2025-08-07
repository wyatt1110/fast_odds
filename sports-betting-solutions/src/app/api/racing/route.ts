import { NextResponse } from 'next/server';

const API_USERNAME = process.env.RACING_API_USERNAME || 'KQ9W7rQeAHWMUgxH93ie3yEc';
const API_PASSWORD = process.env.RACING_API_PASSWORD || 'T5BoPivL3Q2h6RhCdLv4EwZu';
const BASE_URL = 'https://api.theracingapi.com/v1';

/**
 * Proxy for racing API requests
 * This allows us to avoid CORS issues and hide API credentials
 */
export async function GET(request: Request) {
  try {
    // Get the endpoint from the query parameters
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    
    // Make sure an endpoint was provided
    if (!endpoint) {
      return NextResponse.json(
        { error: 'Missing endpoint parameter' },
        { status: 400 }
      );
    }
    
    // Create authorization header
    const auth = Buffer.from(`${API_USERNAME}:${API_PASSWORD}`).toString('base64');
    
    console.log(`Server proxy making request to: ${BASE_URL}${endpoint}`);
    
    // Make the authenticated request to the racing API
    const response = await fetch(`${BASE_URL}${endpoint}`, {
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