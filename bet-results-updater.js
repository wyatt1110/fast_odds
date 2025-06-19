require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = process.env.SUPABASE_URL || 'https://gwvnmzfpnuwxcqtewbtl.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

// Initialize Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🏇 BET RESULTS UPDATER - NEW SCHEMA VERSION');
console.log('📅 Started:', new Date().toLocaleString("en-GB", { timeZone: "Europe/London", hour12: false }));

// Main function to update bet results using master_results table
async function updateBetResults() {
  console.log('🔄 Starting bet results update process...');
  
  try {
    // Fetch pending bets from racing_bets table
    const { data: pendingBets, error: betsError } = await supabase
      .from('racing_bets')
      .select('*')
      .or('status.ilike.%pending%,status.ilike.%open%,status.eq.new,status.eq.,status.eq.PENDING,status.eq.Pending');
    
    if (betsError) {
      throw new Error(`Error fetching pending bets: ${betsError.message}`);
    }
    
    console.log(`📊 Found ${pendingBets?.length || 0} pending bets to process`);
    
    if (!pendingBets || pendingBets.length === 0) {
      console.log('✅ No pending bets found to update.');
      return { success: true, updated: 0, total: 0 };
    }

    // Sample bet for debugging
    console.log(`🔍 Sample bet: ${JSON.stringify(pendingBets[0], null, 2)}`);
    
    let successCount = 0;
    let errorCount = 0;
    let noMatchCount = 0;

    // Process each bet
    for (const bet of pendingBets) {
      try {
        console.log(`\n🎯 Processing bet ID: ${bet.id}`);
        console.log(`   Horse: ${bet.horse_name}`);
        console.log(`   Track: ${bet.track_name}`);
        console.log(`   Race Date: ${bet.race_date}`);
        console.log(`   Horse ID: ${bet.horse_id || 'Not set'}`);

        const success = await processBet(bet);
        
        if (success) {
          successCount++;
          console.log(`✅ Successfully updated bet ${bet.id}`);
        } else {
          noMatchCount++;
          console.log(`❌ No match found for bet ${bet.id}`);
        }
        
      } catch (error) {
        errorCount++;
        console.error(`❌ Error processing bet ${bet.id}:`, error.message);
      }
    }

    // Results summary
    console.log('\n📈 RESULTS SUMMARY:');
    console.log(`   Total bets processed: ${pendingBets.length}`);
    console.log(`   ✅ Successfully updated: ${successCount}`);
    console.log(`   ❌ No matches found: ${noMatchCount}`);
    console.log(`   🚨 Errors: ${errorCount}`);
    
    return {
      success: true,
      updated: successCount,
      total: pendingBets.length,
      noMatches: noMatchCount,
      errors: errorCount
    };
    
  } catch (error) {
    console.error('💥 Error in updateBetResults:', error.message);
    return { success: false, error: error.message };
  }
}

// Process individual bet (single or multiple)
async function processBet(bet) {
  const isMultiple = bet.horse_name.includes('/');
  
  if (isMultiple) {
    return await processMultipleBet(bet);
  } else {
    return await processSingleBet(bet);
  }
}

// Process single bet
async function processSingleBet(bet) {
  console.log(`   🐎 Processing single bet for: ${bet.horse_name}`);
  
  // Find matching horse in master_results using horse_id and race_date
  const { data: horseResults, error } = await supabase
    .from('master_results')
    .select('*')
    .eq('horse_id', bet.horse_id)
    .eq('race_date', bet.race_date);
  
  if (error) {
    console.error(`   🚨 Database error: ${error.message}`);
    return false;
  }
  
  if (!horseResults || horseResults.length === 0) {
    console.log(`   ❌ No match found in master_results for horse_id: ${bet.horse_id}, race_date: ${bet.race_date}`);
    return false;
  }
  
  const horse = horseResults[0];
  console.log(`   ✅ Found match: ${horse.horse} (Position: ${horse.position})`);
  
  // Calculate bet results
  const updateData = calculateBetResults(bet, [horse]);
  
  // Update the bet in database
  return await updateBetInDatabase(bet.id, updateData);
}

// Process multiple bet (multiple horses)
async function processMultipleBet(bet) {
  console.log(`   🎰 Processing multiple bet for: ${bet.horse_name}`);
  
  const horseNames = bet.horse_name.split('/').map(name => name.trim());
  const trackNames = bet.track_name.split('/').map(name => name.trim());
  
  console.log(`   📋 Multiple bet horses: ${horseNames.join(', ')}`);
  
  const horseResults = [];
  
  // Find each horse in master_results
  for (let i = 0; i < horseNames.length; i++) {
    const horseName = horseNames[i];
    
    // For multiples, we need to search by horse name and race_date since horse_id might not be set for each leg
    const { data: results, error } = await supabase
      .from('master_results')
      .select('*')
      .ilike('horse', `%${horseName}%`)
      .eq('race_date', bet.race_date);
    
    if (error) {
      console.error(`   🚨 Database error for ${horseName}: ${error.message}`);
      continue;
    }
    
    if (results && results.length > 0) {
      // Find best match for the horse name
      const exactMatch = results.find(r => 
        r.horse.toLowerCase().trim() === horseName.toLowerCase().trim()
      );
      
      const match = exactMatch || results[0];
      horseResults.push(match);
      console.log(`   ✅ Found ${horseName}: ${match.horse} (Position: ${match.position})`);
    } else {
      console.log(`   ❌ No match found for ${horseName}`);
    }
  }
  
  if (horseResults.length === 0) {
    console.log(`   ❌ No horses found for multiple bet`);
    return false;
  }
  
  // Calculate multiple bet results
  const updateData = calculateBetResults(bet, horseResults);
  
  // Update the bet in database
  return await updateBetInDatabase(bet.id, updateData);
}

// Calculate bet results and return update data
function calculateBetResults(bet, horseResults) {
  console.log(`   📊 Calculating results for ${horseResults.length} horse(s)`);
  
  const updateData = {};
  
  // 1. STATUS - won, lost, void
  let status = 'lost';
  let allWon = true;
  let anyVoid = false;
  
  for (const horse of horseResults) {
    const position = horse.position;
    
    if (!position || position.toLowerCase().includes('void') || position.toLowerCase().includes('nr')) {
      anyVoid = true;
    } else if (position !== '1') {
      allWon = false;
    }
  }
  
  if (anyVoid) {
    status = 'void';
  } else if (allWon) {
    status = 'won';
  }
  
  updateData.status = status;
  console.log(`   📝 Status: ${status}`);
  
  // 2. RETURNS - stake x odds (or rule_4_adjusted_odds if rule 4 exists)
  let effectiveOdds = bet.odds;
  if (bet.rule_4_adjusted_odds && bet.rule_4_adjusted_odds > 0) {
    effectiveOdds = bet.rule_4_adjusted_odds;
    console.log(`   🔧 Using rule 4 adjusted odds: ${effectiveOdds} instead of ${bet.odds}`);
  }
  
  if (status === 'won') {
    updateData.returns = Number((bet.stake * effectiveOdds).toFixed(2));
  } else {
    updateData.returns = 0;
  }
  console.log(`   💰 Returns: ${updateData.returns}`);
  
  // 3. PROFIT_LOSS - returns minus stake
  updateData.profit_loss = Number((updateData.returns - bet.stake).toFixed(2));
  console.log(`   📈 Profit/Loss: ${updateData.profit_loss}`);
  
  // 4. CLOSING_ODDS - BSP from master_results
  if (horseResults.length === 1) {
    updateData.closing_odds = horseResults[0].bsp || horseResults[0].sp || null;
  } else {
    // For multiples, multiply all BSPs together
    let totalBsp = 1;
    let hasBsp = false;
    for (const horse of horseResults) {
      const bsp = parseFloat(horse.bsp) || parseFloat(horse.sp) || 1;
      totalBsp *= bsp;
      if (horse.bsp || horse.sp) hasBsp = true;
    }
    updateData.closing_odds = hasBsp ? totalBsp.toFixed(2) : null;
  }
  console.log(`   🎯 Closing odds: ${updateData.closing_odds}`);
  
  // 5. CLOSING_LINE_VALUE - CLV calculation
  if (updateData.closing_odds) {
    const closingOdds = parseFloat(updateData.closing_odds);
    // CLV = ((Decimal Odds at Bet – Decimal Closing Odds) ÷ Decimal Closing Odds) × 100
    updateData.closing_line_value = Number((((effectiveOdds - closingOdds) / closingOdds) * 100).toFixed(2));
  } else {
    updateData.closing_line_value = null;
  }
  console.log(`   📊 CLV: ${updateData.closing_line_value}%`);
  
  // 6. FIN_POS - position from master_results
  if (horseResults.length === 1) {
    updateData.fin_pos = horseResults[0].position;
  } else {
    // For multiples, combine positions with "/"
    updateData.fin_pos = horseResults.map(h => h.position || 'N/A').join('/');
  }
  console.log(`   🏁 Final position: ${updateData.fin_pos}`);
  
  // 7. SP_INDUSTRY - SP from master_results
  if (horseResults.length === 1) {
    updateData.sp_industry = horseResults[0].sp;
  } else {
    // For multiples, multiply all SPs together
    let totalSp = 1;
    let hasSp = false;
    for (const horse of horseResults) {
      const sp = parseFloat(horse.sp) || 1;
      totalSp *= sp;
      if (horse.sp) hasSp = true;
    }
    updateData.sp_industry = hasSp ? totalSp.toFixed(2) : null;
  }
  console.log(`   🎲 SP Industry: ${updateData.sp_industry}`);
  
  // 8. MULTI_SP - individual SPs separated by "/"
  if (horseResults.length > 1) {
    updateData.multi_sp = horseResults.map(h => h.sp || 'N/A').join(' / ');
    console.log(`   🎰 Multi SP: ${updateData.multi_sp}`);
  }
  
  // 9. MULTI_BSP - individual BSPs separated by "/"
  if (horseResults.length > 1) {
    updateData.multi_bsp = horseResults.map(h => h.bsp || h.sp || 'N/A').join(' / ');
    console.log(`   💎 Multi BSP: ${updateData.multi_bsp}`);
  }
  
  // Set updated timestamp
  updateData.updated_at = new Date().toISOString();
  
  return updateData;
}

// Update bet in database
async function updateBetInDatabase(betId, updateData) {
  try {
    console.log(`   💾 Updating bet ${betId} with data:`, updateData);
    
    const { error } = await supabase
      .from('racing_bets')
      .update(updateData)
      .eq('id', betId);
    
    if (error) {
      console.error(`   🚨 Database update error: ${error.message}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error(`   💥 Exception updating bet ${betId}:`, error.message);
    return false;
  }
}

// Run the update process
console.log('🚀 Starting bet results update...');
updateBetResults()
  .then(result => {
    if (result.success) {
      console.log(`\n🎉 Update completed successfully!`);
      console.log(`📊 Final stats: ${result.updated}/${result.total} bets updated`);
    } else {
      console.error(`\n💥 Update failed: ${result.error}`);
    }
    process.exit(0);
  })
  .catch(error => {
    console.error(`\n💥 Unexpected error:`, error);
    process.exit(1);
  }); 