import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

import { config } from '@/lib/config';

const supabase = createClient(
  config.supabase.url,
  config.supabase.serviceKey
);

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Trainer name is required' },
        { status: 400 }
      );
    }
    
    console.log(`Searching Supabase for trainer: ${name}`);
    
    // Search for trainers in our database
    // First try exact match, then try partial match
    const { data: exactMatches, error: exactError } = await supabase
      .from('runners')
      .select(`
        trainer,
        trainer_id
      `)
      .ilike('trainer', name)
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
          trainer,
          trainer_id
        `)
        .ilike('trainer', `%${name}%`)
        .limit(10);
      
      if (partialError) {
        console.error('Partial match search error:', partialError);
      } else {
        partialMatches = partial || [];
      }
    }
    
    // Combine and deduplicate results
    const allMatches = [...(exactMatches || []), ...partialMatches];
    const uniqueTrainers = allMatches.reduce((acc: any[], trainer) => {
      if (!acc.find(t => t.trainer_id === trainer.trainer_id)) {
        acc.push(trainer);
      }
      return acc;
    }, []);
    
    console.log(`Found ${uniqueTrainers.length} trainer matches in Supabase`);
    
    return NextResponse.json({
      trainers: uniqueTrainers,
      count: uniqueTrainers.length
    });
    
  } catch (error) {
    console.error('Trainer search error:', error);
    return NextResponse.json(
      { error: 'Failed to search trainers' },
      { status: 500 }
    );
  }
} 