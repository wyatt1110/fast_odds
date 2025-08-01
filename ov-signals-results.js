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
 * Generic function to update signal results for any table - OPTIMIZED VERSION
 */
async function updateSignalResults(tableName) {
    try {
        console.log(`🚀 Starting OPTIMIZED ${tableName.toUpperCase()} Results Update...`);
        
        // Calculate date range (last 3 calendar days including today)
        const today = getUKDate(0);
        const yesterday = getUKDate(-1);
        const dayBefore = getUKDate(-2);
        
        console.log(`📅 Processing races from last 3 days: ${dayBefore}, ${yesterday}, ${today}`);
        
        // Step 1: Get incomplete entries from specified table for last 3 days only
        console.log(`📊 Fetching incomplete entries from ${tableName} (last 3 days)...`);
        const { data: incompleteEntries, error: fetchError } = await supabase
            .from(tableName)
            .select('*')
            .or('result.eq.pending,result.is.null,bsp.is.null')
            .in('race_date', [today, yesterday, dayBefore])
            .order('race_date', { ascending: false });
        
        if (fetchError) {
            console.error(`❌ Error fetching incomplete entries from ${tableName}:`, fetchError);
            return {
                totalProcessed: 0,
                totalUpdated: 0,
                totalSkipped: 0,
                tableName
            };
        }
        
        if (!incompleteEntries || incompleteEntries.length === 0) {
            console.log(`✅ No incomplete entries found in ${tableName} for the last 3 days. All entries are up to date.`);
            return {
                totalProcessed: 0,
                totalUpdated: 0,
                totalSkipped: 0,
                tableName
            };
        }
        
        console.log(`📋 Found ${incompleteEntries.length} incomplete entries to process in ${tableName}`);
        
        // Step 2: Group entries by unique horse_id + race_date combinations to avoid duplicate lookups
        const uniqueHorseRaceCombos = new Map();
        const entryGroups = new Map();
        
        incompleteEntries.forEach(entry => {
            const key = `${entry.horse_id}_${entry.race_date}`;
            
            if (!uniqueHorseRaceCombos.has(key)) {
                uniqueHorseRaceCombos.set(key, {
                    horse_id: entry.horse_id,
                    race_date: entry.race_date,
                    horse_name: entry.horse_name
                });
                entryGroups.set(key, []);
            }
            
            entryGroups.get(key).push(entry);
        });
        
        console.log(`🔄 Grouped into ${uniqueHorseRaceCombos.size} unique horse-date combinations`);
        console.log(`⚡ This will reduce database queries by ${incompleteEntries.length - uniqueHorseRaceCombos.size} calls!`);
        
        // Step 3: Fetch ALL master results for these unique combinations in one batch query
        // FIXED: Match by horse_id only, then filter by race_date during lookup
        const horseRaceKeys = Array.from(uniqueHorseRaceCombos.values());
        const horseIds = horseRaceKeys.map(combo => combo.horse_id);
        
        console.log('📊 Fetching master results in batch (matching by horse_id)...');
        const { data: masterResultsBatch, error: masterError } = await supabase
            .from('master_results')
            .select('*')
            .in('horse_id', horseIds);
        
        if (masterError) {
            console.error('❌ Error fetching master results:', masterError);
            return {
                totalProcessed: 0,
                totalUpdated: 0,
                totalSkipped: 0,
                tableName
            };
        }
        
        console.log(`📋 Found ${masterResultsBatch.length} master results entries`);
        
        // Step 4: Create lookup map for master results by horse_id + race_date
        const masterResultsMap = new Map();
        masterResultsBatch.forEach(result => {
            const key = `${result.horse_id}_${result.race_date}`;
            masterResultsMap.set(key, result);
        });
        
        // Step 5: Process each unique horse-race combination and update all related entries
        let totalProcessed = 0;
        let totalUpdated = 0;
        let totalSkipped = 0;
        let batchUpdates = [];
        
        for (const [key, combo] of uniqueHorseRaceCombos) {
            let masterResult = masterResultsMap.get(key);
            const relatedEntries = entryGroups.get(key);
            
            // If no exact date match, try to find any result for this horse_id
            if (!masterResult) {
                // Look for any master result with this horse_id (fallback)
                const horseFallback = masterResultsBatch.find(result => result.horse_id === combo.horse_id);
                if (horseFallback) {
                    masterResult = horseFallback;
                    console.log(`🔄 Using fallback result for ${combo.horse_name}: expected date=${combo.race_date}, found date=${horseFallback.race_date}`);
                }
            }
            
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
                    .from(tableName)
                    .update(updateData)
                    .eq('id', id);
                
                if (error) {
                    console.error(`❌ Error updating entry ${id} in ${tableName}:`, error);
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
        console.log(`\n📊 OPTIMIZED ${tableName.toUpperCase()} Update Summary:`);
        console.log(`   - Total entries processed: ${totalProcessed}`);
        console.log(`   - Successfully updated: ${totalUpdated}`);
        console.log(`   - Skipped (no master data): ${totalSkipped}`);
        console.log(`   - Errors: ${totalProcessed - totalUpdated - totalSkipped}`);
        console.log(`   - Unique horse-date combinations: ${uniqueHorseRaceCombos.size}`);
        console.log(`   - Database queries saved: ${incompleteEntries.length - uniqueHorseRaceCombos.size}`);
        
        if (totalUpdated > 0) {
            console.log(`\n✅ Successfully updated ${totalUpdated} entries in ${tableName} using optimized batch processing!`);
        } else {
            console.log(`\n⚠️  No entries were updated in ${tableName}.`);
        }
        
        return {
            totalProcessed,
            totalUpdated,
            totalSkipped,
            tableName
        };
        
    } catch (error) {
        console.error(`💥 Fatal error in updateSignalResults for ${tableName}:`, error);
        throw error;
    }
}

/**
 * Legacy function for backward compatibility - now calls generic function
 */
async function updateOVSignalsResults() {
    return await updateSignalResults('ov_signals');
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
    
    let totalProcessedAll = 0;
    let totalUpdatedAll = 0;
    let totalSkippedAll = 0;
    
    try {
        console.log('🎯 Starting triple table processing: ov_signals, sharp_win_signals, AND ov_bankers');
        console.log('=' .repeat(80));
        
        // Step 1: Update ov_signals results
        console.log('\n📈 PROCESSING OV_SIGNALS TABLE');
        console.log('-' .repeat(50));
        const ovResults = await updateSignalResults('ov_signals');
        totalProcessedAll += ovResults.totalProcessed;
        totalUpdatedAll += ovResults.totalUpdated;
        totalSkippedAll += ovResults.totalSkipped;
        
        // Step 2: Update sharp_win_signals results
        console.log('\n🚀 PROCESSING SHARP_WIN_SIGNALS TABLE');
        console.log('-' .repeat(50));
        const sharpResults = await updateSignalResults('sharp_win_signals');
        totalProcessedAll += sharpResults.totalProcessed;
        totalUpdatedAll += sharpResults.totalUpdated;
        totalSkippedAll += sharpResults.totalSkipped;
        
        // Step 3: Update ov_bankers results
        console.log('\n🏦 PROCESSING OV_BANKERS TABLE');
        console.log('-' .repeat(50));
        const bankersResults = await updateSignalResults('ov_bankers');
        totalProcessedAll += bankersResults.totalProcessed;
        totalUpdatedAll += bankersResults.totalUpdated;
        totalSkippedAll += bankersResults.totalSkipped;
        
        // Step 3: Refresh the aggregated results table
        console.log('\n🔄 Refreshing aggregated results table...');
        await refreshResultsTable();
        
    } catch (error) {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    }
    
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    
    console.log('\n' + '=' .repeat(80));
    console.log('📊 FINAL SUMMARY - TRIPLE TABLE PROCESSING');
    console.log('=' .repeat(80));
    console.log(`🕐 Completed at: ${endTime.toISOString()}`);
    console.log(`⏱️  Total duration: ${duration.toFixed(2)} seconds`);
    console.log(`📈 Total entries processed (all three tables): ${totalProcessedAll}`);
    console.log(`✅ Total entries updated (all three tables): ${totalUpdatedAll}`);
    console.log(`⚠️  Total entries skipped (all three tables): ${totalSkippedAll}`);
    console.log(`🚀 Performance improvement: Batch processing with triple table support!`);
    console.log('=' .repeat(80));
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { updateOVSignalsResults, refreshResultsTable }; 