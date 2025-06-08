interface TrackInfo {
  name: string;
  code: string;
  location: string;
}

export const trackCodes: { [key: string]: TrackInfo } = {
  // Format: 'Track Name': { name: 'Track Name', code: 'XXX', location: 'City, State/Country' }
  'Aqueduct': { name: 'Aqueduct', code: 'AQU', location: 'Queens, NY' },
  'Belmont Park': { name: 'Belmont Park', code: 'BEL', location: 'Elmont, NY' },
  'Churchill Downs': { name: 'Churchill Downs', code: 'CD', location: 'Louisville, KY' },
  'Del Mar': { name: 'Del Mar', code: 'DMR', location: 'Del Mar, CA' },
  'Fair Grounds': { name: 'Fair Grounds', code: 'FG', location: 'New Orleans, LA' },
  'Gulfstream Park': { name: 'Gulfstream Park', code: 'GP', location: 'Hallandale Beach, FL' },
  'Keeneland': { name: 'Keeneland', code: 'KEE', location: 'Lexington, KY' },
  'Oaklawn Park': { name: 'Oaklawn Park', code: 'OP', location: 'Hot Springs, AR' },
  'Pimlico': { name: 'Pimlico', code: 'PIM', location: 'Baltimore, MD' },
  'Santa Anita Park': { name: 'Santa Anita Park', code: 'SA', location: 'Arcadia, CA' },
  'Saratoga': { name: 'Saratoga', code: 'SAR', location: 'Saratoga Springs, NY' },
  'Tampa Bay Downs': { name: 'Tampa Bay Downs', code: 'TAM', location: 'Tampa, FL' },
  'Turf Paradise': { name: 'Turf Paradise', code: 'TUP', location: 'Phoenix, AZ' },
  'Will Rogers Downs': { name: 'Will Rogers Downs', code: 'WRD', location: 'Claremore, OK' },
  // Add more tracks as needed
};