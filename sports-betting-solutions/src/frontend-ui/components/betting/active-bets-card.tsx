'use client';

import React from 'react';
import { format } from 'date-fns';
import { Clock, Calendar, TrendingUp, DollarSign, BookOpen } from 'lucide-react';
import { useTheme } from '@/components/providers';

interface ActiveBetsCardProps {
  bet: any;
  onViewDetail: (bet: any) => void;
}

export default function ActiveBetsCard({ bet, onViewDetail }: ActiveBetsCardProps) {
  const { theme } = useTheme();

  // Theme-specific styles
  const getCardBg = () => theme === 'dark' ? 'bg-gray-800' : theme === 'racing' ? 'bg-charcoal-800' : 'bg-white';
  const getTextColor = () => theme === 'dark' || theme === 'racing' ? 'text-white' : 'text-gray-900';
  const getMutedTextColor = () => theme === 'dark' ? 'text-gray-400' : theme === 'racing' ? 'text-gray-300' : 'text-gray-500';
  const getBorderColor = () => theme === 'dark' ? 'border-gray-700' : theme === 'racing' ? 'border-charcoal-700' : 'border-gray-200';
  const getButtonBg = () => theme === 'dark' 
    ? 'bg-gray-700 hover:bg-gray-600 text-white' 
    : theme === 'racing' 
      ? 'bg-racing-600 hover:bg-racing-700 text-white' 
      : 'bg-blue-600 hover:bg-blue-700 text-white';
  const getHighlightColor = () => theme === 'dark' ? 'text-blue-400' : theme === 'racing' ? 'text-racing-500' : 'text-blue-600';
  const getIconColor = () => theme === 'dark' || theme === 'racing' ? 'text-gray-400' : 'text-gray-500';
  const getStatusBadgeBg = () => theme === 'dark' ? 'bg-gray-700' : theme === 'racing' ? 'bg-charcoal-700' : 'bg-blue-100';
  const getStatusBadgeText = () => theme === 'dark' || theme === 'racing' ? 'text-gray-300' : 'text-blue-800';
  
  // Format race date if available
  const raceDate = bet.scheduled_race_time 
    ? format(new Date(bet.scheduled_race_time), 'MMM d, yyyy')
    : 'Unknown date';
    
  // Format race time if available
  const raceTime = bet.scheduled_race_time 
    ? format(new Date(bet.scheduled_race_time), 'h:mm a')
    : 'Unknown time';

  return (
    <div 
      className={`${getCardBg()} rounded-lg border ${getBorderColor()} shadow-sm overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-md transform hover:-translate-y-1`}
      onClick={() => onViewDetail(bet)}
    >
      {/* Status Badge */}
      <div className="relative">
        <div className={`absolute top-3 right-3 ${getStatusBadgeBg()} ${getStatusBadgeText()} text-xs font-medium px-2 py-1 rounded-full`}>
          Active
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4">
        {/* Horse and Track */}
        <h3 className={`font-semibold ${getTextColor()} mb-1 pr-16`}>{bet.horse_name}</h3>
        <p className={`text-sm ${getHighlightColor()} font-medium mb-3`}>{bet.track_name}</p>
        
        {/* Details Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-4">
          {/* Race Date */}
          <div className="flex items-center">
            <Calendar className={`h-4 w-4 mr-1.5 ${getIconColor()}`} />
            <span className={`text-sm ${getMutedTextColor()}`}>{raceDate}</span>
          </div>
          
          {/* Race Time */}
          <div className="flex items-center">
            <Clock className={`h-4 w-4 mr-1.5 ${getIconColor()}`} />
            <span className={`text-sm ${getMutedTextColor()}`}>{raceTime}</span>
          </div>
          
          {/* Bet Type */}
          <div className="flex items-center">
            <BookOpen className={`h-4 w-4 mr-1.5 ${getIconColor()}`} />
            <span className={`text-sm ${getTextColor()}`}>
              {bet.bet_type ? bet.bet_type.charAt(0).toUpperCase() + bet.bet_type.slice(1) : 'Single'} 
              {bet.each_way && ' (E/W)'}
            </span>
          </div>
          
          {/* Odds */}
          <div className="flex items-center">
            <TrendingUp className={`h-4 w-4 mr-1.5 ${getIconColor()}`} />
            <span className={`text-sm ${getTextColor()}`}>{bet.odds || 'N/A'}</span>
          </div>
          
          {/* Stake */}
          <div className="flex items-center col-span-2">
            <DollarSign className={`h-4 w-4 mr-1.5 ${getIconColor()}`} />
            <span className={`text-sm font-medium ${getTextColor()}`}>
              £{bet.stake ? parseFloat(bet.stake).toFixed(2) : '0.00'}
            </span>
          </div>
        </div>
        
        {/* Potential Returns */}
        <div className={`mt-2 pt-2 border-t ${getBorderColor()}`}>
          <div className="flex justify-between items-center">
            <span className={`text-xs ${getMutedTextColor()}`}>Potential Returns:</span>
            <span className={`text-sm font-semibold ${getHighlightColor()}`}>
              £{bet.potential_returns ? parseFloat(bet.potential_returns).toFixed(2) : ((bet.stake || 0) * (bet.odds || 0)).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
      
      {/* Card Footer */}
      <div className={`p-3 border-t ${getBorderColor()} bg-opacity-50 flex justify-center`}>
        <button 
          className={`w-full py-1.5 rounded text-xs font-medium ${getButtonBg()}`}
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail(bet);
          }}
        >
          View Details
        </button>
      </div>
    </div>
  );
} 