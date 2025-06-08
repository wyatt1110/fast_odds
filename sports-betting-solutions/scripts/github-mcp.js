#!/usr/bin/env node

/**
 * GitHub MCP Script
 * This script runs the GitHub MCP command using Smithery CLI
 */

const { execSync } = require('child_process');

console.log('Running GitHub MCP with Smithery CLI...');

try {
  // Execute the GitHub MCP command
  const command = 'npx -y @smithery/cli@latest run @smithery-ai/github --key d1d3af66-3abc-45aa-afa1-fcfcc9213721';
  
  // Show the output in real-time
  const output = execSync(command, { stdio: 'inherit' });
  
  console.log('GitHub MCP command completed successfully!');
} catch (error) {
  console.error('GitHub MCP command failed:', error.message);
  process.exit(1);
} 