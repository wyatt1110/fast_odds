/**
 * BET ENTRY FORM
 * 
 * A professional form component for entering horse racing bets.
 * This provides users with a clear interface to record new bets.
 * 
 * Features:
 * - Clean, bordered sections for each data category
 * - Input validation and clear error messages
 * - Saves data in a format that matches spreadsheet requirements
 * - Works with the Supabase database
 * - Supports multiple horses for different bet types
 * - Persists verified horse data until bet submission or cancellation
 */

'use client';

import React, { useState, useEffect, useCallback, memo, useRef } from 'react';
import { supabase } from '@/lib/supabase/client';
import { X, Check, AlertCircle, Save, Search, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { betSubmissionService } from '../../../lib/services/bet-submission-service';
import { useTheme } from '@/components/providers';

// Define the supported bet types and their horse count requirements
const betTypeHorseCount = {
  'single': 1,
  'double': 2,
  'treble': 3,
  '4fold': 4,
  '5fold': 5,
  'trixie': 3,
  'patent': 3,
  'yankee': 4,
  'super_yankee': 5,
  'lucky_15': 4,
  'lucky_31': 5,
};

// Define the required fields for the form
interface BetFormData {
  bet_type: string;
  each_way: boolean;
  stake: string;
  odds: string;
  bookmaker: string;
  model_tipster: string;
  promotion_used: boolean;
  notes: string;
}

// Define the data structure for a horse
interface HorseData {
  horse_name: string;
  track_name: string;
  race_number: string;
  race_date: string;
  jockey: string;
  trainer: string;
  race_class: string;
  race_distance: string;
  manual_entry: boolean;
  verified: boolean;
  verification_details?: string;
  scheduled_time?: string;
  post_position?: string;
  morning_line_odds?: string;
  odds: string;
  horse_number?: string;
  race_location?: string;
  surface_type?: string;
  going?: string;
  prize?: string;
  purse?: string;
  class_type?: string;
}

// Props for the bet entry form component
interface BetEntryFormProps {
  onClose: () => void;
  userId: string;
  onSave?: () => void;
  initialBetType?: string;
}

// Local storage key for verified horses
const VERIFIED_HORSES_STORAGE_KEY = 'verified_horses_data';
// Storage expiration time in milliseconds (5 minutes)
const STORAGE_EXPIRATION_TIME = 5 * 60 * 1000;

// Interface for storing horses with expiration in localStorage
interface StoredHorseData {
  horses: HorseData[];
  timestamp: number;
}

// Helper functions for date formatting
const formatDateForDisplay = (dateValue: string): string => {
  if (dateValue === 'today' || dateValue === 'tomorrow') {
    const date = new Date();
    if (dateValue === 'tomorrow') {
      date.setDate(date.getDate() + 1);
    }
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format for date inputs
  }
  return dateValue;
};

const formatDateForStorage = (dateValue: string): string => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const inputDate = new Date(dateValue);
  inputDate.setHours(0, 0, 0, 0);
  
  if (inputDate.getTime() === today.getTime()) {
    return 'today';
  } else if (inputDate.getTime() === tomorrow.getTime()) {
    return 'tomorrow';
  }
  
  return dateValue;
};

// Helper function to determine if a track is in the UK
const isUKTrack = (trackName: string): boolean => {
  if (!trackName) return false;
  
  const lowerTrack = trackName.toLowerCase();
  
  // Common UK tracks
  const ukTracks = [
    'ascot', 'newmarket', 'goodwood', 'york', 'epsom', 'cheltenham', 'aintree', 'doncaster', 
    'sandown', 'kempton', 'lingfield', 'windsor', 'newbury', 'haydock', 'leicester', 'nottingham',
    'pontefract', 'redcar', 'ripon', 'southwell', 'thirsk', 'wetherby', 'wolverhampton', 'yarmouth',
    'musselburgh', 'perth', 'ayr', 'kelso', 'hamilton', 'hexham', 'fontwell', 'bath', 'beverley', 
    'brighton', 'carlisle', 'catterick', 'chepstow', 'exeter', 'fakenham', 'ffos las', 'hereford', 
    'huntingdon', 'ludlow', 'market rasen', 'newton abbot', 'plumpton', 'salisbury', 'sedgefield',
    'stratford', 'taunton', 'towcester', 'uttoxeter', 'warwick', 'wincanton', 'worcester'
  ];
  
  for (const track of ukTracks) {
    if (lowerTrack.includes(track)) {
      return true;
    }
  }
  
  // Check for UK-specific phrases
  const ukPhrases = ['(uk)', 'uk)', ' uk ', 'british'];
  for (const phrase of ukPhrases) {
    if (lowerTrack.includes(phrase)) {
      return true;
    }
  }
  
  return false;
};

// Helper function to extract race number from a time string or identify race position
const extractRaceNumber = (raceNumberOrTime: string | undefined): number => {
  // If we have a numeric race number already, use it
  if (raceNumberOrTime && /^\d+$/.test(raceNumberOrTime)) {
    return parseInt(raceNumberOrTime);
  }
  
  // If we have a time-based race number (like "2:32"), we need to determine the actual race number
  // For now, default to a placeholder value of 1
  return 1;
};

export default function BetEntryForm({ onClose, userId, onSave, initialBetType = 'single' }: BetEntryFormProps) {
  // Form data state 
  const [formData, setFormData] = useState<BetFormData>({
    bet_type: initialBetType,
    each_way: false,
    stake: '',
    odds: '',
    bookmaker: '',
    model_tipster: '',
    promotion_used: false,
    notes: '',
  });

  // UI state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string>('');
  const [verifying, setVerifying] = useState<number[]>([]);
  const [verificationStatus, setVerificationStatus] = useState<{
    status: 'idle' | 'pending' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });

  // Add a ref to store the timeout for debouncing localStorage updates
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Add refs and state to track active input field
  const [focusedFieldId, setFocusedFieldId] = useState<string | null>(null);
  const inputRefs = useRef<{[key: string]: React.RefObject<HTMLInputElement>}>({});

  // Setup initial horse state with today's date
  const today = new Date();
  const formattedToday = formatDateForStorage(today.toISOString());
  
  const [horses, setHorses] = useState<HorseData[]>(() => {
    try {
      // Try to load horses from localStorage
      const storedData = localStorage.getItem(VERIFIED_HORSES_STORAGE_KEY);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData) as StoredHorseData;
        
        // Only use stored data if it's recent (less than 12 hours old)
        const TWELVE_HOURS = 12 * 60 * 60 * 1000; // 12 hours in milliseconds
        if (Date.now() - parsedData.timestamp < TWELVE_HOURS) {
          console.log('Loading horse data from localStorage');
          
          // Make sure we have at least one horse
          if (parsedData.horses && parsedData.horses.length > 0) {
            return parsedData.horses;
          }
        } else {
          console.log('Stored horse data is too old, using default');
        }
      }
    } catch (e) {
      console.error('Error loading stored horse data:', e);
    }
    
    // Default to a single empty horse
    return [{
      horse_name: '',
      track_name: '',
      race_number: '',
      race_date: formattedToday,
      jockey: '',
      trainer: '',
      race_class: '',
      race_distance: '',
      manual_entry: false,
      verified: false,
      odds: ''
    }];
  });
  
  // Restore focus after render if we were focused before
  useEffect(() => {
    if (focusedFieldId && inputRefs.current[focusedFieldId]?.current) {
      const activeElement = document.activeElement;
      const currentRef = inputRefs.current[focusedFieldId].current;
      
      // Only refocus if we lost focus and the field exists
      if (activeElement !== currentRef && currentRef) {
        // Store the current selection state
        const selectionStart = currentRef.selectionStart;
        const selectionEnd = currentRef.selectionEnd;
        
        // Focus the element
        currentRef.focus();
        
        // Restore the selection state if possible
        if (selectionStart !== null && selectionEnd !== null) {
          currentRef.setSelectionRange(selectionStart, selectionEnd);
        }
      }
    }
  }, [horses, focusedFieldId]);
  
  // Function to get or create a ref for an input field
  const getInputRef = useCallback((id: string) => {
    if (!inputRefs.current[id]) {
      inputRefs.current[id] = React.createRef<HTMLInputElement>();
    }
    return inputRefs.current[id];
  }, []);

  // Create a specialized focus handler
  const handleInputFocus = useCallback((id: string) => {
    setFocusedFieldId(id);
  }, []);
  
  // Create a specialized blur handler
  const handleInputBlur = useCallback(() => {
    // Only clear the focused field if it's not from us re-focusing
    const activeElement = document.activeElement as HTMLElement;
    const isCurrentlyFocusingInput = 
      activeElement?.tagName === 'INPUT' && 
      activeElement?.id.includes('horse_') && 
      inputRefs.current[activeElement.id];
      
    if (!isCurrentlyFocusingInput) {
      setFocusedFieldId(null);
    }
  }, []);

  // Update horse count when bet type changes
  useEffect(() => {
    const requiredHorseCount = betTypeHorseCount[formData.bet_type as keyof typeof betTypeHorseCount] || 1;
    
    // Only add horses if we need more
    if (horses.length < requiredHorseCount) {
      const additionalHorses = Array(requiredHorseCount - horses.length).fill(null).map(() => ({
        horse_name: '',
        track_name: '',
        race_number: '',
        race_date: formatDateForStorage(new Date().toISOString()),
        jockey: '',
        trainer: '',
        race_class: '',
        race_distance: '',
        manual_entry: false,
        verified: false,
        odds: ''
      }));
      
      setHorses(prev => [...prev, ...additionalHorses]);
    } else if (horses.length > requiredHorseCount) {
      // Remove excess horses
      setHorses(prev => prev.slice(0, requiredHorseCount));
    }
  }, [formData.bet_type]);

  // Check if stored horse data is expired and clear if needed
  const checkAndClearExpiredData = (): boolean => {
    try {
      const savedHorsesJSON = localStorage.getItem(VERIFIED_HORSES_STORAGE_KEY);
      if (savedHorsesJSON) {
        const storedData = JSON.parse(savedHorsesJSON) as StoredHorseData;
         
        // Check if data has expired (older than 12 hours)
        const now = Date.now();
        const STORAGE_EXPIRATION_TIME = 12 * 60 * 60 * 1000; // 12 hours
        if (storedData.timestamp && (now - storedData.timestamp > STORAGE_EXPIRATION_TIME)) {
          console.log('Stored horse data has expired, clearing localStorage');
          localStorage.removeItem(VERIFIED_HORSES_STORAGE_KEY);
          return true; // Data was expired and cleared
        }
      }
      return false; // No expired data found
    } catch (error) {
      console.error('Error checking expired horse data:', error);
      return false;
    }
  };

  // Save verified horses to localStorage whenever horses state changes
  useEffect(() => {
    try {
      // Check for expired data first
      checkAndClearExpiredData();
      
      // Only save horses that have data and have been verified
      const horsesToSave = horses.filter(horse => 
        horse.verified && horse.horse_name && horse.track_name
      );
      
      if (horsesToSave.length > 0) {
        // Save with current timestamp for expiration checking
        const storedData: StoredHorseData = {
          horses: horses, // Save all horses, not just verified ones, to maintain positions
          timestamp: Date.now()
        };
        
        localStorage.setItem(VERIFIED_HORSES_STORAGE_KEY, JSON.stringify(storedData));
        console.log('Saved horses to localStorage with expiration:', storedData);
      }
    } catch (error) {
      console.error('Error saving verified horses to localStorage:', error);
    }
  }, [horses]);

  // Handle form input changes
  const handleFormChange = (field: string, value: string) => {
    // For stake field, only allow numbers and decimal points
    if (field === 'stake') {
      // Replace any non-numeric and non-decimal characters
      const numericValue = value.replace(/[^0-9.]/g, '');
      // Ensure only one decimal point
      const parts = numericValue.split('.');
      if (parts.length > 2) {
        value = parts[0] + '.' + parts.slice(1).join('');
      } else {
        value = numericValue;
      }
    }
    
      setFormData(prev => ({
        ...prev,
      [field]: value
      }));
  };

  // Handle checkbox changes
  const handleCheckboxChange = (field: string, checked: boolean) => {
      setFormData(prev => ({
        ...prev,
      [field]: checked
    }));
  };

  // Handle horse data changes
  const handleHorseChange = (index: number, field: string, value: string) => {
    const updatedHorses = [...horses];
    
    // If the field is a boolean, handle it specially
    if (field === 'manual_entry') {
      updatedHorses[index] = {
        ...updatedHorses[index],
        manual_entry: value === 'true',
        verified: field === 'manual_entry' && value === 'true' ? true : updatedHorses[index].verified
      };
    } else {
      // For string fields, update directly but don't reset verification status for race_date changes
      const shouldResetVerification = field !== 'race_date';
        
        updatedHorses[index] = {
          ...updatedHorses[index],
        [field]: value,
        verified: shouldResetVerification ? false : updatedHorses[index].verified
      };
    }
    
    // Direct state update to minimize re-renders and prevent focus loss
    setHorses(updatedHorses);
    
    // Clear any existing timeout to implement proper debounce
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    
    // Save to localStorage less frequently to reduce re-renders
    // Use a debounce approach to save only after user has finished typing
    saveTimeoutRef.current = setTimeout(() => {
      try {
        localStorage.setItem(VERIFIED_HORSES_STORAGE_KEY, JSON.stringify({
          horses: updatedHorses,
          timestamp: Date.now()
        }));
      } catch (e) {
        console.error('Error saving horses to localStorage:', e);
      }
      saveTimeoutRef.current = null;
    }, 500); // Debounce for 500ms
  };

  // Create a memoized function for mini horse form changes to prevent unnecessary re-renders
  const handleMiniHorseChange = useCallback((index: number, field: string, value: string, fieldId: string) => {
    // Update focused field ID to make sure we maintain focus
    setFocusedFieldId(fieldId);
    
    setHorses(prevHorses => {
      // Don't update state if value hasn't changed - prevents unnecessary re-renders
      if (prevHorses[index][field as keyof HorseData] === value) {
        return prevHorses;
      }
      
      const updatedHorses = [...prevHorses];
      
      // If the field is a boolean, handle it specially
      if (field === 'manual_entry') {
        updatedHorses[index] = {
          ...updatedHorses[index],
          manual_entry: value === 'true',
          verified: field === 'manual_entry' && value === 'true' ? true : updatedHorses[index].verified
        };
      } else {
        // For string fields, update directly but don't reset verification status for race_date changes
        const shouldResetVerification = field !== 'race_date';
        
        updatedHorses[index] = {
          ...updatedHorses[index],
          [field]: value,
          verified: shouldResetVerification ? false : updatedHorses[index].verified
        } as HorseData;
      }
      
      // Clear any existing timeout to implement proper debounce
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Save to localStorage less frequently to reduce re-renders
      // Use a debounce approach to save only after user has finished typing
      saveTimeoutRef.current = setTimeout(() => {
        try {
          localStorage.setItem(VERIFIED_HORSES_STORAGE_KEY, JSON.stringify({
            horses: updatedHorses,
            timestamp: Date.now()
          }));
        } catch (e) {
          console.error('Error saving horses to localStorage:', e);
        }
        saveTimeoutRef.current = null;
      }, 500); // Debounce for 500ms
      
      return updatedHorses;
    });
  }, []);

  // Verify horse data
  const handleVerifyHorseData = async (index: number) => {
    try {
      // Show verification in progress
    setVerifying(prev => [...prev, index]);
    setVerificationStatus({ status: 'pending', message: 'Verifying horse data...' });
    setError(null);

      const horse = horses[index];
      
      // Format the date in YYYY-MM-DD format for the API
      const formattedDate = formatDateForDisplay(horse.race_date);
      
      // Call the verification API
      const response = await fetch('/api/verify-horse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          horse_name: horse.horse_name,
          track_name: horse.track_name,
          race_number: horse.race_number,
          race_date: formattedDate
        }),
      });
      
      // Parse the response
      const data = await response.json();
      
      // Check if verification was successful
      if (!response.ok) {
        throw new Error(data.error || 'Error verifying horse');
      }
      
      if (data.isVerified && data.horse) {
        // Update the horse data with verified information
        const updatedHorses = [...horses];
        
        // Process race location - determine if UK or USA
        const raceLocation = isUKTrack(data.horse.track_name) ? 'UK' : 'USA';
        
        // Extract a proper race number (1-10) from the time-based race number
        let raceNumber = horse.race_number;
        if (data.horse.race_number && data.horse.race_number.includes(':')) {
          // For now, we'll keep the original value but in production we would determine the actual race number
          raceNumber = data.horse.race_number;
        }
        
        updatedHorses[index] = {
          ...data.horse,
          verified: true,
          odds: horse.odds || data.horse.morning_line_odds || '', // Preserve existing odds if entered
          manual_entry: false,
          race_location: raceLocation, // Add race location
          race_number: raceNumber // Use processed race number
        };
        
        setHorses(updatedHorses);
        setVerificationStatus({ status: 'success', message: 'Horse verified successfully' });
        
        // Save verified horse data to localStorage
        saveHorsesToLocalStorage(updatedHorses);
      } else {
        // No match found
        setVerificationStatus({
          status: 'error',
          message: data.errorMessage || 'No matching horse found' 
        });
      }
    } catch (error) {
      console.error('Verification error:', error);
        setVerificationStatus({
          status: 'error',
        message: error instanceof Error ? error.message : 'Error verifying horse data' 
        });
    } finally {
      // Remove the horse from the verifying list
        setVerifying(prev => prev.filter(i => i !== index));
    }
  };

  // Handle removing a horse from the form
  const handleRemoveHorse = (index: number) => {
    if (horses.length <= 1) {
      console.warn('Cannot remove the only horse');
      return;
    }

    if (index >= 0 && index < horses.length) {
      const updatedHorses = [...horses];
      updatedHorses.splice(index, 1);
      setHorses(updatedHorses);

      // Adjust bet type if needed based on new horse count
      const currentBetType = formData.bet_type as keyof typeof betTypeHorseCount;
      const requiredHorses = betTypeHorseCount[currentBetType] || 1;
      
      if (updatedHorses.length < requiredHorses) {
        // Find a bet type that matches the new horse count
        const newBetType = Object.entries(betTypeHorseCount).find(
          ([_, count]) => count === updatedHorses.length
        )?.[0] || 'single';
        
        setFormData({
          ...formData,
          bet_type: newBetType
        });
      }

      // Save updated horses to localStorage
      saveHorsesToLocalStorage(updatedHorses);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    console.log('[handleSubmit] Function entered.'); 
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    console.log('------ [CLIENT] BET SUBMISSION STARTED ------');
    console.log('[CLIENT] Current Form data:', JSON.stringify(formData));
    console.log('[CLIENT] Current Horses data:', JSON.stringify(horses));
    console.log('[CLIENT] Current User ID:', userId);
    
    try {
      console.log('[CLIENT] Starting form field validation...');
      // Validate required form fields with specific messages
      const missingFormFields = [];
      if (!formData.stake) missingFormFields.push("Stake");
      
      if (missingFormFields.length > 0) {
        const errorMsg = `Missing required form field(s): ${missingFormFields.join(", ")}`;
        console.error('[CLIENT] Form field validation failed:', errorMsg);
        throw new Error(errorMsg);
      }
      console.log('[CLIENT] Form field validation passed.');
      
      console.log('[CLIENT] Starting horse data validation...');
      // Validate each horse's required fields
      const invalidHorses = [];
      
      // Ensure horses state is an array before looping
      if (!Array.isArray(horses)) {
        console.error('[CLIENT] Invalid state: horses is not an array:', horses);
        throw new Error('Internal error: Horse data is corrupted.');
      }

      // Validate each horse's information
      for (let i = 0; i < horses.length; i++) {
        const horse = horses[i];
        const horseLabel = `Horse ${i + 1} (${horse.horse_name || 'unnamed'})`;
        
        if (!horse.horse_name) {
          invalidHorses.push(`${horseLabel}: Missing horse name`);
        }
        
        if (!horse.track_name) {
          invalidHorses.push(`${horseLabel}: Missing track name`);
        }
        
        if (!horse.race_date) {
          invalidHorses.push(`${horseLabel}: Missing race date`);
        }
        
        if (!horse.odds) {
          invalidHorses.push(`${horseLabel}: Missing odds`);
        }
        
        // Verify the horse data is either verified or marked as manual entry
        if (!horse.verified && !horse.manual_entry) {
          invalidHorses.push(`${horseLabel}: Not verified and not marked as manual entry`);
        }
      }
      
      if (invalidHorses.length > 0) {
        const errorMsg = `Invalid horse data:\n${invalidHorses.join("\n")}`;
        console.error('[CLIENT] Horse data validation failed:', errorMsg);
        throw new Error(errorMsg);
      }
      console.log('[CLIENT] Horse data validation passed.');
      
      // Ensure we have the right number of horses for the bet type
      const betTypeKey = formData.bet_type as keyof typeof betTypeHorseCount;
      const requiredHorses = betTypeHorseCount[betTypeKey] || 1;
      
      if (horses.length < requiredHorses) {
        const errorMsg = `Bet type "${formData.bet_type}" requires ${requiredHorses} horses, but only ${horses.length} horses provided.`;
        console.error('[CLIENT] Bet type validation failed:', errorMsg);
        throw new Error(errorMsg);
      }
      console.log('[CLIENT] Bet type validation passed.');
      
      try {
        const requestBody = {
          userId,
          formData,
          horses
        };
        
        console.log('[CLIENT] Sending API request with data:', {
          userId,
          formData: JSON.stringify(formData),
          horsesCount: horses.length
        });
        
        // Use fetch API to call our Next.js API endpoint
        const response = await fetch('/api/submit-bet', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });
        
        console.log('[CLIENT] API response status:', response.status);
        
        // Parse the response JSON
        const result = await response.json();
        
        console.log('[CLIENT] API response data:', result);
        
        if (!result.success) {
          console.error('[CLIENT] Bet submission failed according to API:', result.error);
          console.error('[CLIENT] API failure details:', result.details || 'No details provided');
          throw new Error(result.error || 'Failed to save bet');
      }
      
      // Show success message
        console.log('[CLIENT] Bet saved successfully!', result.data);
      setSuccess('Bet saved successfully!');
        
        // Clear localStorage after successful submission - redundant as the service also does this,
        // but keeping as a safeguard
        localStorage.removeItem(VERIFIED_HORSES_STORAGE_KEY);
      
      // Reset form
      setFormData({
          bet_type: 'single',
        each_way: false,
        stake: '',
        odds: '',
          bookmaker: '',
          model_tipster: '',
          promotion_used: false,
          notes: '',
        });
        
        setHorses([
          {
            horse_name: '',
            track_name: '',
            race_number: '',
            race_date: 'today',
            jockey: '',
            trainer: '',
            race_class: '',
            race_distance: '',
            manual_entry: false,
            verified: false,
            odds: ''
          }
        ]);
        
        // Call onSave callback if provided
        if (onSave) {
          console.log('[CLIENT] Calling onSave callback...');
          onSave();
        }
      } catch (submissionError) {
        console.error('[CLIENT] Error occurred during the API call:', submissionError);
        if (submissionError instanceof Error) {
          throw submissionError; // Re-throw the original error
        } else {
          // Wrap non-Error objects
          throw new Error(`Bet submission failed: ${JSON.stringify(submissionError)}`);
        }
      }
    } catch (error) {
      // This is the main catch block for handleSubmit
      console.error('[CLIENT] Error occurred during handleSubmit:', error);
      // Ensure the error message is a string before setting
      const displayError = error instanceof Error ? error.message : 'An unexpected error occurred during submission';
      setError(displayError);
    } finally {
      console.log('------ [CLIENT] BET SUBMISSION COMPLETED ------');
      setIsLoading(false);
    }
  };

  // Handle cancel button - clear localStorage and close form
  const handleCancel = () => {
    // Clear any saved horse data
    localStorage.removeItem(VERIFIED_HORSES_STORAGE_KEY);
    onClose();
  };

  // Calculate the position of the main form based on bet type
  const getMainFormPosition = () => {
    const horseCount = betTypeHorseCount[formData.bet_type as keyof typeof betTypeHorseCount] || 1;
    
    if (horseCount === 1) {
      return 'justify-center'; // Center the form for single bets
    } else {
      return 'justify-start'; // Left-align for multiple bets
    }
  };

  // Calculate the container layout based on bet type
  const getContainerLayout = () => {
    if (formData.bet_type === 'single') {
      return {
        overlay: `fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm`,
        container: `w-full max-w-4xl max-h-[90vh] overflow-y-auto ${getCardBg()} rounded-xl shadow-xl ${getBorderColor()} border relative`
      };
    } else {
      // Multi bet - Wide layout
      return {
        overlay: `fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm`,
        container: `w-full max-w-6xl max-h-[90vh] overflow-y-auto ${getCardBg()} rounded-xl shadow-xl ${getBorderColor()} border relative`
      };
    }
  };

  // Component for mini horse form - memoized to prevent unnecessary re-renders
  const MiniHorseForm = memo(({ index, horse }: { index: number; horse: HorseData }) => {
    const isVerifying = verifying.includes(index);
    const displayDate = formatDateForDisplay(horse.race_date);
    
    // Create stable IDs for all input fields
    const horseNameId = `horse_name_${index}`;
    const trackNameId = `track_name_${index}`;
    const raceNumberId = `race_number_${index}`;
    const raceDateId = `race_date_${index}`;
    const horseOddsId = `horse_odds_${index}`;
    const manualEntryId = `manual_entry_${index}`;
    
    // Get refs for all input fields
    const horseNameRef = getInputRef(horseNameId);
    const trackNameRef = getInputRef(trackNameId);
    const raceNumberRef = getInputRef(raceNumberId);
    const raceDateRef = getInputRef(raceDateId);
    const horseOddsRef = getInputRef(horseOddsId);

  return (
      <div className="bg-white rounded-lg shadow-md border border-slate-200 w-full max-h-[310px] overflow-hidden">
        {/* More compact header with verification status */}
        <div className="bg-slate-800 px-2 py-1 rounded-t-lg flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center">
            <h3 className="font-bold text-white text-xs mr-2">Horse {index + 1}</h3>
            
            {/* Show verification status in the header */}
            {horse.verified && (
              <span className="text-xs text-green-300 flex items-center">
                <Check size={10} className="mr-1" />
                Verified
              </span>
            )}
            
            {/* Show verification in progress */}
            {isVerifying && (
              <span className="text-xs text-blue-300 flex items-center">
                <div className="animate-spin h-2 w-2 mr-1 border-2 border-blue-300 border-t-transparent rounded-full"></div>
                Verifying...
              </span>
            )}
            
            {/* Show error status */}
            {verificationStatus.status === 'error' && !isVerifying && !horse.verified && (
              <span className="text-xs text-red-300">Failed</span>
            )}
          </div>
          
          <label className="inline-flex items-center cursor-pointer">
            <input 
              type="checkbox" 
              id={manualEntryId}
              name="manual_entry"
              checked={horse.manual_entry}
              onChange={(e) => handleMiniHorseChange(index, 'manual_entry', e.target.checked ? 'true' : 'false', manualEntryId)}
              className="form-checkbox h-3 w-3 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
            />
            <span className="ml-1 text-xs font-medium text-slate-200">Manual</span>
          </label>
        </div>
        
        {/* More compact body - Fixed height with hidden overflow */}
        <div className="p-2 space-y-1.5">
          {/* Horse and Track in one row */}
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label htmlFor={horseNameId} className="block text-xs font-medium text-slate-700 mb-0.5">
                Horse <span className="text-red-500">*</span>
              </label>
              <input
                ref={horseNameRef}
                type="text"
                id={horseNameId}
                name="horse_name"
                value={horse.horse_name}
                onChange={(e) => handleMiniHorseChange(index, 'horse_name', e.target.value, horseNameId)}
                onFocus={() => handleInputFocus(horseNameId)}
                onBlur={handleInputBlur}
                placeholder="e.g. Red Rum"
                className={`w-full px-1.5 py-0.5 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs
                  ${horse.horse_name ? '' : 'border-yellow-300 bg-yellow-50'} 
                  ${horse.verified ? 'border-green-300 bg-green-50' : ''}
                `}
                required
              />
            </div>
            
            <div>
              <label htmlFor={trackNameId} className="block text-xs font-medium text-slate-700 mb-0.5">
                Track <span className="text-red-500">*</span>
              </label>
              <input
                ref={trackNameRef}
                type="text"
                id={trackNameId}
                name="track_name"
                value={horse.track_name}
                onChange={(e) => handleMiniHorseChange(index, 'track_name', e.target.value, trackNameId)}
                onFocus={() => handleInputFocus(trackNameId)}
                onBlur={handleInputBlur}
                placeholder="e.g. Ascot"
                className={`w-full px-1.5 py-0.5 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs
                  ${horse.track_name ? '' : 'border-yellow-300 bg-yellow-50'} 
                `}
                required
              />
            </div>
          </div>
          
          {/* Race # and Date in one row */}
          <div className="grid grid-cols-2 gap-1.5">
            <div>
              <label htmlFor={raceNumberId} className="block text-xs font-medium text-slate-700 mb-0.5">
                Race #
              </label>
              <input
                ref={raceNumberRef}
                type="text"
                id={raceNumberId}
                name="race_number"
                value={horse.race_number}
                onChange={(e) => handleMiniHorseChange(index, 'race_number', e.target.value, raceNumberId)}
                onFocus={() => handleInputFocus(raceNumberId)}
                onBlur={handleInputBlur}
                placeholder="#"
                className="w-full px-1.5 py-0.5 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
              />
            </div>
            
            <div>
              <label htmlFor={raceDateId} className="block text-xs font-medium text-slate-700 mb-0.5">
                Date <span className="text-red-500">*</span>
              </label>
              <input
                ref={raceDateRef}
                type="date"
                id={raceDateId}
                name="race_date"
                value={displayDate}
                onChange={(e) => handleMiniHorseChange(index, 'race_date', e.target.value, raceDateId)}
                onFocus={() => handleInputFocus(raceDateId)}
                onBlur={handleInputBlur}
                className="w-full px-1.5 py-0.5 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                required
              />
            </div>
            </div>
            
          {/* Odds field for this horse */}
          <div>
            <label htmlFor={horseOddsId} className="block text-xs font-medium text-slate-700 mb-0.5">
                Odds <span className="text-red-500">*</span>
              </label>
              <input
              ref={horseOddsRef}
                type="text"
              id={horseOddsId}
              name={`horse_odds_${index}`}
              value={horse.odds || ''}
              onChange={(e) => handleMiniHorseChange(index, 'odds', e.target.value, horseOddsId)}
              onFocus={() => handleInputFocus(horseOddsId)}
              onBlur={handleInputBlur}
              placeholder="e.g. 6/4 or 2.5"
                className="w-full px-1.5 py-0.5 border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                required
              />
          </div>
          
          {/* Verify Button (without Remove button) */}
          <div className="pt-0.5">
          <button
            type="button"
            onClick={() => handleVerifyHorseData(index)}
            disabled={isVerifying || horse.manual_entry}
              className="w-full py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md shadow-sm transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            {isVerifying ? (
              <>
                <span className="mr-1">Verifying...</span>
                  <div className="animate-spin h-2 w-2 border-2 border-white border-t-transparent rounded-full"></div>
              </>
            ) : (
                <span>Verify Data</span>
            )}
          </button>
            </div>
        </div>
      </div>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison function for memo to prevent unnecessary re-renders
    const prevHorse = prevProps.horse;
    const nextHorse = nextProps.horse;
    
    // Only re-render if the horse data has actually changed
    return (
      prevHorse.horse_name === nextHorse.horse_name &&
      prevHorse.track_name === nextHorse.track_name &&
      prevHorse.race_number === nextHorse.race_number &&
      prevHorse.race_date === nextHorse.race_date &&
      prevHorse.odds === nextHorse.odds &&
      prevHorse.manual_entry === nextHorse.manual_entry &&
      prevHorse.verified === nextHorse.verified &&
      prevProps.index === nextProps.index
    );
  });
  
  // Add display name for debugging purposes
  MiniHorseForm.displayName = 'MiniHorseForm';

  // Save horses to localStorage
  const saveHorsesToLocalStorage = (horsesData: HorseData[]) => {
    try {
      localStorage.setItem(VERIFIED_HORSES_STORAGE_KEY, JSON.stringify({
        horses: horsesData,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error('Error saving horses to localStorage:', e);
    }
  };

  // Function to add a new horse to the form
  const handleAddHorse = () => {
    // Make a copy of the current horses array
    const updatedHorses = [...horses];
    
    // Add a new empty horse to the array
    updatedHorses.push({
      horse_name: '',
      track_name: '',
      race_number: '',
      race_date: formatDateForStorage(new Date().toISOString()),
      jockey: '',
      trainer: '',
      race_class: '',
      race_distance: '',
      manual_entry: false,
      verified: false,
      odds: ''
    });
    
    // Update the state
    setHorses(updatedHorses);
    
    // Save to localStorage
    saveHorsesToLocalStorage(updatedHorses);
  };

  const { theme } = useTheme();
  
  // Add theme-specific styles
  const getCardBg = () => theme === 'dark' ? 'bg-gray-800' : theme === 'racing' ? 'bg-charcoal-800' : 'bg-white';
  const getHeaderBg = () => theme === 'dark' ? 'bg-gray-900' : theme === 'racing' ? 'bg-charcoal-700' : 'bg-slate-100';
  const getBorderColor = () => theme === 'dark' ? 'border-gray-700' : theme === 'racing' ? 'border-charcoal-700' : 'border-gray-200';
  const getTextColor = () => theme === 'dark' || theme === 'racing' ? 'text-white' : 'text-gray-900';
  const getMutedTextColor = () => theme === 'dark' ? 'text-gray-400' : theme === 'racing' ? 'text-gray-300' : 'text-gray-500';
  const getInputBg = () => theme === 'dark' ? 'bg-gray-700 border-gray-600' : theme === 'racing' ? 'bg-charcoal-700 border-charcoal-600' : 'bg-white border-gray-300';
  const getInputTextColor = () => theme === 'dark' || theme === 'racing' ? 'text-white' : 'text-gray-700';
  const getButtonBg = () => theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : theme === 'racing' ? 'bg-charcoal-700 hover:bg-charcoal-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700';
  const getPrimaryButtonBg = () => theme === 'racing' ? 'bg-racing-600 hover:bg-racing-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white';
  const getSuccessBg = () => theme === 'dark' ? 'bg-green-900 text-green-200' : theme === 'racing' ? 'bg-green-900 text-green-200' : 'bg-green-50 text-green-700';
  const getErrorBg = () => theme === 'dark' ? 'bg-red-900 text-red-200' : theme === 'racing' ? 'bg-red-900 text-red-200' : 'bg-red-50 text-red-700';

  const { overlay, container } = getContainerLayout();
  
  return (
    <div className={overlay}>
      <div className={container}>
        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Modal Header */}
          <div className={`${getHeaderBg()} ${getBorderColor()} border-b px-4 py-3 flex justify-between items-center sticky top-0 z-10`}>
            <div className="font-medium flex items-center">
              <span className={`inline-block w-2.5 h-2.5 rounded-full mr-2 ${horses[0].manual_entry ? 'bg-amber-500' : 'bg-green-600'}`}></span>
              <span className={`${getTextColor()} text-sm`}>{horses[0].manual_entry ? 'Manual Entry Mode' : 'Auto-Match Mode'}</span>
            </div>
          <button
              type="button"
              onClick={() => handleHorseChange(0, 'manual_entry', horses[0].manual_entry ? 'false' : 'true')}
              className={`text-blue-600 hover:text-blue-800 text-xs font-medium focus:outline-none focus:underline transition-colors`}
            >
              {horses[0].manual_entry ? 'Switch to Auto-Match' : 'Switch to Manual Entry'}
          </button>
        </div>
        
          <div className="p-4 space-y-4">
            {/* Alert Messages */}
          {error && (
              <div className={`${getErrorBg()} border-l-4 border-red-500 p-3 rounded-md`}>
                <div className="flex items-start">
                  <AlertCircle className="h-4 w-4 mr-2 mt-0.5 text-red-500" />
                  <span className="text-sm font-medium">{error}</span>
                    </div>
            </div>
          )}
          
          {success && (
              <div className={`${getSuccessBg()} border-l-4 border-green-500 p-3 rounded-md`}>
                <div className="flex items-start">
                  <Check className="h-4 w-4 mr-2 mt-0.5 text-green-500" />
                  <span className="text-sm font-medium">{success}</span>
                    </div>
            </div>
          )}
          
            {/* Horse Information Section */}
            <div className={`${getBorderColor()} border rounded-md`}>
              <div className={`${getHeaderBg()} ${getBorderColor()} border-b px-4 py-2 flex justify-between items-center`}>
                <h3 className={`text-sm font-medium ${getTextColor()}`}>Horse Information</h3>
                <span className={`text-xs ${getMutedTextColor()}`}>{`${horses.length} horse${horses.length !== 1 ? 's' : ''} selected`}</span>
                  </div>
                  
              <div className="p-3 space-y-4">
                {horses.map((horse, index) => (
                  <div key={index} className={`${getBorderColor()} border rounded-md p-3 relative`}>
                    {horses.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveHorse(index)}
                        className={`absolute top-2 right-2 text-red-500 hover:text-red-700 focus:outline-none`}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                    
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className={`block text-xs font-medium ${getMutedTextColor()} mb-1`}>
                            Horse Name*
                        </label>
                        <div className="relative">
                  <input
                    type="text"
                              value={horse.horse_name}
                              onChange={(e) => handleHorseChange(index, 'horse_name', e.target.value)}
                              className={`w-full px-3 py-2 ${getInputBg()} ${getInputTextColor()} text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                              placeholder="Enter horse name"
                              required
                              ref={getInputRef(`horse_name_${index}`)}
                              onFocus={() => setFocusedFieldId(`horse_name_${index}`)}
                            />
                        </div>
                </div>
                
                        <div>
                          <label className={`block text-xs font-medium ${getMutedTextColor()} mb-1`}>
                            Track Name*
                        </label>
                  <input
                    type="text"
                            value={horse.track_name}
                            onChange={(e) => handleHorseChange(index, 'track_name', e.target.value)}
                            className={`w-full px-3 py-2 ${getInputBg()} ${getInputTextColor()} text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="Enter track name"
                            required
                            ref={getInputRef(`track_name_${index}`)}
                            onFocus={() => setFocusedFieldId(`track_name_${index}`)}
                          />
                      </div>
                    </div>
                    
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div>
                          <label className={`block text-xs font-medium ${getMutedTextColor()} mb-1`}>
                            Race Number
                        </label>
                        <input
                          type="text"
                            value={horse.race_number}
                            onChange={(e) => handleHorseChange(index, 'race_number', e.target.value)}
                            className={`w-full px-3 py-2 ${getInputBg()} ${getInputTextColor()} text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="e.g., 3"
                            ref={getInputRef(`race_number_${index}`)}
                            onFocus={() => setFocusedFieldId(`race_number_${index}`)}
                        />
                      </div>
                      
                        <div>
                          <label className={`block text-xs font-medium ${getMutedTextColor()} mb-1`}>
                            Race Date*
                        </label>
                        <input
                          type="date"
                            value={formatDateForDisplay(horse.race_date)}
                            onChange={(e) => {
                              const dateForStorage = formatDateForStorage(e.target.value);
                              handleHorseChange(index, 'race_date', dateForStorage);
                            }}
                            className={`w-full px-3 py-2 ${getInputBg()} ${getInputTextColor()} text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    required
                            ref={getInputRef(`race_date_${index}`)}
                            onFocus={() => setFocusedFieldId(`race_date_${index}`)}
                  />
                </div>
                
                        <div>
                          <label className={`block text-xs font-medium ${getMutedTextColor()} mb-1`}>
                            Odds*
                        </label>
                        <input
                          type="text"
                            value={horse.odds}
                            onChange={(e) => handleHorseChange(index, 'odds', e.target.value)}
                            className={`w-full px-3 py-2 ${getInputBg()} ${getInputTextColor()} text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            placeholder="e.g., 2.5"
                          required
                            ref={getInputRef(`odds_${index}`)}
                            onFocus={() => setFocusedFieldId(`odds_${index}`)}
                        />
                      </div>
                    </div>
                    
                      {!horse.manual_entry && (
                        <div className="flex justify-end">
                    <button
                      type="button"
                            onClick={() => handleVerifyHorseData(index)}
                            disabled={verifying.includes(index) || !horse.horse_name || !horse.track_name}
                            className={`text-sm px-4 py-1.5 rounded-md ${
                              horse.verified 
                                ? 'bg-green-500 hover:bg-green-600 text-white' 
                                : (getPrimaryButtonBg())
                            } disabled:opacity-50 disabled:cursor-not-allowed flex items-center`}
                    >
                            {verifying.includes(index) ? (
                        <>
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                                Verifying...
                              </>
                            ) : horse.verified ? (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                Verified
                        </>
                      ) : (
                        <>
                                <Search className="h-4 w-4 mr-1" />
                                Verify Horse
                        </>
                      )}
                    </button>
                      </div>
                    )}
                      
                      {/* Show verification details if needed */}
                      {horse.verified && horse.verification_details && (
                        <div className={`text-xs mt-2 ${getSuccessBg()} p-2 rounded`}>
                          {horse.verification_details}
                  </div>
                      )}
                      </div>
                      </div>
                ))}
                
                {/* Add Horse button */}
                  <button
                    type="button"
                  onClick={handleAddHorse}
                  className={`w-full ${getButtonBg()} border ${getBorderColor()} px-4 py-2 text-sm rounded-md flex items-center justify-center`}
                >
                  + Add Another Horse
                  </button>
                </div>
            </div>
            
            {/* Bet Details Section */}
            <div className={`${getBorderColor()} border rounded-md`}>
              <div className={`${getHeaderBg()} ${getBorderColor()} border-b px-4 py-2`}>
                <h3 className={`text-sm font-medium ${getTextColor()}`}>Bet Details</h3>
          </div>
              
              <div className="p-3 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-medium ${getMutedTextColor()} mb-1`}>
                      Bet Type*
                    </label>
                    <select
                      value={formData.bet_type}
                      onChange={(e) => handleFormChange('bet_type', e.target.value)}
                      className={`w-full px-3 py-2 ${getInputBg()} ${getInputTextColor()} text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      required
                    >
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
                
                  <div>
                    <label className={`block text-xs font-medium ${getMutedTextColor()} mb-1`}>
                      Stake*
                          </label>
                            <input
                      type="number"
                      value={formData.stake}
                      onChange={(e) => handleFormChange('stake', e.target.value)}
                      className={`w-full px-3 py-2 ${getInputBg()} ${getInputTextColor()} text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="Enter stake amount"
                      step="0.01"
                      min="0"
                      required
                    />
                          </div>
                        </div>
                        
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={`block text-xs font-medium ${getMutedTextColor()} mb-1`}>
                      Bookmaker
                          </label>
                            <input
                              type="text"
                      value={formData.bookmaker}
                      onChange={(e) => handleFormChange('bookmaker', e.target.value)}
                      className={`w-full px-3 py-2 ${getInputBg()} ${getInputTextColor()} text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="Enter bookmaker name"
                    />
                        </div>
                        
                  <div>
                    <label className={`block text-xs font-medium ${getMutedTextColor()} mb-1`}>
                      Model/Tipster
                            </label>
                            <input
                              type="text"
                      value={formData.model_tipster}
                      onChange={(e) => handleFormChange('model_tipster', e.target.value)}
                      className={`w-full px-3 py-2 ${getInputBg()} ${getInputTextColor()} text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      placeholder="Enter model or tipster name"
                            />
                          </div>
                  </div>
                          
                <div className="flex items-center space-x-3">
                          <label className="inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.each_way}
                              onChange={(e) => handleCheckboxChange('each_way', e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className={`w-9 h-5 ${theme === 'dark' ? 'bg-gray-700' : theme === 'racing' ? 'bg-charcoal-700' : 'bg-gray-200'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] ${theme === 'dark' || theme === 'racing' ? 'after:bg-gray-300' : 'after:bg-white'} after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${theme === 'racing' ? 'peer-checked:bg-racing-600' : 'peer-checked:bg-blue-600'} relative`}></div>
                    <span className={`ml-2 text-sm ${getTextColor()}`}>Each Way</span>
                    </label>
                
                  <label className="inline-flex items-center cursor-pointer">
                      <input
                      type="checkbox" 
                      checked={formData.promotion_used}
                      onChange={(e) => handleCheckboxChange('promotion_used', e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className={`w-9 h-5 ${theme === 'dark' ? 'bg-gray-700' : theme === 'racing' ? 'bg-charcoal-700' : 'bg-gray-200'} peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] ${theme === 'dark' || theme === 'racing' ? 'after:bg-gray-300' : 'after:bg-white'} after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all ${theme === 'racing' ? 'peer-checked:bg-racing-600' : 'peer-checked:bg-blue-600'} relative`}></div>
                    <span className={`ml-2 text-sm ${getTextColor()}`}>Used Promotion</span>
                            </label>
                </div>
                          </div>
                        </div>
                        
            {/* Notes Section */}
            <div className={`${getBorderColor()} border rounded-md`}>
              <div className={`${getHeaderBg()} ${getBorderColor()} border-b px-4 py-2`}>
                <h3 className={`text-sm font-medium ${getTextColor()}`}>Additional Notes</h3>
              </div>
              
              <div className="p-3">
                          <textarea
                            value={formData.notes}
                            onChange={(e) => handleFormChange('notes', e.target.value)}
                  className={`w-full px-3 py-2 ${getInputBg()} ${getInputTextColor()} text-sm rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  placeholder="Add any additional notes about this bet"
                  rows={3}
                  />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center justify-end space-x-3 pt-2">
                      <button
                        type="button"
                        onClick={handleCancel}
                className={`px-4 py-2 border ${getBorderColor()} text-sm rounded-md ${getButtonBg()}`}
                      >
                        Cancel
                      </button>
                      
              <button
                type="submit"
                disabled={isLoading}
                className={`px-4 py-2 text-sm rounded-md text-white ${getPrimaryButtonBg()} flex items-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? (
                          <>
                    <span className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></span>
                    Saving...
                          </>
                        ) : (
                          <>
                    <Save className="h-4 w-4 mr-1" />
                    Save Bet
                          </>
                )}
              </button>
            </div>
            </div>
          </form>
        </div>
    </div>
  );
} 