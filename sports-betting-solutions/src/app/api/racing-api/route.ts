import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

// TheRacingAPI credentials from environment or fallback to hardcoded (not best practice for production)
const RACING_API_BASE_URL = 'https://api.theracingapi.com/v1';
const RACING_API_USERNAME = process.env.RACING_API_USERNAME || 'KQ9W7rQeAHWMUgxH93ie3yEc';
const RACING_API_PASSWORD = process.env.RACING_API_PASSWORD || 'T5BoPivL3Q2h6RhCdLv4EwZu';

/**
 * Handler for Racing API proxy requests
 * 
 * This API route acts as a proxy to TheRacingAPI, handling authentication
 * and protecting our API credentials.
 */
export async function GET(req: NextRequest) {
  console.log('📡 Racing API proxy request received');
  
  try {
    // Get query parameters from the request
    const params = req.nextUrl.searchParams;
    const endpoint = params.get('endpoint');
    
    // Validate the endpoint parameter
    if (!endpoint) {
      console.error('❌ Missing endpoint parameter');
      return NextResponse.json(
        { error: 'Missing endpoint parameter' }, 
        { status: 400 }
      );
    }
    
    // Build the request URL - concatenate the base URL with the endpoint
    const url = `${RACING_API_BASE_URL}${endpoint}`;
    console.log(`🔗 Forwarding request to: ${url}`);
    
    // Create a new query parameter object from the original request
    // but remove the 'endpoint' parameter which was just for our proxy
    const apiParams: Record<string, string> = {};
    params.forEach((value, key) => {
      if (key !== 'endpoint') {
        apiParams[key] = value;
      }
    });
    
    // Log the API parameters (excluding sensitive data)
    console.log(`📊 API parameters: ${JSON.stringify(apiParams)}`);
    
    // Format date parameter properly for TheRacingAPI
    if (apiParams.date) {
      // TheRacingAPI expects dates in YYYY-MM-DD format
      if (apiParams.date === 'today') {
        const today = new Date();
        apiParams.date = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        console.log(`📅 Converted 'date=today' to '${apiParams.date}'`);
      } else if (apiParams.date === 'tomorrow') {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        apiParams.date = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD format
        console.log(`📅 Converted 'date=tomorrow' to '${apiParams.date}'`);
      }
    }
    
    console.log(`📊 Final API parameters: ${JSON.stringify(apiParams)}`);
    
    // Make the request to TheRacingAPI with authentication
    try {
      const response = await axios.get(url, {
        params: apiParams,
        auth: {
          username: RACING_API_USERNAME,
          password: RACING_API_PASSWORD
        },
        timeout: 15000 // 15 second timeout
      });
      
      console.log(`✅ API request successful - Status: ${response.status}`);
      
      // Return the API response
      return NextResponse.json(response.data);
    } catch (axiosError) {
      if (axios.isAxiosError(axiosError)) {
        // Handle specific axios errors
        const status = axiosError.response?.status || 500;
        
        // Handle 402 Payment Required error specifically
        if (status === 402) {
          console.error('💰 TheRacingAPI returned 402 Payment Required error');
          return NextResponse.json(
            { 
              error: 'TheRacingAPI subscription may need payment or renewal. Please check your API credentials and subscription status.' 
            },
            { status: 402 }
          );
        }
        
        // Handle 401 or 403 authentication errors
        if (status === 401 || status === 403) {
          console.error('🔒 TheRacingAPI authentication failed - check credentials');
          return NextResponse.json(
            { 
              error: 'Authentication with TheRacingAPI failed. Please check your API credentials.' 
            },
            { status }
          );
        }
        
        // Handle other API errors
        if (axiosError.response) {
          console.error(`❌ TheRacingAPI responded with error ${status}:`, axiosError.response.data);
          return NextResponse.json(
            { 
              error: `TheRacingAPI Error: ${status}`,
              details: axiosError.response.data
            },
            { status }
          );
        } else if (axiosError.request) {
          // Request was made but no response received (timeout)
          console.error('⏱️ No response received from TheRacingAPI (timeout)');
          return NextResponse.json(
            { 
              error: 'No response received from TheRacingAPI. The request may have timed out.' 
            },
            { status: 504 }
          );
        }
        
        // Fallback for other axios errors
        console.error('❌ Axios error making request to TheRacingAPI:', axiosError.message);
        return NextResponse.json(
          { 
            error: `Error communicating with TheRacingAPI: ${axiosError.message}` 
          },
          { status: 500 }
        );
      }
      
      // Handle non-axios errors during the request
      throw axiosError;
    }
  } catch (error) {
    console.error('❌ Racing API proxy error:', error);
    
    // Provide detailed error responses
    if (axios.isAxiosError(error)) {
      const status = error.response?.status || 500;
      let errorMessage = 'Error connecting to Racing API';
      
      if (error.response) {
        // The request was made and the server responded with a status code
        console.error(`❌ API responded with error ${status}:`, error.response.data);
        
        // Pass through the error from the API if available
        if (error.response.data) {
          errorMessage = `Racing API Error: ${JSON.stringify(error.response.data)}`;
        } else {
          errorMessage = `Racing API Error: ${error.response.statusText}`;
        }
        
        return NextResponse.json(
          { error: errorMessage, details: error.response.data }, 
          { status }
        );
      } else if (error.request) {
        // The request was made but no response was received
        console.error('❌ No response received from Racing API:', error.message);
        return NextResponse.json(
          { error: 'No response received from Racing API. Please try again later.' }, 
          { status: 504 }
        );
      } else {
        // Something happened in setting up the request
        console.error('❌ Error setting up request:', error.message);
        return NextResponse.json(
          { error: `Error setting up Racing API request: ${error.message}` }, 
          { status: 500 }
        );
      }
    } else {
      // Not an Axios error
      console.error('❌ Unexpected error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      return NextResponse.json(
        { error: `Racing API Proxy Error: ${errorMessage}` }, 
        { status: 500 }
      );
    }
  }
} 