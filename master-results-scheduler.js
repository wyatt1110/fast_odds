const cron = require('node-cron');
const { execSync } = require('child_process');

console.log('📅 Railway Scheduler Started');
console.log('🕐 Master Results: 12:00 & 20:00 UK time');
console.log('🕐 Bet Results: 13:00 & 21:00 UK time');

// Run at 12:00 UK time (covers both BST and GMT)
// 12:00 UK Winter (GMT) = 12:00 UTC | 12:00 UK Summer (BST) = 11:00 UTC
cron.schedule('0 11 * * *', () => {
  console.log('🕐 Running master results at 12:00 UK time (BST - 11:00 UTC)');
  try {
    execSync('node populate-master-results.js', { stdio: 'inherit' });
    console.log('✅ Master results completed successfully (BST)');
  } catch (error) {
    console.error('❌ Master results failed (BST):', error.message);
  }
});

cron.schedule('0 12 * * *', () => {
  console.log('🕐 Running master results at 12:00 UK time (GMT - 12:00 UTC)');
  try {
    execSync('node populate-master-results.js', { stdio: 'inherit' });
    console.log('✅ Master results completed successfully (GMT)');
  } catch (error) {
    console.error('❌ Master results failed (GMT):', error.message);
  }
});

// Run at 20:00 UK time (covers both BST and GMT)  
// 20:00 UK Winter (GMT) = 20:00 UTC | 20:00 UK Summer (BST) = 19:00 UTC
cron.schedule('0 19 * * *', () => {
  console.log('🕐 Running master results at 20:00 UK time (BST - 19:00 UTC)');
  try {
    execSync('node populate-master-results.js', { stdio: 'inherit' });
    console.log('✅ Master results completed successfully (BST)');
  } catch (error) {
    console.error('❌ Master results failed (BST):', error.message);
  }
});

cron.schedule('0 20 * * *', () => {
  console.log('🕐 Running master results at 20:00 UK time (GMT - 20:00 UTC)');
  try {
    execSync('node populate-master-results.js', { stdio: 'inherit' });
    console.log('✅ Master results completed successfully (GMT)');
  } catch (error) {
    console.error('❌ Master results failed (GMT):', error.message);
  }
});

// Run at 13:00 UK time (covers both BST and GMT)
// 13:00 UK Winter (GMT) = 13:00 UTC | 13:00 UK Summer (BST) = 12:00 UTC
cron.schedule('0 12 * * *', () => {
  console.log('🕐 Running bet results updater at 13:00 UK time (BST - 12:00 UTC)');
  try {
    execSync('node bet-results-updater.js', { stdio: 'inherit' });
    console.log('✅ Bet results updater completed successfully (BST)');
  } catch (error) {
    console.error('❌ Bet results updater failed (BST):', error.message);
  }
});

cron.schedule('0 13 * * *', () => {
  console.log('🕐 Running bet results updater at 13:00 UK time (GMT - 13:00 UTC)');
  try {
    execSync('node bet-results-updater.js', { stdio: 'inherit' });
    console.log('✅ Bet results updater completed successfully (GMT)');
  } catch (error) {
    console.error('❌ Bet results updater failed (GMT):', error.message);
  }
});

// Run at 21:00 UK time (covers both BST and GMT)  
// 21:00 UK Winter (GMT) = 21:00 UTC | 21:00 UK Summer (BST) = 20:00 UTC
cron.schedule('0 20 * * *', () => {
  console.log('🕐 Running bet results updater at 21:00 UK time (BST - 20:00 UTC)');
  try {
    execSync('node bet-results-updater.js', { stdio: 'inherit' });
    console.log('✅ Bet results updater completed successfully (BST)');
  } catch (error) {
    console.error('❌ Bet results updater failed (BST):', error.message);
  }
});

cron.schedule('0 21 * * *', () => {
  console.log('🕐 Running bet results updater at 21:00 UK time (GMT - 21:00 UTC)');
  try {
    execSync('node bet-results-updater.js', { stdio: 'inherit' });
    console.log('✅ Bet results updater completed successfully (GMT)');
  } catch (error) {
    console.error('❌ Bet results updater failed (GMT):', error.message);
  }
});

console.log('⏰ Cron jobs scheduled:');
console.log('   • 11:00 UTC (12:00 UK BST) - Master Results');
console.log('   • 12:00 UTC (12:00 UK GMT) - Master Results');
console.log('   • 12:00 UTC (13:00 UK BST) - Bet Results');
console.log('   • 13:00 UTC (13:00 UK GMT) - Bet Results');
console.log('   • 19:00 UTC (20:00 UK BST) - Master Results');
console.log('   • 20:00 UTC (20:00 UK GMT) - Master Results');
console.log('   • 20:00 UTC (21:00 UK BST) - Bet Results');
console.log('   • 21:00 UTC (21:00 UK GMT) - Bet Results'); 