'use client';

import Link from "next/link";
import { ArrowLeft, Clock, MapPin, Trophy, Users, ChevronDown, ChevronUp, AlertCircle, Info } from "lucide-react";
import Layout from "@/components/layout/Layout";
import { useState, useEffect } from "react";
import { 
  getTrackGroupedRaces, 
  getRacecardsStats, 
  TrackData, 
  RacecardsStats,
  getCurrentUKDateInfo
} from "@/lib/services/racecardsService";
import { 
  getTrackImageAssignments, 
  preloadTrackImages,
  TrackImageAssignment 
} from "@/lib/services/trackImageService";
// Import UK and Irish track lists
import ukTrackList from "@/config/UK-Full-Track-List.json";
import ireTrackList from "@/config/IRE-Full-Track-List.json";

// Type the imported track lists
const typedUkTrackList = ukTrackList as { trackNames: string[] };
const typedIreTrackList = ireTrackList as { trackNames: string[] };

const getRaceTypeColor = (raceType: string) => {
  switch (raceType) {
    case 'Flat': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'Hurdle': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'Chase': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  }
};

const formatRaceClassAndPattern = (raceClass: string | null, pattern: string | null): string => {
  const parts: string[] = [];
  
  if (raceClass) {
    // Check if raceClass already starts with "Class", if so use as-is, otherwise prepend "Class "
    const formattedClass = raceClass.toLowerCase().startsWith('class') ? raceClass : `Class ${raceClass}`;
    parts.push(formattedClass);
  }
  
  if (pattern) {
    parts.push(pattern);
  }
  
  return parts.join(' - ');
};

export default function HorseRacingRacecards() {
  const [expandedTracks, setExpandedTracks] = useState<string[]>([]);
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [ukTracks, setUkTracks] = useState<TrackData[]>([]);
  const [ireTracks, setIreTracks] = useState<TrackData[]>([]);
  const [internationalTracks, setInternationalTracks] = useState<TrackData[]>([]);
  const [stats, setStats] = useState<RacecardsStats>({
    totalTracks: 0,
    totalRaces: 0,
    totalRunners: 0,
    totalPrizeMoney: '£0'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ukDateInfo, setUkDateInfo] = useState<any>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [trackImages, setTrackImages] = useState<TrackImageAssignment[]>([]);
  const [imagesLoading, setImagesLoading] = useState(true);

  // Function to normalize track names for comparison
  const normalizeTrackName = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/\s*\([^)]*\)/g, '') // Remove content in brackets (e.g., "(AW)", "(Flat)")
      .replace(/\s+/g, ' ') // Normalize multiple spaces to single space
      .trim();
  };

  // Function to calculate string similarity (Jaro-Winkler-like simple approach)
  const calculateSimilarity = (str1: string, str2: string): number => {
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    if (s1 === s2) return 1;
    
    const len1 = s1.length;
    const len2 = s2.length;
    
    if (len1 === 0 || len2 === 0) return 0;
    
    // Simple similarity check - count matching characters in similar positions
    let matches = 0;
    const maxLen = Math.max(len1, len2);
    
    for (let i = 0; i < Math.min(len1, len2); i++) {
      if (s1[i] === s2[i]) matches++;
    }
    
    // Add points for common substrings
    const commonSubstrings = [];
    for (let i = 0; i < len1 - 2; i++) {
      const substr = s1.substring(i, i + 3);
      if (s2.includes(substr)) {
        commonSubstrings.push(substr);
      }
    }
    
    const similarity = (matches / maxLen) + (commonSubstrings.length * 0.1);
    return Math.min(similarity, 1);
  };

  // Function to check if a track is UK-based with fuzzy matching
  const isUKTrack = (trackName: string): boolean => {
    const normalizedTrackName = normalizeTrackName(trackName);
    
    // First try exact match after normalization
    const normalizedUKTracks = typedUkTrackList.trackNames.map((name: string) => normalizeTrackName(name));
    if (normalizedUKTracks.includes(normalizedTrackName)) {
      return true;
    }
    
    // Then try fuzzy matching with 70% threshold
    for (const ukTrack of typedUkTrackList.trackNames) {
      const normalizedUKTrack = normalizeTrackName(ukTrack);
      const similarity = calculateSimilarity(normalizedTrackName, normalizedUKTrack);
      
      if (similarity >= 0.7) {
        console.log(`UK fuzzy match found: "${trackName}" matches "${ukTrack}" with ${(similarity * 100).toFixed(1)}% similarity`);
        return true;
      }
    }
    
    return false;
  };

  // Function to check if a track is Irish-based with fuzzy matching
  const isIrishTrack = (trackName: string): boolean => {
    const normalizedTrackName = normalizeTrackName(trackName);
    
    // First try exact match after normalization
    const normalizedIreTracks = typedIreTrackList.trackNames.map((name: string) => normalizeTrackName(name));
    if (normalizedIreTracks.includes(normalizedTrackName)) {
      return true;
    }
    
    // Then try fuzzy matching with 70% threshold
    for (const ireTrack of typedIreTrackList.trackNames) {
      const normalizedIreTrack = normalizeTrackName(ireTrack);
      const similarity = calculateSimilarity(normalizedTrackName, normalizedIreTrack);
      
      if (similarity >= 0.7) {
        console.log(`Irish fuzzy match found: "${trackName}" matches "${ireTrack}" with ${(similarity * 100).toFixed(1)}% similarity`);
        return true;
      }
    }
    
    return false;
  };

  useEffect(() => {
    const fetchRaceData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Get UK date info for debugging
        const dateInfo = getCurrentUKDateInfo();
        setUkDateInfo(dateInfo);
        
        // Fetch both tracks and stats
        const [tracksData, statsData] = await Promise.all([
          getTrackGroupedRaces(),
          getRacecardsStats()
        ]);
        
        // Separate UK, Irish, and international tracks
        const ukTracksData = tracksData.filter(track => isUKTrack(track.name));
        const ireTracksData = tracksData.filter(track => !isUKTrack(track.name) && isIrishTrack(track.name));
        const internationalTracksData = tracksData.filter(track => !isUKTrack(track.name) && !isIrishTrack(track.name));
        
        setTracks(tracksData);
        setUkTracks(ukTracksData);
        setIreTracks(ireTracksData);
        setInternationalTracks(internationalTracksData);
        setStats(statsData);

        // Fetch track images after we have track data
        if (tracksData.length > 0) {
          setImagesLoading(true);
          const trackNames = tracksData.map(track => track.name);
          const imageAssignments = await getTrackImageAssignments(trackNames);
          setTrackImages(imageAssignments);
          
          // Preload images for better performance
          const imageUrls = imageAssignments.map(assignment => assignment.imageUrl);
          preloadTrackImages(imageUrls);
          
          setImagesLoading(false);
        }
      } catch (err) {
        console.error('Error fetching race data:', err);
        setError('Failed to load race data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchRaceData();
    
    // Refresh data every 5 minutes to catch new races or date changes
    const interval = setInterval(fetchRaceData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  const toggleTrack = (trackName: string) => {
    setExpandedTracks(prev => 
      prev.includes(trackName) 
        ? prev.filter(name => name !== trackName)
        : [...prev, trackName]
    );
  };

  const getTrackSummary = (track: TrackData) => {
    const totalPrizeMoney = track.races.reduce((sum: number, race: any) => {
      const prizeValue = parseFloat(race.prize.replace(/[£,]/g, '')) || 0;
      return sum + prizeValue;
    }, 0);
    
    const totalRunners = track.races.reduce((sum: number, race: any) => sum + race.runners, 0);
    const firstRaceTime = track.races[0]?.time || 'TBC';
    
    return {
      totalPrizeMoney: `£${totalPrizeMoney.toLocaleString()}`,
      totalRunners,
      firstRaceTime,
      raceCount: track.races.length
    };
  };

  const getTrackImage = (trackName: string): string => {
    const assignment = trackImages.find(img => img.trackName === trackName);
    return assignment?.imageUrl || '/images/fallback-track.jpg';
  };

  // Loading state
  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-betting-dark text-white py-8 font-sans">
          <div className="max-w-7xl mx-auto px-4">
            <div className="mb-8">
              <h1 className="text-5xl font-bold text-center mb-4 text-white">Today's Racecards</h1>
            </div>
            
            {/* Loading skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-betting-green/10 border border-betting-green/30 rounded-lg p-4 text-center animate-pulse">
                  <div className="h-8 bg-betting-green/20 rounded mb-2"></div>
                  <div className="h-4 bg-gray-600 rounded"></div>
                </div>
              ))}
            </div>
            
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-betting-dark border border-betting-green/20 rounded-xl shadow-lg p-6 animate-pulse">
                  <div className="h-6 bg-betting-green/20 rounded w-1/4 mb-4"></div>
                  <div className="h-4 bg-gray-600 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Error state
  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-betting-dark text-white py-8 font-sans">
          <div className="max-w-7xl mx-auto px-4">
            <div className="mb-8">
              <h1 className="text-5xl font-bold text-center mb-4 text-white">Today's Racecards</h1>
            </div>
            
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-8 text-center">
              <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-red-400 mb-2">Error Loading Race Data</h3>
              <p className="text-gray-300 mb-4">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="bg-betting-green text-white px-6 py-2 rounded-lg hover:bg-betting-secondary transition"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // No races state
  if (tracks.length === 0) {
    return (
      <Layout>
        <div className="min-h-screen bg-betting-dark text-white py-8 font-sans">
          <div className="max-w-7xl mx-auto px-4">
            <div className="mb-8">
              <h1 className="text-5xl font-bold text-center mb-4 text-white">Today's Racecards</h1>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div 
        className="min-h-screen bg-betting-dark text-white py-8 font-sans"
      >
        
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-center mb-4 text-white" style={{textShadow: '2px 2px 4px rgba(0,0,0,0.8)'}}>Today's Racecards</h1>
          </div>
          
          {/* Quick Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-betting-green/30 rounded-lg p-6 text-center shadow-lg transform hover:scale-105 transition-all duration-200" style={{boxShadow: '0 10px 15px -3px rgba(46, 206, 96, 0.2), 0 4px 6px -4px rgba(46, 206, 96, 0.2)'}}>
              <div className="text-3xl font-bold text-betting-green mb-1">{stats.totalTracks}</div>
              <div className="text-sm text-white font-medium">Tracks</div>
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-betting-green/30 rounded-lg p-6 text-center shadow-lg transform hover:scale-105 transition-all duration-200" style={{boxShadow: '0 10px 15px -3px rgba(46, 206, 96, 0.2), 0 4px 6px -4px rgba(46, 206, 96, 0.2)'}}>
              <div className="text-3xl font-bold text-betting-green mb-1">{stats.totalRaces}</div>
              <div className="text-sm text-white font-medium">Races</div>
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-betting-green/30 rounded-lg p-6 text-center shadow-lg transform hover:scale-105 transition-all duration-200" style={{boxShadow: '0 10px 15px -3px rgba(46, 206, 96, 0.2), 0 4px 6px -4px rgba(46, 206, 96, 0.2)'}}>
              <div className="text-3xl font-bold text-betting-green mb-1">{stats.totalRunners}</div>
              <div className="text-sm text-white font-medium">Runners</div>
            </div>
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 border border-betting-green/30 rounded-lg p-6 text-center shadow-lg transform hover:scale-105 transition-all duration-200" style={{boxShadow: '0 10px 15px -3px rgba(46, 206, 96, 0.2), 0 4px 6px -4px rgba(46, 206, 96, 0.2)'}}>
              <div className="text-3xl font-bold text-betting-green mb-1">{stats.totalPrizeMoney}</div>
              <div className="text-sm text-white font-medium">Prize Money</div>
            </div>
          </div>
          
          {/* UK Racing Section */}
          {ukTracks.length > 0 && (
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                <span className="mr-3">🇬🇧</span>
                UK Racing
                <span className="ml-3 text-lg text-gray-400">({ukTracks.length} tracks)</span>
              </h2>
              
              <div className="space-y-6">
                {ukTracks.map((track) => {
              const trackSummary = getTrackSummary(track);
              const isExpanded = expandedTracks.includes(track.name);
              const trackImage = getTrackImage(track.name);
              
              return (
                <div key={track.name} className="bg-betting-dark border border-betting-green/20 rounded-xl shadow-lg overflow-hidden">
                  {/* Track Header */}
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => toggleTrack(track.name)}
                    style={{
                      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${trackImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-heading text-white" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.9)'}}>{track.name}</h2>
                        <div className="flex items-center gap-6 mt-2 text-sm text-white">
                          <div className="flex items-center">
                            <Clock size={16} className="mr-2 text-betting-green" />
                            First race: {trackSummary.firstRaceTime}
                          </div>
                          <div className="flex items-center">
                            <Trophy size={16} className="mr-2 text-betting-green" />
                            {trackSummary.raceCount} races
                          </div>
                          <div className="flex items-center">
                            <Users size={16} className="mr-2 text-betting-green" />
                            {trackSummary.totalRunners} runners
                          </div>
                          <div className="flex items-center">
                            <MapPin size={16} className="mr-2 text-betting-green" />
                            {trackSummary.totalPrizeMoney}
                            <br />prize money
                          </div>
                        </div>
                      </div>
                      <div className="text-white">
                        {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Race Details */}
                  {isExpanded && (
                    <div className="px-6 pb-6">
                      <div className="border-t border-betting-green/20 pt-6">
                        <div className="grid gap-4">
                          {track.races.map((race, i) => (
                            <div key={race.race_id} className="bg-betting-green/5 border border-betting-green/10 rounded-lg p-4 hover:bg-betting-green/10 transition">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-betting-green/20 text-betting-green px-3 py-1 rounded-lg font-mono font-bold">
                                      {race.time}
                                    </div>
                                    <div className={`px-2 py-1 rounded border text-xs font-semibold ${getRaceTypeColor(race.raceType)}`}>
                                      {race.raceType}
                                    </div>
                                    {(race.race_class || race.pattern) && (
                                      <div className="px-2 py-1 rounded border text-xs font-semibold bg-orange-500/20 text-orange-400 border-orange-500/30">
                                        {formatRaceClassAndPattern(race.race_class, race.pattern)}
                                      </div>
                                    )}
                                    {race.big_race && (
                                      <div className="px-2 py-1 rounded border text-xs font-semibold bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                        BIG RACE
                                      </div>
                                    )}
                                  </div>
                                  <h3 className="text-lg font-semibold text-white mb-1">{race.name}</h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <div className="flex items-center">
                                      <Clock size={14} className="mr-1" />
                                      {race.distance}
                                    </div>
                                    <div className="flex items-center">
                                      <Trophy size={14} className="mr-1" />
                                      {race.prize}
                                    </div>
                                    <div className="flex items-center">
                                      <Users size={14} className="mr-1" />
                                      {race.runners} runners
                                    </div>
                                    {race.going && race.going !== 'Unknown' && (
                                      <div className="flex items-center">
                                        <span className="mr-1">Going:</span>
                                        <span className="text-betting-green">{race.going}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Link 
                                    href={`/horse-racing/racecards/handicap-cards/${race.race_id}`}
                                    className="bg-betting-green text-white px-4 py-2 rounded-lg hover:bg-betting-secondary transition font-semibold text-sm"
                                  >
                                    View Racecard
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
                })}
              </div>
            </div>
          )}

          {/* Irish Racing Section */}
          {ireTracks.length > 0 && (
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                <span className="mr-3">🇮🇪</span>
                Irish Racing
                <span className="ml-3 text-lg text-gray-400">({ireTracks.length} tracks)</span>
              </h2>
              
              <div className="space-y-6">
                {ireTracks.map((track) => {
              const trackSummary = getTrackSummary(track);
              const isExpanded = expandedTracks.includes(track.name);
              const trackImage = getTrackImage(track.name);
              
              return (
                <div key={track.name} className="bg-betting-dark border border-betting-green/20 rounded-xl shadow-lg overflow-hidden">
                  {/* Track Header */}
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => toggleTrack(track.name)}
                    style={{
                      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${trackImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-heading text-white" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.9)'}}>{track.name}</h2>
                        <div className="flex items-center gap-6 mt-2 text-sm text-white">
                          <div className="flex items-center">
                            <Clock size={16} className="mr-2 text-betting-green" />
                            First race: {trackSummary.firstRaceTime}
                          </div>
                          <div className="flex items-center">
                            <Trophy size={16} className="mr-2 text-betting-green" />
                            {trackSummary.raceCount} races
                          </div>
                          <div className="flex items-center">
                            <Users size={16} className="mr-2 text-betting-green" />
                            {trackSummary.totalRunners} runners
                          </div>
                          <div className="flex items-center">
                            <MapPin size={16} className="mr-2 text-betting-green" />
                            {trackSummary.totalPrizeMoney}
                            <br />prize money
                          </div>
                        </div>
                      </div>
                      <div className="text-white">
                        {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Race Details */}
                  {isExpanded && (
                    <div className="px-6 pb-6">
                      <div className="border-t border-betting-green/20 pt-6">
                        <div className="grid gap-4">
                          {track.races.map((race, i) => (
                            <div key={race.race_id} className="bg-betting-green/5 border border-betting-green/10 rounded-lg p-4 hover:bg-betting-green/10 transition">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-betting-green/20 text-betting-green px-3 py-1 rounded-lg font-mono font-bold">
                                      {race.time}
                                    </div>
                                    <div className={`px-2 py-1 rounded border text-xs font-semibold ${getRaceTypeColor(race.raceType)}`}>
                                      {race.raceType}
                                    </div>
                                    {(race.race_class || race.pattern) && (
                                      <div className="px-2 py-1 rounded border text-xs font-semibold bg-orange-500/20 text-orange-400 border-orange-500/30">
                                        {formatRaceClassAndPattern(race.race_class, race.pattern)}
                                      </div>
                                    )}
                                    {race.big_race && (
                                      <div className="px-2 py-1 rounded border text-xs font-semibold bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                        BIG RACE
                                      </div>
                                    )}
                                  </div>
                                  <h3 className="text-lg font-semibold text-white mb-1">{race.name}</h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <div className="flex items-center">
                                      <Clock size={14} className="mr-1" />
                                      {race.distance}
                                    </div>
                                    <div className="flex items-center">
                                      <Trophy size={14} className="mr-1" />
                                      {race.prize}
                                    </div>
                                    <div className="flex items-center">
                                      <Users size={14} className="mr-1" />
                                      {race.runners} runners
                                    </div>
                                    {race.going && race.going !== 'Unknown' && (
                                      <div className="flex items-center">
                                        <span className="mr-1">Going:</span>
                                        <span className="text-betting-green">{race.going}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Link 
                                    href={`/horse-racing/racecards/handicap-cards/${race.race_id}`}
                                    className="bg-betting-green text-white px-4 py-2 rounded-lg hover:bg-betting-secondary transition font-semibold text-sm"
                                  >
                                    View Racecard
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
                })}
              </div>
            </div>
          )}

          {/* International Racing Section */}
          {internationalTracks.length > 0 && (
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-white mb-6 flex items-center">
                <span className="mr-3">🌍</span>
                International Racing
                <span className="ml-3 text-lg text-gray-400">({internationalTracks.length} tracks)</span>
              </h2>
              
              <div className="space-y-6">
            {internationalTracks.map((track) => {
              const trackSummary = getTrackSummary(track);
              const isExpanded = expandedTracks.includes(track.name);
              const trackImage = getTrackImage(track.name);
              
              return (
                <div key={track.name} className="bg-betting-dark border border-betting-green/20 rounded-xl shadow-lg overflow-hidden">
                  {/* Track Header */}
                  <div 
                    className="p-6 cursor-pointer"
                    onClick={() => toggleTrack(track.name)}
                    style={{
                      backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.7)), url(${trackImage})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-heading text-white" style={{textShadow: '1px 1px 3px rgba(0,0,0,0.9)'}}>{track.name}</h2>
                        <div className="flex items-center gap-6 mt-2 text-sm text-white">
                          <div className="flex items-center">
                            <Clock size={16} className="mr-2 text-betting-green" />
                            First race: {trackSummary.firstRaceTime}
                          </div>
                          <div className="flex items-center">
                            <Trophy size={16} className="mr-2 text-betting-green" />
                            {trackSummary.raceCount} races
                          </div>
                          <div className="flex items-center">
                            <Users size={16} className="mr-2 text-betting-green" />
                            {trackSummary.totalRunners} runners
                          </div>
                          <div className="flex items-center">
                            <MapPin size={16} className="mr-2 text-betting-green" />
                            {trackSummary.totalPrizeMoney}
                            <br />prize money
                          </div>
                        </div>
                      </div>
                      <div className="text-white">
                        {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Race Details */}
                  {isExpanded && (
                    <div className="px-6 pb-6">
                      <div className="border-t border-betting-green/20 pt-6">
                        <div className="grid gap-4">
                          {track.races.map((race, i) => (
                            <div key={race.race_id} className="bg-betting-green/5 border border-betting-green/10 rounded-lg p-4 hover:bg-betting-green/10 transition">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <div className="bg-betting-green/20 text-betting-green px-3 py-1 rounded-lg font-mono font-bold">
                                      {race.time}
                                    </div>
                                    <div className={`px-2 py-1 rounded border text-xs font-semibold ${getRaceTypeColor(race.raceType)}`}>
                                      {race.raceType}
                                    </div>
                                    {(race.race_class || race.pattern) && (
                                      <div className="px-2 py-1 rounded border text-xs font-semibold bg-orange-500/20 text-orange-400 border-orange-500/30">
                                        {formatRaceClassAndPattern(race.race_class, race.pattern)}
                                      </div>
                                    )}
                                    {race.big_race && (
                                      <div className="px-2 py-1 rounded border text-xs font-semibold bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                                        BIG RACE
                                      </div>
                                    )}
                                  </div>
                                  <h3 className="text-lg font-semibold text-white mb-1">{race.name}</h3>
                                  <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <div className="flex items-center">
                                      <Clock size={14} className="mr-1" />
                                      {race.distance}
                                    </div>
                                    <div className="flex items-center">
                                      <Trophy size={14} className="mr-1" />
                                      {race.prize}
                                    </div>
                                    <div className="flex items-center">
                                      <Users size={14} className="mr-1" />
                                      {race.runners} runners
                                    </div>
                                    {race.going && race.going !== 'Unknown' && (
                                      <div className="flex items-center">
                                        <span className="mr-1">Going:</span>
                                        <span className="text-betting-green">{race.going}</span>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Link 
                                    href={`/horse-racing/racecards/handicap-cards/${race.race_id}`}
                                    className="bg-betting-green text-white px-4 py-2 rounded-lg hover:bg-betting-secondary transition font-semibold text-sm"
                                  >
                                    View Racecard
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
} 