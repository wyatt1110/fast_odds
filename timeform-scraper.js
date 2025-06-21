const TimeformScraper = require('./scraper');

/**
 * Production Timeform Scraper
 * 
 * This script runs daily to scrape tomorrow's GB & IRE racecards from Timeform
 * and upload the complete data (including pacemap, past performances, and pace analysis)
 * to the Supabase database.
 * 
 * Features:
 * - Always scrapes tomorrow's races (day after script execution)
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

async function runTimeformScraper() {
  const startTime = new Date();
  const tomorrowDate = new Date(startTime);
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  
  console.log('🏇 Starting Production Timeform Scraper');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`📅 Script run date: ${startTime.toDateString()}`);
  console.log(`🎯 Target date: ${tomorrowDate.toDateString()} (Tomorrow's races)`);
  console.log(`🌍 Scraping: GB & IRE racecards only`);
  console.log(`🗄️  Database: Supabase integration enabled`);
  console.log('═══════════════════════════════════════════════════════════');
  
  const scraper = new TimeformScraper();
  
  try {
    // Run the tomorrow's scraper (which gets races for the day after script execution)
    await scraper.runTomorrowsScraper();
    
    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('\n🎊 Production Timeform Scraper completed successfully!');
    console.log(`⏱️  Total execution time: ${duration} seconds`);
    console.log('✅ Data has been scraped and uploaded to Supabase database');
    console.log('📊 Check the database for updated Timeform records');
    
  } catch (error) {
    console.error('\n💥 Production Timeform Scraper failed:', error.message);
    console.error('🔍 Error details:', error);
    throw error;
  }
}

// Production entry point
if (require.main === module) {
  runTimeformScraper()
    .then(() => {
      console.log('\n🚀 Production scraper finished successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Production scraper failed:', error.message);
      process.exit(1);
    });
}

module.exports = runTimeformScraper; 