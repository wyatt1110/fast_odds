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
        
        setTracks(tracksData);
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
              <Link href="/horse-racing" className="inline-flex items-center text-betting-green hover:text-white mb-4 transition">
                <ArrowLeft size={20} className="mr-2" />
                Back to Horse Racing Hub
              </Link>
              <h1 className="text-4xl font-heading text-betting-green mb-2">Today's Racecards</h1>
              <p className="text-lg text-gray-300 max-w-3xl">
                Loading today's race information...
              </p>
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
              <Link href="/horse-racing" className="inline-flex items-center text-betting-green hover:text-white mb-4 transition">
                <ArrowLeft size={20} className="mr-2" />
                Back to Horse Racing Hub
              </Link>
              <h1 className="text-4xl font-heading text-betting-green mb-2">Today's Racecards</h1>
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
              <Link href="/horse-racing" className="inline-flex items-center text-betting-green hover:text-white mb-4 transition">
                <ArrowLeft size={20} className="mr-2" />
                Back to Horse Racing Hub
              </Link>
              <h1 className="text-4xl font-heading text-betting-green mb-2">Today's Racecards</h1>
              <p className="text-lg text-gray-300 max-w-3xl">
                No races scheduled for today or all races have finished.
              </p>
            </div>
            
            {/* UK Date Debug Info */}
            {ukDateInfo && (
              <div className="mb-6">
                <button 
                  onClick={() => setShowDebugInfo(!showDebugInfo)}
                  className="flex items-center text-sm text-gray-400 hover:text-betting-green transition"
                >
                  <Info size={16} className="mr-2" />
                  {showDebugInfo ? 'Hide' : 'Show'} Date Info
                </button>
                
                {showDebugInfo && (
                  <div className="mt-2 bg-gray-800/50 border border-gray-600 rounded-lg p-4 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-400">UK Time:</span>
                        <span className="ml-2 text-white">{new Date(ukDateInfo.ukTime).toLocaleString('en-GB')}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Race Date:</span>
                        <span className="ml-2 text-betting-green">{ukDateInfo.raceDate}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">After Cutoff:</span>
                        <span className="ml-2 text-white">{ukDateInfo.isAfterCutoff ? 'Yes' : 'No (before 00:30)'}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <div className="bg-betting-green/10 border border-betting-green/30 rounded-xl p-8 text-center">
              <Trophy size={48} className="text-betting-green mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-betting-green mb-2">No Races Today</h3>
              <p className="text-gray-300 mb-4">
                There are currently no active races scheduled for {ukDateInfo?.raceDate || 'today'}. Check back tomorrow for new racecards.
              </p>
              <Link 
                href="/horse-racing" 
                className="bg-betting-green text-white px-6 py-2 rounded-lg hover:bg-betting-secondary transition inline-block"
              >
                Explore Horse Racing Hub
              </Link>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-betting-dark text-white py-8 font-sans">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link href="/horse-racing" className="inline-flex items-center text-betting-green hover:text-white mb-4 transition">
              <ArrowLeft size={20} className="mr-2" />
              Back to Horse Racing Hub
            </Link>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-heading text-betting-green mb-2">Today's Racecards</h1>
                <p className="text-lg text-gray-300 max-w-3xl">
                  Complete race information for all today's meetings. View runners, form, and betting odds for every race.
                </p>
                {ukDateInfo && (
                  <p className="text-sm text-gray-400 mt-2">
                    Showing races for: <span className="text-betting-green font-semibold">{ukDateInfo.raceDate}</span>
                  </p>
                )}
              </div>
              
              {/* UK Date Debug Info */}
              {ukDateInfo && (
                <div className="text-right">
                  <button 
                    onClick={() => setShowDebugInfo(!showDebugInfo)}
                    className="flex items-center text-sm text-gray-400 hover:text-betting-green transition"
                  >
                    <Info size={16} className="mr-2" />
                    {showDebugInfo ? 'Hide' : 'Show'} Date Info
                  </button>
                  
                  {showDebugInfo && (
                    <div className="mt-2 bg-gray-800/50 border border-gray-600 rounded-lg p-4 text-sm text-left">
                      <div className="space-y-2">
                        <div>
                          <span className="text-gray-400">UK Time:</span>
                          <span className="ml-2 text-white">{new Date(ukDateInfo.ukTime).toLocaleString('en-GB')}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Race Date:</span>
                          <span className="ml-2 text-betting-green">{ukDateInfo.raceDate}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">After Cutoff:</span>
                          <span className="ml-2 text-white">{ukDateInfo.isAfterCutoff ? 'Yes' : 'No (before 00:30)'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Track Images:</span>
                          <span className="ml-2 text-white">{trackImages.length} loaded</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-betting-green/10 border border-betting-green/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-betting-green">{stats.totalTracks}</div>
              <div className="text-sm text-gray-300">Active Tracks</div>
            </div>
            <div className="bg-betting-green/10 border border-betting-green/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-betting-green">{stats.totalRaces}</div>
              <div className="text-sm text-gray-300">Total Races</div>
            </div>
            <div className="bg-betting-green/10 border border-betting-green/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-betting-green">{stats.totalRunners}</div>
              <div className="text-sm text-gray-300">Total Runners</div>
            </div>
            <div className="bg-betting-green/10 border border-betting-green/30 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-betting-green">{stats.totalPrizeMoney}</div>
              <div className="text-sm text-gray-300">Prize Money</div>
            </div>
          </div>

          {/* Racecards */}
          <div className="space-y-6">
            {tracks.map((track) => {
              const summary = getTrackSummary(track);
              const isExpanded = expandedTracks.includes(track.name);
              const trackImageUrl = getTrackImage(track.name);
              
              return (
                <div key={track.name} className="bg-betting-dark border border-betting-green/20 rounded-xl shadow-lg">
                  {/* Track Summary Header */}
                  <div 
                    className="p-6 cursor-pointer hover:bg-betting-green/5 transition rounded-xl"
                    onClick={() => toggleTrack(track.name)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {/* Track Image */}
                        <div className="w-16 h-16 mr-4 rounded-lg overflow-hidden bg-gray-700 flex-shrink-0">
                          {imagesLoading ? (
                            <div className="w-full h-full bg-betting-green/20 animate-pulse flex items-center justify-center">
                              <MapPin size={20} className="text-betting-green" />
                            </div>
                          ) : (
                            <img 
                              src={trackImageUrl}
                              alt={`${track.name} racing`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = '/images/fallback-track.jpg';
                              }}
                            />
                          )}
                        </div>
                        
                        <div>
                          <h2 className="text-2xl font-heading text-betting-green">{track.name}</h2>
                          <div className="flex items-center gap-6 mt-2 text-sm text-gray-300">
                            <div className="flex items-center">
                              <Clock size={14} className="mr-1 text-betting-green" />
                              First race: {summary.firstRaceTime}
                            </div>
                            <div className="flex items-center">
                              <Trophy size={14} className="mr-1 text-betting-green" />
                              {summary.raceCount} races
                            </div>
                            <div className="flex items-center">
                              <Users size={14} className="mr-1 text-betting-green" />
                              {summary.totalRunners} runners
                            </div>
                            <div className="flex items-center">
                              <span className="text-betting-green font-semibold">{summary.totalPrizeMoney}</span>
                              <span className="ml-1">prize money</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-sm text-gray-400 text-right">
                          <div>Click to {isExpanded ? 'hide' : 'view'} races</div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp size={24} className="text-betting-green" />
                        ) : (
                          <ChevronDown size={24} className="text-betting-green" />
                        )}
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

          {/* Premium Features Banner */}
          <div className="mt-12 bg-gradient-to-r from-betting-green/10 to-betting-dark/80 border border-betting-green/30 rounded-xl p-8">
            <div className="text-center">
              <h3 className="text-2xl font-heading text-betting-green mb-4">Unlock Premium Race Analysis</h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Get detailed form analysis, speed figures, trainer/jockey statistics, and AI-powered predictions for every race with Turf Tracker Premium.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/turf-tracker" className="bg-betting-green text-white px-8 py-3 rounded-lg hover:bg-betting-secondary transition font-semibold">
                  Upgrade to Premium
                </Link>
                <Link href="/horse-racing/data" className="border border-betting-green text-betting-green px-8 py-3 rounded-lg hover:bg-betting-green hover:text-white transition font-semibold">
                  View Free Data
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 