const TimeformScraper = require('./scraper');

/**
 * Catchup Timeform Scraper
 * 
 * This script runs to catch up on missed timeform data by scraping today's GB & IRE racecards
 * and uploading the complete data to the Supabase database.
 * 
 * Features:
 * - Scrapes TODAY's races (current day)
 * - Handles all GB & IRE racecards
 * - Extracts complete Timeform data including:
 *   - Horse details, jockeys, trainers, odds, ratings
 *   - Pacemap data (EPF positions with confidence levels)
 *   - Past performance data (up to 6 races per horse)
 *   - Race-level pace analysis (pace forecast, draw bias, specific hints)
 *   - Comments and betting forecast odds
 * - Uploads to Supabase with duplicate handling (upsert)
 * - Comprehensive error logging and diagnostics
 */

async function runTimeformCatchup() {
  const startTime = new Date();
  const todayDate = new Date(startTime);
  
  console.log('🏇 Starting Catchup Timeform Scraper');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📅 Script run date: ${startTime.toDateString()}`);
  console.log(`🎯 Target date: ${todayDate.toDateString()} (Today's races)`);
  console.log(`🌍 Scraping: GB & IRE racecards only`);
  console.log(`🗄️  Database: Supabase integration enabled`);
  console.log(`🔄 Purpose: Catch up on missed data`);
  console.log('═══════════════════════════════════════════════════════════');
  
  const scraper = new TimeformScraper();
  
  try {
    // Run the today's scraper (which gets races for the current day)
    await scraper.runTodaysScraper();
    
    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\n🎊 Catchup Timeform Scraper completed successfully!');
    console.log(`⏱️  Total execution time: ${duration} seconds`);
    console.log('✅ Data has been scraped and uploaded to Supabase database');
    console.log('📊 Check the database for updated Timeform records');
    
  } catch (error) {
    console.error('\n💥 Catchup Timeform Scraper failed:', error.message);
    console.error('🔍 Error details:', error);
    throw error;
  }
}

// Catchup entry point
if (require.main === module) {
  runTimeformCatchup()
    .then(() => {
      console.log('\n🚀 Catchup scraper finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Catchup scraper failed:', error.message);
      process.exit(1);
    });
}

module.exports = runTimeformCatchup; 