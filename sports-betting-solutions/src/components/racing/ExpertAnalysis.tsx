import React from 'react';

interface Race {
  draw_bias: string | null;
  pace_forecast: string | null;
  [key: string]: any;
}

interface Timeform {
  pacemap_1: string | null;
  pacemap_2: string | null;
  pace_forecast: string | null;
  draw_bias: string | null;
  [key: string]: any;
}

interface Runner {
  id: number;
  horse_name: string;
  timeform?: Timeform | Timeform[];
  pacemap_1?: string; // Fallback if timeform is not an object/array
  pacemap_2?: string; // Fallback if timeform is not an object/array
  [key: string]: any;
}

interface ExpertAnalysisProps {
  race: Race;
  runners: Runner[];
}

export const ExpertAnalysis: React.FC<ExpertAnalysisProps> = ({ race, runners }) => {

  // Utility to parse pacemap data in format "EPF 4 0.505"
  const parsePacemapData = (pacemapString: string): { edf: number; confidence: number } | null => {
    if (!pacemapString || typeof pacemapString !== 'string') return null;
    
    let match = pacemapString.match(/EPF\s+(\d+)\s+([\d.]+)/i);
    if (!match) {
      match = pacemapString.match(/(\d+)\s+([\d.]+)/);
    }
    if (!match) {
      match = pacemapString.match(/^(\d+)/);
      if (match) {
        const edf = parseInt(match[1]);
        if (edf >= 1 && edf <= 5) {
          return { edf, confidence: 0.5 };
        }
      }
    }
    
    if (match && match.length >= 3) {
      const edf = parseInt(match[1]);
      const confidence = parseFloat(match[2]);
      
      if (edf >= 1 && edf <= 5 && confidence >= 0 && confidence <= 1) {
        return { edf, confidence };
      }
    }
    return null;
  };

  const getExpectedFrontRunner = () => {
    const potentialFrontRunners: { runner: Runner; confidence: number }[] = [];

    runners.forEach(runner => {
      let pacemap1String;
      if (Array.isArray(runner.timeform) && runner.timeform.length > 0) {
        pacemap1String = runner.timeform[0].pacemap_1;
      } else if (runner.timeform && !Array.isArray(runner.timeform)) {
        pacemap1String = runner.timeform.pacemap_1;
      } else {
        pacemap1String = runner.pacemap_1;
      }

      if (pacemap1String) {
        const pacemap1Data = parsePacemapData(pacemap1String);

        if (pacemap1Data && pacemap1Data.edf === 1) {
          potentialFrontRunners.push({ runner, confidence: pacemap1Data.confidence });
        }
      }
    });

    if (potentialFrontRunners.length > 0) {
      potentialFrontRunners.sort((a, b) => b.confidence - a.confidence);
      const actualBestFrontRunner = potentialFrontRunners[0];
      return `${actualBestFrontRunner.runner.horse_name} is ${Math.round(actualBestFrontRunner.confidence * 100)}% likely to be the front runner.`;
    } else {
      return "No clear front runner in this race.";
    }
  };

  const getDrawBias = (): string | null => {
    // First try to get from race object as before
    if (race?.draw_bias) {
      return race.draw_bias;
    }

    // If not found in race, try to get from the first runner's timeform data
    for (const runner of runners) {
      if (Array.isArray(runner.timeform) && runner.timeform.length > 0) {
        if (runner.timeform[0].draw_bias) {
          return runner.timeform[0].draw_bias;
        }
      } else if (runner.timeform && !Array.isArray(runner.timeform)) {
        if (runner.timeform.draw_bias) {
          return runner.timeform.draw_bias;
        }
      }
    }
    
    return null;
  };

  const getPaceForecast = (): string | null => {
    // First try to get from race object as before
    if (race?.pace_forecast) {
      return race.pace_forecast;
    }

    // If not found in race, try to get from the first runner's timeform data
    for (const runner of runners) {
      if (Array.isArray(runner.timeform) && runner.timeform.length > 0) {
        if (runner.timeform[0].pace_forecast) {
          return runner.timeform[0].pace_forecast;
        }
      } else if (runner.timeform && !Array.isArray(runner.timeform)) {
        if (runner.timeform.pace_forecast) {
          return runner.timeform.pace_forecast;
        }
      }
    }
    
    return null;
  };

  const expectedFrontRunnerText = getExpectedFrontRunner();

  return (
    <div className="mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Draw Bias */}
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-lg p-4 border border-gray-600/20">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
            <h4 className="text-sm font-semibold text-gray-200">Draw Bias</h4>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed"><span className="font-medium">{getDrawBias() || 'N/A'}</span></p>
        </div>

        {/* Pace Forecast */}
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-lg p-4 border border-gray-600/20">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
            <h4 className="text-sm font-semibold text-gray-200">Pace Forecast</h4>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed"><span className="font-medium">{getPaceForecast() || 'N/A'}</span></p>
        </div>

        {/* Expected Front Runner */}
        <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-lg p-4 border border-gray-600/20">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            <h4 className="text-sm font-semibold text-gray-200">Expected Front Runner</h4>
          </div>
          <p className="text-gray-300 text-sm leading-relaxed"><span className="font-medium">{expectedFrontRunnerText}</span></p>
        </div>
      </div>
    </div>
  );
}; 