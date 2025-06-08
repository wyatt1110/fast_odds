// Track codes for major USA racetracks
export const USA_TRACK_CODES: { [key: string]: string } = {
  // Major tracks
  'AQUEDUCT': 'AQU',
  'BELMONT PARK': 'BEL',
  'CHURCHILL DOWNS': 'CD',
  'DEL MAR': 'DMR',
  'GULFSTREAM PARK': 'GP',
  'KEENELAND': 'KEE',
  'OAKLAWN PARK': 'OP',
  'PIMLICO': 'PIM',
  'SANTA ANITA PARK': 'SA',
  'SARATOGA': 'SAR',
  'TURF PARADISE': 'TUP',
  'WILL ROGERS DOWNS': 'WRD',
  
  // Other notable tracks
  'ARLINGTON': 'AP',
  'COLONIAL DOWNS': 'CNL',
  'ELLIS PARK': 'ELP',
  'FAIR GROUNDS': 'FG',
  'GOLDEN GATE FIELDS': 'GG',
  'HAWTHORNE': 'HAW',
  'LAUREL PARK': 'LRL',
  'LONE STAR PARK': 'LS',
  'MONMOUTH PARK': 'MTH',
  'PARX RACING': 'PRX',
  'PENN NATIONAL': 'PEN',
  'SAM HOUSTON': 'HOU',
  'TAMPA BAY DOWNS': 'TAM',
  'THISTLEDOWN': 'TDN',
  'TURFWAY PARK': 'TP',
  'WOODBINE': 'WO'
};

// Function to get track code
export function getTrackCode(trackName: string): string | null {
  // Normalize track name (remove 'racetrack', 'racecourse', etc. and convert to uppercase)
  const normalizedName = trackName
    .toUpperCase()
    .replace(/\s*(RACETRACK|RACECOURSE|RACE TRACK|RACE COURSE)\s*/, '')
    .trim();
  
  // Try exact match first
  if (USA_TRACK_CODES[normalizedName]) {
    return USA_TRACK_CODES[normalizedName];
  }
  
  // Try partial matches
  const matches = Object.entries(USA_TRACK_CODES)
    .filter(([name]) => name.includes(normalizedName) || normalizedName.includes(name));
  
  if (matches.length === 1) {
    return matches[0][1]; // Return the code if exactly one match
  }
  
  return null; // Return null if no match or ambiguous
} 