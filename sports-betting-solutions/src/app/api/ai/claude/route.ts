import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { ClaudeMessage } from '@/lib/claude/client';

// Initialize Anthropic client on the server side
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { messages, userId, maxTokens, systemPrompt } = await request.json();
    
    if (!messages || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Format messages for Claude API
    const formattedMessages = messages.map((msg: ClaudeMessage) => ({
      role: msg.role,
      content: msg.content,
    }));
    
    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: maxTokens ? parseInt(maxTokens) : 1000,
      system: systemPrompt || 'You are a helpful AI assistant for a sports betting application.',
      messages: formattedMessages,
    });
    
    // Log the interaction for analytics (optional)
    // You could save this to your database here
    console.log(`Claude API call for user ${userId} completed`);
    
    // Extract text content from the response
    let responseText = '';
    if (response.content && response.content.length > 0) {
      const contentBlock = response.content[0];
      if (contentBlock.type === 'text') {
        responseText = contentBlock.text;
      }
    }
    
    return NextResponse.json({
      response: responseText,
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
      },
    });
  } catch (error: any) {
    console.error('Error calling Claude API:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to call Claude API' },
      { status: 500 }
    );
  }
} 