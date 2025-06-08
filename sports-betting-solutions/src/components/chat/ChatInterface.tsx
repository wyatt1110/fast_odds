'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { parseBetFromMessage, saveParsedBet, ParsedBet } from '@/lib/ai/bet-parser';
import { routeToAI } from '@/lib/ai/router';
import { getCurrentUser } from '@/lib/supabase/client';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp?: string;
}

interface ChatInterfaceProps {
  initialMessages?: Message[];
}

interface BetConfirmationProps {
  isOpen: boolean;
  parsedBet: ParsedBet | null;
  onClose: () => void;
  onConfirm: () => void;
  error: string | null;
  isLoading: boolean;
}

// Define a type for the saved bet result that includes ID
interface SavedBet {
  id?: string;
  bet_id?: string;
  user_id: string;
  track_name: string;
  horse_name: string;
  race_date: string;
  bet_type: string;
  stake: number;
  odds: number;
  status: string;
  // ... other optional fields
  [key: string]: any;
}

export default function ChatInterface({ initialMessages = [] }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [parsedBet, setParsedBet] = useState<ParsedBet | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Fetch the current user on mount
  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUser();
      if (user && user.id) {
        setUserId(user.id);
        if (user.email) {
          setUserEmail(user.email);
        }
      } else {
        // Redirect to login if no user
        router.push('/login');
      }
    };
    
    fetchUser();
  }, [router]);

  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /**
   * Handle the submit of a new message
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (inputValue.trim() === '' || isLoading || !userId) return;
    
    const newMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: inputValue,
      timestamp: new Date().toISOString(),
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      // Check if the message looks like a bet - expanded keywords for better detection
      const betKeywords = [
        'bet', 'wager', 'stake', 'punt', 'back', 'place', 'each way', 'e/w', 
        'odds', 'evens', 'put $', 'put £', 'win', 'going for', 'i like'
      ];
      
      const horseKeywords = [
        'horse', 'race', 'racing', 'track', 'jockey', 'trainer', 'runner'
      ];
      
      const trackKeywords = [
        'cheltenham', 'ascot', 'newmarket', 'epsom', 'doncaster', 'york', 'aintree',
        'kempton', 'newbury', 'sandown', 'haydock', 'lingfield', 'windsor', 'leicester',
        'huntingdon', 'musselburgh', 'wolverhampton', 'nottingham', 'warwick'
      ];
      
      // Check if the message has betting intent keywords
      const hasBetKeywords = betKeywords.some(keyword => 
        inputValue.toLowerCase().includes(keyword.toLowerCase())
      );
      
      // Check if the message has horse racing keywords
      const hasHorseKeywords = horseKeywords.some(keyword => 
        inputValue.toLowerCase().includes(keyword.toLowerCase())
      );
      
      // Check if the message mentions specific tracks
      const hasTrackKeywords = trackKeywords.some(keyword => 
        inputValue.toLowerCase().includes(keyword.toLowerCase())
      );
      
      // Detect bet with higher confidence - needs both betting intent AND (horse racing terms OR specific tracks)
      const probablyABet = hasBetKeywords && (hasHorseKeywords || hasTrackKeywords);
      
      console.log('Bet detection:', { 
        hasBetKeywords, 
        hasHorseKeywords, 
        hasTrackKeywords, 
        probablyABet 
      });
      
      // If it seems like a bet, try to parse it
      if (probablyABet) {
        console.log('Message detected as a betting request, attempting to parse...');
        
        try {
          const parsed = await parseBetFromMessage(inputValue, userId, userEmail || undefined);
          console.log('Parsed bet result:', parsed);
          
          // If we successfully parsed a bet with the required fields, show the confirmation
          if (parsed && parsed.track_name && parsed.horse_name && parsed.stake && parsed.odds) {
            console.log('Bet successfully parsed with all required fields, showing confirmation dialog');
            setParsedBet(parsed);
            setShowConfirmation(true);
            
            // Add a loading message while the AI response is being generated
            const loadingMessage: Message = {
              id: uuidv4(),
              role: 'assistant',
              content: "I'm processing your betting information. Please watch for the bet confirmation dialog that will appear shortly. You'll need to review the details and click 'Save Bet' to save it to the database.",
              timestamp: new Date().toISOString(),
            };
            
            setMessages(prev => [...prev, loadingMessage]);
            
            // Still generate a response but let the user know we're confirming the bet
            const result = await routeToAI(
              [...messages, newMessage],
              userId,
              {
                forceModel: 'deepseek',
                userEmail: userEmail || undefined
              }
            );
            
            if (result) {
              // Replace the loading message with the actual response
              const botMessage: Message = {
                id: uuidv4(),
          role: 'assistant', 
                content: result.response,
                timestamp: new Date().toISOString(),
              };
              
              setMessages(prev => {
                // Remove the loading message and add the real response
                const withoutLoading = prev.filter(msg => msg.id !== loadingMessage.id);
                return [...withoutLoading, botMessage];
              });
            }
            
            setIsLoading(false);
            return;
          } else {
            console.log('Bet parsing incomplete - missing required fields', {
              hasTrackName: Boolean(parsed?.track_name),
              hasHorseName: Boolean(parsed?.horse_name),
              hasStake: Boolean(parsed?.stake),
              hasOdds: Boolean(parsed?.odds)
            });
          }
    } catch (error) {
      console.error('Error parsing bet:', error);
          // Continue with normal AI response
        }
      }
      
      // Regular AI response
        const result = await routeToAI(
        [...messages, newMessage],
        userId,
        {
          forceModel: 'deepseek',
          userEmail: userEmail || undefined
        }
      );
      
      if (result) {
        const botMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: result.response,
          timestamp: new Date().toISOString(),
        };
        
        setMessages(prev => [...prev, botMessage]);
      }
    } catch (error) {
      console.error('Error in chat:', error);
      
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: 'Sorry, there was an error processing your message. Please try again.',
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle the rejection of a bet
   */
  const handleRejectBet = () => {
    setShowConfirmation(false);
    setParsedBet(null);
  };

  /**
   * Handle the confirmation of a bet
   */
  const handleConfirmBet = async () => {
    if (!parsedBet) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('Attempting to save bet with parsed data:', parsedBet);
      
      // Save the bet to Supabase with a type assertion to handle potential field differences
      const savedBet = await saveParsedBet(parsedBet, userId || '') as unknown as SavedBet;
      
      // Use the id or bet_id field depending on what's available
      const betId = savedBet.id || savedBet.bet_id || 'Saved';
      
      // Format confirmation message with emoji indicators for clarity
      let confirmationMessage = `✅ Your bet has been saved! (ID: ${betId})\n\n`;
      
      // Race details
      confirmationMessage += `🏟️ **Race Details**\n`;
      confirmationMessage += `- Track: ${parsedBet.track_name}\n`;
      
      if (parsedBet.race_number) {
        confirmationMessage += `- Race Number: ${parsedBet.race_number}\n`;
      }
      
      if (parsedBet.race_date) {
        confirmationMessage += `- Date: ${parsedBet.race_date}\n`;
      }
      
      if (parsedBet.scheduled_race_time) {
        confirmationMessage += `- Time: ${parsedBet.scheduled_race_time}\n`;
      }
      
      if (parsedBet.distance) {
        confirmationMessage += `- Distance: ${parsedBet.distance}\n`;
      }
      
      if (parsedBet.class_type) {
        confirmationMessage += `- Class/Type: ${parsedBet.class_type}\n`;
      }
      
      confirmationMessage += `\n🐎 **Horse Details**\n`;
      confirmationMessage += `- Horse: ${parsedBet.horse_name}\n`;
      
      if (parsedBet.jockey) {
        confirmationMessage += `- Jockey: ${parsedBet.jockey}\n`;
      }
      
      if (parsedBet.trainer) {
        confirmationMessage += `- Trainer: ${parsedBet.trainer}\n`;
      }
      
      if (parsedBet.post_position) {
        confirmationMessage += `- Post Position: ${parsedBet.post_position}\n`;
      }
      
      confirmationMessage += `\n💰 **Bet Details**\n`;
      confirmationMessage += `- Type: ${parsedBet.bet_type}${parsedBet.each_way ? ' (Each Way)' : ''}\n`;
      confirmationMessage += `- Stake: £${parsedBet.stake.toFixed(2)}\n`;
      confirmationMessage += `- Odds: ${parsedBet.odds.toFixed(2)}\n`;
      
      // Calculate potential returns
      const potentialReturn = parsedBet.stake * parsedBet.odds;
      const potentialProfit = potentialReturn - parsedBet.stake;
      
      confirmationMessage += `- Potential Return: £${potentialReturn.toFixed(2)}\n`;
      confirmationMessage += `- Potential Profit: £${potentialProfit.toFixed(2)}\n`;
      
      if (parsedBet.bookmaker) {
        confirmationMessage += `- Bookmaker: ${parsedBet.bookmaker}\n`;
      }
      
      // Close the confirmation dialog
      setShowConfirmation(false);
      
      // Reset the parsed bet
      setParsedBet(null);
      
      // Clear the input
      setInputValue('');
      
      // Add the confirmation message to the chat
      const newMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: confirmationMessage,
        timestamp: new Date().toISOString(),
      };
      
      setMessages(prev => [...prev, newMessage]);
      
    } catch (error: any) {
      console.error('Error saving bet:', error);
      
      let errorMessage = 'Failed to save bet. Please try again.';
      
      // Provide more specific error messages
      if (error.message.includes('Schema mismatch')) {
        errorMessage = 'Database schema error. Please report this issue.';
      } else if (error.message.includes('Missing required field')) {
        errorMessage = `${error.message}. Please provide all required information.`;
      } else if (error.message.includes('Insert validation error')) {
        errorMessage = 'Invalid data format. Please check your bet details.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle input change
   */
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  /**
   * Simple dialog component for bet confirmation
   */
  function BetConfirmation({
    isOpen,
    parsedBet,
    onClose,
    onConfirm,
    error,
    isLoading
  }: BetConfirmationProps) {
    if (!parsedBet || !isOpen) return null;
    
    // Calculate potential return and profit
    const potentialReturn = parsedBet.stake * parsedBet.odds;
    const potentialProfit = potentialReturn - parsedBet.stake;

  return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-xl font-bold">Confirm Your Bet</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                Please review your bet details before saving.
              </p>
            </div>
            
            <div className="space-y-4 py-4">
              {/* Race Details Section */}
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                <h3 className="font-semibold mb-2">Race Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Track:</span>
                  </div>
                  <div>{parsedBet.track_name}</div>
                  
                  {parsedBet.race_number && (
                    <>
                      <div>
                        <span className="font-medium">Race Number:</span>
                      </div>
                      <div>{parsedBet.race_number}</div>
                    </>
                  )}
                  
                  {parsedBet.race_date && (
                    <>
                      <div>
                        <span className="font-medium">Date:</span>
                      </div>
                      <div>{parsedBet.race_date}</div>
                    </>
                  )}
                  
                  {parsedBet.scheduled_race_time && (
                    <>
                      <div>
                        <span className="font-medium">Race Time:</span>
                      </div>
                      <div>{parsedBet.scheduled_race_time}</div>
                    </>
                  )}
                  
                  {parsedBet.distance && (
                    <>
                      <div>
                        <span className="font-medium">Distance:</span>
                      </div>
                      <div>{parsedBet.distance}</div>
                    </>
                  )}
                  
                  {parsedBet.class_type && (
                    <>
                      <div>
                        <span className="font-medium">Class/Type:</span>
                      </div>
                      <div>{parsedBet.class_type}</div>
                    </>
                  )}
                  
                  {parsedBet.track_condition && (
                    <>
                      <div>
                        <span className="font-medium">Going/Condition:</span>
                      </div>
                      <div>{parsedBet.track_condition}</div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Horse Details Section */}
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-md">
                <h3 className="font-semibold mb-2">Horse Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Horse:</span>
                  </div>
                  <div className="font-bold">{parsedBet.horse_name}</div>
                  
                  {parsedBet.jockey && (
                    <>
                      <div>
                        <span className="font-medium">Jockey:</span>
                      </div>
                      <div>{parsedBet.jockey}</div>
                    </>
                  )}
                  
                  {parsedBet.trainer && (
                    <>
                      <div>
                        <span className="font-medium">Trainer:</span>
                      </div>
                      <div>{parsedBet.trainer}</div>
                    </>
                  )}
                  
                  {parsedBet.post_position && (
                    <>
                      <div>
                        <span className="font-medium">Post Position:</span>
                      </div>
                      <div>{parsedBet.post_position}</div>
                    </>
                  )}
                  
                  {parsedBet.weight_carried && (
                    <>
                      <div>
                        <span className="font-medium">Weight:</span>
                      </div>
                      <div>{parsedBet.weight_carried}</div>
                    </>
                  )}
                  
                  {parsedBet.morning_line_odds && (
                    <>
                      <div>
                        <span className="font-medium">Morning Line:</span>
                      </div>
                      <div>{parsedBet.morning_line_odds}</div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Bet Details Section */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                <h3 className="font-semibold mb-2">Bet Details</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Bet Type:</span>
                  </div>
                  <div>{parsedBet.bet_type}{parsedBet.each_way ? ' (Each Way)' : ''}</div>
                  
                  <div>
                    <span className="font-medium">Stake:</span>
                  </div>
                  <div>£{parsedBet.stake.toFixed(2)}</div>
                  
                  <div>
                    <span className="font-medium">Odds:</span>
                  </div>
                  <div>{parsedBet.odds.toFixed(2)}</div>
                  
                  {parsedBet.bookmaker && (
                    <>
                      <div>
                        <span className="font-medium">Bookmaker:</span>
                      </div>
                      <div>{parsedBet.bookmaker}</div>
                    </>
                  )}
                  
                  <div className="border-t pt-2 col-span-2">
                    <div className="flex justify-between font-medium">
                      <span>Potential Return:</span>
                      <span className="text-blue-600 dark:text-blue-400">£{potentialReturn.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Potential Profit:</span>
                      <span className="text-blue-600 dark:text-blue-400">£{potentialProfit.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {error && (
                <div className="bg-red-100 dark:bg-red-900/20 p-3 rounded-md text-red-600 dark:text-red-400 text-sm">
                  {error}
          </div>
        )}
        
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Note: Saving this bet will add it to your bet tracking database.
              </p>
      </div>
      
            <div className="mt-4 flex justify-end space-x-3">
            <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Save Bet'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-60px)]">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${
              message.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}
            >
              <div className="whitespace-pre-wrap">{message.content}</div>
              {message.timestamp && (
                <div className="text-xs opacity-70 mt-1">
                  {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
        <input
            className="flex-1 p-2 border rounded-md"
            value={inputValue}
            onChange={handleInputChange}
            placeholder="Ask about horse racing or record a bet..."
          disabled={isLoading}
        />
        <button
          type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
            disabled={isLoading || inputValue.trim() === ''}
        >
            {isLoading ? 'Thinking...' : 'Send'}
        </button>
      </form>
      </div>

      {/* Bet confirmation dialog */}
      {showConfirmation && parsedBet && (
        <BetConfirmation
          isOpen={showConfirmation}
          parsedBet={parsedBet}
          onClose={handleRejectBet}
          onConfirm={handleConfirmBet}
          error={error}
          isLoading={isLoading}
        />
      )}
    </div>
  );
} 