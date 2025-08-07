import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { config } from '@/lib/config';

const supabase = createClient(
  config.supabase.url,
  config.supabase.anonKey
);

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Jockey name is required' },
        { status: 400 }
      );
    }
    
    console.log(`Searching Supabase for jockey: ${name}`);
    
    // Search for jockeys in our database
    // First try exact match, then try partial match
    const { data: exactMatches, error: exactError } = await supabase
      .from('runners')
      .select(`
        jockey,
        jockey_id
      `)
      .ilike('jockey', name)
      .limit(5);
    
    if (exactError) {
      console.error('Exact match search error:', exactError);
    }
    
    // If no exact matches, try partial search
    let partialMatches: any[] = [];
    if (!exactMatches || exactMatches.length === 0) {
      const { data: partial, error: partialError } = await supabase
        .from('runners')
        .select(`
          jockey,
          jockey_id
        `)
        .ilike('jockey', `%${name}%`)
        .limit(10);
      
      if (partialError) {
        console.error('Partial match search error:', partialError);
      } else {
        partialMatches = partial || [];
      }
    }
    
    // Combine and deduplicate results
    const allMatches = [...(exactMatches || []), ...partialMatches];
    const uniqueJockeys = allMatches.reduce((acc: any[], jockey) => {
      if (!acc.find(j => j.jockey_id === jockey.jockey_id)) {
        acc.push(jockey);
      }
      return acc;
    }, []);
    
    console.log(`Found ${uniqueJockeys.length} jockey matches in Supabase`);
    
    return NextResponse.json({
      jockeys: uniqueJockeys,
      count: uniqueJockeys.length
    });
    
  } catch (error) {
    console.error('Jockey search error:', error);
    return NextResponse.json(
      { error: 'Failed to search jockeys' },
      { status: 500 }
    );
  }
} 