'use client';

import React, { useState, useEffect } from 'react';
import { getUserBets, getUserBankrolls, getSportBetDetails } from '@/lib/supabase/client';
import { supabase } from '@/lib/supabase/client';
import { ChevronDown, ChevronUp, Filter, Edit, Trash, Check, X } from 'lucide-react';

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
  showPendingOnly?: boolean;
  onBetUpdated?: () => void;
}

export default function BetSpreadsheet({ userId, showPendingOnly = false, onBetUpdated }: BetSpreadsheetProps) {
  const [bets, setBets] = useState<Bet[]>([]);
  const [bankrolls, setBankrolls] = useState<Bankroll[]>([]);
  const [selectedBankroll, setSelectedBankroll] = useState<string | null>(null);
  const [selectedSport, setSelectedSport] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedBetId, setExpandedBetId] = useState<string | null>(null);
  const [sportDetails, setSportDetails] = useState<any>(null);
  const [editingBet, setEditingBet] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});

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
        
        // Filter pending bets if showPendingOnly is true
        const filteredBets = showPendingOnly 
          ? betsData.filter(bet => bet.profit_loss === null || bet.status === 'pending')
          : betsData;
          
        setBets(filteredBets);
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
          getUserBets(userId, selectedBankroll || undefined)
            .then(betsData => {
              // Filter pending bets if showPendingOnly is true
              const filteredBets = showPendingOnly 
                ? betsData.filter(bet => bet.profit_loss === null || bet.status === 'pending')
                : betsData;
                
              setBets(filteredBets);
              
              // Call onBetUpdated callback if provided
              if (onBetUpdated) {
                onBetUpdated();
              }
            });
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
  }, [userId, selectedBankroll, showPendingOnly, onBetUpdated]);

  // Filter bets by sport
  const filteredBets = selectedSport
    ? bets.filter(bet => bet.sport.toLowerCase() === selectedSport.toLowerCase())
    : bets;

  // Get unique sports from bets
  const sports = Array.from(new Set(bets.map(bet => bet.sport)));

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

  // Format currency with the proper GBP symbol
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP'
    }).format(amount);
  };

  const startEdit = (bet: Bet) => {
    setEditingBet(bet.id);
    setEditValues({
      stake: bet.stake,
      odds: bet.odds,
      event_name: bet.event_name,
      selection: bet.selection,
      status: bet.status,
      result: bet.result,
      winnings: bet.profit_loss
    });
  };

  const cancelEdit = () => {
    setEditingBet(null);
    setEditValues({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditValues((prev: any) => ({
      ...prev,
      [name]: name === 'stake' || name === 'odds' || name === 'winnings' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const saveEdit = async (betId: string) => {
    try {
      const { error } = await supabase
        .from('bets')
        .update({
          ...editValues,
          updated_at: new Date().toISOString()
        })
        .eq('id', betId);
        
      if (error) throw error;
      
      const updatedBets = await getUserBets(userId, selectedBankroll || undefined);
      setBets(updatedBets);
      if (onBetUpdated) onBetUpdated();
      setEditingBet(null);
    } catch (error) {
      console.error('Error updating bet:', error);
    }
  };

  const deleteBet = async (betId: string) => {
    // Confirm before deletion
    if (!confirm('Are you sure you want to delete this bet?')) return;
    
    try {
      const { error } = await supabase
        .from('bets')
        .delete()
        .eq('id', betId);
        
      if (error) throw error;
      
      const updatedBets = await getUserBets(userId, selectedBankroll || undefined);
      setBets(updatedBets);
      if (onBetUpdated) onBetUpdated();
    } catch (error) {
      console.error('Error deleting bet:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-1/2">
          <label htmlFor="bankroll" className="block text-xs font-medium text-gray-500 mb-1">
            Bankroll
          </label>
          <select
            id="bankroll"
            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700"
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
          <label htmlFor="sport" className="block text-xs font-medium text-gray-500 mb-1">
            Sport
          </label>
          <select
            id="sport"
            className="w-full p-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-700"
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
      
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr className="bg-gray-50">
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
                Details
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredBets.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-8 text-center text-sm text-gray-500">
                  No bets found. Add a new bet to get started!
                </td>
              </tr>
            ) : (
              filteredBets.map(bet => (
                <>
                  <tr key={bet.id} className="hover:bg-gray-50 transition-colors">
                    {editingBet === bet.id ? (
                      // Edit mode row
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(bet.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <input
                            type="text"
                            name="event_name"
                            value={editValues.event_name || ''}
                            onChange={handleInputChange}
                            className="block w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <input
                            type="text"
                            name="selection"
                            value={editValues.selection || ''}
                            onChange={handleInputChange}
                            className="block w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <input
                            type="number"
                            name="stake"
                            value={editValues.stake || ''}
                            onChange={handleInputChange}
                            className="block w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                            step="0.01"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <input
                            type="number"
                            name="odds"
                            value={editValues.odds || ''}
                            onChange={handleInputChange}
                            className="block w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                            step="0.01"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <input
                            type="number"
                            name="winnings"
                            value={editValues.winnings || ''}
                            onChange={handleInputChange}
                            className="block w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                            step="0.01"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <select
                            name="result"
                            value={editValues.result || ''}
                            onChange={handleInputChange}
                            className="block w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                          >
                            <option value="">Pending</option>
                            <option value="win">Win</option>
                            <option value="loss">Loss</option>
                            <option value="void">Void</option>
                          </select>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            editValues.result === 'win' ? 'bg-emerald-100 text-emerald-800' :
                            editValues.result === 'loss' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {editValues.result || bet.status || 'Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {bet.bankrolls?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => saveEdit(bet.id)}
                            className="text-emerald-600 hover:text-emerald-700"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="text-gray-600 hover:text-gray-700"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </td>
                      </>
                    ) : (
                      // View mode row
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(bet.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {bet.sport}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {bet.event_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          {bet.selection}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(bet.stake)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {bet.odds?.toFixed(2) || 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            bet.status === 'won' ? 'bg-emerald-100 text-emerald-800' :
                            bet.status === 'lost' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {bet.status.charAt(0).toUpperCase() + bet.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <span className={bet.profit_loss && bet.profit_loss >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {bet.profit_loss ? formatCurrency(bet.profit_loss) : '-'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {bet.bankrolls?.name || '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <button
                            onClick={() => handleExpandBet(bet.id, bet.sport)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <ChevronDown className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => startEdit(bet)}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteBet(bet.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash className="w-5 h-5" />
                          </button>
                        </td>
                      </>
                    )}
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
                                    <span className="font-medium text-gray-800">{key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                                    <span className="text-gray-600">{value as string}</span>
                                  </div>
                                );
                              })}
                              {bet.notes && (
                                <div className="col-span-3 mt-2 pt-2 border-t">
                                  <span className="font-medium text-gray-800">Notes</span>
                                  <p className="text-gray-600 mt-1">{bet.notes}</p>
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