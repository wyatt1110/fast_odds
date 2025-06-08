#!/usr/bin/env node

// DEPLOYMENT SCRIPT TO UPDATE GITHUB WITH COMPLETE SCRIPTS
// Run this script locally to push the complete scripts to GitHub

const fs = require('fs');
const path = require('path');

console.log('🚀 GitHub Deployment Script for Complete Odds Implementation');
console.log('===========================================================\n');

// Check if complete scripts exist
const racecardsScript = 'update-supabase-racecards-NEW-COMPLETE.js';
const oddsTrackingScript = 'update-odds-tracking-NEW-COMPLETE.js';

console.log('📋 Checking for complete scripts...');

if (!fs.existsSync(racecardsScript)) {
  console.error(`❌ Missing: ${racecardsScript}`);
  process.exit(1);
}

if (!fs.existsSync(oddsTrackingScript)) {
  console.error(`❌ Missing: ${oddsTrackingScript}`);
  process.exit(1);
}

console.log(`✅ Found: ${racecardsScript}`);
console.log(`✅ Found: ${oddsTrackingScript}`);

// Read the complete scripts
const racecardsContent = fs.readFileSync(racecardsScript, 'utf8');
const oddsTrackingContent = fs.readFileSync(oddsTrackingScript, 'utf8');

console.log(`\n📊 Script Sizes:`);
console.log(`   Racecards: ${racecardsContent.length} characters`);
console.log(`   Odds Tracking: ${oddsTrackingContent.length} characters`);

// Create backup copies with new names
const backupRacecards = 'update-supabase-racecards-NEW.js';
const backupOddsTracking = 'update-odds-tracking-NEW.js';

console.log(`\n💾 Creating GitHub-ready files...`);

// Write the complete scripts as the NEW versions
fs.writeFileSync(backupRacecards, racecardsContent);
fs.writeFileSync(backupOddsTracking, oddsTrackingContent);

console.log(`✅ Created: ${backupRacecards}`);
console.log(`✅ Created: ${backupOddsTracking}`);

console.log(`\n🔧 MANUAL STEPS TO COMPLETE DEPLOYMENT:`);
console.log(`=====================================`);
console.log(`1. First, run the SQL schema update in Supabase (see COMPLETE_IMPLEMENTATION_SUMMARY.md)`);
console.log(`2. Then commit and push these files to GitHub:`);
console.log(`   git add ${backupRacecards}`);
console.log(`   git add ${backupOddsTracking}`);
console.log(`   git commit -m "Update scripts with ALL 30 bookmakers - complete schema coverage"`);
console.log(`   git push origin main`);
console.log(`\n3. Test the workflows:`);
console.log(`   - Racecards: https://github.com/wyatt1110/racecards-updater/actions/workflows/update-racecards-NEW.yml`);
console.log(`   - Odds Tracking: https://github.com/wyatt1110/racecards-updater/actions/workflows/update-odds-tracking-NEW.yml`);

console.log(`\n🎯 EXPECTED RESULTS AFTER DEPLOYMENT:`);
console.log(`====================================`);
console.log(`- Odds records processed: ~245 (instead of 0)`);
console.log(`- Bookmaker coverage: 30/30 (100%)`);
console.log(`- SP values properly handled`);
console.log(`- No constraint violations`);

console.log(`\n✅ Deployment preparation complete!`);
console.log(`📖 See COMPLETE_IMPLEMENTATION_SUMMARY.md for full details.`); 