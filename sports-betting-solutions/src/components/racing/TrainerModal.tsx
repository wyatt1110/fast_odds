'use client';

import React, { useState, useEffect } from 'react';
import { X, User, Calendar, TrendingUp, MapPin, Users, Crown } from 'lucide-react';

interface TrainerStats {
  rides: number;
  wins: number;
  win_percentage: number;
  profit_loss: number;
}

interface TrainerModalData {
  scenario: {
    trainer_name: string;
    jockey?: string;
    course?: string;
    owner?: string;
    horse_age?: string;
  };
  trainer_id: string;
  table_data: {
    [key: string]: TrainerStats;
  };
  execution_time_seconds?: number;
}

interface TrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainerName: string;
  contextData?: {
    jockey?: string;
    course?: string;
    owner?: string;
    horse_age?: string;
  };
}

const TrainerModal: React.FC<TrainerModalProps> = ({
  isOpen,
  onClose,
  trainerName,
  contextData = {}
}) => {
  const [data, setData] = useState<TrainerModalData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [loadingStage, setLoadingStage] = useState<string>('');

  // Fetch trainer data
  const fetchTrainerData = async () => {
    if (!trainerName) return;

    setLoading(true);
    setError('');
    setData(null);
    try {
      setLoadingStage('Searching trainer...');
      
      const response = await fetch('/api/racing/trainer-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainer_name: trainerName,
          ...contextData
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch trainer data');
      }

      const result = await response.json();
      
      // Validate the response data
      if (!result || !result.table_data) {
        throw new Error('Invalid response format from trainer analysis API');
      }
      
      // Ensure all table data entries have valid stats
      Object.keys(result.table_data).forEach(key => {
        if (!result.table_data[key]) {
          result.table_data[key] = { rides: 0, wins: 0, win_percentage: 0, profit_loss: 0 };
        }
      });
      
      setData(result);
      setLoadingStage('');
    } catch (err) {
      console.error('Error fetching trainer data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load trainer data');
      setLoadingStage('');
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen && trainerName) {
      fetchTrainerData();
    }
  }, [isOpen, trainerName, contextData]);

  // Close modal on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getRowIcon = (variable: string) => {
    if (variable.includes('Lifetime')) return <User className="w-4 h-4" />;
    if (variable.includes('Months')) return <Calendar className="w-4 h-4" />;
    if (variable.includes('Age')) return <TrendingUp className="w-4 h-4" />;
    if (variable.includes('Course')) return <MapPin className="w-4 h-4" />;
    if (variable.includes('Jockey')) return <Users className="w-4 h-4" />;
    if (variable.includes('Owner')) return <Crown className="w-4 h-4" />;
    return <TrendingUp className="w-4 h-4" />;
  };

  const getWinPercentageColor = (percentage: number) => {
    if (percentage >= 20) return 'text-green-400';
    if (percentage >= 10) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getProfitLossColor = (value: number) => {
    if (value >= 10) return 'text-green-400';
    if (value >= -9) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gradient-to-r from-gray-800 to-gray-900">
          <div className="flex-1 text-center">
            <h2 className="text-xl font-bold text-white">{trainerName}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Context Info */}
        {contextData && Object.keys(contextData).length > 0 && (
          <div className="p-4 bg-gray-800/50 border-b border-gray-700">
            <div className="flex flex-wrap gap-4 text-sm">
              {contextData.course && (
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">Course: <span className="text-white font-medium">{contextData.course}</span></span>
                </div>
              )}
              {contextData.horse_age && (
                <div className="flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">Horse Age: <span className="text-white font-medium">{contextData.horse_age}</span></span>
                </div>
              )}
              {contextData.jockey && (
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">Jockey: <span className="text-white font-medium">{contextData.jockey}</span></span>
                </div>
              )}
              {contextData.owner && (
                <div className="flex items-center space-x-2">
                  <Crown className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-300">Owner: <span className="text-white font-medium">{contextData.owner}</span></span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {loading && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-betting-green mb-4"></div>
              <p className="text-gray-400 text-lg">{loadingStage || 'Loading trainer data...'}</p>
              <p className="text-gray-500 text-sm mt-2">This may take 10-15 seconds</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-400" />
              </div>
              <p className="text-red-400 text-lg mb-2">Failed to load data</p>
              <p className="text-gray-500 text-sm text-center">{error}</p>
              <button
                onClick={fetchTrainerData}
                className="mt-4 px-4 py-2 bg-betting-green hover:bg-betting-green/80 text-white rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {data && !loading && (
            <div className="space-y-6">
              {/* Performance Table */}
              <div className="bg-gray-800/50 rounded-xl overflow-hidden">
                <div className="bg-gray-800 px-4 py-3 border-b border-gray-700">
                  <h3 className="text-base font-semibold text-white">Performance Statistics</h3>
                  {data.execution_time_seconds && (
                    <p className="text-gray-400 text-xs">Loaded in {data.execution_time_seconds}s</p>
                  )}
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-800/80">
                      <tr>
                        <th className="text-left px-4 py-3 text-gray-300 font-semibold text-sm">Variable</th>
                        <th className="text-center px-3 py-3 text-gray-300 font-semibold text-sm">Rides</th>
                        <th className="text-center px-3 py-3 text-gray-300 font-semibold text-sm">Wins</th>
                        <th className="text-center px-3 py-3 text-gray-300 font-semibold text-sm">Win %</th>
                        <th className="text-center px-3 py-3 text-gray-300 font-semibold text-sm">P/L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(data.table_data).map(([variable, stats], index) => (
                        <tr
                          key={variable}
                          className={`border-b border-gray-700/50 hover:bg-gray-800/30 transition-colors ${
                            index % 2 === 0 ? 'bg-gray-900/20' : 'bg-gray-800/20'
                          }`}
                        >
                          <td className="px-4 py-3">
                            <span className="text-white font-medium text-sm">{variable}</span>
                          </td>
                          <td className="text-center px-3 py-3 text-gray-300 font-mono text-sm">
                            {(stats?.rides ?? 0).toLocaleString()}
                          </td>
                          <td className="text-center px-3 py-3 text-gray-300 font-mono text-sm">
                            {(stats?.wins ?? 0).toLocaleString()}
                          </td>
                          <td className="text-center px-3 py-3 font-mono font-semibold text-sm">
                            <span className={getWinPercentageColor(stats?.win_percentage ?? 0)}>
                              {(stats?.win_percentage ?? 0)}%
                            </span>
                          </td>
                          <td className="text-center px-3 py-3 font-mono font-semibold text-sm">
                            <span className={getProfitLossColor(stats?.profit_loss ?? 0)}>
                              {(stats?.profit_loss ?? 0) > 0 ? '+' : ''}{(stats?.profit_loss ?? 0)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainerModal; 