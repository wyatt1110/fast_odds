'use client';

import { useState, useEffect } from 'react';
import { X, AlertCircle, Save } from 'lucide-react';
import { useTheme } from '@/components/providers';
import { supabase } from '@/lib/supabase/client';

// Define the bet type structure - matching BetRecord from all-bets-page
interface Bet {
  id: string; // Primary key from database
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
}

// Component props
interface EditBetModalProps {
  bet: Bet;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function EditBetModal({ bet, isOpen, onClose, onSave }: EditBetModalProps) {
  const [formData, setFormData] = useState<Partial<Bet>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  // Initialize form data when bet changes
  useEffect(() => {
    setFormData({
      horse_name: bet.horse_name,
      track_name: bet.track_name,
      race_number: bet.race_number,
      stake: bet.stake,
      odds: bet.odds,
      each_way: bet.each_way,
      status: bet.status,
      bookmaker: bet.bookmaker,
      model: bet.model,
      notes: bet.notes,
      jockey: bet.jockey,
      trainer: bet.trainer,
      race_distance: bet.race_distance,
      race_type: bet.race_type,
      returns: bet.returns,
      profit_loss: bet.profit_loss
    });
  }, [bet]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      // Determine which odds to use for calculations
      const effectiveOdds = bet.rule_4_adjusted_odds && bet.rule_4_adjusted_odds > 0 
        ? bet.rule_4_adjusted_odds 
        : bet.odds;

      // Calculate profit_loss based on status and returns
      let updatedReturns = formData.returns;
      let updatedProfitLoss = formData.profit_loss;
      let updatedClosingLineValue = bet.closing_line_value;

      // If bet is won or lost, recalculate returns and profit/loss using effective odds
      if (formData.status === 'Won' || formData.status === 'Lost') {
        if (formData.status === 'Won') {
          // For winning bets, returns = stake * effective_odds
          updatedReturns = (formData.stake || 0) * effectiveOdds;
          updatedProfitLoss = (updatedReturns || 0) - (formData.stake || 0);
        } else {
          // For losing bets, returns = 0, profit_loss = -stake
          updatedReturns = 0;
          updatedProfitLoss = -(formData.stake || 0);
        }
      }

      // Recalculate closing line value if closing_odds exists and bet is settled
      if (bet.closing_odds && bet.closing_odds !== '?' && formData.status !== 'Pending') {
        try {
          const closingOddsValue = parseFloat(bet.closing_odds);
          if (!isNaN(closingOddsValue) && closingOddsValue > 0) {
            // CLV = ((effective_odds - closing_odds) / closing_odds) * 100
            updatedClosingLineValue = ((effectiveOdds - closingOddsValue) / closingOddsValue) * 100;
            // Round to 2 decimal places
            updatedClosingLineValue = Math.round(updatedClosingLineValue * 100) / 100;
          }
        } catch (error) {
          console.warn('Error calculating closing line value:', error);
        }
      }

      const { error: updateError } = await (supabase as any)
        .from('racing_bets')
        .update({
          ...formData,
          // Preserve original values for fields removed from the form
          bet_type: bet.bet_type,
          scheduled_race_time: bet.scheduled_race_time,
          returns: updatedReturns,
          profit_loss: updatedProfitLoss,
          closing_line_value: updatedClosingLineValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', bet.id); // Use the actual database column name 'id'

      if (updateError) throw new Error(updateError.message);

      onSave();
      onClose();
    } catch (err) {
      console.error('Error updating bet:', err);
      setError(err instanceof Error ? err.message : 'Failed to update bet');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Theme helper functions
  const getModalBg = () => theme === 'dark' ? 'bg-gray-800' : theme === 'racing' ? 'bg-charcoal-800' : 'bg-white';
  const getOverlayBg = () => theme === 'dark' ? 'bg-black/70' : theme === 'racing' ? 'bg-black/70' : 'bg-black/50';
  const getBorderColor = () => theme === 'dark' ? 'border-gray-700' : theme === 'racing' ? 'border-charcoal-700' : 'border-gray-200';
  const getTextColor = () => theme === 'dark' || theme === 'racing' ? 'text-white' : 'text-gray-900';
  const getMutedTextColor = () => theme === 'dark' ? 'text-gray-400' : theme === 'racing' ? 'text-gray-300' : 'text-gray-500';
  const getInputBg = () => theme === 'dark' ? 'bg-gray-700' : theme === 'racing' ? 'bg-charcoal-700' : 'bg-white';
  const getInputBorder = () => theme === 'dark' ? 'border-gray-600' : theme === 'racing' ? 'border-charcoal-600' : 'border-gray-300';
  const getInputTextColor = () => theme === 'dark' || theme === 'racing' ? 'text-white' : 'text-gray-900';
  const getButtonBg = () => theme === 'racing' ? 'bg-racing-600 hover:bg-racing-700' : 'bg-blue-600 hover:bg-blue-700';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        {/* Overlay */}
        <div 
          className={`fixed inset-0 ${getOverlayBg()} transition-opacity`} 
          onClick={onClose}
          aria-hidden="true"
        />
        
        {/* Modal content - reduced max-width */}
        <div className={`relative w-full max-w-xl transform rounded-lg ${getModalBg()} ${getBorderColor()} border p-6 text-left shadow-xl transition-all`}>
          {/* Close button */}
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 rounded-full p-1 ${getMutedTextColor()} hover:bg-gray-200 ${theme === 'dark' ? 'hover:bg-gray-700' : theme === 'racing' ? 'hover:bg-charcoal-700' : ''}`}
          >
            <X className="h-5 w-5" />
          </button>
          
          <h3 className={`text-lg font-medium leading-6 ${getTextColor()} mb-4`}>
            Edit Bet
          </h3>
          
          {/* Error message */}
          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-4 border border-red-200">
              <div className="flex">
                <AlertCircle className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-1 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}
          
          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* Horse Name */}
              <div>
                <label htmlFor="horse_name" className={`block text-sm font-medium ${getMutedTextColor()} mb-1`}>
                  Horse Name *
                </label>
                <input
                  type="text"
                  name="horse_name"
                  id="horse_name"
                  required
                  value={formData.horse_name || ''}
                  onChange={handleChange}
                  className={`block w-full rounded-md border ${getInputBorder()} ${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
              </div>
              
              {/* Track Name */}
              <div>
                <label htmlFor="track_name" className={`block text-sm font-medium ${getMutedTextColor()} mb-1`}>
                  Track Name *
                </label>
                <input
                  type="text"
                  name="track_name"
                  id="track_name"
                  required
                  value={formData.track_name || ''}
                  onChange={handleChange}
                  className={`block w-full rounded-md border ${getInputBorder()} ${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
              </div>
              
              {/* Race Number */}
              <div>
                <label htmlFor="race_number" className={`block text-sm font-medium ${getMutedTextColor()} mb-1`}>
                  Race Number
                </label>
                <input
                  type="text"
                  name="race_number"
                  id="race_number"
                  value={formData.race_number || ''}
                  onChange={handleChange}
                  className={`block w-full rounded-md border ${getInputBorder()} ${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
              </div>
              
              {/* Status */}
              <div>
                <label htmlFor="status" className={`block text-sm font-medium ${getMutedTextColor()} mb-1`}>
                  Status *
                </label>
                <select
                  name="status"
                  id="status"
                  required
                  value={formData.status || ''}
                  onChange={handleChange}
                  className={`block w-full rounded-md border ${getInputBorder()} ${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                >
                  <option value="Pending">Pending</option>
                  <option value="Won">Won</option>
                  <option value="Lost">Lost</option>
                  <option value="Void">Void</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>
              
              {/* Stake */}
              <div>
                <label htmlFor="stake" className={`block text-sm font-medium ${getMutedTextColor()} mb-1`}>
                  Stake *
                </label>
                <input
                  type="number"
                  name="stake"
                  id="stake"
                  required
                  min="0"
                  step="0.01"
                  value={formData.stake || ''}
                  onChange={handleChange}
                  className={`block w-full rounded-md border ${getInputBorder()} ${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
              </div>
              
              {/* Odds */}
              <div>
                <label htmlFor="odds" className={`block text-sm font-medium ${getMutedTextColor()} mb-1`}>
                  Odds *
                </label>
                <input
                  type="number"
                  name="odds"
                  id="odds"
                  required
                  min="1"
                  step="0.01"
                  value={formData.odds || ''}
                  onChange={handleChange}
                  className={`block w-full rounded-md border ${getInputBorder()} ${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
              </div>
              
              {/* Jockey */}
              <div>
                <label htmlFor="jockey" className={`block text-sm font-medium ${getMutedTextColor()} mb-1`}>
                  Jockey
                </label>
                <input
                  type="text"
                  name="jockey"
                  id="jockey"
                  value={formData.jockey || ''}
                  onChange={handleChange}
                  className={`block w-full rounded-md border ${getInputBorder()} ${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
              </div>
              
              {/* Trainer */}
              <div>
                <label htmlFor="trainer" className={`block text-sm font-medium ${getMutedTextColor()} mb-1`}>
                  Trainer
                </label>
                <input
                  type="text"
                  name="trainer"
                  id="trainer"
                  value={formData.trainer || ''}
                  onChange={handleChange}
                  className={`block w-full rounded-md border ${getInputBorder()} ${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
              </div>
              
              {/* Bookmaker */}
              <div>
                <label htmlFor="bookmaker" className={`block text-sm font-medium ${getMutedTextColor()} mb-1`}>
                  Bookmaker
                </label>
                <input
                  type="text"
                  name="bookmaker"
                  id="bookmaker"
                  value={formData.bookmaker || ''}
                  onChange={handleChange}
                  className={`block w-full rounded-md border ${getInputBorder()} ${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
              </div>
              
              {/* Model */}
              <div>
                <label htmlFor="model" className={`block text-sm font-medium ${getMutedTextColor()} mb-1`}>
                  Model
                </label>
                <input
                  type="text"
                  name="model"
                  id="model"
                  value={formData.model || ''}
                  onChange={handleChange}
                  className={`block w-full rounded-md border ${getInputBorder()} ${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
                />
              </div>
              
              {/* Each Way Checkbox */}
              <div className="flex items-center space-x-2 mt-4">
                <input
                  type="checkbox"
                  id="each_way"
                  name="each_way"
                  checked={formData.each_way || false}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="each_way" className={`text-sm ${getTextColor()}`}>
                  Each Way Bet
                </label>
              </div>
            </div>
            
            {/* Notes */}
            <div className="mt-4">
              <label htmlFor="notes" className={`block text-sm font-medium ${getMutedTextColor()} mb-1`}>
                Notes
              </label>
              <textarea
                name="notes"
                id="notes"
                rows={2}
                value={formData.notes || ''}
                onChange={handleChange}
                className={`block w-full rounded-md border ${getInputBorder()} ${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
            </div>
            
            {/* Submit button */}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className={`mr-3 inline-flex items-center rounded-md border ${getInputBorder()} px-4 py-2 text-sm font-medium ${getTextColor()} shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`inline-flex items-center rounded-md border border-transparent ${getButtonBg()} px-4 py-2 text-sm font-medium text-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                {isSubmitting ? (
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 