/**
 * BETTING DASHBOARD PAGE
 * 
 * This file contains the main dashboard component that is imported by:
 * /src/app/betting-dashboard/page.tsx
 * 
 * IMPORTANT NOTES:
 * 1. This file should be edited directly when making changes to the dashboard UI
 * 2. The route file in /src/app/betting-dashboard/page.tsx should NOT be edited
 * 3. The component must be named 'BettingDashboardPage' and exported as default
 * 4. After making changes, you may need to restart the Next.js server with:
 *    - Stop the current server
 *    - Remove the .next folder: rm -rf .next
 *    - Rebuild and restart: npm run dev
 * 
 * If changes don't appear, check:
 * - TypeScript errors that might prevent compilation
 * - The server logs for any build errors
 * - Browser console for any JavaScript errors
 * 
 * Last updated: 2025-03-19 - Fixed AnimatePresence wrapping for BetEntryForm
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, getUserRacingBets, supabase } from '@/lib/supabase/client';
import BetEntryForm from '@/frontend-ui/components/betting/bet-entry-form';
import { 
  TrendingUp, 
  DollarSign, 
  Percent, 
  Target, 
  Activity,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  X,
  Clock,
  CheckCircle,
  Building,
  User,
  MapPin
} from "lucide-react";
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/components/providers';
import dynamic from 'next/dynamic';
import { 
  processMultiHorseProfits, 
  getMostProfitable, 
  getSettledBets, 
  getCompletedBetsForProfitCalc,
  getSuccessfulBets,
  calculateBetStats,
  capitalizeString,
  Bet
} from '@/lib/utils/betting-calculations';

// Dynamically import ReactEcharts with no SSR to avoid hydration issues
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

// Interface for bet statistics
interface BetStats {
  totalBets: number;
  pendingBets: number;
  settledBets: number;
  totalStaked: number;
  totalReturned: number;
  profitLoss: number;
  roi: number;
  averageOdds: number;
  strikeRate: number;
  // New stats
  mostProfitableBookmaker: {
    name: string;
    profit: number;
  } | null;
  mostProfitableModel: {
    name: string;
    profit: number;
  } | null;
  mostProfitableTrack: {
    name: string;
    profit: number;
  } | null;
  last7DaysPL: number;
}

interface ChartData {
  betNumber: number;
  profitLoss: number;
}

// Format currency with 2 decimal places
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Modern Stat Card Component
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent: 'primary' | 'success' | 'warning' | 'danger';
  change?: {
    value: string;
    positive: boolean;
  };
}

const StatCard = ({ 
  title, 
  value, 
  icon, 
  accent,
  change
}: StatCardProps) => {
  const { theme } = useTheme();
  
  const getAccentClasses = () => {
    const baseClasses = {
      primary: 'bg-betting-green/20 text-betting-green',
      success: 'bg-betting-green/20 text-betting-green',
      warning: 'bg-yellow-500/20 text-yellow-400',
      danger: 'bg-red-500/20 text-red-400'
    };
    return baseClasses[accent];
  };

  const getGradientBg = () => {
    const gradients = {
      primary: 'from-betting-dark to-betting-green/10',
      success: 'from-betting-dark to-betting-green/10',
      warning: 'from-betting-dark to-yellow-500/10',
      danger: 'from-betting-dark to-red-500/10'
    };
    return gradients[accent];
  };
  
  const getTextColor = () => 'text-white';
  const getMutedTextColor = () => 'text-gray-300';

  return (
    <div className={`group relative p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out 
                     bg-gradient-to-br ${getGradientBg()} hover:-translate-y-1 cursor-pointer`}>
      {/* Background glow effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 ease-in-out"
           style={{
             background: `radial-gradient(circle at center, ${accent === 'primary' ? '#3b82f6' : 
                                                             accent === 'success' ? '#22c55e' : 
                                                             accent === 'warning' ? '#f59e0b' : 
                                                             '#ef4444'}20, transparent 70%)`,
           }}></div>
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg ${getAccentClasses()} transform group-hover:scale-110 transition-transform duration-300 ease-in-out`}>
          {icon}
        </div>
        {change && (
            <div className={`text-xs font-semibold px-2 py-1 rounded-full ${change.positive ? 'bg-green-100/20 text-green-500' : 'bg-red-100/20 text-red-500'}`}>
            {change.value}
          </div>
        )}
      </div>
        <h3 className={`text-xs font-medium ${getMutedTextColor()} uppercase tracking-wider`}>{title}</h3>
        <p className={`text-xl font-bold mt-1 ${getTextColor()} tracking-tight group-hover:scale-105 transition-transform duration-300 ease-in-out`}>{value}</p>
      </div>
    </div>
  );
};

// Dashboard Page Component
export default function BettingDashboardPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [betStats, setBetStats] = useState<BetStats>({
    totalBets: 0,
    pendingBets: 0,
    settledBets: 0,
    totalStaked: 0,
    totalReturned: 0,
    profitLoss: 0,
    roi: 0,
    averageOdds: 0,
    strikeRate: 0,
    mostProfitableBookmaker: null,
    mostProfitableModel: null,
    mostProfitableTrack: null,
    last7DaysPL: 0
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const router = useRouter();

  const { theme } = useTheme();

  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const user = await getCurrentUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      setUserId(user.id);
      await loadData(user.id);
      setIsLoading(false);
    };
    
    checkAuth();
  }, [router]);
  
  const loadData = async (userId: string) => {
    try {
      // Get all user racing bets
      const bets = await getUserRacingBets(userId);
      
      if (!bets || bets.length === 0) {
        return;
      }
      
      // Cast bets to our shared interface
      const typedBets = bets as unknown as Bet[];
      
      // Use the utility functions to ensure consistent calculations
      const pendingBets = typedBets.filter(bet => 
        bet.status.toLowerCase() === 'pending'
      );
      
      const settledBets = getSettledBets(typedBets);
      const completedBets = getCompletedBetsForProfitCalc(typedBets);
      const successfulBets = getSuccessfulBets(typedBets);
      
      // Calculate common statistics using the utility function
      const baseStats = calculateBetStats(typedBets);
      
      // Calculate profits for each category
      const bookmakerProfits = processMultiHorseProfits(completedBets, 'bookmaker');
      const modelProfits = processMultiHorseProfits(completedBets, 'model');
      const trackProfits = processMultiHorseProfits(completedBets, 'track_name');
      
      // Find most profitable in each category
      const mostProfitableBookmaker = getMostProfitable(bookmakerProfits);
      const mostProfitableModel = getMostProfitable(modelProfits);
      const mostProfitableTrack = getMostProfitable(trackProfits);
      
      // Calculate last 7 days P/L
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      
      const recentBets = completedBets.filter(bet => 
        new Date(bet.created_at) >= last7Days
      );
      
      const last7DaysPL = recentBets.reduce((sum, bet) => {
        const betPL = (bet.returns || 0) - bet.stake;
        return sum + betPL;
      }, 0);
      
      setBetStats({
        ...baseStats,
        mostProfitableBookmaker,
        mostProfitableModel,
        mostProfitableTrack,
        last7DaysPL
      });

      // Prepare chart data
      const chartData: ChartData[] = [];
      let cumulativeProfitLoss = 0;

      // Sort bets by date
      const sortedBets = [...completedBets].sort((a, b) => 
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      sortedBets.forEach((bet, index) => {
        // Calculate individual bet's profit/loss
        const betProfitLoss = (bet.returns || 0) - bet.stake;
        
        cumulativeProfitLoss += betProfitLoss;
          
          chartData.push({
            betNumber: index + 1,
            profitLoss: cumulativeProfitLoss
          });
      });

      setChartData(chartData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };
  
  // Handle bet saved
  const handleBetSaved = async () => {
    console.log('Bet saved successfully - reloading user data');
    setIsFormOpen(false);
    if (userId) {
      await loadData(userId);
    }
  };

  // Handle opening the form with appropriate logging
  const handleOpenForm = () => {
    console.log('Opening bet form with userId:', userId);
    setIsFormOpen(true);
  };
  
  const handleCloseForm = () => {
    console.log('Closing bet form');
    setIsFormOpen(false);
  };

  // Prepare chart options using useMemo to optimize performance
  const chartOptions = useMemo(() => {
    // Early return if no data
    if (chartData.length === 0) return {};

    // Calculate if overall profit/loss is positive
    const isOverallPositive = chartData[chartData.length - 1]?.profitLoss >= 0;
    
    // Prepare data points for visualization
    const xAxisData = chartData.map(data => `#${data.betNumber}`);
    const seriesData = chartData.map(data => data.profitLoss);
    
    // Dynamic Y-axis min/max calculation for normalized axis
    const minPL = Math.min(0, ...seriesData);
    const maxPL = Math.max(0, ...seriesData);
    
    // Get theme-based background color for charts
    const getChartBackgroundColor = () => {
      return {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          {
            offset: 0,
            color: '#1f2937' // gray-800
          },
          {
            offset: 1,
            color: '#111827' // gray-900
          }
        ]
      };
    };

    // Get solid background color for areas that need string colors
    const getSolidBackgroundColor = () => {
      return '#1f2937'; // gray-800
    };

    const getChartTextColor = () => {
      return '#ffffff';
    };

    const getChartGridColor = () => {
      return '#374151'; // gray-700
    };

    // Get color functions to match analytics page
    const getPositiveColor = () => '#22c55e'; // betting-green
    const getNegativeColor = () => '#ef4444'; // red-500
    const getProfitLossColor = (value: number) => value >= 0 ? getPositiveColor() : getNegativeColor();
    const getChartLineColor = () => '#22c55e'; // betting-green

    // Return complete options configuration
    return {
      backgroundColor: getChartBackgroundColor(),
      title: {
        text: '',
        left: 'center',
        top: 5,
        textStyle: {
          color: getChartTextColor(),
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'cross',
          label: {
            backgroundColor: '#6a7985'
          }
        },
        formatter: function(params: any) {
          const param = params[0];
          return `Bet ${param.name}<br/>P/L: <span style="color:${getProfitLossColor(param.value)}">${formatCurrency(param.value)}</span>`;
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '40px',
        top: '40px',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxisData,
        axisLine: {
          show: true,
          lineStyle: {
            color: getChartGridColor(),
            width: 1
          }
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: getChartTextColor(),
          // Create normalized intervals that match sequence
          interval: function(index: number, value: string) {
            // For smaller datasets, show all labels
            if (xAxisData.length <= 15) return true;
            
            // For larger datasets, create regular interval labels
            const interval = Math.ceil(xAxisData.length / 10);
            
            // Always show first and last point
            if (index === 0 || index === xAxisData.length - 1) return true;
            
            // Show points at regular intervals
            return index % interval === 0;
          }
        },
        splitLine: {
          show: false // Hide all grid lines
        }
      },
      yAxis: {
        type: 'value',
        // Create normalized axis with nice round numbers
        min: function(value: { min: number; max: number }) {
          // Round down to a nice number based on the data range
          if (value.min >= 0) return 0;
          
          const range = value.max - value.min;
          const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(range))));
          return Math.floor(value.min / magnitude) * magnitude;
        },
        max: function(value: { min: number; max: number }) {
          // Round up to a nice number based on the data range
          const range = value.max - value.min;
          const magnitude = Math.pow(10, Math.floor(Math.log10(Math.abs(range))));
          return Math.ceil(value.max / magnitude) * magnitude;
        },
        splitNumber: 5, // Aim for 5 intervals
        axisLine: {
          show: true,
          lineStyle: {
            color: getChartGridColor(),
            width: 1
          }
        },
        axisLabel: {
          color: getChartTextColor(),
          formatter: function(value: number) {
            return formatCurrency(value);
          }
        },
        splitLine: {
          show: false // Hide all grid lines
        }
      },
      series: [
        {
          name: 'Profit/Loss',
          type: 'line',
          data: seriesData,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 3,
            color: getChartLineColor()
          },
          itemStyle: {
            color: function(params: any) {
              return getProfitLossColor(params.value);
            },
            borderWidth: 2,
            borderColor: getChartGridColor()
          },
          emphasis: {
            scale: true,
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)',
              borderWidth: 3
            },
            lineStyle: {
              width: 5
            }
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0,
                color: getSolidBackgroundColor()
              }, {
                offset: 1,
                color: getSolidBackgroundColor()
              }]
            }
          },
          markLine: {
            silent: true,
            symbol: ['none', 'none'],
            lineStyle: {
              color: getChartGridColor(),
              type: 'solid',
              width: 1
            },
            data: [
              {
                yAxis: 0,
                label: {
                  show: false
                }
              }
            ]
          }
        }
      ]
    };
  }, [chartData, theme]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Theme helper functions
  const getCardBg = () => 'bg-betting-dark border-betting-green/20';
  const getBorderColor = () => 'border-betting-green/20';
  const getTextColor = () => 'text-white';
  const getMutedTextColor = () => 'text-gray-300';
  const getPrimaryButtonBg = () => 'bg-betting-green hover:bg-betting-secondary';
  
  // Special title styling for dark mode with animation
  const getTitleStyle = () => {
    if (theme === 'dark') {
      return 'text-green-400 font-extrabold text-3xl tracking-wide animate-pulse shadow-text-green';
    } else if (theme === 'racing') {
      return 'text-racing-400 font-bold text-2xl';
    } else {
      return 'text-gray-900 font-bold text-2xl';
    }
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8 bg-betting-dark min-h-screen">
      {/* Top row with small boxes and Add Bet button */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl">
          <StatCard 
            title="Number of Bets" 
            value={betStats.totalBets.toString()} 
            icon={<Activity size={16} />}
            accent="primary"
          />
          <StatCard 
            title="Pending Bets" 
            value={betStats.pendingBets.toString()} 
            icon={<Clock size={16} />}
            accent="warning"
          />
          <StatCard 
            title="Settled Bets" 
            value={betStats.settledBets.toString()} 
            icon={<CheckCircle size={16} />}
            accent="success"
          />
        </div>
        <button 
          onClick={handleOpenForm}
          className="inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-medium text-white bg-betting-green hover:bg-betting-secondary focus:outline-none focus:ring-2 focus:ring-betting-green whitespace-nowrap hover:scale-105 transition-transform"
        >
          + Add New Bet
        </button>
      </div>
          
      {/* First row of detailed stats - 5 boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard 
          title="Profit/Loss" 
          value={formatCurrency(betStats.profitLoss)} 
          icon={<DollarSign size={16} />}
          accent={betStats.profitLoss >= 0 ? "success" : "danger"}
        />
        <StatCard 
          title="Total Staked" 
          value={formatCurrency(betStats.totalStaked)} 
          icon={<DollarSign size={16} />}
          accent="warning"
        />
        <StatCard 
          title="Total Returns"
          value={formatCurrency(betStats.totalReturned)} 
          icon={<TrendingUp size={16} />}
          accent="success"
        />
        <StatCard
          title="ROI / Yield"
          value={`${betStats.roi.toFixed(2)}%`}
          icon={<Award size={16} />}
          accent={betStats.roi >= 0 ? "success" : "danger"}
        />
        <StatCard 
          title="Average Odds" 
          value={betStats.averageOdds.toFixed(2)} 
          icon={<Target size={16} />}
          accent="primary"
        />
      </div>

      {/* Second row of detailed stats - 5 boxes */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
        <StatCard 
          title="Strike Rate" 
          value={`${betStats.strikeRate.toFixed(2)}%`}
          icon={<Percent size={16} />}
          accent="success"
        />
        <StatCard 
          title="Best Bookmaker" 
          value={betStats.mostProfitableBookmaker ? capitalizeString(betStats.mostProfitableBookmaker.name) : 'N/A'} 
          icon={<Building size={16} />}
          accent="primary"
          change={betStats.mostProfitableBookmaker ? {
            value: formatCurrency(betStats.mostProfitableBookmaker.profit),
            positive: betStats.mostProfitableBookmaker.profit > 0
          } : undefined}
        />
        <StatCard 
          title="Best Model/Tipster" 
          value={betStats.mostProfitableModel ? capitalizeString(betStats.mostProfitableModel.name) : 'N/A'} 
          icon={<User size={16} />}
          accent="primary"
          change={betStats.mostProfitableModel ? {
            value: formatCurrency(betStats.mostProfitableModel.profit),
            positive: betStats.mostProfitableModel.profit > 0
          } : undefined}
        />
        <StatCard 
          title="Best Track" 
          value={betStats.mostProfitableTrack ? capitalizeString(betStats.mostProfitableTrack.name) : 'N/A'} 
          icon={<MapPin size={16} />}
          accent="primary"
          change={betStats.mostProfitableTrack ? {
            value: formatCurrency(betStats.mostProfitableTrack.profit),
            positive: betStats.mostProfitableTrack.profit > 0
          } : undefined}
        />
        <StatCard 
          title="Last 7 Days P/L" 
          value={formatCurrency(betStats.last7DaysPL)}
          icon={<DollarSign size={16} />}
          accent={betStats.last7DaysPL >= 0 ? "success" : "danger"}
        />
      </div>
          
      {/* Profit/Loss Chart */}
      <div className="bg-betting-dark border border-betting-green/20 rounded-xl shadow-sm p-5 mb-6">
        <h3 className="text-lg font-semibold mb-4 text-white">Profit and Loss</h3>
        <div className="h-[500px]">
          {chartData.length > 0 ? (
            // Use ECharts for the chart
            <ReactECharts
              option={chartOptions}
              notMerge={true}
              lazyUpdate={false}
              style={{ height: '100%', width: '100%' }}
              className="chart-container"
              theme="dark"
            />
          ) : (
            <div className="text-center h-full flex items-center justify-center">
              <p className="text-sm text-gray-300">No settled bets data available to display chart</p>
            </div>
          )}
        </div>
      </div>

      {/* Recommendations Section */}
      <div className="bg-betting-dark border border-betting-green/20 rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-white mb-4">For You:</h3>
        <div className="bg-betting-dark/50 border border-betting-green/20 rounded-lg p-6 text-center">
          <p className="text-gray-300 mb-2">Personalized recommendations will appear here</p>
          <p className="text-xs text-gray-400">Based on your betting history and market data</p>
        </div>
      </div>

      {/* Bet Entry Form */}
      <AnimatePresence>
        {isFormOpen && userId && (
          <BetEntryForm 
            onClose={handleCloseForm} 
            userId={userId} 
            onSave={handleBetSaved} 
          />
        )}
      </AnimatePresence>
    </div>
  );
} 