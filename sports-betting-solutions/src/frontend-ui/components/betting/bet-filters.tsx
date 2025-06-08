'use client';

import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { Search, Filter, X, Calendar, ChevronDown, ChevronUp, Check } from 'lucide-react';
import { useTheme } from '@/components/providers';
import { format, isValid, startOfDay, endOfDay, subMonths } from 'date-fns';
import { DateRange } from 'react-day-picker';

// Define the filter field types
export type FilterField = 'bet_type' | 'bookmaker' | 'model' | 'track_name' | 'horse_name' | 'status';
export type SortField = 'created_at' | 'scheduled_race_time' | 'stake' | 'odds' | 'model' | 'bookmaker' | 'horse_name' | 'track_name' | 'updated_at' | 'race_date' | 'returns' | 'profit_loss';

// Interface for range filters
export interface RangeFilter {
  min: number | null;
  max: number | null;
}

// Interface for date range filter
export interface DateRangeFilter {
  from: Date | null;
  to: Date | null;
}

// Interface for sort configuration
export interface SortConfig {
  field: SortField;
  direction: 'asc' | 'desc';
}

// Interface for active filters
export interface ActiveFilters {
  search: string;
  fields: {
    [key in FilterField]?: string[];
  };
  dateRange: DateRangeFilter;
  ranges: {
    stake?: RangeFilter;
    odds?: RangeFilter;
  };
  sort: SortConfig;
}

// Props for BetFilters component
interface BetFiltersProps {
  onFilterChange: (filters: ActiveFilters) => void;
  onApplyFilters?: (filters: ActiveFilters) => void;
  onResetFilters?: () => void;
  loading?: boolean;
  filterOptions: {
    [key in FilterField]?: string[];
  };
  initialFilters?: {
    search?: string;
    fields?: {
      [key in FilterField]?: string[];
    };
    dateRange?: DateRangeFilter;
    ranges?: {
      stake?: RangeFilter;
      odds?: RangeFilter;
    };
    sort?: SortConfig;
  };
}

// Methods exposed via ref
export interface BetFiltersRef {
  resetFilters: () => void;
  getFilters: () => ActiveFilters;
  applyFilters: (filters: ActiveFilters) => void;
}

const BetFilters = forwardRef<BetFiltersRef, BetFiltersProps>(({ 
  onFilterChange, 
  onApplyFilters, 
  onResetFilters, 
  loading = false,
  filterOptions, 
  initialFilters 
}: BetFiltersProps, ref) => {
  // Get theme
  const { theme } = useTheme();
  
  // Theme helper functions
  const getTextColor = () => theme === 'dark' || theme === 'racing' ? 'text-white' : 'text-gray-900';
  const getMutedTextColor = () => theme === 'dark' ? 'text-gray-400' : theme === 'racing' ? 'text-gray-300' : 'text-gray-500';
  const getButtonBg = () => theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : theme === 'racing' ? 'bg-charcoal-700 hover:bg-charcoal-600' : 'bg-white hover:bg-gray-50';
  const getInputBg = () => theme === 'dark' ? 'bg-gray-700 border-gray-600' : theme === 'racing' ? 'bg-charcoal-700 border-charcoal-600' : 'bg-white border-gray-300';
  const getBorderColor = () => theme === 'dark' ? 'border-gray-700' : theme === 'racing' ? 'border-charcoal-700' : 'border-gray-200';
  const getDropdownBg = () => theme === 'dark' ? 'bg-gray-800 border-gray-700' : theme === 'racing' ? 'bg-charcoal-800 border-charcoal-700' : 'bg-white border-gray-200';
  const getDropdownHoverBg = () => theme === 'dark' ? 'hover:bg-gray-700' : theme === 'racing' ? 'hover:bg-charcoal-700' : 'hover:bg-gray-100';
  const getActiveDropdownItem = () => theme === 'racing' ? 'bg-racing-900 text-racing-300' : theme === 'dark' ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-700';
  const getAccentColor = () => theme === 'racing' ? 'text-racing-500' : 'text-blue-500';
  const getAccentBgColor = () => theme === 'racing' ? 'bg-racing-500' : 'bg-blue-500';
  
  // Helper function to safely check if a value exists in a field filter array
  const isValueInFieldFilter = (field: FilterField, value: string): boolean => {
    const values = fieldFilters[field];
    return values ? values.includes(value) : false;
  };
  
  // State for search
  const [searchQuery, setSearchQuery] = useState(initialFilters?.search || '');
  
  // State for dropdowns
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [activeFilterSection, setActiveFilterSection] = useState<string | null>(null);
  
  // State for sorting
  const [sortConfig, setSortConfig] = useState<SortConfig>(
    initialFilters?.sort || { field: 'created_at', direction: 'desc' }
  );
  
  // State for field filters
  const [fieldFilters, setFieldFilters] = useState<{[key in FilterField]?: string[]}>(
    initialFilters?.fields || {}
  );

  // State for date range - default to show all bets (no date restriction)
  const [dateRange, setDateRange] = useState<DateRangeFilter>(
    initialFilters?.dateRange || { from: null, to: null }
  );
  
  // State for range filters
  const [stakeRange, setStakeRange] = useState<RangeFilter>(
    initialFilters?.ranges?.stake || { min: null, max: null }
  );
  const [oddsRange, setOddsRange] = useState<RangeFilter>(
    initialFilters?.ranges?.odds || { min: null, max: null }
  );
  
  // Refs for dropdown menus to handle clicks outside
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const filterMenuRef = useRef<HTMLDivElement>(null);
  const datePickerRef = useRef<HTMLDivElement>(null);
  
  // Sorting options
  const sortOptions: { label: string; value: SortField }[] = [
    { label: 'Created Date', value: 'created_at' },
    { label: 'Updated Date', value: 'updated_at' },
    { label: 'Race Date', value: 'race_date' },
    { label: 'Race Time', value: 'scheduled_race_time' },
    { label: 'Stake', value: 'stake' },
    { label: 'Odds', value: 'odds' },
    { label: 'Returns', value: 'returns' },
    { label: 'Profit/Loss', value: 'profit_loss' },
    { label: 'Model', value: 'model' },
    { label: 'Bookmaker', value: 'bookmaker' },
    { label: 'Horse', value: 'horse_name' },
    { label: 'Track', value: 'track_name' },
  ];
  
  // Labels for filter fields
  const filterLabels: { [key in FilterField]: string } = {
    bet_type: 'Bet Type',
    bookmaker: 'Bookmaker',
    model: 'Model',
    track_name: 'Track',
    horse_name: 'Horse',
    status: 'Status'
  };

  // Date range presets
  const dateRangePresets = [
    { label: 'All Time', range: { from: null, to: null } },
    { label: 'Last 7 Days', range: { from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), to: new Date() } },
    { label: 'Last 30 Days', range: { from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), to: new Date() } },
    { label: 'This Month', range: { from: new Date(new Date().setDate(1)), to: new Date() } },
    { label: 'Last Month', range: { from: new Date(new Date(new Date().setMonth(new Date().getMonth() - 1)).setDate(1)), to: new Date(new Date(new Date().setDate(0))) } },
  ];
  
  // Handle clicks outside dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
      if (filterMenuRef.current && !filterMenuRef.current.contains(event.target as Node)) {
        setIsFilterMenuOpen(false);
      }
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Update filters when any filter state changes
  useEffect(() => {
    const activeFilters: ActiveFilters = {
      search: searchQuery,
      fields: fieldFilters,
      dateRange: dateRange,
      ranges: {
        stake: stakeRange,
        odds: oddsRange
      },
      sort: sortConfig
    };
    
    onFilterChange(activeFilters);
  }, [searchQuery, fieldFilters, dateRange, stakeRange, oddsRange, sortConfig, onFilterChange]);
  
  // Handle sort selection
  const handleSortChange = (field: SortField) => {
    setSortConfig(prev => {
      // If clicking the same field, toggle direction
      if (prev.field === field) {
        return { field, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      // Otherwise, set new field with default direction
      // Use 'asc' for time-based fields, 'desc' for numerical
      const defaultDir = ['stake', 'odds', 'returns', 'profit_loss'].includes(field) ? 'desc' : 'asc';
      return { field, direction: defaultDir };
    });
    setIsSortMenuOpen(false);
  };
  
  // Handle field filter selection
  const handleFieldFilterChange = (field: FilterField, value: string) => {
    setFieldFilters(prev => {
      const currentValues = prev[field] || [];
      // Toggle the value
      if (currentValues.includes(value)) {
        return {
          ...prev,
          [field]: currentValues.filter(v => v !== value)
        };
      } else {
        return {
          ...prev,
          [field]: [...currentValues, value]
        };
      }
    });
  };

  // Handle date range selection
  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (!range) {
      setDateRange({ from: null, to: null });
      return;
    }
    
    setDateRange({
      from: range.from ? startOfDay(range.from) : null,
      to: range.to ? endOfDay(range.to) : null
    });
  };

  // Handle date range preset selection
  const handleDateRangePreset = (preset: { from: Date | null; to: Date | null }) => {
    setDateRange(preset);
    setIsDatePickerOpen(false);
  };
  
  // Handle range filter changes
  const handleStakeRangeChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setStakeRange(prev => ({
      ...prev,
      [type]: numValue
    }));
  };
  
  const handleOddsRangeChange = (type: 'min' | 'max', value: string) => {
    const numValue = value === '' ? null : parseFloat(value);
    setOddsRange(prev => ({
      ...prev,
      [type]: numValue
    }));
  };
  
  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFieldFilters({});
    setDateRange({ from: null, to: null });
    setStakeRange({ min: null, max: null });
    setOddsRange({ min: null, max: null });
    setSortConfig({ field: 'created_at', direction: 'desc' });
    
    if (onResetFilters) {
      onResetFilters();
    }
  };

  // Toggle filter sections
  const toggleFilterSection = (section: string) => {
    if (activeFilterSection === section) {
      setActiveFilterSection(null);
    } else {
      setActiveFilterSection(section);
    }
  };
  
  // Format date range for display
  const formatDateRange = () => {
    if (!dateRange.from && !dateRange.to) {
      return 'All Time';
    }
    
    if (dateRange.from && !dateRange.to) {
      return `From ${format(dateRange.from, 'MMM d, yyyy')}`;
    }
    
    if (!dateRange.from && dateRange.to) {
      return `Until ${format(dateRange.to, 'MMM d, yyyy')}`;
    }
    
    // Both from and to dates are set
    return `${format(dateRange.from as Date, 'MMM d, yyyy')} - ${format(dateRange.to as Date, 'MMM d, yyyy')}`;
  };
  
  // Count active filters for UI
  const getActiveFilterCount = (): number => {
    let count = 0;
    
    if (searchQuery) count++;
    
    // Count field filters
    if (fieldFilters) {
      Object.values(fieldFilters).forEach(values => {
        if (values && Array.isArray(values) && values.length > 0) count += values.length;
      });
    }
    
    // Count date filter
    if (dateRange && (dateRange.from || dateRange.to)) count++;
    
    // Count range filters
    if (stakeRange && (stakeRange.min !== null || stakeRange.max !== null)) count++;
    if (oddsRange && (oddsRange.min !== null || oddsRange.max !== null)) count++;
    
    return count;
  };
  
  const activeFilterCount = getActiveFilterCount();
  
  // Expose methods to parent via ref
  useImperativeHandle(ref, () => ({
    resetFilters: handleResetFilters,
    getFilters: () => ({
      search: searchQuery,
      fields: fieldFilters,
      dateRange: dateRange,
      ranges: {
        stake: stakeRange,
        odds: oddsRange
      },
      sort: sortConfig
    }),
    applyFilters: (filters: ActiveFilters) => {
      if (filters.search !== undefined) setSearchQuery(filters.search);
      if (filters.fields) setFieldFilters(filters.fields);
      if (filters.dateRange) setDateRange(filters.dateRange);
      if (filters.ranges?.stake) setStakeRange(filters.ranges.stake);
      if (filters.ranges?.odds) setOddsRange(filters.ranges.odds);
      if (filters.sort) setSortConfig(filters.sort);
      
      if (onApplyFilters) {
        onApplyFilters(filters);
      }
    }
  }));
  
  return (
    <div className="w-full font-sans">
      {/* Main filter bar */}
      <div className="relative">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Box */}
          <div className="relative flex-grow">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search size={18} className={getMutedTextColor()} />
            </div>
            <input
              type="text"
              placeholder="Search bets by horse, track, bookmaker..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`block w-full pl-10 pr-3 py-2.5 rounded-lg shadow-sm ${getInputBg()} ${getTextColor()} focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm transition-all duration-200`}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 mr-3 flex items-center"
              >
                <X size={16} className={`${getMutedTextColor()} hover:${getTextColor()} transition-colors duration-200`} />
              </button>
            )}
          </div>
          
          {/* Date Range Picker */}
          <div className="relative" ref={datePickerRef}>
            <button
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className={`flex min-w-[180px] items-center justify-between px-3 py-2.5 rounded-lg shadow-sm ${getButtonBg()} ${getTextColor()} border ${getBorderColor()} transition-all duration-200`}
            >
              <div className="flex items-center">
                <Calendar size={16} className="mr-2" />
                <span className="text-sm truncate max-w-[140px]">{formatDateRange()}</span>
              </div>
              {isDatePickerOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {isDatePickerOpen && (
              <div className={`absolute z-50 mt-2 p-4 rounded-lg shadow-lg ${getDropdownBg()} border ${getBorderColor()} w-[320px] transition-all duration-200`}>
                <div className="mb-4">
                  <h3 className={`text-sm font-medium ${getTextColor()} mb-2`}>Presets</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {dateRangePresets && dateRangePresets.length > 0 && dateRangePresets.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => handleDateRangePreset(preset.range)}
                        className={`px-3 py-1.5 text-xs rounded-md ${getButtonBg()} ${getTextColor()} border ${getBorderColor()} transition-all duration-200`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className={`text-sm font-medium ${getTextColor()} mb-2`}>Custom Range</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={`block text-xs ${getMutedTextColor()} mb-1`}>Start Date</label>
                      <input
                        type="date"
                        value={dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          setDateRange({
                            ...dateRange,
                            from: date ? startOfDay(date) : null
                          });
                        }}
                        className={`w-full px-2 py-1.5 text-sm rounded-md ${getInputBg()} ${getTextColor()} border ${getBorderColor()} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      />
                    </div>
                    <div>
                      <label className={`block text-xs ${getMutedTextColor()} mb-1`}>End Date</label>
                      <input
                        type="date"
                        value={dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''}
                        onChange={(e) => {
                          const date = e.target.value ? new Date(e.target.value) : null;
                          setDateRange({
                            ...dateRange,
                            to: date ? endOfDay(date) : null
                          });
                        }}
                        className={`w-full px-2 py-1.5 text-sm rounded-md ${getInputBg()} ${getTextColor()} border ${getBorderColor()} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <button
                    onClick={() => {
                      setDateRange({ from: null, to: null });
                      setIsDatePickerOpen(false);
                    }}
                    className={`px-3 py-1.5 text-xs font-medium ${getMutedTextColor()} hover:${getTextColor()} transition-colors duration-200`}
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setIsDatePickerOpen(false)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md ${getAccentBgColor()} text-white hover:opacity-90 transition-opacity duration-200`}
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>
          
          {/* Sort Dropdown */}
          <div className="relative" ref={sortMenuRef}>
            <button
              onClick={() => setIsSortMenuOpen(!isSortMenuOpen)}
              className={`flex items-center justify-between min-w-[150px] px-3 py-2.5 rounded-lg shadow-sm ${getButtonBg()} ${getTextColor()} border ${getBorderColor()} transition-all duration-200`}
            >
              <div className="flex items-center">
                <span className="text-sm">Sort: {sortOptions.find(opt => opt.value === sortConfig.field)?.label || 'Created Date'}</span>
              </div>
              {sortConfig.direction === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {isSortMenuOpen && (
              <div className={`absolute z-50 mt-2 rounded-lg shadow-lg ${getDropdownBg()} border ${getBorderColor()} w-[220px] overflow-hidden transition-all duration-200`}>
                <div className="py-1 max-h-[300px] overflow-y-auto">
                  {sortOptions && sortOptions.length > 0 && sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleSortChange(option.value)}
                      className={`flex items-center justify-between w-full px-4 py-2 text-sm ${sortConfig.field === option.value ? getActiveDropdownItem() : `${getTextColor()} ${getDropdownHoverBg()}`} transition-colors duration-200`}
                    >
                      <span>{option.label}</span>
                      {sortConfig.field === option.value && (
                        <span>
                          {sortConfig.direction === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* Filter Button/Panel */}
          <div className="relative" ref={filterMenuRef}>
            <button
              onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
              className={`flex items-center justify-between px-3 py-2.5 rounded-lg shadow-sm ${getButtonBg()} ${getTextColor()} border ${getBorderColor()} ${activeFilterCount > 0 ? 'ring-2 ring-blue-400 dark:ring-blue-700' : ''} transition-all duration-200`}
            >
              <div className="flex items-center">
                <Filter size={16} className="mr-2" />
                <span className="text-sm">Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
              </div>
              {isFilterMenuOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            
            {isFilterMenuOpen && (
              <div className={`absolute right-0 z-50 mt-2 rounded-lg shadow-xl ${getDropdownBg()} border ${getBorderColor()} w-[320px] overflow-hidden transition-all duration-200`}>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className={`font-medium ${getTextColor()}`}>Filters</h3>
                    {activeFilterCount > 0 && (
                      <button
                        onClick={handleResetFilters}
                        className={`text-xs ${getAccentColor()} hover:underline transition-colors duration-200`}
                      >
                        Reset all
                      </button>
                    )}
                  </div>
                  
                  {/* Filter Sections */}
                  <div className="space-y-3">
                    {/* Stakes Range */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                      <button
                        onClick={() => toggleFilterSection('stake')}
                        className={`flex items-center justify-between w-full text-sm font-medium ${getTextColor()} mb-2`}
                      >
                        <span>Stake Range</span>
                        {activeFilterSection === 'stake' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      
                      {activeFilterSection === 'stake' && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center space-x-2">
                            <div className="w-1/2">
                              <label className={`block text-xs ${getMutedTextColor()} mb-1`}>Min ($)</label>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="0"
                                value={stakeRange.min === null ? '' : stakeRange.min}
                                onChange={(e) => handleStakeRangeChange('min', e.target.value)}
                                className={`w-full px-2 py-1.5 text-sm rounded-md ${getInputBg()} ${getTextColor()} border ${getBorderColor()} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                              />
                            </div>
                            <div className="w-1/2">
                              <label className={`block text-xs ${getMutedTextColor()} mb-1`}>Max ($)</label>
                              <input
                                type="number"
                                min="0"
                                step="1"
                                placeholder="Any"
                                value={stakeRange.max === null ? '' : stakeRange.max}
                                onChange={(e) => handleStakeRangeChange('max', e.target.value)}
                                className={`w-full px-2 py-1.5 text-sm rounded-md ${getInputBg()} ${getTextColor()} border ${getBorderColor()} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Odds Range */}
                    <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                      <button
                        onClick={() => toggleFilterSection('odds')}
                        className={`flex items-center justify-between w-full text-sm font-medium ${getTextColor()} mb-2`}
                      >
                        <span>Odds Range</span>
                        {activeFilterSection === 'odds' ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      
                      {activeFilterSection === 'odds' && (
                        <div className="mt-2 space-y-1">
                          <div className="flex items-center space-x-2">
                            <div className="w-1/2">
                              <label className={`block text-xs ${getMutedTextColor()} mb-1`}>Min</label>
                              <input
                                type="number"
                                min="1"
                                step="0.1"
                                placeholder="1.0"
                                value={oddsRange.min === null ? '' : oddsRange.min}
                                onChange={(e) => handleOddsRangeChange('min', e.target.value)}
                                className={`w-full px-2 py-1.5 text-sm rounded-md ${getInputBg()} ${getTextColor()} border ${getBorderColor()} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                              />
                            </div>
                            <div className="w-1/2">
                              <label className={`block text-xs ${getMutedTextColor()} mb-1`}>Max</label>
                              <input
                                type="number"
                                min="1"
                                step="0.1"
                                placeholder="Any"
                                value={oddsRange.max === null ? '' : oddsRange.max}
                                onChange={(e) => handleOddsRangeChange('max', e.target.value)}
                                className={`w-full px-2 py-1.5 text-sm rounded-md ${getInputBg()} ${getTextColor()} border ${getBorderColor()} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Field Filters */}
                    {filterOptions && Object.entries(filterOptions).map(([field, options]) => {
                      if (!options || !Array.isArray(options) || options.length === 0) return null;
                      const typedField = field as FilterField;
                      
                      return (
                        <div key={field} className="border-b border-gray-200 dark:border-gray-700 pb-3 last:border-0">
                          <button
                            onClick={() => toggleFilterSection(field)}
                            className={`flex items-center justify-between w-full text-sm font-medium ${getTextColor()} mb-2`}
                          >
                            <span>
                              {filterLabels[typedField] || field}
                              {fieldFilters[typedField] && fieldFilters[typedField].length > 0 && (
                                <span className={`ml-2 text-xs ${getAccentColor()}`}>
                                  ({fieldFilters[typedField] ? fieldFilters[typedField].length : 0})
                                </span>
                              )}
                            </span>
                            {activeFilterSection === field ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </button>
                          
                          {activeFilterSection === field && (
                            <div className="mt-2 space-y-1 max-h-[150px] overflow-y-auto pr-1">
                              {options && options.length > 0 && options.map(option => (
                                <div key={option} className="flex items-center">
                                  <button
                                    onClick={() => handleFieldFilterChange(typedField, option)}
                                    className="flex items-center w-full py-1 px-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                                  >
                                    <div className={`w-4 h-4 rounded border ${getBorderColor()} flex items-center justify-center mr-2 ${isValueInFieldFilter(typedField, option) ? `${getAccentBgColor()} border-transparent` : getInputBg()}`}>
                                      {isValueInFieldFilter(typedField, option) && (
                                        <Check size={12} className="text-white" />
                                      )}
                                    </div>
                                    <span className={`text-sm ${getTextColor()}`}>{option}</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {searchQuery && (
            <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs ${getButtonBg()} ${getTextColor()} border ${getBorderColor()} transition-all duration-200`}>
              <span className="mr-1.5">Search: <span className="font-medium">{searchQuery}</span></span>
              <button 
                onClick={() => setSearchQuery('')}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
              >
                <X size={12} />
              </button>
            </div>
          )}
          
          {dateRange.from || dateRange.to ? (
            <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs ${getButtonBg()} ${getTextColor()} border ${getBorderColor()} transition-all duration-200`}>
              <span className="mr-1.5">Date: <span className="font-medium">{formatDateRange()}</span></span>
              <button 
                onClick={() => setDateRange({ from: null, to: null })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
              >
                <X size={12} />
              </button>
            </div>
          ) : null}
          
          {Object.entries(fieldFilters).map(([field, values]) => 
            values && Array.isArray(values) && values.length > 0 ? (
              values.map(value => (
                <div 
                  key={`${field}-${value}`} 
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs ${getButtonBg()} ${getTextColor()} border ${getBorderColor()} transition-all duration-200`}
                >
                  <span className="mr-1.5">{filterLabels[field as FilterField] || field}: <span className="font-medium">{value}</span></span>
                  <button 
                    onClick={() => handleFieldFilterChange(field as FilterField, value)}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))
            ) : null
          )}
          
          {(stakeRange.min !== null || stakeRange.max !== null) && (
            <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs ${getButtonBg()} ${getTextColor()} border ${getBorderColor()} transition-all duration-200`}>
              <span className="mr-1.5">Stake: <span className="font-medium">{stakeRange.min !== null ? `$${stakeRange.min}` : '$0'} - {stakeRange.max !== null ? `$${stakeRange.max}` : 'any'}</span></span>
              <button 
                onClick={() => setStakeRange({ min: null, max: null })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
              >
                <X size={12} />
              </button>
            </div>
          )}
          
          {(oddsRange.min !== null || oddsRange.max !== null) && (
            <div className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs ${getButtonBg()} ${getTextColor()} border ${getBorderColor()} transition-all duration-200`}>
              <span className="mr-1.5">Odds: <span className="font-medium">{oddsRange.min !== null ? oddsRange.min : '1.0'} - {oddsRange.max !== null ? oddsRange.max : 'any'}</span></span>
              <button 
                onClick={() => setOddsRange({ min: null, max: null })}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors duration-200"
              >
                <X size={12} />
              </button>
            </div>
          )}
          
          <button 
            onClick={handleResetFilters}
            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs ${getAccentColor()} hover:underline transition-all duration-200`}
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
});

export default BetFilters;