import { NextResponse, NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedUser } from '@/lib/auth/auth-utils';
import { callClaude } from '@/lib/claude/client';
import { callDeepseek } from '@/lib/deepseek/client';
import { 
  addBetWorkflow, 
  getBettingStatsWorkflow, 
  updateBetStatusWorkflow 
} from '@/lib/workflows/bet-assistant-workflow';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Simple tasks keywords and patterns
const SIMPLE_TASK_KEYWORDS = [
  'add bet', 'add a bet', 'new bet', 'create bet', 'track bet', 'record bet',
  'log this bet', 'update bet', 'bet entry', 'simple calculation', 'track my bet',
  'what is my roi', 'show my stats', 'how many bets', 'total stake', 'profit'
];

// Action keywords for specific workflows
const ADD_BET_KEYWORDS = [
  'add bet', 'add a bet', 'new bet', 'create bet', 'track bet', 'record bet',
  'log this bet', 'track my bet'
];

const UPDATE_BET_KEYWORDS = [
  'update bet', 'mark bet', 'settle bet', 'bet won', 'bet lost', 'bet result'
];

const STATS_KEYWORDS = [
  'what is my roi', 'show my stats', 'how many bets', 'total stake', 'profit',
  'statistics', 'performance', 'win rate', 'betting history'
];

// Basic system prompt for the betting assistant
const BETTING_ASSISTANT_PROMPT = `
You are the Bet Assistant, an AI specialized in sports betting. Your capabilities include:

1. Providing betting advice and strategies based on a user's queries
2. Tracking and analyzing the user's betting history
3. Explaining betting terminologies and concepts
4. Offering insights on various sports and leagues
5. Helping users make more informed betting decisions

When discussing sports betting:
- Emphasize responsible gambling
- Never guarantee wins
- Base advice on statistical analysis rather than personal opinion
- Provide educational content about odds, value, and bankroll management
- Be honest about the limitations of predictions

When asked about a specific sport, team, or match, provide relevant statistics and insights if available.
If you don't have specific recent data, clearly state that your knowledge has limitations.

You have tools available that allow you to:
1. Create bets for the user
2. Review historical bets
3. Calculate likely outcomes based on available data
4. Analyze statistics for specific leagues or teams

Always be respectful, educational, and promote responsible betting practices.
`;

// Shorter prompt for DeepSeek (optimized for the simpler tasks)
const DEEPSEEK_ASSISTANT_PROMPT = `
You are the Bet Assistant, helping users track and manage their sports bets.

Your main tasks are to:
1. Help users add new bets to their tracking system
2. Provide quick answers about their betting statistics
3. Assist with simple calculations related to their bets

When helping add a bet, collect this information:
- Sport type
- Event details (teams, horses, etc.)
- Selection (what they're betting on)
- Stake amount
- Odds
- Bet type (straight, parlay, etc.)

Format all your responses clearly and concisely. Be friendly but efficient.
Remember to be responsible and never guarantee wins.
`;

/**
 * Determine if a message represents a simple task
 * @param messages User messages
 * @returns boolean indicating if this is a simple task
 */
function isSimpleTask(messages: any[]): boolean {
  // Get the last user message
  const lastUserMessage = [...messages].reverse().find(msg => msg.role === 'user');
  
  if (!lastUserMessage) return false;
  
  const content = lastUserMessage.content.toLowerCase();
  
  // Check if it matches simple task patterns
  return SIMPLE_TASK_KEYWORDS.some(keyword => content.includes(keyword.toLowerCase()));
}

/**
 * Detect if the message contains a specific action request
 */
function detectActionRequest(message: string): { action: string | null, data: any } {
  const lowerMessage = message.toLowerCase();
  
  // Check for add bet request
  if (ADD_BET_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) {
    // Try to extract bet details
    const betData: any = {};
    
    // Simple regex extractions (these are basic and would need to be more robust in production)
    const sportMatch = lowerMessage.match(/sport:?\s*([a-zA-Z0-9 ]+)/i);
    if (sportMatch) betData.sport = sportMatch[1].trim();
    
    const eventMatch = lowerMessage.match(/event:?\s*([a-zA-Z0-9 ]+vs[a-zA-Z0-9 ]+)/i);
    if (eventMatch) betData.event_name = eventMatch[1].trim();
    
    const selectionMatch = lowerMessage.match(/selection:?\s*([a-zA-Z0-9 ]+)/i);
    if (selectionMatch) betData.selection = selectionMatch[1].trim();
    
    const stakeMatch = lowerMessage.match(/stake:?\s*(\d+(\.\d+)?)/i);
    if (stakeMatch) betData.stake = parseFloat(stakeMatch[1]);
    
    const oddsMatch = lowerMessage.match(/odds:?\s*(\d+(\.\d+)?)/i);
    if (oddsMatch) betData.odds = parseFloat(oddsMatch[1]);
    
    const betTypeMatch = lowerMessage.match(/bet type:?\s*([a-zA-Z0-9 ]+)/i);
    if (betTypeMatch) betData.bet_type = betTypeMatch[1].trim();
    
    return { action: 'add_bet', data: betData };
  }
  
  // Check for update bet request
  if (UPDATE_BET_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) {
    const betData: any = {};
    
    // Try to extract bet ID and status
    const betIdMatch = lowerMessage.match(/bet id:?\s*([a-zA-Z0-9-]+)/i);
    if (betIdMatch) betData.id = betIdMatch[1].trim();
    
    const statusMatch = lowerMessage.match(/status:?\s*([a-zA-Z0-9_]+)/i);
    if (statusMatch) betData.status = statusMatch[1].trim();
    
    return { action: 'update_bet', data: betData };
  }
  
  // Check for stats request
  if (STATS_KEYWORDS.some(keyword => lowerMessage.includes(keyword))) {
    const filters: any = {};
    
    // Try to extract filters
    const sportMatch = lowerMessage.match(/sport:?\s*([a-zA-Z0-9 ]+)/i);
    if (sportMatch) filters.sport = sportMatch[1].trim();
    
    return { action: 'get_stats', data: filters };
  }
  
  return { action: null, data: {} };
}

/**
 * POST handler for the AI chat
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate that we have messages
    if (!body.messages || !Array.isArray(body.messages)) {
      return NextResponse.json(
        { error: 'Messages are required and must be an array' },
        { status: 400 }
      );
    }

    // Check if this is a direct action request
    const lastUserMessage = [...body.messages].reverse().find(msg => msg.role === 'user');
    let actionResult = null;
    
    if (lastUserMessage) {
      const { action, data } = detectActionRequest(lastUserMessage.content);
      
      if (action === 'add_bet' && Object.keys(data).length > 0) {
        // Execute add bet workflow
        actionResult = await addBetWorkflow(user.id, data);
      } else if (action === 'update_bet' && data.id && data.status) {
        // Execute update bet workflow
        actionResult = await updateBetStatusWorkflow(user.id, data.id, data.status);
      } else if (action === 'get_stats') {
        // Execute get stats workflow
        actionResult = await getBettingStatsWorkflow(user.id, data);
      }
    }

    // Check if we need to fetch recent bets for context
    const includeBets = body.includeBets === true;
    let bettingContext = '';
    
    if (includeBets) {
      // Fetch recent bets (limit to 10) to provide context
      const { data: recentBets, error: betsError } = await supabase
        .from('bets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (!betsError && recentBets && recentBets.length > 0) {
        bettingContext = `
Recent Bets Information for Context:
${recentBets.map((bet, index) => `
Bet ${index + 1}:
- Sport: ${bet.sport}
- Event: ${bet.event_name}
- Selection: ${bet.selection}
- Stake: ${bet.stake}
- Odds: ${bet.odds}
- Status: ${bet.status}
${bet.profit_loss ? `- Profit/Loss: ${bet.profit_loss}` : ''}
${bet.notes ? `- Notes: ${bet.notes}` : ''}
`).join('')}
`;
      }
    }

    // Get user preferences for AI models
    const { data: userSettings, error: settingsError } = await supabase
      .from('user_settings')
      .select('ai_preferences')
      .eq('user_id', user.id)
      .single();
    
    // Determine if this is a task for Deepseek vs Claude
    const isSimple = isSimpleTask(body.messages);
    
    // Determine which model to use:
    // 1. Use model specified in request if provided (premium feature)
    // 2. Check user preferences if available
    // 3. Default to Deepseek for simple tasks, Claude for complex
    let modelToUse = 'claude'; // default to claude for complex tasks
    
    // If not a premium user, simple tasks use Deepseek, complex use Claude
    if (!body.isPremiumUser) {
      modelToUse = isSimple ? 'deepseek' : 'claude';
    } 
    // For premium users, check explicit model selection or use preferences
    else if (body.model) {
      modelToUse = body.model;
    } 
    // Use user preferences if available
    else if (userSettings?.ai_preferences) {
      try {
        const preferences = userSettings.ai_preferences;
        modelToUse = isSimple ? preferences.simple_tasks : preferences.complex_tasks;
      } catch (e) {
        // If there's an error parsing preferences, fall back to defaults
        modelToUse = isSimple ? 'deepseek' : 'claude';
      }
    }

    // Add action result to context if available
    let actionContext = '';
    if (actionResult) {
      actionContext = `
Action Result:
${JSON.stringify(actionResult, null, 2)}

Please incorporate this information in your response.
`;
    }

    // Prepare the appropriate system prompt
    const basePrompt = modelToUse === 'deepseek' ? DEEPSEEK_ASSISTANT_PROMPT : BETTING_ASSISTANT_PROMPT;
    const systemPrompt = [basePrompt, bettingContext, actionContext].filter(Boolean).join('\n\n');

    // Call the appropriate AI service
    let response;
    if (modelToUse === 'deepseek') {
      response = await callDeepseek(
        body.messages,
        user.id,
        systemPrompt,
        body.maxTokens || 1000
      );
    } else {
      response = await callClaude(
        body.messages,
        user.id,
        systemPrompt,
        body.maxTokens || 1000
      );
    }

    // Return the AI response with model info and action result
    return NextResponse.json({
      message: response.response,
      usage: response.usage,
      model_used: modelToUse,
      action_result: actionResult
    });
  } catch (error: any) {
    console.error('Error in POST /api/chat:', error);
    return NextResponse.json(
      { error: error.message || 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 