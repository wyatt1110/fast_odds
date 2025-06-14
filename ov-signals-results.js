const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/**
 * Get UK date (accounting for timezone)
 */
function getUKDate(daysOffset = 0) {
    const now = new Date();
    const ukTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/London"}));
    ukTime.setDate(ukTime.getDate() + daysOffset);
    return ukTime.toISOString().split('T')[0]; // Return YYYY-MM-DD format
}

/**
 * Calculate returns and profit/loss based on result
 */
function calculateReturnsAndProfitLoss(result, stake, odds) {
    const stakeNum = parseFloat(stake) || 0;
    const oddsNum = parseFloat(odds) || 0;
    
    if (result === 'won') {
        const returns = stakeNum * oddsNum;
        const profit_loss = returns - stakeNum;
        return { returns: parseFloat(returns.toFixed(2)), profit_loss: parseFloat(profit_loss.toFixed(2)) };
    } else if (result === 'void') {
        return { returns: parseFloat(stakeNum.toFixed(2)), profit_loss: 0.00 };
    } else {
        // Loss
        return { returns: 0.00, profit_loss: parseFloat((-stakeNum).toFixed(2)) };
    }
}

/**
 * Determine result based on position and other factors
 */
function determineResult(position, isAbandoned, isNonRunner) {
    if (isAbandoned || isNonRunner) {
        return 'void';
    }
    
    if (position === '1') {
        return 'won';
    } else {
        return 'loss';
    }
}

/**
 * Check if horse is a non-runner by checking if horse name appears in non_runners field
 */
function isHorseNonRunner(horseName, nonRunnersText) {
    if (!nonRunnersText || !horseName) return false;
    
    // Convert both to lowercase for case-insensitive matching
    const nonRunners = nonRunnersText.toLowerCase();
    const horse = horseName.toLowerCase();
    
    // Check if horse name appears anywhere in the non_runners text
    return nonRunners.includes(horse);
}

/**
 * Main function to update OV signals results - OPTIMIZED VERSION
 */
async function updateOVSignalsResults() {
    try {
        console.log('🚀 Starting OPTIMIZED OV Signals Results Update...');
        
        // Calculate date range (last 3 calendar days including today)
        const today = getUKDate(0);
        const yesterday = getUKDate(-1);
        const dayBefore = getUKDate(-2);
        
        console.log(`📅 Processing races from last 3 days: ${dayBefore}, ${yesterday}, ${today}`);
        
        // Step 1: Get incomplete entries from ov_signals for last 3 days only
        console.log('📊 Fetching incomplete entries from ov_signals (last 3 days)...');
        const { data: incompleteEntries, error: fetchError } = await supabase
            .from('ov_signals')
            .select('*')
            .or('result.eq.pending,result.is.null,bsp.is.null')
            .in('race_date', [today, yesterday, dayBefore])
            .order('race_date', { ascending: false });
        
        if (fetchError) {
            console.error('❌ Error fetching incomplete entries:', fetchError);
            return;
        }
        
        if (!incompleteEntries || incompleteEntries.length === 0) {
            console.log('✅ No incomplete entries found in the last 3 days. All entries are up to date.');
            return;
        }
        
        console.log(`📋 Found ${incompleteEntries.length} incomplete entries to process`);
        
        // Step 2: Group entries by unique horse_id + race_id combinations to avoid duplicate lookups
        const uniqueHorseRaceCombos = new Map();
        const entryGroups = new Map();
        
        incompleteEntries.forEach(entry => {
            const key = `${entry.horse_id}_${entry.race_id}`;
            
            if (!uniqueHorseRaceCombos.has(key)) {
                uniqueHorseRaceCombos.set(key, {
                    horse_id: entry.horse_id,
                    race_id: entry.race_id,
                    horse_name: entry.horse_name
                });
                entryGroups.set(key, []);
            }
            
            entryGroups.get(key).push(entry);
        });
        
        console.log(`🔄 Grouped into ${uniqueHorseRaceCombos.size} unique horse-race combinations`);
        console.log(`⚡ This will reduce database queries by ${incompleteEntries.length - uniqueHorseRaceCombos.size} calls!`);
        
        // Step 3: Fetch ALL master results for these unique combinations in one batch query
        const horseRaceKeys = Array.from(uniqueHorseRaceCombos.values());
        const horseIds = horseRaceKeys.map(combo => combo.horse_id);
        const raceIds = horseRaceKeys.map(combo => combo.race_id);
        
        console.log('📊 Fetching master results in batch...');
        const { data: masterResultsBatch, error: masterError } = await supabase
            .from('master_results')
            .select('*')
            .in('horse_id', horseIds)
            .in('race_id', raceIds);
        
        if (masterError) {
            console.error('❌ Error fetching master results:', masterError);
            return;
        }
        
        console.log(`📋 Found ${masterResultsBatch.length} master results entries`);
        
        // Step 4: Create lookup map for master results
        const masterResultsMap = new Map();
        masterResultsBatch.forEach(result => {
            const key = `${result.horse_id}_${result.race_id}`;
            masterResultsMap.set(key, result);
        });
        
        // Step 5: Process each unique horse-race combination and update all related entries
        let totalProcessed = 0;
        let totalUpdated = 0;
        let totalSkipped = 0;
        let batchUpdates = [];
        
        for (const [key, combo] of uniqueHorseRaceCombos) {
            const masterResult = masterResultsMap.get(key);
            const relatedEntries = entryGroups.get(key);
            
            if (!masterResult) {
                console.log(`⚠️  No master result found for ${combo.horse_name} (${key})`);
                totalSkipped += relatedEntries.length;
                totalProcessed += relatedEntries.length;
                continue;
            }
            
            console.log(`\n✅ Processing ${combo.horse_name} - updating ${relatedEntries.length} related entries`);
            
            // Determine race outcome once for all related entries
            const isAbandoned = masterResult.is_abandoned === true;
            const isNonRunner = isHorseNonRunner(combo.horse_name, masterResult.non_runners);
            const result = determineResult(masterResult.position, isAbandoned, isNonRunner);
            
            // Process each related entry (different bookmakers/odds for same horse)
            for (const entry of relatedEntries) {
                const { returns, profit_loss } = calculateReturnsAndProfitLoss(result, entry.stake, entry.odds);
                
                const updateData = {
                    result: result,
                    finish_position: masterResult.position,
                    returns: returns,
                    profit_loss: profit_loss
                };
                
                // Add SP if available
                if (masterResult.sp_dec !== null && masterResult.sp_dec !== undefined) {
                    updateData.sp = masterResult.sp_dec;
                }
                
                // Add BSP if available
                if (masterResult.bsp !== null && masterResult.bsp !== undefined) {
                    updateData.bsp = masterResult.bsp;
                }
                
                // Add to batch update
                batchUpdates.push({
                    id: entry.id,
                    updateData: updateData
                });
                
                totalProcessed++;
            }
            
            console.log(`   - Result: ${result}`);
            console.log(`   - Position: ${masterResult.position}`);
            if (masterResult.sp_dec) console.log(`   - SP: ${masterResult.sp_dec}`);
            if (masterResult.bsp) console.log(`   - BSP: ${masterResult.bsp}`);
            if (isAbandoned) console.log(`   - Race was abandoned`);
            if (isNonRunner) console.log(`   - Horse was a non-runner`);
        }
        
        // Step 6: Execute batch updates in chunks to avoid timeout
        const BATCH_SIZE = 100;
        console.log(`\n🔄 Executing ${batchUpdates.length} updates in batches of ${BATCH_SIZE}...`);
        
        for (let i = 0; i < batchUpdates.length; i += BATCH_SIZE) {
            const batch = batchUpdates.slice(i, i + BATCH_SIZE);
            console.log(`📦 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(batchUpdates.length/BATCH_SIZE)} (${batch.length} updates)`);
            
            // Execute updates in parallel for this batch
            const updatePromises = batch.map(async ({ id, updateData }) => {
                const { error } = await supabase
                    .from('ov_signals')
                    .update(updateData)
                    .eq('id', id);
                
                if (error) {
                    console.error(`❌ Error updating entry ${id}:`, error);
                    return false;
                }
                return true;
            });
            
            const results = await Promise.all(updatePromises);
            const successCount = results.filter(success => success).length;
            totalUpdated += successCount;
            
            console.log(`✅ Batch completed: ${successCount}/${batch.length} successful updates`);
        }
        
        // Step 7: Summary
        console.log('\n📊 OPTIMIZED Update Summary:');
        console.log(`   - Total entries processed: ${totalProcessed}`);
        console.log(`   - Successfully updated: ${totalUpdated}`);
        console.log(`   - Skipped (no master data): ${totalSkipped}`);
        console.log(`   - Errors: ${totalProcessed - totalUpdated - totalSkipped}`);
        console.log(`   - Unique horse-race combinations: ${uniqueHorseRaceCombos.size}`);
        console.log(`   - Database queries saved: ${incompleteEntries.length - uniqueHorseRaceCombos.size}`);
        
        if (totalUpdated > 0) {
            console.log(`\n✅ Successfully updated ${totalUpdated} entries using optimized batch processing!`);
        } else {
            console.log('\n⚠️  No entries were updated.');
        }
        
    } catch (error) {
        console.error('💥 Fatal error in updateOVSignalsResults:', error);
        process.exit(1);
    }
}

/**
 * Refresh the ov_signals_results table by calling the database function
 */
async function refreshResultsTable() {
    try {
        console.log('🔄 Refreshing ov_signals_results table...');
        
        const { error } = await supabase.rpc('refresh_ov_signals_results_manual');
        
        if (error) {
            console.error('❌ Error refreshing results table:', error);
            return false;
        }
        
        console.log('✅ Results table refreshed successfully!');
        return true;
        
    } catch (error) {
        console.error('❌ Error in refreshResultsTable:', error);
        return false;
    }
}

/**
 * Entry point
 */
async function main() {
    const startTime = new Date();
    console.log(`🕐 Starting at: ${startTime.toISOString()}`);
    
    try {
        // Step 1: Update individual bet results
        await updateOVSignalsResults();
        
        // Step 2: Refresh the aggregated results table
        console.log('\n🔄 Refreshing aggregated results table...');
        await refreshResultsTable();
        
    } catch (error) {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    }
    
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    console.log(`\n🕐 Completed at: ${endTime.toISOString()}`);
    console.log(`⏱️  Total duration: ${duration.toFixed(2)} seconds`);
    console.log(`🚀 Performance improvement: Batch processing with date filtering!`);
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { updateOVSignalsResults, refreshResultsTable }; 