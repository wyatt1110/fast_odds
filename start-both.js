// DEBUG VERSION - Enhanced logging to debug William Hill startup
const { spawn } = require('child_process');

console.log(`🚀 Starting both Bet365 and William Hill odds trackers... [${new Date().toISOString()}]`);
console.log('🔍 Debug mode: Enhanced logging enabled');

// Start Bet365 tracker
console.log('📊 Starting Bet365 tracker...');
const bet365Process = spawn('node', ['bet365-odds-updater.js'], {
  stdio: ['ignore', 'pipe', 'pipe']
});

// Start William Hill tracker  
console.log('🎯 Starting William Hill tracker...');
const williamHillProcess = spawn('node', ['williamhill-odds-updater.js'], {
  stdio: ['ignore', 'pipe', 'pipe']
});

// Handle Bet365 output
bet365Process.stdout.on('data', (data) => {
  process.stdout.write(`[BET365] ${data}`);
});

bet365Process.stderr.on('data', (data) => {
  process.stderr.write(`[BET365 ERROR] ${data}`);
});

// Handle William Hill output
williamHillProcess.stdout.on('data', (data) => {
  process.stdout.write(`[WILLIAM HILL] ${data}`);
});

williamHillProcess.stderr.on('data', (data) => {
  process.stderr.write(`[WILLIAM HILL ERROR] ${data}`);
});

// Handle process exits
bet365Process.on('exit', (code) => {
  console.log(`🔴 Bet365 tracker exited with code ${code}`);
});

williamHillProcess.on('exit', (code) => {
  console.log(`🔴 William Hill tracker exited with code ${code}`);
});

// Handle spawn errors
bet365Process.on('error', (err) => {
  console.error(`❌ Bet365 spawn error: ${err.message}`);
});

williamHillProcess.on('error', (err) => {
  console.error(`❌ William Hill spawn error: ${err.message}`);
});

// Handle shutdown gracefully
process.on('SIGINT', () => {
  console.log('🛑 Shutting down both trackers...');
  bet365Process.kill('SIGINT');
  williamHillProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('🛑 Shutting down both trackers...');
  bet365Process.kill('SIGTERM');
  williamHillProcess.kill('SIGTERM');
  process.exit(0);
});