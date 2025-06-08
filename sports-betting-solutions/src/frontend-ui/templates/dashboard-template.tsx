'use client';

import React from 'react';
import { useEffect, useState } from 'react';
import { 
  TrendingUp,
  Percent,
  Target,
  DollarSign,
  Activity,
  Award
} from "lucide-react";

// Stat card component for dashboard
interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  accent: 'primary' | 'success' | 'warning' | 'danger';
  change?: {
    value: string;
    positive: boolean;
  };
}

export function StatCard({ title, value, icon, accent, change }: StatCardProps) {
  const accentClasses = {
    primary: 'bg-blue-50 text-blue-600 border-blue-100',
    success: 'bg-green-50 text-green-600 border-green-100',
    warning: 'bg-amber-50 text-amber-600 border-amber-100',
    danger: 'bg-red-50 text-red-600 border-red-100'
  };

  return (
    <div className="p-6 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-2 rounded-lg ${accentClasses[accent]}`}>
          {icon}
        </div>
        {change && (
          <div className={`text-xs font-semibold px-2 py-1 rounded-full ${change.positive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {change.value}
          </div>
        )}
      </div>
      <h3 className="text-sm text-gray-500 font-medium">{title}</h3>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </div>
  );
}

// Line chart using SVG
interface ChartDataPoint {
  x: number;
  y: number;
  label: string;
}

interface LineChartProps {
  dataSets: {
    data: ChartDataPoint[];
    name: string;
    color: string;
    dashed?: boolean;
  }[];
  height?: number;
  yAxisLabel?: string;
  xAxisLabel?: string;
  formatLabel?: (value: number) => string;
}

export function SimpleLineChart({ 
  dataSets, 
  height = 400, 
  yAxisLabel = '',
  xAxisLabel = '',
  formatLabel = (value) => `$${value.toFixed(2)}`
}: LineChartProps) {
  // Find chart min and max values for scaling
  const allYValues = dataSets.flatMap(set => set.data.map(d => d.y));
  const minValue = Math.min(...allYValues, 0);
  const maxValue = Math.max(...allYValues, 0);
  const chartRange = Math.max(Math.abs(minValue), Math.abs(maxValue));
  
  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Chart</h3>
        <div className="flex items-center space-x-4">
          {dataSets.map((set, i) => (
            <div key={`legend-${i}`} className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2`} style={{ backgroundColor: set.color }}></div>
              <span className="text-sm text-gray-600">{set.name}</span>
            </div>
          ))}
        </div>
      </div>
      
      <div className={`h-[${height}px] relative`}>
        <div className="w-full h-full relative">
          {/* Chart grid */}
          <div className="absolute inset-0 flex flex-col justify-between border-l border-gray-200">
            <div className="w-full border-t border-gray-200 h-0 relative">
              <span className="absolute -top-3 -left-8 text-xs text-gray-500">{formatLabel(chartRange)}</span>
            </div>
            <div className="w-full border-t border-gray-200 h-0 relative">
              <span className="absolute -top-3 -left-8 text-xs text-gray-500">{formatLabel(chartRange/2)}</span>
            </div>
            <div className="w-full border-t border-gray-200 h-0 relative">
              <span className="absolute -top-3 -left-8 text-xs text-gray-500">{formatLabel(0)}</span>
            </div>
            <div className="w-full border-t border-gray-200 h-0 relative">
              <span className="absolute -top-3 -left-8 text-xs text-gray-500">{formatLabel(-chartRange/2)}</span>
            </div>
            <div className="w-full border-t border-gray-200 h-0 relative">
              <span className="absolute -top-3 -left-8 text-xs text-gray-500">{formatLabel(-chartRange)}</span>
            </div>
          </div>
          
          {/* Zero line */}
          <div className="absolute left-0 right-0 top-1/2 h-[1px] bg-gray-300"></div>
          
          {/* Data lines */}
          <svg className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
            {dataSets.map((set, setIndex) => (
              <React.Fragment key={`dataset-${setIndex}`}>
                {/* Line */}
                <polyline
                  points={set.data.map((d) => {
                    const x = (d.x) * 100;
                    const y = 50 - (d.y / chartRange) * 50;
                    return `${x}% ${y}%`;
                  }).join(' ')}
                  fill="none"
                  stroke={set.color}
                  strokeWidth="2"
                  strokeDasharray={set.dashed ? "5,5" : "none"}
                  vectorEffect="non-scaling-stroke"
                />
                
                {/* Data points */}
                {set.data.map((d, i) => {
                  const x = (d.x) * 100;
                  const y = 50 - (d.y / chartRange) * 50;
                  return (
                    <circle 
                      key={`point-${setIndex}-${i}`}
                      cx={`${x}%`} 
                      cy={`${y}%`} 
                      r="3" 
                      fill={set.color}
                      className="opacity-0 hover:opacity-100"
                    >
                      <title>{d.label}</title>
                    </circle>
                  );
                })}
              </React.Fragment>
            ))}
          </svg>
          
          {/* X-axis labels */}
          <div className="absolute left-0 right-0 bottom-0 flex justify-between text-xs text-gray-500 px-2">
            {dataSets[0] && dataSets[0].data.length > 0 && (
              <>
                <span>{dataSets[0].data[0].label}</span>
                {dataSets[0].data.length > 4 && (
                  <>
                    <span>{dataSets[0].data[Math.floor(dataSets[0].data.length / 4)].label}</span>
                    <span>{dataSets[0].data[Math.floor(dataSets[0].data.length / 2)].label}</span>
                    <span>{dataSets[0].data[Math.floor(dataSets[0].data.length * 3 / 4)].label}</span>
                  </>
                )}
                <span>{dataSets[0].data[dataSets[0].data.length - 1].label}</span>
              </>
            )}
          </div>
        </div>
      </div>
      
      {xAxisLabel && (
        <div className="mt-2 text-center text-sm text-gray-500">
          {xAxisLabel}
        </div>
      )}
    </div>
  );
}

// Format currency helper
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}; 