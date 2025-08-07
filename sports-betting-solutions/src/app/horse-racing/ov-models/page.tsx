'use client';

import { useState, useEffect, useCallback } from 'react';
import Layout from "@/components/layout/Layout";

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const models = [
  'Bankers',
  'Bankers Exchange',
  'Win Model',
  'Win Model Exchange',
  '+EV Opportunities',
  '+EV Opp Exchange',
  'USA Bet365',
  'USA Exchange',
  'OV Basic (Free)'
];

// Function to generate real cumulative profit data from individual bets
function generateRealCumulativeProfitData(individualBets: any[]) {
  if (!individualBets || individualBets.length === 0) return [];
  
  const data = [];
  let cumulativeProfit = 0;
  
  individualBets.forEach((bet) => {
    cumulativeProfit += parseFloat(bet.profit_loss) || 0;
    data.push(Number(cumulativeProfit.toFixed(2)));
  });
  
  return data;
}

export default function OVModels() {
  console.log('🚀 OVModels component rendered, activeTab:', 0);
  
  const [activeTab, setActiveTab] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [liveData, setLiveData] = useState<any>(null);
  const [isLoadingLiveData, setIsLoadingLiveData] = useState(false);
  const [chartData, setChartData] = useState<any>(null);

  // Fetch live tracking data for all models using secure API
  const fetchLiveWinModelData = useCallback(async () => {
    console.log('🔍 fetchLiveWinModelData called, activeTab:', activeTab);
    
    // Include all models (tabs 0-8) in the check
    if (activeTab < 0 || activeTab > 8) {
      console.log('❌ Invalid tab index, returning early');
      return;
    }
    
    console.log(`✅ ${models[activeTab]} tab active, starting data fetch...`);
    setIsLoadingLiveData(true);
    
    try {
      // Call our secure API endpoint instead of querying Supabase directly
      console.log(`🔍 Calling secure API for tab ${activeTab}...`);
      
      const response = await fetch(`/api/ov-models-data?tab=${activeTab}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error(`❌ API error:`, errorData);
        throw new Error(`API error: ${errorData.error || 'Failed to fetch data'}`);
      }
      
      const data = await response.json();
      console.log(`✅ API call successful, got data:`, data);
      
      // Set the live data directly (API returns processed data)
      setLiveData(data);
      setLastUpdated(new Date());

      // Generate chart data for profit tracking over time using real data
      if (data.individualBets && data.individualBets.length > 0) {
        // Create a profit tracking chart showing real cumulative profit over bet sequence
        const realProfitData = generateRealCumulativeProfitData(data.individualBets);
        const labels = data.individualBets.map((bet, index) => `Bet ${index + 1}`);
        
        const chartDataResult = {
          labels: labels,
          datasets: [
            {
              label: `${models[activeTab]} - Cumulative Profit/Loss`,
              data: realProfitData,
              borderColor: parseFloat(data.totalProfit) >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
              backgroundColor: parseFloat(data.totalProfit) >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              borderWidth: 2,
              fill: true,
              tension: 0.1,
            },
          ],
        };

        setChartData(chartDataResult);
      } else {
        console.log('❌ No individual bet data available for chart generation');
        setChartData(null);
      }

    } catch (error) {
      console.error('Error fetching live data:', error);
      setLiveData(null);
    } finally {
      setIsLoadingLiveData(false);
    }
  }, [activeTab]);

  useEffect(() => {
    setLastUpdated(new Date());
  }, []);

  // Fetch live data when any model tab is active
  useEffect(() => {
    console.log('🔄 useEffect triggered, activeTab:', activeTab);
    if (activeTab >= 0 && activeTab <= 8) { // Include all tabs (0-8)
      console.log(`🎯 ${models[activeTab]} tab detected, calling fetchLiveWinModelData`);
      // Clear previous chart data when switching tabs
      setChartData(null);
      fetchLiveWinModelData();
    } else {
      console.log('⏭️ Invalid tab index, skipping data fetch');
      // Clear chart data for invalid tabs
      setChartData(null);
    }
  }, [activeTab, fetchLiveWinModelData]);

  return (
    <Layout>
      <div className="min-h-screen bg-betting-dark text-white px-3 py-8 font-sans">
        <div className="max-w-7xl mx-auto">
          {/* HERO/INTRO */}
          <div className="text-center mb-8">
            <h1 className="text-5xl font-heading font-black text-white">
              O<span className="text-betting-green">V</span> Models
            </h1>
          </div>
          
          {/* TABS */}
          <div className="mb-8">
            <div className="flex gap-1 overflow-x-auto pb-2">
              {models.map((model, index) => (
                <button
                  key={model}
                  onClick={() => setActiveTab(index)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${
                    activeTab === index
                      ? 'bg-betting-green text-white shadow-lg'
                      : 'bg-betting-dark border border-betting-green/30 text-gray-300 hover:bg-betting-green/10 hover:text-white'
                  }`}
                >
                  {model}
                </button>
              ))}
            </div>
          </div>

          {/* MODEL CONTENT */}
          <div className="bg-betting-dark border border-betting-green/20 rounded-lg p-6">
            
            {/* TWO COLUMN LAYOUT */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* LEFT SIDE - Backtested Results */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-heading font-bold text-white mb-4">
                    Backtested Model Results
                  </h3>
                  <div className="bg-betting-dark/50 border border-betting-green/20 rounded-lg p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-betting-green">
                          {activeTab === 0 ? '16.19%' : activeTab === 1 ? '15.77%' : activeTab === 2 ? '15.74%' : activeTab === 3 ? '20.32%' : activeTab === 4 ? '16.19%' : activeTab === 5 ? '20.52%' : activeTab === 6 ? '17.19%' : activeTab === 7 ? '7.68%' : activeTab === 8 ? 'N/A' : '0%'}
                        </div>
                        <div className="text-sm text-gray-400">Win Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-betting-green">
                          {activeTab === 0 ? '+20.44%' : activeTab === 1 ? '+16.11%' : activeTab === 2 ? '+18.13%' : activeTab === 3 ? '+14.07%' : activeTab === 4 ? '+10.41%' : activeTab === 5 ? '+14.38%' : activeTab === 6 ? '+12.34%' : activeTab === 7 ? '+30.77%' : activeTab === 8 ? 'N/A' : '0%'}
                        </div>
                        <div className="text-sm text-gray-400">ROI</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-betting-green">
                          {activeTab === 0 ? '140,261' : activeTab === 1 ? '93,964' : activeTab === 2 ? '135,577' : activeTab === 3 ? '49,988' : activeTab === 4 ? '140,261' : activeTab === 5 ? '50,043' : activeTab === 6 ? '3,113' : activeTab === 7 ? '4,677' : activeTab === 8 ? 'N/A' : '0'}
                        </div>
                        <div className="text-sm text-gray-400">Total Bets</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-betting-green">
                          {activeTab === 0 ? '10.64' : activeTab === 1 ? '10.87' : activeTab === 2 ? '10.91' : activeTab === 3 ? '22.69' : activeTab === 4 ? '9.75' : activeTab === 5 ? '36.38' : activeTab === 6 ? '65.40' : activeTab === 7 ? '88.21' : activeTab === 8 ? 'N/A' : '0'}
                        </div>
                        <div className="text-sm text-gray-400">Avg Odds</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-betting-green/10">
                        <span className="text-white">Total Profit</span>
                        <span className="text-betting-green font-semibold">
                          {activeTab === 0 ? '+£28,674.38' : activeTab === 1 ? '+£15,133.04' : activeTab === 2 ? '+£24,581.33' : activeTab === 3 ? '+£7,218.27' : activeTab === 4 ? '+£14,596.43' : activeTab === 5 ? '+£7,381.00' : activeTab === 6 ? '+£406.39' : activeTab === 7 ? '+£1,439.27' : activeTab === 8 ? 'No large data set' : '£0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-betting-green/10">
                        <span className="text-white">Total Wins</span>
                        <span className="text-betting-green font-semibold">
                          {activeTab === 0 ? '22,705' : activeTab === 1 ? '14,820' : activeTab === 2 ? '21,339' : activeTab === 3 ? '10,157' : activeTab === 4 ? '22,705' : activeTab === 5 ? '10,270' : activeTab === 6 ? '535' : activeTab === 7 ? '359' : activeTab === 8 ? 'Follow live tracking' : '0'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-betting-green/10">
                        <span className="text-white">Total Stake</span>
                        <span className="text-betting-green font-semibold">
                          {activeTab === 0 ? '£140,261.00' : activeTab === 1 ? '£93,964.00' : activeTab === 2 ? '£135,577.00' : activeTab === 3 ? '£51,318.00' : activeTab === 4 ? '£140,261.00' : activeTab === 5 ? '£50,043.00' : activeTab === 6 ? '£3,292.00' : activeTab === 7 ? '£4,677.00' : activeTab === 8 ? 'N/A' : '£0.00'}
                        </span>
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT SIDE - Live Results */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-heading font-bold text-white mb-4">
                    Live Model Results Tracking
                  </h3>
                  <div className="bg-betting-dark/50 border border-betting-green/20 rounded-lg p-6">
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-betting-green">
                          {isLoadingLiveData ? '...' : (liveData ? `${liveData.winRate}%` : '0.00%')}
                        </div>
                        <div className="text-sm text-gray-400">Live Win Rate</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-betting-green">
                          {isLoadingLiveData ? '...' : (liveData ? `${liveData.roi}%` : '0.00%')}
                        </div>
                        <div className="text-sm text-gray-400">Live ROI</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-betting-green">
                          {isLoadingLiveData ? '...' : (liveData ? liveData.totalBets : '0')}
                        </div>
                        <div className="text-sm text-gray-400">Live Bets</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-betting-green">
                          {isLoadingLiveData ? '...' : (liveData ? liveData.averageOdds : '0.00')}
                        </div>
                        <div className="text-sm text-gray-400">Live Avg Odds</div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-betting-green/10">
                        <span className="text-white">Live Profit/Loss</span>
                        <span className="text-betting-green font-semibold">
                          {isLoadingLiveData ? '...' : (liveData ? `£${liveData.totalProfit}` : '£0.00')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-betting-green/10">
                        <span className="text-white">Live Total Wins</span>
                        <span className="text-betting-green font-semibold">
                          {isLoadingLiveData ? '...' : (liveData ? liveData.totalWins : '0')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-betting-green/10">
                        <span className="text-white">Live Total Stake</span>
                        <span className="text-betting-green font-semibold">
                          {isLoadingLiveData ? '...' : (liveData ? `£${liveData.totalStake}` : '£0.00')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-400 mt-2 text-center">
                    Last updated: {lastUpdated ? lastUpdated.toLocaleString() : 'Loading...'}
                  </p>
                </div>
              </div>
            </div>

            {/* RECENT PERFORMANCE CHART */}
            <div className="mt-8">
              <h3 className="text-xl font-heading font-bold text-white mb-4">
                Recent Performance
              </h3>
              <div className="bg-betting-dark/50 border border-betting-green/20 rounded-lg p-6">
                {chartData ? (
                  <div className="h-96">
                    <Line 
                      data={chartData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          title: {
                            display: true,
                            text: `${models[activeTab]} - Profit Tracking Over Time`,
                            color: '#ffffff',
                            font: {
                              size: 16,
                              weight: 'bold'
                            }
                          },
                          legend: {
                            labels: {
                              color: '#ffffff',
                              font: {
                                size: 12
                              }
                            }
                          },
                          tooltip: {
                            callbacks: {
                              label: function(context) {
                                return `Profit: £${context.parsed.y.toFixed(2)}`;
                              }
                            }
                          }
                        },
                        scales: {
                          x: {
                            title: {
                              display: true,
                              text: 'Bet Sequence',
                              color: '#ffffff'
                            },
                            ticks: { 
                              color: '#ffffff',
                              maxTicksLimit: 20
                            },
                            grid: { 
                              color: 'rgba(255, 255, 255, 0.1)'
                            }
                          },
                          y: {
                            title: {
                              display: true,
                              text: 'Cumulative Profit/Loss (£)',
                              color: '#ffffff'
                            },
                            ticks: { 
                              color: '#ffffff',
                              callback: function(value) {
                                return '£' + value.toFixed(0);
                              }
                            },
                            grid: { 
                              color: 'rgba(255, 255, 255, 0.1)'
                            }
                          }
                        },
                        elements: {
                          point: {
                            radius: 1,
                            hoverRadius: 3
                          }
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="h-96 flex items-center justify-center">
                    <div className="text-gray-400 text-center">
                      {isLoadingLiveData ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-betting-green"></div>
                          <span>Loading chart data...</span>
                        </div>
                      ) : (
                        <span>No chart data available</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
