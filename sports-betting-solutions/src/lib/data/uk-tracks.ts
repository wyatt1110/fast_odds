interface UKTrack {
  name: string;
  type: 'Flat' | 'Jump' | 'Mixed';
  code?: string; // For future use if needed
  aliases?: string[]; // Add common abbreviations/alternate names
}

export const UK_TRACKS: UKTrack[] = [
  { name: 'Aintree', type: 'Jump', aliases: ['ain'] },
  { name: 'Ascot', type: 'Mixed', aliases: ['asc'] },
  { name: 'Ayr', type: 'Mixed' },
  { name: 'Bangor-on-Dee', type: 'Jump', aliases: ['bangor', 'bod'] },
  { name: 'Bath', type: 'Flat' },
  { name: 'Beverley', type: 'Flat', aliases: ['bev'] },
  { name: 'Brighton', type: 'Flat', aliases: ['bri'] },
  { name: 'Carlisle', type: 'Mixed', aliases: ['car'] },
  { name: 'Cartmel', type: 'Jump' },
  { name: 'Catterick Bridge', type: 'Mixed', aliases: ['catterick', 'cat'] },
  { name: 'Chelmsford City', type: 'Flat', aliases: ['chelmsford', 'che'] },
  { name: 'Cheltenham', type: 'Jump', aliases: ['chelt'] },
  { name: 'Chepstow', type: 'Mixed', aliases: ['chep'] },
  { name: 'Chester', type: 'Flat' },
  { name: 'Doncaster', type: 'Mixed', aliases: ['donny', 'don'] },
  { name: 'Epsom Downs', type: 'Flat', aliases: ['epsom'] },
  { name: 'Exeter', type: 'Jump', aliases: ['exe'] },
  { name: 'Fakenham', type: 'Jump', aliases: ['fak'] },
  { name: 'Ffos Las', type: 'Mixed', aliases: ['ffos'] },
  { name: 'Fontwell Park', type: 'Jump', aliases: ['fontwell', 'fon'] },
  { name: 'Goodwood', type: 'Flat', aliases: ['good'] },
  { name: 'Great Yarmouth', type: 'Flat', aliases: ['yarmouth', 'yarnmouth', 'yar'] },
  { name: 'Hamilton Park', type: 'Flat', aliases: ['hamilton', 'ham'] },
  { name: 'Haydock Park', type: 'Mixed', aliases: ['haydock', 'hay'] },
  { name: 'Hereford', type: 'Jump', aliases: ['her'] },
  { name: 'Hexham', type: 'Jump', aliases: ['hex'] },
  { name: 'Huntingdon', type: 'Jump', aliases: ['hunt'] },
  { name: 'Kelso', type: 'Jump' },
  { name: 'Kempton Park', type: 'Mixed', aliases: ['kempton', 'kem'] },
  { name: 'Leicester', type: 'Mixed', aliases: ['leic'] },
  { name: 'Lingfield Park', type: 'Mixed', aliases: ['lingfield', 'ling'] },
  { name: 'Ludlow', type: 'Jump', aliases: ['lud'] },
  { name: 'Market Rasen', type: 'Jump', aliases: ['rasen', 'mar'] },
  { name: 'Musselburgh', type: 'Mixed', aliases: ['muss'] },
  { name: 'Newbury', type: 'Mixed', aliases: ['new'] },
  { name: 'Newcastle', type: 'Mixed', aliases: ['newc'] },
  { name: 'Newmarket', type: 'Flat', aliases: ['newm'] },
  { name: 'Newton Abbot', type: 'Jump', aliases: ['newton'] },
  { name: 'Nottingham', type: 'Flat', aliases: ['nott'] },
  { name: 'Perth', type: 'Jump' },
  { name: 'Plumpton', type: 'Jump', aliases: ['plum'] },
  { name: 'Pontefract', type: 'Flat', aliases: ['ponte', 'pon'] },
  { name: 'Redcar', type: 'Flat', aliases: ['red'] },
  { name: 'Ripon', type: 'Flat', aliases: ['rip'] },
  { name: 'Salisbury', type: 'Flat', aliases: ['sal'] },
  { name: 'Sandown Park', type: 'Mixed', aliases: ['sandown', 'san'] },
  { name: 'Sedgefield', type: 'Jump', aliases: ['sedge'] },
  { name: 'Southwell', type: 'Mixed', aliases: ['south'] },
  { name: 'Stratford-on-Avon', type: 'Jump', aliases: ['stratford', 'strat'] },
  { name: 'Taunton', type: 'Jump', aliases: ['tau'] },
  { name: 'Thirsk', type: 'Flat', aliases: ['thi'] },
  { name: 'Uttoxeter', type: 'Jump', aliases: ['utto'] },
  { name: 'Warwick', type: 'Jump', aliases: ['war'] },
  { name: 'Wetherby', type: 'Jump', aliases: ['wet'] },
  { name: 'Wincanton', type: 'Jump', aliases: ['winc'] },
  { name: 'Windsor', type: 'Mixed', aliases: ['win'] },
  { name: 'Wolverhampton', type: 'Flat', aliases: ['wolves', 'wolv'] },
  { name: 'Worcester', type: 'Jump', aliases: ['worc'] },
  { name: 'York', type: 'Flat' }
];

// Helper function to check if a track name is a valid UK track
export function isUKTrack(trackName: string): boolean {
  const normalizedInput = trackName.toLowerCase().trim();
  return UK_TRACKS.some(track => {
    if (track.name.toLowerCase() === normalizedInput) return true;
    if (track.aliases?.some(alias => alias.toLowerCase() === normalizedInput)) return true;
    return false;
  });
}

// Helper function to get track type
export function getUKTrackType(trackName: string): 'Flat' | 'Jump' | 'Mixed' | null {
  const normalizedInput = trackName.toLowerCase().trim();
  const track = UK_TRACKS.find(track => {
    if (track.name.toLowerCase() === normalizedInput) return true;
    if (track.aliases?.some(alias => alias.toLowerCase() === normalizedInput)) return true;
    return false;
  });
  return track ? track.type : null;
}

// Helper function to get track by fuzzy match with improved matching logic
export function findUKTrackByFuzzyMatch(searchName: string, similarityThreshold: number = 0.7): UKTrack | null {
  let bestMatch: UKTrack | null = null;
  let bestSimilarity = 0;
  
  const normalizedSearchName = searchName.toLowerCase().trim();
  
  for (const track of UK_TRACKS) {
    // Check official name
    const normalizedTrackName = track.name.toLowerCase().trim();
    const mainSimilarity = calculateStringSimilarity(normalizedSearchName, normalizedTrackName);
    
    if (mainSimilarity > similarityThreshold && mainSimilarity > bestSimilarity) {
      bestMatch = track;
      bestSimilarity = mainSimilarity;
    }
    
    // Check aliases if they exist
    if (track.aliases) {
      for (const alias of track.aliases) {
        const normalizedAlias = alias.toLowerCase().trim();
        const aliasSimilarity = calculateStringSimilarity(normalizedSearchName, normalizedAlias);
        
        if (aliasSimilarity > similarityThreshold && aliasSimilarity > bestSimilarity) {
          bestMatch = track;
          bestSimilarity = aliasSimilarity;
        }
      }
    }
    
    // Special case: Check if search term is contained within track name or aliases
    if (!bestMatch) {
      if (normalizedTrackName.includes(normalizedSearchName) || 
          track.aliases?.some(alias => alias.toLowerCase().includes(normalizedSearchName))) {
        bestMatch = track;
        bestSimilarity = similarityThreshold + 0.1; // Set slightly above threshold
      }
    }
  }
  
  return bestMatch;
}

// String similarity calculation (Levenshtein distance)
function calculateStringSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) {
    return 1.0;
  }
  
  const costs: number[] = [];
  for (let i = 0; i <= shorter.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= longer.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (shorter.charAt(i - 1) !== longer.charAt(j - 1)) {
          newValue = Math.min(
            Math.min(newValue, lastValue),
            costs[j]
          ) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) {
      costs[longer.length] = lastValue;
    }
  }
  
  return 1.0 - (costs[longer.length] / longer.length);
} 