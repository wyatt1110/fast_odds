import { useState, useEffect, useRef } from 'react';
import { createClient, User } from '@supabase/supabase-js';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface RacingAssistantProps {
  isPremiumUser?: boolean;
  user?: User | null;
}

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function RacingAssistant({ isPremiumUser = false, user }: RacingAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  
  // Add initial greeting when component mounts
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          role: 'assistant',
          content: 'Hello! I\'m your Horse Racing Betting Assistant. Would you like to record a new bet or ask a question about your existing bets?'
        }
      ]);
    }
  }, [messages]);
  
  // Scroll to bottom of messages when new messages are added
  useEffect(() => {
    if (endOfMessagesRef.current) {
      endOfMessagesRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Function to call the AI assistant
  const callAssistant = async (messageContent: string) => {
    if (!messageContent.trim() || !user) return;
    
    const userMessage: Message = { role: 'user', content: messageContent };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch('/api/chat/racing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || ''}`
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          isPremiumUser,
          includeBets: true,
        }),
      });
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', content: data.message }
      ]);
      
    } catch (err: any) {
      setError(err.message || 'Failed to get response');
      console.error('Error calling racing assistant:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    callAssistant(input);
  };
  
  // Template shortcuts
  const insertBetTemplate = () => {
    setInput(`I'd like to record a new bet:

Horse Name: 
Track: 
Race Date (YYYY-MM-DD): 
Stake: 
Odds: 
Bookmaker: 
Model/Tipster: `);
  };
  
  return (
    <div className="flex flex-col h-[600px] border rounded-lg shadow-sm">
      <div className="bg-green-800 text-white px-4 py-2 rounded-t-lg flex justify-between items-center">
        <h3 className="font-semibold">Horse Racing Assistant {isPremiumUser && '(Premium)'}</h3>
      </div>
      
      {/* Messages container */}
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`mb-4 ${
              message.role === 'user' 
                ? 'bg-blue-100 ml-8 rounded-lg p-3' 
                : 'bg-white mr-8 rounded-lg p-3 shadow-sm'
            }`}
          >
            <p className="text-xs text-gray-500 mb-1">
              {message.role === 'user' ? 'You' : 'Racing Assistant'}
            </p>
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        ))}
        
        {isLoading && (
          <div className="bg-white mr-8 rounded-lg p-3 shadow-sm animate-pulse">
            <p className="text-xs text-gray-500 mb-1">Racing Assistant</p>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded-lg my-2">
            {error}
          </div>
        )}
        
        <div ref={endOfMessagesRef} />
      </div>
      
      {/* Quick actions */}
      <div className="p-2 border-t flex gap-2">
        <button 
          onClick={insertBetTemplate}
          className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded hover:bg-green-200"
        >
          New Bet Template
        </button>
      </div>
      
      {/* Input form */}
      <form onSubmit={handleSubmit} className="p-2 border-t flex">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="flex-1 p-2 border rounded-l focus:outline-none focus:ring-1 focus:ring-green-500"
          placeholder="Type your message..."
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          className="bg-green-600 text-white px-4 py-2 rounded-r hover:bg-green-700 disabled:bg-gray-300"
        >
          {isLoading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  );
} 