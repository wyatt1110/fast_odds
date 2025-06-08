'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { Check, X, ChevronDown, RefreshCw, ArrowUpDown } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTheme } from '@/components/providers';
import PendingBetCard from '@/frontend-ui/components/betting/bet-card';
import EditBetModal from '@/frontend-ui/components/betting/edit-bet-modal';
import BetFilters, { ActiveFilters, FilterField, SortField, BetFiltersRef } from '@/frontend-ui/components/betting/bet-filters';

export default function SettledBetsPage({ userId }: { userId: string }) {
  const [settledBets, setSettledBets] = useState<any[]>([]);
  const [displayBets, setDisplayBets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBet, setSelectedBet] = useState<any | null>(null);
  const [expandedBetId, setExpandedBetId] = useState<string | null>(null);
  const { theme } = useTheme();
  
  // Create a ref for BetFilters
  const filtersRef = useRef<BetFiltersRef>(null);
  
  // Filter state for BetFilters component
  const [activeFilters, setActiveFilters] = useState<ActiveFilters>({
    search: '',
    fields: {},
    dateRange: { from: null, to: null },
    ranges: {
      stake: { min: null, max: null },
      odds: { min: null, max: null }
    },
    sort: { field: 'created_at', direction: 'desc' }
  });
  
  // Filter options for BetFilters
  const [filterOptions, setFilterOptions] = useState<{[key in FilterField]?: string[]}>({});
  
  // Total calculations
  const totalStake = settledBets.reduce((sum, bet) => sum + parseFloat(bet.stake?.toString() || '0'), 0);
  const totalReturns = settledBets.reduce((sum, bet) => sum + parseFloat(bet.returns?.toString() || '0'), 0);
  const profitLoss = totalReturns - totalStake;

  // Add theme-specific styles
  const getTextColor = () => theme === 'dark' || theme === 'racing' ? 'text-white' : 'text-gray-900';
  const getMutedTextColor = () => theme === 'dark' ? 'text-gray-400' : theme === 'racing' ? 'text-gray-300' : 'text-gray-500';
  const getHeaderBg = () => theme === 'dark' ? 'bg-gray-900' : theme === 'racing' ? 'bg-charcoal-700' : 'bg-slate-100';
  const getCardBg = () => theme === 'dark' ? 'bg-gray-800' : theme === 'racing' ? 'bg-charcoal-800' : 'bg-white';
  const getBorderColor = () => theme === 'dark' ? 'border-gray-700' : theme === 'racing' ? 'border-charcoal-700' : 'border-gray-200';
  const getTableRowHoverBg = () => theme === 'dark' ? 'hover:bg-gray-700' : theme === 'racing' ? 'hover:bg-charcoal-700' : 'hover:bg-gray-50';
  const getInputBg = () => theme === 'dark' ? 'bg-gray-700 border-gray-600' : theme === 'racing' ? 'bg-charcoal-700 border-charcoal-600' : 'bg-white border-gray-300';
  const getInputTextColor = () => theme === 'dark' || theme === 'racing' ? 'text-white' : 'text-gray-700';
  const getButtonBg = () => theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : theme === 'racing' ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700';
  
  // Extract filter options from data
  const extractFilterOptions = (bets: any[]) => {
    const options: {[key in FilterField]?: Set<string>} = {
      status: new Set<string>(),
      bet_type: new Set<string>(),
      bookmaker: new Set<string>(),
      model: new Set<string>(),
      track_name: new Set<string>(),
      horse_name: new Set<string>()
    };
    
    bets.forEach(bet => {
      if (bet.status) options.status?.add(bet.status);
      if (bet.bet_type) options.bet_type?.add(bet.bet_type);
      if (bet.bookmaker) options.bookmaker?.add(bet.bookmaker);
      if (bet.model) options.model?.add(bet.model);
      if (bet.track_name) options.track_name?.add(bet.track_name);
      if (bet.horse_name) options.horse_name?.add(bet.horse_name);
    });
    
    // Convert Sets to arrays
    const convertedOptions: {[key in FilterField]?: string[]} = {};
    
    (Object.entries(options) as [FilterField, Set<string>][]).forEach(([key, values]) => {
      if (values.size > 0) {
        convertedOptions[key] = Array.from(values).sort();
      }
    });
    
    setFilterOptions(convertedOptions);
  };

  // Filter handling with BetFilters component
  const handleFilterChange = (filters: ActiveFilters) => {
    setActiveFilters(filters);
    
    // Apply filters to the displayBets
    let filtered = [...settledBets];
    
    // Apply search filter
    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(bet => 
        (bet.horse_name && bet.horse_name.toLowerCase().includes(query)) ||
        (bet.track_name && bet.track_name.toLowerCase().includes(query)) ||
        (bet.bookmaker && bet.bookmaker.toLowerCase().includes(query)) ||
        (bet.model && bet.model.toLowerCase().includes(query)) ||
        (bet.notes && bet.notes.toLowerCase().includes(query))
      );
    }
    
    // Apply field filters
    Object.entries(filters.fields).forEach(([field, values]) => {
      if (values && values.length > 0) {
        filtered = filtered.filter(bet => 
          values.includes(bet[field as keyof typeof bet] as string)
        );
      }
    });
    
    // Apply stake range filter
    if (filters.ranges.stake) {
      const { min, max } = filters.ranges.stake;
      if (min !== null) {
        filtered = filtered.filter(bet => (bet.stake || 0) >= min);
      }
      if (max !== null) {
        filtered = filtered.filter(bet => (bet.stake || 0) <= max);
      }
    }
    
    // Apply odds range filter
    if (filters.ranges.odds) {
      const { min, max } = filters.ranges.odds;
      if (min !== null) {
        filtered = filtered.filter(bet => (bet.odds || 0) >= min);
      }
      if (max !== null) {
        filtered = filtered.filter(bet => (bet.odds || 0) <= max);
      }
    }
    
    // Apply date range filter
    if (filters.dateRange.from || filters.dateRange.to) {
      filtered = filtered.filter(bet => {
        const betDate = new Date(bet.created_at);
        if (filters.dateRange.from && betDate < filters.dateRange.from) {
          return false;
        }
        if (filters.dateRange.to && betDate > filters.dateRange.to) {
          return false;
        }
        return true;
      });
    }
    
    // Apply sorting
    const field = filters.sort.field;
    const direction = filters.sort.direction;
    
    filtered.sort((a, b) => {
      const aValue = a[field] || '';
      const bValue = b[field] || '';
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return direction === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      if (aValue instanceof Date && bValue instanceof Date) {
        return direction === 'asc' ? aValue.getTime() - bValue.getTime() : bValue.getTime() - aValue.getTime();
      }
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }
      
      return 0;
    });
    
    setDisplayBets(filtered);
  };

  const handleResetFilters = () => {
    if (filtersRef.current) {
      filtersRef.current.resetFilters();
    }
    setDisplayBets(settledBets);
  };

  // Toggle expanded bet row
  const toggleBetExpansion = (betId: string) => {
    if (expandedBetId === betId) {
      setExpandedBetId(null);
    } else {
      setExpandedBetId(betId);
    }
  };

  // Calculate total odds for a multiple bet
  const calculateTotalOdds = (horses: any[]) => {
    if (!horses || horses.length === 0) return 0;
    return horses.reduce((total, horse) => total * parseFloat(horse.odds || 0), 1);
  };

  // Fetch the bets data
  const fetchSettledBets = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'settled');
      
      if (error) throw new Error(error.message);
      
      setSettledBets(data || []);
      setDisplayBets(data || []);
      
      // Extract filter options from data
      extractFilterOptions(data || []);
    } catch (err: any) {
      console.error('Error fetching settled bets:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Initial data fetch
  useEffect(() => {
    fetchSettledBets();
  }, [fetchSettledBets]);

  // Handle refresh
  const handleRefresh = () => {
    fetchSettledBets();
  };

  // Edit bet
  const handleEditBet = (bet: any) => {
    setSelectedBet(bet);
    setIsModalOpen(true);
  };

  const handleOpenForm = () => {
    // Functionality would go here to open a form to add a new bet
    console.log('Opening form to add new bet');
  };

  return (
    <div className={`p-4 ${getCardBg()} rounded-lg shadow`}>
      <h1 className={`text-xl font-bold ${getTextColor()} mb-4`}>All Bets</h1>
      
      {/* Filters Section */}
      <div className={`${getCardBg()} ${getBorderColor()} border rounded-lg p-4 mb-6`}>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className={`block text-sm font-medium ${getMutedTextColor()} mb-1`}>
              Date Range
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="date"
                value={activeFilters.dateRange.from ? format(activeFilters.dateRange.from, 'yyyy-MM-dd') : ''}
                onChange={(e) => handleFilterChange({
                  ...activeFilters,
                  dateRange: { ...activeFilters.dateRange, from: e.target.value ? new Date(e.target.value) : null }
                })}
                className={`${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1`}
              />
              <span className={`${getMutedTextColor()}`}>to</span>
              <input
                type="date"
                value={activeFilters.dateRange.to ? format(activeFilters.dateRange.to, 'yyyy-MM-dd') : ''}
                onChange={(e) => handleFilterChange({
                  ...activeFilters,
                  dateRange: { ...activeFilters.dateRange, to: e.target.value ? new Date(e.target.value) : null }
                })}
                className={`${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1`}
              />
            </div>
          </div>
          
          <div className="flex-1">
            <label className={`block text-sm font-medium ${getMutedTextColor()} mb-1`}>
              Status
            </label>
            <select
              value={activeFilters.fields.status as string || 'all'}
              onChange={(e) => handleFilterChange({
                ...activeFilters,
                fields: { ...activeFilters.fields, status: e.target.value === 'all' ? undefined : e.target.value as string }
              })}
              className={`w-full ${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="all">All</option>
              <option value="win">Win</option>
              <option value="lose">Lose</option>
              <option value="void">Void</option>
            </select>
          </div>
          
          <div className="flex-1">
            <label className={`block text-sm font-medium ${getMutedTextColor()} mb-1`}>
              Bet Type
            </label>
            <select
              value={activeFilters.fields.bet_type as string || 'all'}
              onChange={(e) => handleFilterChange({
                ...activeFilters,
                fields: { ...activeFilters.fields, bet_type: e.target.value === 'all' ? undefined : e.target.value as string }
              })}
              className={`w-full ${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            >
              <option value="all">All</option>
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="treble">Treble</option>
              <option value="4fold">4-Fold</option>
              <option value="5fold">5-Fold</option>
              <option value="trixie">Trixie</option>
              <option value="patent">Patent</option>
              <option value="yankee">Yankee</option>
              <option value="super_yankee">Super Yankee</option>
              <option value="lucky_15">Lucky 15</option>
              <option value="lucky_31">Lucky 31</option>
            </select>
        </div>
          
          <div className="flex-1">
            <label className={`block text-sm font-medium ${getMutedTextColor()} mb-1`}>
              Bookmaker
            </label>
            <input
              type="text"
              value={activeFilters.fields.bookmaker as string || ''}
              onChange={(e) => handleFilterChange({
                ...activeFilters,
                fields: { ...activeFilters.fields, bookmaker: e.target.value }
              })}
              placeholder="Any bookmaker"
              className={`w-full ${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
          
          <div className="flex-1">
            <label className={`block text-sm font-medium ${getMutedTextColor()} mb-1`}>
              Model/Tipster
            </label>
            <input
              type="text"
              value={activeFilters.fields.model as string || ''}
              onChange={(e) => handleFilterChange({
                ...activeFilters,
                fields: { ...activeFilters.fields, model: e.target.value }
              })}
              placeholder="Any model"
              className={`w-full ${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
          
          <div className="flex-1">
            <label className={`block text-sm font-medium ${getMutedTextColor()} mb-1`}>
              Track
            </label>
            <input
              type="text"
              value={activeFilters.fields.track_name as string || ''}
              onChange={(e) => handleFilterChange({
                ...activeFilters,
                fields: { ...activeFilters.fields, track_name: e.target.value }
              })}
              placeholder="Any track"
              className={`w-full ${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
          
          <div className="flex-1">
            <label className={`block text-sm font-medium ${getMutedTextColor()} mb-1`}>
              Horse
            </label>
            <input
              type="text"
              value={activeFilters.fields.horse_name as string || ''}
              onChange={(e) => handleFilterChange({
                ...activeFilters,
                fields: { ...activeFilters.fields, horse_name: e.target.value }
              })}
              placeholder="Any horse"
              className={`w-full ${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>
          
          <div className="flex-1">
            <label className={`block text-sm font-medium ${getMutedTextColor()} mb-1`}>
              Stake Range
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={activeFilters.ranges.stake?.min || ''}
                onChange={(e) => handleFilterChange({
                  ...activeFilters,
                  ranges: { ...activeFilters.ranges, stake: { ...activeFilters.ranges.stake, min: e.target.value ? parseFloat(e.target.value) : null } }
                })}
                className={`${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1`}
              />
              <span className={`${getMutedTextColor()}`}>to</span>
              <input
                type="number"
                value={activeFilters.ranges.stake?.max || ''}
                onChange={(e) => handleFilterChange({
                  ...activeFilters,
                  ranges: { ...activeFilters.ranges, stake: { ...activeFilters.ranges.stake, max: e.target.value ? parseFloat(e.target.value) : null } }
                })}
                className={`${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1`}
              />
                </div>
              </div>
          
          <div className="flex-1">
            <label className={`block text-sm font-medium ${getMutedTextColor()} mb-1`}>
              Odds Range
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="number"
                value={activeFilters.ranges.odds?.min || ''}
                onChange={(e) => handleFilterChange({
                  ...activeFilters,
                  ranges: { ...activeFilters.ranges, odds: { ...activeFilters.ranges.odds, min: e.target.value ? parseFloat(e.target.value) : null } }
                })}
                className={`${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1`}
              />
              <span className={`${getMutedTextColor()}`}>to</span>
              <input
                type="number"
                value={activeFilters.ranges.odds?.max || ''}
                onChange={(e) => handleFilterChange({
                  ...activeFilters,
                  ranges: { ...activeFilters.ranges, odds: { ...activeFilters.ranges.odds, max: e.target.value ? parseFloat(e.target.value) : null } }
                })}
                className={`${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 flex-1`}
              />
            </div>
          </div>
          
          <button
            onClick={() => handleFilterChange(activeFilters)}
            className={`px-4 py-2 ${theme === 'racing' ? 'bg-racing-600 hover:bg-racing-700' : 'bg-blue-600 hover:bg-blue-700'} text-white text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 ${theme === 'racing' ? 'focus:ring-racing-500' : 'focus:ring-blue-500'}`}
          >
            Apply Filters
          </button>
          
          <button
            onClick={handleResetFilters}
            className={`px-4 py-2 ${getButtonBg()} border ${getBorderColor()} text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500`}
          >
            Reset
          </button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className={`${getCardBg()} ${getBorderColor()} border rounded-lg p-4 shadow`}>
          <div className={`text-sm font-medium ${getMutedTextColor()}`}>Total Bets</div>
          <div className={`text-2xl font-bold mt-1 ${getTextColor()}`}>
            {!isLoading ? settledBets.length : '...'}
          </div>
        </div>
        
        <div className={`${getCardBg()} ${getBorderColor()} border rounded-lg p-4 shadow`}>
          <div className={`text-sm font-medium ${getMutedTextColor()}`}>Total Staked</div>
          <div className={`text-2xl font-bold mt-1 ${getTextColor()}`}>
            {!isLoading ? `£${totalStake.toFixed(2)}` : '...'}
          </div>
        </div>
        
        <div className={`${getCardBg()} ${getBorderColor()} border rounded-lg p-4 shadow`}>
          <div className={`text-sm font-medium ${getMutedTextColor()}`}>Total Returns</div>
          <div className={`text-2xl font-bold mt-1 ${getTextColor()}`}>
            {!isLoading ? `£${totalReturns.toFixed(2)}` : '...'}
          </div>
        </div>
        
        <div className={`${getCardBg()} ${getBorderColor()} border rounded-lg p-4 shadow`}>
          <div className={`text-sm font-medium ${getMutedTextColor()}`}>Profit/Loss</div>
          <div className={`text-2xl font-bold mt-1 ${profitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {!isLoading ? `${profitLoss >= 0 ? '+' : ''}£${profitLoss.toFixed(2)}` : '...'}
          </div>
        </div>
      </div>
      
      {/* Bets Table */}
      <div className={`${getCardBg()} ${getBorderColor()} border rounded-lg overflow-hidden`}>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className={getHeaderBg()}>
              <TableRow className={`${getBorderColor()} border-b`}>
                <TableHead className={`${getTextColor()} font-medium w-1/4`}>Date</TableHead>
                <TableHead className={`${getTextColor()} font-medium`}>Bet Details</TableHead>
                <TableHead className={`${getTextColor()} font-medium text-right`}>Stake</TableHead>
                <TableHead className={`${getTextColor()} font-medium text-right`}>Odds</TableHead>
                <TableHead className={`${getTextColor()} font-medium text-right`}>Result</TableHead>
                <TableHead className={`${getTextColor()} font-medium text-right`}>Returns</TableHead>
                <TableHead className={`${getTextColor()} font-medium text-right`}>P/L</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                    <p className={`mt-2 ${getMutedTextColor()}`}>Loading bets...</p>
                  </TableCell>
                </TableRow>
              ) : settledBets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className={getMutedTextColor()}>No bets found matching your filters.</p>
                  </TableCell>
                </TableRow>
              ) : (
                displayBets.map((bet, index) => (
                  <React.Fragment key={bet.bet_id || index}>
                    <TableRow 
                      className={`cursor-pointer ${getTableRowHoverBg()} ${expandedBetId === bet.bet_id ? `${getCardBg()} ${getBorderColor()}` : ''} ${getBorderColor()} border-b`}
                      onClick={() => toggleBetExpansion(bet.bet_id)}
                    >
                      <TableCell className={getTextColor()}>
                        {bet.scheduled_race_time ? format(new Date(bet.scheduled_race_time), 'MMM d, yyyy') : 'Unknown'}
                      </TableCell>
                      <TableCell>
                        <div className={`font-medium ${getTextColor()}`}>
                          {bet.bet_type ? bet.bet_type.charAt(0).toUpperCase() + bet.bet_type.slice(1) : 'Unknown'}
                          {bet.each_way && " (E/W)"}
                        </div>
                        <div className={`text-sm ${getMutedTextColor()}`}>
                          {bet.horse_name} @ {bet.track_name}
                        </div>
                      </TableCell>
                      <TableCell className={`text-right ${getTextColor()}`}>
                        £{bet.stake ? parseFloat(bet.stake).toFixed(2) : '0.00'}
                      </TableCell>
                      <TableCell className={`text-right ${getTextColor()}`}>
                        {bet.odds || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${bet.status === 'win' 
                            ? 'bg-green-100 text-green-800' 
                            : bet.status === 'lose' 
                              ? 'bg-red-100 text-red-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {bet.status === 'win' 
                            ? <Check className="mr-1 h-3 w-3 text-green-500" /> 
                            : bet.status === 'lose' 
                              ? <X className="mr-1 h-3 w-3 text-red-500" /> 
                              : null
                          }
                          {bet.status === 'win' ? 'Win' : bet.status === 'lose' ? 'Lose' : bet.status ? bet.status.charAt(0).toUpperCase() + bet.status.slice(1) : 'Unknown'}
                        </span>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${getTextColor()}`}>
                        £{bet.returns ? parseFloat(bet.returns.toString()).toFixed(2) : '0.00'}
                      </TableCell>
                      <TableCell className={`text-right font-medium ${(bet.profit_loss || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {(bet.profit_loss || 0) >= 0 ? '+' : ''}£{Math.abs(bet.profit_loss || 0).toFixed(2)}
                      </TableCell>
                    </TableRow>
                    
                    {/* Expanded bet details */}
                    {expandedBetId === bet.bet_id && (
                      <TableRow className={`${getCardBg()} ${getBorderColor()} border-b`}>
                        <TableCell colSpan={7} className="p-4">
                          <div className={`${getCardBg()} ${getBorderColor()} border rounded-lg p-4`}>
                            <h3 className={`text-lg font-medium ${getTextColor()} mb-3`}>Bet Details</h3>
                            
                            {/* Horse details section */}
                            <div className="mb-4">
                              <h4 className={`text-sm font-medium ${getMutedTextColor()} mb-2`}>Selections</h4>
                              <div className="space-y-2">
                                {bet.horse_name && (
                                  <div className={`${getBorderColor()} border rounded p-2 flex flex-wrap items-center gap-2`}>
                                    <div className="flex-1">
                                      <div className={`font-medium ${getTextColor()}`}>{bet.horse_name}</div>
                                      <div className={`text-sm ${getMutedTextColor()}`}>
                                        {bet.track_name} {bet.race_number ? `- Race ${bet.race_number}` : ''}
                                        {bet.race_date ? ` (${format(new Date(bet.race_date), 'MMM d, yyyy')})` : ''}
                                      </div>
                                    </div>
                                    <div className={`text-right ${getTextColor()}`}>
                                      <div>Odds: {bet.odds || 'N/A'}</div>
                                      <div className={`text-sm ${bet.status === 'win' ? 'text-green-500' : bet.status === 'lose' ? 'text-red-500' : getMutedTextColor()}`}>
                                        {bet.status 
                                          ? bet.status.charAt(0).toUpperCase() + bet.status.slice(1) 
                                          : 'No result'
                                        }
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Bet information grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                              <div>
                                <h4 className={`text-sm font-medium ${getMutedTextColor()} mb-1`}>Bet Type</h4>
                                <p className={getTextColor()}>
                                  {bet.bet_type ? bet.bet_type.charAt(0).toUpperCase() + bet.bet_type.slice(1) : 'Unknown'}
                                  {bet.each_way && " (Each Way)"}
                                </p>
                              </div>
                              
                              <div>
                                <h4 className={`text-sm font-medium ${getMutedTextColor()} mb-1`}>Bookmaker</h4>
                                <p className={getTextColor()}>{bet.bookmaker || 'Not specified'}</p>
                              </div>
                              
                              <div>
                                <h4 className={`text-sm font-medium ${getMutedTextColor()} mb-1`}>Model/Tipster</h4>
                                <p className={getTextColor()}>{bet.model || 'Not specified'}</p>
                              </div>
                              
                              <div>
                                <h4 className={`text-sm font-medium ${getMutedTextColor()} mb-1`}>Stake</h4>
                                <p className={getTextColor()}>£{bet.stake ? parseFloat(bet.stake).toFixed(2) : '0.00'}</p>
                              </div>
                              
                              <div>
                                <h4 className={`text-sm font-medium ${getMutedTextColor()} mb-1`}>Returns</h4>
                                <p className={getTextColor()}>£{bet.returns ? parseFloat(bet.returns.toString()).toFixed(2) : '0.00'}</p>
                              </div>
                              
                              <div>
                                <h4 className={`text-sm font-medium ${getMutedTextColor()} mb-1`}>Profit/Loss</h4>
                                <p className={(bet.profit_loss || 0) >= 0 ? 'text-green-500' : 'text-red-500'}>
                                  {(bet.profit_loss || 0) >= 0 ? '+' : ''}£{Math.abs(bet.profit_loss || 0).toFixed(2)}
                                </p>
                              </div>
                            </div>
                            
                            {/* Notes section */}
                            {bet.notes && (
                              <div className="mt-4">
                                <h4 className={`text-sm font-medium ${getMutedTextColor()} mb-1`}>Notes</h4>
                                <p className={`${getCardBg()} ${getBorderColor()} border p-2 rounded ${getTextColor()}`}>
                                  {bet.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      
      {/* Modals */}
      {isModalOpen && selectedBet && (
        <EditBetModal
          bet={selectedBet}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveBet}
        />
      )}
    </div>
  );
} 