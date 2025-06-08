import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

// Convert exec to promise-based
const execPromise = promisify(exec);

/**
 * Handle POST request to run GitHub MCP command
 */
export async function POST(request: NextRequest) {
  try {
    // Command to run the GitHub MCP
    const command = 'npx -y @smithery/cli@latest run @smithery-ai/github --key d1d3af66-3abc-45aa-afa1-fcfcc9213721';
    
    console.log('Executing GitHub MCP command...');
    
    // Execute the command
    const { stdout, stderr } = await execPromise(command);
    
    // Log outputs
    if (stdout) console.log('Command output:', stdout);
    if (stderr) console.error('Command stderr:', stderr);
    
    // Return success response
    return NextResponse.json({ 
      success: true, 
      message: 'GitHub MCP command executed successfully',
      stdout,
      stderr: stderr || null
    });
  } catch (error) {
    // Log and return error
    console.error('Error executing GitHub MCP command:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'An unknown error occurred' 
      }, 
      { status: 500 }
    );
  }
} 