'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ArrowUpRight, ArrowDownRight, TrendingUp, Calendar, Filter, ChevronDown } from 'lucide-react';
import { useTheme } from '@/components/providers';
import { getCurrentUser, supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

// Dynamically import ReactEcharts with no SSR to avoid hydration issues
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

// Define interfaces
interface BetStats {
  totalBets: number;
  totalStaked: number;
  totalReturned: number;
  profitLoss: number;
  roi: number;
  averageOdds: number;
  strikeRate: number;
}

interface RacingBet {
  id: string;
  user_id: string;
  track_name: string;
  race_number: number | null;
  race_date: string;
  horse_name: string;
  bet_type: string;
  stake: number;
  odds: number;
  status: string;
  returns: number | null;
  profit_loss: number | null;
  created_at: string;
  bookmaker?: string;
  closing_odds?: string;
  jockey?: string;
  trainer?: string;
  surface?: string;
  going?: string;
  fin_pos?: number | null;
  class_type?: string;
}

export default function AnalyticsPage() {
  const [dateRange, setDateRange] = useState('all');
  const [activeMetric, setActiveMetric] = useState('track');
  const [activeProfitMetric, setActiveProfitMetric] = useState('track');
  const [activeChartType, setActiveChartType] = useState('plBasic');
  const [activeRoiMetric, setActiveRoiMetric] = useState('track');
  const [isLoading, setIsLoading] = useState(true);
  const [bets, setBets] = useState<RacingBet[]>([]);
  const [betStats, setBetStats] = useState<BetStats>({
    totalBets: 0,
    totalStaked: 0,
    totalReturned: 0,
    profitLoss: 0,
    roi: 0,
    averageOdds: 0,
    strikeRate: 0
  });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [customDateStart, setCustomDateStart] = useState<string>('');
  const [customDateEnd, setCustomDateEnd] = useState<string>('');
  const router = useRouter();
  const { theme } = useTheme();

  // Format numbers without currency symbol
  const formatNumber = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Theme helper functions
  const getCardBg = () => 'bg-betting-dark border-betting-green/20';
  const getHeaderBg = () => 'bg-betting-dark border-betting-green/20';
  const getBorderColor = () => 'border-betting-green/20';
  const getTextColor = () => 'text-white';
  const getMutedTextColor = () => 'text-gray-300';
  const getButtonBg = () => 'bg-betting-dark hover:bg-betting-green/10 text-white border border-betting-green/20';
  const getActiveButtonBg = () => 'bg-betting-green/20 text-betting-green';
  const getInactiveButtonBg = () => 'text-gray-300 hover:bg-betting-green/10';
  const getChartBg = () => 'bg-betting-dark';
  
  // New theme-aware chart color functions
  const getPositiveColor = () => '#22c55e'; // betting-green
  const getNegativeColor = () => '#ef4444'; // red-500
  const getProfitLossColor = (value: number) => value >= 0 ? getPositiveColor() : getNegativeColor();
  const getChartLineColor = () => '#22c55e'; // betting-green
  const getChartSecondaryLineColor = () => '#34d399'; // green-400
  
  // Get preset date ranges
  const getDateRangeLabel = () => {
    switch (dateRange) {
      case 'last7':
        return 'Last 7 Days';
      case 'thisWeek':
        return 'This Week So Far';
      case 'thisMonth':
        return 'This Month So Far';
      case 'custom':
        return 'Custom Range';
      case 'all':
      default:
        return 'All Time';
    }
  };

  // Calculate date range based on selection
  const getDateRange = () => {
    const now = new Date();
    let startDate = new Date(0); // Default to beginning of time
    
    switch (dateRange) {
      case 'last7':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'thisWeek':
        startDate = new Date();
        // Get the day of the week (0 = Sunday, 1 = Monday, etc.)
        const dayOfWeek = startDate.getDay();
        // Calculate days since Monday (treating Monday as the first day of the week)
        const daysSinceMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        startDate.setDate(startDate.getDate() - daysSinceMonday);
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'thisMonth':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'custom':
        if (customDateStart) {
          startDate = new Date(customDateStart);
          startDate.setHours(0, 0, 0, 0);
        }
        break;
      case 'all':
      default:
        // Already set to beginning of time
        break;
    }
    
    let endDate = new Date();
    if (dateRange === 'custom' && customDateEnd) {
      endDate = new Date(customDateEnd);
      endDate.setHours(23, 59, 59, 999);
    }
    
    return { startDate, endDate };
  };

  // Load user data and bets
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const user = await getCurrentUser();
      
      if (!user) {
        router.push('/login');
        return;
      }
      
      await loadBetData(user.id);
      setIsLoading(false);
    };
    
    checkAuth();
  }, [router, dateRange]);

  // Load bet data from Supabase
  const loadBetData = async (userId: string) => {
    try {
      const { startDate, endDate } = getDateRange();
      const formattedStartDate = startDate.toISOString();
      
      // Query Supabase for user bets within date range
      let query = supabase
        .from('racing_bets')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', formattedStartDate);
      
      // Add end date filter for custom range
      if (dateRange === 'custom' && customDateEnd) {
        query = query.lte('created_at', endDate.toISOString());
      }
      
      // Execute the query with order
      const { data: racingBets, error } = await query.order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error fetching betting data:', error);
        return;
      }
      
      if (!racingBets || racingBets.length === 0) {
        console.log('No betting data found for user');
        setBets([]);
        return;
      }
      
      // Process the bets data
      setBets(racingBets as RacingBet[]);
      
      // Calculate stats from completed bets
      const completedBets = racingBets.filter(bet => 
        ['won', 'lost', 'placed'].includes(bet.status.toLowerCase())
      );
      
      const totalBets = completedBets.length;
      const totalStaked = completedBets.reduce((sum, bet) => sum + bet.stake, 0);
      const totalReturned = completedBets.reduce((sum, bet) => sum + (bet.returns || 0), 0);
      const profitLoss = totalReturned - totalStaked;
      
      // Calculate ROI/Yield - (Returns - Stakes) / Stakes × 100
      const roi = totalStaked > 0 ? (profitLoss / totalStaked) * 100 : 0;
      
      // Average odds only on completed bets
      const oddsSum = completedBets.reduce((sum, bet) => sum + bet.odds, 0);
      const averageOdds = totalBets > 0 ? oddsSum / totalBets : 0;
      
      // Strike rate - count won and placed bets as successful
      const successfulBets = completedBets.filter(bet => 
        ['won', 'placed'].includes(bet.status.toLowerCase())
      );
      const strikeRate = completedBets.length > 0 ? (successfulBets.length / completedBets.length) * 100 : 0;
      
      setBetStats({
        totalBets,
        totalStaked,
        totalReturned,
        profitLoss,
        roi,
        averageOdds,
        strikeRate
      });
    } catch (error) {
      console.error('Error processing betting data:', error);
    }
  };

  // Get theme-based background color for charts
  const getChartBackgroundColor = () => {
    if (theme === 'dark') {
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
    } else if (theme === 'racing') {
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
    } else {
      return {
        type: 'linear',
        x: 0,
        y: 0,
        x2: 0,
        y2: 1,
        colorStops: [
          {
            offset: 0,
            color: '#f9fafb' // gray-50
          },
          {
            offset: 1,
            color: '#f3f4f6' // gray-100
          }
        ]
      };
    }
  };

  // Process data for pie chart based on active metric
  const pieChartOptions = useMemo(() => {
    if (bets.length === 0) {
      return {
        title: {
          text: 'No data available',
          left: 'center',
          top: 'center',
          textStyle: {
            color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568',
            fontSize: 16
          }
        },
        series: [{
          type: 'pie',
          radius: '70%',
          data: []
        }]
      };
    }

    // Group data based on selected metric
    let data: { name: string; value: number }[] = [];
    let title = '';

    // Generate a consistent color palette with 10 distinct colors
    const getColorPalette = () => {
      if (theme === 'dark') {
        return [
          '#60a5fa', '#4ade80', '#fbbf24', '#f87171', '#a78bfa',
          '#34d399', '#f472b6', '#818cf8', '#fb923c', '#2dd4bf'
        ];
      } else if (theme === 'racing') {
        return [
          '#38bdf8', '#4ade80', '#fbbf24', '#f87171', '#a78bfa',
          '#34d399', '#f472b6', '#818cf8', '#fb923c', '#2dd4bf'
        ];
      } else {
        return [
          '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
          '#10b981', '#ec4899', '#6366f1', '#f97316', '#14b8a6'
        ];
      }
    };

    // Generate an extended color palette for fin_pos (up to 18 positions)
    const getExtendedColorPalette = () => {
      const baseColors = [
        '#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6',
        '#10b981', '#ec4899', '#6366f1', '#f97316', '#14b8a6',
        '#a855f7', '#84cc16', '#06b6d4', '#d946ef', '#f43f5e',
        '#64748b', '#0ea5e9', '#facc15'
      ];
      
      // If we need more than 18 colors, generate them by adjusting brightness
      if (baseColors.length < 18) {
        const extraColors = baseColors.map(color => adjustColorBrightness(color, -20));
        return [...baseColors, ...extraColors].slice(0, 18);
      }
      
      return baseColors;
    };

    // Helper function to adjust color brightness
    const adjustColorBrightness = (hex: string, percent: number) => {
      // Convert hex to RGB
      let r = parseInt(hex.substring(1, 3), 16);
      let g = parseInt(hex.substring(3, 5), 16);
      let b = parseInt(hex.substring(5, 7), 16);
      
      // Adjust brightness
      r = Math.max(0, Math.min(255, r + (r * percent / 100)));
      g = Math.max(0, Math.min(255, g + (g * percent / 100)));
      b = Math.max(0, Math.min(255, b + (b * percent / 100)));
      
      // Convert back to hex
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    };

    if (activeMetric === 'track') {
      // Group by track
      title = 'Bets by Track';
      const trackCounts: Record<string, number> = {};
      
      // Process each bet
      bets.forEach(bet => {
        // Skip if track is null or undefined
        if (!bet.track_name) return;
        
        // Check if this is a multi-track bet (containing '/')
        if (bet.track_name.includes('/')) {
          // Split the track names and count each track
          const tracks = bet.track_name.split('/').map(t => t.trim()).filter(t => t);
          const trackCount = tracks.length;
          
          // Add fractional bet count to each track
          tracks.forEach(track => {
            trackCounts[track] = (trackCounts[track] || 0) + (1 / trackCount);
          });
        } else {
          // Single track bet - increment by 1
          trackCounts[bet.track_name] = (trackCounts[bet.track_name] || 0) + 1;
        }
      });

      // Convert to array and sort by count
      data = Object.entries(trackCounts)
        .map(([track, count]) => ({ name: track, value: Number(count.toFixed(1)) }))
        .sort((a, b) => b.value - a.value);

      // Get top 12 tracks and group others
      if (data.length > 12) {
        const top12 = data.slice(0, 12);
        const otherSum = data.slice(12).reduce((sum, item) => sum + item.value, 0);
        data = [...top12, { name: 'Other Tracks', value: Number(otherSum.toFixed(1)) }];
      }
    } else if (activeMetric === 'jockey') {
      // Group by jockey
      title = 'Bets by Jockey';
      const jockeyCounts: Record<string, number> = {};
      
      // Process each bet
      bets.forEach(bet => {
        // Skip if jockey is null or undefined
        if (!bet.jockey) return;
        
        // Check if this is a multi-jockey bet (containing '/')
        if (bet.jockey.includes('/')) {
          // Split the jockey names and count each jockey
          const jockeys = bet.jockey.split('/').map(j => j.trim()).filter(j => j);
          const jockeyCount = jockeys.length;
          
          // Add fractional bet count to each jockey
          jockeys.forEach(jockey => {
            jockeyCounts[jockey] = (jockeyCounts[jockey] || 0) + (1 / jockeyCount);
          });
        } else {
          // Single jockey bet - increment by 1
          jockeyCounts[bet.jockey] = (jockeyCounts[bet.jockey] || 0) + 1;
        }
      });

      // Convert to array and sort by count
      data = Object.entries(jockeyCounts)
        .map(([jockey, count]) => ({ name: jockey, value: Number(count.toFixed(1)) }))
        .sort((a, b) => b.value - a.value);

      // Get top 12 jockeys and group others
      if (data.length > 12) {
        const top12 = data.slice(0, 12);
        const otherSum = data.slice(12).reduce((sum, item) => sum + item.value, 0);
        data = [...top12, { name: 'Other Jockeys', value: Number(otherSum.toFixed(1)) }];
      }
    } else if (activeMetric === 'trainer') {
      // Group by trainer
      title = 'Bets by Trainer';
      const trainerCounts: Record<string, number> = {};
      
      // Process each bet
      bets.forEach(bet => {
        // Skip if trainer is null or undefined
        if (!bet.trainer) return;
        
        // Check if this is a multi-trainer bet (containing '/')
        if (bet.trainer.includes('/')) {
          // Split the trainer names and count each trainer
          const trainers = bet.trainer.split('/').map(t => t.trim()).filter(t => t);
          const trainerCount = trainers.length;
          
          // Add fractional bet count to each trainer
          trainers.forEach(trainer => {
            trainerCounts[trainer] = (trainerCounts[trainer] || 0) + (1 / trainerCount);
          });
        } else {
          // Single trainer bet - increment by 1
          trainerCounts[bet.trainer] = (trainerCounts[bet.trainer] || 0) + 1;
        }
      });

      // Convert to array and sort by count
      data = Object.entries(trainerCounts)
        .map(([trainer, count]) => ({ name: trainer, value: Number(count.toFixed(1)) }))
        .sort((a, b) => b.value - a.value);

      // Get top 12 trainers and group others
      if (data.length > 12) {
        const top12 = data.slice(0, 12);
        const otherSum = data.slice(12).reduce((sum, item) => sum + item.value, 0);
        data = [...top12, { name: 'Other Trainers', value: Number(otherSum.toFixed(1)) }];
      }
    } else if (activeMetric === 'fin_pos') {
      // Group by finishing position
      title = 'Bets by Finishing Position';
      const finPosCounts: Record<string, number> = {};
      
      // Process each bet with finishing position data
      bets.forEach(bet => {
        // Skip if fin_pos is null or undefined
        if (bet.fin_pos === null || bet.fin_pos === undefined) {
          return;
        }
        
        // Convert fin_pos to string for processing
        let finPosStr = bet.fin_pos.toString();
        
        // Check if this is a multi-horse bet with multiple finishing positions
        if (finPosStr.includes('/')) {
          // Split the finishing positions and count each separately
          const positions = finPosStr.split('/').map(p => p.trim()).filter(p => p);
          
          positions.forEach(pos => {
            // Check if position is a number
            if (!isNaN(Number(pos))) {
              // It's a valid numerical position
              finPosCounts[pos] = (finPosCounts[pos] || 0) + 1;
            } else {
              // It's not a number (like RR, P, F etc.) - count as DNF
              finPosCounts['DNF'] = (finPosCounts['DNF'] || 0) + 1;
            }
          });
        } else {
          // Single horse bet
          // Check if position is a number
          if (!isNaN(Number(finPosStr))) {
            // It's a valid numerical position
            finPosCounts[finPosStr] = (finPosCounts[finPosStr] || 0) + 1;
          } else {
            // It's not a number (like RR, P, F etc.) - count as DNF
            finPosCounts['DNF'] = (finPosCounts['DNF'] || 0) + 1;
          }
        }
      });

      // Convert to array and sort by finishing position (numerically)
      data = Object.entries(finPosCounts)
        .map(([finPos, count]) => ({ name: finPos, value: count }))
        .sort((a, b) => {
          // Put 'DNF' at the end
          if (a.name === 'DNF') return 1;
          if (b.name === 'DNF') return -1;
          
          // Sort positions numerically
          return parseInt(a.name) - parseInt(b.name);
        });
    } else if (activeMetric === 'odds') {
      // Group by odds range
      title = 'Bet Distribution by Odds Range';
      
      // Define consistent odds ranges across all charts
      const oddsRanges = [
        { name: 'Under 2.5', min: 0, max: 2.5 },
        { name: '2.5 - 3.99', min: 2.5, max: 4 },
        { name: '4 - 8.99', min: 4, max: 9 },
        { name: '9 - 19.99', min: 9, max: 20 },
        { name: '20+', min: 20, max: Infinity }
      ];
      
      // Group bets by odds range
      data = oddsRanges.map(range => {
        const count = bets.filter(bet => bet.odds >= range.min && bet.odds < range.max).length;
        return { name: range.name, value: count };
      }).filter(item => item.value > 0);
    }

    // Determine which color palette to use
    const colorPalette = activeMetric === 'fin_pos' ? getExtendedColorPalette() : getColorPalette();

    return {
      backgroundColor: getChartBackgroundColor(),
      title: {
        text: title,
        left: 'center',
        top: 0,
        textStyle: {
          color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568',
          fontSize: 14,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: '{a} <br/>{b}: {c} ({d}%)'
      },
      legend: {
        orient: 'horizontal',
        bottom: 0,
        left: 'center',
        itemWidth: 10,
        itemHeight: 10,
        textStyle: {
          color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568',
          fontSize: 10
        },
        pageButtonItemGap: 5,
        pageButtonGap: 5,
        pageIconSize: 12,
        pageTextStyle: {
          color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568'
        }
      },
      series: [
        {
          name: 'Distribution',
          type: 'pie',
          radius: ['30%', '70%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 10,
            borderColor: theme === 'dark' || theme === 'racing' ? '#1a202c' : '#ffffff',
            borderWidth: 2
          },
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 'bold',
              color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568'
            }
          },
          labelLine: {
            show: false
          },
          data: data,
          color: colorPalette
        }
      ]
    };
  }, [bets, activeMetric, theme, formatNumber]);

  // Process data for bar chart based on active profit metric
  const barChartOptions = useMemo(() => {
    if (bets.length === 0) {
      return {
        title: {
          text: 'No data available',
          left: 'center',
          top: 'center',
          textStyle: {
            color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568',
            fontSize: 16
          }
        },
        series: [{
          type: 'bar',
          data: []
        }]
      };
    }

    // Only use settled bets with profit/loss data
    const settledBets = bets.filter(bet => 
      ['won', 'lost', 'placed'].includes(bet.status.toLowerCase()) && 
      bet.profit_loss !== null
    );

    if (settledBets.length === 0) {
      return {
        title: {
          text: 'No settled bets available',
          left: 'center',
          top: 'center',
          textStyle: {
            color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568',
            fontSize: 16
          }
        },
        series: [{
          type: 'bar',
          data: []
        }]
      };
    }

    // Group data based on selected metric
    let data: { name: string; value: number }[] = [];
    let title = '';
    
    if (activeProfitMetric === 'track') {
      // Group by track
      title = 'Profit/Loss by Track';
      
      // Get track distribution for reference
      const trackCounts: Record<string, number> = {};
      
      // Count bets per track for sorting, skipping null values
      bets.forEach(bet => {
        // Skip if track is null or undefined
        if (!bet.track_name) return;
        
        if (bet.track_name.includes('/')) {
          const tracks = bet.track_name.split('/').map(t => t.trim()).filter(t => t);
          const trackCount = tracks.length;
          tracks.forEach(track => {
            trackCounts[track] = (trackCounts[track] || 0) + (1 / trackCount);
          });
        } else {
          trackCounts[bet.track_name] = (trackCounts[bet.track_name] || 0) + 1;
        }
      });
      
      // Sort tracks by bet count
      const sortedTracks = Object.entries(trackCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([track]) => track);
      
      // Show more data points - increase from 12 to 20
      const topTracks = sortedTracks.slice(0, 20);
      const otherTracks = new Set(sortedTracks.slice(20));
      
      // Create a map to store profit by track
      const trackProfits: Record<string, number> = {};
      
      // Process each bet for profit calculation
      settledBets.forEach(bet => {
        // Skip if track is null or undefined
        if (!bet.track_name) return;
        
        const profitLoss = bet.profit_loss || 0;
        
        if (bet.track_name.includes('/')) {
          const tracks = bet.track_name.split('/').map(t => t.trim()).filter(t => t);
          const trackCount = tracks.length;
          const profitPerTrack = profitLoss / trackCount;
          
          tracks.forEach(track => {
            if (topTracks.includes(track)) {
              // It's a top track, add to its specific profit
              trackProfits[track] = (trackProfits[track] || 0) + profitPerTrack;
            } else {
              // It's in "other tracks", add to that group
              trackProfits['Other Tracks'] = (trackProfits['Other Tracks'] || 0) + profitPerTrack;
            }
          });
        } else {
          if (topTracks.includes(bet.track_name)) {
            // It's a top track, add to its specific profit
            trackProfits[bet.track_name] = (trackProfits[bet.track_name] || 0) + profitLoss;
          } else {
            // It's in "other tracks", add to that group
            trackProfits['Other Tracks'] = (trackProfits['Other Tracks'] || 0) + profitLoss;
          }
        }
      });
      
      // Convert to array for chart
      data = [...topTracks.map(track => ({
        name: track,
        value: Number((trackProfits[track] || 0).toFixed(2))
      }))];
      
      // Add "Other Tracks" if it exists
      if (trackProfits['Other Tracks']) {
        data.push({
          name: 'Other Tracks',
          value: Number(trackProfits['Other Tracks'].toFixed(2))
        });
      }
      
      // Sort by actual profit value for logical ordering (highest profit first, lowest profit last)
      data.sort((a, b) => b.value - a.value);
    } else if (activeProfitMetric === 'odds') {
      // Group by updated odds ranges - match ranges from distribution and ROI charts
      title = 'Profit/Loss by Odds Range';
      
      // Use the same odds ranges as the distribution chart
      const oddsRanges = [
        { name: 'Under 2.5', min: 0, max: 2.5 },
        { name: '2.5 - 3.99', min: 2.5, max: 4 },
        { name: '4 - 8.99', min: 4, max: 9 },
        { name: '9 - 19.99', min: 9, max: 20 },
        { name: '20+', min: 20, max: Infinity }
      ];

      // Sum profit/loss in each range and sort by profitability
      data = oddsRanges.map(range => {
        const profit = settledBets
          .filter(bet => bet.odds >= range.min && bet.odds < range.max)
          .reduce((sum, bet) => sum + (bet.profit_loss || 0), 0);
        
        return { name: range.name, value: Number(profit.toFixed(2)) };
      })
      .filter(item => item.value !== 0) // Remove ranges with no profit/loss
      .sort((a, b) => b.value - a.value); // Sort by actual profit value (highest profit first, lowest profit last)
    } else if (activeProfitMetric === 'jockey') {
      // Group by jockey
      title = 'Profit/Loss by Jockey';
      
      // Get jockey distribution for reference
      const jockeyCounts: Record<string, number> = {};
      
      // Count bets per jockey for sorting, skipping null values
      bets.forEach(bet => {
        // Skip if jockey is null or undefined
        if (!bet.jockey) return;
        
        if (bet.jockey.includes('/')) {
          const jockeys = bet.jockey.split('/').map(j => j.trim()).filter(j => j);
          const jockeyCount = jockeys.length;
          jockeys.forEach(jockey => {
            jockeyCounts[jockey] = (jockeyCounts[jockey] || 0) + (1 / jockeyCount);
          });
        } else {
          jockeyCounts[bet.jockey] = (jockeyCounts[bet.jockey] || 0) + 1;
        }
      });
      
      // Sort jockeys by bet count
      const sortedJockeys = Object.entries(jockeyCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([jockey]) => jockey);
      
      // Show more data points - increase from 12 to 20
      const topJockeys = sortedJockeys.slice(0, 20);
      const otherJockeys = new Set(sortedJockeys.slice(20));
      
      // Create a map to store profit by jockey
      const jockeyProfits: Record<string, number> = {};
      
      // Process each bet for profit calculation
      settledBets.forEach(bet => {
        // Skip if jockey is null or undefined
        if (!bet.jockey) return;
        
        const profitLoss = bet.profit_loss || 0;
        
        if (bet.jockey.includes('/')) {
          const jockeys = bet.jockey.split('/').map(j => j.trim()).filter(j => j);
          const jockeyCount = jockeys.length;
          const profitPerJockey = profitLoss / jockeyCount;
          
          jockeys.forEach(jockey => {
            if (topJockeys.includes(jockey)) {
              // It's a top jockey, add to its specific profit
              jockeyProfits[jockey] = (jockeyProfits[jockey] || 0) + profitPerJockey;
            } else {
              // It's in "other jockeys", add to that group
              jockeyProfits['Other Jockeys'] = (jockeyProfits['Other Jockeys'] || 0) + profitPerJockey;
            }
          });
        } else {
          if (topJockeys.includes(bet.jockey)) {
            // It's a top jockey, add to its specific profit
            jockeyProfits[bet.jockey] = (jockeyProfits[bet.jockey] || 0) + profitLoss;
          } else {
            // It's in "other jockeys", add to that group
            jockeyProfits['Other Jockeys'] = (jockeyProfits['Other Jockeys'] || 0) + profitLoss;
          }
        }
      });
      
      // Convert to array for chart
      data = [...topJockeys.map(jockey => ({
        name: jockey,
        value: Number((jockeyProfits[jockey] || 0).toFixed(2))
      }))];
      
      // Add "Other Jockeys" if it exists
      if (jockeyProfits['Other Jockeys']) {
        data.push({
          name: 'Other Jockeys',
          value: Number(jockeyProfits['Other Jockeys'].toFixed(2))
        });
      }
      
      // Sort by actual profit value for logical ordering (highest profit first, lowest profit last)
      data.sort((a, b) => b.value - a.value);
    } else if (activeProfitMetric === 'trainer') {
      // Group by trainer
      title = 'Profit/Loss by Trainer';
      
      // Get trainer distribution for reference
      const trainerCounts: Record<string, number> = {};
      
      // Count bets per trainer for sorting, skipping null values
      bets.forEach(bet => {
        // Skip if trainer is null or undefined
        if (!bet.trainer) return;
        
        if (bet.trainer.includes('/')) {
          const trainers = bet.trainer.split('/').map(t => t.trim()).filter(t => t);
          const trainerCount = trainers.length;
          trainers.forEach(trainer => {
            trainerCounts[trainer] = (trainerCounts[trainer] || 0) + (1 / trainerCount);
          });
        } else {
          trainerCounts[bet.trainer] = (trainerCounts[bet.trainer] || 0) + 1;
        }
      });
      
      // Sort trainers by bet count
      const sortedTrainers = Object.entries(trainerCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([trainer]) => trainer);
      
      // Show more data points - increase from 12 to 20
      const topTrainers = sortedTrainers.slice(0, 20);
      
      // Create a map to store profit by trainer
      const trainerProfits: Record<string, number> = {};
      
      // Process each bet for profit calculation
      settledBets.forEach(bet => {
        // Skip if trainer is null or undefined
        if (!bet.trainer) return;
        
        const profitLoss = bet.profit_loss || 0;
        
        if (bet.trainer.includes('/')) {
          const trainers = bet.trainer.split('/').map(t => t.trim()).filter(t => t);
          const trainerCount = trainers.length;
          const profitPerTrainer = profitLoss / trainerCount;
          
          trainers.forEach(trainer => {
            if (topTrainers.includes(trainer)) {
              // It's a top trainer, add to its specific profit
              trainerProfits[trainer] = (trainerProfits[trainer] || 0) + profitPerTrainer;
            } else {
              // It's in "other trainers", add to that group
              trainerProfits['Other Trainers'] = (trainerProfits['Other Trainers'] || 0) + profitPerTrainer;
            }
          });
        } else {
          if (topTrainers.includes(bet.trainer)) {
            // It's a top trainer, add to its specific profit
            trainerProfits[bet.trainer] = (trainerProfits[bet.trainer] || 0) + profitLoss;
          } else {
            // It's in "other trainers", add to that group
            trainerProfits['Other Trainers'] = (trainerProfits['Other Trainers'] || 0) + profitLoss;
          }
        }
      });
      
      // Convert to array for chart
      data = [...topTrainers.map(trainer => ({
        name: trainer,
        value: Number((trainerProfits[trainer] || 0).toFixed(2))
      }))];
      
      // Add "Other Trainers" if it exists
      if (trainerProfits['Other Trainers']) {
        data.push({
          name: 'Other Trainers',
          value: Number(trainerProfits['Other Trainers'].toFixed(2))
        });
      }
      
      // Sort by actual profit value for logical ordering (highest profit first, lowest profit last)
      data.sort((a, b) => b.value - a.value);
    } else if (activeProfitMetric === 'class') {
      // Group by class_type
      title = 'Profit/Loss by Race Class';
      
      // Create a map to store profit by class
      const classProfits: Record<string, number> = {};
      
      // Process each bet for profit calculation
      settledBets.forEach(bet => {
        // Skip if class_type is null or undefined
        if (!bet.class_type) return;
        
        const profitLoss = bet.profit_loss || 0;
        
        if (bet.class_type.includes('/')) {
          // Handle multiple classes (for multi-horse bets)
          const classes = bet.class_type.split('/').map(c => c.trim()).filter(c => c);
          const classCount = classes.length;
          const profitPerClass = profitLoss / classCount;
          
          classes.forEach(classType => {
            classProfits[classType] = (classProfits[classType] || 0) + profitPerClass;
          });
        } else {
          // Single class
          classProfits[bet.class_type] = (classProfits[bet.class_type] || 0) + profitLoss;
        }
      });
      
      // Convert to array and sort by actual profit value (highest profit first, lowest profit last)
      data = Object.entries(classProfits)
        .map(([classType, profit]) => ({ name: classType, value: Number(profit.toFixed(2)) }))
        .sort((a, b) => b.value - a.value);
    }

    // Adjust the grid to make bars narrower and fit more data
    return {
      backgroundColor: getChartBackgroundColor(),
      title: {
        text: title,
        left: 'center',
        top: 5,
        textStyle: {
          color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568',
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params: any) {
          const data = params[0];
          return `${data.name}<br/>P/L: <span style="color:${getProfitLossColor(data.value)}">${formatNumber(data.value)}</span>`;
        },
        axisPointer: {
          type: 'shadow'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: data.map(item => item.name),
        axisLabel: {
          interval: 0,
          rotate: data.length > 8 ? 45 : 0,
          color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568',
          fontSize: data.length > 10 ? 10 : 12,
          fontWeight: 'normal',
          width: 90,
          overflow: 'truncate'
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#1a202c',
            width: 1
          }
        },
        axisTick: {
          show: false
        },
        splitLine: {
          show: false // Hide all grid lines
        }
      },
      yAxis: {
        type: 'value',
        name: 'Profit/Loss',
        nameTextStyle: {
          color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568'
        },
        splitLine: {
          show: false // Hide all grid lines
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#1a202c',
            width: 1
          }
        },
        axisLabel: {
          color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568',
          formatter: function(value: number) {
            return formatNumber(value);
          }
        }
      },
      series: [
        {
          name: 'Profit/Loss',
          type: 'bar',
          data: data.map(item => item.value),
          itemStyle: {
            color: function(params: any) {
              // Green for profit, red for loss
              return getProfitLossColor(params.value);
            },
            borderRadius: [5, 5, 0, 0]
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          },
          markLine: {
            symbol: ['none', 'none'],
            lineStyle: {
              color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#1a202c',
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
          },
          barWidth: '60%', // Make bars narrower to fit more data
        }
      ]
    };
  }, [bets, activeProfitMetric, theme, formatNumber]);

  // Performance trend component update
  const detailedChartOptions = useMemo(() => {
    if (bets.length === 0) {
      return {
        backgroundColor: getChartBackgroundColor(),
        title: {
          text: 'No data available',
          left: 'center',
          top: 'center',
          textStyle: {
            color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568',
            fontSize: 16
          }
        },
        series: [{
          type: 'line',
          data: []
        }]
      };
    }

    // Only use settled bets with profit/loss data
    const settledBets = bets.filter(bet => 
      ['won', 'lost', 'placed'].includes(bet.status.toLowerCase()) && 
      bet.profit_loss !== null
    );

    if (settledBets.length === 0) {
      return {
        backgroundColor: getChartBackgroundColor(),
        title: {
          text: 'No settled bets available',
          left: 'center',
          top: 'center',
          textStyle: {
            color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568',
            fontSize: 16
          }
        },
        series: [{
          type: 'line',
          data: []
        }]
      };
    }

    // Sort bets by date
    const sortedBets = [...settledBets].sort((a, b) => 
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    
    // Generate series data based on chart type
    let title = '';
    let series: any[] = [];
    let xAxisData: string[] = [];
    let yMin = 0;
    let yMax = 0;
    
    if (activeChartType === 'plBasic') {
      // Basic P/L chart (default)
      title = 'Profit/Loss Over Time';
      
      // Calculate cumulative P/L
      let cumulativePL = 0;
      const plData = [];
      
      for (let i = 0; i < sortedBets.length; i++) {
        const bet = sortedBets[i];
        const betPL = bet.profit_loss || 0;
        
        // Update cumulative values
        cumulativePL += betPL;
        
        // Add to series data
        plData.push(Number(cumulativePL.toFixed(2)));
        
        // Add bet number to x-axis
        xAxisData.push(`#${i + 1}`);
      }
      
      // Update y-axis range
      yMin = Math.min(0, Math.min(...plData));
      yMax = Math.max(...plData);
      
      // Create series
      series = [
        {
          name: 'Profit/Loss',
          type: 'line',
          data: plData,
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
            borderColor: theme === 'dark' || theme === 'racing' ? '#1a202c' : '#ffffff'
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
                color: theme === 'dark' || theme === 'racing' ? 'rgba(59, 130, 246, 0.5)' : 'rgba(59, 130, 246, 0.3)'
              }, {
                offset: 1,
                color: theme === 'dark' || theme === 'racing' ? 'rgba(59, 130, 246, 0.05)' : 'rgba(59, 130, 246, 0.05)'
              }]
            }
          }
        }
      ];
      
    } else if (activeChartType === 'plComparison') {
      // P/L vs BSP vs SP chart
      title = 'P/L Comparison (Actual vs BSP vs SP)';
      
      // Calculate cumulative P/L, BSP P/L, and SP P/L
      let cumulativePL = 0;
      let cumulativeBSP_PL = 0;
      let cumulativeSP_PL = 0;
      const plData = [];
      const bspData = [];
      const spData = [];
      
      for (let i = 0; i < sortedBets.length; i++) {
        const bet = sortedBets[i];
        const betPL = bet.profit_loss || 0;
        
        // Calculate the BSP P/L (using closing_odds if available)
        let bspPL: number | null = 0;
        if (bet.closing_odds) {
          // If closing odds exists, calculate what P/L would have been
          const closingOdds = parseFloat(bet.closing_odds);
          if (!isNaN(closingOdds)) {
            bspPL = bet.status.toLowerCase() === 'won' ? 
              bet.stake * (closingOdds - 1) : 
              -bet.stake;
          } else {
            bspPL = betPL; // Fallback to actual P/L if parsing fails
          }
        } else {
          bspPL = null; // Missing BSP data point
        }

        // Calculate the SP P/L (using the original odds)
        const spPL = bet.status.toLowerCase() === 'won' ? 
          bet.stake * (bet.odds - 1) : 
          -bet.stake;
        
        // Update cumulative values
        cumulativePL += betPL;
        if (bspPL !== null) cumulativeBSP_PL += bspPL;
        cumulativeSP_PL += spPL;
        
        // Add to series data
        plData.push(Number(cumulativePL.toFixed(2)));
        bspData.push(bspPL !== null ? Number(cumulativeBSP_PL.toFixed(2)) : '-');
        spData.push(Number(cumulativeSP_PL.toFixed(2)));
        
        // Add bet number to x-axis
        xAxisData.push(`#${i + 1}`);
      }
      
      // Update y-axis range - filter out null/missing values
      const allData = [...plData, ...bspData.filter(d => d !== '-'), ...spData];
      yMin = Math.min(0, Math.min(...allData as number[]));
      yMax = Math.max(...allData as number[]);
      
      // Create series with distinctive colors
      series = [
        {
          name: 'Actual P/L',
          type: 'line',
          data: plData,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 3,
            color: getChartLineColor() // Blue
          },
          itemStyle: {
            color: getChartLineColor(),
            borderWidth: 2,
            borderColor: theme === 'dark' || theme === 'racing' ? '#1a202c' : '#ffffff'
          }
        },
        {
          name: 'BSP P/L',
          type: 'line',
          connectNulls: true,
          data: bspData,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 2,
            color: getChartSecondaryLineColor(), // Green
            type: 'solid'
          },
          itemStyle: {
            color: getChartSecondaryLineColor(),
            borderWidth: 2,
            borderColor: theme === 'dark' || theme === 'racing' ? '#1a202c' : '#ffffff'
          }
        },
        {
          name: 'SP P/L',
          type: 'line',
          data: spData,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 2,
            color: theme === 'dark' || theme === 'racing' ? '#ec4899' : '#ec4899', // Pink
            type: 'solid'
          },
          itemStyle: {
            color: theme === 'dark' || theme === 'racing' ? '#ec4899' : '#ec4899',
            borderWidth: 2,
            borderColor: theme === 'dark' || theme === 'racing' ? '#1a202c' : '#ffffff'
          }
        }
      ];
      
    } else if (activeChartType === 'roiComparison') {
      // ROI vs BSP vs SP chart
      title = 'ROI Comparison (Actual vs BSP vs SP)';
      
      // Calculate ROI for each point in time
      let cumulativeStake = 0;
      let cumulativePL = 0;
      let cumulativeBSP_PL = 0;
      let cumulativeSP_PL = 0;
      const roiData = [];
      const bspRoiData = [];
      const spRoiData = [];
      
      for (let i = 0; i < sortedBets.length; i++) {
        const bet = sortedBets[i];
        const betPL = bet.profit_loss || 0;
        cumulativeStake += bet.stake;
        
        // Calculate BSP P/L
        let bspPL: number | null = 0;
        let hasBSP = false;
        
        if (bet.closing_odds) {
          const closingOdds = parseFloat(bet.closing_odds);
          if (!isNaN(closingOdds)) {
            bspPL = bet.status.toLowerCase() === 'won' ? 
              bet.stake * (closingOdds - 1) : 
              -bet.stake;
            hasBSP = true;
          }
        }
        
        // Calculate SP P/L
        const spPL = bet.status.toLowerCase() === 'won' ? 
          bet.stake * (bet.odds - 1) : 
          -bet.stake;
        
        // Update cumulative values
        cumulativePL += betPL;
        if (hasBSP) cumulativeBSP_PL += bspPL;
        cumulativeSP_PL += spPL;
        
        // Calculate ROI (P/L divided by total stake)
        const roi = (cumulativePL / cumulativeStake) * 100;
        const bspRoi = hasBSP ? (cumulativeBSP_PL / cumulativeStake) * 100 : null;
        const spRoi = (cumulativeSP_PL / cumulativeStake) * 100;
        
        // Add to series data
        roiData.push(Number(roi.toFixed(2)));
        bspRoiData.push(bspRoi !== null ? Number(bspRoi.toFixed(2)) : '-');
        spRoiData.push(Number(spRoi.toFixed(2)));
        
        // Add bet number to x-axis
        xAxisData.push(`#${i + 1}`);
      }
      
      // Update y-axis range - filter out null/missing values
      const allData = [...roiData, ...bspRoiData.filter(d => d !== '-'), ...spRoiData];
      yMin = Math.min(0, Math.min(...allData as number[]));
      yMax = Math.max(...allData as number[]);
      
      // Create series with distinctive colors
      series = [
        {
          name: 'Actual ROI',
          type: 'line',
          data: roiData,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 3,
            color: getChartLineColor() // Blue
          },
          itemStyle: {
            color: getChartLineColor(),
            borderWidth: 2,
            borderColor: theme === 'dark' || theme === 'racing' ? '#1a202c' : '#ffffff'
          }
        },
        {
          name: 'BSP ROI',
          type: 'line',
          connectNulls: true,
          data: bspRoiData,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 2,
            color: getChartSecondaryLineColor(), // Green
            type: 'solid'
          },
          itemStyle: {
            color: getChartSecondaryLineColor(),
            borderWidth: 2,
            borderColor: theme === 'dark' || theme === 'racing' ? '#1a202c' : '#ffffff'
          }
        },
        {
          name: 'SP ROI',
          type: 'line',
          data: spRoiData,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 2,
            color: theme === 'dark' || theme === 'racing' ? '#ec4899' : '#ec4899', // Pink
            type: 'solid'
          },
          itemStyle: {
            color: theme === 'dark' || theme === 'racing' ? '#ec4899' : '#ec4899',
            borderWidth: 2,
            borderColor: theme === 'dark' || theme === 'racing' ? '#1a202c' : '#ffffff'
          }
        }
      ];
      
    } else if (activeChartType === 'expectedValue') {
      // Expected value graph
      title = 'Expected Value Over Time (Using BSP)';
      
      // Calculate expected value based on BSP
      let cumulativeEV = 0;
      const evData = [];
      
      for (let i = 0; i < sortedBets.length; i++) {
        const bet = sortedBets[i];
        let ev = 0;
        
        // Calculate EV if closing odds (BSP) is available
        if (bet.closing_odds) {
          const closingOdds = parseFloat(bet.closing_odds);
          if (!isNaN(closingOdds)) {
            // EV = Stake * (your odds / true odds - 1)
            // Using BSP as the true odds
            const trueOdds = closingOdds;
            const yourOdds = bet.odds;
            
            // Calculate EV
            ev = bet.stake * (yourOdds / trueOdds - 1);
          }
        }
        
        // Update cumulative EV
        cumulativeEV += ev;
        
        // Add to series data
        evData.push(Number(cumulativeEV.toFixed(2)));
        
        // Add bet number to x-axis
        xAxisData.push(`#${i + 1}`);
      }
      
      // Update y-axis range
      yMin = Math.min(0, Math.min(...evData));
      yMax = Math.max(...evData);
      
      // Create series
      series = [
        {
          name: 'Expected Value',
          type: 'line',
          data: evData,
          symbol: 'circle',
          symbolSize: 6,
          lineStyle: {
            width: 3,
            color: theme === 'dark' || theme === 'racing' ? '#a78bfa' : '#8b5cf6' // Purple
          },
          itemStyle: {
            color: function(params: any) {
              return params.value >= 0 ? 
                (theme === 'dark' || theme === 'racing' ? '#a78bfa' : '#8b5cf6') : 
                getNegativeColor();
            },
            borderWidth: 2,
            borderColor: theme === 'dark' || theme === 'racing' ? '#1a202c' : '#ffffff'
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
                color: theme === 'dark' || theme === 'racing' ? 'rgba(167, 139, 250, 0.5)' : 'rgba(139, 92, 246, 0.3)'
              }, {
                offset: 1,
                color: theme === 'dark' || theme === 'racing' ? 'rgba(167, 139, 250, 0.05)' : 'rgba(139, 92, 246, 0.05)'
              }]
            }
          }
        }
      ];
    }

    return {
      backgroundColor: getChartBackgroundColor(),
      title: {
        text: title,
        left: 'center',
        top: 5,
        textStyle: {
          color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568',
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
          let result = `Bet ${params[0].name}<br/>`;
          
          for (const param of params) {
            if (param.value === '-') continue; // Skip missing data points
            
            let valueDisplay = '';
            if (activeChartType === 'roiComparison') {
              valueDisplay = `${param.value}%`;
            } else {
              valueDisplay = formatNumber(param.value);
            }
              
            result += `${param.seriesName}: <span style="color:${param.color}">${valueDisplay}</span><br/>`;
          }
          
          return result;
        }
      },
      legend: {
        data: series.map(s => s.name),
        icon: 'circle',
        top: 30,
        textStyle: {
          color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568'
        }
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: 40,
        top: 70,
        containLabel: true
      },
      dataZoom: [
        {
          type: 'inside',
          start: 0, // Always show the full chart range from the beginning
          end: 100
        }
      ],
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: xAxisData,
        axisLine: {
          show: true,
          lineStyle: {
            color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#1a202c',
            width: 1
          }
        },
        axisTick: {
          show: false
        },
        axisLabel: {
          color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568',
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
            color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#1a202c',
            width: 1
          }
        },
        axisLabel: {
          color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568',
          formatter: function(value: number) {
            return activeChartType === 'roiComparison' ? 
              `${value}%` : 
              formatNumber(value);
          }
        },
        splitLine: {
          show: false // Hide all grid lines
        }
      },
      series: series,
      markLine: {
        silent: true,
        symbol: ['none', 'none'],
        lineStyle: {
          color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#1a202c',
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
    };
  }, [bets, activeChartType, theme, formatNumber]);

  // Create a new function for ROI analysis chart options
  const roiChartOptions = useMemo(() => {
    let title = 'ROI Analysis';
    let bestData: { name: string; value: number; sampleSize: number; totalStake: number }[] = [];
    let worstData: { name: string; value: number; sampleSize: number; totalStake: number }[] = [];
    const settledBets = bets.filter(bet => 
      ['won', 'lost', 'placed'].includes(bet.status.toLowerCase()) && 
      bet.profit_loss !== null && 
      bet.stake > 0
    );
    
    if (activeRoiMetric === 'track') {
      title = 'ROI by Track';
      
      // Calculate ROI per track using proper accumulation
      const trackROI: Record<string, { sampleSize: number; totalStake: number; totalProfit: number }> = {};
      
      // Process each bet
      settledBets.forEach(bet => {
        // Skip if track is null or undefined
        if (!bet.track_name) return;
        
        const profitLoss = bet.profit_loss || 0;
        const stake = bet.stake || 0;
        
        if (bet.track_name && bet.track_name.includes('/')) {
          const tracks = bet.track_name.split('/').map(t => t.trim()).filter(t => t);
          const trackCount = tracks.length;
          const stakePerTrack = stake / trackCount;
          const profitPerTrack = profitLoss / trackCount;
          
          tracks.forEach(track => {
            if (!trackROI[track]) {
              trackROI[track] = { sampleSize: 0, totalStake: 0, totalProfit: 0 };
            }
            trackROI[track].sampleSize += 1;
            trackROI[track].totalStake += stakePerTrack;
            trackROI[track].totalProfit += profitPerTrack;
          });
        } else {
          const track = bet.track_name || 'Unknown';
          if (!trackROI[track]) {
            trackROI[track] = { sampleSize: 0, totalStake: 0, totalProfit: 0 };
          }
          trackROI[track].sampleSize += 1;
          trackROI[track].totalStake += stake;
          trackROI[track].totalProfit += profitLoss;
        }
      });
      
      // Filter out tracks with too few bets and calculate final ROI
      const filteredTrackROI = Object.entries(trackROI)
        .filter(([_, stats]) => stats.sampleSize >= 2)
        .map(([track, stats]) => ({
          name: track,
          value: Number(stats.totalStake > 0 ? ((stats.totalProfit / stats.totalStake) * 100).toFixed(1) : 0),
          sampleSize: stats.sampleSize,
          totalStake: Number(stats.totalStake.toFixed(2))
        }));
      
      // Get top 5 best and worst ROI, but ensure proper ordering
      const sortedByROI = [...filteredTrackROI].sort((a, b) => b.value - a.value);
      bestData = sortedByROI.slice(0, 5).sort((a, b) => b.value - a.value); // Best performers, highest to lowest
      worstData = sortedByROI.slice(-5).sort((a, b) => b.value - a.value); // Worst performers, but ordered highest to lowest within the worst group
      
    } else if (activeRoiMetric === 'odds') {
      title = 'ROI by Odds Range';
      
      // Use consistent odds ranges across all charts
      const oddsRanges = [
        { name: 'Under 2.5', min: 0, max: 2.5 },
        { name: '2.5 - 3.99', min: 2.5, max: 4 },
        { name: '4 - 8.99', min: 4, max: 9 },
        { name: '9 - 19.99', min: 9, max: 20 },
        { name: '20+', min: 20, max: Infinity }
      ];
      
      // Calculate ROI for each odds range
      const oddsRangeData = oddsRanges.map(range => {
        const filteredBets = settledBets.filter(bet => bet.odds >= range.min && bet.odds < range.max);
        const totalStake = filteredBets.reduce((sum, bet) => sum + bet.stake, 0);
        const totalProfit = filteredBets.reduce((sum, bet) => sum + (bet.profit_loss || 0), 0);
        
        if (totalStake === 0) return { name: range.name, value: 0, sampleSize: 0, totalStake: 0 };
        
        const roi = (totalProfit / totalStake) * 100;
        return { 
          name: range.name, 
          value: Number(roi.toFixed(1)),
          sampleSize: filteredBets.length,
          totalStake: Number(totalStake.toFixed(2))
        };
      }).filter(item => !isNaN(item.value) && item.sampleSize > 0);
      
      // Sort by ROI value and take all ranges, ordered from best to worst
      const sortedOddsData = [...oddsRangeData].sort((a, b) => b.value - a.value);
      
      // Take up to 5 best and 5 worst performing ranges
      bestData = sortedOddsData.slice(0, Math.min(5, Math.ceil(sortedOddsData.length / 2))).sort((a, b) => b.value - a.value);
      worstData = sortedOddsData.slice(-Math.min(5, Math.floor(sortedOddsData.length / 2))).sort((a, b) => b.value - a.value);
      
    } else if (activeRoiMetric === 'jockey') {
      title = 'ROI by Jockey';
      
      // Calculate ROI per jockey
      const jockeyROI: Record<string, { roi: number; sampleSize: number; totalStake: number; totalProfit: number }> = {};
      
      // Process each bet
      settledBets.forEach(bet => {
        // Skip if jockey is null or undefined
        if (!bet.jockey) return;
        
        const profitLoss = bet.profit_loss || 0;
        const stake = bet.stake || 0;
        
        if (bet.jockey.includes('/')) {
          const jockeys = bet.jockey.split('/').map(j => j.trim()).filter(j => j);
          const jockeyCount = jockeys.length;
          const stakePerJockey = stake / jockeyCount;
          const profitPerJockey = profitLoss / jockeyCount;
          
          jockeys.forEach(jockey => {
            if (!jockeyROI[jockey]) {
              jockeyROI[jockey] = { roi: 0, sampleSize: 0, totalStake: 0, totalProfit: 0 };
            }
            jockeyROI[jockey].sampleSize += 1;
            jockeyROI[jockey].totalStake += stakePerJockey;
            jockeyROI[jockey].totalProfit += profitPerJockey;
          });
        } else {
          if (!jockeyROI[bet.jockey]) {
            jockeyROI[bet.jockey] = { roi: 0, sampleSize: 0, totalStake: 0, totalProfit: 0 };
          }
          jockeyROI[bet.jockey].sampleSize += 1;
          jockeyROI[bet.jockey].totalStake += stake;
          jockeyROI[bet.jockey].totalProfit += profitLoss;
        }
      });
      
      // Calculate ROI for each jockey
      Object.keys(jockeyROI).forEach(jockey => {
        const stats = jockeyROI[jockey];
        stats.roi = stats.totalStake > 0 ? (stats.totalProfit / stats.totalStake) * 100 : 0;
      });
      
      // Filter out jockeys with too few bets and map to chart format
      const filteredJockeyROI = Object.entries(jockeyROI)
        .filter(([_, stats]) => stats.sampleSize >= 2)
        .map(([jockey, stats]) => ({
          name: jockey,
          value: Number(stats.roi.toFixed(1)),
          sampleSize: stats.sampleSize,
          totalStake: Number(stats.totalStake.toFixed(2))
        }));
      
      // Get top 5 best and worst ROI, but ensure proper ordering
      const sortedByROI = [...filteredJockeyROI].sort((a, b) => b.value - a.value);
      bestData = sortedByROI.slice(0, 5).sort((a, b) => b.value - a.value); // Best performers, highest to lowest
      worstData = sortedByROI.slice(-5).sort((a, b) => b.value - a.value); // Worst performers, but ordered highest to lowest within the worst group
      
    } else if (activeRoiMetric === 'trainer') {
      title = 'ROI by Trainer';
      
      // Calculate ROI per trainer
      const trainerROI: Record<string, { roi: number; sampleSize: number; totalStake: number; totalProfit: number }> = {};
      
      // Process each bet
      settledBets.forEach(bet => {
        // Skip if trainer is null or undefined
        if (!bet.trainer) return;
        
        const profitLoss = bet.profit_loss || 0;
        const stake = bet.stake || 0;
        
        if (bet.trainer.includes('/')) {
          const trainers = bet.trainer.split('/').map(t => t.trim()).filter(t => t);
          const trainerCount = trainers.length;
          const stakePerTrainer = stake / trainerCount;
          const profitPerTrainer = profitLoss / trainerCount;
          
          trainers.forEach(trainer => {
            if (!trainerROI[trainer]) {
              trainerROI[trainer] = { roi: 0, sampleSize: 0, totalStake: 0, totalProfit: 0 };
            }
            trainerROI[trainer].sampleSize += 1;
            trainerROI[trainer].totalStake += stakePerTrainer;
            trainerROI[trainer].totalProfit += profitPerTrainer;
          });
        } else {
          if (!trainerROI[bet.trainer]) {
            trainerROI[bet.trainer] = { roi: 0, sampleSize: 0, totalStake: 0, totalProfit: 0 };
          }
          trainerROI[bet.trainer].sampleSize += 1;
          trainerROI[bet.trainer].totalStake += stake;
          trainerROI[bet.trainer].totalProfit += profitLoss;
        }
      });
      
      // Calculate ROI for each trainer
      Object.keys(trainerROI).forEach(trainer => {
        const stats = trainerROI[trainer];
        stats.roi = stats.totalStake > 0 ? (stats.totalProfit / stats.totalStake) * 100 : 0;
      });
      
      // Filter out trainers with too few bets and map to chart format
      const filteredTrainerROI = Object.entries(trainerROI)
        .filter(([_, stats]) => stats.sampleSize >= 2)
        .map(([trainer, stats]) => ({
          name: trainer,
          value: Number(stats.roi.toFixed(1)),
          sampleSize: stats.sampleSize,
          totalStake: Number(stats.totalStake.toFixed(2))
        }));
      
      // Get top 5 best and worst ROI, but ensure proper ordering
      const sortedByROI = [...filteredTrainerROI].sort((a, b) => b.value - a.value);
      bestData = sortedByROI.slice(0, 5).sort((a, b) => b.value - a.value); // Best performers, highest to lowest
      worstData = sortedByROI.slice(-5).sort((a, b) => b.value - a.value); // Worst performers, but ordered highest to lowest within the worst group
      
    } else if (activeRoiMetric === 'class') {
      title = 'ROI by Race Class';
      
      // Function to normalize class type names
      const normalizeClassName = (className: string): string => {
        if (!className) return '';
        
        // Convert to lowercase and trim whitespace
        const normalized = className.toLowerCase().trim();
        
        // Standardize common class formats
        if (normalized.match(/^class\s*\d+$/)) {
          // "class 4" -> "Class 4"
          return normalized.replace(/^class\s*(\d+)$/, 'Class $1');
        } else if (normalized.match(/^\d+$/)) {
          // "4" -> "Class 4"
          return `Class ${normalized}`;
        } else if (normalized === 'flat') {
          // "flat" -> "Flat"
          return 'Flat';
        } else if (normalized === 'national hunt' || normalized === 'nh') {
          // "national hunt" -> "National Hunt"
          return 'National Hunt';
        } else if (normalized === 'hurdle' || normalized === 'hurdles') {
          // "hurdle" -> "Hurdle"
          return 'Hurdle';
        } else if (normalized === 'chase' || normalized === 'chases') {
          // "chase" -> "Chase"
          return 'Chase';
        } else {
          // Capitalize first letter of each word
          return normalized.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
        }
      };
      
      // Calculate ROI for each class
      const classROI: Record<string, { roi: number; sampleSize: number; totalStake: number; totalProfit: number }> = {};
      
      // Process each bet
      settledBets.forEach(bet => {
        // Skip if class_type is null or undefined
        if (!bet.class_type) return;
        
        const profitLoss = bet.profit_loss || 0;
        const stake = bet.stake || 0;
        
        if (bet.class_type.includes('/')) {
          // Handle multiple classes (for multi-horse bets)
          const classes = bet.class_type.split('/').map(c => normalizeClassName(c.trim())).filter(c => c);
          const classCount = classes.length;
          const stakePerClass = stake / classCount;
          const profitPerClass = profitLoss / classCount;
          
          classes.forEach(classType => {
            if (!classROI[classType]) {
              classROI[classType] = { roi: 0, sampleSize: 0, totalStake: 0, totalProfit: 0 };
            }
            classROI[classType].sampleSize += 1/classCount; // Split sample size for multiples
            classROI[classType].totalStake += stakePerClass;
            classROI[classType].totalProfit += profitPerClass;
          });
        } else {
          const normalizedClass = normalizeClassName(bet.class_type);
          if (!classROI[normalizedClass]) {
            classROI[normalizedClass] = { roi: 0, sampleSize: 0, totalStake: 0, totalProfit: 0 };
          }
          classROI[normalizedClass].sampleSize += 1;
          classROI[normalizedClass].totalStake += stake;
          classROI[normalizedClass].totalProfit += profitLoss;
        }
      });
      
      // Calculate ROI for each class
      Object.keys(classROI).forEach(classType => {
        const stats = classROI[classType];
        stats.roi = stats.totalStake > 0 ? (stats.totalProfit / stats.totalStake) * 100 : 0;
        // Round sample size to nearest integer for display
        stats.sampleSize = Math.round(stats.sampleSize);
      });
      
      // Filter out classes with too few bets and map to chart format
      const filteredClassROI = Object.entries(classROI)
        .filter(([_, stats]) => stats.sampleSize >= 2)
        .map(([classType, stats]) => ({
          name: classType,
          value: Number(stats.roi.toFixed(1)),
          sampleSize: stats.sampleSize,
          totalStake: Number(stats.totalStake.toFixed(2))
        }));
      
      // Get top 5 best and worst ROI, but ensure proper ordering
      const sortedByROI = [...filteredClassROI].sort((a, b) => b.value - a.value);
      bestData = sortedByROI.slice(0, 5).sort((a, b) => b.value - a.value); // Best performers, highest to lowest
      worstData = sortedByROI.slice(-5).sort((a, b) => b.value - a.value); // Worst performers, but ordered highest to lowest within the worst group
    }

    // Combine data for visualization and sort by ROI value (highest to lowest for top-to-bottom order)
    const combinedData = [...bestData, ...worstData].sort((a, b) => b.value - a.value);

    // Better legend descriptions
    const legendData = ['Top 5 Best ROI', 'Bottom 5 Worst ROI'];

    // Handle case where there's no data
    if (combinedData.length === 0) {
      return {
        title: {
          text: 'No ROI Data Available',
          left: 'center',
          top: 'center',
          textStyle: {
            color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568',
            fontSize: 16,
            fontWeight: 'normal'
          }
        },
        series: []
      };
    }

    return {
      backgroundColor: getChartBackgroundColor(),
      textStyle: {
        color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568'
      },
      title: {
        text: title,
        left: 'center',
        top: 5,
        textStyle: {
          color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568',
          fontSize: 16,
          fontWeight: 'normal'
        }
      },
      tooltip: {
        trigger: 'axis',
        formatter: function(params: any) {
          const data = params[0];
          const item = combinedData.find(d => d.name === data.name);
          if (item) {
            return `${data.name}<br/>
                   ROI: <span style="color:${getProfitLossColor(data.value)}">${data.value >= 0 ? '+' : ''}${data.value}%</span><br/>
                   Sample Size: ${item.sampleSize} bets<br/>
                   Total Stake: ${formatNumber(item.totalStake)}`;
          }
          return `${data.name}: ${data.value}%`;
        },
        axisPointer: {
          type: 'shadow'
        },
        backgroundColor: theme === 'dark' || theme === 'racing' ? '#2d3748' : '#ffffff',
        borderColor: theme === 'dark' || theme === 'racing' ? '#4a5568' : '#e2e8f0',
        textStyle: {
          color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#1a202c'
        }
      },
      legend: {
        // Hide legend for all metrics since we now use intuitive coloring
        show: false,
        data: [
          {
            name: 'Top 5 Best ROI',
            itemStyle: {
              color: getPositiveColor() // Green for best ROI
            }
          },
          {
            name: 'Bottom 5 Worst ROI',
            itemStyle: {
              color: getNegativeColor() // Red for worst ROI
            }
          }
        ],
        icon: 'circle',
        top: 30,
        textStyle: {
          color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568'
        },
        selectedMode: false
      },
      grid: {
        left: '3%',
        right: '12%',
        bottom: 60,
        top: 40, // Consistent top space since no legend is shown
        containLabel: true
      },
      xAxis: {
        type: 'value',
        name: 'ROI %',
        nameLocation: 'middle',
        nameGap: 30,
        min: function(value: { min: number; max: number }) {
          return value.min < 0 ? value.min * 1.1 : -5;
        },
        max: function(value: { min: number; max: number }) {
          return value.max * 1.1;
        },
        nameTextStyle: {
          color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568'
        },
        axisLine: {
          show: true,
          lineStyle: {
            color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#1a202c',
            width: 1
          }
        },
        axisLabel: {
          color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568',
          formatter: '{value}%',
          width: 80,
          overflow: 'truncate'
        },
        axisTick: {
          alignWithLabel: true
        },
        splitLine: {
          show: false // Hide all grid lines
        }
      },
      yAxis: {
        type: 'category',
        data: combinedData.map(item => item.name), // Use sorted combinedData for proper ordering
        axisLine: {
          show: true,
          lineStyle: {
            color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#1a202c',
            width: 1
          }
        },
        axisLabel: {
          color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568',
          width: 80,
          overflow: 'truncate',
          fontSize: 11
        },
        axisTick: {
          alignWithLabel: true
        },
        splitLine: {
          show: false // Hide all grid lines
        }
      },
      series: [
        {
          name: 'ROI %',
          type: 'bar',
          data: combinedData.map(item => ({ // Use sorted combinedData for proper ordering
            value: item.value,
            itemStyle: {
              color: getProfitLossColor(item.value) // Color based on actual ROI value
            }
          })),
          label: {
            show: true,
            position: 'right',
            formatter: function(params: any) {
              return params.value >= 0 ? `+${params.value}%` : `${params.value}%`;
            },
            fontSize: 12,
            color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#4a5568',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            padding: [2, 4],
            borderRadius: 2,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
            shadowBlur: 3
          },
          barWidth: '70%',
          itemStyle: {
            borderRadius: [0, 4, 4, 0]
          },
          markLine: {
            silent: true,
            symbol: ['none', 'none'],
            label: {
              show: false
            },
            lineStyle: {
              color: theme === 'dark' || theme === 'racing' ? '#e2e8f0' : '#1a202c',
              type: 'solid',
              width: 1
            },
            data: [
              {
                xAxis: 0
              }
            ]
          }
        }
      ]
    };
  }, [bets, activeRoiMetric, theme, formatNumber]);

  // Show loading spinner when data is loading
  if (isLoading) {
  return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-betting-dark min-h-screen">
      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Date Range Filter */}
        <div className="flex flex-col items-center justify-center mb-8">
          <div className="bg-betting-dark border border-betting-green/20 rounded-xl shadow-lg p-4 w-full max-w-2xl transition-all transform hover:shadow-xl">
            <div className="flex flex-col space-y-4">
              <div className="text-center">
                <h2 className="text-lg font-semibold text-white mb-2">Select Date Range</h2>
                <div className="flex flex-wrap justify-center gap-2">
                  <button
                    onClick={() => {
                      setDateRange('last7');
                      setIsDatePickerOpen(false);
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 
                      ${dateRange === 'last7' 
                        ? 'bg-betting-green text-white shadow-inner' 
                        : 'bg-betting-dark border border-betting-green/20 text-gray-200 hover:bg-betting-green/10'}`}
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => {
                      setDateRange('thisWeek');
                      setIsDatePickerOpen(false);
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 
                      ${dateRange === 'thisWeek' 
                        ? 'bg-betting-green text-white shadow-inner' 
                        : 'bg-betting-dark border border-betting-green/20 text-gray-200 hover:bg-betting-green/10'}`}
                  >
                    This Week
                  </button>
                  <button
                    onClick={() => {
                      setDateRange('thisMonth');
                      setIsDatePickerOpen(false);
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 
                      ${dateRange === 'thisMonth' 
                        ? 'bg-betting-green text-white shadow-inner' 
                        : 'bg-betting-dark border border-betting-green/20 text-gray-200 hover:bg-betting-green/10'}`}
                  >
              This Month
            </button>
                  <button
                    onClick={() => {
                      setDateRange('all');
                      setIsDatePickerOpen(false);
                    }}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 
                      ${dateRange === 'all' 
                        ? 'bg-betting-green text-white shadow-inner' 
                        : 'bg-betting-dark border border-betting-green/20 text-gray-200 hover:bg-betting-green/10'}`}
                  >
                    All Time
                  </button>
                  <button
                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                    className={`px-3 py-2 text-sm font-medium rounded-md transition-all duration-150 flex items-center gap-1
                      ${dateRange === 'custom' 
                        ? 'bg-betting-green text-white shadow-inner' 
                        : 'bg-betting-dark border border-betting-green/20 text-gray-200 hover:bg-betting-green/10'}`}
                  >
                    Custom Range <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
              
              {isDatePickerOpen && (
                <div className="bg-betting-dark border border-betting-green/20 rounded-lg p-4 animate-fade-in-down">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={customDateStart}
                        onChange={(e) => setCustomDateStart(e.target.value)}
                        className="w-full bg-betting-dark text-white border border-betting-green/20 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-betting-green"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">End Date</label>
                      <input
                        type="date"
                        value={customDateEnd}
                        onChange={(e) => setCustomDateEnd(e.target.value)}
                        className="w-full bg-betting-dark text-white border border-betting-green/20 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-betting-green"
                      />
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => {
                        if (customDateStart) {
                          setDateRange('custom');
                          setIsDatePickerOpen(false);
                        }
                      }}
                      disabled={!customDateStart}
                      className={`px-4 py-2 text-sm font-medium rounded-md 
                        ${customDateStart
                          ? 'bg-betting-green text-white hover:bg-betting-secondary' 
                          : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                    >
                      Apply Range
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Active Filter Display */}
          <div className="mt-2 text-center">
            <span className="text-sm font-medium text-gray-400">
              Currently viewing: <span className="text-betting-green font-semibold">{getDateRangeLabel()}</span>
              {dateRange === 'custom' && customDateStart && (
                <span> ({customDateStart}{customDateEnd ? ` to ${customDateEnd}` : ''})</span>
              )}
            </span>
          </div>
        </div>
        
        <div className="space-y-6">
          {/* Key metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group relative p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out 
                bg-gradient-to-br from-betting-dark to-betting-green/10 hover:-translate-y-1 cursor-pointer border border-betting-green/20">
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 ease-in-out"
                   style={{
                     background: `radial-gradient(circle at center, #22c55e20, transparent 70%)`,
                   }}></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-betting-green/20 text-betting-green transform group-hover:scale-110 transition-transform duration-300 ease-in-out">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                  {betStats.profitLoss > 0 && (
                    <div className="text-xs font-semibold px-2 py-1 rounded-full bg-betting-green/20 text-betting-green">
                      Profitable
                </div>
                  )}
                </div>
                <h3 className="text-xs font-medium text-gray-300 uppercase tracking-wider">Total Profit/Loss</h3>
                <p className="text-xl font-bold mt-1 text-white tracking-tight group-hover:scale-105 transition-transform duration-300 ease-in-out">
                  {formatNumber(betStats.profitLoss)}
                </p>
              </div>
            </div>
            
            <div className="group relative p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out 
                bg-gradient-to-br from-betting-dark to-betting-green/10 hover:-translate-y-1 cursor-pointer border border-betting-green/20">
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 ease-in-out"
                   style={{
                     background: `radial-gradient(circle at center, #22c55e20, transparent 70%)`,
                   }}></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-betting-green/20 text-betting-green transform group-hover:scale-110 transition-transform duration-300 ease-in-out">
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="text-xs font-medium text-gray-300 uppercase tracking-wider">Win Rate</h3>
                <p className="text-xl font-bold mt-1 text-white tracking-tight group-hover:scale-105 transition-transform duration-300 ease-in-out">
                  {betStats.strikeRate.toFixed(1)}%
                </p>
              </div>
            </div>
            
            <div className="group relative p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out 
                bg-gradient-to-br from-betting-dark to-yellow-500/10 hover:-translate-y-1 cursor-pointer border border-betting-green/20">
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 ease-in-out"
                   style={{
                     background: `radial-gradient(circle at center, #f59e0b20, transparent 70%)`,
                   }}></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-yellow-500/20 text-yellow-400 transform group-hover:scale-110 transition-transform duration-300 ease-in-out">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Average Odds</h3>
                <p className="text-xl font-bold mt-1 text-white tracking-tight group-hover:scale-105 transition-transform duration-300 ease-in-out">
                  {betStats.averageOdds.toFixed(2)}
                </p>
              </div>
            </div>
            
            <div className="group relative p-4 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 ease-in-out 
                bg-gradient-to-br from-betting-dark to-green-900/30 hover:-translate-y-1 cursor-pointer border border-betting-green/20">
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 ease-in-out"
                   style={{
                     background: `radial-gradient(circle at center, #22c55e20, transparent 70%)`,
                   }}></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-2 rounded-lg bg-green-900/40 text-green-400 transform group-hover:scale-110 transition-transform duration-300 ease-in-out">
                    <TrendingUp className="h-4 w-4" />
                  </div>
                </div>
                <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">ROI</h3>
                <p className="text-xl font-bold mt-1 text-white tracking-tight group-hover:scale-105 transition-transform duration-300 ease-in-out">
                  {betStats.roi.toFixed(1)}%
                </p>
              </div>
            </div>
          </div>
          
          {/* Top row with two charts - Bet Distribution and ROI Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className={`${getCardBg()} rounded-xl shadow-sm border ${getBorderColor()} p-4`}>
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <h2 className={`text-sm font-medium ${getTextColor()}`}>Bet Distribution</h2>
                  <div className="flex space-x-2">
                    <button 
                      onClick={() => setActiveMetric('track')}
                      className={`px-2 py-1 text-xs font-medium rounded-md ${
                        activeMetric === 'track' 
                          ? getActiveButtonBg()
                          : getInactiveButtonBg()
                      }`}
                    >
                      Tracks
                    </button>
                    <button 
                      onClick={() => setActiveMetric('jockey')}
                      className={`px-2 py-1 text-xs font-medium rounded-md ${
                        activeMetric === 'jockey' 
                          ? getActiveButtonBg()
                          : getInactiveButtonBg()
                      }`}
                    >
                      Jockeys
                    </button>
                    <button 
                      onClick={() => setActiveMetric('trainer')}
                      className={`px-2 py-1 text-xs font-medium rounded-md ${
                        activeMetric === 'trainer' 
                          ? getActiveButtonBg()
                          : getInactiveButtonBg()
                      }`}
                    >
                      Trainers
                    </button>
                    <button 
                      onClick={() => setActiveMetric('fin_pos')}
                      className={`px-2 py-1 text-xs font-medium rounded-md ${
                        activeMetric === 'fin_pos' 
                          ? getActiveButtonBg()
                          : getInactiveButtonBg()
                      }`}
                    >
                      Fin Pos
                    </button>
                    <button 
                      onClick={() => setActiveMetric('odds')}
                      className={`px-2 py-1 text-xs font-medium rounded-md ${
                        activeMetric === 'odds' 
                          ? getActiveButtonBg()
                          : getInactiveButtonBg()
                      }`}
                    >
                      Odds
                    </button>
                  </div>
            </div>
            
                <div className="h-96">
                  {bets.length > 0 ? (
                    <ReactECharts
                      option={pieChartOptions}
                      style={{ height: '100%', width: '100%' }}
                      theme={theme === 'dark' || theme === 'racing' ? 'dark' : ''}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className={getMutedTextColor()}>No betting data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* ROI Analysis Chart */}
            <div className={`${getCardBg()} rounded-xl shadow-sm border ${getBorderColor()} p-4`}>
              <div className="flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <h2 className={`text-sm font-medium ${getTextColor()}`}>ROI Analysis</h2>
                  <div className="flex space-x-2">
              <button 
                      onClick={() => setActiveRoiMetric('track')}
                      className={`px-2 py-1 text-xs font-medium rounded-md ${
                        activeRoiMetric === 'track' 
                    ? getActiveButtonBg()
                    : getInactiveButtonBg()
                }`}
              >
                      Tracks
              </button>
              <button 
                      onClick={() => setActiveRoiMetric('odds')}
                      className={`px-2 py-1 text-xs font-medium rounded-md ${
                        activeRoiMetric === 'odds' 
                    ? getActiveButtonBg()
                    : getInactiveButtonBg()
                }`}
              >
                      Odds
              </button>
              <button 
                      onClick={() => setActiveRoiMetric('jockey')}
                      className={`px-2 py-1 text-xs font-medium rounded-md ${
                        activeRoiMetric === 'jockey' 
                    ? getActiveButtonBg()
                    : getInactiveButtonBg()
                }`}
              >
                      Jockeys
                    </button>
                    <button 
                      onClick={() => setActiveRoiMetric('trainer')}
                      className={`px-2 py-1 text-xs font-medium rounded-md ${
                        activeRoiMetric === 'trainer' 
                          ? getActiveButtonBg()
                          : getInactiveButtonBg()
                      }`}
                    >
                      Trainers
                    </button>
                    <button 
                      onClick={() => setActiveRoiMetric('class')}
                      className={`px-2 py-1 text-xs font-medium rounded-md ${
                        activeRoiMetric === 'class' 
                          ? getActiveButtonBg()
                          : getInactiveButtonBg()
                      }`}
                    >
                      Class
              </button>
                  </div>
            </div>
            
                <div className="h-96">
                  {bets.length > 0 ? (
                    <ReactECharts
                      option={roiChartOptions}
                      style={{ height: '100%', width: '100%' }}
                      theme={theme === 'dark' || theme === 'racing' ? 'dark' : ''}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <p className={getMutedTextColor()}>No betting data available</p>
              </div>
                  )}
            </div>
          </div>
              </div>
          </div>
          
          {/* Full-width Profit Analysis Chart */}
          <div className={`${getCardBg()} rounded-xl shadow-sm border ${getBorderColor()} p-4`}>
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <h2 className={`text-sm font-medium ${getTextColor()}`}>Profit Analysis</h2>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setActiveProfitMetric('track')}
                    className={`px-2 py-1 text-xs font-medium rounded-md ${
                      activeProfitMetric === 'track' 
                        ? getActiveButtonBg()
                        : getInactiveButtonBg()
                    }`}
                  >
                    Tracks
                  </button>
                  <button 
                    onClick={() => setActiveProfitMetric('odds')}
                    className={`px-2 py-1 text-xs font-medium rounded-md ${
                      activeProfitMetric === 'odds' 
                        ? getActiveButtonBg()
                        : getInactiveButtonBg()
                    }`}
                  >
                    Odds
                  </button>
                  <button 
                    onClick={() => setActiveProfitMetric('jockey')}
                    className={`px-2 py-1 text-xs font-medium rounded-md ${
                      activeProfitMetric === 'jockey' 
                        ? getActiveButtonBg()
                        : getInactiveButtonBg()
                    }`}
                  >
                    Jockeys
                  </button>
                  <button 
                    onClick={() => setActiveProfitMetric('trainer')}
                    className={`px-2 py-1 text-xs font-medium rounded-md ${
                      activeProfitMetric === 'trainer' 
                        ? getActiveButtonBg()
                        : getInactiveButtonBg()
                    }`}
                  >
                    Trainers
                  </button>
                  <button 
                    onClick={() => setActiveProfitMetric('class')}
                    className={`px-2 py-1 text-xs font-medium rounded-md ${
                      activeProfitMetric === 'class' 
                        ? getActiveButtonBg()
                        : getInactiveButtonBg()
                    }`}
                  >
                    Class
                  </button>
              </div>
            </div>
            
              <div className="h-96">
                {bets.length > 0 ? (
                  <ReactECharts
                    option={barChartOptions}
                    style={{ height: '100%', width: '100%' }}
                    theme={theme === 'dark' || theme === 'racing' ? 'dark' : ''}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className={getMutedTextColor()}>No betting data available</p>
              </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Bottom row with full-width Performance Trend chart */}
          <div className={`${getCardBg()} rounded-xl shadow-sm border ${getBorderColor()} p-4`}>
            <div className="flex justify-between items-center mb-2">
              <h2 className={`text-sm font-medium ${getTextColor()}`}>Performance Trend</h2>
              <div className="flex space-x-2">
                <button 
                  onClick={() => setActiveChartType('plBasic')}
                  className={`px-2 py-1 text-xs font-medium rounded-md ${
                    activeChartType === 'plBasic' 
                      ? getActiveButtonBg()
                      : getInactiveButtonBg()
                  }`}
                >
                  P/L Basic
                </button>
                <button 
                  onClick={() => setActiveChartType('plComparison')}
                  className={`px-2 py-1 text-xs font-medium rounded-md ${
                    activeChartType === 'plComparison' 
                      ? getActiveButtonBg()
                      : getInactiveButtonBg()
                  }`}
                >
                  P/L Comparison
                </button>
                <button 
                  onClick={() => setActiveChartType('roiComparison')}
                  className={`px-2 py-1 text-xs font-medium rounded-md ${
                    activeChartType === 'roiComparison' 
                      ? getActiveButtonBg()
                      : getInactiveButtonBg()
                  }`}
                >
                  ROI Comparison
                </button>
                <button 
                  onClick={() => setActiveChartType('expectedValue')}
                  className={`px-2 py-1 text-xs font-medium rounded-md ${
                    activeChartType === 'expectedValue' 
                      ? getActiveButtonBg()
                      : getInactiveButtonBg()
                  }`}
                >
                  Expected Value
                </button>
              </div>
            </div>

            <div className="h-[500px]">
              {bets.length > 0 ? (
                <ReactECharts
                  key={`trend-chart-${activeChartType}`} // Add key to force complete re-render when chart type changes
                  option={detailedChartOptions}
                  style={{ height: '100%', width: '100%' }}
                  theme={theme === 'dark' || theme === 'racing' ? 'dark' : ''}
                  notMerge={true} // Prevent merging with previous chart options
                  lazyUpdate={false} // Ensure immediate update
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <p className={getMutedTextColor()}>No betting data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
} 