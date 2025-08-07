'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Layout from "@/components/layout/Layout";
import { RefreshCw, Settings, Eye, EyeOff, ChevronUp, ChevronDown, Calculator, TrendingUp, Filter } from "lucide-react";
import PageProtection from "@/components/auth/PageProtection";
import { MembershipTier } from "@/lib/permissions/access-control";
import { getCurrentUKDateInfo } from '@/lib/services/racecardsService';

// Comprehensive ProcessedRunner interface with 50+ data points
interface ProcessedRunner {
  id: string;
  horse_name: string;
  horse_id: string;
  number: string;
  course: string;
  raceTime: string;
  jockey: string;
  trainer: string;
  weight: string;
  age: string;
  form: string;
  odds_decimal: number;
  
  // Live best odds calculation
  live_best_odds: {
    value: string;
    bookmaker: string;
    decimal: number;
  };
  
  // Comprehensive bookmaker odds
  bookmaker_odds: {
    bet365: string;
    william_hill: string;
    paddy_power: string;
    sky_bet: string;
    ladbrokes: string;
    coral: string;
    betfair: string;
    betfred: string;
    unibet: string;
    bet_uk: string;
    bet_victor: string;
    betway: string;
    boyle_sports: string;
    virgin_bet: string;
    sporting_index: string;
    spreadex: string;
    kwiff: string;
    tote: string;
    betmgm: string;
    copybet: string;
    dragon_bet: string;
    grosvenor_sports: string;
    hollywood_bets: string;
    matchbook: string;
    midnite: string;
    pricedup_bet: string;
    quinn_bet: string;
    star_sports: string;
    talksport_bet: string;
    betfair_exchange: string;
    [key: string]: string;
  };
  
  // Average and calculated odds
  average_odds: string;
  sharp_average_odds: string;
  vig_odds: string;
  adj_win_model: string;
  '7.8_model': string;
  price_change: string;
  
  // Rating and analysis data
  timeform_rating: number | null;
  official_rating: number | null;
  speed_rating: number | null;
  
  // Historical performance
  runs_last_12_months: number;
  wins_last_12_months: number;
  win_rate_last_12_months: number;
  profit_loss_last_12_months: number;
  
  // Course and distance stats
  course_wins: number;
  course_runs: number;
  distance_wins: number;
  distance_runs: number;
  
  // Jockey and trainer stats
  jockey_win_rate: number;
  trainer_win_rate: number;
  jockey_trainer_combo: number;
  
  // Market data
  market_position: number;
  forecast_position: number;
  early_price: string;
  price_movement: string;
  
  // Advanced metrics
  closing_line_value: number | null;
  implied_probability: number;
  value_rating: number;
  confidence_score: number;
}

// EV Configuration interface
interface EVConfig {
  primaryMethod: 'sharp_average_odds' | 'vig_odds' | 'adj_win_model' | '7.8_model';
  secondaryMethod?: 'sharp_average_odds' | 'vig_odds' | 'adj_win_model' | '7.8_model';
  hasSecondary: boolean;
}

// Available bookmakers for display
const ALL_BOOKMAKERS = [
  'bet365', 'william_hill', 'paddy_power', 'sky_bet', 'ladbrokes', 'coral',
  'betfair', 'betfred', 'unibet', 'bet_uk', 'bet_victor', 'betway',
  'boyle_sports', 'virgin_bet', 'sporting_index', 'spreadex', 'kwiff',
  'tote', 'betmgm', 'copybet', 'dragon_bet', 'grosvenor_sports',
  'hollywood_bets', 'matchbook', 'midnite', 'pricedup_bet', 'quinn_bet',
  'star_sports', 'talksport_bet', 'betfair_exchange'
];

// EV Calculation function - calculates EV for each odds column individually
const calculateRunnerEV = (runner: ProcessedRunner, evConfig: EVConfig, oddsField?: string, bookmaker?: string): { primary: number | null; secondary: number | null } => {
  const getTrueOdds = (method: string): number => {
    let odds = 0;
    switch (method) {
      case 'sharp_average_odds':
        odds = parseFloat(runner.sharp_average_odds || '0');
        break;
      case 'vig_odds':
        odds = parseFloat(runner.vig_odds || '0');
        break;
      case 'adj_win_model':
        odds = parseFloat(runner.adj_win_model || '0');
        break;
      case '7.8_model':
        odds = parseFloat(runner['7.8_model'] || '0');
        break;
    }
    return odds > 0 ? odds : 0;
  };

  const calculateEV = (marketOdds: number, trueOdds: number): number => {
    if (trueOdds <= 0 || marketOdds <= 0) return 0;
    return ((marketOdds / trueOdds) - 1) * 100;
  };

  // Get the specific odds for this column
  let marketOdds = 0;
  if (oddsField === 'live_best_odds') {
    marketOdds = runner.live_best_odds.decimal || 0;
  } else if (oddsField === 'sharp_average_odds') {
    marketOdds = parseFloat(runner.sharp_average_odds || '0');
  } else if (oddsField === 'vig_odds') {
    marketOdds = parseFloat(runner.vig_odds || '0');
  } else if (oddsField === 'adj_win_model') {
    marketOdds = parseFloat(runner.adj_win_model || '0');
  } else if (oddsField === '7.8_model') {
    marketOdds = parseFloat(runner['7.8_model'] || '0');
  } else if (bookmaker) {
    marketOdds = parseFloat(runner.bookmaker_odds[bookmaker] || '0');
  }
  
  const primaryTrueOdds = getTrueOdds(evConfig.primaryMethod);
  
  // If we're calculating EV for the same method as true odds, it should be 0
  if (oddsField === evConfig.primaryMethod) {
    const primary = 0;
    let secondary = null;
    if (evConfig.hasSecondary && evConfig.secondaryMethod && oddsField !== evConfig.secondaryMethod) {
      const secondaryTrueOdds = getTrueOdds(evConfig.secondaryMethod);
      secondary = calculateEV(marketOdds, secondaryTrueOdds);
    } else if (evConfig.hasSecondary && evConfig.secondaryMethod && oddsField === evConfig.secondaryMethod) {
      secondary = 0;
    }
    return { primary, secondary };
  }
  
  const primary = calculateEV(marketOdds, primaryTrueOdds);
  
  let secondary = null;
  if (evConfig.hasSecondary && evConfig.secondaryMethod) {
    if (oddsField === evConfig.secondaryMethod) {
      secondary = 0; // EV against itself is always 0
    } else {
      const secondaryTrueOdds = getTrueOdds(evConfig.secondaryMethod);
      secondary = calculateEV(marketOdds, secondaryTrueOdds);
    }
  }
  
  return { primary: primary, secondary };
};

export default function ProDashboard() {
  console.log('🚀 PRO DASHBOARD: Component is mounting/rendering');
  
  // Separate data states for proper architecture
  const [raceData, setRaceData] = useState<any[]>([]);  // Basic race info (loaded once)
  const [runnerData, setRunnerData] = useState<any[]>([]);  // Basic runner info (loaded once)  
  const [oddsData, setOddsData] = useState<any[]>([]);  // Odds data (refreshed as needed)
  const [processedRunners, setProcessedRunners] = useState<ProcessedRunner[]>([]);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Display and filtering state
  const [visibleBookmakers, setVisibleBookmakers] = useState<Set<string>>(
    new Set([])
  );
  const [sortField, setSortField] = useState<string>('live_best_odds');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showSettings, setShowSettings] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // EV Configuration
  const [evConfig, setEvConfig] = useState<EVConfig>({
    primaryMethod: 'sharp_average_odds',
    hasSecondary: false
  });
  
  // Filters - Default to NULL (no filters)
  const [filters, setFilters] = useState({
    minOdds: '',
    maxOdds: '',
    minEV1: '',
    minEV2: '',
    minPriceChange: ''
  });

  // Settings state for the panel (separate from applied settings)
  const [pendingEvConfig, setPendingEvConfig] = useState<EVConfig>({
    primaryMethod: 'sharp_average_odds',
    hasSecondary: false
  });
  
  const [pendingFilters, setPendingFilters] = useState({
    minOdds: '',
    maxOdds: '',
    minEV1: '',
    minEV2: '',
    minPriceChange: ''
  });

  // Copy EXACT logic from handicap cards page
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

  const parseLatestPriceChange = (priceChangeData: string | null): string => {
    if (!priceChangeData) return '0.0';
    const lastEntry = priceChangeData.split(' / ').pop() || '';
    const priceChange = lastEntry.split('_')[0];
    return priceChange || '0.0';
  };

  const getLiveSharpAverageOdds = (runner: any): string => {
    if (!runner?.sharp_average_odds) return '0.00';
    
    const historyData = getLatestOddsFromHistory(runner.sharp_average_odds);
    if (!historyData) return '0.00';
    
    return historyData.odds.toFixed(2);
  };

  // Get live best odds from all bookmaker history columns (EXACT COPY from handicap cards)
  const getLiveBestOdds = (runnerOdds: any | null): { value: string; bookmaker: string; decimal: number } => {
    if (!runnerOdds) return { value: '0.00', bookmaker: '', decimal: 0 };

    const bookmakers = [
      { name: 'bet365', history: runnerOdds.bet365_history },
      { name: 'william_hill', history: runnerOdds.william_hill_history },
      { name: 'paddy_power', history: runnerOdds.paddy_power_history },
      { name: 'sky_bet', history: runnerOdds.sky_bet_history },
      { name: 'ladbrokes', history: runnerOdds.ladbrokes_history },
      { name: 'coral', history: runnerOdds.coral_history },
      { name: 'betfair', history: runnerOdds.betfair_history },
      { name: 'betfred', history: runnerOdds.betfred_history },
      { name: 'unibet', history: runnerOdds.unibet_history },
      { name: 'bet_uk', history: runnerOdds.bet_uk_history },
      { name: 'bet_victor', history: runnerOdds.bet_victor_history },
      { name: 'betway', history: runnerOdds.betway_history },
      { name: 'boyle_sports', history: runnerOdds.boyle_sports_history },
      { name: 'virgin_bet', history: runnerOdds.virgin_bet_history },
      { name: 'sporting_index', history: runnerOdds.sporting_index_history },
      { name: 'spreadex', history: runnerOdds.spreadex_history },
      { name: 'kwiff', history: runnerOdds.kwiff_history },
      { name: 'tote', history: runnerOdds.tote_history },
      { name: 'betmgm', history: runnerOdds.betmgm_history },
      { name: 'copybet', history: runnerOdds.copybet_history },
      { name: 'dragon_bet', history: runnerOdds.dragon_bet_history },
      { name: 'grosvenor_sports', history: runnerOdds.grosvenor_sports_history },
      { name: 'hollywood_bets', history: runnerOdds.hollywood_bets_history },
      { name: 'matchbook', history: runnerOdds.matchbook_history },
      { name: 'midnite', history: runnerOdds.midnite_history },
      { name: 'pricedup_bet', history: runnerOdds.pricedup_bet_history },
      { name: 'quinn_bet', history: runnerOdds.quinn_bet_history },
      { name: 'star_sports', history: runnerOdds.star_sports_history },
      { name: 'talksport_bet', history: runnerOdds.talksport_bet_history },
      { name: 'betfair_exchange', history: runnerOdds.betfair_exchange_history }
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
      ? { value: bestOdds.toFixed(2), bookmaker: bestBookmaker, decimal: bestOdds }
      : { value: '0.00', bookmaker: '', decimal: 0 };
  };





  // REMOVED: loadBasicData function - now using direct approach like racecards page

  // 2. Load/refresh odds data only
  const loadOddsData = async (races?: any[]) => {
    console.log('Loading/refreshing odds data...');
    
    try {
      const racesToUse = races || raceData;
      const allOdds: any[] = [];
      
      for (const race of racesToUse) {
        try {
          const raceOdds = await getRaceOdds(race.race_id);
          console.log(`Race ${race.course}: ${raceOdds.length} odds records`);
          allOdds.push(...raceOdds);
        } catch (raceError) {
          console.error(`Error loading odds for race ${race.race_id}:`, raceError);
        }
      }

      console.log(`Total odds loaded: ${allOdds.length}`);
      setOddsData(allOdds);
      
      // Process runners with new odds
      processRunnersWithOdds(runnerData, allOdds);

    } catch (err) {
      console.error('Error loading odds data:', err);
    }
  };

  // 3. Process runners with current odds and settings
  const processRunnersWithOdds = (runners: any[], odds: any[]) => {
    console.log(`Processing ${runners.length} runners with ${odds.length} odds records`);
    
    const processed = runners.map((runner) => {
      // Find odds for this runner
      const runnerOdds = odds.find(o => 
        o.horse_id === runner.horse_id || o.runner_id === runner.id
      );
      
      // Get live best odds
      const liveBestOdds = getLiveBestOdds(runnerOdds);
      
      // Extract bookmaker odds from history columns
      const bookmaker_odds: any = {};
      
      if (runnerOdds) {
        const bookmakerHistories = [
          { name: 'bet365', history: runnerOdds.bet365_history },
          { name: 'william_hill', history: runnerOdds.william_hill_history },
          { name: 'paddy_power', history: runnerOdds.paddy_power_history },
          { name: 'sky_bet', history: runnerOdds.sky_bet_history },
          { name: 'ladbrokes', history: runnerOdds.ladbrokes_history },
          { name: 'coral', history: runnerOdds.coral_history },
          { name: 'betfair', history: runnerOdds.betfair_history },
          { name: 'betfred', history: runnerOdds.betfred_history },
          { name: 'unibet', history: runnerOdds.unibet_history },
          { name: 'bet_uk', history: runnerOdds.bet_uk_history },
          { name: 'bet_victor', history: runnerOdds.bet_victor_history },
          { name: 'betway', history: runnerOdds.betway_history },
          { name: 'boyle_sports', history: runnerOdds.boyle_sports_history },
          { name: 'virgin_bet', history: runnerOdds.virgin_bet_history },
          { name: 'sporting_index', history: runnerOdds.sporting_index_history },
          { name: 'spreadex', history: runnerOdds.spreadex_history },
          { name: 'kwiff', history: runnerOdds.kwiff_history },
          { name: 'tote', history: runnerOdds.tote_history },
          { name: 'betmgm', history: runnerOdds.betmgm_history },
          { name: 'copybet', history: runnerOdds.copybet_history },
          { name: 'dragon_bet', history: runnerOdds.dragon_bet_history },
          { name: 'grosvenor_sports', history: runnerOdds.grosvenor_sports_history },
          { name: 'hollywood_bets', history: runnerOdds.hollywood_bets_history },
          { name: 'matchbook', history: runnerOdds.matchbook_history },
          { name: 'midnite', history: runnerOdds.midnite_history },
          { name: 'pricedup_bet', history: runnerOdds.pricedup_bet_history },
          { name: 'quinn_bet', history: runnerOdds.quinn_bet_history },
          { name: 'star_sports', history: runnerOdds.star_sports_history },
          { name: 'talksport_bet', history: runnerOdds.talksport_bet_history },
          { name: 'betfair_exchange', history: runnerOdds.betfair_exchange_history }
        ];

        bookmakerHistories.forEach(bookmaker => {
          const latestOdds = getLatestOddsFromHistory(bookmaker.history);
          bookmaker_odds[bookmaker.name] = latestOdds ? latestOdds.odds.toFixed(2) : '0.00';
        });
      }
      
      const processedRunner: ProcessedRunner = {
        id: String(runner.id),
        horse_name: runner.horse_name || 'Unknown Horse',
        horse_id: runner.horse_id || String(runner.id),
        number: runner.number || '',
        course: runner.course || 'Unknown',
        raceTime: runner.raceTime || 'TBC',
        jockey: runner.jockey || '',
        trainer: runner.trainer || '',
        weight: runner.weight_lbs || '',
        age: String(runner.age || ''),
        form: runner.form || '',
        odds_decimal: liveBestOdds.decimal,
        
        live_best_odds: liveBestOdds,
        bookmaker_odds,
        
        // Model fields from RUNNERS table
        average_odds: runner.average_odds ? 
          (getLatestOddsFromHistory(runner.average_odds)?.odds.toFixed(2) || '0.00') : '0.00',
        sharp_average_odds: getLiveSharpAverageOdds(runner) || '0.00',
        vig_odds: runner.vig_odds ? 
          (getLatestOddsFromHistory(runner.vig_odds)?.odds.toFixed(2) || '0.00') : '0.00',
        adj_win_model: runner.adj_win_model ? 
          (getLatestOddsFromHistory(runner.adj_win_model)?.odds.toFixed(2) || '0.00') : '0.00',
        '7.8_model': runner['7.8_model'] ? 
          (getLatestOddsFromHistory(runner['7.8_model'])?.odds.toFixed(2) || '0.00') : '0.00',
        price_change: parseLatestPriceChange(runner.price_change),
        
        // Real rating data from RUNNERS table
        timeform_rating: runner.ts ? parseInt(runner.ts) : null,
        official_rating: runner.ofr ? parseInt(runner.ofr) : null,
        speed_rating: runner.rpr ? parseInt(runner.rpr) : null,
        
        // Historical data from RUNNERS table
        runs_last_12_months: runner.trainer_12_months_runs || 0,
        wins_last_12_months: runner.trainer_12_months_wins || 0,
        win_rate_last_12_months: runner.trainer_12_months_percent ? parseFloat(runner.trainer_12_months_percent) : 0,
        profit_loss_last_12_months: runner.profit_loss_last_12_months || 0,
        
        course_wins: runner.course_wins || 0,
        course_runs: runner.course_runs || 0,
        distance_wins: runner.distance_wins || 0,
        distance_runs: runner.distance_runs || 0,
        
        jockey_win_rate: runner.jockey_12_months_percent ? parseFloat(runner.jockey_12_months_percent) : 0,
        trainer_win_rate: runner.trainer_12_months_percent ? parseFloat(runner.trainer_12_months_percent) : 0,
        jockey_trainer_combo: runner.jockey_trainer_combo_percent ? parseFloat(runner.jockey_trainer_combo_percent) : 0,
        
        market_position: parseInt(runner.number || '0'),
        forecast_position: runner.forecast_position || parseInt(runner.number || '0'),
        early_price: runnerOdds?.early_price || '0.00',
        price_movement: runnerOdds?.price_movement || '0.0%',
        
        closing_line_value: runnerOdds?.closing_line_value || 0,
        implied_probability: liveBestOdds.decimal > 0 ? (1 / liveBestOdds.decimal) * 100 : 0,
        value_rating: runnerOdds?.value_rating || 0,
        confidence_score: runnerOdds?.confidence_score || 0,
      };
      
      return processedRunner;
    });

    console.log(`Processed ${processed.length} runners`);
    setProcessedRunners(processed);
    setLastUpdated(new Date());
  };

  // Apply filters and sort
  const filteredRunners = useMemo(() => {
    console.log(`Filtering ${processedRunners.length} runners with filters:`, filters);
    let filtered = [...processedRunners];

    // Apply filters
    if (filters.minOdds && filters.minOdds !== '') {
      const minOdds = parseFloat(filters.minOdds);
      filtered = filtered.filter(r => r.odds_decimal >= minOdds);
      console.log(`After minOdds filter: ${filtered.length} runners`);
    }
    
    if (filters.maxOdds && filters.maxOdds !== '') {
      const maxOdds = parseFloat(filters.maxOdds);
      filtered = filtered.filter(r => r.odds_decimal <= maxOdds);
      console.log(`After maxOdds filter: ${filtered.length} runners`);
    }
    
    // EV Filters - only check actual betting opportunities (Best Odds and selected bookmakers)
    if (filters.minEV1 && filters.minEV1 !== '') {
      const minEV1 = parseFloat(filters.minEV1);
      filtered = filtered.filter(r => {
        // Check Best Odds for EV
        const bestOddsEv = calculateRunnerEV(r, evConfig, 'live_best_odds');
        if ((bestOddsEv.primary !== null) && (bestOddsEv.primary >= minEV1)) return true;
        
        // Check selected bookmaker columns for EV
        const bookmakerColumns = Array.from(visibleBookmakers);
        for (const bookmaker of bookmakerColumns) {
          const ev = calculateRunnerEV(r, evConfig, bookmaker, bookmaker);
          if ((ev.primary !== null) && (ev.primary >= minEV1)) return true;
        }
        
        return false;
      });
      console.log(`After minEV1 filter: ${filtered.length} runners`);
    }
    
    if (filters.minEV2 && filters.minEV2 !== '' && evConfig.hasSecondary) {
      const minEV2 = parseFloat(filters.minEV2);
      filtered = filtered.filter(r => {
        // Check Best Odds for secondary EV
        const bestOddsEv = calculateRunnerEV(r, evConfig, 'live_best_odds');
        if ((bestOddsEv.secondary !== null) && (bestOddsEv.secondary >= minEV2)) return true;
        
        // Check selected bookmaker columns for secondary EV
        const bookmakerColumns = Array.from(visibleBookmakers);
        for (const bookmaker of bookmakerColumns) {
          const ev = calculateRunnerEV(r, evConfig, bookmaker, bookmaker);
          if ((ev.secondary !== null) && (ev.secondary >= minEV2)) return true;
        }
        
        return false;
      });
    }
    
    // Price Change Filter
    if (filters.minPriceChange && filters.minPriceChange !== '') {
      const minPriceChange = parseFloat(filters.minPriceChange);
      filtered = filtered.filter(r => {
        const priceChange = parseFloat(r.price_change || '0');
        return priceChange >= minPriceChange;
      });
      console.log(`After price change filter: ${filtered.length} runners`);
    }

    console.log(`Final filtered runners: ${filtered.length}`);

    // Sort - FIXED TO SORT BY EV FOR ODDS COLUMNS
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      // For betting opportunities (Best Odds and bookmakers), sort by combined EV percentage
      if (sortField === 'live_best_odds') {
        const aEvResults = calculateRunnerEV(a, evConfig, sortField);
        const bEvResults = calculateRunnerEV(b, evConfig, sortField);
        // Add primary and secondary EV together for sorting
        const aPrimary = aEvResults.primary || 0;
        const bPrimary = bEvResults.primary || 0;
        const aSecondary = evConfig.hasSecondary ? (aEvResults.secondary || 0) : 0;
        const bSecondary = evConfig.hasSecondary ? (bEvResults.secondary || 0) : 0;
        aValue = aPrimary + aSecondary;
        bValue = bPrimary + bSecondary;
      } else if (Array.from(visibleBookmakers).includes(sortField)) {
        // For bookmaker columns, calculate combined EV based on that specific bookmaker
        const aEvResults = calculateRunnerEV(a, evConfig, sortField, sortField);
        const bEvResults = calculateRunnerEV(b, evConfig, sortField, sortField);
        // Add primary and secondary EV together for sorting
        const aPrimary = aEvResults.primary || 0;
        const bPrimary = bEvResults.primary || 0;
        const aSecondary = evConfig.hasSecondary ? (aEvResults.secondary || 0) : 0;
        const bSecondary = evConfig.hasSecondary ? (bEvResults.secondary || 0) : 0;
        aValue = aPrimary + aSecondary;
        bValue = bPrimary + bSecondary;
      } else if (sortField === 'sharp_average_odds' || sortField === 'vig_odds' || sortField === 'adj_win_model' || sortField === '7.8_model') {
        // For model odds columns, sort by the actual odds value (not EV)
        aValue = parseFloat(a[sortField as keyof ProcessedRunner] as string || '0');
        bValue = parseFloat(b[sortField as keyof ProcessedRunner] as string || '0');
      } else if (sortField === 'price_change') {
        // Price change: sort by numeric value (high to low by default)
        aValue = parseFloat(a.price_change || '0');
        bValue = parseFloat(b.price_change || '0');
      } else if (sortField === 'raceTime') {
        // Race time: sort by time (earliest first by default)
        aValue = a.raceTime || 'TBC';
        bValue = b.raceTime || 'TBC';
      } else if (sortField === 'horse_name' || sortField === 'course') {
        // Text columns: sort alphabetically
        aValue = a[sortField as keyof ProcessedRunner] || '';
        bValue = b[sortField as keyof ProcessedRunner] || '';
      } else {
        // For other columns, sort by actual values
        aValue = a[sortField as keyof ProcessedRunner];
        bValue = b[sortField as keyof ProcessedRunner];
      }

      // Handle null/undefined values
      if (aValue === null || aValue === undefined) aValue = sortDirection === 'asc' ? Number.MAX_VALUE : Number.MIN_VALUE;
      if (bValue === null || bValue === undefined) bValue = sortDirection === 'asc' ? Number.MAX_VALUE : Number.MIN_VALUE;

      // Convert to numbers if possible for proper numeric sorting
      if (typeof aValue === 'string' && !isNaN(Number(aValue))) aValue = Number(aValue);
      if (typeof bValue === 'string' && !isNaN(Number(bValue))) bValue = Number(bValue);

      // Handle string comparisons (for text columns)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      }

      // Numeric comparison
      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [processedRunners, filters, sortField, sortDirection, evConfig, visibleBookmakers]);

  // Save & Refresh function
  const handleSaveAndRefresh = async () => {
    setIsRefreshing(true);
    
    // Apply pending settings
    setEvConfig(pendingEvConfig);
    setFilters(pendingFilters);
    
    // Refresh data using the new racing data service
    console.log('PRO DASHBOARD: Refreshing data with new settings...');
    
    try {
      // Build query parameters for filters
      const params = new URLSearchParams({
        service: 'pro-dashboard',
        ...(pendingFilters.minOdds && { minOdds: pendingFilters.minOdds }),
        ...(pendingFilters.maxOdds && { maxOdds: pendingFilters.maxOdds }),
        ...(pendingFilters.minEV1 && { minEV1: pendingFilters.minEV1 }),
        ...(pendingFilters.minEV2 && { minEV2: pendingFilters.minEV2 }),
        ...(pendingFilters.minPriceChange && { minPriceChange: pendingFilters.minPriceChange })
      });

      // Call the new racing data service
      const response = await fetch(`/api/racing-data-service?${params}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`PRO DASHBOARD: Racing data service returned ${data.races?.length || 0} races, ${data.runners?.length || 0} runners`);
      
      if (!data.races || data.races.length === 0) {
        console.log('PRO DASHBOARD: No races found');
        setProcessedRunners([]);
        return;
      }
      
      // Process races and runners from API response
      const allRunners: any[] = [];
      
      for (const race of data.races) {
        console.log(`PRO DASHBOARD: Processing race ${race.race_id} (${race.course})`);
        
        // Get runners for this race
        const raceRunners = data.runners.filter((runner: any) => runner.race_id === race.race_id);
        console.log(`PRO DASHBOARD: Race ${race.course}: ${raceRunners.length} runners`);
        
        // Add race info to runners
        const enrichedRunners = raceRunners.map((runner: any) => ({
          ...runner,
          course: race.course,
          raceTime: race.off_time, // Use race.off_time
          race_id: race.race_id
        }));
        
        allRunners.push(...enrichedRunners);
      }
      
      console.log(`PRO DASHBOARD: Total runners before filtering: ${allRunners.length}`);
      
      // Filter out non-runners, replacement horses, and past races
      const validRunners = allRunners.filter(runner => {
        // Remove non-runners and replacement horses
        if (runner.number === 'NR' || runner.number === null || runner.number === undefined || runner.number === '' || runner.number.includes('R')) {
          return false;
        }
      
        // Remove past races - FIXED TIME FILTERING (all times are PM)
        if (runner.raceTime && runner.raceTime !== 'TBC') {
          try {
            const currentTime = new Date();
            const [hours, minutes] = runner.raceTime.split(':').map(Number);
            
            // Create race time for today - ALL RACES ARE PM (12-hour format)
            const raceDateTime = new Date();
            raceDateTime.setHours(hours + 12, minutes, 0, 0); // Add 12 hours for PM
            
            // Add a 10-minute buffer for races that just started
            const raceTimeWithBuffer = new Date(raceDateTime.getTime() + (10 * 60 * 1000));
            
            if (raceTimeWithBuffer <= currentTime) {
              return false;
            }
          } catch (timeError) {
            // Keep runner if we can't parse time
          }
        }
        
        return true;
      });
      
      console.log(`PRO DASHBOARD: Valid runners after filtering: ${validRunners.length}`);
      
      // Use odds data from API response
      const oddsData = data.odds || [];
      console.log(`PRO DASHBOARD: Got ${oddsData.length} odds records from API`);
      
      // Create processed runners with real odds data
      const processedRunners = validRunners.map(runner => {
        // Find odds for this runner
        const runnerOdds = oddsData.find(o => 
          o.horse_id === runner.horse_id || o.runner_id === runner.id
        );
        
        // Get live best odds using the proper function
        const liveBestOdds = getLiveBestOdds(runnerOdds);
        
        // Extract bookmaker odds from history columns
        const bookmaker_odds: any = {};
        
        if (runnerOdds) {
          const bookmakerHistories = [
            { name: 'bet365', history: runnerOdds.bet365_history },
            { name: 'william_hill', history: runnerOdds.william_hill_history },
            { name: 'paddy_power', history: runnerOdds.paddy_power_history },
            { name: 'sky_bet', history: runnerOdds.sky_bet_history },
            { name: 'ladbrokes', history: runnerOdds.ladbrokes_history },
            { name: 'coral', history: runnerOdds.coral_history },
            { name: 'betfair', history: runnerOdds.betfair_history },
            { name: 'betfred', history: runnerOdds.betfred_history },
            { name: 'unibet', history: runnerOdds.unibet_history },
            { name: 'bet_uk', history: runnerOdds.bet_uk_history },
            { name: 'bet_victor', history: runnerOdds.bet_victor_history },
            { name: 'betway', history: runnerOdds.betway_history },
            { name: 'boyle_sports', history: runnerOdds.boyle_sports_history },
            { name: 'virgin_bet', history: runnerOdds.virgin_bet_history },
            { name: 'sporting_index', history: runnerOdds.sporting_index_history },
            { name: 'spreadex', history: runnerOdds.spreadex_history },
            { name: 'kwiff', history: runnerOdds.kwiff_history },
            { name: 'tote', history: runnerOdds.tote_history },
            { name: 'betmgm', history: runnerOdds.betmgm_history },
            { name: 'copybet', history: runnerOdds.copybet_history },
            { name: 'dragon_bet', history: runnerOdds.dragon_bet_history },
            { name: 'grosvenor_sports', history: runnerOdds.grosvenor_sports_history },
            { name: 'hollywood_bets', history: runnerOdds.hollywood_bets_history },
            { name: 'matchbook', history: runnerOdds.matchbook_history },
            { name: 'midnite', history: runnerOdds.midnite_history },
            { name: 'pricedup_bet', history: runnerOdds.pricedup_bet_history },
            { name: 'quinn_bet', history: runnerOdds.quinn_bet_history },
            { name: 'star_sports', history: runnerOdds.star_sports_history },
            { name: 'talksport_bet', history: runnerOdds.talksport_bet_history },
            { name: 'betfair_exchange', history: runnerOdds.betfair_exchange_history }
          ];

          bookmakerHistories.forEach(bookmaker => {
            const latestOdds = getLatestOddsFromHistory(bookmaker.history);
            bookmaker_odds[bookmaker.name] = latestOdds ? latestOdds.odds.toFixed(2) : '0.00';
          });
        }
        
        return {
          id: String(runner.id),
          horse_name: runner.horse_name || 'Unknown Horse',
          horse_id: runner.horse_id || String(runner.id),
          number: runner.number || '',
          course: runner.course || 'Unknown',
          raceTime: runner.raceTime || 'TBC',
          jockey: runner.jockey || '',
          trainer: runner.trainer || '',
          weight: runner.weight_lbs || '',
          age: String(runner.age || ''),
          form: runner.form || '',
          odds_decimal: liveBestOdds.decimal,
          
          live_best_odds: liveBestOdds,
          bookmaker_odds,
          
          // Model fields from RUNNERS table (using proper parsing)
          average_odds: runner.average_odds ? 
            (getLatestOddsFromHistory(runner.average_odds)?.odds.toFixed(2) || '0.00') : '0.00',
          sharp_average_odds: getLiveSharpAverageOdds(runner) || '0.00',
          vig_odds: runner.vig_odds ? 
            (getLatestOddsFromHistory(runner.vig_odds)?.odds.toFixed(2) || '0.00') : '0.00',
          adj_win_model: runner.adj_win_model || '0.00', // Simple decimal odds
          '7.8_model': runner['7.8_bsp'] || '0.00', // Simple decimal odds (correct column name)
          price_change: parseLatestPriceChange(runner.price_change),
          
          // Real rating data from RUNNERS table
          timeform_rating: runner.ts ? parseInt(runner.ts) : null,
          official_rating: runner.ofr ? parseInt(runner.ofr) : null,
          speed_rating: runner.rpr ? parseInt(runner.rpr) : null,
          
          // Historical data from RUNNERS table
          runs_last_12_months: runner.trainer_12_months_runs || 0,
          wins_last_12_months: runner.trainer_12_months_wins || 0,
          win_rate_last_12_months: runner.trainer_12_months_percent ? parseFloat(runner.trainer_12_months_percent) : 0,
          profit_loss_last_12_months: runner.profit_loss_last_12_months || 0,
          
          course_wins: runner.course_wins || 0,
          course_runs: runner.course_runs || 0,
          distance_wins: runner.distance_wins || 0,
          distance_runs: runner.distance_runs || 0,
          
          jockey_win_rate: runner.jockey_12_months_percent ? parseFloat(runner.jockey_12_months_percent) : 0,
          trainer_win_rate: runner.trainer_12_months_percent ? parseFloat(runner.trainer_12_months_percent) : 0,
          jockey_trainer_combo: runner.jockey_trainer_combo_percent ? parseFloat(runner.jockey_trainer_combo_percent) : 0,
          
          market_position: parseInt(runner.number || '0'),
          forecast_position: runner.forecast_position || parseInt(runner.number || '0'),
          early_price: runnerOdds?.early_price || '0.00',
          price_movement: runnerOdds?.price_movement || '0.0%',
          
          closing_line_value: runnerOdds?.closing_line_value || 0,
          implied_probability: liveBestOdds.decimal > 0 ? (1 / liveBestOdds.decimal) * 100 : 0,
          value_rating: runnerOdds?.value_rating || 0,
          confidence_score: runnerOdds?.confidence_score || 0,
        };
      });
      
      console.log(`PRO DASHBOARD: Setting ${processedRunners.length} processed runners`);
      setProcessedRunners(processedRunners);
      setLastUpdated(new Date());
      
    } catch (err) {
      console.error('PRO DASHBOARD: Error in refresh:', err);
      setError('Failed to refresh data: ' + (err as Error).message);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Toggle bookmaker function
  const toggleBookmaker = async (bookmaker: string) => {
    const newVisible = new Set(visibleBookmakers);
    if (newVisible.has(bookmaker)) {
      newVisible.delete(bookmaker);
    } else {
      newVisible.add(bookmaker);
    }
    setVisibleBookmakers(newVisible);
    
    // No need to refresh data when toggling bookmakers - just update the display
    // The data is already loaded, we just need to show/hide columns
    console.log(`PRO DASHBOARD: Toggled bookmaker ${bookmaker}, visible bookmakers:`, Array.from(newVisible));
  };

  // Initialize pending settings with current settings
  useEffect(() => {
    setPendingEvConfig(evConfig);
    setPendingFilters(filters);
  }, [evConfig, filters]);

  // Load data on mount - COPY EXACT APPROACH FROM WORKING RACECARDS PAGE
  useEffect(() => {
    console.log('🔥 PRO DASHBOARD: Starting data load (copying racecards approach)...');
    console.log('🔥 PRO DASHBOARD: Component mounted, isClient:', typeof window !== 'undefined');
    
    // Debug environment variables on client side
    console.log('🔥 PRO DASHBOARD: Environment variables check:', {
      SUPABASE_URL: process.env.SUPABASE_URL ? '✅ Set' : '❌ Missing',
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing',
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing',
    });
    
    const fetchData = async () => {
      try {
        console.log('🔥 PRO DASHBOARD: fetchData function started');
        setIsLoading(true);
        setError(null);
        
        // Get UK date info for debugging
        const dateInfo = getCurrentUKDateInfo();
        console.log('PRO DASHBOARD: UK Date Info:', dateInfo);
        
        // Use the new racing data service
        console.log('PRO DASHBOARD: Calling racing data service...');
        const response = await fetch('/api/racing-data-service?service=pro-dashboard');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        
        const data = await response.json();
        console.log(`PRO DASHBOARD: API returned ${data.races?.length || 0} races, ${data.runners?.length || 0} runners`);
        
        if (!data.races || data.races.length === 0) {
          console.log('PRO DASHBOARD: No races found');
          setProcessedRunners([]);
          return;
        }
        
        // Process races and runners from API response
        const allRunners: any[] = [];
        
        for (const race of data.races) {
          console.log(`PRO DASHBOARD: Processing race ${race.race_id} (${race.course})`);
          
          // Get runners for this race
          const raceRunners = data.runners.filter((runner: any) => runner.race_id === race.race_id);
          console.log(`PRO DASHBOARD: Race ${race.course}: ${raceRunners.length} runners`);
          
          // Add race info to runners
          const enrichedRunners = raceRunners.map((runner: any) => ({
            ...runner,
            course: race.course,
            raceTime: race.off_time, // Use race.off_time
            race_id: race.race_id
          }));
          
          allRunners.push(...enrichedRunners);
        }
        
        console.log(`PRO DASHBOARD: Total runners before filtering: ${allRunners.length}`);
        
        // Filter out non-runners, replacement horses, and past races
        const validRunners = allRunners.filter(runner => {
          // Remove non-runners and replacement horses
          if (runner.number === 'NR' || runner.number === null || runner.number === undefined || runner.number === '' || runner.number.includes('R')) {
            console.log(`PRO DASHBOARD: Filtering out NR/replacement horse: ${runner.horse_name} (number: ${runner.number})`);
            return false;
          }
          
          // Remove past races - FIXED TIME FILTERING (all times are PM)
          if (runner.raceTime && runner.raceTime !== 'TBC') {
            try {
              const currentTime = new Date();
              const [hours, minutes] = runner.raceTime.split(':').map(Number);
              
              // Create race time for today - ALL RACES ARE PM (12-hour format)
              const raceDateTime = new Date();
              raceDateTime.setHours(hours + 12, minutes, 0, 0); // Add 12 hours for PM
              
              // Add a 10-minute buffer for races that just started
              const raceTimeWithBuffer = new Date(raceDateTime.getTime() + (10 * 60 * 1000));
              
              console.log(`PRO DASHBOARD: Race ${runner.horse_name} at ${runner.raceTime} = ${raceDateTime.getHours()}:${String(raceDateTime.getMinutes()).padStart(2, '0')} (current: ${currentTime.getHours()}:${String(currentTime.getMinutes()).padStart(2, '0')})`);
              
              if (raceTimeWithBuffer <= currentTime) {
                console.log(`PRO DASHBOARD: Filtering out past race: ${runner.horse_name} at ${runner.raceTime} (current: ${currentTime.getHours()}:${String(currentTime.getMinutes()).padStart(2, '0')})`);
                return false;
              }
            } catch (timeError) {
              console.warn(`PRO DASHBOARD: Error parsing race time for ${runner.horse_name}: ${runner.raceTime}`, timeError);
              // Keep runner if we can't parse time
            }
          }
          
          return true;
        });
        
        console.log(`PRO DASHBOARD: Valid runners after filtering: ${validRunners.length}`);
        
        // Use odds data from API response
        const oddsData = data.odds || [];
        console.log(`PRO DASHBOARD: Got ${oddsData.length} odds records from API`);
        
        // Create processed runners with real odds data
        const processedRunners = validRunners.map(runner => {
          // Find odds for this runner
          const runnerOdds = oddsData.find(o => 
            o.horse_id === runner.horse_id || o.runner_id === runner.id
          );
          
          // Get live best odds using the proper function
          const liveBestOdds = getLiveBestOdds(runnerOdds);
          
          // Extract bookmaker odds from history columns
          const bookmaker_odds: any = {};
          const bookmakers = [
            'bet365', 'william_hill', 'paddy_power', 'sky_bet', 'ladbrokes', 'coral', 
            'betfair', 'betfred', 'unibet', 'bet_uk', 'bet_victor', 'betway', 
            'boyle_sports', 'virgin_bet', 'sporting_index', 'spreadex', 'kwiff', 'tote', 
            'betmgm', 'copybet', 'dragon_bet', 'grosvenor_sports', 'hollywood_bets', 
            'matchbook', 'midnite', 'pricedup_bet', 'quinn_bet', 'star_sports', 
            'talksport_bet', 'betfair_exchange'
          ];
          
          bookmakers.forEach(bookmaker => {
            const historyKey = `${bookmaker}_history`;
            const latestOdds = getLatestOddsFromHistory(runnerOdds?.[historyKey]);
            bookmaker_odds[bookmaker] = latestOdds ? latestOdds.odds.toFixed(2) : '0.00';
          });
          
          return {
            id: runner.id,
            horse_name: runner.horse_name,
            horse_id: runner.horse_id,
            number: runner.number,
            course: runner.course,
            raceTime: runner.raceTime,
            jockey: runner.jockey,
            trainer: runner.trainer,
            weight: runner.weight_lbs,
            age: runner.age,
            form: runner.form,
            odds_decimal: liveBestOdds.decimal,
            
            // Live best odds calculation
            live_best_odds: liveBestOdds,
            
            // Comprehensive bookmaker odds
            bookmaker_odds,
            
            // Average and calculated odds
            average_odds: runnerOdds?.average_odds || '0.00',
            sharp_average_odds: runnerOdds?.sharp_average_odds || '0.00',
            vig_odds: runnerOdds?.vig_odds || '0.00',
            adj_win_model: runnerOdds?.adj_win_model || '0.00',
            '7.8_model': runnerOdds?.['7.8_model'] || '0.00',
            price_change: runnerOdds?.price_change || '0.0%',
            
            // Rating and analysis data
            timeform_rating: runner.timeform?.rating || null,
            official_rating: runner.ofr ? parseInt(runner.ofr) : null,
            speed_rating: runner.ts ? parseInt(runner.ts) : null,
            
            // Historical performance
            runs_last_12_months: runner.runs_last_12_months || 0,
            wins_last_12_months: runner.wins_last_12_months || 0,
            win_rate_last_12_months: runner.win_rate_last_12_months || 0,
            profit_loss_last_12_months: runner.profit_loss_last_12_months || 0,
            
            // Course and distance performance
            course_wins: runner.course_wins || 0,
            course_runs: runner.course_runs || 0,
            distance_wins: runner.distance_wins || 0,
            distance_runs: runner.distance_runs || 0,
            
            jockey_win_rate: runner.jockey_12_months_percent ? parseFloat(runner.jockey_12_months_percent) : 0,
            trainer_win_rate: runner.trainer_12_months_percent ? parseFloat(runner.trainer_12_months_percent) : 0,
            jockey_trainer_combo: runner.jockey_trainer_combo_percent ? parseFloat(runner.jockey_trainer_combo_percent) : 0,
            
            market_position: parseInt(runner.number || '0'),
            forecast_position: runner.forecast_position || parseInt(runner.number || '0'),
            early_price: runnerOdds?.early_price || '0.00',
            price_movement: runnerOdds?.price_movement || '0.0%',
            
            closing_line_value: runnerOdds?.closing_line_value || 0,
            implied_probability: liveBestOdds.decimal > 0 ? (1 / liveBestOdds.decimal) * 100 : 0,
            value_rating: runnerOdds?.value_rating || 0,
            confidence_score: runnerOdds?.confidence_score || 0,
          };
        });
        
        console.log(`PRO DASHBOARD: Setting ${processedRunners.length} processed runners`);
        setProcessedRunners(processedRunners);
        setLastUpdated(new Date());
        
      } catch (err) {
        console.error('PRO DASHBOARD: Error in fetchData:', err);
        setError('Failed to load data: ' + (err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
    
    // Set up 30-second refresh interval
    const interval = setInterval(() => {
      console.log('PRO DASHBOARD: Auto-refreshing data...');
      fetchData();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };



  const formatBookmakerName = (bookmaker: string): string => {
    const names: { [key: string]: string } = {
      'bet365': 'Bet365',
      'william_hill': 'William Hill',
      'paddy_power': 'Paddy Power',
      'sky_bet': 'SkyBet',
      'betfair_exchange': 'Betfair Ex'
    };
    return names[bookmaker] || bookmaker.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const renderOddsCell = (runner: ProcessedRunner, field: string, bookmaker?: string) => {
    let value: string | number = '';
    
    if (field === 'live_best_odds') {
      value = runner.live_best_odds.value;
    } else if (field === 'sharp_average_odds') {
      value = runner.sharp_average_odds;
    } else if (field === 'vig_odds') {
      value = runner.vig_odds;
    } else if (field === 'adj_win_model') {
      value = runner.adj_win_model;
    } else if (field === '7.8_model') {
      value = runner['7.8_model'];
    } else if (bookmaker) {
      value = runner.bookmaker_odds[bookmaker];
    }

    // Only calculate EV for actual betting opportunities (Best Odds and selected bookmakers)
    // Model odds (sharp_average_odds, vig_odds, adj_win_model, 7.8_model) are just predictions, not bettable
    let primaryEV: number | null = null;
    let secondaryEV: number | null = null;
    
    if (field === 'live_best_odds' || bookmaker) {
      // Calculate EV for Best Odds and bookmakers against the configured true odds method
      const evResults = calculateRunnerEV(runner, evConfig, field, bookmaker);
      primaryEV = evResults.primary;
      secondaryEV = evResults.secondary;
    }

    const getEvClass = (ev: number | null) => {
      if (ev === null || ev === 0) return '';
      return ev > 5 ? 'bg-green-100 text-green-800' :
             ev > 0 ? 'bg-green-50 text-green-700' :
             ev < -5 ? 'bg-red-100 text-red-800' :
             'bg-red-50 text-red-700';
    };

    return (
      <div className={`p-2 rounded ${getEvClass(primaryEV)}`}>
        <div className="font-medium">{value}</div>
        <div className="text-xs font-semibold">
          {primaryEV !== null && primaryEV !== 0 && (
            <span>{primaryEV > 0 ? '+' : ''}{primaryEV.toFixed(1)}%</span>
          )}
          {primaryEV === 0 && <span>0.0%</span>}
          {secondaryEV !== null && evConfig.hasSecondary && (
            <span className="ml-1">
              {secondaryEV === 0 ? '& 0.0%' : `& ${secondaryEV > 0 ? '+' : ''}${secondaryEV.toFixed(1)}%`}
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <Layout>
      <PageProtection
        requiredAuth={true}
        minimumTier={MembershipTier.Pro}
        redirectTo="/membership"
        notificationMessage="You need a Pro, Elite or VIP membership to access the Pro Dashboard"
      >
        <div className="min-h-screen bg-slate-900 text-white p-6">
        <div className="max-w-full mx-auto">
          
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl font-bold text-white">Pro Dashboard</h1>
            <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded"
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </button>

              <button
                onClick={handleSaveAndRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-4 py-2 rounded"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Refreshing...' : 'Refresh'}
              </button>
              </div>
            </div>
              
              {lastUpdated && (
                <span className="text-sm text-gray-400">
                Last updated: {lastUpdated.toLocaleTimeString()} | Showing {filteredRunners.length} of {processedRunners.length} runners
                </span>
            )}
          </div>

          {/* Settings Panel */}
          {showSettings && (
            <div className="mb-6 p-4 bg-slate-800 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Dashboard Settings</h3>
              
              {/* Bookmaker Selection */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-2">Bookmakers</h4>
                <div className="flex flex-wrap gap-2">
                  {ALL_BOOKMAKERS.slice(0, 15).map(bookmaker => (
                    <button
                      key={bookmaker}
                      onClick={() => toggleBookmaker(bookmaker)}
                      className={`px-3 py-1 rounded text-sm ${
                        visibleBookmakers.has(bookmaker)
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-gray-300 hover:bg-slate-600'
                      }`}
                    >
                      {formatBookmakerName(bookmaker)}
                    </button>
                  ))}
                </div>
              </div>

              {/* EV Configuration */}
              <div className="mb-6">
                <h4 className="text-sm font-medium mb-2">EV Configuration</h4>
                <div className="grid grid-cols-4 gap-4 mb-4">
                                    <div>
                    <label className="block text-xs text-gray-400 mb-1">Primary EV Method</label>
                    <select
                      value={pendingEvConfig.primaryMethod}
                      onChange={(e) => setPendingEvConfig(prev => ({ ...prev, primaryMethod: e.target.value as any }))}
                      className="w-full p-2 bg-slate-700 text-white rounded"
                    >
                      <option value="sharp_average_odds">Sharp Odds</option>
                      <option value="vig_odds">No-Vig Odds</option>
                      <option value="adj_win_model">Win Model</option>
                      <option value="7.8_model">Predicted Odds</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Secondary EV Method</label>
                    <select
                      value={pendingEvConfig.secondaryMethod || ''}
                      onChange={(e) => setPendingEvConfig(prev => ({ 
                        ...prev, 
                        secondaryMethod: e.target.value ? e.target.value as any : undefined,
                        hasSecondary: !!e.target.value
                      }))}
                      className="w-full p-2 bg-slate-700 text-white rounded"
                    >
                      <option value="">None</option>
                      <option value="sharp_average_odds">Sharp Odds</option>
                      <option value="vig_odds">No-Vig Odds</option>
                      <option value="adj_win_model">Win Model</option>
                      <option value="7.8_model">Predicted Odds</option>
                    </select>
                  </div>
                  {!pendingEvConfig.hasSecondary && (
                    <div>
                      <button
                        onClick={() => setPendingEvConfig(prev => ({ ...prev, hasSecondary: true, secondaryMethod: 'adj_win_model' }))}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm"
                      >
                        Add Second EV Criteria
                      </button>
                    </div>
              )}
            </div>
          </div>

              {/* Filters */}
              <div>
                <h4 className="text-sm font-medium mb-2">Filters</h4>
                <div className="grid grid-cols-5 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Min Odds</label>
                    <input
                      type="number"
                      value={pendingFilters.minOdds}
                      onChange={(e) => setPendingFilters(prev => ({ ...prev, minOdds: e.target.value }))}
                      className="w-full p-2 bg-slate-700 text-white rounded"
                      step="0.1"
                      placeholder="e.g. 1.5"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Max Odds</label>
                    <input
                      type="number"
                      value={pendingFilters.maxOdds}
                      onChange={(e) => setPendingFilters(prev => ({ ...prev, maxOdds: e.target.value }))}
                      className="w-full p-2 bg-slate-700 text-white rounded"
                      step="0.1"
                      placeholder="e.g. 10.0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      {pendingEvConfig.hasSecondary ? 'Min EV 1 (%)' : 'Min EV (%)'}
                    </label>
                    <input
                      type="number"
                      value={pendingFilters.minEV1}
                      onChange={(e) => setPendingFilters(prev => ({ ...prev, minEV1: e.target.value }))}
                      className="w-full p-2 bg-slate-700 text-white rounded"
                      step="0.1"
                      placeholder="e.g. 2"
                    />
                  </div>
                  {pendingEvConfig.hasSecondary && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">Min EV 2 (%)</label>
                      <input
                        type="number"
                        value={pendingFilters.minEV2}
                        onChange={(e) => setPendingFilters(prev => ({ ...prev, minEV2: e.target.value }))}
                        className="w-full p-2 bg-slate-700 text-white rounded"
                        step="0.1"
                        placeholder="e.g. 2"
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Min Price Change (%)</label>
                    <input
                      type="number"
                      value={pendingFilters.minPriceChange}
                      onChange={(e) => setPendingFilters(prev => ({ ...prev, minPriceChange: e.target.value }))}
                      className="w-full p-2 bg-slate-700 text-white rounded"
                      step="0.1"
                      placeholder="-10"
                    />
                  </div>
                </div>
              </div>
              
              {/* Save & Refresh Button */}
              <div className="flex justify-end pt-4 border-t border-slate-700">
                <button
                  onClick={handleSaveAndRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white px-6 py-2 rounded font-medium"
                >
                  <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  {isRefreshing ? 'Refreshing...' : 'Save & Refresh Table'}
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 p-4 bg-red-900/50 border border-red-600 rounded text-red-200">
              {error}
              </div>
          )}

          {/* Loading */}
          {(isLoading || isRefreshing) && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-400">
                {isRefreshing ? 'Refreshing data with new settings...' : 'Loading comprehensive race data...'}
              </p>
              </div>
          )}

          {/* Main Data Table */}
          {!isLoading && !isRefreshing && filteredRunners.length > 0 && (
            <div className="bg-slate-800 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                  <thead>
                    <tr className="bg-slate-700 border-b border-slate-600">
                      {/* Default columns as specified */}
                      <th className="text-left p-3 font-semibold sticky left-0 bg-slate-700">Horse</th>
                      <th className="text-left p-3 font-semibold">Track</th>
                      <th className="text-left p-3 font-semibold">Time</th>
                      
                      {/* Best Odds with EV */}
                      <th 
                        className="text-left p-3 font-semibold cursor-pointer hover:bg-slate-600"
                        onClick={() => handleSort('live_best_odds')}
                      >
                        <div className="flex items-center gap-1">
                          Best Odds
                          {sortField === 'live_best_odds' && (
                            sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      
                      {/* Sharp Odds */}
                      <th 
                        className="text-left p-3 font-semibold cursor-pointer hover:bg-slate-600"
                        onClick={() => handleSort('sharp_average_odds')}
                      >
                        <div className="flex items-center gap-1">
                          Sharp Odds
                          {sortField === 'sharp_average_odds' && (
                            sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      
                      {/* Win Model Odds */}
                      <th 
                        className="text-left p-3 font-semibold cursor-pointer hover:bg-slate-600"
                        onClick={() => handleSort('adj_win_model')}
                      >
                        <div className="flex items-center gap-1">
                          Win Model
                          {sortField === 'adj_win_model' && (
                            sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      
                      {/* Predicted Odds */}
                      <th 
                        className="text-left p-3 font-semibold cursor-pointer hover:bg-slate-600"
                        onClick={() => handleSort('7.8_model')}
                      >
                        <div className="flex items-center gap-1">
                          Predicted Odds
                          {sortField === '7.8_model' && (
                            sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                      
                      {/* Price Change */}
                      <th 
                        className="text-left p-3 font-semibold cursor-pointer hover:bg-slate-600"
                        onClick={() => handleSort('price_change')}
                      >
                        <div className="flex items-center gap-1">
                          Price Change
                          {sortField === 'price_change' && (
                            sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </th>

                      {/* Dynamic bookmaker columns */}
                      {Array.from(visibleBookmakers).map(bookmaker => (
                        <th 
                          key={bookmaker}
                          className="text-left p-3 font-semibold cursor-pointer hover:bg-slate-600"
                          onClick={() => handleSort(bookmaker)}
                        >
                          <div className="flex items-center gap-1">
                            {formatBookmakerName(bookmaker)}
                            {sortField === bookmaker && (
                              sortDirection === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                            )}
                          </div>
                        </th>
                      ))}
                  </tr>
                </thead>
                <tbody>
                    {filteredRunners.map((runner, index) => (
                      <tr key={runner.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                        {/* Default columns as specified */}
                        <td className="p-3 font-medium sticky left-0 bg-slate-800">{runner.horse_name}</td>
                        <td className="p-3 text-sm">{runner.course}</td>
                        <td className="p-3 text-sm">{runner.raceTime}</td>
                        
                        {/* Best odds with bookmaker name in brackets */}
                        <td className="p-3 text-sm">
                          {renderOddsCell(runner, 'live_best_odds')}
                          <div className="text-xs text-gray-400 mt-1">
                            ({formatBookmakerName(runner.live_best_odds.bookmaker)})
                          </div>
                        </td>
                        
                        {/* Sharp Odds */}
                        <td className="p-3 text-sm">
                          {renderOddsCell(runner, 'sharp_average_odds')}
                        </td>
                        
                        {/* Win Model Odds */}
                        <td className="p-3 text-sm">
                          {renderOddsCell(runner, 'adj_win_model')}
                        </td>
                        
                        {/* Predicted Odds */}
                        <td className="p-3 text-sm">
                          {renderOddsCell(runner, '7.8_model')}
                        </td>
                        
                        {/* Price Change */}
                        <td className="p-3 text-sm">
                          <div className={`font-medium ${
                            parseFloat(runner.price_change) > 0 ? 'text-green-400' : 
                            parseFloat(runner.price_change) < 0 ? 'text-red-400' : 'text-gray-400'
                          }`}>
                            {parseFloat(runner.price_change) > 0 ? '+' : ''}{runner.price_change}%
                          </div>
                        </td>

                        {/* Dynamic bookmaker columns */}
                        {Array.from(visibleBookmakers).map(bookmaker => (
                          <td key={bookmaker} className="p-3 text-sm">
                            {renderOddsCell(runner, bookmaker, bookmaker)}
                          </td>
                        ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}

          {/* No Data */}
          {!isLoading && !isRefreshing && filteredRunners.length === 0 && !error && (
            <div className="text-center py-12">
              <p className="text-gray-400">No runners found matching current filters</p>
          </div>
          )}

        </div>
      </div>
      </PageProtection>
    </Layout>
  );
} 