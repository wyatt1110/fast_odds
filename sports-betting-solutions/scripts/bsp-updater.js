require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Format date strings to standard format for comparison
function formatDate(dateStr) {
  if (!dateStr) return null;
  
  // Handle DD/MM/YYYY format (UK_BSP_Historical)
  if (dateStr.includes('/') && dateStr.indexOf('/') <= 2) {
    const [day, month, year] = dateStr.split('/')[0].split('/');
    return `${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`;
  }
  
  // Handle YYYY/MM/DD format (already in our desired format)
  return dateStr.split(' ')[0]; // Remove any time component
}

// Clean horse name for better matching
function cleanHorseName(name) {
  if (!name) return '';
  return name.toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove special characters
    .replace(/\s+/g, ' ')    // Normalize whitespace
    .trim();
}

// Calculate closing line value
function calculateClosingLineValue(bestOdds, closingOdds, stake) {
  if (!bestOdds || !closingOdds || closingOdds === '?') return null;
  
  // Convert to numbers
  const bestOddsNum = parseFloat(bestOdds);
  const closingOddsNum = parseFloat(closingOdds);
  
  if (isNaN(bestOddsNum) || isNaN(closingOddsNum)) return null;
  
  // Calculate the closing line value percentage
  // If best odds < closing odds, we have value
  const valuePercent = ((bestOddsNum / closingOddsNum) - 1) * 100;
  
  // Calculate the weighted value with stake
  const stakeNum = parseFloat(stake) || 1;
  const weightedValue = valuePercent * stakeNum;
  
  return {
    valuePercent: parseFloat(valuePercent.toFixed(2)),
    weightedValue: parseFloat(weightedValue.toFixed(2))
  };
}

// Main function to process bets
async function updateClosingOdds() {
  console.log('🏇 BSP Updater script started');
  
  try {
    // 1. Get all racing bets with missing closing odds
    const { data: betsToUpdate, error: betsError } = await supabase
      .from('racing_bets')
      .select('*')
      .or('closing_odds.is.null,closing_odds.eq.,closing_odds.eq.?');
    
    if (betsError) {
      throw new Error(`Error fetching bets: ${betsError.message}`);
    }
    
    console.log(`Found ${betsToUpdate.length} bets with missing closing odds`);
    
    if (betsToUpdate.length === 0) {
      console.log('No bets need updating. Exiting.');
      return;
    }
    
    // 2. Get all UK BSP historical data
    const { data: ukBspData, error: ukError } = await supabase
      .from('UK_BSP_Historical')
      .select('*');
    
    if (ukError) {
      throw new Error(`Error fetching UK BSP data: ${ukError.message}`);
    }
    
    console.log(`Loaded ${ukBspData.length} UK BSP historical records`);
    
    // 3. Get all USA BSP historical data
    const { data: usaBspData, error: usaError } = await supabase
      .from('BSP_Historical_USA')
      .select('*');
    
    if (usaError) {
      throw new Error(`Error fetching USA BSP data: ${usaError.message}`);
    }
    
    console.log(`Loaded ${usaBspData.length} USA BSP historical records`);
    
    // 4. Process each bet
    const updatePromises = betsToUpdate.map(async (bet) => {
      console.log(`Processing bet: ${bet.id} - ${bet.horse_name} on ${bet.race_date}`);
      
      // Clean data for matching
      const betHorseName = cleanHorseName(bet.horse_name);
      const betDate = formatDate(bet.race_date);
      
      if (!betHorseName || !betDate) {
        console.log(`Skipping bet ${bet.id}: Missing horse name or date`);
        return;
      }
      
      // Try to find a match in UK BSP first
      let match = ukBspData.find(record => {
        const recordHorseName = cleanHorseName(record.horse_name);
        const recordDate = formatDate(record.race_date);
        return recordHorseName === betHorseName && recordDate === betDate;
      });
      
      // If no match in UK, try USA
      if (!match) {
        match = usaBspData.find(record => {
          const recordHorseName = cleanHorseName(record.horse_name);
          const recordDate = formatDate(record.race_date);
          return recordHorseName === betHorseName && recordDate === betDate;
        });
      }
      
      // Determine closing odds value
      let closingOdds = '?';
      if (match && match.bsp) {
        // Format to 2 decimal places
        closingOdds = parseFloat(match.bsp).toFixed(2);
      }
      
      // Calculate closing line value if we have valid odds
      const closingLineValue = calculateClosingLineValue(
        bet.best_odds,
        closingOdds === '?' ? null : closingOdds,
        bet.stake
      );
      
      // Update the bet record
      const updateData = {
        closing_odds: closingOdds
      };
      
      // Add closing line value if available
      if (closingLineValue) {
        updateData.closing_line_value = closingLineValue.valuePercent;
        updateData.weighted_closing_value = closingLineValue.weightedValue;
      }
      
      const { error: updateError } = await supabase
        .from('racing_bets')
        .update(updateData)
        .eq('id', bet.id);
      
      if (updateError) {
        console.error(`Error updating bet ${bet.id}:`, updateError);
        return;
      }
      
      console.log(`Updated bet ${bet.id}: closing_odds=${closingOdds}${
        closingLineValue ? `, closing_line_value=${closingLineValue.valuePercent}%` : ''
      }`);
    });
    
    // Wait for all updates to complete
    await Promise.all(updatePromises);
    
    console.log('✅ BSP Updater script completed successfully');
    
  } catch (error) {
    console.error('❌ Error in BSP Updater script:', error);
    process.exit(1);
  }
}

// Run the script
updateClosingOdds()
  .then(() => {
    console.log('Script execution completed');
    process.exit(0);
  })
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  }); 