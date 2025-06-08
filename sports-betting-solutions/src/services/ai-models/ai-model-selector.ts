import { callClaude, ClaudeMessage } from '../claude/client';
import { callDeepSeek, DeepseekMessage } from '../deepseek/client';
import { getUserSettings } from '../supabase/client';

// Task complexity estimation
enum TaskComplexity {
  SIMPLE,
  COMPLEX
}

interface AIRouterOptions {
  forceModel?: 'claude' | 'deepseek';
  maxTokens?: number;
  systemPrompt?: string;
  userEmail?: string;
  mode?: 'betting' | 'racing';
}

// Keywords that might indicate a complex task
const COMPLEX_TASK_KEYWORDS = [
  'analyze', 'analysis', 'strategy', 'risk', 'value', 'hedge', 'probability',
  'kelly', 'closing line', 'implied probability', 'expected value', 'ev',
  'correlation', 'variance', 'standard deviation', 'regression', 'model',
  'optimize', 'optimization', 'arbitrage', 'middle', 'compare', 'comparison',
  'trend', 'historical', 'projection', 'forecast', 'predict', 'prediction'
];

// Keywords that indicate simple tasks
const SIMPLE_TASK_KEYWORDS = [
  'add bet', 'place bet', 'record', 'track', 'log', 'update', 'show',
  'list', 'display', 'get', 'find', 'search', 'what is', 'how many',
  'when', 'where', 'who', 'which', 'help', 'hello', 'hi', 'hey'
];

// Define the system prompt for horse racing AI
const HORSE_RACING_SYSTEM_PROMPT = `
You are a specialized AI assistant for horse racing enthusiasts and bettors. Your primary role is to help users track their horse racing bets and provide information about horses, jockeys, trainers, and tracks.

IMPORTANT WORKFLOW FOR BET HANDLING:
When a user mentions a bet or provides betting information:
1. DO NOT claim that you've saved or recorded the bet directly
2. INSTEAD, tell the user: "I'm processing your betting information. Please watch for the bet confirmation dialog that will appear shortly."
3. EXPLAIN that they need to review the details in the confirmation dialog and click "Save Bet" to save it to the database
4. NEVER say things like "I've added your bet to the spreadsheet" or "Your bet has been recorded" until AFTER they confirm the bet

IMPORTANT DATABASE REQUIREMENTS:
You MUST help extract the following information for bet tracking:
- REQUIRED FIELDS (MUST BE ASKED FOR IF NOT PROVIDED):
  * Horse name (this is critical and MUST be extracted)
  * Track name (this is critical and MUST be extracted)
  * Bet type (win, place, each way, etc.)
  * Stake amount
  * Odds (in decimal format - CONVERT if given in fractional format)
  * Race date (formatted as YYYY-MM-DD)

- OPTIONAL BUT VALUABLE FIELDS:
  * Race number (as integer)
  * Scheduled race time (time format)
  * Race location (usually same as track name)
  * Jockey name
  * Trainer name
  * Post position (integer value)
  * Distance of the race
  * Class type or race classification
  * Morning line odds
  * Purse amount
  * Bookmaker or betting site used
  * Notes or additional information

CONFIRMATION DIALOG GUIDANCE:
When the user sees a bet confirmation dialog, they will need to:
1. Review all the bet details for accuracy
2. Click "Save Bet" to record the bet in the database
3. The system will then display a detailed confirmation message with the saved data

ALWAYS help users understand horse racing terminology and betting concepts like:
- Different bet types (win, place, each way, exacta, trifecta, etc.)
- How odds work (fractional, decimal, converting between them)
- Track conditions and their impact
- Reading form guides and race cards
- Understanding handicapping basics

WORKFLOW FOR ASSISTING USERS:
1. When a user mentions a specific horse and track, fetch race details:
   - For UK races: Use The Racing API (implementation already available)
   - For North American races: Use the Equibase data when available

2. Present race information clearly to help users make informed decisions:
   - Race details (time, class, distance, conditions)
   - Horse details (jockey, trainer, form, odds)
   - Track history and conditions

3. When recording bets, include all race details available.

4. If a user asks about topics other than horse racing, politely redirect the conversation to horse racing topics.

You do NOT need to track:
- Bankroll management features
- Sports other than horse racing
- Parlay or accumulator bets

REMEMBER: Your primary goal is to help users track individual horse racing bets and provide expert information about horse racing.
`;

/**
 * Estimates the complexity of a task based on the user's message
 */
function estimateTaskComplexity(message: string): TaskComplexity {
  const lowerMessage = message.toLowerCase();
  
  // Check for complex task keywords
  const hasComplexKeywords = COMPLEX_TASK_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  );
  
  // Check for simple task keywords
  const hasSimpleKeywords = SIMPLE_TASK_KEYWORDS.some(keyword => 
    lowerMessage.includes(keyword.toLowerCase())
  );
  
  // If it has complex keywords and no simple keywords, it's complex
  if (hasComplexKeywords && !hasSimpleKeywords) {
    return TaskComplexity.COMPLEX;
  }
  
  // If it has simple keywords and no complex keywords, it's simple
  if (hasSimpleKeywords && !hasComplexKeywords) {
    return TaskComplexity.SIMPLE;
  }
  
  // If it has both or neither, check message length as a heuristic
  // Longer messages tend to be more complex
  if (message.length > 100) {
    return TaskComplexity.COMPLEX;
  }
  
  // Default to simple
  return TaskComplexity.SIMPLE;
}

/**
 * Converts messages to the format expected by the selected AI model
 */
function formatMessages(messages: any[], model: 'claude' | 'deepseek'): ClaudeMessage[] | DeepseekMessage[] {
  if (model === 'claude') {
    return messages.map(msg => ({
      role: msg.role === 'system' ? 'user' : msg.role,
      content: msg.content
    })) as ClaudeMessage[];
  } else {
    return messages as DeepseekMessage[];
  }
}

/**
 * Routes requests to the appropriate AI model
 */
export async function routeToAI(messages: any[], userId: string, options: {
  forceModel?: 'anthropic' | 'deepseek';
  systemPrompt?: string;
  userEmail?: string;
} = {}) {
  
  // Default to Claude if not specified
  const model = options.forceModel || 'anthropic';
  
  try {
    let systemPrompt = options.systemPrompt;
    
    // If no system prompt provided, use the default horse racing one
    if (!systemPrompt) {
      systemPrompt = HORSE_RACING_SYSTEM_PROMPT;
    }
    
    // Check which model to route to
    if (model === 'anthropic') {
      // Call Claude API
      const apiResponse = await fetch('/api/ai/anthropic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          systemPrompt,
          userId,
          userEmail: options.userEmail,
        }),
      });
      
      if (!apiResponse.ok) {
        throw new Error(`Error from Anthropic API: ${apiResponse.statusText}`);
      }
      
      const data = await apiResponse.json();
      return data;
    } else {
      // Call DeepSeek API as fallback
      const apiResponse = await fetch('/api/ai/deepseek', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages,
          systemPrompt,
          userId,
          userEmail: options.userEmail,
        }),
      });
      
      if (!apiResponse.ok) {
        throw new Error(`Error from DeepSeek API: ${apiResponse.statusText}`);
      }
      
      const data = await apiResponse.json();
      return data;
    }
  } catch (error) {
    console.error('Error in AI routing:', error);
    throw error;
  }
} 