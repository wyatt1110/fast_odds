const { createClient } = require('@supabase/supabase-js');

// Copy the calculation functions from the main script
const calculateAverageOpeningOdds = (oddsData) => {
  if (!oddsData) return null;
  
  const bookmakerFields = [
    'bet365_opening', 'william_hill_opening', 'paddy_power_opening', 'sky_bet_opening',
    'ladbrokes_opening', 'coral_opening', 'betfair_opening', 'betfred_opening'
  ];
  
  const validOdds = [];
  bookmakerFields.forEach(field => {
    const oddsValue = oddsData[field];
    if (oddsValue && !isNaN(parseFloat(oddsValue))) {
      validOdds.push(parseFloat(oddsValue));
    }
  });
  
  if (validOdds.length === 0) return null;
  
  const average = validOdds.reduce((sum, odds) => sum + odds, 0) / validOdds.length;
  return Math.round(average * 100) / 100;
};

async function testCalculations() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  
  // Get Rokuni's data
  const { data, error } = await supabase
    .from('master_results')
    .select('horse, average_odds, bet365_opening, william_hill_opening, paddy_power_opening, sky_bet_opening')
    .eq('horse', 'Rokuni (IRE)')
    .limit(1);
  
  if (data && data[0]) {
    const record = data[0];
    console.log('🔍 Testing market analysis calculations for:', record.horse);
    console.log('Raw data:');
    console.log('- bet365_opening:', record.bet365_opening);
    console.log('- william_hill_opening:', record.william_hill_opening);
    console.log('- average_odds:', record.average_odds?.substring(0, 100));
    
    // Test average opening odds calculation
    const avgOpening = calculateAverageOpeningOdds(record);
    console.log('\nCalculated average opening odds:', avgOpening);
    
    if (record.average_odds) {
      // Parse the time series
      const entries = record.average_odds.split(' / ').map(entry => {
        const [odds, time] = entry.split('_');
        return { odds: parseFloat(odds), time: time };
      });
      console.log('Parsed average odds entries:', entries.length);
      console.log('First entry:', entries[0]);
      console.log('Last entry:', entries[entries.length - 1]);
      
      if (avgOpening && entries.length > 0) {
        const finalOdds = entries[entries.length - 1].odds;
        const percentageChange = ((finalOdds - avgOpening) / avgOpening) * 100;
        console.log('Movement calculation:');
        console.log('- Opening:', avgOpening);
        console.log('- Final:', finalOdds);
        console.log('- Percentage change:', percentageChange);
      }
    }
  } else {
    console.log('No data found or error:', error?.message);
  }
}

testCalculations(); 