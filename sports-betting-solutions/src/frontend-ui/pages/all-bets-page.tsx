'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, supabase } from '@/lib/supabase/client';
import BetForm from '@/components/bets/BetForm';
import { RefreshCw, Search, Calendar, ArrowUpDown, X, Plus } from 'lucide-react';
import PendingBetCard from '@/frontend-ui/components/betting/bet-card';
import EditBetModal from '@/frontend-ui/components/betting/edit-bet-modal';
import { useTheme } from '@/components/providers';
import { format } from 'date-fns';
import Link from 'next/link';
import Rule4Modal from '@/frontend-ui/components/betting/rule4-modal';

// Define the structure of a bet record
interface BetRecord {
  id: string; // This is the primary key in the racing_bets table
  bet_id: string; // Alias for id for component consistency
  track_name: string;
  race_number: string | null;
  horse_name: string | null;
  jockey: string | null;
  trainer: string | null;
  race_distance: string | null; 
  race_type: string | null;
  created_at: string;
  user_id: string;
  scheduled_race_time: string | null;
  bet_type: string;
  stake: number;
  odds: number;
  each_way: boolean | null;
  status: string;
  bookmaker: string | null;
  model: string | null;
  notes: string | null;
  updated_at: string;
  returns: number | null;
  profit_loss: number | null;
  race_date: string | null;
  rule_4_deduction: number | null;
  rule_4_adjusted_odds: number | null;
  closing_odds: string | null;
  closing_line_value: number | null;
  horses?: { name: string; race_number?: string; venue?: string; odds: number }[];
}

// Simple filter type
type BetView = 'all' | 'pending' | 'settled';

export default function AllBetsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [allBets, setAllBets] = useState<BetRecord[]>([]);
  const [displayBets, setDisplayBets] = useState<BetRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedBet, setSelectedBet] = useState<BetRecord | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRule4ModalOpen, setIsRule4ModalOpen] = useState(false);
  
  // New simplified filter state
  const [activeView, setActiveView] = useState<BetView>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateSort, setDateSort] = useState<'desc' | 'asc'>('desc');
  
  const router = useRouter();
  const { theme } = useTheme();
  
  // Theme helper functions
  const getTextColor = () => 'text-white';
  const getMutedTextColor = () => 'text-gray-300';
  const getCardBg = () => 'bg-betting-dark border-betting-green/20';
  const getBorderColor = () => 'border-betting-green/20';
  const getPrimaryButtonBg = () => 'bg-betting-green hover:bg-betting-secondary';
  const getLoadingSpinnerColor = () => 'border-betting-green';
  const getInputBg = () => 'bg-betting-dark border-betting-green/20';
  
  // Special title styling
  const getTitleStyle = () => {
    return 'text-white font-bold text-xl';
  };

  // Helper for filter button styles
  const getFilterButtonStyle = (view: BetView) => {
    const isActive = activeView === view;
    if (isActive) {
      return 'bg-betting-green text-white';
    }
    return 'bg-betting-dark border border-betting-green/20 text-gray-300 hover:bg-betting-green/10';
  };

  // Get the current user when component mounts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await getCurrentUser();
        console.log('Current user:', user);
        if (user) {
          setUserId(user.id);
        } else {
          setError('No user found. Please log in.');
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        setError('Failed to get user.');
        setIsLoading(false);
      }
    };

    fetchUser();
  }, []);

  // Fetch bets with filters applied
  const fetchBets = useCallback(async (userId: string | null) => {
    if (!userId) {
      console.log('No userId provided to fetchBets');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching bets for user ${userId} with view: ${activeView}, sort: ${dateSort}`);
      
      // Build the base query
      let query = supabase
        .from('racing_bets' as any)
        .select('*')
        .eq('user_id', userId);
      
      // Apply view-specific filtering
      if (activeView === 'pending') {
        console.log('Applying PENDING filter');
        query = query.ilike('status', '%pending%');
      } else if (activeView === 'settled') {
        console.log('Applying SETTLED filter (not pending)');
        query = query.not('status', 'ilike', '%pending%');
      }
      
      // Apply sorting - primary sort by date
      const sortField = 'created_at';
      const { data, error } = await query
        .order(sortField, { ascending: dateSort === 'asc' });
      
      if (error) {
        console.error("Error fetching bets:", error);
        throw new Error(error.message);
      }
      
      console.log(`Fetched ${data?.length || 0} bets`);
      
      // Map the data to our BetRecord interface with safe date handling
      const formattedData = (data || []).map((bet: any) => {
        // Sanitize date fields to prevent Invalid time value errors
        const sanitized = {...bet};
        
        // Handle potentially invalid date fields
        if (sanitized.scheduled_race_time && !isValidDate(sanitized.scheduled_race_time)) {
          console.warn(`Invalid scheduled_race_time found: ${sanitized.scheduled_race_time}`);
          sanitized.scheduled_race_time = null;
        }
        
        if (sanitized.race_date && !isValidDate(sanitized.race_date)) {
          console.warn(`Invalid race_date found: ${sanitized.race_date}`);
          sanitized.race_date = null;
        }
        
        return {
          ...sanitized,
          bet_id: sanitized.id // Map id to bet_id for component consistency
        };
      });
      
      setAllBets(formattedData);
      
      // Apply search filter if needed
      if (searchQuery) {
        const filtered = formattedData.filter(bet => 
          bet.horse_name && bet.horse_name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        setDisplayBets(filtered);
      } else {
        setDisplayBets(formattedData);
      }
    } catch (err) {
      console.error("Error in fetchBets:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch bets");
      setAllBets([]);
      setDisplayBets([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeView, dateSort, searchQuery]);

  // Helper function to validate date strings
  const isValidDate = (dateString: string): boolean => {
    if (!dateString) return false;
    
    const timestamp = Date.parse(dateString);
    return !isNaN(timestamp);
  };

  // Fetch bets when userId changes or when filters/refresh are triggered
  useEffect(() => {
    if (userId) {
      fetchBets(userId);
    }
  }, [userId, fetchBets, refreshTrigger]);

  // Apply search filter
  useEffect(() => {
    if (!searchQuery) {
      setDisplayBets(allBets);
      return;
    }
    
    const filtered = allBets.filter(bet => 
      bet.horse_name && bet.horse_name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setDisplayBets(filtered);
  }, [searchQuery, allBets]);
  
  // Handle filter view change
  const handleViewChange = (view: BetView) => {
    if (view === activeView) return;
    setActiveView(view);
  };
  
  // Toggle date sort
  const toggleDateSort = () => {
    setDateSort(prev => prev === 'desc' ? 'asc' : 'desc');
  };
  
  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  // Handle bet form open/close
  const handleOpenForm = () => setIsFormOpen(true);
  const handleCloseForm = () => setIsFormOpen(false);

  // Handle bet saving and triggering a refresh
  const handleBetSaved = () => {
    setIsFormOpen(false);
    setRefreshTrigger(prev => prev + 1);
  };
  
  // Handle manual refresh
  const handleRefresh = () => setRefreshTrigger(prev => prev + 1);
  
  // Handle edit bet
  const handleEditBet = (bet: BetRecord) => {
    setSelectedBet(bet);
    setIsEditModalOpen(true);
  };

  // Handle Rule 4 modal
  const handleRule4 = (bet: BetRecord) => {
    setSelectedBet(bet);
    setIsRule4ModalOpen(true);
  };

  // Loading spinner
  const LoadingSpinner = () => (
    <div className="flex items-center justify-center py-12">
      <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${getLoadingSpinnerColor()}`}></div>
    </div>
  );

  const renderBets = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-10">
          <p className="text-red-500 mb-4">{error}</p>
          <button 
            onClick={handleRefresh}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      );
    }

    if (!displayBets || displayBets.length === 0) {
      return (
        <div className="text-center py-10">
          <p className="text-gray-500 mb-4">No bets found</p>
          <button 
            onClick={handleOpenForm}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add Bet
          </button>
        </div>
      );
    }

    return (
      <div 
        className="grid gap-4 w-full" 
        style={{ 
          gridTemplateColumns: 'repeat(auto-fill, minmax(288px, 1fr))',
          gridAutoRows: 'auto'
        }}
      >
        {displayBets.map(bet => (
          <div key={bet.bet_id} className="flex justify-center">
            <PendingBetCard 
              bet={{
                ...bet,
                horse_name: bet.horse_name || 'Unknown Horse',
                horses: bet.horses || [{ 
                  name: bet.horse_name || 'Unknown Horse', 
                  odds: bet.odds 
                }]
              } as any}  // Use 'any' to bypass TypeScript's strict checks 
              onRefresh={handleRefresh}
              onEdit={() => handleEditBet(bet)}
              onRule4={() => handleRule4(bet)}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-3 max-w-7xl bg-betting-dark min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2 text-white">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-1">All Bets</h1>
          <div className="flex space-x-1.5 mb-2">
            <button
              onClick={() => handleViewChange('all')}
              className={`px-2 py-0.5 text-xs rounded-full ${
                activeView === 'all' 
                  ? 'bg-betting-green text-white' 
                  : 'bg-betting-dark border border-betting-green/20 text-gray-300 hover:bg-betting-green/10'
              } transition-colors`}
            >
              All
            </button>
            <button
              onClick={() => handleViewChange('pending')}
              className={`px-2 py-0.5 text-xs rounded-full ${
                activeView === 'pending' 
                  ? 'bg-yellow-500 text-white' 
                  : 'bg-betting-dark border border-betting-green/20 text-gray-300 hover:bg-betting-green/10'
              } transition-colors`}
            >
              Pending
            </button>
            <button
              onClick={() => handleViewChange('settled')}
              className={`px-2 py-0.5 text-xs rounded-full ${
                activeView === 'settled' 
                  ? 'bg-betting-green text-white' 
                  : 'bg-betting-dark border border-betting-green/20 text-gray-300 hover:bg-betting-green/10'
              } transition-colors`}
            >
              Settled
            </button>
          </div>
        </div>
        
        <div className="flex space-x-1.5 mb-2 md:mb-0">
          <button
            onClick={handleRefresh}
            className="flex items-center px-2 py-1 text-xs rounded bg-betting-dark border border-betting-green/20 text-gray-200 hover:bg-betting-green/10"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </button>
          
          <button
            onClick={handleOpenForm}
            className="flex items-center px-2 py-1 text-xs rounded bg-betting-green text-white hover:bg-betting-secondary"
          >
            <Plus className="w-3 h-3 mr-1" />
            Add Bet
          </button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-5">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className={getMutedTextColor()} />
          </div>
          <input
            type="text"
            placeholder="Search horse names..."
            value={searchQuery}
            onChange={handleSearchChange}
            className={`block w-full pl-9 pr-9 py-1.5 rounded-lg shadow-sm border ${getBorderColor()} ${getInputBg()} ${getTextColor()} focus:outline-none focus:ring-2 focus:ring-betting-green transition-all duration-200 text-sm`}
          />
          {searchQuery && (
            <button 
              onClick={clearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
              aria-label="Clear search"
            >
              <X size={14} className={`${getMutedTextColor()} hover:${getTextColor()} transition-colors duration-200`} />
            </button>
          )}
        </div>
        
        <button
          onClick={toggleDateSort}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm font-medium rounded-lg shadow-sm border ${getBorderColor()} ${getCardBg()} ${getTextColor()} hover:bg-opacity-90 transition-colors duration-200`}
        >
          <Calendar size={14} />
          <span>Date</span>
          <ArrowUpDown size={14} className={dateSort === 'asc' ? 'rotate-180' : ''} />
        </button>
      </div>
      
      {renderBets()}
      
      {/* Modals and forms */}
      {isFormOpen && (
        <BetForm 
          isOpen={isFormOpen} 
          onClose={handleCloseForm} 
          userId={userId} 
          onBetSaved={handleBetSaved}
        />
      )}
      
      {isEditModalOpen && selectedBet && (
        <EditBetModal
          bet={selectedBet}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleRefresh}
        />
      )}

      {isRule4ModalOpen && selectedBet && (
        <Rule4Modal
          bet={selectedBet}
          isOpen={isRule4ModalOpen}
          onClose={() => setIsRule4ModalOpen(false)}
          onSave={handleRefresh}
        />
      )}
    </div>
  );
} 