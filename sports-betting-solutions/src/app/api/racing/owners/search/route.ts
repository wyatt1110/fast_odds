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
        { error: 'Owner name is required' },
        { status: 400 }
      );
    }
    
    console.log(`Searching Supabase for owner: ${name}`);
    
    // Search for owners in our database
    // First try exact match, then try partial match
    const { data: exactMatches, error: exactError } = await supabase
      .from('runners')
      .select(`
        owner
      `)
      .ilike('owner', name)
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
          owner
        `)
        .ilike('owner', `%${name}%`)
        .limit(10);
      
      if (partialError) {
        console.error('Partial match search error:', partialError);
      } else {
        partialMatches = partial || [];
      }
    }
    
    // Combine and deduplicate results
    const allMatches = [...(exactMatches || []), ...partialMatches];
    const uniqueOwners = allMatches.reduce((acc: any[], owner) => {
      if (!acc.find(o => o.owner === owner.owner)) {
        acc.push(owner);
      }
      return acc;
    }, []);
    
    // Format owners with an ID (using name as ID since we don't have owner_id)
    const formattedOwners = uniqueOwners.map(owner => ({
      owner: owner.owner,
      owner_id: owner.owner // Using name as ID
    }));
    
    console.log(`Found ${formattedOwners.length} owner matches in Supabase`);
    
    return NextResponse.json({
      owners: formattedOwners,
      count: formattedOwners.length
    });
    
  } catch (error) {
    console.error('Owner search error:', error);
    return NextResponse.json(
      { error: 'Failed to search owners' },
      { status: 500 }
    );
  }
} 