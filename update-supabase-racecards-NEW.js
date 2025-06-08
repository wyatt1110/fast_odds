#!/usr/bin/env node

const https = require('https');
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// SMART EXECUTION THROTTLING - Prevent unnecessary runs
async function shouldSkipExecution() {
  try {
    // Check if we've run recently (within last 8 minutes)
    const { data, error } = await supabase
      .from('races')
      .select('updated_at')
      .eq('race_date', dateString)
      .order('updated_at', { ascending: false })
      .limit(1);
      
    if (data && data.length > 0) {
      const lastUpdate = new Date(data[0].updated_at);
      const now = new Date();
      const minutesSinceLastUpdate = (now - lastUpdate) / (1000 * 60);
      
      if (minutesSinceLastUpdate < 8) {
        console.log(`⏭️  Skipping execution - last update was ${minutesSinceLastUpdate.toFixed(1)} minutes ago`);
        console.log(`🕐 Next run should be after ${new Date(lastUpdate.getTime() + (8 * 60 * 1000)).toISOString()}`);
        return true;
      }
    }
  } catch (error) {
    console.log('⚠️  Could not check last execution time, proceeding with update');
  }
  
  return false;
}

// Load environment variables from .env file
function loadEnv() {
  try {
    const envPath = path.join(__dirname, '.env');
    const envFile = fs.readFileSync(envPath, 'utf8');
    const envVars = envFile.split('\n').filter(line => line.trim() && !line.startsWith('#'));
    
    envVars.forEach(line => {
      const [key, ...valueParts] = line.split('=');
      const value = valueParts.join('=').trim();
      if (key && value) {
        process.env[key.trim()] = value;
      }
    });
  } catch (error) {
    console.log('⚠️  No .env file found, using environment variables');
  }
}

// Load environment variables
loadEnv();

// API credentials
const USERNAME = 'KQ9W7rQeAHWMUgxH93ie3yEc';
const PASSWORD = 'T5BoPivL3Q2h6RhCdLv4EwZu';

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'YOUR_SUPABASE_SERVICE_KEY';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Get today's date in YYYY-MM-DD format
const today = new Date();
const dateString = today.toISOString().split('T')[0];
const currentTime = new Date();

console.log(`🚀 Starting FIXED racecards update for ${dateString} at ${currentTime.toISOString()}...`);

// Main execution
async function main() {
  // Check if we should skip this execution due to recent run
  if (await shouldSkipExecution()) {
    console.log('✅ Execution skipped to prevent excessive API calls');
    return;
  }
  
  const startTime = Date.now();

  // ... existing code ... 
}

main(); 