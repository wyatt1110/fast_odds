'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Layout from "@/components/layout/Layout";
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
  Zap
} from 'lucide-react';
import { 
  getTodaysRaces,
  getRaceRunners, 
  getRaceOdds,
  Race, 
  Runner,
  getCurrentUKDateInfo 
} from '@/lib/services/racecardsService';
import { getRandomTrackImage } from "@/lib/services/trackImageService";

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
  [key: string]: any;
}

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
  
  // Chart state
  const [selectedHorseForChart, setSelectedHorseForChart] = useState<string>('');
  const [enabledBookmakers, setEnabledBookmakers] = useState<Set<string>>(new Set(['bet365', 'william_hill', 'paddy_power', 'sky_bet']));
  const chartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const fetchRaceData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch race data, runners, and odds in parallel
        const [racesData, runnersData, oddsData, imageUrl] = await Promise.all([
          getTodaysRaces(),
          getRaceRunners(raceId),
          getRaceOdds(raceId),
          getRandomTrackImage(raceId) // Use raceId as seed for consistent daily image
        ]);
        
        // Find the specific race
        const raceData = racesData.find((r: any) => r.race_id === raceId);
        if (!raceData) {
          setError('Race not found');
          return;
        }
        
        // Debug logging
        console.log('Race ID:', raceId);
        console.log('Runners Data:', runnersData);
        console.log('Odds Data:', oddsData);
        console.log('First runner horse_id:', runnersData[0]?.horse_id);
        console.log('First odds record:', oddsData[0]);
        
        setRace(raceData);
        setAllRaces(racesData);
        setRunners(runnersData);
        setOdds(oddsData as RaceOdds[]);
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
    if (position === '1') return 'text-green-400 font-bold';
    if (position === '2') return 'text-blue-400 font-semibold';
    if (position === '3') return 'text-orange-400 font-semibold';
    if (['4', '5', '6'].includes(position)) return 'text-yellow-400';
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
      'x': 'Previously worn some headgear but none today'
    };
    
    const fullName = headgearMap[headgearCode.toLowerCase()] || headgearCode.toUpperCase();
    
    // If multiple pieces and the name has multiple words, abbreviate the second word
    if (isMultiple && fullName.includes(' ')) {
      const words = fullName.split(' ');
      if (words.length >= 2) {
        return `${words[0]} ${words[1].charAt(0)}`;
      }
    }
    
    return fullName;
  };

  // Parse multiple headgear pieces (e.g., "tp" becomes ["t", "p"], "t,p" or "t p")
  const parseHeadgearPieces = (headgearCode: string | null): string[] => {
    if (!headgearCode) return [];
    
    let pieces: string[] = [];
    
    // First expand any combined codes like "tp" to separate pieces
    const expandedCode = headgearCode
      .toLowerCase()
      .replace('tp', 't,p')  // Convert "tp" to "t,p"
      .replace('ht', 'h,t')  // Handle other common combinations if needed
      .replace('hp', 'h,p')
      .replace('bt', 'b,t')
      .replace('bp', 'b,p');
    
    // Then split by comma or space and clean up
    pieces = expandedCode
      .split(/[,\s]+/)
      .map(piece => piece.trim().toLowerCase())
      .filter(piece => piece.length > 0);
    
    return pieces;
  };

  const formatWindSurgery = (windSurgery: string | null): string => {
    if (!windSurgery) return '';
    return 'Wind Surgery';
  };

  const formatSex = (sexCode: string | null): string => {
    if (!sexCode) return '';
    
    const sexMap: { [key: string]: string } = {
      'C': 'Colt',
      'F': 'Filly', 
      'G': 'Gelding',
      'H': 'Horse',
      'M': 'Mare'
    };
    
    const result = sexMap[sexCode.toUpperCase()] || sexCode;
    // Ensure first letter is capitalized
    return result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
  };

  // Get bookmakers that have live odds data (not all SP/null) for any runner
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

  return (
    <Layout>
      <div className="min-h-screen bg-betting-dark text-white">
        <div className="container mx-auto px-4 py-8">
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
          <div className="bg-betting-green/10 border border-betting-green/30 rounded-xl overflow-hidden mb-8">
            <div className="flex flex-col lg:flex-row">
              {/* Cover Photo */}
              <div className="lg:w-64 h-40 lg:h-64">
                <img 
                  src={racingImageUrl}
                  alt="Racing"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src = '/images/fallback-track.jpg';
                  }}
                />
              </div>

              {/* Race Content */}
              <div className="flex-1 p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                  {/* Race Title & Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="bg-betting-green/20 text-betting-green px-4 py-2 rounded-lg font-mono font-bold text-lg">
                        {formatRaceTime(race)}
                      </div>
                      <div className={`px-3 py-1 rounded border text-sm font-semibold ${getRaceTypeColor(getRaceType(race))}`}>
                        {getRaceType(race)}
                      </div>
                      {(race.race_class || race.pattern) && (
                        <div className="px-3 py-1 rounded border text-sm font-semibold bg-orange-500/20 text-orange-400 border-orange-500/30">
                          {formatRaceClassAndPattern(race.race_class, race.pattern)}
                        </div>
                      )}
                      {race.big_race && (
                        <div className="px-3 py-1 rounded border text-sm font-semibold bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                          BIG RACE
                        </div>
                      )}
                    </div>
                    
                    <h1 className="text-4xl font-heading font-extrabold text-white mb-2">
                      {race.race_name || 'Race Details'}
                    </h1>
                    <div className="text-lg text-gray-300 mb-2">
                      <span className="font-semibold">{race.course || 'Unknown Course'}</span>
                      {race.distance && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{race.distance}</span>
                        </>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-300">
                      <div>
                        <span className="text-gray-400">Course:</span>
                        <div className="text-white font-semibold">{race.course}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Distance:</span>
                        <div className="text-white font-semibold">{race.distance_round || race.distance}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Prize:</span>
                        <div className="text-betting-green font-semibold">{formatPrizeMoney(race.prize)}</div>
                      </div>
                      <div>
                        <span className="text-gray-400">Field Size:</span>
                        <div className="text-white font-semibold">{uniqueRunners.length} runners</div>
                      </div>
                    </div>
                  </div>

                  {/* Race Conditions */}
                  <div className="lg:w-64 bg-betting-green/5 border border-betting-green/20 rounded-lg p-4">
                    <h3 className="text-lg font-semibold text-white mb-3">Race Conditions</h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-400">Going:</span>
                        <span className="ml-2 text-white">{race.going || 'Unknown'}</span>
                      </div>
                      {race.weather && race.weather.toLowerCase() !== 'unknown' && (
                        <div>
                          <span className="text-gray-400">Weather:</span>
                          <span className="ml-2 text-white">{race.weather}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-400">Surface:</span>
                        <span className="ml-2 text-white">{race.surface || 'Turf'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Age Restriction:</span>
                        <span className="ml-2 text-white">{race.age_band || 'All Ages'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Race Type:</span>
                        <span className="ml-2 text-white">{race.race_type || 'Handicap'}</span>
                      </div>
                      {race.conditions_text && (
                        <div className="pt-2 border-t border-betting-green/20">
                          <span className="text-gray-400">Conditions:</span>
                          <div className="text-xs text-gray-300 mt-1 leading-relaxed">
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

          {/* Race Analysis Summary */}
          {race.tip || race.verdict || race.betting_forecast ? (
            <div className="bg-betting-green/5 border border-betting-green/20 rounded-xl p-4 mb-6">
              <h2 className="text-lg font-heading font-bold text-white mb-3">
                Expert Analysis
              </h2>
              <div className="grid md:grid-cols-3 gap-3">
                {race.tip && (
                  <div className="bg-gray-800/40 border border-gray-600/30 rounded-lg p-3">
                    <h3 className="text-white font-semibold mb-1 text-sm">Tip</h3>
                    <p className="text-gray-300 text-xs leading-relaxed">{race.tip}</p>
                  </div>
                )}
                {race.verdict && (
                  <div className="bg-gray-800/40 border border-gray-600/30 rounded-lg p-3">
                    <h3 className="text-white font-semibold mb-1 text-sm">Verdict</h3>
                    <p className="text-gray-300 text-xs leading-relaxed">{race.verdict}</p>
                  </div>
                )}
                {race.betting_forecast && (
                  <div className="bg-gray-800/40 border border-gray-600/30 rounded-lg p-3">
                    <h3 className="text-white font-semibold mb-1 text-sm">Betting Forecast</h3>
                    <p className="text-gray-300 text-xs leading-relaxed">{race.betting_forecast}</p>
                  </div>
                )}
              </div>
            </div>
          ) : null}

          {/* Runners Table */}
          <div className="bg-betting-dark border border-betting-green/20 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-betting-green/20">
              <h2 className="text-xl font-heading font-bold text-white">
                Runners & PPs
              </h2>
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
                                className="w-10 h-8 object-contain rounded border border-gray-600/30"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-500/20 rounded border border-gray-600/30 flex items-center justify-center">
                                <span className="text-xs text-gray-500">?</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Horse Number and Name */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1 mb-0.5">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                isNonRunner 
                                  ? 'bg-gray-500/20 text-gray-500' 
                                  : 'bg-betting-green/20 text-betting-green'
                              }`}>
                            {runner.number || index + 1}
                          </div>
                              <h3 className={`font-bold text-sm truncate ${
                                isNonRunner ? 'text-gray-500' : 'text-white'
                              }`}>{runner.horse_name}</h3>
                            </div>
                            <div className={`text-xs flex items-center gap-0.5 flex-wrap ${
                              isNonRunner ? 'text-gray-600' : 'text-gray-400'
                            }`}>
                              {/* Age */}
                              <div className="bg-gray-500/10 px-1 py-0.5 rounded border border-gray-600/20 text-xs">
                                {runner.age ? `${runner.age}yo` : '-'}
                              </div>
                              
                              {/* Sex */}
                              <div className="bg-gray-500/10 px-1 py-0.5 rounded border border-gray-600/20 text-xs">
                                {formatSex(runner.sex) || '-'}
                              </div>
                              
                              {/* Headgear */}
                              {runner.headgear ? (() => {
                                const pieces = parseHeadgearPieces(runner.headgear);
                                const isMultiple = pieces.length > 1;
                                return pieces.map((piece, index) => (
                                  <div key={index} className="bg-gray-500/10 px-1 py-0.5 rounded border border-gray-600/20 text-xs">
                                    {formatHeadgear(piece, isMultiple)}
                                    {runner.headgear_run && (
                                      <sup className="text-gray-400 text-xs ml-0.5">
                                        ({runner.headgear_run})
                                      </sup>
                                    )}
                                  </div>
                                ));
                              })() : (
                                <div className="bg-gray-500/10 px-1 py-0.5 rounded border border-gray-600/20 text-xs">
                                  -
                                </div>
                              )}
                              
                              {/* Wind Surgery */}
                              {runner.wind_surgery && (
                                <div className="bg-gray-500/10 px-1 py-0.5 rounded border border-gray-600/20 text-xs">
                                  {formatWindSurgery(runner.wind_surgery)}
                                  {runner.wind_surgery_run && (
                                    <sup className="text-gray-400 text-xs ml-0.5">
                                      ({runner.wind_surgery_run})
                                    </sup>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Key Stats Row */}
                        <div className="grid grid-cols-3 gap-0.5 text-xs">
                          <div className={`px-1 py-0.5 rounded ${
                            isNonRunner ? 'bg-gray-500/10' : 'bg-betting-green/10'
                          }`}>
                            <div className={`text-xs ${isNonRunner ? 'text-gray-600' : 'text-gray-400'}`}>WT</div>
                            <div className={`font-semibold text-xs ${
                              isNonRunner ? 'text-gray-500' : 'text-white'
                            }`}>{runner.weight_lbs || '-'}</div>
                          </div>
                          <div className={`px-1 py-0.5 rounded ${
                            isNonRunner ? 'bg-gray-500/10' : 'bg-betting-green/10'
                          }`}>
                            <div className={`text-xs ${isNonRunner ? 'text-gray-600' : 'text-gray-400'}`}>DR</div>
                            <div className={`font-semibold text-xs ${
                              isNonRunner ? 'text-gray-500' : 'text-white'
                            }`}>{runner.draw || '-'}</div>
                          </div>
                          <div className={`px-1 py-0.5 rounded ${
                            isNonRunner ? 'bg-gray-500/10' : 'bg-betting-green/10'
                          }`}>
                            <div className={`text-xs ${isNonRunner ? 'text-gray-600' : 'text-gray-400'}`}>OR</div>
                            <div className={`font-semibold text-xs ${
                              isNonRunner ? 'text-gray-500' : 'text-white'
                            }`}>{runner.ofr || '-'}</div>
                          </div>
                        </div>
                      </div>

                      {/* Middle Section - Form & Ratings */}
                      <div className="lg:col-span-4">
                        <div className="space-y-1">
                          {/* Top Data Row - 6 columns */}
                          <div className="grid grid-cols-6 gap-1 text-xs">
                            {/* Form */}
                          <div>
                              <div className={`text-xs ${
                                isNonRunner ? 'text-gray-600' : 'text-gray-400'
                              }`}>FORM</div>
                              <div className="font-mono text-xs tracking-wider">
                              {formatFormString(runner.form)}
                              </div>
                            </div>
                            
                            {/* Sire/Dam */}
                            <div>
                              <div className={`text-xs ${
                                isNonRunner ? 'text-gray-600' : 'text-gray-400'
                              }`}>SIRE/DAM</div>
                              <div className={`text-xs leading-tight ${
                                isNonRunner ? 'text-gray-500' : 'text-white'
                              }`}>
                                <div className="truncate">{runner.sire || '-'}</div>
                                <div className="truncate">{runner.damsire || '-'}</div>
                              </div>
                            </div>
                            
                            {/* Weight */}
                            <div>
                              <div className={`text-xs ${
                                isNonRunner ? 'text-gray-600' : 'text-gray-400'
                              }`}>WEIGHT</div>
                              <div className={`font-semibold text-xs ${
                                isNonRunner ? 'text-gray-500' : 'text-white'
                              }`}>{runner.weight_lbs || '-'}</div>
                            </div>
                            
                            {/* Flags */}
                            <div>
                              <div className={`text-xs ${
                                isNonRunner ? 'text-gray-600' : 'text-gray-400'
                              }`}>FLAGS</div>
                              <div className={`font-semibold text-xs ${
                                isNonRunner ? 'text-gray-500' : 'text-white'
                              }`}>{runner.past_results_flag || '-'}</div>
                            </div>
                            
                            {/* Jockey */}
                            <div>
                              <div className={`text-xs ${
                                isNonRunner ? 'text-gray-600' : 'text-gray-400'
                              }`}>JOCKEY</div>
                              <div className={`font-semibold text-xs ${
                                isNonRunner ? 'text-gray-500' : 'text-white'
                              }`}>{runner.jockey || '-'}</div>
                            </div>
                            
                            {/* Trainer */}
                            <div>
                              <div className={`text-xs ${
                                isNonRunner ? 'text-gray-600' : 'text-gray-400'
                              }`}>TRAINER</div>
                              <div className={`font-semibold text-xs ${
                                isNonRunner ? 'text-gray-500' : 'text-white'
                              }`}>{runner.trainer || '-'}</div>
                            </div>
                          </div>
                          
                          {/* Ratings Grid */}
                          <div className="grid grid-cols-4 gap-0.5">
                            <div className={`px-1 py-0.5 rounded text-center ${
                              isNonRunner ? 'bg-gray-500/10' : 'bg-blue-500/10'
                            }`}>
                              <div className={`text-xs ${
                                isNonRunner ? 'text-gray-600' : 'text-blue-400'
                              }`}>RPR</div>
                              <div className={`font-bold text-xs ${
                                isNonRunner ? 'text-gray-500' : 'text-white'
                              }`}>{runner.rpr || '-'}</div>
                            </div>
                            <div className={`px-1 py-0.5 rounded text-center ${
                              isNonRunner ? 'bg-gray-500/10' : 'bg-purple-500/10'
                            }`}>
                              <div className={`text-xs ${
                                isNonRunner ? 'text-gray-600' : 'text-purple-400'
                              }`}>TS</div>
                              <div className={`font-bold text-xs ${
                                isNonRunner ? 'text-gray-500' : 'text-white'
                              }`}>{runner.ts || '-'}</div>
                            </div>
                            <div className={`px-1 py-0.5 rounded text-center ${
                              isNonRunner ? 'bg-gray-500/10' : 'bg-orange-500/10'
                            }`}>
                              <div className={`text-xs ${
                                isNonRunner ? 'text-gray-600' : 'text-orange-400'
                              }`}>OFR</div>
                              <div className={`font-bold text-xs ${
                                isNonRunner ? 'text-gray-500' : 'text-white'
                              }`}>{runner.ofr || '-'}</div>
                            </div>
                            <div className={`px-1 py-0.5 rounded text-center ${
                              isNonRunner ? 'bg-gray-500/10' : 'bg-green-500/10'
                            }`}>
                              <div className={`text-xs ${
                                isNonRunner ? 'text-gray-600' : 'text-green-400'
                              }`}>LR</div>
                              <div className={`font-bold text-xs ${
                                isNonRunner ? 'text-gray-500' : 'text-white'
                              }`}>{runner.last_run || '-'}</div>
                            </div>
                          </div>

                          {/* Placeholder Data Blocks */}
                          <div className="grid grid-cols-5 gap-0.5">
                            <div className="bg-gray-500/10 px-1 py-0.5 rounded text-center">
                              <div className="text-xs text-gray-500">SP</div>
                              <div className="text-gray-400 text-xs">-</div>
                            </div>
                            <div className="bg-gray-500/10 px-1 py-0.5 rounded text-center">
                              <div className="text-xs text-gray-500">CLS</div>
                              <div className="text-gray-400 text-xs">-</div>
                            </div>
                            <div className="bg-gray-500/10 px-1 py-0.5 rounded text-center">
                              <div className="text-xs text-gray-500">DST</div>
                              <div className="text-gray-400 text-xs">-</div>
                            </div>
                            <div className="bg-gray-500/10 px-1 py-0.5 rounded text-center">
                              <div className="text-xs text-gray-500">TRK</div>
                              <div className="text-gray-400 text-xs">-</div>
                            </div>
                            <div className="bg-gray-500/10 px-1 py-0.5 rounded text-center">
                              <div className="text-xs text-gray-500">G</div>
                              <div className="text-gray-400 text-xs">-</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Section - Odds */}
                      <div className="lg:col-span-5">
                        <div className="space-y-1">

                          {/* Best Odds Display - Compact 2x2 Grid */}
                          <div className="grid grid-cols-2 gap-0.5">
                            {/* Live Best Odds */}
                            <div className={`px-1 py-0.5 rounded text-center ${
                              isNonRunner ? 'bg-gray-500/10' : 'bg-betting-green/10'
                            }`}>
                              <div className={`text-xs ${
                                isNonRunner ? 'text-gray-600' : 'text-gray-400'
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
                                  <div className="text-xs text-gray-500 truncate">
                                    ({formatBookmakerName(liveOdds.bookmaker)})
                            </div>
                                ) : <div className="text-xs h-3">&nbsp;</div>;
                              })()}
                          </div>

                            {/* Best Opening Odds */}
                            <div className={`px-1 py-0.5 rounded text-center ${
                              isNonRunner ? 'bg-gray-500/10' : 'bg-blue-500/10'
                            }`}>
                              <div className={`text-xs ${
                                isNonRunner ? 'text-gray-600' : 'text-gray-400'
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
                                  <div className="text-xs text-gray-500 truncate">
                                    ({formatBookmakerName(openingOdds.bookmaker)})
                              </div>
                                ) : <div className="text-xs h-3">&nbsp;</div>;
                              })()}
                          </div>

                            {/* Day High */}
                            <div className={`px-1 py-0.5 rounded text-center ${
                              isNonRunner ? 'bg-gray-500/10' : 'bg-orange-500/10'
                            }`}>
                              <div className={`text-xs ${
                                isNonRunner ? 'text-gray-600' : 'text-gray-400'
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
                                  <div className="text-xs text-gray-500 truncate">
                                    ({formatBookmakerName(highLow.high.bookmaker)} {highLow.high.time})
                              </div>
                                ) : <div className="text-xs h-3">&nbsp;</div>;
                              })()}
                              </div>

                            {/* Day Low */}
                            <div className={`px-1 py-0.5 rounded text-center ${
                              isNonRunner ? 'bg-gray-500/10' : 'bg-purple-500/10'
                            }`}>
                              <div className={`text-xs ${
                                isNonRunner ? 'text-gray-600' : 'text-gray-400'
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
                                  <div className="text-xs text-gray-500 truncate">
                                    ({formatBookmakerName(highLow.low.bookmaker)} {highLow.low.time})
                              </div>
                                ) : <div className="text-xs h-3">&nbsp;</div>;
                              })()}
                              </div>
                              </div>


                            </div>
                      </div>
                    </div>

                    {/* Bottom Row - Comments & Special Info */}
                    {(runner.comment || runner.spotlight) && (
                      <div className="mt-4 pt-4 border-t border-betting-green/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {runner.comment && (
                            <div className="bg-blue-500/10 p-2 rounded">
                              <div className="text-blue-400 font-semibold">COMMENT</div>
                              <div className="text-white">{runner.comment}</div>
                            </div>
                          )}
                          {runner.spotlight && (
                            <div className="bg-yellow-500/10 p-2 rounded">
                              <div className="text-yellow-400 font-semibold">SPOTLIGHT</div>
                              <div className="text-white">{runner.spotlight}</div>
                            </div>
                          )}
                        </div>
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
                      {/* Bookmaker Toggle Controls */}
                      <div className="p-5 bg-gradient-to-r from-gray-800/40 via-gray-700/40 to-gray-800/40 border border-gray-500/30 rounded-xl shadow-lg backdrop-blur-sm">
                        <div className="flex items-center space-x-3 mb-4">
                          <div className="w-2 h-2 bg-gradient-to-r from-betting-green to-green-400 rounded-full"></div>
                          <h3 className="text-sm font-semibold text-gray-200 tracking-wide">
                            Toggle Bookmakers
                          </h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
                          {availableBookmakers.map(bookmaker => (
                            <label key={bookmaker.key} className="group flex items-center space-x-3 p-3 bg-gradient-to-r from-gray-700/30 to-gray-600/30 rounded-lg border border-gray-600/20 hover:border-gray-500/40 transition-all duration-300 cursor-pointer hover:shadow-md">
                              <div className="relative">
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
                                  className="sr-only"
                                />
                                <div className={`w-4 h-4 rounded border-2 transition-all duration-200 ${
                                  enabledBookmakers.has(bookmaker.key) 
                                    ? 'bg-gradient-to-r from-betting-green to-green-400 border-betting-green shadow-lg' 
                                    : 'border-gray-500 bg-gray-700/50'
                                }`}>
                                  {enabledBookmakers.has(bookmaker.key) && (
                                    <svg className="w-3 h-3 text-white ml-0.5 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </div>
                              </div>
                              <span 
                                className="text-xs font-medium truncate transition-colors duration-200 group-hover:text-white" 
                                style={{ color: enabledBookmakers.has(bookmaker.key) ? getBookmakerColor(bookmaker.key) : '#9CA3AF' }}
                              >
                                {formatBookmakerName(bookmaker.key)}
                              </span>
                            </label>
                          ))}
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
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 text-center text-gray-400 text-sm">
            <p>This racecard is updated in real-time from our racing data API.</p>
            <p className="mt-2">Data provided by The Racing API • Last updated: {new Date().toLocaleTimeString('en-GB', { timeZone: 'Europe/London' })}</p>
          </div>
        </div>
      </div>
    </Layout>
  );
} 