import React, { useState, useRef, useEffect } from 'react';

interface StatsData {
  lifetime?: string;
  twelve_months?: string;
  three_months?: string;
  trainer?: string;
  trainer_3_months?: string;
  course?: string;
  owner?: string;
}

interface StatsTooltipProps {
  name: string;
  type: 'jockey' | 'trainer';
  statsData: StatsData;
  children: React.ReactNode;
  disabled?: boolean;
}

const StatsTooltip: React.FC<StatsTooltipProps> = ({
  name,
  type,
  statsData,
  children,
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleMouseEnter = (e: React.MouseEvent) => {
    if (disabled) return;
    
    clearTimeout(timeoutRef.current);
    
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      setPosition({
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
    }
    
    setIsVisible(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 100);
  };

  const handleTooltipEnter = () => {
    clearTimeout(timeoutRef.current);
  };

  const handleTooltipLeave = () => {
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const parseStats = (statsString: string) => {
    if (!statsString || statsString === '0,0,0.0,0.00') return null;
    const parts = statsString.split(',');
    if (parts.length !== 4) return null;
    
    return {
      runs: parseInt(parts[0]) || 0,
      wins: parseInt(parts[1]) || 0,
      winPercentage: parseFloat(parts[2]) || 0,
      profitLoss: parseFloat(parts[3]) || 0
    };
  };

  const getRowLabel = (key: string, type: 'jockey' | 'trainer') => {
    const labels = {
      jockey: {
        lifetime: 'Jockey Lifetime',
        twelve_months: 'Jockey 12 Months',
        three_months: 'Jockey 3 Months',
        trainer: 'Jockey / Trainer',
        trainer_3_months: 'J/T 3 Months',
        course: 'Jockey / Course',
        owner: 'Jockey / Owner'
      },
      trainer: {
        lifetime: 'Trainer Lifetime',
        twelve_months: 'Trainer 12 Months',
        three_months: 'Trainer 3 Months',
        trainer: 'Trainer / Jockey',
        trainer_3_months: 'T/J 3 Months',
        course: 'Trainer / Course',
        owner: 'Trainer / Owner'
      }
    };
    
    return labels[type][key as keyof typeof labels[typeof type]] || key;
  };

  const hasValidData = Object.values(statsData).some(value => 
    value && value !== '0,0,0.0,0.00' && parseStats(value)
  );

  const validRows = Object.entries(statsData).filter(([key, value]) => {
    return value && value !== '0,0,0.0,0.00' && parseStats(value);
  });

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className="inline-block"
      >
        {children}
      </div>

      {isVisible && hasValidData && (
        <div
          ref={tooltipRef}
          onMouseEnter={handleTooltipEnter}
          onMouseLeave={handleTooltipLeave}
          className="fixed z-50 pointer-events-auto"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="bg-gray-900/95 backdrop-blur-sm border border-gray-600/50 rounded shadow-xl p-2">
            <table className="text-xs text-white border-collapse">
              <thead>
                <tr className="border-b border-gray-600/50">
                  <th className="text-left pr-3 pb-1 font-normal text-gray-300"></th>
                  <th className="text-center px-2 pb-1 font-normal text-gray-300">Runs</th>
                  <th className="text-center px-2 pb-1 font-normal text-gray-300">Wins</th>
                  <th className="text-center px-2 pb-1 font-normal text-gray-300">Win%</th>
                  <th className="text-center pl-2 pb-1 font-normal text-gray-300">P/L</th>
                </tr>
              </thead>
              <tbody>
                {validRows.map(([key, value]) => {
                  const stats = parseStats(value);
                  if (!stats) return null;

                  return (
                    <tr key={key} className="border-b border-gray-700/30 last:border-b-0">
                      <td className="text-left pr-3 py-1 text-gray-200 text-xs">
                        {getRowLabel(key, type)}
                      </td>
                      <td className="text-center px-2 py-1 font-mono text-xs">
                        {stats.runs}
                      </td>
                      <td className="text-center px-2 py-1 font-mono text-xs">
                        {stats.wins}
                      </td>
                      <td className="text-center px-2 py-1 font-mono text-xs">
                        {stats.winPercentage.toFixed(1)}%
                      </td>
                      <td className="text-center pl-2 py-1 font-mono text-xs">
                        {stats.profitLoss >= 0 ? '+' : ''}{stats.profitLoss.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Tooltip Arrow */}
          <div
            className="absolute left-1/2 transform -translate-x-1/2 -bottom-1"
            style={{ top: '100%' }}
          >
            <div className="w-2 h-2 bg-gray-900/95 border-r border-b border-gray-600/50 transform rotate-45"></div>
          </div>
        </div>
      )}
    </>
  );
};

export default StatsTooltip; 