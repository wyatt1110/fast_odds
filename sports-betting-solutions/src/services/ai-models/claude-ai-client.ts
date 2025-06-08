// Define message types and interfaces
export interface ClaudeMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ClaudeResponse {
  response: string;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
  };
}

/**
 * Calls the Claude API via our secure server-side API route
 */
export async function callClaude(
  messages: ClaudeMessage[],
  userId: string,
  maxTokens?: number,
  systemPrompt?: string
): Promise<ClaudeResponse> {
  try {
    const response = await fetch('/api/ai/claude', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messages,
        userId,
        maxTokens,
        systemPrompt,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to call Claude API');
    }

    return await response.json();
  } catch (error: any) {
    console.error('Error in Claude client:', error);
    throw new Error(`Claude API error: ${error.message}`);
  }
} 