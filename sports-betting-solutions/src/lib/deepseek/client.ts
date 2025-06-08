// Define message types and interfaces
export interface DeepseekMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface DeepseekResponse {
  response: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Calls the DeepSeek API via our secure server-side API route
 */
export async function callDeepseek(
  messages: DeepseekMessage[],
  userId: string,
  maxTokens?: number
): Promise<DeepseekResponse> {
  try {
    const response = await fetch('/api/ai/deepseek', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        userId,
        maxTokens,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to call DeepSeek API');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error in DeepSeek client:', error);
    throw new Error(`DeepSeek API error: ${error.message}`);
  }
}

// Export with capital S for compatibility with existing imports
export const callDeepSeek = callDeepseek; 