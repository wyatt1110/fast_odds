'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/frontend-ui/layouts/DashboardLayout';
import { useUserProfile } from '@/hooks/useUserProfile';
import { supabase } from '@/lib/supabase/client';
import { Calendar, Search, RotateCcw, TrendingUp, BarChart3, ChevronDown, Check } from 'lucide-react';
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

// Custom Multi-Select Component
interface MultiSelectProps {
  options: string[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  placeholder: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, selectedValues, onSelectionChange, placeholder }) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleToggleOption = (option: string) => {
    if (selectedValues.includes(option)) {
      onSelectionChange(selectedValues.filter(val => val !== option));
    } else {
      onSelectionChange([...selectedValues, option]);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-betting-dark border border-betting-green/20 rounded-lg px-3 py-3 text-white text-left flex items-center justify-between h-auto min-h-[60px]"
      >
        <span className={selectedValues.length === 0 ? 'text-gray-400 text-sm' : 'text-white text-sm'}>
          {selectedValues.length === 0 
            ? placeholder 
            : `${selectedValues.length} selected: ${selectedValues.slice(0, 2).join(', ')}${selectedValues.length > 2 ? '...' : ''}`
          }
        </span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-betting-dark border border-betting-green/20 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-gray-400 text-xs">No options available</div>
          ) : (
            options.map((option) => (
              <div
                key={option}
                onClick={() => handleToggleOption(option)}
                className="flex items-center px-3 py-2 hover:bg-betting-green/10 cursor-pointer"
              >
                <div className={`w-4 h-4 border border-betting-green rounded mr-2 flex items-center justify-center ${
                  selectedValues.includes(option) ? 'bg-betting-green' : ''
                }`}>
                  {selectedValues.includes(option) && <Check className="w-3 h-3 text-black" />}
                </div>
                <span className="text-white text-xs truncate">{option}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

// Interface for dropdown options
interface DropdownOptions {
  jockeys: string[];
  tracks: string[];
  trainers: string[];
  postPositions: string[];
  horseNumbers: string[];
  goings: string[];
  surfaces: string[];
  betTypes: string[];
}

// Interface for filter options
interface FilterOptions {
  dateFrom: string;
  dateTo: string;
  oddsFrom: string;
  oddsTo: string;
  selectedJockeys: string[];
  selectedTracks: string[];
  selectedTrainers: string[];
  selectedPostPositions: string[];
  selectedHorseNumbers: string[];
  selectedGoings: string[];
  selectedSurfaces: string[];
  selectedBetTypes: string[];
}

// Interface for analytics stats
interface AnalyticsStats {
  numberOfBets: number;
  averageOdds: number;
  totalStaked: number;
  totalReturned: number;
  profitLoss: number;
  strikeRate: number;
  roi: number;
  totalCLV: number;
  averageCLV: number;
}

export default function ProAnalyticsPage() {
  const router = useRouter();
  const { userProfile, loading, hasProAccess } = useUserProfile();
  
  // Filter states
  const [filters, setFilters] = useState<FilterOptions>({
    dateFrom: '',
    dateTo: '',
    oddsFrom: '',
    oddsTo: '',
    selectedJockeys: [],
    selectedTracks: [],
    selectedTrainers: [],
    selectedPostPositions: [],
    selectedHorseNumbers: [],
    selectedGoings: [],
    selectedSurfaces: [],
    selectedBetTypes: [],
  });

  // Dropdown options state
  const [dropdownOptions, setDropdownOptions] = useState<DropdownOptions>({
    jockeys: [],
    tracks: [],
    trainers: [],
    postPositions: [],
    horseNumbers: [],
    goings: [],
    surfaces: [],
    betTypes: [],
  });

  // Data state
  const [filteredBets, setFilteredBets] = useState<any[]>([]);
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [bspStats, setBspStats] = useState<AnalyticsStats | null>(null);
  const [bestOddsStats, setBestOddsStats] = useState<AnalyticsStats | null>(null);
  const [showSearchForm, setShowSearchForm] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [chartType, setChartType] = useState<'profitLoss' | 'clv'>('profitLoss');

  // Access control
  useEffect(() => {
    if (!loading && !hasProAccess) {
      router.push('/account');
    }
  }, [loading, hasProAccess, router]);

  // Fetch dropdown options on component mount
  useEffect(() => {
    const fetchDropdownOptions = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        console.log('Fetching dropdown options for user:', user.id);

        // Fetch all bets to populate dropdown options
        const { data: racingBets, error } = await supabase
          .from('racing_bets')
          .select('jockey, track_name, trainer, post_position, horse_number, going, surface, bet_type')
          .eq('user_id', user.id);

        if (error) {
          console.error('Error fetching racing bets:', error);
          return;
        }

        console.log('Fetched racing bets:', racingBets?.length || 0, 'records');

        if (!racingBets || racingBets.length === 0) {
          console.log('No racing bets found for user');
          return;
        }

        // Helper function to split multiple values and extract unique options
        const extractOptions = (values: (string | null)[], splitChar = ' / ') => {
          const allValues: string[] = [];
          values.forEach(value => {
            if (value) {
              if (value.includes(splitChar)) {
                // Handle multiples - split by ' / ' and add each part
                value.split(splitChar).forEach(part => {
                  const trimmed = part.trim();
                  if (trimmed) allValues.push(trimmed);
                });
              } else {
                // Single value
                allValues.push(value);
              }
            }
          });
          return Array.from(new Set(allValues)).sort();
        };

        // Extract unique values for dropdown options, handling multiples
        const options = {
          jockeys: extractOptions(racingBets.map(bet => bet.jockey)),
          tracks: extractOptions(racingBets.map(bet => bet.track_name)),
          trainers: extractOptions(racingBets.map(bet => bet.trainer)),
          postPositions: extractOptions(racingBets.map(bet => bet.post_position)).sort((a, b) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            return isNaN(numA) || isNaN(numB) ? a.localeCompare(b) : numA - numB;
          }),
          horseNumbers: extractOptions(racingBets.map(bet => bet.horse_number)).sort((a, b) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            return isNaN(numA) || isNaN(numB) ? a.localeCompare(b) : numA - numB;
          }),
          goings: extractOptions(racingBets.map(bet => bet.going)),
          surfaces: extractOptions(racingBets.map(bet => bet.surface)),
          betTypes: Array.from(new Set(racingBets.map(bet => bet.bet_type).filter(Boolean))).sort().map(type => 
            type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
          ) as string[],
        };

        console.log('Dropdown options created:', {
          jockeys: options.jockeys.length,
          tracks: options.tracks.length,
          trainers: options.trainers.length,
          postPositions: options.postPositions.length,
          horseNumbers: options.horseNumbers.length,
          goings: options.goings.length,
          surfaces: options.surfaces.length,
          betTypes: options.betTypes.length
        });

        setDropdownOptions(options);
      } catch (error) {
        console.error('Error in fetchDropdownOptions:', error);
      }
    };

    fetchDropdownOptions();
  }, []);

  const calculateStats = (bets: any[]) => {
    const totalStaked = bets.reduce((sum, bet) => sum + (parseFloat(bet.stake) || 0), 0);
    const totalReturned = bets.reduce((sum, bet) => sum + (parseFloat(bet.returns) || 0), 0);
    const profitLoss = totalReturned - totalStaked;
    const winningBets = bets.filter(bet => (parseFloat(bet.profit_loss) || 0) > 0).length;
    const strikeRate = bets.length > 0 ? (winningBets / bets.length) * 100 : 0;
    const roi = totalStaked > 0 ? (profitLoss / totalStaked) * 100 : 0;
    const averageOdds = bets.length > 0 ? bets.reduce((sum, bet) => sum + (parseFloat(bet.odds) || 0), 0) / bets.length : 0;
    const totalCLV = bets.reduce((sum, bet) => sum + (parseFloat(bet.closing_line_value) || 0), 0);
    const averageCLV = bets.length > 0 ? totalCLV / bets.length : 0;

    return {
      numberOfBets: bets.length,
      averageOdds: parseFloat(averageOdds.toFixed(2)),
      totalStaked: parseFloat(totalStaked.toFixed(2)),
      totalReturned: parseFloat(totalReturned.toFixed(2)),
      profitLoss: parseFloat(profitLoss.toFixed(2)),
      strikeRate: parseFloat(strikeRate.toFixed(2)),
      roi: parseFloat(roi.toFixed(2)),
      totalCLV: parseFloat(totalCLV.toFixed(2)),
      averageCLV: parseFloat(averageCLV.toFixed(2)),
    };
  };

  const calculateBSPStats = (bets: any[]) => {
    // Filter bets that have valid closing_odds data (not null, empty, or '?')
    const bspBets = bets.filter(bet => {
      const closingOdds = bet.closing_odds;
      return closingOdds && 
             closingOdds !== null && 
             closingOdds !== '' && 
             closingOdds !== '?' && 
             !isNaN(parseFloat(closingOdds));
    });
    
    if (bspBets.length === 0) {
      return {
        numberOfBets: 0,
        averageOdds: 0,
        totalStaked: 0,
        totalReturned: 0,
        profitLoss: 0,
        strikeRate: 0,
        roi: 0,
        totalCLV: 0,
        averageCLV: 0,
      };
    }
    
    const totalStaked = bspBets.reduce((sum, bet) => sum + (parseFloat(bet.stake) || 0), 0);
    const totalReturned = bspBets.reduce((sum, bet) => {
      const closingOdds = parseFloat(bet.closing_odds);
      const stake = parseFloat(bet.stake) || 0;
      const profitLoss = parseFloat(bet.profit_loss) || 0;
      return sum + (profitLoss > 0 ? (stake * closingOdds) : 0);
    }, 0);
    const profitLoss = totalReturned - totalStaked;
    const winningBets = bspBets.filter(bet => (parseFloat(bet.profit_loss) || 0) > 0).length;
    const strikeRate = bspBets.length > 0 ? (winningBets / bspBets.length) * 100 : 0;
    const roi = totalStaked > 0 ? (profitLoss / totalStaked) * 100 : 0;
    const averageOdds = bspBets.length > 0 ? bspBets.reduce((sum, bet) => sum + (parseFloat(bet.closing_odds) || 0), 0) / bspBets.length : 0;
    const totalCLV = bspBets.reduce((sum, bet) => sum + (parseFloat(bet.closing_line_value) || 0), 0);
    const averageCLV = bspBets.length > 0 ? totalCLV / bspBets.length : 0;

    return {
      numberOfBets: bspBets.length,
      averageOdds: parseFloat(averageOdds.toFixed(2)),
      totalStaked: parseFloat(totalStaked.toFixed(2)),
      totalReturned: parseFloat(totalReturned.toFixed(2)),
      profitLoss: parseFloat(profitLoss.toFixed(2)),
      strikeRate: parseFloat(strikeRate.toFixed(2)),
      roi: parseFloat(roi.toFixed(2)),
      totalCLV: parseFloat(totalCLV.toFixed(2)),
      averageCLV: parseFloat(averageCLV.toFixed(2)),
    };
  };

  const calculateBestOddsStats = (bets: any[]) => {
    // Filter bets that have valid best_odds data (not null, empty, or '?')
    const bestOddsBets = bets.filter(bet => {
      const bestOdds = bet.best_odds;
      return bestOdds && 
             bestOdds !== null && 
             bestOdds !== '' && 
             bestOdds !== '?' && 
             !isNaN(parseFloat(bestOdds));
    });
    
    if (bestOddsBets.length === 0) {
      return {
        numberOfBets: 0,
        averageOdds: 0,
        totalStaked: 0,
        totalReturned: 0,
        profitLoss: 0,
        strikeRate: 0,
        roi: 0,
        totalCLV: 0,
        averageCLV: 0,
      };
    }
    
    const totalStaked = bestOddsBets.reduce((sum, bet) => sum + (parseFloat(bet.stake) || 0), 0);
    const totalReturned = bestOddsBets.reduce((sum, bet) => {
      const bestOdds = parseFloat(bet.best_odds);
      const stake = parseFloat(bet.stake) || 0;
      const profitLoss = parseFloat(bet.profit_loss) || 0;
      return sum + (profitLoss > 0 ? (stake * bestOdds) : 0);
    }, 0);
    const profitLoss = totalReturned - totalStaked;
    const winningBets = bestOddsBets.filter(bet => (parseFloat(bet.profit_loss) || 0) > 0).length;
    const strikeRate = bestOddsBets.length > 0 ? (winningBets / bestOddsBets.length) * 100 : 0;
    const roi = totalStaked > 0 ? (profitLoss / totalStaked) * 100 : 0;
    const averageOdds = bestOddsBets.length > 0 ? bestOddsBets.reduce((sum, bet) => sum + (parseFloat(bet.best_odds) || 0), 0) / bestOddsBets.length : 0;
    const totalCLV = bestOddsBets.reduce((sum, bet) => sum + (parseFloat(bet.closing_line_value) || 0), 0);
    const averageCLV = bestOddsBets.length > 0 ? totalCLV / bestOddsBets.length : 0;

    return {
      numberOfBets: bestOddsBets.length,
      averageOdds: parseFloat(averageOdds.toFixed(2)),
      totalStaked: parseFloat(totalStaked.toFixed(2)),
      totalReturned: parseFloat(totalReturned.toFixed(2)),
      profitLoss: parseFloat(profitLoss.toFixed(2)),
      strikeRate: parseFloat(strikeRate.toFixed(2)),
      roi: parseFloat(roi.toFixed(2)),
      totalCLV: parseFloat(totalCLV.toFixed(2)),
      averageCLV: parseFloat(averageCLV.toFixed(2)),
    };
  };

  const handleSearch = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setSearchLoading(true);
      
      let query = supabase
        .from('racing_bets')
        .select('*')
        .eq('user_id', user.id);

      // Apply date filters
      if (filters.dateFrom) {
        query = query.gte('race_date', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('race_date', filters.dateTo);
      }

      // Apply odds filters
      if (filters.oddsFrom) {
        query = query.gte('odds', parseFloat(filters.oddsFrom));
      }
      if (filters.oddsTo) {
        query = query.lte('odds', parseFloat(filters.oddsTo));
      }

      const { data: bets, error } = await query;

      if (error) {
        console.error('Error searching bets:', error);
        return;
      }

      console.log('Found bets before filtering:', bets?.length || 0);
      
      if (!bets) {
        setFilteredBets([]);
        setStats(null);
        return;
      }

      // Helper function to check if a multiple value matches any selected filters
      const matchesMultipleFilter = (value: string | null, selectedValues: string[]) => {
        if (!value || selectedValues.length === 0) return true;
        
        // If it's a multiple (contains ' / '), check if any part matches
        if (value.includes(' / ')) {
          const parts = value.split(' / ').map(part => part.trim());
          return parts.some(part => selectedValues.includes(part));
        }
        
        // Single value
        return selectedValues.includes(value);
      };

      // Filter bets based on dropdown selections (handling multiples)
      let filteredBets = bets.filter(bet => {
        // Bet type filter (case insensitive)
        if (filters.selectedBetTypes.length > 0) {
          const betTypeMatches = filters.selectedBetTypes.some(selectedType => 
            selectedType.toLowerCase() === bet.bet_type?.toLowerCase()
          );
          if (!betTypeMatches) return false;
        }

        // Multiple-aware filters
        if (!matchesMultipleFilter(bet.jockey, filters.selectedJockeys)) return false;
        if (!matchesMultipleFilter(bet.track_name, filters.selectedTracks)) return false;
        if (!matchesMultipleFilter(bet.trainer, filters.selectedTrainers)) return false;
        if (!matchesMultipleFilter(bet.post_position, filters.selectedPostPositions)) return false;
        if (!matchesMultipleFilter(bet.horse_number, filters.selectedHorseNumbers)) return false;
        if (!matchesMultipleFilter(bet.going, filters.selectedGoings)) return false;
        if (!matchesMultipleFilter(bet.surface, filters.selectedSurfaces)) return false;

        return true;
      });

      console.log('Found bets after filtering:', filteredBets.length);
      setFilteredBets(filteredBets);
      
      // Calculate stats
      const calculatedStats = calculateStats(filteredBets);
      setStats(calculatedStats);
      
      // Calculate BSP stats
      const calculatedBspStats = calculateBSPStats(filteredBets);
      setBspStats(calculatedBspStats);
      
      // Calculate Best Odds stats
      const calculatedBestOddsStats = calculateBestOddsStats(filteredBets);
      setBestOddsStats(calculatedBestOddsStats);
      
      setShowSearchForm(false);
    } catch (error) {
      console.error('Error in handleSearch:', error);
    } finally {
      setSearchLoading(false);
    }
  };

  const resetFilters = () => {
    setFilters({
      dateFrom: '',
      dateTo: '',
      oddsFrom: '',
      oddsTo: '',
      selectedJockeys: [],
      selectedTracks: [],
      selectedTrainers: [],
      selectedPostPositions: [],
      selectedHorseNumbers: [],
      selectedGoings: [],
      selectedSurfaces: [],
      selectedBetTypes: [],
    });
    setFilteredBets([]);
    setStats(null);
    setBspStats(null);
    setBestOddsStats(null);
    setShowSearchForm(true);
  };

  const generateChartData = () => {
    if (!filteredBets.length) return null;

    const sortedBets = [...filteredBets].sort((a, b) => new Date(a.race_date).getTime() - new Date(b.race_date).getTime());
    
    let runningTotal = 0;
    const labels: string[] = [];
    const dataPoints: number[] = [];

    sortedBets.forEach((bet, index) => {
      if (chartType === 'profitLoss') {
        runningTotal += parseFloat(bet.profit_loss) || 0;
      } else {
        runningTotal += parseFloat(bet.closing_line_value) || 0;
      }
      
      labels.push(`Bet ${index + 1}`);
      dataPoints.push(runningTotal);
    });

    return {
      labels,
      datasets: [
        {
          label: chartType === 'profitLoss' ? 'Cumulative P/L' : 'Cumulative CLV',
          data: dataPoints,
          borderColor: chartType === 'profitLoss' ? 
            (runningTotal >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)') :
            'rgb(59, 130, 246)',
          backgroundColor: chartType === 'profitLoss' ? 
            (runningTotal >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)') :
            'rgba(59, 130, 246, 0.1)',
          borderWidth: 2,
          fill: true,
        },
      ],
    };
  };

  if (loading) {
    return <DashboardLayout><div className="text-white">Loading...</div></DashboardLayout>;
  }

  if (!hasProAccess) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-betting-dark text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-betting-green mb-2">Pro Analytics</h1>
              <p className="text-gray-400">Advanced bet search and analysis tools</p>
            </div>
            <TrendingUp className="w-8 h-8 text-betting-green" />
          </div>

          {showSearchForm ? (
            <div className="bg-betting-dark border border-betting-green/20 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Search className="w-5 h-5 mr-2 text-betting-green" />
                Search Your Bets
              </h2>
              
              <p className="text-gray-400 text-sm mb-6">
                Sections left empty will include all bets
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Date Range */}
                <div className="space-y-4">
                  <h3 className="font-medium text-betting-green">Date Range</h3>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                      className="w-full bg-betting-dark border border-betting-green/20 rounded-lg px-3 py-2 text-white"
                      placeholder="From Date"
                    />
                    <input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                      className="w-full bg-betting-dark border border-betting-green/20 rounded-lg px-3 py-2 text-white"
                      placeholder="To Date"
                    />
                  </div>
                </div>

                {/* Odds Range */}
                <div className="space-y-4">
                  <h3 className="font-medium text-betting-green">Odds Range</h3>
                  <div className="space-y-2">
                    <input
                      type="number"
                      step="0.1"
                      value={filters.oddsFrom}
                      onChange={(e) => setFilters({...filters, oddsFrom: e.target.value})}
                      className="w-full bg-betting-dark border border-betting-green/20 rounded-lg px-3 py-2 text-white"
                      placeholder="2.0"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={filters.oddsTo}
                      onChange={(e) => setFilters({...filters, oddsTo: e.target.value})}
                      className="w-full bg-betting-dark border border-betting-green/20 rounded-lg px-3 py-2 text-white"
                      placeholder="3.0"
                    />
                  </div>
                </div>

                {/* Jockey */}
                <div className="space-y-4">
                  <h3 className="font-medium text-betting-green">Jockey</h3>
                  <MultiSelect
                    options={dropdownOptions.jockeys}
                    selectedValues={filters.selectedJockeys}
                    onSelectionChange={(values) => setFilters({...filters, selectedJockeys: values})}
                    placeholder="If nothing selected, all will apply"
                  />
                </div>

                {/* Track */}
                <div className="space-y-4">
                  <h3 className="font-medium text-betting-green">Track</h3>
                  <MultiSelect
                    options={dropdownOptions.tracks}
                    selectedValues={filters.selectedTracks}
                    onSelectionChange={(values) => setFilters({...filters, selectedTracks: values})}
                    placeholder="If nothing selected, all will apply"
                  />
                </div>

                {/* Trainer */}
                <div className="space-y-4">
                  <h3 className="font-medium text-betting-green">Trainer</h3>
                  <MultiSelect
                    options={dropdownOptions.trainers}
                    selectedValues={filters.selectedTrainers}
                    onSelectionChange={(values) => setFilters({...filters, selectedTrainers: values})}
                    placeholder="If nothing selected, all will apply"
                  />
                </div>

                {/* Post Position */}
                <div className="space-y-4">
                  <h3 className="font-medium text-betting-green">Post Position</h3>
                  <MultiSelect
                    options={dropdownOptions.postPositions}
                    selectedValues={filters.selectedPostPositions}
                    onSelectionChange={(values) => setFilters({...filters, selectedPostPositions: values})}
                    placeholder="If nothing selected, all will apply"
                  />
                </div>

                {/* Horse Number */}
                <div className="space-y-4">
                  <h3 className="font-medium text-betting-green">Number / Ranking</h3>
                  <MultiSelect
                    options={dropdownOptions.horseNumbers}
                    selectedValues={filters.selectedHorseNumbers}
                    onSelectionChange={(values) => setFilters({...filters, selectedHorseNumbers: values})}
                    placeholder="If nothing selected, all will apply"
                  />
                </div>

                {/* Going */}
                <div className="space-y-4">
                  <h3 className="font-medium text-betting-green">Going</h3>
                  <MultiSelect
                    options={dropdownOptions.goings}
                    selectedValues={filters.selectedGoings}
                    onSelectionChange={(values) => setFilters({...filters, selectedGoings: values})}
                    placeholder="If nothing selected, all will apply"
                  />
                </div>

                {/* Surface */}
                <div className="space-y-4">
                  <h3 className="font-medium text-betting-green">Surface</h3>
                  <MultiSelect
                    options={dropdownOptions.surfaces}
                    selectedValues={filters.selectedSurfaces}
                    onSelectionChange={(values) => setFilters({...filters, selectedSurfaces: values})}
                    placeholder="If nothing selected, all will apply"
                  />
                </div>

                {/* Bet Type */}
                <div className="space-y-4">
                  <h3 className="font-medium text-betting-green">Bet Type</h3>
                  <MultiSelect
                    options={dropdownOptions.betTypes}
                    selectedValues={filters.selectedBetTypes}
                    onSelectionChange={(values) => setFilters({...filters, selectedBetTypes: values})}
                    placeholder="If nothing selected, all will apply"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={handleSearch}
                  disabled={searchLoading}
                  className="flex items-center px-6 py-3 bg-betting-green hover:bg-betting-green/80 text-black font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Search className="w-4 h-4 mr-2" />
                  {searchLoading ? 'Searching...' : 'Search Bets'}
                </button>
                
                <button
                  onClick={resetFilters}
                  className="flex items-center px-6 py-3 bg-gray-600 hover:bg-gray-500 text-white font-medium rounded-lg transition-colors"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Reset Filters
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Search Again Button */}
              <button
                onClick={() => setShowSearchForm(true)}
                className="flex items-center px-4 py-2 bg-betting-green hover:bg-betting-green/80 text-black font-medium rounded-lg transition-colors"
              >
                <Search className="w-4 h-4 mr-2" />
                Search Again
              </button>

              {/* Stats Box */}
              {stats && (
                <div className="bg-betting-dark border border-betting-green/20 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">Search Results</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-betting-green">{stats.numberOfBets}</div>
                      <div className="text-sm text-gray-400">Number of Bets</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{stats.averageOdds}</div>
                      <div className="text-sm text-gray-400">Average Odds</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{stats.totalStaked}</div>
                      <div className="text-sm text-gray-400">Total Staked</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{stats.totalReturned}</div>
                      <div className="text-sm text-gray-400">Total Returned</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${stats.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {stats.profitLoss}
                      </div>
                      <div className="text-sm text-gray-400">Profit and Loss</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">{stats.strikeRate}%</div>
                      <div className="text-sm text-gray-400">Strike Rate</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${stats.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {stats.roi}%
                      </div>
                      <div className="text-sm text-gray-400">ROI</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{stats.totalCLV}</div>
                      <div className="text-sm text-gray-400">Total CLV</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{stats.averageCLV}</div>
                      <div className="text-sm text-gray-400">Average CLV</div>
                    </div>
                  </div>
                </div>
              )}

              {/* BSP Results Box */}
              {bspStats && (
                <div className="bg-betting-dark border border-betting-green/20 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">Results to BSP</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-betting-green">{bspStats.numberOfBets}</div>
                      <div className="text-sm text-gray-400">Number of Bets</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{bspStats.averageOdds}</div>
                      <div className="text-sm text-gray-400">Average Odds</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{bspStats.totalStaked}</div>
                      <div className="text-sm text-gray-400">Total Staked</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{bspStats.totalReturned}</div>
                      <div className="text-sm text-gray-400">Total Returned</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${bspStats.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {bspStats.profitLoss}
                      </div>
                      <div className="text-sm text-gray-400">Profit and Loss</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">{bspStats.strikeRate}%</div>
                      <div className="text-sm text-gray-400">Strike Rate</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${bspStats.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {bspStats.roi}%
                      </div>
                      <div className="text-sm text-gray-400">ROI</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{bspStats.totalCLV}</div>
                      <div className="text-sm text-gray-400">Total CLV</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{bspStats.averageCLV}</div>
                      <div className="text-sm text-gray-400">Average CLV</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Best Odds Results Box */}
              {bestOddsStats && (
                <div className="bg-betting-dark border border-betting-green/20 rounded-lg p-6">
                  <h3 className="text-xl font-semibold mb-4">Results to Best Odds</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-betting-green">{bestOddsStats.numberOfBets}</div>
                      <div className="text-sm text-gray-400">Number of Bets</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-white">{bestOddsStats.averageOdds}</div>
                      <div className="text-sm text-gray-400">Average Odds</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">{bestOddsStats.totalStaked}</div>
                      <div className="text-sm text-gray-400">Total Staked</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{bestOddsStats.totalReturned}</div>
                      <div className="text-sm text-gray-400">Total Returned</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${bestOddsStats.profitLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {bestOddsStats.profitLoss}
                      </div>
                      <div className="text-sm text-gray-400">Profit and Loss</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">{bestOddsStats.strikeRate}%</div>
                      <div className="text-sm text-gray-400">Strike Rate</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${bestOddsStats.roi >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {bestOddsStats.roi}%
                      </div>
                      <div className="text-sm text-gray-400">ROI</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{bestOddsStats.totalCLV}</div>
                      <div className="text-sm text-gray-400">Total CLV</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">{bestOddsStats.averageCLV}</div>
                      <div className="text-sm text-gray-400">Average CLV</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Chart */}
              {filteredBets.length > 0 && (
                <div className="bg-betting-dark border border-betting-green/20 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold">Bet by Bet Analysis</h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setChartType('profitLoss')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          chartType === 'profitLoss' 
                            ? 'bg-betting-green text-black' 
                            : 'bg-gray-600 text-white hover:bg-gray-500'
                        }`}
                      >
                        P/L Chart
                      </button>
                      <button
                        onClick={() => setChartType('clv')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          chartType === 'clv' 
                            ? 'bg-betting-green text-black' 
                            : 'bg-gray-600 text-white hover:bg-gray-500'
                        }`}
                      >
                        CLV Chart
                      </button>
                    </div>
                  </div>
                  
                  <div className="h-96">
                    {generateChartData() && (
                      <Line 
                        data={generateChartData()!} 
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            title: {
                              display: true,
                              text: chartType === 'profitLoss' ? 'Cumulative Profit/Loss' : 'Cumulative CLV',
                              color: '#ffffff'
                            },
                            legend: {
                              labels: {
                                color: '#ffffff'
                              }
                            }
                          },
                          scales: {
                            x: {
                              ticks: { color: '#ffffff' },
                              grid: { color: 'rgba(255, 255, 255, 0.1)' }
                            },
                            y: {
                              ticks: { color: '#ffffff' },
                              grid: { color: 'rgba(255, 255, 255, 0.1)' }
                            }
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
} 