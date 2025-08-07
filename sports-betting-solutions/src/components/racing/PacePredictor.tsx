import React, { useState } from 'react';

interface PacePredictorProps {
  race: any;
  runners: any[];
}

interface RunnerPosition {
  runner: any;
  edfSection: number; // 1-5 (1 = front, 5 = back)
  subSection: number; // 1-3 within each EDF section
  row: number; // For vertical positioning when horses overlap
  confidence1?: number; // Confidence for pacemap_1
  confidence2?: number; // Confidence for pacemap_2
  edf2?: number; // EDF section from pacemap_2
}

export const PacePredictor: React.FC<PacePredictorProps> = ({ race, runners }) => {
  const [hoveredRunner, setHoveredRunner] = useState<string | null>(null);

  // Parse pacemap data in format "EPF 4 0.505"
  const parsePacemapData = (pacemapString: string): { edf: number; confidence: number } | null => {
    if (!pacemapString || typeof pacemapString !== 'string') return null;
    
    console.log('Parsing pacemap data:', pacemapString);
    
    // Try multiple patterns to be more flexible
    let match = pacemapString.match(/EPF\s+(\d+)\s+([\d.]+)/i);
    if (!match) {
      match = pacemapString.match(/(\d+)\s+([\d.]+)/);
    }
    if (!match) {
      // Try just the number at the beginning
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
      
      console.log('Parsed EDF:', edf, 'Confidence:', confidence);
      
      // Validate EDF is between 1-5
      if (edf >= 1 && edf <= 5 && confidence >= 0 && confidence <= 1) {
        return { edf, confidence };
      }
    }
    
    console.log('Failed to parse:', pacemapString);
    return null;
  };

  // Calculate EDF (Early Dominating Factor) positions using pacemap_1 and pacemap_2
  const calculatePacePositions = (): RunnerPosition[] => {
    if (!runners || runners.length === 0) return [];

    const positions: RunnerPosition[] = [];

    // First pass: assign all horses to their EDF 1 position (middle sub-section)
    runners.forEach((runner, index) => {
      // Access timeform data - it might be an array or direct properties
      let pacemap1String, pacemap2String;
      
      if (Array.isArray(runner.timeform) && runner.timeform.length > 0) {
        pacemap1String = runner.timeform[0].pacemap_1;
        pacemap2String = runner.timeform[0].pacemap_2;
      } else if (runner.timeform && !Array.isArray(runner.timeform)) {
        pacemap1String = runner.timeform.pacemap_1;
        pacemap2String = runner.timeform.pacemap_2;
      } else {
        pacemap1String = runner.pacemap_1;
        pacemap2String = runner.pacemap_2;
      }
      
      console.log(`Horse ${runner.horse_name}: pacemap_1="${pacemap1String}", pacemap_2="${pacemap2String}"`);
      
      const pacemap1Data = parsePacemapData(pacemap1String);
      const pacemap2Data = parsePacemapData(pacemap2String);
      
      if (pacemap1Data) {
        positions.push({
          runner,
          edfSection: pacemap1Data.edf,
          subSection: 2, // Start in center of middle 3 sub-sections
          row: 2, // Start in default middle racing lane
          confidence1: pacemap1Data.confidence,
          confidence2: pacemap2Data?.confidence || 0,
          edf2: pacemap2Data?.edf || pacemap1Data.edf
        });
      } else {
        // Distribute horses across different EDF sections instead of all in 3
        const edfSection = (index % 5) + 1; // 1-5
        positions.push({
          runner,
          edfSection,
          subSection: 2, // Center of middle 3 sub-sections
          row: 2, // Default middle racing lane
          confidence1: 0.5,
          confidence2: 0.5,
          edf2: edfSection
        });
      }
    });

    // Group by EDF section
    const sectionGroups: { [key: number]: RunnerPosition[] } = {};
    positions.forEach(pos => {
      if (!sectionGroups[pos.edfSection]) {
        sectionGroups[pos.edfSection] = [];
      }
      sectionGroups[pos.edfSection].push(pos);
    });

    // Process each EDF section
    Object.keys(sectionGroups).forEach(sectionKey => {
      const section = parseInt(sectionKey);
      const horses = sectionGroups[section];
      
      if (horses.length === 1) {
        // Single horse stays in middle
        return;
      }
      
      // Sort by confidence (highest first)
      horses.sort((a, b) => (b.confidence1 || 0) - (a.confidence1 || 0));
      
      // Highest confidence stays in middle (subSection 2)
      horses[0].subSection = 2;
      
      // Move others towards their EDF 2 preference
      for (let i = 1; i < horses.length; i++) {
        const horse = horses[i];
        const edf2 = horse.edf2 || section;
        
        if (edf2 < section) {
          // Prefers earlier position, move to sub-section 1
          horse.subSection = 1;
        } else if (edf2 > section) {
          // Prefers later position, move to sub-section 3
          horse.subSection = 3;
        } else {
          // Same preference, assign based on confidence
          horse.subSection = i % 2 === 1 ? 1 : 3;
        }
      }
      
      // Handle cases where 3+ horses are still in same sub-section
      const subSectionGroups: { [key: number]: RunnerPosition[] } = {};
      horses.forEach(horse => {
        if (!subSectionGroups[horse.subSection]) {
          subSectionGroups[horse.subSection] = [];
        }
        subSectionGroups[horse.subSection].push(horse);
      });
      
      // If any sub-section has 3+ horses, move the least confident
      Object.keys(subSectionGroups).forEach(subKey => {
        const subSection = parseInt(subKey);
        const subHorses = subSectionGroups[subSection];
        
        if (subHorses.length >= 3) {
          // Sort by confidence (lowest first for moving)
          subHorses.sort((a, b) => (a.confidence1 || 0) - (b.confidence1 || 0));
          
          // Move least confident horse
          const horseToMove = subHorses[0];
          const edf2 = horseToMove.edf2 || section;
          
          if (edf2 !== section) {
            // Move further in EDF 2 direction
            if (edf2 < section && subSection > 1) {
              horseToMove.subSection = 1;
            } else if (edf2 > section && subSection < 3) {
              horseToMove.subSection = 3;
            } else {
              // Assign to opposite end
              horseToMove.subSection = subSection === 1 ? 3 : 1;
            }
          }
        }
      });
    });

    // Assign rows for horses in the same section/sub-section (3 usable rows, prefer bottom half)
    const finalGroups: { [key: string]: RunnerPosition[] } = {};
    positions.forEach(pos => {
      const key = `${pos.edfSection}-${pos.subSection}`;
      if (!finalGroups[key]) {
        finalGroups[key] = [];
      }
      finalGroups[key].push(pos);
    });

    Object.values(finalGroups).forEach(group => {
      group.forEach((pos, index) => {
        if (index === 0) {
          pos.row = 2; // First horse stays in default middle row
        } else if (index === 1) {
          pos.row = 3; // Second horse goes to bottom row (frequently used)
        } else {
          pos.row = 1; // Additional horses go to top usable row (least used)
        }
      });
    });

    console.log('Final positions calculated:', positions.length);
    return positions;
  };

  const positions = calculatePacePositions();
  console.log('Positions for rendering:', positions);

  // Get horizontal position (5 EDF sections, 3 sub-sections each) - REVERSED: EPF 1 on right
  const getSectionX = (section: number, subSection: number): number => {
    const sectionWidth = 20; // 20% per EDF section (100% / 5 sections)
    // Reverse the sections: EDF 1 = rightmost, EDF 5 = leftmost
    const reversedSection = 6 - section; // 1->5, 2->4, 3->3, 4->2, 5->1
    const baseX = (reversedSection - 1) * sectionWidth;
    
    // 3 sub-sections within each EDF section
    const subSectionWidth = sectionWidth / 3; // ~6.67% each
    const subSectionOffset = (subSection - 1) * subSectionWidth;
    
    return baseX + subSectionOffset + (subSectionWidth / 2); // Center within sub-section
  };

  // Get Y position based on row (3 usable rows, top row never used)
  const getRowY = (row: number): number => {
    switch (row) {
      case 1: return 50; // Top usable row (least used) - moved down by 10%
      case 2: return 70; // Middle row (DEFAULT - most used) - moved down by 10%
      case 3: return 90; // Bottom row (frequently used) - moved down by 5%
      default: return 70; // Default to middle row
    }
  };

  return (
    <div className="mb-6">
      <div className="relative">
        {/* Pacemap Background */}
        <div 
          className="relative w-full rounded-lg overflow-hidden border border-gray-600/30"
          style={{
            height: '200px',
            backgroundImage: 'url(/images/753EF568-9468-4598-BEF3-43A623561764.jpg)',
            backgroundSize: '100% 100%',
            backgroundPosition: 'center center',
            backgroundRepeat: 'no-repeat'
          }}
        >
                {/* Dark overlay for better contrast */}
                <div className="absolute inset-0 bg-black/40"></div>
                
                {/* Corner Labels - Front (right) and Back (left) */}
                <div className="absolute top-2 right-4 text-white text-sm font-bold bg-black/60 px-2 py-1 rounded">
                  Front
                </div>
                <div className="absolute top-2 left-4 text-white text-sm font-bold bg-black/60 px-2 py-1 rounded">
                  Back
                </div>

                {/* Section Dividers */}
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="absolute top-0 bottom-0 w-px bg-white/30"
                    style={{ left: `${i * 20}%` }}
                  />
                ))}

                {/* Horse Silks Positioned */}
                {positions.map((pos, index) => (
                  <div
                    key={`${pos.runner.id}-${index}`}
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-110"
                    style={{
                      left: `${getSectionX(pos.edfSection, pos.subSection)}%`,
                      top: `${getRowY(pos.row)}%`,
                      zIndex: hoveredRunner === pos.runner.horse_name ? 1000 : 10
                    }}
                    onMouseEnter={() => setHoveredRunner(pos.runner.horse_name)}
                    onMouseLeave={() => setHoveredRunner(null)}
                  >
                    {/* Silk Image */}
                    {pos.runner.silk_url ? (
                      <img
                        src={pos.runner.silk_url}
                        alt={`${pos.runner.horse_name} silks`}
                        className="w-12 h-9 object-contain shadow-md"
                      />
                    ) : (
                      <div className="w-12 h-9 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center shadow-md">
                        <span className="text-white text-xs font-bold">
                          {pos.runner.number}
                        </span>
                      </div>
                    )}

                    {/* Horse Name Tooltip */}
                    {hoveredRunner === pos.runner.horse_name && (
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/90 text-white text-xs px-2 py-1 rounded whitespace-nowrap shadow-lg border border-gray-600/50">
                        #{pos.runner.number} {pos.runner.horse_name}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
    </div>
  );
}; 