'use client';

import { useState, useEffect } from 'react';
import { X, Save, AlertCircle } from 'lucide-react';
import { useTheme } from '@/components/providers';
import { supabase } from '@/lib/supabase/client';

// Define the bet type structure for Rule 4
interface Bet {
  id: string;
  bet_id: string;
  odds: number;
  rule_4_deduction: number | null;
  rule_4_adjusted_odds: number | null;
  horse_name: string | null;
  stake: number;
  status: string;
  returns: number | null;
  profit_loss: number | null;
  closing_odds: string | null;
  closing_line_value: number | null;
}

// Component props
interface Rule4ModalProps {
  bet: Bet;
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
}

export default function Rule4Modal({ bet, isOpen, onClose, onSave }: Rule4ModalProps) {
  const [deduction, setDeduction] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  // Initialize form data when bet changes
  useEffect(() => {
    if (bet.rule_4_deduction) {
      setDeduction(bet.rule_4_deduction.toString());
    } else {
      setDeduction('');
    }
    setError(null);
  }, [bet]);

  // Calculate Rule 4 adjusted odds
  const calculateRule4AdjustedOdds = (originalOdds: number, deductionPence: number): number => {
    // Rule 4 formula: adjusted_odds = 1 + ((original_odds - 1) * (1 - (deduction_pence / 100)))
    // deductionPence is the pence deducted per pound of winnings
    const deductionRate = deductionPence / 100;
    const originalWinnings = originalOdds - 1;
    const adjustedWinnings = originalWinnings * (1 - deductionRate);
    const adjustedOdds = 1 + adjustedWinnings;
    
    // Round to 3 decimal places to match database precision
    return Math.round(adjustedOdds * 1000) / 1000;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const deductionValue = parseFloat(deduction);
      
      // Validate input
      if (isNaN(deductionValue) || deductionValue < 0) {
        throw new Error('Please enter a valid positive number');
      }

      if (deductionValue > 100) {
        throw new Error('Rule 4 deduction cannot exceed 100p');
      }

      // Calculate adjusted odds
      const adjustedOdds = deductionValue > 0 
        ? calculateRule4AdjustedOdds(bet.odds, deductionValue)
        : null;

      // Determine effective odds for calculations
      const effectiveOdds = adjustedOdds || bet.odds;

      // Prepare update object with Rule 4 data
      const updateData: any = {
        rule_4_deduction: deductionValue > 0 ? deductionValue : null,
        rule_4_adjusted_odds: adjustedOdds,
        updated_at: new Date().toISOString()
      };

      // If bet is settled, recalculate financial fields using new effective odds
      const isSettled = bet.status && bet.status.toLowerCase() !== 'pending';
      
      if (isSettled) {
        // Recalculate returns and profit/loss based on status
        if (bet.status.toLowerCase() === 'won' || bet.status.toLowerCase() === 'win') {
          // For winning bets, returns = stake * effective_odds
          const newReturns = bet.stake * effectiveOdds;
          const newProfitLoss = newReturns - bet.stake;
          
          updateData.returns = Math.round(newReturns * 100) / 100; // Round to 2 decimal places
          updateData.profit_loss = Math.round(newProfitLoss * 100) / 100;
        } else if (bet.status.toLowerCase() === 'lost' || bet.status.toLowerCase() === 'lose') {
          // For losing bets, returns remain 0, profit_loss = -stake
          updateData.returns = 0;
          updateData.profit_loss = -bet.stake;
        }

        // Recalculate closing line value if closing_odds exists
        if (bet.closing_odds && bet.closing_odds !== '?' && bet.closing_odds !== null) {
          try {
            const closingOddsValue = parseFloat(bet.closing_odds);
            if (!isNaN(closingOddsValue) && closingOddsValue > 0) {
              // CLV = ((effective_odds - closing_odds) / closing_odds) * 100
              const newClosingLineValue = ((effectiveOdds - closingOddsValue) / closingOddsValue) * 100;
              updateData.closing_line_value = Math.round(newClosingLineValue * 100) / 100;
            }
          } catch (error) {
            console.warn('Error calculating closing line value:', error);
          }
        }
      }

      // Update database
      const { error: updateError } = await (supabase as any)
        .from('racing_bets')
        .update(updateData)
        .eq('id', bet.id);

      if (updateError) throw new Error(updateError.message);

      onSave();
      onClose();
    } catch (err) {
      console.error('Error updating Rule 4:', err);
      setError(err instanceof Error ? err.message : 'Failed to update Rule 4 deduction');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimal points
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setDeduction(value);
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
        
        {/* Modal content - smaller size for Rule 4 */}
        <div className={`relative w-full max-w-md transform rounded-lg ${getModalBg()} ${getBorderColor()} border p-6 text-left shadow-xl transition-all`}>
          {/* Close button */}
          <button
            onClick={onClose}
            className={`absolute top-4 right-4 rounded-full p-1 ${getMutedTextColor()} hover:bg-gray-200 ${theme === 'dark' ? 'hover:bg-gray-700' : theme === 'racing' ? 'hover:bg-charcoal-700' : ''}`}
          >
            <X className="h-5 w-5" />
          </button>
          
          {/* Header */}
          <div className="mb-4">
            <h3 className={`text-lg font-medium leading-6 ${getTextColor()} mb-1`}>
              Add Rule 4 Deductions
            </h3>
            <p className={`text-sm ${getMutedTextColor()}`}>
              {bet.horse_name || 'Unknown Horse'}
            </p>
          </div>
          
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
            {/* Current odds display */}
            <div className="mb-4">
              <p className={`text-sm ${getMutedTextColor()} mb-2`}>
                Current Odds: <span className={`font-medium ${getTextColor()}`}>{bet.odds}</span>
              </p>
              {bet.rule_4_adjusted_odds && (
                <p className={`text-sm ${getMutedTextColor()}`}>
                  Current Adjusted Odds: <span className={`font-medium ${getTextColor()}`}>{bet.rule_4_adjusted_odds}</span>
                </p>
              )}
            </div>

            {/* Deduction input */}
            <div className="mb-4">
              <label htmlFor="deduction" className={`block text-sm font-medium ${getMutedTextColor()} mb-2`}>
                Rule 4 Deduction (pence)
              </label>
              <input
                type="text"
                name="deduction"
                id="deduction"
                value={deduction}
                onChange={handleInputChange}
                placeholder="Enter deduction amount"
                className={`block w-full rounded-md border ${getInputBorder()} ${getInputBg()} ${getInputTextColor()} px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500`}
              />
            </div>

            {/* Instructions */}
            <div className={`mb-6 p-3 rounded-md ${theme === 'dark' ? 'bg-gray-700' : theme === 'racing' ? 'bg-charcoal-700' : 'bg-gray-50'} border ${getBorderColor()}`}>
              <p className={`text-xs ${getMutedTextColor()}`}>
                <strong>Instructions:</strong> Please just input the deduction number, e.g. 10p Rule 4 deduction, enter: <strong>10</strong> (The calculations will be done for you)
              </p>
            </div>

            {/* Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className={`inline-flex items-center rounded-md border ${getInputBorder()} px-4 py-2 text-sm font-medium ${getTextColor()} shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500`}
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
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
} 