'use client';

import { useState, useEffect } from 'react';
import { getUserBets, getUserBankrolls, getSportBetDetails } from '@/lib/supabase/client';
import { supabase } from '@/lib/supabase/client';

interface Bet {
  id: string;
  sport: string;
  event_name: string;
  selection: string;
  stake: number;
  odds: number;
  bet_type: string;
  status: string;
  result: string | null;
  profit_loss: number | null;
  created_at: string;
  settled_at: string | null;
  closing_odds: number | null;
  notes: string | null;
  competition: string | null;
  event_date: string | null;
  bankrolls: {
    name: string;
  };
}

interface Bankroll {
  id: string;
  name: string;
  current_amount: number;
  initial_amount: number;
  currency: string;
}

interface BetSpreadsheetProps {
  userId: string;
}

export default function BetSpreadsheet({ userId }: BetSpreadsheetProps) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [bankrolls, setBankrolls] = useState<Bankroll[]>([]);
  const [selectedBankroll, setSelectedBankroll] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBetId, setExpandedBetId] = useState<string | null>(null);
  const [sportDetails, setSportDetails] = useState<any>(null);

  // Fetch bets and bankrolls on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch bankrolls
        const bankrollsData = await getUserBankrolls(userId);
        setBankrolls(bankrollsData);
        
        // Fetch bets
        const betsData = await getUserBets(userId, selectedBankroll || undefined);
        setBets(betsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Set up real-time subscription for bets
    const betsSubscription = supabase
      .channel('bets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bets',
          filter: `user_id=eq.${userId}`
        },
        () => {
          // Refresh bets when changes occur
          getUserBets(userId, selectedBankroll || undefined).then(setBets);
        }
      )
      .subscribe();
    
    // Set up real-time subscription for bankrolls
    const bankrollsSubscription = supabase
      .channel('bankrolls-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bankrolls',
          filter: `user_id=eq.${userId}`
        },
        () => {
          // Refresh bankrolls when changes occur
          getUserBankrolls(userId).then(setBankrolls);
        }
      )
      .subscribe();
    
    return () => {
      // Clean up subscriptions
      supabase.removeChannel(betsSubscription);
      supabase.removeChannel(bankrollsSubscription);
    };
  }, [userId, selectedBankroll]);

  // Filter bets by sport
  const filteredBets = selectedSport
    ? bets.filter(bet => bet.sport.toLowerCase() === selectedSport.toLowerCase())
    : bets;

  // Get unique sports from bets
  const sports = [...new Set(bets.map(bet => bet.sport))];

  // Calculate totals
  const totalStake = filteredBets.reduce((sum, bet) => sum + bet.stake, 0);
  const totalProfitLoss = filteredBets.reduce((sum, bet) => sum + (bet.profit_loss || 0), 0);
  const roi = totalStake > 0 ? (totalProfitLoss / totalStake) * 100 : 0;

  // Handle bankroll selection
  const handleBankrollChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedBankroll(value === 'all' ? null : value);
  };

  // Handle sport selection
  const handleSportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedSport(value === 'all' ? null : value);
  };

  // Handle bet expansion to show sport-specific details
  const handleExpandBet = async (betId: string, sport: string) => {
    if (expandedBetId === betId) {
      // Collapse if already expanded
      setExpandedBetId(null);
      setSportDetails(null);
      return;
    }
    
    setExpandedBetId(betId);
    
    try {
      const details = await getSportBetDetails(betId, sport);
      setSportDetails(details);
    } catch (error) {
      console.error('Error fetching sport details:', error);
      setSportDetails(null);
    }
  };

  // Format date
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <div className="mb-6 bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-bold mb-4">Betting Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-gray-500">Total Stake</h3>
            <p className="text-2xl font-bold">{formatCurrency(totalStake)}</p>
          </div>
          <div className={`p-4 rounded-lg ${totalProfitLoss >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <h3 className="text-sm font-medium text-gray-500">Profit/Loss</h3>
            <p className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(totalProfitLoss)}
            </p>
          </div>
          <div className={`p-4 rounded-lg ${roi >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <h3 className="text-sm font-medium text-gray-500">ROI</h3>
            <p className={`text-2xl font-bold ${roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {roi.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>
      
      <div className="mb-4 flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/2">
          <label htmlFor="bankroll" className="block text-sm font-medium text-gray-700 mb-1">
            Bankroll
          </label>
          <select
            id="bankroll"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedBankroll || 'all'}
            onChange={handleBankrollChange}
          >
            <option value="all">All Bankrolls</option>
            {bankrolls.map(bankroll => (
              <option key={bankroll.id} value={bankroll.id}>
                {bankroll.name} ({formatCurrency(bankroll.current_amount)})
              </option>
            ))}
          </select>
        </div>
        
        <div className="w-full md:w-1/2">
          <label htmlFor="sport" className="block text-sm font-medium text-gray-700 mb-1">
            Sport
          </label>
          <select
            id="sport"
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={selectedSport || 'all'}
            onChange={handleSportChange}
          >
            <option value="all">All Sports</option>
            {sports.map(sport => (
              <option key={sport} value={sport}>
                {sport}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto bg-white rounded-lg shadow-md">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sport
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Event
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Selection
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stake
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Odds
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                P/L
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bankroll
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBets.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-4 text-center text-sm text-gray-500">
                  No bets found. Start adding bets using the chat interface!
                </td>
              </tr>
            ) : (
              filteredBets.map(bet => (
                <>
                  <tr key={bet.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(bet.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bet.sport}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bet.event_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {bet.selection}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCurrency(bet.stake)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bet.odds.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        bet.status === 'won' ? 'bg-green-100 text-green-800' :
                        bet.status === 'lost' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={bet.profit_loss && bet.profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {bet.profit_loss ? formatCurrency(bet.profit_loss) : '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {bet.bankrolls.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => handleExpandBet(bet.id, bet.sport)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {expandedBetId === bet.id ? 'Hide Details' : 'Show Details'}
                      </button>
                    </td>
                  </tr>
                  {expandedBetId === bet.id && (
                    <tr>
                      <td colSpan={10} className="px-6 py-4 bg-gray-50">
                        <div className="text-sm text-gray-700">
                          {sportDetails ? (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {Object.entries(sportDetails).map(([key, value]) => {
                                if (key === 'bet_id' || key === 'created_at' || key === 'updated_at') return null;
                                return (
                                  <div key={key} className="flex flex-col">
                                    <span className="font-medium">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                    <span>{value as string}</span>
                                  </div>
                                );
                              })}
                              {bet.notes && (
                                <div className="col-span-3">
                                  <span className="font-medium">Notes</span>
                                  <p>{bet.notes}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <p>No additional details available</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
} 