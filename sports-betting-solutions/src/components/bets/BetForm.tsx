/**
 * BetForm - LEGACY COMPONENT
 * 
 * This is a legacy component that forwards to the new BetEntryForm in the frontend-ui directory.
 * It's maintained for backwards compatibility while we transition to the new structure.
 */

'use client';

import React, { useEffect } from 'react';
import BetEntryForm from '@/frontend-ui/components/betting/bet-entry-form';

interface BetFormProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  onBetSaved?: () => void;
  initialBetType?: string; // Add support for initial bet type
}

export default function BetForm({ isOpen, onClose, userId, onBetSaved, initialBetType = 'single' }: BetFormProps) {
  // Add debug logging for prop values
  useEffect(() => {
    if (isOpen) {
      console.log('[BetForm] Opened with props:', {
        isOpen,
        userId,
        initialBetType,
        hasOnCloseHandler: typeof onClose === 'function',
        hasOnBetSavedHandler: typeof onBetSaved === 'function'
      });
    }
  }, [isOpen, userId, initialBetType, onClose, onBetSaved]);

  if (!isOpen) return null;
  
  // Validate userId before passing it to BetEntryForm
  if (!userId) {
    console.error('[BetForm] Missing required userId prop');
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-4 rounded-lg shadow-xl">
          <h3 className="text-red-600 font-bold">Authentication Error</h3>
          <p>Unable to load bet form - user ID is missing.</p>
          <button 
            onClick={onClose}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md"
          >
            Close
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <BetEntryForm 
      onClose={onClose} 
      userId={userId}
      onSave={onBetSaved}
      initialBetType={initialBetType}
    />
  );
} 