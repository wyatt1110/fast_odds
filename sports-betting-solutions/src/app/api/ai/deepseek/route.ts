import { NextRequest, NextResponse } from 'next/server';
import { DeepseekMessage } from '@/lib/deepseek/client';

export async function POST(request: NextRequest) {
  try {
    const { messages, userId, maxTokens } = await request.json();
    
    if (!messages || !userId) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }
    
    // Format messages for DeepSeek API
    const formattedMessages = messages.map((msg: DeepseekMessage) => ({
      role: msg.role,
      content: msg.content,
    }));
    
    // Call DeepSeek API with real API key
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: formattedMessages,
        max_tokens: maxTokens ? parseInt(maxTokens) : 1000,
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown API error' } }));
      throw new Error(errorData.error?.message || 'Failed to call DeepSeek API');
    }
    
    const data = await response.json();
    
    // Log the interaction for analytics
    console.log(`DeepSeek API call for user ${userId} completed successfully`);
    
    return NextResponse.json({
      response: data.choices[0].message.content,
      usage: data.usage,
    });
  } catch (error: any) {
    console.error('Error calling DeepSeek API:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to call DeepSeek API' },
      { status: 500 }
    );
  }
} 