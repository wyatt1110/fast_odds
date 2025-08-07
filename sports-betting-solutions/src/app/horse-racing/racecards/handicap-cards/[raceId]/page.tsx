'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from "@/components/layout/Layout";
import PageProtection from "@/components/auth/PageProtection";
import { MembershipTier } from "@/lib/permissions/access-control";
import { 
  ArrowLeft, 
  Clock, 
  Trophy, 
  Users, 
  MapPin, 
  TrendingUp,
  Star,
  Info,
  Calendar,
  Target,
  BarChart3,
  Eye,
  Crown,
  Zap,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { 
  getCurrentUKDateInfo 
} from '@/lib/services/racecardsService';
import { getRandomTrackImage } from "@/lib/services/trackImageService";
import { ExpertAnalysis } from "@/components/racing/ExpertAnalysis";
import { PacePredictor } from "@/components/racing/PacePredictor";

interface RaceOdds {
  id: number;
  runner_id: number;
  race_id: string;
  horse_id: string | null;
  horse_name: string | null;
  race_date: string | null;
  // Opening odds columns
  bet365_opening?: string | null;
  william_hill_opening?: string | null;
  paddy_power_opening?: string | null;
  sky_bet_opening?: string | null;
  ladbrokes_opening?: string | null;
  coral_opening?: string | null;
  betfair_opening?: string | null;
  betfred_opening?: string | null;
  unibet_opening?: string | null;
  bet_uk_opening?: string | null;
  bet_goodwin_opening?: string | null;
  bet_victor_opening?: string | null;
  ten_bet_opening?: string | null;
  seven_bet_opening?: string | null;
  bet442_opening?: string | null;
  betmgm_opening?: string | null;
  betway_opening?: string | null;
  boyle_sports_opening?: string | null;
  copybet_opening?: string | null;
  dragon_bet_opening?: string | null;
  gentlemen_jim_opening?: string | null;
  grosvenor_sports_opening?: string | null;
  hollywood_bets_opening?: string | null;
  matchbook_opening?: string | null;
  midnite_opening?: string | null;
  pricedup_bet_opening?: string | null;
  quinn_bet_opening?: string | null;
  sporting_index_opening?: string | null;
  spreadex_opening?: string | null;
  star_sports_opening?: string | null;
  virgin_bet_opening?: string | null;
  talksport_bet_opening?: string | null;
  betfair_exchange_opening?: string | null;
  // History columns
  bet365_history?: string;
  william_hill_history?: string;
  paddy_power_history?: string;
  sky_bet_history?: string;
  ladbrokes_history?: string;
  coral_history?: string;
  betfair_history?: string;
  betfred_history?: string;
  unibet_history?: string;
  bet_uk_history?: string;
  bet_goodwin_history?: string;
  bet_victor_history?: string;
  ten_bet_history?: string;
  seven_bet_history?: string;
  bet442_history?: string;
  betmgm_history?: string;
  betway_history?: string;
  boyle_sports_history?: string;
  copybet_history?: string;
  dragon_bet_history?: string;
  gentlemen_jim_history?: string;
  grosvenor_sports_history?: string;
  hollywood_bets_history?: string;
  matchbook_history?: string;
  midnite_history?: string;
  pricedup_bet_history?: string;
  quinn_bet_history?: string;
  sporting_index_history?: string;
  spreadex_history?: string;
  star_sports_history?: string;
  virgin_bet_history?: string;
  talksport_bet_history?: string;
  betfair_exchange_history?: string;
  // Average and sharp odds fields
  average_odds?: string;
  sharp_average_odds?: string;
  [key: string]: any;
}

// Utility function to parse comma-separated jockey/trainer stats
// Format: "runs,wins,win_percentage,profit_loss"
// Example: "72,5,7.0,-46.38"
const parseJockeyTrainerStats = (data: string | null | undefined) => {
  if (!data || typeof data !== 'string') return null;
  
  const parts = data.split(',');
  if (parts.length !== 4) return null;
  
  return {
    runs: parts[0] || null,
    wins: parts[1] || null,
    win_percentage: parts[2] || null,
    profit_loss: parts[3] || null
  };
};

export default function HandicapRacecard() {
  const params = useParams();
  const router = useRouter();
  const raceId = params.raceId as string;
  
  const [race, setRace] = useState<any>(null);
  const [allRaces, setAllRaces] = useState<any[]>([]);
  const [runners, setRunners] = useState<any[]>([]);
  const [odds, setOdds] = useState<RaceOdds[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [racingImageUrl, setRacingImageUrl] = useState<string>('');
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [ppTabSelection, setPpTabSelection] = useState<Record<string, string>>({});
  
  // Chart state
  const [selectedHorseForChart, setSelectedHorseForChart] = useState<string>('');
  const [enabledBookmakers, setEnabledBookmakers] = useState<Set<string>>(new Set(['bet365', 'william_hill', 'paddy_power', 'sky_bet']));
  const [enabledDataTypes, setEnabledDataTypes] = useState<Set<string>>(new Set(['average_odds']));
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchRaceData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Use the new racing data service
        console.log('HANDICAP CARDS: Calling racing data service...');
        const response = await fetch(`/api/racing-data-service?service=handicap-cards&raceId=${raceId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('HANDICAP CARDS: API response:', data);
        
        if (!data.race) {
          setError('Race not found');
          return;
        }
        
        // Get track image
        const imageUrl = await getRandomTrackImage(raceId);
        
        // Debug logging
        console.log('Race ID:', raceId);
        console.log('Runners Data:', data.runners);
        console.log('Odds Data:', data.odds);
        console.log('First runner horse_id:', data.runners[0]?.horse_id);
        console.log('First odds record:', data.odds[0]);
        
        // Check for timeform data
        const hasTimeformData = data.runners.some((runner: any) => runner.timeform);
        console.log('Has timeform data:', hasTimeformData);
        if (hasTimeformData) {
          console.log('Sample timeform data:', data.runners[0]?.timeform);
        } else {
          console.warn('No timeform data found for any runners');
        }
        
        setRace(data.race);
        setAllRaces([data.race]); // Only this race
        setRunners(data.runners);
        setOdds(data.odds as RaceOdds[]);
        setRacingImageUrl(imageUrl);
      } catch (err) {
        console.error('Error fetching race data:', err);
        setError('Failed to load race data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    if (raceId) {
      fetchRaceData();
    }
  }, [raceId]);

  const formatTime = (offTime: string | null, offDt: string | null): string => {
    if (offDt) {
      return new Date(offDt).toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Europe/London'
      });
    }
    return offTime || 'TBC';
  };

  const getRaceTypeColor = (raceType: string) => {
    switch (raceType?.toLowerCase()) {
      case 'flat': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'hurdle': return 'bg-green-500/20 text-green-400 border-green-500/30';  
      case 'chase': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getFormColor = (position: string): string => {
    if (!position || position === '-') return 'text-gray-400';
    if (position === '1') return 'text-green-400 font-bold'; // Bright green for 1
    if (['2', '3'].includes(position)) return 'text-green-700 font-semibold'; // Dark green for 2-3
    if (['4', '5'].includes(position)) return 'text-yellow-400'; // Yellow for 4-5
    if (['6', '7'].includes(position)) return 'text-orange-400'; // Orange for 6-7
    if (/^\d+$/.test(position) && parseInt(position) >= 8) return 'text-gray-400'; // Grey for 8+
    if (position === 'F') return 'text-red-400';
    if (position === 'U') return 'text-red-300';
    if (position === 'P') return 'text-red-200';
    return 'text-gray-300';
  };

  const formatFormString = (form: string | null): JSX.Element[] => {
    if (!form) return [<span key="no-form" className="text-gray-400">-</span>];
    
    return form.split('').map((char, index) => (
      <span key={index} className={getFormColor(char)}>
        {char}
      </span>
    ));
  };

  const getRunnerOdds = (horseId: string, runnerId?: number): RaceOdds | null => {
    // Try matching by horse_id first
    let foundOdds = odds.find(odd => odd.horse_id === horseId);
    
    // If not found and we have runner_id, try matching by runner_id
    if (!foundOdds && runnerId) {
      foundOdds = odds.find(odd => odd.runner_id === runnerId);
    }
    
    if (!foundOdds) {
      console.log(`No odds found for horse_id: ${horseId}, runner_id: ${runnerId}`);
      console.log('Available odds horse_ids:', odds.map(o => o.horse_id));
      console.log('Available odds runner_ids:', odds.map(o => o.runner_id));
    }
    return foundOdds || null;
  };

  const formatOdds = (oddsValue: string | undefined): string => {
    if (!oddsValue || oddsValue === 'SP') return 'SP';
    return oddsValue;
  };

  const getBestOdds = (runnerOdds: RaceOdds | null): { value: string; bookmaker: string } => {
    if (!runnerOdds) return { value: 'SP', bookmaker: '' };

    const oddsEntries = [
      { value: runnerOdds.bet365_opening, bookmaker: 'Bet365' },
      { value: runnerOdds.william_hill_opening, bookmaker: 'William Hill' },
      { value: runnerOdds.paddy_power_opening, bookmaker: 'Paddy Power' },
      { value: runnerOdds.sky_bet_opening, bookmaker: 'SkyBet' },
      { value: runnerOdds.ladbrokes_opening, bookmaker: 'Ladbrokes' },
      { value: runnerOdds.coral_opening, bookmaker: 'Coral' },
      { value: runnerOdds.betfair_opening, bookmaker: 'Betfair' },
      { value: runnerOdds.betfred_opening, bookmaker: 'Betfred' }
    ].filter(entry => entry.value && entry.value !== 'N/A' && entry.value !== '');

    if (oddsEntries.length === 0) return { value: 'SP', bookmaker: '' };

    let bestOdds = oddsEntries[0];
    let bestDecimal = convertOddsToDecimal(bestOdds.value!);

    for (const entry of oddsEntries) {
      if (entry.value) {
        const decimal = convertOddsToDecimal(entry.value);
        if (decimal > bestDecimal) {
          bestOdds = entry;
          bestDecimal = decimal;
        }
      }
    }

    return { value: bestOdds.value!, bookmaker: bestOdds.bookmaker };
  };

  const convertOddsToDecimal = (odds: string): number => {
    if (!odds || odds === 'SP') return 0;
    
    // Handle fractional odds (e.g., "5/1", "7/2")
    if (odds.includes('/')) {
      const [numerator, denominator] = odds.split('/').map(Number);
      return (numerator / denominator) + 1;
    }
    
    // Handle decimal odds
    return parseFloat(odds) || 0;
  };

  // Helper function to format bookmaker names
  const formatBookmakerName = (bookmaker: string): string => {
    const bookmakerMap: { [key: string]: string } = {
      'bet365': 'Bet 365',
      'william_hill': 'William Hill',
      'paddy_power': 'Paddy Power',
      'sky_bet': 'Sky Bet',
      'ladbrokes': 'Ladbrokes',
      'coral': 'Coral',
      'betfair': 'Betfair',
      'betfred': 'Betfred',
      'unibet': 'Unibet',
      'bet_uk': 'Bet UK',
      'bet_goodwin': 'Bet Goodwin',
      'bet_victor': 'Bet Victor',
      'sportnation': 'Sportnation',
      'boyle_sports': 'Boyle Sports',
      'virgin_bet': 'Virgin Bet',
      'spreadex': 'Spreadex',
      'betway': 'Betway',
      'bet_rivers': 'Bet Rivers',
      'kwiff': 'Kwiff',
      'tote': 'Tote'
    };
    return bookmakerMap[bookmaker] || bookmaker.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Parse support/resistance levels from the database text format
  const parseLatestLevel = (levelData: string | null): string => {
    if (!levelData || levelData.trim() === '') return '-';
    
    // Format: "4.3_12:23 / 3.55_12:23 / 3.35_12:23 / 3_12:23 / 4.3_12:26 / 4.3_12:27"
    // Split by " / " to get individual entries
    const entries = levelData.split(' / ').map(entry => entry.trim()).filter(entry => entry);
    if (entries.length === 0) return '-';
    
    // Get the last entry (most recent timestamp)
    const latestEntry = entries[entries.length - 1];
    const parts = latestEntry.split('_');
    
    if (parts.length >= 2) {
      const level = parseFloat(parts[0]);
      return isNaN(level) ? '-' : level.toFixed(2);
    }
    
    return '-';
  };

  // Parse percentage values and add % symbol
  const parseLatestPercentage = (levelData: string | null): string => {
    const value = parseLatestLevel(levelData);
    return value === '-' ? '-' : `${value}%`;
  };

  // Parse latest price change value from price_change column
  const parseLatestPriceChange = (priceChangeData: string | null): string => {
    if (!priceChangeData) return 'N/A';
    const lastEntry = priceChangeData.split(' / ').pop() || '';
    const priceChange = lastEntry.split('_')[0];
    return priceChange ? `${priceChange}%` : 'N/A';
  };

  // Parse odds history string and get the latest odds
  const getLatestOddsFromHistory = (historyString: string): { odds: number; time: string } | null => {
    if (!historyString || historyString.trim() === '') return null;
    
    // Parse format like "4.5_12:15 / 4.33_12:25 / 5.0_12:55"
    const entries = historyString.split(' / ').map(entry => entry.trim()).filter(entry => entry);
    if (entries.length === 0) return null;
    
    // Get the last entry (most recent)
    const lastEntry = entries[entries.length - 1];
    const [oddsStr, timeStr] = lastEntry.split('_');
    
    if (!oddsStr || !timeStr) return null;
    
    const odds = parseFloat(oddsStr);
    if (isNaN(odds)) return null;
    
    return { odds, time: timeStr };
  };

  // Get all odds entries from history string
  const getAllOddsFromHistory = (historyString: string): Array<{ odds: number; time: string }> => {
    if (!historyString || historyString.trim() === '') return [];
    
    const entries = historyString.split(' / ').map(entry => entry.trim()).filter(entry => entry);
    return entries.map(entry => {
      const [oddsStr, timeStr] = entry.split('_');
      const odds = parseFloat(oddsStr);
      if (!isNaN(odds) && timeStr) {
        return { odds, time: timeStr };
      }
      return null;
    }).filter(Boolean) as Array<{ odds: number; time: string }>;
  };

  // Get live best odds from all bookmaker history columns
  const getLiveBestOdds = (runnerOdds: RaceOdds | null): { value: string; bookmaker: string } => {
    if (!runnerOdds) return { value: 'SP', bookmaker: '' };

    const bookmakers = [
      { name: 'Bet365', history: runnerOdds.bet365_history },
      { name: 'William Hill', history: runnerOdds.william_hill_history },
      { name: 'Paddy Power', history: runnerOdds.paddy_power_history },
      { name: 'SkyBet', history: runnerOdds.sky_bet_history },
      { name: 'Ladbrokes', history: runnerOdds.ladbrokes_history },
      { name: 'Coral', history: runnerOdds.coral_history },
      { name: 'Betfair', history: runnerOdds.betfair_history },
      { name: 'Betfred', history: runnerOdds.betfred_history },
      { name: 'Unibet', history: runnerOdds.unibet_history },
      { name: 'BetUK', history: runnerOdds.bet_uk_history },
      { name: 'BetVictor', history: runnerOdds.bet_victor_history },
      { name: 'BetMGM', history: runnerOdds.betmgm_history },
      { name: 'Betway', history: runnerOdds.betway_history }
    ];

    let bestOdds = 0;
    let bestBookmaker = '';

    bookmakers.forEach(bookmaker => {
      if (bookmaker.history) {
        const latestOdds = getLatestOddsFromHistory(bookmaker.history);
        if (latestOdds && latestOdds.odds > bestOdds) {
          bestOdds = latestOdds.odds;
          bestBookmaker = bookmaker.name;
        }
      }
    });

    return bestOdds > 0 
      ? { value: bestOdds.toFixed(2), bookmaker: bestBookmaker }
      : { value: 'SP', bookmaker: '' };
  };

  // Get best opening odds from all bookmaker opening columns
  const getBestOpeningOdds = (runnerOdds: RaceOdds | null): { value: string; bookmaker: string } => {
    if (!runnerOdds) return { value: 'SP', bookmaker: '' };

    const openingOdds = [
      { value: runnerOdds.bet365_opening, bookmaker: 'Bet365' },
      { value: runnerOdds.william_hill_opening, bookmaker: 'William Hill' },
      { value: runnerOdds.paddy_power_opening, bookmaker: 'Paddy Power' },
      { value: runnerOdds.sky_bet_opening, bookmaker: 'SkyBet' },
      { value: runnerOdds.ladbrokes_opening, bookmaker: 'Ladbrokes' },
      { value: runnerOdds.coral_opening, bookmaker: 'Coral' },
      { value: runnerOdds.betfair_opening, bookmaker: 'Betfair' },
      { value: runnerOdds.betfred_opening, bookmaker: 'Betfred' },
      { value: runnerOdds.unibet_opening, bookmaker: 'Unibet' },
      { value: runnerOdds.bet_uk_opening, bookmaker: 'BetUK' },
      { value: runnerOdds.bet_victor_opening, bookmaker: 'BetVictor' },
      { value: runnerOdds.betmgm_opening, bookmaker: 'BetMGM' },
      { value: runnerOdds.betway_opening, bookmaker: 'Betway' }
    ].filter(entry => entry.value && entry.value !== 'N/A' && entry.value !== '');

    if (openingOdds.length === 0) return { value: 'SP', bookmaker: '' };

    let bestOdds = openingOdds[0];
    let bestDecimal = convertOddsToDecimal(bestOdds.value!);

    for (const entry of openingOdds) {
      if (entry.value) {
        const decimal = convertOddsToDecimal(entry.value);
        if (decimal > bestDecimal) {
          bestOdds = entry;
          bestDecimal = decimal;
        }
      }
    }

    return { value: bestOdds.value!, bookmaker: bestOdds.bookmaker };
  };

  // Get highest and lowest odds from all history for the day
  const getLiveAverageOdds = (runner: any): string => {
    if (!runner?.average_odds) return 'N/A';
    
    const historyData = getAllOddsFromHistory(runner.average_odds);
    if (historyData.length === 0) return 'N/A';
    
    // Get the most recent entry (latest timestamp)
    const latestEntry = historyData[historyData.length - 1];
    return latestEntry.odds.toFixed(2);
  };

  const getLiveSharpAverageOdds = (runner: any): string => {
    if (!runner?.sharp_average_odds) return 'N/A';
    
    const historyData = getAllOddsFromHistory(runner.sharp_average_odds);
    if (historyData.length === 0) return 'N/A';
    
    // Get the most recent entry (latest timestamp)
    const latestEntry = historyData[historyData.length - 1];
    return latestEntry.odds.toFixed(2);
  };

  const getHighLowOdds = (runnerOdds: RaceOdds | null): { 
    high: { value: string; bookmaker: string; time: string }; 
    low: { value: string; bookmaker: string; time: string } 
  } => {
    if (!runnerOdds) return { 
      high: { value: 'SP', bookmaker: '', time: '' }, 
      low: { value: 'SP', bookmaker: '', time: '' } 
    };

    const bookmakers = [
      { name: 'Bet365', history: runnerOdds.bet365_history },
      { name: 'William Hill', history: runnerOdds.william_hill_history },
      { name: 'Paddy Power', history: runnerOdds.paddy_power_history },
      { name: 'SkyBet', history: runnerOdds.sky_bet_history },
      { name: 'Ladbrokes', history: runnerOdds.ladbrokes_history },
      { name: 'Coral', history: runnerOdds.coral_history },
      { name: 'Betfair', history: runnerOdds.betfair_history },
      { name: 'Betfred', history: runnerOdds.betfred_history },
      { name: 'Unibet', history: runnerOdds.unibet_history },
      { name: 'BetUK', history: runnerOdds.bet_uk_history },
      { name: 'BetVictor', history: runnerOdds.bet_victor_history },
      { name: 'BetMGM', history: runnerOdds.betmgm_history },
      { name: 'Betway', history: runnerOdds.betway_history }
    ];

    let highestOdds = 0;
    let lowestOdds = Infinity;
    let highBookmaker = '';
    let lowBookmaker = '';
    let highTime = '';
    let lowTime = '';

    bookmakers.forEach(bookmaker => {
      if (bookmaker.history) {
        const allOdds = getAllOddsFromHistory(bookmaker.history);
        allOdds.forEach(({ odds, time }) => {
          if (odds > highestOdds) {
            highestOdds = odds;
            highBookmaker = bookmaker.name;
            highTime = time;
          }
          if (odds < lowestOdds) {
            lowestOdds = odds;
            lowBookmaker = bookmaker.name;
            lowTime = time;
          }
        });
      }
    });

    return {
      high: highestOdds > 0 
        ? { value: highestOdds.toFixed(2), bookmaker: highBookmaker, time: highTime }
        : { value: 'SP', bookmaker: '', time: '' },
      low: lowestOdds !== Infinity 
        ? { value: lowestOdds.toFixed(2), bookmaker: lowBookmaker, time: lowTime }
        : { value: 'SP', bookmaker: '', time: '' }
    };
  };

  const formatRaceClassAndPattern = (raceClass: string | null, pattern: string | null): string => {
    const parts: string[] = [];
    
    if (raceClass) {
      const formattedClass = raceClass.toLowerCase().startsWith('class') ? raceClass : `Class ${raceClass}`;
      parts.push(formattedClass);
    }
    
    if (pattern) {
      parts.push(pattern);
    }
    
    return parts.join(' - ') || 'Unknown';
  };

  const formatRaceTime = (race: any): string => {
    if (race.off_dt) {
      return new Date(race.off_dt).toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Europe/London'
      });
    }
    return race.off_time || race.time || 'TBC';
  };

  const getRaceType = (race: any): string => {
    return race.type || race.race_type || 'Unknown';
  };

  const formatPrizeMoney = (prize: string | number | null): string => {
    if (!prize) return 'Unknown';
    
    if (typeof prize === 'string') {
      // If already formatted with currency symbol, return as is
      if (prize.includes('£') || prize.includes('$') || prize.includes('€')) {
        return prize;
      }
      
      // Try to parse as number
      const numericValue = parseFloat(prize.replace(/[^\d.]/g, ''));
      if (!isNaN(numericValue)) {
        return `£${numericValue.toLocaleString()}`;
      }
      
      return prize;
    }
    
    if (typeof prize === 'number') {
      return `£${prize.toLocaleString()}`;
    }
    
    return 'Unknown';
  };

  const formatHeadgear = (headgearCode: string | null, isMultiple: boolean = false): string => {
    if (!headgearCode) return '';
    
    const headgearMap: { [key: string]: string } = {
      'b': 'Blinkers',
      'v': 'Visor',
      'e': 'Eye Shields',
      'h': 'Hood',
      'p': 'Cheek Pieces',
      't': 'Tongue Strap',
      'x': 'No Headgear Today'
    };
    
    return headgearMap[headgearCode.toLowerCase()] || headgearCode;
  };

  const parseHeadgearPieces = (headgearCode: string | null): string[] => {
    if (!headgearCode) return [];
    
    // Convert to lowercase for consistent matching
    const code = headgearCode.toLowerCase();
    
    // Individual headgear pieces
    const pieces: string[] = [];
    
    // Check for each possible headgear type
    if (code.includes('b')) pieces.push('b');
    if (code.includes('v')) pieces.push('v');
    if (code.includes('e')) pieces.push('e');
    if (code.includes('h')) pieces.push('h');
    if (code.includes('p')) pieces.push('p');
    if (code.includes('t')) pieces.push('t');
    if (code.includes('x')) pieces.push('x');
    
    // If no matches found but code exists, return the original code
    if (pieces.length === 0 && code) {
      return [headgearCode];
    }
    
    return pieces;
  };

  const formatWindSurgery = (windSurgery: string | null): string => {
    if (!windSurgery) return '';
    return 'Wind Surgery';
  };

  const formatSex = (sexCode: string | null): string => {
    if (!sexCode) return '';
    const sexMap: { [key: string]: string } = {
      'C': 'colt',
      'F': 'filly',
      'G': 'gelding',
      'H': 'horse',
      'M': 'mare'
    };
    return sexMap[sexCode] || sexCode;
  };

  // Function to extract just the numeric part of Timeform Rating
  const extractTimeformRating = (rating: string | null | undefined): string => {
    if (!rating) return '-';
    
    console.log('Extracting from rating:', rating);
    
    // Extract just the numeric part using regex
    const match = rating.match(/\d+/);
    return match ? match[0] : '-';
  };
  
  // Function to get Timeform Rating note based on symbols
  const getTimeformRatingNote = (rating: string | null | undefined): string | null => {
    if (!rating) return null;
    
    let note = null;
    
    if (rating.includes('p')) {
      note = "Likely to improve according to handicapper analysis.";
    } else if (rating.includes('P')) {
      note = "Capable of much better performance than current rating suggests.";
    } else if (rating.includes('+')) {
      note = "May perform better than current rating indicates.";
    } else if (rating.includes('?')) {
      note = "Rating is suspect or horse is currently out of form.";
    } else if (rating.includes('§§')) {
      note = "Horse considered too unsatisfactory for a reliable rating.";
    } else if (rating.includes('§')) {
      note = "Unreliable performer due to temperament issues.";
    } else if (rating.includes('xx')) {
      note = "Jumping ability too poor to warrant a reliable rating.";
    } else if (rating.includes('x')) {
      note = "Poor jumper - caution advised.";
    }
    
    return note;
  };

  const toggleCardExpansion = (horseId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [horseId]: !prev[horseId]
    }));
  };
  
  const selectPpTab = (horseId: string, tab: string) => {
    setPpTabSelection((prev: Record<string, string>) => ({
      ...prev,
      [horseId]: tab
    }));
  };
  
  const getValidBookmakers = (): Array<{ key: string; name: string; historyField: string }> => {
    // Complete list of ALL bookmakers from the RaceOdds interface
    const allBookmakers = [
      { key: 'bet365', name: 'Bet365', historyField: 'bet365_history' },
      { key: 'william_hill', name: 'William Hill', historyField: 'william_hill_history' },
      { key: 'paddy_power', name: 'Paddy Power', historyField: 'paddy_power_history' },
      { key: 'sky_bet', name: 'SkyBet', historyField: 'sky_bet_history' },
      { key: 'ladbrokes', name: 'Ladbrokes', historyField: 'ladbrokes_history' },
      { key: 'coral', name: 'Coral', historyField: 'coral_history' },
      { key: 'betfair', name: 'Betfair', historyField: 'betfair_history' },
      { key: 'betfred', name: 'Betfred', historyField: 'betfred_history' },
      { key: 'unibet', name: 'Unibet', historyField: 'unibet_history' },
      { key: 'bet_uk', name: 'BetUK', historyField: 'bet_uk_history' },
      { key: 'bet_goodwin', name: 'Goodwin', historyField: 'bet_goodwin_history' },
      { key: 'bet_victor', name: 'BetVictor', historyField: 'bet_victor_history' },
      { key: 'ten_bet', name: '10Bet', historyField: 'ten_bet_history' },
      { key: 'seven_bet', name: '7Bet', historyField: 'seven_bet_history' },
      { key: 'bet442', name: 'Bet442', historyField: 'bet442_history' },
      { key: 'betmgm', name: 'BetMGM', historyField: 'betmgm_history' },
      { key: 'betway', name: 'Betway', historyField: 'betway_history' },
      { key: 'boyle_sports', name: 'BoyleSports', historyField: 'boyle_sports_history' },
      { key: 'copybet', name: 'CopyBet', historyField: 'copybet_history' },
      { key: 'dragon_bet', name: 'DragonBet', historyField: 'dragon_bet_history' },
      { key: 'gentlemen_jim', name: 'Gentlemen Jim', historyField: 'gentlemen_jim_history' },
      { key: 'grosvenor_sports', name: 'Grosvenor', historyField: 'grosvenor_sports_history' },
      { key: 'hollywood_bets', name: 'Hollywood', historyField: 'hollywood_bets_history' },
      { key: 'matchbook', name: 'Matchbook', historyField: 'matchbook_history' },
      { key: 'midnite', name: 'Midnite', historyField: 'midnite_history' },
      { key: 'pricedup_bet', name: 'PricedUp', historyField: 'pricedup_bet_history' },
      { key: 'quinn_bet', name: 'QuinnBet', historyField: 'quinn_bet_history' },
      { key: 'sporting_index', name: 'Sporting Index', historyField: 'sporting_index_history' },
      { key: 'spreadex', name: 'Spreadex', historyField: 'spreadex_history' },
      { key: 'star_sports', name: 'Star Sports', historyField: 'star_sports_history' },
      { key: 'virgin_bet', name: 'Virgin Bet', historyField: 'virgin_bet_history' },
      { key: 'talksport_bet', name: 'talkSPORT BET', historyField: 'talksport_bet_history' },
      { key: 'betfair_exchange', name: 'Betfair Exchange', historyField: 'betfair_exchange_history' }
    ];

    const validBookmakers: Array<{ key: string; name: string; historyField: string }> = [];

    for (const bookmaker of allBookmakers) {
      // Check if this bookmaker has any live odds for any runner
      const hasLiveData = uniqueRunners.some(runner => {
        if (runner.number === 'NR') return false;
        const runnerOdds = getRunnerOdds(runner.horse_id, runner.id);
        if (!runnerOdds) return false;
        
        const historyValue = runnerOdds[bookmaker.historyField as keyof RaceOdds] as string;
        if (!historyValue) return false;
        
        const latest = getLatestOddsFromHistory(historyValue);
        return latest !== null;
      });

      if (hasLiveData) {
        validBookmakers.push(bookmaker);
      }
    }

    // Return all valid bookmakers (no limit for chart - let user choose)
    return validBookmakers;
  };

  // Get limited bookmakers for odds comparison table
  const getValidBookmakersForTable = (): Array<{ key: string; name: string; historyField: string }> => {
    const allValidBookmakers = getValidBookmakers();
    // Return max 12 bookmakers for table display
    return allValidBookmakers.slice(0, 12);
  };

  const getBookmakerOdds = (runnerOdds: RaceOdds | null, historyField: string): string => {
    if (!runnerOdds) return 'SP';
    
    const historyValue = runnerOdds[historyField as keyof RaceOdds] as string;
    if (!historyValue) return 'SP';
    
    const latest = getLatestOddsFromHistory(historyValue);
    return latest ? latest.odds.toFixed(2) : 'SP';
  };

  // Helper functions for odds charting
  const parseTimeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatMinutesToTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Generate proper X-axis time points (round hours/half hours + race time)
  const generateXAxisTimePoints = (minTime: number, maxTime: number): Array<{ time: number; label: string }> => {
    const timePoints: Array<{ time: number; label: string }> = [];
    const timeRange = maxTime - minTime;
    
    // Determine interval based on time range to avoid overcrowding
    let interval = 60; // Default to hourly
    if (timeRange <= 120) { // 2 hours or less
      interval = 30; // 30-minute intervals
    } else if (timeRange <= 360) { // 6 hours or less
      interval = 60; // 1-hour intervals
    } else {
      interval = 120; // 2-hour intervals for longer ranges
    }
    
    // Start from the first round interval before or at minTime
    const startHour = Math.floor(minTime / 60);
    const startMinute = minTime % 60;
    let currentTime: number;
    
    if (interval === 30) {
      if (startMinute <= 30) {
        currentTime = startHour * 60; // Round down to hour
      } else {
        currentTime = startHour * 60 + 30; // Round to next half hour
      }
    } else {
      currentTime = startHour * 60; // Round down to hour for larger intervals
    }
    
    // Generate time intervals (stop before maxTime so we don't show the race off time)
    while (currentTime < maxTime) { // Changed <= to < so chart cuts off at race time without showing the label
      const hours = Math.floor(currentTime / 60);
      const minutes = currentTime % 60;
      const label = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      
      timePoints.push({ time: currentTime, label });
      currentTime += interval;
    }
    
    // Limit total points to avoid overcrowding (max 8 points)
    if (timePoints.length > 8) {
      const step = Math.ceil(timePoints.length / 8);
      const filteredPoints = timePoints.filter((_, index) => index % step === 0);
      return filteredPoints;
    }
    
    return timePoints;
  };

  const getBookmakerChartData = (runnerOdds: RaceOdds | null, bookmakerKey: string) => {
    if (!runnerOdds) return [];
    
    const openingField = `${bookmakerKey}_opening` as keyof RaceOdds;
    const historyField = `${bookmakerKey}_history` as keyof RaceOdds;
    
    const opening = runnerOdds[openingField] as string;
    const history = runnerOdds[historyField] as string;
    
    const dataPoints: Array<{ time: number; odds: number; timeLabel: string }> = [];
    
    // Add opening odds (assume 9:00 AM start of trading)
    if (opening && opening !== 'SP' && !isNaN(Number(opening))) {
      dataPoints.push({
        time: parseTimeToMinutes('09:00'),
        odds: Number(opening),
        timeLabel: '09:00'
      });
    }
    
    // Add history points
    if (history) {
      const historyPoints = getAllOddsFromHistory(history);
      historyPoints.forEach(point => {
        dataPoints.push({
          time: parseTimeToMinutes(point.time),
          odds: point.odds,
          timeLabel: point.time
        });
      });
    }
    
    // Calculate the end time - either current time or race off time, whichever is later
    const now = new Date();
    const currentTimeMinutes = parseTimeToMinutes(now.toLocaleTimeString('en-GB', { 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Europe/London'
    }));
    
    const raceTime = race?.off ? parseTimeToMinutes(race.off) : currentTimeMinutes;
    const endTime = Math.max(currentTimeMinutes, raceTime);
    const endTimeLabel = formatMinutesToTime(endTime);
    
    // Extend line to current time/race time if we have data
    if (dataPoints.length > 0) {
      const lastPoint = dataPoints[dataPoints.length - 1];
      if (lastPoint.time < endTime) {
        dataPoints.push({
          time: endTime,
          odds: lastPoint.odds, // Keep the last known odds
          timeLabel: endTimeLabel
        });
      }
    }
    
    return dataPoints.sort((a, b) => a.time - b.time);
  };

  const getBookmakerColor = (bookmakerKey: string): string => {
    const colors: { [key: string]: string } = {
      'bet365': '#FFD700',        // Bright gold
      'william_hill': '#00BFFF',  // Deep sky blue
      'paddy_power': '#32CD32',   // Lime green
      'sky_bet': '#4169E1',       // Royal blue
      'ladbrokes': '#FF4500',     // Orange red
      'coral': '#FF6347',         // Tomato
      'betfair': '#FFB347',       // Peach
      'betfred': '#9370DB',       // Medium purple
      'unibet': '#00FF7F',        // Spring green
      'bet_uk': '#FF1493',        // Deep pink
      'bet_victor': '#8A2BE2',    // Blue violet
      'ten_bet': '#00CED1',       // Dark turquoise
      'betmgm': '#FFA500',        // Orange
      'betway': '#20B2AA',        // Light sea green
      'boyle_sports': '#DC143C',  // Crimson
      'seven_bet': '#40E0D0',     // Turquoise
      'bet442': '#FF69B4',        // Hot pink
      'copybet': '#DA70D6',       // Orchid
      'dragon_bet': '#00FA9A',    // Medium spring green
      'gentlemen_jim': '#B22222',  // Fire brick
      'grosvenor_sports': '#D2691E', // Chocolate
      'hollywood_bets': '#C71585',   // Medium violet red
      'matchbook': '#1E90FF',        // Dodger blue
      'midnite': '#483D8B',          // Dark slate blue
      'pricedup_bet': '#FF8C00',     // Dark orange
      'quinn_bet': '#228B22',        // Forest green
      'sporting_index': '#008B8B',   // Dark cyan
      'spreadex': '#9932CC',         // Dark orchid
      'star_sports': '#FFFF00',      // Yellow
      'virgin_bet': '#E6194B',       // Red
      'talksport_bet': '#4682B4',    // Steel blue
      'betfair_exchange': '#FF7F50'  // Coral
    };
    return colors[bookmakerKey] || '#6b7280';
  };

  // Get data type colors
  const getDataTypeColor = (dataType: string): string => {
    const colors: { [key: string]: string } = {
      'average_odds': '#10B981',     // Green
      'sharp_average_odds': '#F59E0B', // Amber
      '5_moving_average': '#3B82F6',   // Blue
      '20_moving_average': '#8B5CF6',  // Purple  
      '60_moving_average': '#EF4444',  // Red
      '5_bollinger_bands': '#06B6D4',  // Cyan
      '20_bollinger_bands': '#84CC16', // Lime
      '60_bollinger_bands': '#F97316'  // Orange
    };
    return colors[dataType] || '#9CA3AF';
  };

  // Parse data from runner columns (format: "value_timestamp / value_timestamp")
  const getRunnerChartData = (runner: any, dataType: string) => {
    if (!runner || !runner[dataType]) return [];
    
    const historyData = getAllOddsFromHistory(runner[dataType]);
    return historyData.map(entry => ({
      odds: entry.odds,
      time: parseTimeToMinutes(entry.time)
    }));
  };

  // Parse Bollinger Bands data (format: "upper_lower_timestamp / upper_lower_timestamp")
  const getBollingerBandsChartData = (runner: any, dataType: string) => {
    if (!runner || !runner[dataType]) return [];
    
    const entries = runner[dataType].split(' / ').map((entry: string) => entry.trim()).filter((entry: string) => entry);
    const result = [];
    
    for (const entry of entries) {
      const parts = entry.split('_');
      if (parts.length === 3) {
        const upper = parseFloat(parts[0]);
        const lower = parseFloat(parts[1]);
        const time = parts[2];
        if (!isNaN(upper) && !isNaN(lower) && time) {
          result.push({
            upper,
            lower,
            time: parseTimeToMinutes(time)
          });
        }
      }
    }
    
    return result.sort((a, b) => a.time - b.time);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-betting-dark text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-betting-green mx-auto mb-4"></div>
            <p className="text-gray-400">Loading racecard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !race) {
    return (
      <div className="min-h-screen bg-betting-dark text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-20">
            <h1 className="text-2xl font-heading text-red-400 mb-4">Error Loading Racecard</h1>
            <p className="text-gray-400">{error || 'Race not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Deduplicate runners based on horse_id to prevent multiple cards for same horse
  const uniqueRunners = runners.reduce((acc: any[], current: any) => {
    const existingRunner = acc.find(runner => runner.horse_id === current.horse_id);
    if (!existingRunner) {
      acc.push(current);
    }
    return acc;
  }, []);

  // Function to check if this is first or second race after trainer/owner switch
  const checkSwitchStatus = (prevEntities: any[] | null, pastPerformances: any[]): { isSwitch: boolean, switchNumber: number, previousEntity: string | null, switchDate: string | null } => {
    if (!prevEntities || !Array.isArray(prevEntities) || prevEntities.length === 0) {
      return { isSwitch: false, switchNumber: 0, previousEntity: null, switchDate: null };
    }
    
    // Sort by most recent switch date
    const sortedEntities = [...prevEntities].sort((a, b) => {
      return new Date(b.change_date).getTime() - new Date(a.change_date).getTime();
    });
    
    const mostRecentSwitch = sortedEntities[0];
    const switchDate = new Date(mostRecentSwitch.change_date);
    
    // Count races since the switch
    let racesSinceSwitch = 0;
    if (Array.isArray(pastPerformances)) {
      for (const pp of pastPerformances) {
        const ppDate = pp.date ? new Date(pp.date) : null;
        if (ppDate && ppDate > switchDate) {
          racesSinceSwitch++;
        }
      }
    }
    
    // Only show for first or second race after switch
    const isSwitch = racesSinceSwitch < 2;
    const switchNumber = racesSinceSwitch === 0 ? 1 : 2;
    
    return { 
      isSwitch, 
      switchNumber, 
      previousEntity: mostRecentSwitch.trainer || mostRecentSwitch.owner || null,
      switchDate: mostRecentSwitch.change_date
    };
  };

  // Format date for tooltip
  const formatSwitchDate = (dateStr: string | null): string => {
    if (!dateStr) return '';
    
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  // Function to normalize track names for display
  const normalizeTrackName = (trackName: string | null | undefined): string => {
    if (!trackName) return '-';
    
    // Map Timeform track names to standard display names
    const trackNameMap: { [key: string]: string } = {
      'Catterick Bridge': 'Catterick',
      'Chelmsford City': 'Chelmsford',
      'Epsom Downs': 'Epsom',
      'Fontwell Park': 'Fontwell',
      'Great Yarmouth': 'Yarmouth',
      'Hamilton Park': 'Hamilton',
      'Haydock Park': 'Haydock',
      'Kempton Park': 'Kempton',
      'Lingfield Park': 'Lingfield',
      'Market Rasen': 'Rasen',
      'Sandown Park': 'Sandown',
      'Stratford-on-Avon': 'Stratford',
      'Wolverhampton': 'Wolves'
    };
    
    return trackNameMap[trackName] || trackName;
  };

  return (
    <Layout>
      <PageProtection
        requiredAuth={true}
        minimumTier={MembershipTier.Premium}
        redirectTo="/membership"
        notificationMessage="You need a paid membership to access Handicap Cards"
      >
      <div className="min-h-screen text-white relative">
        {/* Background wallpaper */}
        <div className="bg-wallpaper"></div>
        {/* Semi-transparent overlay for better readability */}
        <div className="bg-overlay"></div>
        
        <div className="container mx-auto px-4 py-8 relative z-10">
          {/* Header Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Link 
              href="/horse-racing/racecards"
              className="flex items-center text-betting-green hover:text-betting-secondary transition"
            >
              <ArrowLeft size={20} className="mr-2" />
              Back to Racecards
            </Link>
            <div className="text-sm text-gray-400">
              Updated: {getCurrentUKDateInfo().ukTime.split('T')[1].split('.')[0]} UK
            </div>
          </div>
          
          {/* Quick Race Switcher */}
          {race && allRaces.length > 0 && (() => {
            const sameCourseRaces = allRaces.filter(r => r.course === race.course && r.race_id !== raceId);
            if (sameCourseRaces.length === 0) return null;
            
            return (
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-200 mb-3 tracking-wide">
                  Other races at {race.course}:
                </label>
                <div className="flex flex-wrap gap-2">
                  {sameCourseRaces
                    .sort((a, b) => (a.off || '').localeCompare(b.off || ''))
                    .map((raceItem) => (
                      <button
                        key={raceItem.race_id}
                        onClick={() => router.push(`/horse-racing/racecards/handicap-cards/${raceItem.race_id}`)}
                        className={`px-3 py-2 rounded-lg border text-sm font-medium transition-all duration-300 cursor-pointer hover:shadow-md ${
                          raceItem.race_id === raceId
                            ? 'bg-betting-green/20 text-betting-green border-betting-green/50'
                            : 'bg-gradient-to-r from-gray-700/30 to-gray-600/30 text-gray-300 border-gray-600/20 hover:border-gray-500/40'
                        }`}
                      >
                        {formatTime(raceItem.off, raceItem.off_dt)}
                      </button>
                    ))}
                </div>
              </div>
            );
          })()}

          {/* Race Header */}
          <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 backdrop-blur-md rounded-xl overflow-hidden mb-8 shadow-xl">
            <div className="flex flex-col lg:flex-row">
              {/* Cover Photo */}
              <div className="lg:w-64 h-40 lg:h-auto relative">
                <img 
                  src={racingImageUrl}
                  alt="Racing"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/fallback-track.jpg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent"></div>
              </div>

              {/* Race Content */}
              <div className="flex-1 p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  {/* Race Title & Info */}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-3 mb-4">
                      <div className="bg-gradient-to-r from-blue-600 to-blue-800 px-4 py-2 rounded-lg font-mono font-bold text-lg text-white shadow-lg">
                        {formatRaceTime(race)}
                      </div>
                      <div className="px-3 py-1 rounded-lg bg-gray-800/80 text-white text-sm font-semibold shadow-md">
                        {getRaceType(race)}
                      </div>
                      {(race.race_class || race.pattern) && (
                        <div className="px-3 py-1 rounded-lg bg-gray-800/80 text-white text-sm font-semibold shadow-md">
                          {formatRaceClassAndPattern(race.race_class, race.pattern)}
                        </div>
                      )}
                      {race.big_race && (
                        <div className="px-3 py-1 rounded-lg bg-yellow-600 text-white text-sm font-semibold shadow-md">
                          BIG RACE
                        </div>
                      )}
                    </div>
                    
                    <h1 className="text-4xl font-heading font-extrabold text-white mb-3 tracking-tight">
                      {race.race_name || 'Race Details'}
                    </h1>
                    <div className="text-lg text-gray-200 mb-4 flex items-center">
                      <span className="font-semibold">{race.course || 'Unknown Course'}</span>
                      {race.distance && (
                        <>
                          <span className="mx-2 text-gray-400">•</span>
                          <span>{race.distance}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <span className="text-gray-400 block mb-1">Course</span>
                        <div className="text-white font-semibold">{race.course}</div>
                      </div>
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <span className="text-gray-400 block mb-1">Distance</span>
                        <div className="text-white font-semibold">{race.distance_round || race.distance}</div>
                      </div>
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <span className="text-gray-400 block mb-1">Prize</span>
                        <div className="text-blue-400 font-semibold">{formatPrizeMoney(race.prize)}</div>
                      </div>
                      <div className="bg-gray-800/50 p-3 rounded-lg">
                        <span className="text-gray-400 block mb-1">Field Size</span>
                        <div className="text-white font-semibold">{uniqueRunners.length} runners</div>
                      </div>
                    </div>
                  </div>

                  {/* Race Conditions */}
                  <div className="lg:w-72 bg-gray-800/60 rounded-lg p-5 shadow-lg">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                      <span className="w-2 h-6 bg-blue-500 rounded-sm mr-2"></span>
                      Race Conditions
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Going:</span>
                        <span className="text-white font-medium">{race.going || 'Unknown'}</span>
                      </div>
                      {race.weather && race.weather.toLowerCase() !== 'unknown' && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Weather:</span>
                          <span className="text-white font-medium">{race.weather}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-400">Surface:</span>
                        <span className="text-white font-medium">{race.surface || 'Turf'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Age Restriction:</span>
                        <span className="text-white font-medium">{race.age_band || 'All Ages'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Race Type:</span>
                        <span className="text-white font-medium">{race.race_type || 'Handicap'}</span>
                      </div>
                      {race.conditions_text && (
                        <div className="pt-3 border-t border-gray-700">
                          <span className="text-gray-400 block mb-1">Conditions:</span>
                          <div className="text-xs text-gray-300 leading-relaxed">
                            {race.conditions_text}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Combined Expert Analysis & Pace Predictor */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 rounded-xl backdrop-blur-sm shadow-xl p-6">
              <div className="flex items-center space-x-3 mb-6">
                <span className="w-2 h-6 bg-blue-500 rounded-sm"></span>
                <h2 className="text-xl font-heading font-bold text-white">Pace Analysis</h2>
                  </div>
              
              {/* Expert Analysis Section */}
              <ExpertAnalysis 
                race={race} 
                runners={uniqueRunners} 
              />
              
              {/* Pace Predictor Section */}
              <PacePredictor race={race} runners={uniqueRunners} />
                  </div>
                  </div>

          {/* Runners Table */}
          <div className="bg-gradient-to-r from-gray-900/80 to-gray-800/80 rounded-xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-700/50">
              <div className="flex items-center space-x-3">
                <span className="w-2 h-6 bg-blue-500 rounded-sm"></span>
              <h2 className="text-xl font-heading font-bold text-white">
                Runners & PPs
              </h2>
              </div>
            </div>

            {/* Runners - DRF Style Cards */}
            <div className="space-y-4 p-4">
            {/* Sort runners: by Live BO odds (favorites first), then NR runners */}
            {[...uniqueRunners]
              .sort((a, b) => {
                const aIsNR = a.number === 'NR';
                const bIsNR = b.number === 'NR';
                
                // NR runners always go to bottom
                if (aIsNR && !bIsNR) return 1;
                if (!aIsNR && bIsNR) return -1;
                if (aIsNR && bIsNR) return 0; // Both NR, keep original order
                
                // For regular runners, sort by Live BO odds
                const aOdds = getRunnerOdds(a.horse_id, a.id);
                const bOdds = getRunnerOdds(b.horse_id, b.id);
                
                const aLiveBest = getLiveBestOdds(aOdds);
                const bLiveBest = getLiveBestOdds(bOdds);
                
                // If both have SP or no odds, fall back to official number
                if ((aLiveBest.value === 'SP' || !aLiveBest.value) && (bLiveBest.value === 'SP' || !bLiveBest.value)) {
                  const aNum = parseInt(a.number) || 999;
                  const bNum = parseInt(b.number) || 999;
                  return aNum - bNum;
                }
                
                // If one has SP and other has odds, odds come first
                if (aLiveBest.value === 'SP' || !aLiveBest.value) return 1;
                if (bLiveBest.value === 'SP' || !bLiveBest.value) return -1;
                
                // Both have odds - convert to decimal and sort (shortest odds first)
                const aDecimal = convertOddsToDecimal(aLiveBest.value);
                const bDecimal = convertOddsToDecimal(bLiveBest.value);
                return aDecimal - bDecimal;
              })
              .map((runner, index) => {
                const runnerOdds = getRunnerOdds(runner.horse_id, runner.id);
                const bestOdds = getBestOdds(runnerOdds);
                const isNonRunner = runner.number === 'NR';
                
                return (
                  <div 
                    key={runner.id} 
                    className={`p-4 transition rounded-xl shadow-lg backdrop-blur-sm border ${
                      isNonRunner 
                        ? 'opacity-40 hover:bg-gray-500/5 border-gray-500/30 bg-gradient-to-br from-gray-800/50 via-gray-700/50 to-gray-800/50' 
                        : 'hover:bg-betting-green/5 border-gray-600/30 bg-gradient-to-br from-gray-800/60 via-gray-700/60 to-gray-800/60'
                    }`}
                  >
                    {/* DRF-Style Comprehensive Horse Card */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-2">
                      
                      {/* Left Section - Silk + Basic Info */}
                      <div className="lg:col-span-3">
                        <div className="flex items-start gap-2 mb-0.5">
                          {/* Jockey Silk */}
                          <div className="flex-shrink-0">
                            {runner.silk_url ? (
                              <img 
                                src={runner.silk_url} 
                                alt={`${runner.owner || 'Owner'} silks`}
                                className="w-14 h-12 object-contain shadow-md"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-14 h-12 bg-gray-500/20 shadow-md flex items-center justify-center">
                                <span className="text-xs text-gray-500">?</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Horse Number and Name */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold shadow-md ${
                                isNonRunner 
                                  ? 'bg-gray-500/70 text-white' 
                                  : 'bg-blue-600 text-white'
                              }`}>
                            {runner.number || index + 1}
                          </div>
                              <h3 className={`font-bold text-lg tracking-tight truncate font-horse ${
                                isNonRunner ? 'text-gray-500' : 'text-white'
                              }`}>
                                {runner.horse_name}
                                {runner.draw && (
                                  <span className="ml-1 text-white">
                                    (<span className="text-betting-green">{runner.draw}</span>)
                                  </span>
                                )}
                              </h3>
                            </div>
                          </div>
                        </div>
                        
                        {/* Horse data pills - moved to left section */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {/* Weight */}
                          <div className="px-2 py-1 bg-gray-700/50 rounded-md text-xs text-white">
                            WT: {runner.weight_lbs || '-'}
                          </div>
                          
                              {/* Age */}
                          <div className="px-2 py-1 bg-gray-700/50 rounded-md text-xs text-white">
                                {runner.age ? `${runner.age}yo` : '-'}
                              </div>
                              
                          {/* Sex - capitalized */}
                          <div className="px-2 py-1 bg-gray-700/50 rounded-md text-xs text-white">
                            {formatSex(runner.sex)?.charAt(0).toUpperCase() + formatSex(runner.sex)?.slice(1) || '-'}
                              </div>
                              
                          {/* Remove OR pill since it's duplicated in the data points grid */}
                          
                          {/* Trainer Switch Indicator */}
                          {(() => {
                            // Get past performances from timeform data
                            let pastPerformances: any[] = [];
                            if (runner.timeform) {
                              if (Array.isArray(runner.timeform)) {
                                pastPerformances = runner.timeform;
                              } else if (runner.timeform.pp_1_date) {
                                // Collect past performances from object structure
                                pastPerformances = [1, 2, 3, 4, 5, 6]
                                  .map(i => ({
                                    date: runner.timeform[`pp_${i}_date`],
                                    track: runner.timeform[`pp_${i}_track`]
                                  }))
                                  .filter(pp => pp.date);
                              }
                            }
                            
                            const trainerSwitch = checkSwitchStatus(runner.prev_trainers as any[], pastPerformances);
                            
                            if (trainerSwitch.isSwitch) {
                              return (
                                <div className="relative group">
                                  <div className="px-2 py-1 bg-purple-700/50 rounded-md text-xs text-white">
                                    {trainerSwitch.switchNumber === 1 ? '1st' : '2nd'} Trainer Switch
                                  </div>
                                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs p-2 rounded shadow-lg z-10 whitespace-nowrap">
                                    <p>Previous Trainer: {trainerSwitch.previousEntity}</p>
                                    <p>Changed: {formatSwitchDate(trainerSwitch.switchDate)}</p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                          
                          {/* Owner Switch Indicator */}
                          {(() => {
                            // Get past performances from timeform data
                            let pastPerformances: any[] = [];
                            if (runner.timeform) {
                              if (Array.isArray(runner.timeform)) {
                                pastPerformances = runner.timeform;
                              } else if (runner.timeform.pp_1_date) {
                                // Collect past performances from object structure
                                pastPerformances = [1, 2, 3, 4, 5, 6]
                                  .map(i => ({
                                    date: runner.timeform[`pp_${i}_date`],
                                    track: runner.timeform[`pp_${i}_track`]
                                  }))
                                  .filter(pp => pp.date);
                              }
                            }
                            
                            const ownerSwitch = checkSwitchStatus(runner.prev_owners as any[], pastPerformances);
                            
                            if (ownerSwitch.isSwitch) {
                              return (
                                <div className="relative group">
                                  <div className="px-2 py-1 bg-indigo-700/50 rounded-md text-xs text-white">
                                    {ownerSwitch.switchNumber === 1 ? '1st' : '2nd'} Owner Switch
                                  </div>
                                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs p-2 rounded shadow-lg z-10 whitespace-nowrap">
                                    <p>Previous Owner: {ownerSwitch.previousEntity}</p>
                                    <p>Changed: {formatSwitchDate(ownerSwitch.switchDate)}</p>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          })()}
                          
                                                    {/* Headgear if present */}
                              {runner.headgear ? (() => {
                                const pieces = parseHeadgearPieces(runner.headgear);
                                return pieces.map((piece, index) => (
                              <div key={index} className="px-2 py-1 bg-gray-700/50 rounded-md text-xs text-white">
                                {formatHeadgear(piece, false)}
                                    {runner.headgear_run && (
                                  <sup className="text-amber-400 text-[10px] ml-0.5 font-semibold">
                                    {runner.headgear_run}
                                      </sup>
                                    )}
                                  </div>
                                ));
                          })() : null}
                              
                              {/* Wind Surgery */}
                              {runner.wind_surgery && (
                            <div className="px-2 py-1 bg-gray-700/50 rounded-md text-xs text-white">
                                  {formatWindSurgery(runner.wind_surgery)}
                                  {runner.wind_surgery_run && (
                                <sup className="text-amber-400 text-[10px] ml-0.5 font-semibold">
                                  {runner.wind_surgery_run}
                                    </sup>
                                  )}
                                </div>
                              )}
                          
                          {/* Flags */}
                          {runner.past_results_flags && Array.isArray(runner.past_results_flags) && 
                            runner.past_results_flags.map((flag: string, index: number) => {
                              let flagText = '';
                              if (flag === 'C') flagText = 'Course Winner';
                              else if (flag === 'D') flagText = 'Distance Winner';
                              else if (flag === 'CD') flagText = 'C&D Winner';
                              else if (flag === 'BF') flagText = 'Beaten Favourite LTO';
                              else if (flag === 'F') flagText = 'Fell';
                              else if (flag === 'R') flagText = 'Refused';
                              else if (flag === 'BD') flagText = 'Brought Down';
                              else if (flag === 'U' || flag === 'UR') flagText = 'Unseated Rider';
                              else flagText = flag;
                              
                              return (
                                <div key={index} className="px-2 py-1 bg-gray-700/50 rounded-md text-xs text-white">
                                  {flagText}
                            </div>
                              );
                            })
                          }
                          
                          {/* Sire - shortened */}
                          {runner.sire && (
                            <div className="px-2 py-1 bg-gray-700/50 rounded-md text-xs text-white">
                              S: {runner.sire}
                          </div>
                          )}
                          
                          {/* Dam - shortened */}
                          {runner.dam && (
                            <div className="px-2 py-1 bg-gray-700/50 rounded-md text-xs text-white">
                              D: {runner.dam}
                        </div>
                          )}
                          
                          {/* Owner - shortened */}
                          {runner.owner && (
                            <div className="px-2 py-1 bg-gray-700/50 rounded-md text-xs text-white">
                              O: {runner.owner}
                          </div>
                          )}
                        </div>
                      </div>

                      {/* Middle Section - Form & Ratings */}
                      <div className="lg:col-span-4">
                        <div className="space-y-2">
                          {/* Top Data Row - Form, Jockey, Trainer */}
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            {/* Form */}
                          <div>
                              <div className={`text-sm font-medium ${
                                isNonRunner ? 'text-gray-500' : 'text-white'
                              }`}>FORM</div>
                              <div className="font-mono text-base tracking-wider">
                              {formatFormString(runner.form)}
                              </div>
                            </div>
                            
                            {/* Jockey */}
                            <div>
                              <div className={`text-sm font-medium ${
                                isNonRunner ? 'text-gray-500' : 'text-white'
                              }`}>JOCKEY</div>
                              <div className={`relative group font-semibold text-sm ${
                                isNonRunner ? 'text-gray-500' : 'text-blue-400 hover:text-blue-300 cursor-pointer transition-colors'
                              }`}>
                                {runner.jockey || '-'}
                                
                                {/* Jockey Stats Tooltip */}
                                {runner.jockey && (() => {
                                  // Parse comma-separated stats
                                  const lifetimeStats = parseJockeyTrainerStats(runner.jockey_lifetime);
                                  const twelveMonthStats = parseJockeyTrainerStats(runner.jockey_12_months);
                                  const threeMonthStats = parseJockeyTrainerStats(runner.jockey_3_months);
                                  const trainerStats = parseJockeyTrainerStats(runner.jockey_trainer);
                                  const trainer3mStats = parseJockeyTrainerStats(runner.jockey_trainer_3_months);
                                  const ownerStats = parseJockeyTrainerStats(runner.jockey_owner);
                                  const courseStats = parseJockeyTrainerStats(runner.jockey_course);
                                  
                                  // Check if any jockey stats exist
                                  const hasLifetime = lifetimeStats;
                                  const has12Months = twelveMonthStats;
                                  const has3Months = threeMonthStats;
                                  const hasTrainer = trainerStats;
                                  const hasTrainer3m = trainer3mStats;
                                  const hasOwner = ownerStats;
                                  const hasCourse = courseStats;
                                  
                                  // Check if any data exists at all
                                  const hasAnyData = hasLifetime || has12Months || has3Months || hasTrainer || hasTrainer3m || hasOwner || hasCourse;
                                  
                                  if (!hasAnyData) return null;
                                  
                                  // Check which columns have data
                                  const hasRuns = lifetimeStats?.runs || twelveMonthStats?.runs || threeMonthStats?.runs || 
                                                 trainerStats?.runs || trainer3mStats?.runs || 
                                                 ownerStats?.runs || courseStats?.runs;
                                  
                                  const hasWins = lifetimeStats?.wins || twelveMonthStats?.wins || threeMonthStats?.wins || 
                                                 trainerStats?.wins || trainer3mStats?.wins || 
                                                 ownerStats?.wins || courseStats?.wins;
                                  
                                  const hasWinPct = lifetimeStats?.win_percentage || twelveMonthStats?.win_percentage || threeMonthStats?.win_percentage || 
                                                   trainerStats?.win_percentage || trainer3mStats?.win_percentage || 
                                                   ownerStats?.win_percentage || courseStats?.win_percentage;
                                  
                                  const hasPL = lifetimeStats?.profit_loss || twelveMonthStats?.profit_loss || threeMonthStats?.profit_loss || 
                                               trainerStats?.profit_loss || trainer3mStats?.profit_loss || 
                                               ownerStats?.profit_loss || courseStats?.profit_loss;
                                  
                                  const isTopHorse = index === 0;
                                  const positionClass = isTopHorse 
                                    ? "absolute left-full ml-2 -top-16 hidden group-hover:block bg-gray-900/95 backdrop-blur-sm text-white text-xs p-2 rounded shadow-lg z-[9999] w-[280px]"
                                    : "absolute left-0 bottom-full mb-1 hidden group-hover:block bg-gray-900/95 backdrop-blur-sm text-white text-xs p-2 rounded shadow-lg z-[9999] w-[280px]";
                                  
                                  return (
                                    <div className={positionClass}>
                                      <table className="w-full text-[10px] border-collapse">
                                        <thead>
                                          <tr className="border-b border-gray-700/50">
                                            <th className="text-left py-0.5 px-1 text-gray-400 font-medium">Category</th>
                                            {hasRuns && <th className="text-center py-0.5 px-0.5 text-gray-400 font-medium">Runs</th>}
                                            {hasWins && <th className="text-center py-0.5 px-0.5 text-gray-400 font-medium">Wins</th>}
                                            {hasWinPct && <th className="text-center py-0.5 px-0.5 text-gray-400 font-medium">Win%</th>}
                                            {hasPL && <th className="text-center py-0.5 px-0.5 text-gray-400 font-medium">P/L</th>}
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700/30">
                                          {hasLifetime && (
                                            <tr>
                                              <td className="text-left py-1 px-2">Lifetime</td>
                                              {hasRuns && <td className="text-center py-1 px-1">{lifetimeStats?.runs || '-'}</td>}
                                              {hasWins && <td className="text-center py-1 px-1">{lifetimeStats?.wins || '-'}</td>}
                                              {hasWinPct && <td className="text-center py-1 px-1">{lifetimeStats?.win_percentage || '-'}</td>}
                                              {hasPL && <td className="text-center py-1 px-1">{lifetimeStats?.profit_loss || '-'}</td>}
                                            </tr>
                                          )}
                                          {has12Months && (
                                            <tr>
                                              <td className="text-left py-1 px-2">12 Months</td>
                                              {hasRuns && <td className="text-center py-1 px-1">{twelveMonthStats?.runs || '-'}</td>}
                                              {hasWins && <td className="text-center py-1 px-1">{twelveMonthStats?.wins || '-'}</td>}
                                              {hasWinPct && <td className="text-center py-1 px-1">{twelveMonthStats?.win_percentage || '-'}</td>}
                                              {hasPL && <td className="text-center py-1 px-1">{twelveMonthStats?.profit_loss || '-'}</td>}
                                            </tr>
                                          )}
                                          {has3Months && (
                                            <tr>
                                              <td className="text-left py-1 px-2">3 Months</td>
                                              {hasRuns && <td className="text-center py-1 px-1">{threeMonthStats?.runs || '-'}</td>}
                                              {hasWins && <td className="text-center py-1 px-1">{threeMonthStats?.wins || '-'}</td>}
                                              {hasWinPct && <td className="text-center py-1 px-1">{threeMonthStats?.win_percentage || '-'}</td>}
                                              {hasPL && <td className="text-center py-1 px-1">{threeMonthStats?.profit_loss || '-'}</td>}
                                            </tr>
                                          )}
                                          {hasTrainer && (
                                            <tr>
                                              <td className="text-left py-1 px-2">Jockey/Trainer</td>
                                              {hasRuns && <td className="text-center py-1 px-1">{trainerStats?.runs || '-'}</td>}
                                              {hasWins && <td className="text-center py-1 px-1">{trainerStats?.wins || '-'}</td>}
                                              {hasWinPct && <td className="text-center py-1 px-1">{trainerStats?.win_percentage || '-'}</td>}
                                              {hasPL && <td className="text-center py-1 px-1">{trainerStats?.profit_loss || '-'}</td>}
                                            </tr>
                                          )}
                                          {hasTrainer3m && (
                                            <tr>
                                              <td className="text-left py-1 px-2">Jockey/Trainer 3m</td>
                                              {hasRuns && <td className="text-center py-1 px-1">{trainer3mStats?.runs || '-'}</td>}
                                              {hasWins && <td className="text-center py-1 px-1">{trainer3mStats?.wins || '-'}</td>}
                                              {hasWinPct && <td className="text-center py-1 px-1">{trainer3mStats?.win_percentage || '-'}</td>}
                                              {hasPL && <td className="text-center py-1 px-1">{trainer3mStats?.profit_loss || '-'}</td>}
                                            </tr>
                                          )}
                                          {hasOwner && (
                                            <tr>
                                              <td className="text-left py-1 px-2">Jockey/Owner</td>
                                              {hasRuns && <td className="text-center py-1 px-1">{ownerStats?.runs || '-'}</td>}
                                              {hasWins && <td className="text-center py-1 px-1">{ownerStats?.wins || '-'}</td>}
                                              {hasWinPct && <td className="text-center py-1 px-1">{ownerStats?.win_percentage || '-'}</td>}
                                              {hasPL && <td className="text-center py-1 px-1">{ownerStats?.profit_loss || '-'}</td>}
                                            </tr>
                                          )}
                                          {hasCourse && (
                                            <tr>
                                              <td className="text-left py-1 px-2">Jockey/Course</td>
                                              {hasRuns && <td className="text-center py-1 px-1">{courseStats?.runs || '-'}</td>}
                                              {hasWins && <td className="text-center py-1 px-1">{courseStats?.wins || '-'}</td>}
                                              {hasWinPct && <td className="text-center py-1 px-1">{courseStats?.win_percentage || '-'}</td>}
                                              {hasPL && <td className="text-center py-1 px-1">{courseStats?.profit_loss || '-'}</td>}
                                            </tr>
                                          )}
                                        </tbody>
                                      </table>
                                    </div>
                                  );
                                })()}
                              </div>
                            </div>
                            
                            {/* Trainer */}
                            <div>
                              <div className={`text-sm font-medium ${
                                isNonRunner ? 'text-gray-500' : 'text-white'
                              }`}>TRAINER</div>
                              <div className={`relative group font-semibold text-sm ${
                                isNonRunner ? 'text-gray-500' : 'text-blue-400 hover:text-blue-300 cursor-pointer transition-colors'
                              }`}>
                                {runner.trainer || '-'}
                                
                                {/* Trainer Stats Tooltip */}
                                {runner.trainer && (() => {
                                  // Parse comma-separated trainer stats
                                  const lifetimeStats = parseJockeyTrainerStats(runner.trainer_lifetime);
                                  const twelveMonthStats = parseJockeyTrainerStats(runner.trainer_12_months);
                                  const threeMonthStats = parseJockeyTrainerStats(runner.trainer_3_months);
                                  const jockeyStats = parseJockeyTrainerStats(runner.trainer_jockey);
                                  const jockey3mStats = parseJockeyTrainerStats(runner.trainer_jockey_3_months);
                                  const ownerStats = parseJockeyTrainerStats(runner.trainer_owner);
                                  const courseStats = parseJockeyTrainerStats(runner.trainer_course);
                                  
                                  // Check if any trainer stats exist
                                  const hasLifetime = lifetimeStats;
                                  const has12Months = twelveMonthStats;
                                  const has3Months = threeMonthStats;
                                  const hasJockey = jockeyStats;
                                  const hasJockey3m = jockey3mStats;
                                  const hasOwner = ownerStats;
                                  const hasCourse = courseStats;
                                  
                                  // Check if any data exists at all
                                  const hasAnyData = hasLifetime || has12Months || has3Months || hasJockey || hasJockey3m || hasOwner || hasCourse || runner.trainer_rtf;
                                  
                                  if (!hasAnyData) return null;
                                  
                                  // Check which columns have data
                                  const hasRuns = lifetimeStats?.runs || twelveMonthStats?.runs || threeMonthStats?.runs || 
                                                 jockeyStats?.runs || jockey3mStats?.runs || 
                                                 ownerStats?.runs || courseStats?.runs;
                                  
                                  const hasWins = lifetimeStats?.wins || twelveMonthStats?.wins || threeMonthStats?.wins || 
                                                 jockeyStats?.wins || jockey3mStats?.wins || 
                                                 ownerStats?.wins || courseStats?.wins;
                                  
                                  const hasWinPct = lifetimeStats?.win_percentage || twelveMonthStats?.win_percentage || threeMonthStats?.win_percentage || 
                                                   jockeyStats?.win_percentage || jockey3mStats?.win_percentage || 
                                                   ownerStats?.win_percentage || courseStats?.win_percentage;
                                  
                                  const hasPL = lifetimeStats?.profit_loss || twelveMonthStats?.profit_loss || threeMonthStats?.profit_loss || 
                                               jockeyStats?.profit_loss || jockey3mStats?.profit_loss || 
                                               ownerStats?.profit_loss || courseStats?.profit_loss;

                                  // If we only have RTF but no other data, show a simplified tooltip
                                  if (!hasRuns && !hasWins && !hasWinPct && !hasPL && runner.trainer_rtf) {
                                    const isTopHorse = index === 0;
                                    const rtfPositionClass = isTopHorse 
                                      ? "absolute left-full ml-2 -top-16 hidden group-hover:block bg-gray-900/95 backdrop-blur-sm text-white text-xs p-2 rounded shadow-lg z-[9999]"
                                      : "absolute left-0 bottom-full mb-1 hidden group-hover:block bg-gray-900/95 backdrop-blur-sm text-white text-xs p-2 rounded shadow-lg z-[9999]";
                                    
                                    return (
                                      <div className={rtfPositionClass}>
                                        <div className="flex items-center space-x-1 text-[9px]">
                                          <span className="text-gray-400">Runs To Form:</span>
                                          <span className="font-medium">{runner.trainer_rtf}%</span>
                            </div>
                          </div>
                                    );
                                  }
                                  
                                  const isTopHorse = index === 0;
                                  const mainPositionClass = isTopHorse 
                                    ? "absolute left-full ml-2 -top-16 hidden group-hover:block bg-gray-900/95 backdrop-blur-sm text-white text-xs p-2 rounded shadow-lg z-[9999] w-[280px]"
                                    : "absolute left-0 bottom-full mb-1 hidden group-hover:block bg-gray-900/95 backdrop-blur-sm text-white text-xs p-2 rounded shadow-lg z-[9999] w-[280px]";
                                  
                                  return (
                                    <div className={mainPositionClass}>
                                      <table className="w-full text-[10px] border-collapse">
                                        <thead>
                                          <tr className="border-b border-gray-700/50">
                                            <th className="text-left py-0.5 px-1 text-gray-400 font-medium">Category</th>
                                            {hasRuns && <th className="text-center py-0.5 px-0.5 text-gray-400 font-medium">Runs</th>}
                                            {hasWins && <th className="text-center py-0.5 px-0.5 text-gray-400 font-medium">Wins</th>}
                                            {hasWinPct && <th className="text-center py-0.5 px-0.5 text-gray-400 font-medium">Win%</th>}
                                            {hasPL && <th className="text-center py-0.5 px-0.5 text-gray-400 font-medium">P/L</th>}
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-700/30">
                                          {hasLifetime && (
                                            <tr>
                                              <td className="text-left py-1 px-2">Lifetime</td>
                                              {hasRuns && <td className="text-center py-1 px-1">{lifetimeStats?.runs || '-'}</td>}
                                              {hasWins && <td className="text-center py-1 px-1">{lifetimeStats?.wins || '-'}</td>}
                                              {hasWinPct && <td className="text-center py-1 px-1">{lifetimeStats?.win_percentage || '-'}</td>}
                                              {hasPL && <td className="text-center py-1 px-1">{lifetimeStats?.profit_loss || '-'}</td>}
                                            </tr>
                                          )}
                                          {has12Months && (
                                            <tr>
                                              <td className="text-left py-1 px-2">12 Months</td>
                                              {hasRuns && <td className="text-center py-1 px-1">{twelveMonthStats?.runs || '-'}</td>}
                                              {hasWins && <td className="text-center py-1 px-1">{twelveMonthStats?.wins || '-'}</td>}
                                              {hasWinPct && <td className="text-center py-1 px-1">{twelveMonthStats?.win_percentage || '-'}</td>}
                                              {hasPL && <td className="text-center py-1 px-1">{twelveMonthStats?.profit_loss || '-'}</td>}
                                            </tr>
                                          )}
                                          {has3Months && (
                                            <tr>
                                              <td className="text-left py-1 px-2">3 Months</td>
                                              {hasRuns && <td className="text-center py-1 px-1">{threeMonthStats?.runs || '-'}</td>}
                                              {hasWins && <td className="text-center py-1 px-1">{threeMonthStats?.wins || '-'}</td>}
                                              {hasWinPct && <td className="text-center py-1 px-1">{threeMonthStats?.win_percentage || '-'}</td>}
                                              {hasPL && <td className="text-center py-1 px-1">{threeMonthStats?.profit_loss || '-'}</td>}
                                            </tr>
                                          )}
                                          {hasJockey && (
                                            <tr>
                                              <td className="text-left py-1 px-2">Trainer/Jockey</td>
                                              {hasRuns && <td className="text-center py-1 px-1">{jockeyStats?.runs || '-'}</td>}
                                              {hasWins && <td className="text-center py-1 px-1">{jockeyStats?.wins || '-'}</td>}
                                              {hasWinPct && <td className="text-center py-1 px-1">{jockeyStats?.win_percentage || '-'}</td>}
                                              {hasPL && <td className="text-center py-1 px-1">{jockeyStats?.profit_loss || '-'}</td>}
                                            </tr>
                                          )}
                                          {hasJockey3m && (
                                            <tr>
                                              <td className="text-left py-1 px-2">Trainer/Jockey 3m</td>
                                              {hasRuns && <td className="text-center py-1 px-1">{jockey3mStats?.runs || '-'}</td>}
                                              {hasWins && <td className="text-center py-1 px-1">{jockey3mStats?.wins || '-'}</td>}
                                              {hasWinPct && <td className="text-center py-1 px-1">{jockey3mStats?.win_percentage || '-'}</td>}
                                              {hasPL && <td className="text-center py-1 px-1">{jockey3mStats?.profit_loss || '-'}</td>}
                                            </tr>
                                          )}
                                          {hasOwner && (
                                            <tr>
                                              <td className="text-left py-1 px-2">Trainer/Owner</td>
                                              {hasRuns && <td className="text-center py-1 px-1">{ownerStats?.runs || '-'}</td>}
                                              {hasWins && <td className="text-center py-1 px-1">{ownerStats?.wins || '-'}</td>}
                                              {hasWinPct && <td className="text-center py-1 px-1">{ownerStats?.win_percentage || '-'}</td>}
                                              {hasPL && <td className="text-center py-1 px-1">{ownerStats?.profit_loss || '-'}</td>}
                                            </tr>
                                          )}
                                          {hasCourse && (
                                            <tr>
                                              <td className="text-left py-1 px-2">Trainer/Course</td>
                                              {hasRuns && <td className="text-center py-1 px-1">{courseStats?.runs || '-'}</td>}
                                              {hasWins && <td className="text-center py-1 px-1">{courseStats?.wins || '-'}</td>}
                                              {hasWinPct && <td className="text-center py-1 px-1">{courseStats?.win_percentage || '-'}</td>}
                                              {hasPL && <td className="text-center py-1 px-1">{courseStats?.profit_loss || '-'}</td>}
                                            </tr>
                                          )}
                                        </tbody>
                                      </table>
                                      
                                      {/* Runs To Form */}
                                      {runner.trainer_rtf && (
                                        <div className="mt-0.5 pt-0.5 border-t border-gray-700/30">
                                          <div className="flex justify-between items-center text-[9px]">
                                            <span className="text-gray-400">Runs To Form:</span>
                                            <span className="font-medium">{runner.trainer_rtf}%</span>
                            </div>
                            </div>
                                      )}
                            </div>
                                  );
                                })()}
                              </div>
                            </div>
                          </div>

                          {/* Data Point Boxes */}
                          <div className="mt-3 grid grid-cols-7 gap-1">
                            {/* OR - Official Rating */}
                            <div className="bg-gray-800/50 border border-gray-700/50 rounded-md p-1.5 text-center">
                              <div className="text-xs text-gray-400 mb-0.5">OR</div>
                              <div className="text-sm font-medium text-white">{runner.ofr || '-'}</div>
                            </div>
                            
                            {/* OVO - OddsVantage Odds */}
                            <div className="bg-gray-800/50 border border-gray-700/50 rounded-md p-1.5 text-center">
                              <div className="text-xs text-gray-400 mb-0.5">OVO</div>
                              <div className="text-sm font-medium text-white">
                                {runner['7.8_raw'] ? parseFloat(runner['7.8_raw']).toFixed(2) : '-'}
                              </div>
                            </div>
                            
                            {/* RPO - Racing Post Odds */}
                            <div className="bg-gray-800/50 border border-gray-700/50 rounded-md p-1.5 text-center">
                              <div className="text-xs text-gray-400 mb-0.5">RPO</div>
                              <div className="text-sm font-medium text-white">
                                {runner.RPR_odds ? parseFloat(runner.RPR_odds).toFixed(2) : '-'}
                              </div>
                            </div>
                            
                            {/* TFO - Timeform Odds */}
                            <div className="bg-gray-800/50 border border-gray-700/50 rounded-md p-1.5 text-center">
                              <div className="text-xs text-gray-400 mb-0.5">TFO</div>
                              <div className="text-sm font-medium text-white">
                                {runner.TFR_odds ? parseFloat(runner.TFR_odds).toFixed(2) : '-'}
                              </div>
                            </div>

                            {/* TS - Time Score */}
                            <div className="bg-gray-800/50 border border-gray-700/50 rounded-md p-1.5 text-center">
                              <div className="text-xs text-gray-400 mb-0.5">TS</div>
                              <div className="text-sm font-medium text-white">{runner.ts || '-'}</div>
                          </div>
                            
                            {/* GS - Going Score */}
                            <div className="bg-gray-800/50 border border-gray-700/50 rounded-md p-1.5 text-center">
                              <div className="text-xs text-gray-400 mb-0.5">GS</div>
                              <div className="text-sm font-medium text-white">
                                {(runner.goodRunGoing !== null && runner.goodRunGoing !== undefined) ? parseFloat(runner.goodRunGoing).toFixed(2) : '-'}
                              </div>
                            </div>
                            
                            {/* PS - Pace Score */}
                            <div className="bg-gray-800/50 border border-gray-700/50 rounded-md p-1.5 text-center">
                              <div className="text-xs text-gray-400 mb-0.5">PS</div>
                              <div className="text-sm font-medium text-white">
                                {(runner.paceRel !== null && runner.paceRel !== undefined) ? parseFloat(runner.paceRel).toFixed(2) : '-'}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Odds */}
                      <div className="lg:col-span-5">
                        <div className="space-y-1">

                          {/* Best Odds Display - Compact 3x2 Grid */}
                          <div className="grid grid-cols-3 gap-0.5">
                            {/* Live Best Odds */}
                            <div className={`px-0.5 py-0.5 rounded text-center ${
                              isNonRunner ? 'bg-gray-500/10' : 'bg-betting-green/10'
                            }`}>
                              <div className={`text-[10px] ${
                                isNonRunner ? 'text-gray-600' : 'text-white'
                              }`}>Live BO</div>
                              <div className={`font-bold text-xs ${
                                isNonRunner ? 'text-gray-500' : 'text-betting-green'
                              }`}>{isNonRunner ? 'N/A' : (() => {
                                const liveOdds = getLiveBestOdds(runnerOdds);
                                return liveOdds.value;
                              })()}</div>
                              {!isNonRunner && (() => {
                                const liveOdds = getLiveBestOdds(runnerOdds);
                                return liveOdds.bookmaker ? (
                                  <div className="text-[9px] text-gray-500 truncate">
                                    ({formatBookmakerName(liveOdds.bookmaker)})
                            </div>
                                ) : <div className="text-[9px] h-2">&nbsp;</div>;
                              })()}
                          </div>

                            {/* Best Opening Odds */}
                            <div className={`px-0.5 py-0.5 rounded text-center ${
                              isNonRunner ? 'bg-gray-500/10' : 'bg-blue-500/10'
                            }`}>
                              <div className={`text-[10px] ${
                                isNonRunner ? 'text-gray-600' : 'text-white'
                              }`}>Opening</div>
                              <div className={`font-bold text-xs ${
                                isNonRunner ? 'text-gray-500' : 'text-blue-400'
                              }`}>{isNonRunner ? 'N/A' : (() => {
                                const openingOdds = getBestOpeningOdds(runnerOdds);
                                return openingOdds.value;
                              })()}</div>
                              {!isNonRunner && (() => {
                                const openingOdds = getBestOpeningOdds(runnerOdds);
                                return openingOdds.bookmaker ? (
                                  <div className="text-[9px] text-gray-500 truncate">
                                    ({formatBookmakerName(openingOdds.bookmaker)})
                              </div>
                                ) : <div className="text-[9px] h-2">&nbsp;</div>;
                              })()}
                          </div>

                            {/* Day High */}
                            <div className={`px-0.5 py-0.5 rounded text-center ${
                              isNonRunner ? 'bg-gray-500/10' : 'bg-orange-500/10'
                            }`}>
                              <div className={`text-[10px] ${
                                isNonRunner ? 'text-gray-600' : 'text-white'
                              }`}>Day High</div>
                              <div className={`font-bold text-xs ${
                                isNonRunner ? 'text-gray-500' : 'text-orange-400'
                              }`}>{isNonRunner ? 'N/A' : (() => {
                                const highLow = getHighLowOdds(runnerOdds);
                                return highLow.high.value;
                              })()}</div>
                              {!isNonRunner && (() => {
                                const highLow = getHighLowOdds(runnerOdds);
                                return highLow.high.bookmaker ? (
                                  <div className="text-[9px] text-gray-500 truncate">
                                    ({formatBookmakerName(highLow.high.bookmaker)} {highLow.high.time})
                              </div>
                                ) : <div className="text-[9px] h-2">&nbsp;</div>;
                              })()}
                              </div>

                            {/* Day Low */}
                            <div className={`px-0.5 py-0.5 rounded text-center ${
                              isNonRunner ? 'bg-gray-500/10' : 'bg-purple-500/10'
                            }`}>
                              <div className={`text-[10px] ${
                                isNonRunner ? 'text-gray-600' : 'text-white'
                              }`}>Day Low</div>
                              <div className={`font-bold text-xs ${
                                isNonRunner ? 'text-gray-500' : 'text-purple-400'
                              }`}>{isNonRunner ? 'N/A' : (() => {
                                const highLow = getHighLowOdds(runnerOdds);
                                return highLow.low.value;
                              })()}</div>
                              {!isNonRunner && (() => {
                                const highLow = getHighLowOdds(runnerOdds);
                                return highLow.low.bookmaker ? (
                                  <div className="text-[9px] text-gray-500 truncate">
                                    ({formatBookmakerName(highLow.low.bookmaker)} {highLow.low.time})
                              </div>
                                ) : <div className="text-[9px] h-2">&nbsp;</div>;
                              })()}
                              </div>

                            {/* Average Odds */}
                            <div className={`px-0.5 py-0.5 rounded text-center ${
                              isNonRunner ? 'bg-gray-500/10' : 'bg-cyan-500/10'
                            }`}>
                              <div className={`text-[10px] ${
                                isNonRunner ? 'text-gray-600' : 'text-white'
                              }`}>Avg Odds</div>
                              <div className={`font-bold text-xs ${
                                isNonRunner ? 'text-gray-500' : 'text-cyan-400'
                              }`}>{isNonRunner ? 'N/A' : getLiveAverageOdds(runner)}</div>
                              <div className="text-[9px] text-gray-500 truncate">
                                (Bookmaker Average)
                              </div>
                              </div>

                            {/* Sharp Odds */}
                            <div className={`px-0.5 py-0.5 rounded text-center ${
                              isNonRunner ? 'bg-gray-500/10' : 'bg-red-500/10'
                            }`}>
                              <div className={`text-[10px] ${
                                isNonRunner ? 'text-gray-600' : 'text-white'
                              }`}>Sharp Odds</div>
                              <div className={`font-bold text-xs ${
                                isNonRunner ? 'text-gray-500' : 'text-red-400'
                              }`}>{isNonRunner ? 'N/A' : getLiveSharpAverageOdds(runner)}</div>
                              <div className="text-[9px] text-gray-500 truncate">
                                (Exchange Weighted Odds)
                              </div>
                            </div>
                          </div>

                          {/* Second Row - Mini Data Boxes */}
                          <div className="grid grid-cols-6 gap-0.5 mt-1">
                            {/* Price Change */}
                            <div className="bg-orange-500/10 px-0.5 py-1 rounded text-center min-h-[35px]">
                              <div className="text-[9px] text-white">Price Change</div>
                              <div className="text-[10px] font-bold text-orange-400">{parseLatestPriceChange(runner.price_change)}</div>
                            </div>

                            {/* No-Vig Odds */}
                            <div className="bg-purple-500/10 px-0.5 py-1 rounded text-center min-h-[35px]">
                              <div className="text-[9px] text-white">No-Vig Odds</div>
                              <div className="text-[10px] font-bold text-purple-400">
                                {runner.vig_average_odds ? parseFloat(runner.vig_average_odds).toFixed(2) : 'N/A'}
                              </div>
                      </div>

                            {/* Market Pressure */}
                            <div className="bg-yellow-500/10 px-0.5 py-1 rounded text-center min-h-[35px]">
                              <div className="text-[9px] text-white">Market Pressure</div>
                              <div className="text-[10px] font-bold text-yellow-400">{parseLatestPercentage(runner.market_pressure_shortening)}</div>
                    </div>

                            {/* Momentum */}
                            <div className="bg-sky-500/10 px-0.5 py-1 rounded text-center min-h-[35px]">
                              <div className="text-[9px] text-white">Momentum</div>
                              <div className="text-[10px] font-bold text-sky-400">{parseLatestPercentage(runner.momentum_steaming)}</div>
                            </div>

                            {/* Support Level */}
                            <div className="bg-green-500/10 px-0.5 py-1 rounded text-center min-h-[35px]">
                              <div className="text-[9px] text-white">Support</div>
                              <div className="text-[10px] font-bold text-green-400">{parseLatestLevel(runner.resistance_levels)}</div>
                            </div>

                            {/* Resistance Level */}
                            <div className="bg-red-500/10 px-0.5 py-1 rounded text-center min-h-[35px]">
                              <div className="text-[9px] text-white">Resistance</div>
                              <div className="text-[10px] font-bold text-red-400">{parseLatestLevel(runner.support_levels)}</div>
                            </div>
                          </div>


                            </div>
                      </div>
                    </div>

                    {/* Button to expand/collapse card */}
                    <div className="mt-3 flex justify-center">
                      <button
                        onClick={() => toggleCardExpansion(runner.horse_id)}
                        className="flex flex-col items-center justify-center w-10 h-10 rounded-full bg-gray-700/50 hover:bg-gray-600/50 transition text-white text-xs"
                      >
                        <span>PP</span>
                        {expandedCards[runner.horse_id] ? (
                          <ChevronUp size={12} />
                        ) : (
                          <ChevronDown size={12} />
                        )}
                      </button>
                            </div>

                    {/* Collapsible section for past performances and comments */}
                    {expandedCards[runner.horse_id] && (
                      <div className="mt-3 space-y-3 animate-fadeIn">
                        {/* Past Performances Table */}
                        <div className="bg-gray-800/80 rounded-lg overflow-hidden shadow-md">
                          <div className="bg-gray-700/50 px-3 py-2 border-b border-gray-600/30">
                            <h4 className="text-sm font-medium text-white">Past Performances</h4>
                          </div>
                          <div className="p-2 overflow-x-auto">
                            <table className="w-full text-xs">
                              <thead className="bg-gray-700/30 text-gray-300">
                                <tr>
                                  <th className="p-1 text-left w-16">Date</th>
                                  <th className="p-1 text-left w-8">Track</th>
                                  <th className="p-1 text-left w-20">Jockey</th>
                                  <th className="p-1 text-center w-12">Fin Pos</th>
                                  <th className="p-1 text-center w-12">BTN</th>
                                  <th className="p-1 text-center w-12">OR</th>
                                  <th className="p-1 text-center w-14">Surface</th>
                                  <th className="p-1 text-center w-12">Dist</th>
                                  <th className="p-1 text-left w-16">Going</th>
                                  <th className="p-1 text-center w-14">BSP</th>
                                  <th className="p-1 text-center w-16">Speed Fig</th>
                                  <th className="p-1 text-center w-14">Rating</th>
                                  <th className="p-1 text-center w-20">IP Hi/Lo</th>
                                  <th className="p-1 text-center w-16">Run Style</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-700/30">
                                {/* Generate rows for past performances if available */}
                                {[1, 2, 3, 4, 5, 6].map(ppNum => {
                                  // Check if this pp exists
                                  const dateField = `pp_${ppNum}_date` as keyof typeof runner.timeform;
                                  
                                  // Skip if no timeform data or no date for this past performance
                                  if (!runner.timeform || !runner.timeform[dateField]) return null;
                                  
                                  // Get all fields for this pp
                                  const trackField = `pp_${ppNum}_track` as keyof typeof runner.timeform;
                                  const resultField = `pp_${ppNum}_result` as keyof typeof runner.timeform;
                                  const btnField = `pp_${ppNum}_btn` as keyof typeof runner.timeform;
                                  const typeField = `pp_${ppNum}_type` as keyof typeof runner.timeform;
                                  const orField = `pp_${ppNum}_or` as keyof typeof runner.timeform;
                                  const disField = `pp_${ppNum}_dis` as keyof typeof runner.timeform;
                                  const goingField = `pp_${ppNum}_going` as keyof typeof runner.timeform;
                                  const eqField = `pp_${ppNum}_eq` as keyof typeof runner.timeform;
                                  const jockeyField = `pp_${ppNum}_jockey` as keyof typeof runner.timeform;
                                  const ispField = `pp_${ppNum}_isp` as keyof typeof runner.timeform;
                                  const bspField = `pp_${ppNum}_bsp` as keyof typeof runner.timeform;
                                  const iphiloField = `pp_${ppNum}_iphilo` as keyof typeof runner.timeform;
                                  const ipsField = `pp_${ppNum}_ips` as keyof typeof runner.timeform;
                                  const fsField = `pp_${ppNum}_fs` as keyof typeof runner.timeform;
                                  const tfigField = `pp_${ppNum}_tfig` as keyof typeof runner.timeform;
                                  const tfrField = `pp_${ppNum}_tfr` as keyof typeof runner.timeform;
                                  const adjField = `pp_${ppNum}_adj` as keyof typeof runner.timeform;
                                  
                                  return (
                                    <tr key={ppNum} className="hover:bg-gray-700/20">
                                      <td className="p-1 text-white">{runner.timeform[dateField] ? new Date(runner.timeform[dateField] as string).toLocaleDateString() : '-'}</td>
                                      <td className="p-1 text-white">{normalizeTrackName(runner.timeform[trackField])}</td>
                                      <td className="p-1 text-white">{runner.timeform[jockeyField] || '-'}</td>
                                      <td className="p-1 text-white text-center">{runner.timeform[resultField] || '-'}</td>
                                      <td className="p-1 text-white text-center">{runner.timeform[btnField] || '-'}</td>
                                      <td className="p-1 text-white text-center">{runner.timeform[orField] || '-'}</td>
                                      <td className="p-1 text-white text-center">{runner.timeform[typeField] || '-'}</td>
                                      <td className="p-1 text-white text-center">{runner.timeform[disField] || '-'}</td>
                                      <td className="p-1 text-white">{runner.timeform[goingField] || '-'}</td>
                                      <td className="p-1 text-white text-center">{runner.timeform[bspField] || '-'}</td>
                                      <td className="p-1 text-white text-center">{runner.timeform[tfigField] || '-'}</td>
                                      <td className="p-1 text-white text-center">{runner.timeform[adjField] || '-'}</td>
                                      <td className="p-1 text-white text-center">{runner.timeform[iphiloField] || '-'}</td>
                                      <td className="p-1 text-white text-center">{runner.timeform[ipsField] || '-'}</td>
                                    </tr>
                                  );
                                })}
                                {/* If no past performances available */}
                                {!runner.timeform || ![1, 2, 3, 4, 5, 6].some(ppNum => {
                                  const dateField = `pp_${ppNum}_date` as keyof typeof runner.timeform;
                                  return runner.timeform && !!runner.timeform[dateField];
                                }) && (
                                  <tr>
                                    <td colSpan={18} className="p-2 text-center text-gray-400">No past performance data available</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        
                        {/* Comments & Spotlight */}
                        {(runner.spotlight || (runner.timeform && runner.timeform.spotlight) || (() => {
                          // Check if there's a timeform rating note
                          let rating = null;
                          if (runner.timeform) {
                            if (Array.isArray(runner.timeform) && runner.timeform.length > 0) {
                              rating = runner.timeform[0].timeform_rating;
                            } else if (typeof runner.timeform === 'object') {
                              rating = runner.timeform.timeform_rating;
                            }
                          }
                          return getTimeformRatingNote(rating) !== null;
                        })()) && (
                          <div className="grid grid-cols-1 gap-3">
                            {/* General Comments Section */}
                            {(runner.spotlight || (runner.timeform && runner.timeform.spotlight)) && (
                              <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/50">
                                <div className="flex items-center space-x-2 mb-2">
                                  <div className="w-1 h-5 bg-blue-500 rounded-sm"></div>
                                  <div className="text-white font-semibold text-xs">General Comments</div>
                                </div>
                                <div className="text-gray-200 text-sm leading-relaxed">
                                  {runner.timeform?.spotlight || runner.spotlight}
                        </div>
                              </div>
                            )}
                            
                            {/* Key Notes Section - Only show if there's a note */}
                            {(() => {
                              // Get the rating using the same approach
                              let rating = null;
                              
                              if (runner.timeform) {
                                if (Array.isArray(runner.timeform) && runner.timeform.length > 0) {
                                  rating = runner.timeform[0].timeform_rating;
                                } else if (typeof runner.timeform === 'object') {
                                  rating = runner.timeform.timeform_rating;
                                }
                              }
                              
                              const note = getTimeformRatingNote(rating);
                              
                              if (note) {
                                return (
                                  <div className="bg-gray-800/60 p-3 rounded-lg border border-gray-700/50">
                                    <div className="flex items-center space-x-2 mb-2">
                                      <div className="w-1 h-5 bg-amber-500 rounded-sm"></div>
                                      <div className="text-white font-semibold text-xs">Key Notes</div>
                                    </div>
                                    <div className="flex items-start space-x-2">
                                      <div className="text-amber-400 mt-0.5">•</div>
                                      <div className="text-gray-200 text-sm leading-relaxed">
                                        {note}
                                      </div>
                                    </div>
                                  </div>
                                );
                              }
                              
                              return null;
                            })()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Odds Comparison Table */}
          {odds.length > 0 && (() => {
            const validBookmakers = getValidBookmakersForTable();
            
            return validBookmakers.length > 0 ? (
            <div className="mt-8 bg-betting-dark border border-betting-green/20 rounded-xl overflow-hidden">
                <div className="p-4 border-b border-betting-green/20">
                  <h2 className="text-lg font-heading text-betting-green">
                  Live Odds Comparison
                </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Showing latest live odds from {validBookmakers.length} bookmakers with data
                  </p>
              </div>
              
              <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                  <thead className="bg-betting-green/5 border-b border-betting-green/10">
                    <tr>
                        <th className="text-left p-2 text-gray-300 font-medium">Horse</th>
                        {validBookmakers.map(bookmaker => (
                          <th key={bookmaker.key} className="text-center p-1 text-gray-300 font-medium min-w-[60px]">
                            {bookmaker.name}
                          </th>
                        ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-betting-green/10">
                      {[...uniqueRunners]
                        .sort((a, b) => {
                          const aIsNR = a.number === 'NR';
                          const bIsNR = b.number === 'NR';
                          
                          // NR runners always go to bottom
                          if (aIsNR && !bIsNR) return 1;
                          if (!aIsNR && bIsNR) return -1;
                          if (aIsNR && bIsNR) return 0; // Both NR, keep original order
                          
                          // For regular runners, sort by Live BO odds
                          const aOdds = getRunnerOdds(a.horse_id, a.id);
                          const bOdds = getRunnerOdds(b.horse_id, b.id);
                          
                          const aLiveBest = getLiveBestOdds(aOdds);
                          const bLiveBest = getLiveBestOdds(bOdds);
                          
                          // If both have SP or no odds, fall back to official number
                          if ((aLiveBest.value === 'SP' || !aLiveBest.value) && (bLiveBest.value === 'SP' || !bLiveBest.value)) {
                            const aNum = parseInt(a.number) || 999;
                            const bNum = parseInt(b.number) || 999;
                            return aNum - bNum;
                          }
                          
                          // If one has SP and other has odds, odds come first
                          if (aLiveBest.value === 'SP' || !aLiveBest.value) return 1;
                          if (bLiveBest.value === 'SP' || !bLiveBest.value) return -1;
                          
                          // Both have odds - convert to decimal and sort (shortest odds first)
                          const aDecimal = convertOddsToDecimal(aLiveBest.value);
                          const bDecimal = convertOddsToDecimal(bLiveBest.value);
                          return aDecimal - bDecimal;
                        })
                        .map((runner) => {
                          const runnerOdds = getRunnerOdds(runner.horse_id, runner.id);
                          const isNonRunner = runner.number === 'NR';
                          
                      return (
                            <tr key={runner.id} className={`${
                              isNonRunner 
                                ? 'opacity-40 hover:bg-gray-500/5' 
                                : 'hover:bg-betting-green/5'
                            }`}>
                              <td className={`p-2 font-medium text-sm ${
                                isNonRunner ? 'text-gray-500' : 'text-white'
                              }`}>{runner.horse_name}</td>
                              {validBookmakers.map(bookmaker => (
                                <td key={bookmaker.key} className={`p-1 text-center ${
                                  isNonRunner ? 'text-gray-600' : 'text-white'
                                }`}>
                                  {isNonRunner ? 'N/A' : getBookmakerOdds(runnerOdds, bookmaker.historyField)}
                                </td>
                              ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            ) : null;
          })()}

          {/* Odds Chart Tool */}
          {odds.length > 0 && uniqueRunners.length > 0 && (
            <div className="mt-8 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border border-gray-600/30 rounded-2xl overflow-hidden shadow-2xl backdrop-blur-sm">
              <div className="p-6 border-b border-gray-600/30 bg-gradient-to-r from-gray-800/50 to-gray-700/50">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-gradient-to-r from-betting-green to-green-400 rounded-full shadow-lg"></div>
                  <h2 className="text-xl font-heading text-white mb-0 tracking-wide">
                    Live Odds Movement Chart
                  </h2>
                </div>
                <p className="text-sm text-gray-300 mt-2 font-light">
                  Track odds movements throughout the day for each horse from opening to race start
                </p>
              </div>
              
              <div className="p-6 bg-gradient-to-b from-gray-800/30 to-gray-900/30">
                {/* Horse Selection Dropdown */}
                <div className="mb-6">
                  <label className="block text-sm font-semibold text-gray-200 mb-3 tracking-wide">
                    Select Horse:
                  </label>
                  <div className="relative">
                    <select
                      value={selectedHorseForChart}
                      onChange={(e) => setSelectedHorseForChart(e.target.value)}
                      className="bg-gradient-to-r from-gray-800 to-gray-700 border border-gray-500/50 text-white rounded-xl px-4 py-3 w-full md:w-80 shadow-lg backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-betting-green/50 focus:border-betting-green/50 transition-all duration-300 appearance-none cursor-pointer hover:shadow-xl"
                      style={{
                        color: 'white',
                        backgroundColor: 'rgb(31, 41, 55)'
                      }}
                    >
                      <option value="" className="bg-gray-800 text-gray-300 py-2" style={{ backgroundColor: 'rgb(31, 41, 55)', color: 'rgb(209, 213, 219)' }}>
                        🏇 Choose a horse to view chart...
                      </option>
                      {uniqueRunners
                        .filter(runner => runner.number !== 'NR')
                        .sort((a, b) => {
                          const aNum = parseInt(a.number) || 999;
                          const bNum = parseInt(b.number) || 999;
                          return aNum - bNum;
                        })
                        .map(runner => (
                          <option 
                            key={runner.id} 
                            value={runner.horse_id} 
                            className="bg-gray-800 text-white py-3 hover:bg-gray-700" 
                            style={{ 
                              backgroundColor: 'rgb(31, 41, 55)', 
                              color: 'white',
                              padding: '12px 16px'
                            }}
                          >
                            🏇 {runner.horse_name}
                          </option>
                        ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>

                </div>

                {selectedHorseForChart && (() => {
                  const selectedRunner = uniqueRunners.find(r => r.horse_id === selectedHorseForChart);
                  const runnerOdds = getRunnerOdds(selectedHorseForChart);
                  
                  if (!selectedRunner || !runnerOdds) {
                    return (
                      <div className="text-gray-400 text-center py-12 bg-gradient-to-r from-gray-800/20 to-gray-700/20 rounded-xl border border-gray-600/30">
                        <div className="text-lg font-medium">No odds data available for this horse</div>
                      </div>
                    );
                  }

                  // Get all available bookmakers with data for this horse
                  const availableBookmakers = getValidBookmakers().filter(bookmaker => {
                    const data = getBookmakerChartData(runnerOdds, bookmaker.key);
                    return data.length > 0;
                  });

                  if (availableBookmakers.length === 0) {
                    return (
                      <div className="text-gray-400 text-center py-12 bg-gradient-to-r from-gray-800/20 to-gray-700/20 rounded-xl border border-gray-600/30">
                        <div className="text-lg font-medium">No odds movement data available for {selectedRunner.horse_name}</div>
                      </div>
                    );
                  }

                  // Calculate chart dimensions and time range
                  const allDataPoints = availableBookmakers.flatMap(bookmaker => 
                    getBookmakerChartData(runnerOdds, bookmaker.key)
                  );
                  
                  if (allDataPoints.length === 0) {
                    return (
                      <div className="text-gray-400 text-center py-12 bg-gradient-to-r from-gray-800/20 to-gray-700/20 rounded-xl border border-gray-600/30">
                        <div className="text-lg font-medium">No odds movement data available for {selectedRunner.horse_name}</div>
                      </div>
                    );
                  }

                  const minTime = Math.min(...allDataPoints.map(p => p.time));
                  
                  // Use race off time as the maximum time for the chart
                  const raceOffTime = race?.off_dt ? 
                    parseTimeToMinutes(new Date(race.off_dt).toLocaleTimeString('en-GB', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      timeZone: 'Europe/London'
                    })) : 
                    (race?.off ? parseTimeToMinutes(race.off) : Math.max(...allDataPoints.map(p => p.time)));
                  
                  const maxTime = raceOffTime;
                  const dataMinOdds = Math.min(...allDataPoints.map(p => p.odds));
                  const dataMaxOdds = Math.max(...allDataPoints.map(p => p.odds));
                  
                  // Calculate logical Y-axis range with 0.5 increments
                  // Add padding above and below the actual data range
                  const minOdds = Math.floor((dataMinOdds - 1) * 2) / 2; // Round down to nearest 0.5, minus 1
                  const maxOdds = Math.ceil((dataMaxOdds + 1) * 2) / 2;  // Round up to nearest 0.5, plus 1
                  
                  const timeRange = maxTime - minTime;
                  const oddsRange = maxOdds - minOdds;
                  
                  // Generate Y-axis labels with 0.5 increments
                  const generateYAxisLabels = () => {
                    const labels = [];
                    const step = 0.5;
                    const numSteps = Math.ceil(oddsRange / step);
                    const actualSteps = Math.min(numSteps, 12); // Limit to max 12 steps for readability
                    const adjustedStep = oddsRange / actualSteps;
                    
                    for (let i = 0; i <= actualSteps; i++) {
                      const value = minOdds + (adjustedStep * i);
                      // Round to nearest 0.5 for clean display
                      const roundedValue = Math.round(value * 2) / 2;
                      labels.push(roundedValue);
                    }
                    return labels;
                  };
                  
                  const yAxisLabels = generateYAxisLabels();
                  
                  const chartWidth = 900;
                  const chartHeight = 500;
                  const padding = 80;

                  return (
                    <div className="space-y-6">
                      {/* Combined Chart Controls */}
                      <div className="p-4 bg-gradient-to-r from-gray-800/40 via-gray-700/40 to-gray-800/40 border border-gray-500/30 rounded-xl shadow-lg backdrop-blur-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-gradient-to-r from-betting-green to-green-400 rounded-full"></div>
                            <h3 className="text-sm font-semibold text-gray-200">Chart Controls</h3>
                        </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          {/* Bookmakers Section */}
                          <div>
                            <h4 className="text-xs font-medium text-gray-300 mb-2">Bookmakers</h4>
                            <div className="grid grid-cols-3 xl:grid-cols-4 gap-2">
                          {availableBookmakers.map(bookmaker => (
                                <label key={bookmaker.key} className="group flex items-center space-x-2 p-2 bg-gray-700/20 rounded border border-gray-600/20 hover:border-gray-500/30 transition cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={enabledBookmakers.has(bookmaker.key)}
                                  onChange={(e) => {
                                    const newEnabled = new Set(enabledBookmakers);
                                    if (e.target.checked) {
                                      newEnabled.add(bookmaker.key);
                                    } else {
                                      newEnabled.delete(bookmaker.key);
                                    }
                                    setEnabledBookmakers(newEnabled);
                                  }}
                                    className="w-3 h-3 rounded border border-gray-500 bg-gray-700/50 checked:bg-betting-green checked:border-betting-green"
                                  />
                              <span 
                                    className="text-xs truncate transition-colors group-hover:text-white" 
                                style={{ color: enabledBookmakers.has(bookmaker.key) ? getBookmakerColor(bookmaker.key) : '#9CA3AF' }}
                              >
                                {formatBookmakerName(bookmaker.key)}
                              </span>
                            </label>
                          ))}
                            </div>
                          </div>

                          {/* Data Types Section */}
                          <div>
                            <h4 className="text-xs font-medium text-gray-300 mb-2">Data Types</h4>
                            <div className="grid grid-cols-2 xl:grid-cols-3 gap-2">
                              {[
                                { key: 'average_odds', name: 'Avg Odds' },
                                { key: 'sharp_average_odds', name: 'Sharp' },
                                { key: '5_moving_average', name: '5m MA' },
                                { key: '20_moving_average', name: '20m MA' },
                                { key: '60_moving_average', name: '60m MA' },
                                { key: '5_bollinger_bands', name: '5m BB' },
                                { key: '20_bollinger_bands', name: '20m BB' },
                                { key: '60_bollinger_bands', name: '60m BB' }
                              ].map(dataType => (
                                <label key={dataType.key} className="group flex items-center space-x-2 p-2 bg-gray-700/20 rounded border border-gray-600/20 hover:border-gray-500/30 transition cursor-pointer">
                                  <input
                                    type="checkbox"
                                    checked={enabledDataTypes.has(dataType.key)}
                                    onChange={(e) => {
                                      const newEnabled = new Set(enabledDataTypes);
                                      if (e.target.checked) {
                                        newEnabled.add(dataType.key);
                                      } else {
                                        newEnabled.delete(dataType.key);
                                      }
                                      setEnabledDataTypes(newEnabled);
                                    }}
                                    className="w-3 h-3 rounded border border-gray-500 bg-gray-700/50 checked:bg-betting-green checked:border-betting-green"
                                  />
                                  <span 
                                    className="text-xs truncate transition-colors group-hover:text-white" 
                                    style={{ color: enabledDataTypes.has(dataType.key) ? getDataTypeColor(dataType.key) : '#9CA3AF' }}
                                  >
                                    {dataType.name}
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Chart Container */}
                      <div className="bg-gradient-to-br from-gray-900/80 via-gray-800/60 to-gray-900/80 rounded-2xl p-6 border border-gray-500/30 shadow-2xl backdrop-blur-sm">
                        <div className="relative overflow-x-auto">
                          <div className="relative" style={{ minWidth: chartWidth + padding * 2, height: chartHeight + padding * 2 }}>
                            <svg 
                              width={chartWidth + padding * 2} 
                              height={chartHeight + padding * 2}
                              className="rounded-xl shadow-inner"
                              style={{
                                background: 'linear-gradient(135deg, #1f2937 0%, #111827 50%, #1f2937 100%)',
                                filter: 'drop-shadow(0 10px 25px rgba(0, 0, 0, 0.5))'
                              }}
                            >
                              {/* Enhanced Chart Background with Metallic Grid */}
                              <defs>
                                <linearGradient id="chartBg" x1="0%" y1="0%" x2="100%" y2="100%">
                                  <stop offset="0%" stopColor="#374151" stopOpacity="0.1"/>
                                  <stop offset="50%" stopColor="#1f2937" stopOpacity="0.3"/>
                                  <stop offset="100%" stopColor="#111827" stopOpacity="0.1"/>
                                </linearGradient>
                                <pattern id="metalGrid" width="50" height="50" patternUnits="userSpaceOnUse">
                                  <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#4b5563" strokeWidth="0.5" opacity="0.4"/>
                                  <circle cx="0" cy="0" r="1" fill="#6b7280" opacity="0.3"/>
                                </pattern>
                                <filter id="glow">
                                  <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                                  <feMerge> 
                                    <feMergeNode in="coloredBlur"/>
                                    <feMergeNode in="SourceGraphic"/>
                                  </feMerge>
                                </filter>
                                <filter id="shadow">
                                  <feDropShadow dx="2" dy="2" stdDeviation="3" floodOpacity="0.3"/>
                                </filter>
                              </defs>
                              
                              <rect width="100%" height="100%" fill="url(#chartBg)" />
                              <rect width="100%" height="100%" fill="url(#metalGrid)" />

                              {/* Enhanced Axes with Metallic Look */}
                              <line 
                                x1={padding} y1={padding} 
                                x2={padding} y2={chartHeight + padding}
                                stroke="url(#axisGradient)" strokeWidth="3" filter="url(#shadow)"
                              />
                              
                              <line 
                                x1={padding} y1={chartHeight + padding} 
                                x2={chartWidth + padding} y2={chartHeight + padding}
                                stroke="url(#axisGradient)" strokeWidth="3" filter="url(#shadow)"
                              />

                              <defs>
                                <linearGradient id="axisGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                  <stop offset="0%" stopColor="#9ca3af"/>
                                  <stop offset="50%" stopColor="#d1d5db"/>
                                  <stop offset="100%" stopColor="#9ca3af"/>
                                </linearGradient>
                              </defs>

                              {/* Enhanced Y-axis labels */}
                              {yAxisLabels.map((oddsValue, i) => {
                                const y = chartHeight + padding - ((oddsValue - minOdds) / oddsRange) * chartHeight;
                                return (
                                  <g key={i}>
                                    <text
                                      x={padding - 8}
                                      y={y + 4}
                                      textAnchor="end"
                                      className="fill-gray-300 text-sm font-medium"
                                      filter="url(#shadow)"
                                    >
                                      {oddsValue % 1 === 0 ? oddsValue.toFixed(0) : oddsValue.toFixed(1)}
                                    </text>
                                    <line
                                      x1={padding - 6}
                                      y1={y}
                                      x2={padding + 6}
                                      y2={y}
                                      stroke="#9ca3af"
                                      strokeWidth="2"
                                      opacity="0.7"
                                    />
                                  </g>
                                );
                              })}

                              {/* Enhanced X-axis labels */}
                              {(() => {
                                const timePoints = generateXAxisTimePoints(minTime, maxTime);
                                
                                return timePoints.map((timePoint, i) => {
                                  const x = padding + ((timePoint.time - minTime) / timeRange) * chartWidth;
                                  return (
                                    <g key={i}>
                                      <text
                                        x={x}
                                        y={chartHeight + padding + 20}
                                        textAnchor="middle"
                                        className="fill-gray-300 text-xs font-medium"
                                        filter="url(#shadow)"
                                      >
                                        {timePoint.label}
                                      </text>
                                      <line
                                        x1={x}
                                        y1={chartHeight + padding - 6}
                                        x2={x}
                                        y2={chartHeight + padding + 6}
                                        stroke="#9ca3af"
                                        strokeWidth="2"
                                        opacity="0.7"
                                      />
                                    </g>
                                  );
                                });
                              })()}

                              {/* Enhanced Data Lines with Glow Effect */}
                              {availableBookmakers
                                .filter(bookmaker => enabledBookmakers.has(bookmaker.key))
                                .map(bookmaker => {
                                  const data = getBookmakerChartData(runnerOdds, bookmaker.key);
                                  if (data.length < 2) return null;

                                  const pathD = data.map((point, index) => {
                                    const x = padding + ((point.time - minTime) / timeRange) * chartWidth;
                                    const y = chartHeight + padding - ((point.odds - minOdds) / oddsRange) * chartHeight;
                                    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                                  }).join(' ');

                                  const color = getBookmakerColor(bookmaker.key);

                                  return (
                                    <g key={bookmaker.key}>
                                      {/* Glow effect line */}
                                      <path
                                        d={pathD}
                                        fill="none"
                                        stroke={color}
                                        strokeWidth="6"
                                        opacity="0.3"
                                        filter="url(#glow)"
                                      />
                                      
                                      {/* Main line */}
                                      <path
                                        d={pathD}
                                        fill="none"
                                        stroke={color}
                                        strokeWidth="3"
                                        opacity="0.9"
                                        filter="url(#shadow)"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                      
                                      {/* Enhanced Data Points */}
                                      {data.map((point, index) => {
                                        const x = padding + ((point.time - minTime) / timeRange) * chartWidth;
                                        const y = chartHeight + padding - ((point.odds - minOdds) / oddsRange) * chartHeight;
                                        return (
                                          <g key={index}>
                                            {/* Glow circle */}
                                            <circle
                                              cx={x}
                                              cy={y}
                                              r="6"
                                              fill={color}
                                              opacity="0.3"
                                              filter="url(#glow)"
                                            />
                                            {/* Main circle */}
                                            <circle
                                              cx={x}
                                              cy={y}
                                              r="4"
                                              fill={color}
                                              stroke="#1f2937"
                                              strokeWidth="2"
                                              filter="url(#shadow)"
                                              className="hover:r-6 transition-all duration-200"
                                            >
                                              <title>
                                                {formatBookmakerName(bookmaker.key)}: {point.odds.toFixed(2)} at {point.timeLabel}
                                              </title>
                                            </circle>
                                          </g>
                                        );
                                      })}
                                    </g>
                                  );
                                })}

                              {/* Data Type Lines (Runner data) */}
                              {enabledDataTypes.has('average_odds') || enabledDataTypes.has('sharp_average_odds') || 
                               enabledDataTypes.has('5_moving_average') || enabledDataTypes.has('20_moving_average') || enabledDataTypes.has('60_moving_average') ? 
                                (() => {
                                  const selectedRunner = uniqueRunners.find(r => r.horse_id === selectedHorseForChart);
                                  if (!selectedRunner) return null;

                                  return (
                                    <g>
                                      {/* Average Odds Line */}
                                      {enabledDataTypes.has('average_odds') && (() => {
                                        const data = getRunnerChartData(selectedRunner, 'average_odds');
                                        if (data.length < 2) return null;

                                        const pathD = data.map((point, index) => {
                                          const x = padding + ((point.time - minTime) / timeRange) * chartWidth;
                                          const y = chartHeight + padding - ((point.odds - minOdds) / oddsRange) * chartHeight;
                                          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                                        }).join(' ');

                                        const color = getDataTypeColor('average_odds');

                                        return (
                                          <g key="average_odds">
                                            <path d={pathD} fill="none" stroke={color} strokeWidth="4" opacity="0.8" strokeDasharray="5,5" />
                                            {data.map((point, index) => {
                                              const x = padding + ((point.time - minTime) / timeRange) * chartWidth;
                                              const y = chartHeight + padding - ((point.odds - minOdds) / oddsRange) * chartHeight;
                                              return (
                                                <circle key={index} cx={x} cy={y} r="3" fill={color} stroke="#1f2937" strokeWidth="1">
                                                  <title>Average Odds: {point.odds.toFixed(2)}</title>
                                                </circle>
                                              );
                                            })}
                                          </g>
                                        );
                                      })()}

                                      {/* Sharp Average Odds Line */}
                                      {enabledDataTypes.has('sharp_average_odds') && (() => {
                                        const data = getRunnerChartData(selectedRunner, 'sharp_average_odds');
                                        if (data.length < 2) return null;

                                        const pathD = data.map((point, index) => {
                                          const x = padding + ((point.time - minTime) / timeRange) * chartWidth;
                                          const y = chartHeight + padding - ((point.odds - minOdds) / oddsRange) * chartHeight;
                                          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                                        }).join(' ');

                                        const color = getDataTypeColor('sharp_average_odds');

                                        return (
                                          <g key="sharp_average_odds">
                                            <path d={pathD} fill="none" stroke={color} strokeWidth="4" opacity="0.8" strokeDasharray="10,5" />
                                            {data.map((point, index) => {
                                              const x = padding + ((point.time - minTime) / timeRange) * chartWidth;
                                              const y = chartHeight + padding - ((point.odds - minOdds) / oddsRange) * chartHeight;
                                              return (
                                                <circle key={index} cx={x} cy={y} r="3" fill={color} stroke="#1f2937" strokeWidth="1">
                                                  <title>Sharp Average Odds: {point.odds.toFixed(2)}</title>
                                                </circle>
                                              );
                                            })}
                                          </g>
                                        );
                                      })()}

                                      {/* Moving Average Lines */}
                                      {['5_moving_average', '20_moving_average', '60_moving_average'].map(maType => {
                                        if (!enabledDataTypes.has(maType)) return null;
                                        
                                        const data = getRunnerChartData(selectedRunner, maType);
                                        if (data.length < 2) return null;

                                        const pathD = data.map((point, index) => {
                                          const x = padding + ((point.time - minTime) / timeRange) * chartWidth;
                                          const y = chartHeight + padding - ((point.odds - minOdds) / oddsRange) * chartHeight;
                                          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                                        }).join(' ');

                                        const color = getDataTypeColor(maType);

                                        return (
                                          <g key={maType}>
                                            <path d={pathD} fill="none" stroke={color} strokeWidth="3" opacity="0.9" />
                                            {data.map((point, index) => {
                                              const x = padding + ((point.time - minTime) / timeRange) * chartWidth;
                                              const y = chartHeight + padding - ((point.odds - minOdds) / oddsRange) * chartHeight;
                                              return (
                                                <circle key={index} cx={x} cy={y} r="2.5" fill={color} stroke="#1f2937" strokeWidth="1">
                                                  <title>{maType.replace('_', ' ').toUpperCase()}: {point.odds.toFixed(2)}</title>
                                                </circle>
                                              );
                                            })}
                                          </g>
                                        );
                                      })}

                                      {/* Bollinger Bands */}
                                      {['5_bollinger_bands', '20_bollinger_bands', '60_bollinger_bands'].map(bbType => {
                                        if (!enabledDataTypes.has(bbType)) return null;
                                        
                                        const data = getBollingerBandsChartData(selectedRunner, bbType);
                                        if (data.length < 2) return null;

                                        const color = getDataTypeColor(bbType);
                                        
                                        // Create path for upper band
                                        const upperPathD = data.map((point, index) => {
                                          const x = padding + ((point.time - minTime) / timeRange) * chartWidth;
                                          const y = chartHeight + padding - ((point.upper - minOdds) / oddsRange) * chartHeight;
                                          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                                        }).join(' ');

                                        // Create path for lower band
                                        const lowerPathD = data.map((point, index) => {
                                          const x = padding + ((point.time - minTime) / timeRange) * chartWidth;
                                          const y = chartHeight + padding - ((point.lower - minOdds) / oddsRange) * chartHeight;
                                          return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                                        }).join(' ');

                                        // Create filled area between bands
                                        const areaPathD = [
                                          data.map((point, index) => {
                                            const x = padding + ((point.time - minTime) / timeRange) * chartWidth;
                                            const y = chartHeight + padding - ((point.upper - minOdds) / oddsRange) * chartHeight;
                                            return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                                          }).join(' '),
                                          data.slice().reverse().map((point, index) => {
                                            const x = padding + ((point.time - minTime) / timeRange) * chartWidth;
                                            const y = chartHeight + padding - ((point.lower - minOdds) / oddsRange) * chartHeight;
                                            return `${index === 0 ? 'L' : 'L'} ${x} ${y}`;
                                          }).join(' '),
                                          'Z'
                                        ].join(' ');

                                        return (
                                          <g key={bbType}>
                                            {/* Filled area */}
                                            <path d={areaPathD} fill={color} opacity="0.1" />
                                            {/* Upper band line */}
                                            <path d={upperPathD} fill="none" stroke={color} strokeWidth="2" opacity="0.6" strokeDasharray="3,3" />
                                            {/* Lower band line */}
                                            <path d={lowerPathD} fill="none" stroke={color} strokeWidth="2" opacity="0.6" strokeDasharray="3,3" />
                                          </g>
                                        );
                                      })}
                                    </g>
                                  );
                                })() : null}

                              {/* Enhanced Race start time vertical line */}
                              {race?.off && (() => {
                                const raceTime = parseTimeToMinutes(race.off);
                                if (raceTime >= minTime && raceTime <= maxTime) {
                                  const x = padding + ((raceTime - minTime) / timeRange) * chartWidth;
                                  return (
                                    <g>
                                      <line
                                        x1={x}
                                        y1={padding}
                                        x2={x}
                                        y2={chartHeight + padding}
                                        stroke="#ef4444"
                                        strokeWidth="3"
                                        strokeDasharray="8,4"
                                        opacity="0.8"
                                        filter="url(#glow)"
                                      />
                                      <text
                                        x={x}
                                        y={padding - 10}
                                        textAnchor="middle"
                                        className="fill-red-400 text-sm font-bold"
                                        filter="url(#shadow)"
                                      >
                                        Race Start
                                      </text>
                                    </g>
                                  );
                                }
                                return null;
                              })()}

                              {/* Enhanced Chart Title */}
                              <g>
                                {selectedRunner.silk_url ? (
                                  <>
                                    <image
                                      href={selectedRunner.silk_url}
                                      x={chartWidth / 2 + padding - 120}
                                      y={8}
                                      width="40"
                                      height="32"
                                      className="rounded"
                                      style={{ zIndex: 1000 }}
                                    />
                                    <text
                                      x={chartWidth / 2 + padding - 60}
                                      y={35}
                                      textAnchor="start"
                                      className="fill-white text-lg font-bold tracking-wide"
                                      filter="url(#shadow)"
                                    >
                                      {selectedRunner.horse_name} - Odds Movement
                                    </text>
                                  </>
                                ) : (
                                  <text
                                    x={chartWidth / 2 + padding}
                                    y={35}
                                    textAnchor="middle"
                                    className="fill-white text-lg font-bold tracking-wide"
                                    filter="url(#shadow)"
                                  >
                                    #{selectedRunner.number} {selectedRunner.horse_name} - Odds Movement
                                  </text>
                                )}
                              </g>

                              {/* Enhanced Axis Labels */}
                              <text
                                x={chartWidth / 2 + padding}
                                y={chartHeight + padding + 55}
                                textAnchor="middle"
                                className="fill-gray-300 text-sm font-semibold"
                                filter="url(#shadow)"
                              >
                                Time (UK)
                              </text>
                              
                              <text
                                x={25}
                                y={chartHeight / 2 + padding}
                                textAnchor="middle"
                                className="fill-gray-300 text-sm font-semibold"
                                transform={`rotate(-90, 25, ${chartHeight / 2 + padding})`}
                                filter="url(#shadow)"
                              >
                                Decimal Odds
                              </text>
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Enhanced Chart Legend */}
                      <div className="p-4 bg-gradient-to-r from-gray-800/30 via-gray-700/30 to-gray-800/30 rounded-xl border border-gray-600/20 backdrop-blur-sm">
                        {/* Active Bookmakers */}
                        {Array.from(enabledBookmakers).length > 0 && (
                          <div className="mb-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <div className="w-2 h-2 bg-gradient-to-r from-betting-green to-green-400 rounded-full"></div>
                          <h4 className="text-sm font-semibold text-gray-200">Active Bookmakers</h4>
                        </div>
                        <div className="flex flex-wrap gap-4 text-sm">
                          {availableBookmakers
                            .filter(bookmaker => enabledBookmakers.has(bookmaker.key))
                            .map(bookmaker => (
                              <div key={bookmaker.key} className="flex items-center space-x-3 p-2 bg-gray-700/20 rounded-lg border border-gray-600/20">
                                <div 
                                  className="w-4 h-1 rounded-full shadow-lg"
                                  style={{ 
                                    backgroundColor: getBookmakerColor(bookmaker.key),
                                    boxShadow: `0 0 8px ${getBookmakerColor(bookmaker.key)}40`
                                  }}
                                />
                                <span className="text-gray-200 font-medium">
                                  {formatBookmakerName(bookmaker.key)}
                                </span>
                              </div>
                            ))}
                        </div>
                          </div>
                        )}

                        {/* Active Data Types */}
                        {Array.from(enabledDataTypes).length > 0 && (
                          <div>
                            <div className="flex items-center space-x-2 mb-3">
                              <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"></div>
                              <h4 className="text-sm font-semibold text-gray-200">Active Data Types</h4>
                            </div>
                            <div className="flex flex-wrap gap-4 text-sm">
                              {[
                                { key: 'average_odds', name: 'Average Odds', style: 'dashed' },
                                { key: 'sharp_average_odds', name: 'Sharp Odds', style: 'dashed' },
                                { key: '5_moving_average', name: '5min MA', style: 'solid' },
                                { key: '20_moving_average', name: '20min MA', style: 'solid' },
                                { key: '60_moving_average', name: '60min MA', style: 'solid' },
                                { key: '5_bollinger_bands', name: '5min BB', style: 'bands' },
                                { key: '20_bollinger_bands', name: '20min BB', style: 'bands' },
                                { key: '60_bollinger_bands', name: '60min BB', style: 'bands' }
                              ]
                                .filter(dataType => enabledDataTypes.has(dataType.key))
                                .map(dataType => (
                                  <div key={dataType.key} className="flex items-center space-x-3 p-2 bg-gray-700/20 rounded-lg border border-gray-600/20">
                                    {dataType.style === 'bands' ? (
                                      <div className="w-4 h-3 relative">
                                        <div 
                                          className="absolute inset-0 rounded opacity-30"
                                          style={{ backgroundColor: getDataTypeColor(dataType.key) }}
                                        />
                                        <div 
                                          className="absolute top-0 left-0 right-0 h-0.5 rounded"
                                          style={{ backgroundColor: getDataTypeColor(dataType.key) }}
                                        />
                                        <div 
                                          className="absolute bottom-0 left-0 right-0 h-0.5 rounded"
                                          style={{ backgroundColor: getDataTypeColor(dataType.key) }}
                                        />
                                      </div>
                                    ) : (
                                      <div 
                                        className={`w-4 h-1 rounded-full shadow-lg ${dataType.style === 'dashed' ? 'opacity-80' : ''}`}
                                        style={{ 
                                          backgroundColor: getDataTypeColor(dataType.key),
                                          boxShadow: `0 0 8px ${getDataTypeColor(dataType.key)}40`,
                                          ...(dataType.style === 'dashed' && {
                                            backgroundImage: `repeating-linear-gradient(to right, ${getDataTypeColor(dataType.key)} 0px, ${getDataTypeColor(dataType.key)} 3px, transparent 3px, transparent 6px)`
                                          })
                                        }}
                                      />
                                    )}
                                    <span className="text-gray-200 font-medium">
                                      {dataType.name}
                                    </span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>
      </div>
      </PageProtection>
    </Layout>
  );
} 