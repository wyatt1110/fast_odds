import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request) {
  try {
    const { name } = await request.json();
    
    if (!name) {
      return NextResponse.json(
        { error: 'Horse name is required' },
        { status: 400 }
      );
    }
    
    console.log(`Searching Supabase for horse: ${name}`);
    
    // Search for horses in our database
    // First try exact match, then try partial match
    const { data: exactMatches, error: exactError } = await supabase
      .from('runners')
      .select(`
        horse_name,
        horse_id,
        jockey,
        jockey_id,
        trainer,
        trainer_id,
        owner,
        age
      `)
      .ilike('horse_name', name)
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
          horse_name,
          horse_id,
          jockey,
          jockey_id,
          trainer,
          trainer_id,
          owner,
          age
        `)
        .ilike('horse_name', `%${name}%`)
        .limit(10);
      
      if (partialError) {
        console.error('Partial match search error:', partialError);
      } else {
        partialMatches = partial || [];
      }
    }
    
    // Combine and deduplicate results
    const allMatches = [...(exactMatches || []), ...partialMatches];
    const uniqueHorses = allMatches.reduce((acc: any[], horse) => {
      if (!acc.find(h => h.horse_id === horse.horse_id)) {
        acc.push(horse);
      }
      return acc;
    }, []);
    
    console.log(`Found ${uniqueHorses.length} horse matches in Supabase`);
    
    return NextResponse.json({
      horses: uniqueHorses,
      count: uniqueHorses.length
    });
    
  } catch (error) {
    console.error('Horse search error:', error);
    return NextResponse.json(
      { error: 'Failed to search horses' },
      { status: 500 }
    );
  }
} 