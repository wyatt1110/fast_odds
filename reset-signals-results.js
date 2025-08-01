const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

/**
 * Reset all results for a specific table
 */
async function resetTableResults(tableName) {
    try {
        console.log(`🔄 Resetting results for ${tableName} table...`);
        
        // Update all entries to reset their results
        const { data, error, count } = await supabase
            .from(tableName)
            .update({
                result: 'pending',
                finish_position: null,
                returns: null,
                profit_loss: null,
                sp: null,
                bsp: null
            })
            .neq('result', 'pending'); // Only update entries that are not already pending
        
        if (error) {
            console.error(`❌ Error resetting ${tableName}:`, error);
            return {
                tableName,
                success: false,
                error: error.message,
                updated: 0
            };
        }
        
        console.log(`✅ Successfully reset ${count || 0} entries in ${tableName}`);
        return {
            tableName,
            success: true,
            updated: count || 0
        };
        
    } catch (error) {
        console.error(`💥 Fatal error resetting ${tableName}:`, error);
        return {
            tableName,
            success: false,
            error: error.message,
            updated: 0
        };
    }
}

/**
 * Main function to reset all signal tables
 */
async function main() {
    const startTime = new Date();
    console.log(`🕐 Starting signals results reset at: ${startTime.toISOString()}`);
    console.log('=' .repeat(80));
    console.log('⚠️  WARNING: This will reset ALL results in signal tables!');
    console.log('⚠️  All entries will be set to pending status');
    console.log('⚠️  All finish positions, returns, P/L, SP, and BSP will be cleared');
    console.log('=' .repeat(80));
    
    const tables = ['ov_signals', 'sharp_win_signals', 'ov_bankers'];
    const results = [];
    
    for (const tableName of tables) {
        console.log(`\n📊 Processing ${tableName.toUpperCase()}...`);
        const result = await resetTableResults(tableName);
        results.push(result);
        
        if (result.success) {
            console.log(`✅ ${tableName}: ${result.updated} entries reset`);
        } else {
            console.log(`❌ ${tableName}: Failed - ${result.error}`);
        }
    }
    
    // Summary
    console.log('\n' + '=' .repeat(80));
    console.log('📊 RESET SUMMARY');
    console.log('=' .repeat(80));
    
    let totalUpdated = 0;
    let totalErrors = 0;
    
    results.forEach(result => {
        if (result.success) {
            console.log(`✅ ${result.tableName}: ${result.updated} entries reset`);
            totalUpdated += result.updated;
        } else {
            console.log(`❌ ${result.tableName}: Failed - ${result.error}`);
            totalErrors++;
        }
    });
    
    console.log('\n' + '=' .repeat(50));
    console.log(`📈 Total entries reset: ${totalUpdated}`);
    console.log(`❌ Tables with errors: ${totalErrors}`);
    console.log('=' .repeat(50));
    
    const endTime = new Date();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`\n🕐 Completed at: ${endTime.toISOString()}`);
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    
    if (totalErrors === 0) {
        console.log('🎉 All tables successfully reset!');
        console.log('📋 Please verify that all entries now show:');
        console.log('   - result: pending');
        console.log('   - finish_position: null');
        console.log('   - returns: null');
        console.log('   - profit_loss: null');
        console.log('   - sp: null');
        console.log('   - bsp: null');
    } else {
        console.log('⚠️  Some tables had errors. Please check the output above.');
    }
}

// Run the script
if (require.main === module) {
    main();
}

module.exports = { resetTableResults }; 