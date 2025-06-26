'use client';

import { useState } from 'react';
import Link from "next/link";
import { ArrowLeft, Search, Loader2, User, Trophy, Zap } from "lucide-react";
import Layout from "@/components/layout/Layout";

type SearchType = 'horse' | 'jockey' | 'trainer' | 'owner' | 'sire' | 'dam' | 'damsire';

interface SearchResult {
  id: string;
  name: string;
  type: SearchType;
  data?: any;
}

export default function HorseRacingData() {
  const [selectedType, setSelectedType] = useState<SearchType>('horse');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null);
  const [detailedData, setDetailedData] = useState<any>(null);

  const searchTypes = [
    { value: 'horse', label: 'Horse', icon: Zap },
    { value: 'jockey', label: 'Jockey', icon: User },
    { value: 'trainer', label: 'Trainer', icon: Trophy },
    { value: 'owner', label: 'Owner', icon: User },
    { value: 'sire', label: 'Sire', icon: Zap },
    { value: 'dam', label: 'Dam', icon: Zap },
    { value: 'damsire', label: 'Damsire', icon: Zap },
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    setSearchResults([]);
    setSelectedResult(null);
    setDetailedData(null);

    try {
      // Step 1: Search for the entity
      console.log(`Searching for ${selectedType}: ${searchQuery}`);
      
      if (selectedType === 'horse') {
        await searchHorse();
      } else if (selectedType === 'jockey') {
        await searchJockey();
      } else if (selectedType === 'trainer') {
        await searchTrainer();
      } else if (selectedType === 'owner') {
        await searchOwner();
      } else if (selectedType === 'dam') {
        await searchDam();
      } else if (selectedType === 'sire') {
        await searchSire();
      } else if (selectedType === 'damsire') {
        await searchDamsire();
      } else {
        console.log(`Search for ${selectedType} not yet implemented`);
        setSearchResults([]);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const searchHorse = async () => {
    try {
      // First try to find the horse in our Supabase database
      console.log(`Searching Supabase for horse: ${searchQuery}`);
      
      // Search our database first for existing horses
      const supabaseResponse = await fetch('/api/racing/horses/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: searchQuery }),
      });
      
      let supabaseResults = [];
      if (supabaseResponse.ok) {
        const supabaseData = await supabaseResponse.json();
        supabaseResults = supabaseData.horses || [];
      }
      
      // Also search via Racing API to get comprehensive results
      const apiResponse = await fetch(`/api/racing?endpoint=/horses/search?name=${encodeURIComponent(searchQuery)}`);
      const apiData = await apiResponse.json();
      
      let combinedResults = [];
      
      // If we found results in Supabase, prioritize those
      if (supabaseResults.length > 0) {
        combinedResults = supabaseResults.map((horse: any) => ({
          id: horse.horse_id,
          name: horse.horse_name,
          type: 'horse' as SearchType,
          data: {
            ...horse,
            source: 'supabase'
          }
        }));
      }
      
      // Add API results (avoid duplicates)
      if (apiData.search_results && apiData.search_results.length > 0) {
        const apiResults = apiData.search_results.map((horse: any) => ({
          id: horse.id,
          name: horse.name,
          type: 'horse' as SearchType,
          data: {
            ...horse,
            source: 'api'
          }
        }));
        
                 // Merge results, avoiding duplicates by ID
         const existingIds = new Set(combinedResults.map((r: SearchResult) => r.id));
         const newApiResults = apiResults.filter((r: SearchResult) => !existingIds.has(r.id));
        combinedResults = [...combinedResults, ...newApiResults];
      }
      
      setSearchResults(combinedResults);
      
    } catch (error) {
      console.error('Horse search error:', error);
      setSearchResults([]);
    }
  };

  const searchJockey = async () => {
    try {
      await searchEntity('jockey', 'jockeys');
    } catch (error) {
      console.error('Jockey search error:', error);
      setSearchResults([]);
    }
  };

  const searchTrainer = async () => {
    try {
      await searchEntity('trainer', 'trainers');
    } catch (error) {
      console.error('Trainer search error:', error);
      setSearchResults([]);
    }
  };

  const searchOwner = async () => {
    try {
      await searchEntity('owner', 'owners');
    } catch (error) {
      console.error('Owner search error:', error);
      setSearchResults([]);
    }
  };

  const searchDam = async () => {
    try {
      await searchBreedingEntity('dam', 'dams');
    } catch (error) {
      console.error('Dam search error:', error);
      setSearchResults([]);
    }
  };

  const searchSire = async () => {
    try {
      await searchBreedingEntity('sire', 'sires');
    } catch (error) {
      console.error('Sire search error:', error);
      setSearchResults([]);
    }
  };

  const searchDamsire = async () => {
    try {
      await searchBreedingEntity('damsire', 'damsires');
    } catch (error) {
      console.error('Damsire search error:', error);
      setSearchResults([]);
    }
  };

  const searchEntity = async (entityType: string, apiEndpoint: string) => {
    // First try to find the entity in our Supabase database
    console.log(`Searching Supabase for ${entityType}: ${searchQuery}`);
    
    // Search our database first for existing entities
    const supabaseResponse = await fetch(`/api/racing/${apiEndpoint}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: searchQuery }),
    });
    
    let supabaseResults = [];
    if (supabaseResponse.ok) {
      const supabaseData = await supabaseResponse.json();
      supabaseResults = supabaseData[apiEndpoint] || [];
    }
    
    // Also search via Racing API to get comprehensive results
    const apiResponse = await fetch(`/api/racing?endpoint=/${apiEndpoint}/search?name=${encodeURIComponent(searchQuery)}`);
    const apiData = await apiResponse.json();
    
    let combinedResults = [];
    
    // If we found results in Supabase, prioritize those
    if (supabaseResults.length > 0) {
      combinedResults = supabaseResults.map((entity: any) => ({
        id: entity[`${entityType}_id`],
        name: entity[`${entityType}_name`] || entity[entityType],
        type: entityType as SearchType,
        data: {
          ...entity,
          source: 'supabase'
        }
      }));
    }
    
    // Add API results (avoid duplicates)
    if (apiData.search_results && apiData.search_results.length > 0) {
      const apiResults = apiData.search_results.map((entity: any) => ({
        id: entity.id,
        name: entity.name,
        type: entityType as SearchType,
        data: {
          ...entity,
          source: 'api'
        }
      }));
      
      // Merge results, avoiding duplicates by ID
      const existingIds = new Set(combinedResults.map((r: SearchResult) => r.id));
      const newApiResults = apiResults.filter((r: SearchResult) => !existingIds.has(r.id));
      combinedResults = [...combinedResults, ...newApiResults];
    }
    
    setSearchResults(combinedResults);
  };

  const searchBreedingEntity = async (entityType: string, apiEndpoint: string) => {
    // Breeding entities don't typically exist in our Supabase database,
    // so we search directly via Racing API
    console.log(`Searching Racing API for ${entityType}: ${searchQuery}`);
    
    try {
      const apiResponse = await fetch(`/api/racing?endpoint=/${apiEndpoint}/search?name=${encodeURIComponent(searchQuery)}`);
      const apiData = await apiResponse.json();
      
      let results = [];
      
      if (apiData.search_results && apiData.search_results.length > 0) {
        results = apiData.search_results.map((entity: any) => ({
          id: entity.id,
          name: entity.name,
          type: entityType as SearchType,
          data: {
            ...entity,
            source: 'api'
          }
        }));
      }
      
      setSearchResults(results);
    } catch (error) {
      console.error(`Error searching ${entityType}:`, error);
      setSearchResults([]);
    }
  };

  const getDetailedData = async (result: SearchResult) => {
    setSelectedResult(result);
    setIsLoading(true);
    setDetailedData(null);
    setSearchResults([]); // Clear search results when user selects an option

    try {
      if (result.type === 'horse') {
        await getHorseDetails(result);
      } else if (result.type === 'jockey') {
        await getJockeyDetails(result);
      } else if (result.type === 'trainer') {
        await getTrainerDetails(result);
      } else if (result.type === 'owner') {
        await getOwnerDetails(result);
      } else if (['dam', 'sire', 'damsire'].includes(result.type)) {
        await getBreedingDetails(result);
      }
    } catch (error) {
      console.error('Error getting detailed data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHorseDetails = async (result: SearchResult) => {
    try {
      console.log(`Getting detailed data for horse: ${result.name} (${result.id})`);
      
      // Step 1: Get horse pro card data from Racing API
      console.log('Fetching horse pro card data...');
      const proResponse = await fetch(`/api/racing?endpoint=/horses/${result.id}/pro`);
      let proData = null;
      if (proResponse.ok) {
        proData = await proResponse.json();
        console.log('✅ Pro card data retrieved');
      } else {
        console.log('❌ Pro card data failed');
      }
      
      // Step 2: Get horse distance/times analysis from Racing API
      console.log('Fetching horse distance/times analysis...');
      const distanceTimesResponse = await fetch(`/api/racing?endpoint=/horses/${result.id}/analysis/distance-times`);
      let distanceTimesData = null;
      if (distanceTimesResponse.ok) {
        distanceTimesData = await distanceTimesResponse.json();
        console.log('✅ Distance/times analysis retrieved');
      } else {
        console.log('❌ Distance/times analysis failed');
      }
      
      // Step 3: Get recent results for supplementary race history (fallback)
      console.log('Fetching recent race results...');
      const today = new Date();
      const pastMonth = new Date(today);
      pastMonth.setMonth(today.getMonth() - 3); // Get more data
      
      const resultsResponse = await fetch(
        `/api/racing?endpoint=/results?start_date=${pastMonth.toISOString().split('T')[0]}&end_date=${today.toISOString().split('T')[0]}&limit=200`
      );
      const resultsData = await resultsResponse.json();
      
      // Find this horse in recent results
      const horseRaces: any[] = [];
      if (resultsData.results) {
        resultsData.results.forEach((race: any) => {
          if (race.runners) {
            race.runners.forEach((runner: any) => {
              if (runner.horse_id === result.id || 
                  (runner.horse && runner.horse.toLowerCase().includes(result.name.toLowerCase().replace(/\s*\([^)]*\)/, '')))) {
                horseRaces.push({
                  ...runner,
                  race_info: {
                    name: race.race_name,
                    date: race.date,
                    course: race.course,
                    distance: race.dist,
                    class: race.class,
                    going: race.going,
                    surface: race.surface
                  }
                });
              }
            });
          }
        });
      }
      
      // Combine all data
      setDetailedData({
        basic_info: result.data,
        pro_card: proData,
        distance_analysis: distanceTimesData,
        recent_races: horseRaces.slice(0, 10), // Last 10 races from results
        lifetime_stats: distanceTimesData ? {
          total_runs: distanceTimesData.total_runs,
          total_wins: distanceTimesData.distances?.reduce((sum: number, dist: any) => sum + (dist['1st'] || 0), 0) || 0,
          total_places: distanceTimesData.distances?.reduce((sum: number, dist: any) => sum + (dist['2nd'] || 0) + (dist['3rd'] || 0), 0) || 0,
          total_profit_loss: distanceTimesData.distances?.reduce((sum: number, dist: any) => sum + parseFloat(dist['1_pl'] || 0), 0) || 0
        } : null
      });
      
    } catch (error) {
      console.error('Error getting horse details:', error);
    }
  };

  const getJockeyDetails = async (result: SearchResult) => {
    try {
      console.log(`Getting detailed data for jockey: ${result.name} (${result.id})`);
      
      // Get all available data for the jockey
      const endpoints = [
        'analysis/courses',
        'analysis/distances',
        'analysis/trainers',
        'analysis/owners'
      ];

      const jockeyData: any = { basic_info: result.data };
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`/api/racing?endpoint=/jockeys/${result.id}/${endpoint}`);
          if (response.ok) {
            const data = await response.json();
            jockeyData[endpoint.replace('analysis/', '')] = data;
            console.log(`✅ ${endpoint} retrieved`);
          } else {
            console.log(`❌ ${endpoint} failed`);
          }
        } catch (error) {
          console.error(`Error fetching jockey ${endpoint}:`, error);
        }
      }

      // Calculate career summary from the courses analysis data (contains lifetime stats)
      if (jockeyData.courses && jockeyData.courses.total_rides) {
        const coursesData = jockeyData.courses;
        let totalWins = 0;
        let totalProfitLoss = 0;
        const totalCourses = coursesData.courses ? coursesData.courses.length : 0;

        // Sum up all wins and P&L from course data
        if (coursesData.courses) {
          coursesData.courses.forEach((course: any) => {
            totalWins += course['1st'] || 0;
            totalProfitLoss += parseFloat(course['1_pl'] || 0);
          });
        }

        jockeyData.career_summary = {
          total_rides: coursesData.total_rides,
          total_wins: totalWins,
          total_courses: totalCourses,
          win_percentage: coursesData.total_rides > 0 ? ((totalWins / coursesData.total_rides) * 100).toFixed(1) : '0.0',
          profit_loss: totalProfitLoss.toFixed(2)
        };
      }

      // Get recent form data (last 3 months) with date parameters
      try {
        const today = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        
        const startDate = threeMonthsAgo.toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];
        
        console.log(`Fetching recent form for ${result.name} from ${startDate} to ${endDate}`);
        
        const recentResultsResponse = await fetch(
          `/api/racing?endpoint=/jockeys/${result.id}/results&start_date=${startDate}&end_date=${endDate}`
        );
        
        if (recentResultsResponse.ok) {
          const recentResultsData = await recentResultsResponse.json();
          console.log(`Recent results data:`, recentResultsData);
          
          let recentRides = 0;
          let recentWins = 0;
          let recentSeconds = 0;
          let recentThirds = 0;
          let recentProfitLoss = 0;

          if (recentResultsData.results && Array.isArray(recentResultsData.results)) {
            recentResultsData.results.forEach((race: any) => {
              if (race.runners && Array.isArray(race.runners)) {
                race.runners.forEach((runner: any) => {
                  if (runner.jockey_id === result.id || runner.jockey === result.name) {
                    recentRides++;
                    const position = runner.position;
                    
                    if (position === '1st' || position === 1 || position === '1') {
                      recentWins++;
                      // Calculate profit if we have starting price
                      if (runner.sp && !isNaN(parseFloat(runner.sp))) {
                        recentProfitLoss += (parseFloat(runner.sp) - 1);
                      }
                    } else {
                      // Loss of stake
                      recentProfitLoss -= 1;
                    }
                    
                    if (position === '2nd' || position === 2 || position === '2') recentSeconds++;
                    if (position === '3rd' || position === 3 || position === '3') recentThirds++;
                  }
                });
              }
            });
          }

          jockeyData.recent_form = {
            rides: recentRides,
            wins: recentWins,
            seconds: recentSeconds,
            thirds: recentThirds,
            win_percentage: recentRides > 0 ? ((recentWins / recentRides) * 100).toFixed(1) : '0.0',
            place_percentage: recentRides > 0 ? (((recentWins + recentSeconds + recentThirds) / recentRides) * 100).toFixed(1) : '0.0',
            profit_loss: recentProfitLoss.toFixed(2),
            period: '3 months'
          };
          
          console.log(`Recent form calculated:`, jockeyData.recent_form);
        } else {
          console.log(`❌ Recent results failed for jockey`);
        }
      } catch (error) {
        console.error('Error fetching recent form:', error);
      }

      setDetailedData(jockeyData);
    } catch (error) {
      console.error('Error fetching jockey details:', error);
    }
  };

  const getTrainerDetails = async (result: SearchResult) => {
    try {
      console.log(`Getting detailed data for trainer: ${result.name} (${result.id})`);
      
      // Get all available data for the trainer
      const endpoints = [
        'analysis/courses', 
        'analysis/distances',
        'analysis/jockeys',
        'analysis/owners'
      ];

      const trainerData: any = { basic_info: result.data };
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`/api/racing?endpoint=/trainers/${result.id}/${endpoint}`);
          if (response.ok) {
            const data = await response.json();
            trainerData[endpoint.replace('analysis/', '')] = data;
            console.log(`✅ ${endpoint} retrieved`);
          } else {
            console.log(`❌ ${endpoint} failed`);
          }
        } catch (error) {
          console.error(`Error fetching trainer ${endpoint}:`, error);
        }
      }

      // Calculate career summary from the courses analysis data (contains lifetime stats)
      if (trainerData.courses && trainerData.courses.total_runners) {
        const coursesData = trainerData.courses;
        let totalWins = 0;
        let totalProfitLoss = 0;
        const totalCourses = coursesData.courses ? coursesData.courses.length : 0;

        // Sum up all wins and P&L from course data
        if (coursesData.courses) {
          coursesData.courses.forEach((course: any) => {
            totalWins += course['1st'] || 0;
            totalProfitLoss += parseFloat(course['1_pl'] || 0);
          });
        }

        trainerData.career_summary = {
          total_runners: coursesData.total_runners,
          total_wins: totalWins,
          total_courses: totalCourses,
          win_percentage: coursesData.total_runners > 0 ? ((totalWins / coursesData.total_runners) * 100).toFixed(1) : '0.0',
          profit_loss: totalProfitLoss.toFixed(2)
        };
      }

      // Get recent form data (last 3 months) with date parameters
      try {
        const today = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        
        const startDate = threeMonthsAgo.toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];
        
        console.log(`Fetching recent form for trainer ${result.name} from ${startDate} to ${endDate}`);
        
        const recentResultsResponse = await fetch(
          `/api/racing?endpoint=/trainers/${result.id}/results&start_date=${startDate}&end_date=${endDate}`
        );
        
        if (recentResultsResponse.ok) {
          const recentResultsData = await recentResultsResponse.json();
          console.log(`Recent trainer results data:`, recentResultsData);
          
          let recentRunners = 0;
          let recentWins = 0;
          let recentSeconds = 0;
          let recentThirds = 0;
          let recentProfitLoss = 0;

          if (recentResultsData.results && Array.isArray(recentResultsData.results)) {
            recentResultsData.results.forEach((race: any) => {
              if (race.runners && Array.isArray(race.runners)) {
                race.runners.forEach((runner: any) => {
                  if (runner.trainer_id === result.id || runner.trainer === result.name) {
                    recentRunners++;
                    const position = runner.position;
                    
                    if (position === '1st' || position === 1 || position === '1') {
                      recentWins++;
                      // Calculate profit if we have starting price
                      if (runner.sp && !isNaN(parseFloat(runner.sp))) {
                        recentProfitLoss += (parseFloat(runner.sp) - 1);
                      }
                    } else {
                      // Loss of stake
                      recentProfitLoss -= 1;
                    }
                    
                    if (position === '2nd' || position === 2 || position === '2') recentSeconds++;
                    if (position === '3rd' || position === 3 || position === '3') recentThirds++;
                  }
                });
              }
            });
          }

          trainerData.recent_form = {
            runners: recentRunners,
            wins: recentWins,
            seconds: recentSeconds,
            thirds: recentThirds,
            win_percentage: recentRunners > 0 ? ((recentWins / recentRunners) * 100).toFixed(1) : '0.0',
            place_percentage: recentRunners > 0 ? (((recentWins + recentSeconds + recentThirds) / recentRunners) * 100).toFixed(1) : '0.0',
            profit_loss: recentProfitLoss.toFixed(2),
            period: '3 months'
          };
          
          console.log(`Recent trainer form calculated:`, trainerData.recent_form);
        } else {
          console.log(`❌ Recent results failed for trainer`);
        }
      } catch (error) {
        console.error('Error fetching trainer recent form:', error);
      }

      setDetailedData(trainerData);
    } catch (error) {
      console.error('Error fetching trainer details:', error);
    }
  };

  const getOwnerDetails = async (result: SearchResult) => {
    try {
      console.log(`Getting detailed data for owner: ${result.name} (${result.id})`);
      
      // Get all available data for the owner
      const endpoints = [
        'analysis/courses',
        'analysis/distances', 
        'analysis/trainers',
        'analysis/jockeys'
      ];

      const ownerData: any = { basic_info: result.data };
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`/api/racing?endpoint=/owners/${result.id}/${endpoint}`);
          if (response.ok) {
            const data = await response.json();
            ownerData[endpoint.replace('analysis/', '')] = data;
            console.log(`✅ ${endpoint} retrieved`);
          } else {
            console.log(`❌ ${endpoint} failed`);
          }
        } catch (error) {
          console.error(`Error fetching owner ${endpoint}:`, error);
        }
      }

      // Calculate career summary from the courses analysis data (contains lifetime stats)
      if (ownerData.courses && ownerData.courses.total_runners) {
        const coursesData = ownerData.courses;
        let totalWins = 0;
        let totalProfitLoss = 0;
        const totalCourses = coursesData.courses ? coursesData.courses.length : 0;

        // Sum up all wins and P&L from course data
        if (coursesData.courses) {
          coursesData.courses.forEach((course: any) => {
            totalWins += course['1st'] || 0;
            totalProfitLoss += parseFloat(course['1_pl'] || 0);
          });
        }

        ownerData.career_summary = {
          total_runners: coursesData.total_runners,
          total_wins: totalWins,
          total_courses: totalCourses,
          win_percentage: coursesData.total_runners > 0 ? ((totalWins / coursesData.total_runners) * 100).toFixed(1) : '0.0',
          profit_loss: totalProfitLoss.toFixed(2)
        };
      }

      // Get recent form data (last 3 months) with date parameters
      try {
        const today = new Date();
        const threeMonthsAgo = new Date();
        threeMonthsAgo.setMonth(today.getMonth() - 3);
        
        const startDate = threeMonthsAgo.toISOString().split('T')[0];
        const endDate = today.toISOString().split('T')[0];
        
        console.log(`Fetching recent form for owner ${result.name} from ${startDate} to ${endDate}`);
        
        const recentResultsResponse = await fetch(
          `/api/racing?endpoint=/owners/${result.id}/results&start_date=${startDate}&end_date=${endDate}`
        );
        
        if (recentResultsResponse.ok) {
          const recentResultsData = await recentResultsResponse.json();
          console.log(`Recent owner results data:`, recentResultsData);
          
          let recentRunners = 0;
          let recentWins = 0;
          let recentSeconds = 0;
          let recentThirds = 0;
          let recentProfitLoss = 0;

          if (recentResultsData.results && Array.isArray(recentResultsData.results)) {
            recentResultsData.results.forEach((race: any) => {
              if (race.runners && Array.isArray(race.runners)) {
                race.runners.forEach((runner: any) => {
                  if (runner.owner_id === result.id || runner.owner === result.name) {
                    recentRunners++;
                    const position = runner.position;
                    
                    if (position === '1st' || position === 1 || position === '1') {
                      recentWins++;
                      // Calculate profit if we have starting price
                      if (runner.sp && !isNaN(parseFloat(runner.sp))) {
                        recentProfitLoss += (parseFloat(runner.sp) - 1);
                      }
                    } else {
                      // Loss of stake
                      recentProfitLoss -= 1;
                    }
                    
                    if (position === '2nd' || position === 2 || position === '2') recentSeconds++;
                    if (position === '3rd' || position === 3 || position === '3') recentThirds++;
                  }
                });
              }
            });
          }

          ownerData.recent_form = {
            runners: recentRunners,
            wins: recentWins,
            seconds: recentSeconds,
            thirds: recentThirds,
            win_percentage: recentRunners > 0 ? ((recentWins / recentRunners) * 100).toFixed(1) : '0.0',
            place_percentage: recentRunners > 0 ? (((recentWins + recentSeconds + recentThirds) / recentRunners) * 100).toFixed(1) : '0.0',
            profit_loss: recentProfitLoss.toFixed(2),
            period: '3 months'
          };
          
          console.log(`Recent owner form calculated:`, ownerData.recent_form);
        } else {
          console.log(`❌ Recent results failed for owner`);
        }
      } catch (error) {
        console.error('Error fetching owner recent form:', error);
      }

      setDetailedData(ownerData);
    } catch (error) {
      console.error('Error fetching owner details:', error);
    }
  };

  const getBreedingDetails = async (result: SearchResult) => {
    try {
      console.log(`Getting detailed data for ${result.type}: ${result.name} (${result.id})`);
      
      // Get all available data for the breeding entity
      const endpoints = [
        'results',
        'analysis/classes',
        'analysis/distances'
      ];

      const breedingData: any = { basic_info: result.data };
      
      // Determine the API path based on the entity type
      const apiPath = result.type === 'dam' ? 'dams' : 
                     result.type === 'sire' ? 'sires' : 'damsires';
      
      for (const endpoint of endpoints) {
        try {
          const response = await fetch(`/api/racing?endpoint=/${apiPath}/${result.id}/${endpoint}`);
          if (response.ok) {
            const data = await response.json();
            breedingData[endpoint.replace('analysis/', '')] = data;
            console.log(`✅ ${endpoint} retrieved`);
          } else {
            console.log(`❌ ${endpoint} failed`);
          }
        } catch (error) {
          console.error(`Error fetching ${result.type} ${endpoint}:`, error);
        }
      }

      setDetailedData(breedingData);
    } catch (error) {
      console.error(`Error fetching ${result.type} details:`, error);
    }
  };

  const formatOdds = (sp: string) => {
    if (!sp) return 'N/A';
    return sp.replace('F', ' (Fav)');
  };

  const getPlaceholderText = (type: SearchType) => {
    switch (type) {
      case 'horse':
        return 'Enter horse name (e.g., Tiger Roll)'
      case 'jockey':
        return 'Enter jockey name (e.g., Ryan Moore)'
      case 'trainer':
        return 'Enter trainer name (e.g., Willie Mullins)'
      case 'owner':
        return 'Enter owner name (e.g., Godolphin)'
      case 'sire':
        return 'Enter sire name (e.g., Frankel)'
      case 'dam':
        return 'Enter dam name (e.g., Urban Sea)'
      case 'damsire':
        return 'Enter damsire name (e.g., Dubawi)'
      default:
        return 'Enter search term'
    }
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.15)_0%,transparent_50%)] bg-[length:40px_40px]"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-blue-200 bg-clip-text text-transparent mb-4 tracking-tight">
              Racing Data
            </h1>
          </div>

          {/* Search Panel */}
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 mb-8 shadow-2xl">
            <h2 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
            </div>
              Search Racing Data
            </h2>

            {/* Search Type Selection */}
            <div className="mb-8">
              <label className="block text-sm font-medium text-gray-300 mb-4">Search Type</label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {searchTypes.map((type) => {
                  return (
                    <button
                      key={type.value}
                      onClick={() => setSelectedType(type.value as SearchType)}
                      className={`relative px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                        selectedType === type.value
                          ? 'bg-gradient-to-r from-blue-500 to-cyan-400 text-white shadow-lg shadow-blue-500/25'
                          : 'bg-white/5 border border-white/10 text-white hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      {type.label}
                    </button>
                  )
                })}
            </div>
            </div>

            {/* Search Input */}
            <div className="flex gap-4">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    // Clear previous results and selections when user starts typing
                    if (e.target.value !== searchQuery) {
                      setSearchResults([])
                      setSelectedResult(null)
                      setDetailedData(null)
                    }
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder={getPlaceholderText(selectedType)}
                  className="w-full px-6 py-4 bg-white/5 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 focus:outline-none transition-all duration-200 backdrop-blur-sm"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={!searchQuery.trim() || isLoading}
                className="px-8 py-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-500 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/25"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Searching...
                  </div>
                ) : (
                  'Search'
                )}
              </button>
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 mb-8 shadow-2xl">
              <h3 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-400 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                      </div>
                Search Results
              </h3>
              <div className="grid gap-4">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    onClick={() => getDetailedData(result)}
                    className="group cursor-pointer bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-white/20 transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-xl font-semibold text-white group-hover:text-blue-300 transition-colors">
                          {result.name}
                        </h4>
                        <div className="text-sm text-gray-300 mt-1">
                          <p>Type: {result.type}</p>
                      </div>
                    </div>
                      <div className="text-blue-400 group-hover:text-blue-300 transition-colors">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Loading State */}
          {selectedResult && isLoading && (
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 mb-8 shadow-2xl">
              <div className="flex flex-col items-center justify-center py-12">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                  <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-blue-400 rounded-full animate-spin" style={{animationDirection: 'reverse', animationDuration: '1.5s'}}></div>
                </div>
                <div className="mt-6 text-center">
                  <h3 className="text-2xl font-semibold text-white mb-2">Loading {selectedResult.name}</h3>
                  <p className="text-gray-300">Fetching comprehensive {selectedResult.type} data...</p>
                </div>
              </div>
            </div>
          )}

          {/* Detailed Results */}
          {selectedResult && detailedData && (
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 mb-8 shadow-2xl">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-400 rounded-xl flex items-center justify-center">
                  <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                      </div>
                      <div>
                  <h3 className="text-3xl font-bold text-white">{selectedResult.name}</h3>
                  <p className="text-lg text-gray-300 capitalize">{selectedResult.type} Analysis</p>
                      </div>
                    </div>

              {/* 1. Overall Stats - Career Summary Cards */}
              {detailedData.career_summary && (
                <div className="mb-8">
                  <h4 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg"></div>
                    Overall Career Statistics
                  </h4>
                  <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
                    <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-xl p-6 text-center">
                      <div className="text-3xl font-bold text-blue-300 mb-2">
                        {detailedData.career_summary.total_rides || detailedData.career_summary.total_runners || 'N/A'}
                    </div>
                      <div className="text-sm text-gray-300">
                        Total {selectedResult.type === 'jockey' ? 'Rides' : 'Runners'}
                  </div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-400/30 rounded-xl p-6 text-center">
                      <div className="text-3xl font-bold text-yellow-300 mb-2">
                        {detailedData.career_summary.total_wins || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-300">Total Wins</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl p-6 text-center">
                      <div className="text-3xl font-bold text-green-300 mb-2">
                        {detailedData.career_summary.total_courses || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-300">Courses</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-400/30 rounded-xl p-6 text-center">
                      <div className="text-3xl font-bold text-purple-300 mb-2">
                        {detailedData.career_summary.win_percentage ? `${detailedData.career_summary.win_percentage}%` : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-300">Win Rate</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-400/30 rounded-xl p-6 text-center">
                      <div className={`text-3xl font-bold mb-2 ${
                        detailedData.career_summary.profit_loss >= 0 ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {detailedData.career_summary.profit_loss >= 0 ? '+' : ''}{detailedData.career_summary.profit_loss}
                      </div>
                      <div className="text-sm text-gray-300">P&L</div>
                    </div>
                    {detailedData.career_summary.ae_ratio && (
                      <div className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-400/30 rounded-xl p-6 text-center">
                        <div className="text-3xl font-bold text-teal-300 mb-2">
                          {detailedData.career_summary.ae_ratio}
                        </div>
                        <div className="text-sm text-gray-300">A/E</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 2. Recent Results - Last 3 Months Form */}
              {detailedData.recent_form && (
                <div className="mb-8">
                  <h4 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg"></div>
                    Recent Form (Last {detailedData.recent_form.period})
                  </h4>
                  <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-4">
                    <div className="bg-gradient-to-br from-slate-500/20 to-gray-500/20 border border-slate-400/30 rounded-xl p-6 text-center">
                      <div className="text-3xl font-bold text-slate-300 mb-2">
                        {detailedData.recent_form.rides || detailedData.recent_form.runners || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-300">
                        Recent {selectedResult.type === 'jockey' ? 'Rides' : 'Runners'}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-500/20 to-amber-500/20 border border-yellow-400/30 rounded-xl p-6 text-center">
                      <div className="text-3xl font-bold text-yellow-300 mb-2">
                        {detailedData.recent_form.wins || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-300">Wins</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-400/30 rounded-xl p-6 text-center">
                      <div className="text-3xl font-bold text-orange-300 mb-2">
                        {detailedData.recent_form.seconds || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-300">2nd</div>
                    </div>
                    <div className="bg-gradient-to-br from-red-500/20 to-pink-500/20 border border-red-400/30 rounded-xl p-6 text-center">
                      <div className="text-3xl font-bold text-red-300 mb-2">
                        {detailedData.recent_form.thirds || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-300">3rd</div>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-400/30 rounded-xl p-6 text-center">
                      <div className="text-3xl font-bold text-cyan-300 mb-2">
                        {detailedData.recent_form.win_percentage ? `${detailedData.recent_form.win_percentage}%` : 'N/A'}
                      </div>
                      <div className="text-sm text-gray-300">Win Rate</div>
                    </div>
                    <div className="bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-pink-400/30 rounded-xl p-6 text-center">
                      <div className={`text-3xl font-bold mb-2 ${
                        parseFloat(detailedData.recent_form.profit_loss) >= 0 ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {parseFloat(detailedData.recent_form.profit_loss) >= 0 ? '+' : ''}{detailedData.recent_form.profit_loss}
                      </div>
                      <div className="text-sm text-gray-300">P&L</div>
                    </div>
                    {detailedData.recent_form.ae_ratio && (
                      <div className="bg-gradient-to-br from-teal-500/20 to-cyan-500/20 border border-teal-400/30 rounded-xl p-6 text-center">
                        <div className="text-3xl font-bold text-teal-300 mb-2">
                          {detailedData.recent_form.ae_ratio}
                        </div>
                        <div className="text-sm text-gray-300">A/E</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. Partnership Analysis */}
              {(detailedData.trainers?.trainers || detailedData.trainers || detailedData.jockeys?.jockeys || detailedData.jockeys || detailedData.owners?.owners || detailedData.owners) && (
                <div className="mb-8">
                  <h4 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-pink-500 to-rose-500 rounded-lg"></div>
                    Partnership Analysis
                  </h4>
                  
                  <div className="grid lg:grid-cols-3 gap-6">
                    {(detailedData.trainers?.trainers || detailedData.trainers) && Array.isArray(detailedData.trainers?.trainers || detailedData.trainers) && (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h5 className="text-lg font-semibold text-white mb-4">Top Trainers</h5>
                        <div className="space-y-4">
                          {(detailedData.trainers?.trainers || detailedData.trainers || []).slice(0, 5).map((trainer: any, index: number) => {
                            const rides = trainer.rides || trainer.runners || 0;
                            const wins = trainer['1st'] || 0;
                            const winPercentage = rides > 0 ? ((wins / rides) * 100).toFixed(1) : '0.0';
                            const profitLoss = trainer['1_pl'] || '0.00';
                            return (
                              <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-white font-medium">{trainer.trainer}</span>
                                  <div className={`text-sm font-semibold ${parseFloat(profitLoss) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {parseFloat(profitLoss) >= 0 ? '+' : ''}{profitLoss}
                                  </div>
                                </div>
                                <div className={`grid ${trainer['a/e'] ? 'grid-cols-4' : 'grid-cols-3'} gap-3 text-xs`}>
                                  <div className="text-center">
                                    <div className="text-gray-400">Rides</div>
                                    <div className="text-white font-semibold">{rides}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-gray-400">Wins</div>
                                    <div className="text-green-400 font-semibold">{wins}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-gray-400">Win %</div>
                                    <div className="text-blue-400 font-semibold">{winPercentage}%</div>
                                  </div>
                                  {trainer['a/e'] && (
                                    <div className="text-center">
                                      <div className="text-gray-400">A/E</div>
                                      <div className="text-teal-400 font-semibold">{trainer['a/e']}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {(detailedData.jockeys?.jockeys || detailedData.jockeys) && Array.isArray(detailedData.jockeys?.jockeys || detailedData.jockeys) && (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h5 className="text-lg font-semibold text-white mb-4">Top Jockeys</h5>
                        <div className="space-y-4">
                          {(detailedData.jockeys?.jockeys || detailedData.jockeys || []).slice(0, 5).map((jockey: any, index: number) => {
                            const rides = jockey.rides || jockey.runners || 0;
                            const wins = jockey['1st'] || 0;
                            const winPercentage = rides > 0 ? ((wins / rides) * 100).toFixed(1) : '0.0';
                            const profitLoss = jockey['1_pl'] || '0.00';
                            return (
                              <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-white font-medium">{jockey.jockey}</span>
                                  <div className={`text-sm font-semibold ${parseFloat(profitLoss) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {parseFloat(profitLoss) >= 0 ? '+' : ''}{profitLoss}
                                  </div>
                                </div>
                                <div className={`grid ${jockey['a/e'] ? 'grid-cols-4' : 'grid-cols-3'} gap-3 text-xs`}>
                                  <div className="text-center">
                                    <div className="text-gray-400">Rides</div>
                                    <div className="text-white font-semibold">{rides}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-gray-400">Wins</div>
                                    <div className="text-green-400 font-semibold">{wins}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-gray-400">Win %</div>
                                    <div className="text-blue-400 font-semibold">{winPercentage}%</div>
                                  </div>
                                  {jockey['a/e'] && (
                                    <div className="text-center">
                                      <div className="text-gray-400">A/E</div>
                                      <div className="text-teal-400 font-semibold">{jockey['a/e']}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {(detailedData.owners?.owners || detailedData.owners) && Array.isArray(detailedData.owners?.owners || detailedData.owners) && (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                        <h5 className="text-lg font-semibold text-white mb-4">Top Owners</h5>
                        <div className="space-y-4">
                          {(detailedData.owners?.owners || detailedData.owners || []).slice(0, 5).map((owner: any, index: number) => {
                            const runners = owner.rides || owner.runners || 0;
                            const wins = owner['1st'] || 0;
                            const winPercentage = runners > 0 ? ((wins / runners) * 100).toFixed(1) : '0.0';
                            const profitLoss = owner['1_pl'] || '0.00';
                            return (
                              <div key={index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                                <div className="flex justify-between items-start mb-2">
                                  <span className="text-white font-medium">{owner.owner}</span>
                                  <div className={`text-sm font-semibold ${parseFloat(profitLoss) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {parseFloat(profitLoss) >= 0 ? '+' : ''}{profitLoss}
                                  </div>
                                </div>
                                <div className={`grid ${owner['a/e'] ? 'grid-cols-4' : 'grid-cols-3'} gap-3 text-xs`}>
                                  <div className="text-center">
                                    <div className="text-gray-400">Runners</div>
                                    <div className="text-white font-semibold">{runners}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-gray-400">Wins</div>
                                    <div className="text-green-400 font-semibold">{wins}</div>
                                  </div>
                                  <div className="text-center">
                                    <div className="text-gray-400">Win %</div>
                                    <div className="text-blue-400 font-semibold">{winPercentage}%</div>
                                  </div>
                                  {owner['a/e'] && (
                                    <div className="text-center">
                                      <div className="text-gray-400">A/E</div>
                                      <div className="text-teal-400 font-semibold">{owner['a/e']}</div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. Course Analysis */}
              {(detailedData.courses?.courses || detailedData.courses) && (
                <div className="mb-8">
                  <h4 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg"></div>
                    Performance by Course
                  </h4>
                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-white/10 border-b border-white/10">
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">Course</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">Rides</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">1st</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">2nd</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">3rd</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">Win %</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">A/E</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">P&L</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(detailedData.courses?.courses || detailedData.courses || []).slice(0, 10).map((course: any, index: number) => (
                            <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 text-white font-medium">{course.course}</td>
                              <td className="px-6 py-4 text-gray-300">{course.rides || course.runners}</td>
                              <td className="px-6 py-4 text-green-400 font-semibold">{course['1st']}</td>
                              <td className="px-6 py-4 text-yellow-400 font-semibold">{course['2nd']}</td>
                              <td className="px-6 py-4 text-orange-400 font-semibold">{course['3rd']}</td>
                              <td className="px-6 py-4 text-white">{(course['win_%'] * 100).toFixed(1)}%</td>
                              <td className="px-6 py-4 text-gray-300">{course['a/e']?.toFixed(2)}</td>
                              <td className={`px-6 py-4 font-semibold ${
                                parseFloat(course['1_pl']) >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {parseFloat(course['1_pl']) >= 0 ? '+' : ''}{course['1_pl']}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
              </div>
            </div>
          </div>
              )}

              {/* 5. Distance Analysis */}
              {(detailedData.distances?.distances || detailedData.distances) && Array.isArray(detailedData.distances?.distances || detailedData.distances) && (
          <div className="mb-8">
                  <h4 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg"></div>
                    Performance by Distance
                  </h4>
                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                        <thead>
                          <tr className="bg-white/10 border-b border-white/10">
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">Distance</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">Runners</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">1st</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">2nd</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">3rd</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">Win %</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">A/E</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">P&L</th>
                    </tr>
                  </thead>
                  <tbody>
                          {(detailedData.distances?.distances || detailedData.distances || []).map((distance: any, index: number) => (
                            <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 text-white font-medium">{distance.distance || distance.dist}</td>
                              <td className="px-6 py-4 text-gray-300">{distance.rides || distance.runners || distance.runs}</td>
                              <td className="px-6 py-4 text-green-400 font-semibold">{distance['1st']}</td>
                              <td className="px-6 py-4 text-yellow-400 font-semibold">{distance['2nd']}</td>
                              <td className="px-6 py-4 text-orange-400 font-semibold">{distance['3rd']}</td>
                              <td className="px-6 py-4 text-white">{(distance['win_%'] * 100).toFixed(1)}%</td>
                              <td className="px-6 py-4 text-gray-300">{distance['a/e']?.toFixed(2)}</td>
                              <td className={`px-6 py-4 font-semibold ${
                                parseFloat(distance['1_pl']) >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {parseFloat(distance['1_pl']) >= 0 ? '+' : ''}{distance['1_pl']}
                              </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
              )}

              {/* Horse-specific content with modern styling */}
              {selectedResult.type === 'horse' && (detailedData.basic_info || detailedData.pro_card) && (
          <div className="mb-8">
                  <h4 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg"></div>
                    Breeding Information
                  </h4>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 rounded-xl p-6">
                      <div className="text-emerald-300 font-semibold mb-3 text-lg">Sire</div>
                      <div className="text-white text-xl">{detailedData.pro_card?.sire || detailedData.basic_info?.sire || 'Unknown'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-xl p-6">
                      <div className="text-blue-300 font-semibold mb-3 text-lg">Dam</div>
                      <div className="text-white text-xl">{detailedData.pro_card?.dam || detailedData.basic_info?.dam || 'Unknown'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-400/30 rounded-xl p-6">
                      <div className="text-purple-300 font-semibold mb-3 text-lg">Damsire</div>
                      <div className="text-white text-xl">{detailedData.pro_card?.damsire || detailedData.basic_info?.damsire || 'Unknown'}</div>
                    </div>
                    </div>
                  </div>
              )}

              {/* Lifetime Statistics with modern styling */}
              {detailedData.lifetime_stats && (
                <div className="mb-8">
                  <h4 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg"></div>
                    Lifetime Performance
                  </h4>
                  <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-xl p-6 text-center">
                      <div className="text-3xl font-bold text-blue-300 mb-2">{detailedData.lifetime_stats.total_runs}</div>
                      <div className="text-sm text-gray-300">Total Runs</div>
                </div>
                    <div className="bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl p-6 text-center">
                      <div className="text-3xl font-bold text-green-300 mb-2">{detailedData.lifetime_stats.total_wins}</div>
                      <div className="text-sm text-gray-300">Wins</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/20 to-violet-500/20 border border-purple-400/30 rounded-xl p-6 text-center">
                      <div className="text-3xl font-bold text-purple-300 mb-2">
                        {detailedData.lifetime_stats.total_runs > 0 
                          ? ((detailedData.lifetime_stats.total_wins / detailedData.lifetime_stats.total_runs) * 100).toFixed(1)
                          : 0}%
                      </div>
                      <div className="text-sm text-gray-300">Win Rate</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-400/30 rounded-xl p-6 text-center">
                      <div className={`text-3xl font-bold mb-2 ${
                        detailedData.lifetime_stats.total_profit_loss >= 0 ? 'text-green-300' : 'text-red-300'
                      }`}>
                        {detailedData.lifetime_stats.total_profit_loss >= 0 ? '+' : ''}{detailedData.lifetime_stats.total_profit_loss.toFixed(2)}
                      </div>
                      <div className="text-sm text-gray-300">Profit/Loss</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Distance Analysis for horses with modern styling */}
              {detailedData.distance_analysis?.distances && (
                <div className="mb-8">
                  <h4 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg"></div>
                    Performance by Distance
                  </h4>
                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-white/10 border-b border-white/10">
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">Distance</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">Runs</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">Wins</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">Win %</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">P&L</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">Best Time</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailedData.distance_analysis.distances.map((distance: any, index: number) => (
                            <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 text-white font-semibold">{distance.dist}</td>
                              <td className="px-6 py-4 text-gray-300">{distance.runs}</td>
                              <td className="px-6 py-4 text-green-400 font-semibold">{distance['1st']}</td>
                              <td className="px-6 py-4 text-white">{(distance['win_%'] * 100).toFixed(1)}%</td>
                              <td className={`px-6 py-4 font-semibold ${
                                parseFloat(distance['1_pl']) >= 0 ? 'text-green-400' : 'text-red-400'
                              }`}>
                                {parseFloat(distance['1_pl']) >= 0 ? '+' : ''}{distance['1_pl']}
                              </td>
                              <td className="px-6 py-4 text-gray-300">
                                {distance.times?.length > 0 
                                  ? distance.times.reduce((best: any, time: any) => 
                                      !best || time.time < best.time ? time : best
                                    ).time 
                                  : 'N/A'
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
            </div>
          </div>
                </div>
              )}

              {/* Recent Race History with modern styling */}
              {detailedData.recent_races && detailedData.recent_races.length > 0 && (
                <div>
                  <h4 className="text-2xl font-semibold text-white mb-6 flex items-center gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg"></div>
                    Recent Race History
                  </h4>
                  <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-white/10 border-b border-white/10">
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">Date</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">Course</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">Race</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">Position</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">Odds</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">Jockey</th>
                            <th className="px-6 py-4 text-left text-blue-300 font-semibold">Trainer</th>
                          </tr>
                        </thead>
                        <tbody>
                          {detailedData.recent_races.map((race: any, index: number) => (
                            <tr key={index} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                              <td className="px-6 py-4 text-gray-300">{race.race_info.date}</td>
                              <td className="px-6 py-4 text-white font-semibold">{race.race_info.course}</td>
                              <td className="px-6 py-4 text-gray-300">{race.race_info.name}</td>
                              <td className="px-6 py-4 text-green-400 font-semibold">{race.position}</td>
                              <td className="px-6 py-4 text-white">{formatOdds(race.sp)}</td>
                              <td className="px-6 py-4 text-gray-300">{race.jockey}</td>
                              <td className="px-6 py-4 text-gray-300">{race.trainer}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                </div>
                </div>
                </div>
              )}

              {detailedData.recent_races && detailedData.recent_races.length === 0 && (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m8-8v2m0 8v2" />
                    </svg>
              </div>
                  <p className="text-gray-400 text-lg">No recent race data found for this horse.</p>
              </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {isLoading && selectedResult && (
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
                  <span className="text-white text-xl">Loading detailed data...</span>
          </div>
              </div>
            </div>
          )}

          {/* No Results */}
          {!isLoading && searchQuery && searchResults.length === 0 && selectedType === 'horse' && (
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl p-8 shadow-2xl">
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-300 text-xl mb-2">No horses found matching "{searchQuery}"</p>
                <p className="text-gray-500">Try a different spelling or check the horse name</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 