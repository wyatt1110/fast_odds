'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import Layout from "@/components/layout/Layout";

interface Horse {
  id: number;
  name: string;
  odds: string;
  status: 'win' | 'place' | 'loss';
}

interface BetType {
  name: string;
  horses: number;
  bets: number;
}

const BET_TYPES: Record<string, BetType> = {
  single: { name: "Single", horses: 1, bets: 1 },
  double: { name: "Double", horses: 2, bets: 1 },
  treble: { name: "Treble", horses: 3, bets: 1 },
  accumulator: { name: "Accumulator", horses: 4, bets: 1 },
  trixie: { name: "Trixie", horses: 3, bets: 4 },
  patent: { name: "Patent", horses: 3, bets: 7 },
  yankee: { name: "Yankee", horses: 4, bets: 11 },
  lucky15: { name: "Lucky 15", horses: 4, bets: 15 },
  canadian: { name: "Canadian", horses: 5, bets: 26 },
  lucky31: { name: "Lucky 31", horses: 5, bets: 31 },
  heinz: { name: "Heinz", horses: 6, bets: 57 },
  lucky63: { name: "Lucky 63", horses: 6, bets: 63 },
  superheinz: { name: "Super Heinz", horses: 7, bets: 120 },
  goliath: { name: "Goliath", horses: 8, bets: 247 }
};

export default function HorseRacingReturnsPage() {
  const [betType, setBetType] = useState<string>("single");
  const [stake, setStake] = useState<string>("1.00");
  const [oddsFormat, setOddsFormat] = useState<string>("fractional");
  const [eachWay, setEachWay] = useState<boolean>(false);
  const [ewTerms, setEwTerms] = useState<string>("1/4");
  const [ewPlaces, setEwPlaces] = useState<string>("3");
  const [rule4Deduction, setRule4Deduction] = useState<string>("0");
  
  const [horses, setHorses] = useState<Horse[]>([
    { id: 1, name: "Horse 1", odds: "2/1", status: 'loss' }
  ]);
  
  const [results, setResults] = useState({
    totalReturns: 0,
    totalProfit: 0,
    totalStake: 0,
    winningBets: 0,
    breakdown: [] as any[],
    explanation: ""
  });

  const { toast } = useToast();

  // Update horses array when bet type changes
  useEffect(() => {
    const requiredHorses = BET_TYPES[betType]?.horses || 1;
    const currentHorses = horses.length;
    
    if (currentHorses < requiredHorses) {
      // Add more horses
      const newHorses = [...horses];
      for (let i = currentHorses; i < requiredHorses; i++) {
        newHorses.push({
          id: i + 1,
          name: `Horse ${i + 1}`,
          odds: "2/1",
          status: 'loss'
        });
      }
      setHorses(newHorses);
    } else if (currentHorses > requiredHorses && requiredHorses > 0) {
      // Remove excess horses
      setHorses(horses.slice(0, requiredHorses));
    }
  }, [betType]);

  const convertToDecimal = (odds: string, format: string): number => {
    if (format === "decimal") {
      return parseFloat(odds);
    } else if (format === "fractional") {
      const [numerator, denominator] = odds.split("/").map(Number);
      if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
        return 2.0; // Default to evens if invalid
      }
      return numerator / denominator + 1;
    }
    return 2.0;
  };

  const convertFromDecimal = (decimalOdds: number, format: string): string => {
    if (format === "decimal") {
      return decimalOdds.toFixed(2);
    } else {
      const fractionalOdds = decimalOdds - 1;
      if (fractionalOdds === 1) return "1/1";
      if (fractionalOdds === 0.5) return "1/2";
      if (fractionalOdds === 2) return "2/1";
      if (fractionalOdds === 3) return "3/1";
      if (fractionalOdds === 4) return "4/1";
      if (fractionalOdds === 5) return "5/1";
      // For other odds, convert to nearest fraction
      const denominator = 1;
      const numerator = Math.round(fractionalOdds * denominator);
      return `${numerator}/${denominator}`;
    }
  };

  const updateHorse = (id: number, field: keyof Horse, value: any) => {
    setHorses(horses.map(horse => 
      horse.id === id ? { ...horse, [field]: value } : horse
    ));
  };

  const generateCombinations = (arr: any[], size: number): any[][] => {
    if (size === 1) return arr.map(item => [item]);
    if (size === arr.length) return [arr];
    
    const result: any[][] = [];
    for (let i = 0; i <= arr.length - size; i++) {
      const head = arr[i];
      const tailCombinations = generateCombinations(arr.slice(i + 1), size - 1);
      tailCombinations.forEach(tail => result.push([head, ...tail]));
    }
    return result;
  };

  const calculateBetReturns = (selectedHorses: Horse[], stakeAmount: number): number => {
    const rule4 = parseFloat(rule4Deduction) || 0;
    let totalReturns = 0;
    
    // Check if all horses in this combination won
    const allWon = selectedHorses.every(horse => horse.status === 'win');
    const allPlaced = selectedHorses.every(horse => horse.status === 'win' || horse.status === 'place');
    
    if (allWon) {
      // Calculate win returns
      let winReturns = stakeAmount;
      selectedHorses.forEach(horse => {
        const decimalOdds = convertToDecimal(horse.odds, oddsFormat);
        const adjustedOdds = decimalOdds - ((decimalOdds - 1) * rule4 / 100);
        winReturns *= adjustedOdds;
      });
      totalReturns += winReturns;
      
      // Add each way place returns if applicable
      if (eachWay) {
        const [numerator, denominator] = ewTerms.split("/").map(Number);
        const ewFraction = numerator / denominator;
        
        let placeReturns = stakeAmount;
        selectedHorses.forEach(horse => {
          const decimalOdds = convertToDecimal(horse.odds, oddsFormat);
          const adjustedOdds = decimalOdds - ((decimalOdds - 1) * rule4 / 100);
          const placeOdds = 1 + ((adjustedOdds - 1) * ewFraction);
          placeReturns *= placeOdds;
        });
        totalReturns += placeReturns;
      }
    } else if (eachWay && allPlaced) {
      // Each way place returns only
      const [numerator, denominator] = ewTerms.split("/").map(Number);
      const ewFraction = numerator / denominator;
      
      let placeReturns = stakeAmount;
      selectedHorses.forEach(horse => {
        const decimalOdds = convertToDecimal(horse.odds, oddsFormat);
        const adjustedOdds = decimalOdds - ((decimalOdds - 1) * rule4 / 100);
        const placeOdds = 1 + ((adjustedOdds - 1) * ewFraction);
        placeReturns *= placeOdds;
      });
      totalReturns += placeReturns;
    }
    
    return totalReturns;
  };

  const generateExplanation = (breakdown: any[]): string => {
    const winningBets = breakdown.filter(bet => bet.returns > 0);
    const losingBets = breakdown.filter(bet => bet.returns === 0);
    
    let explanation = `Bet Analysis:\n`;
    explanation += `• Total of ${breakdown.length} individual bets placed\n`;
    explanation += `• ${winningBets.length} bets won, ${losingBets.length} bets lost\n`;
    
    if (eachWay) {
      explanation += `• Each way betting: Win and place portions for each bet\n`;
      explanation += `• Place terms: ${ewTerms} odds for placed horses\n`;
    }
    
    if (parseFloat(rule4Deduction) > 0) {
      explanation += `• Rule 4 deduction of ${rule4Deduction}% applied to all odds\n`;
    }
    
    const horseStatuses = horses.map(h => `${h.name}: ${h.status.toUpperCase()}`).join(', ');
    explanation += `• Horse results: ${horseStatuses}`;
    
    return explanation;
  };

  const calculateReturns = () => {
    if (!stake || horses.some(horse => !horse.odds)) {
      toast({
        title: "Missing information",
        description: "Please fill in the stake and all horse odds",
        variant: "destructive"
      });
      return;
    }

    try {
      const stakeAmount = parseFloat(stake);
      if (stakeAmount <= 0) {
        toast({
          title: "Invalid stake",
          description: "Stake must be positive",
          variant: "destructive"
        });
        return;
      }

      const betTypeInfo = BET_TYPES[betType];
      let totalReturns = 0;
      let totalStake = 0;
      let winningBets = 0;
      const breakdown: any[] = [];

      // Calculate total stake including each way
      const baseStake = stakeAmount;
      const eachWayMultiplier = eachWay ? 2 : 1;
      
      if (betType === "single") {
        totalStake = baseStake * eachWayMultiplier;
        const horse = horses[0];
        const returns = calculateBetReturns([horse], baseStake);
        totalReturns = returns;
        if (returns > 0) winningBets = 1;
        breakdown.push({
          type: "Single",
          horses: [horse.name],
          stake: totalStake,
          returns: returns,
          profit: returns - totalStake
        });
      } else {
        // Handle multiple bet types
        const combinations: any[] = [];
        
        // Generate all required combinations based on bet type
        if (betType === "double") {
          combinations.push(...generateCombinations(horses, 2));
        } else if (betType === "treble") {
          combinations.push(...generateCombinations(horses, 3));
        } else if (betType === "accumulator") {
          combinations.push([horses]);
        } else if (betType === "trixie") {
          combinations.push(...generateCombinations(horses, 2)); // 3 doubles
          combinations.push(...generateCombinations(horses, 3)); // 1 treble
        } else if (betType === "patent") {
          combinations.push(...horses.map(h => [h])); // 3 singles
          combinations.push(...generateCombinations(horses, 2)); // 3 doubles
          combinations.push(...generateCombinations(horses, 3)); // 1 treble
        } else if (betType === "yankee") {
          combinations.push(...generateCombinations(horses, 2)); // 6 doubles
          combinations.push(...generateCombinations(horses, 3)); // 4 trebles
          combinations.push(...generateCombinations(horses, 4)); // 1 four-fold
        } else if (betType === "lucky15") {
          combinations.push(...horses.map(h => [h])); // 4 singles
          combinations.push(...generateCombinations(horses, 2)); // 6 doubles
          combinations.push(...generateCombinations(horses, 3)); // 4 trebles
          combinations.push(...generateCombinations(horses, 4)); // 1 four-fold
        } else if (betType === "canadian") {
          combinations.push(...generateCombinations(horses, 2)); // 10 doubles
          combinations.push(...generateCombinations(horses, 3)); // 10 trebles
          combinations.push(...generateCombinations(horses, 4)); // 5 four-folds
          combinations.push(...generateCombinations(horses, 5)); // 1 five-fold
        } else if (betType === "lucky31") {
          combinations.push(...horses.map(h => [h])); // 5 singles
          combinations.push(...generateCombinations(horses, 2)); // 10 doubles
          combinations.push(...generateCombinations(horses, 3)); // 10 trebles
          combinations.push(...generateCombinations(horses, 4)); // 5 four-folds
          combinations.push(...generateCombinations(horses, 5)); // 1 five-fold
        } else if (betType === "heinz") {
          combinations.push(...generateCombinations(horses, 2)); // 15 doubles
          combinations.push(...generateCombinations(horses, 3)); // 20 trebles
          combinations.push(...generateCombinations(horses, 4)); // 15 four-folds
          combinations.push(...generateCombinations(horses, 5)); // 6 five-folds
          combinations.push(...generateCombinations(horses, 6)); // 1 six-fold
        } else if (betType === "lucky63") {
          combinations.push(...horses.map(h => [h])); // 6 singles
          combinations.push(...generateCombinations(horses, 2)); // 15 doubles
          combinations.push(...generateCombinations(horses, 3)); // 20 trebles
          combinations.push(...generateCombinations(horses, 4)); // 15 four-folds
          combinations.push(...generateCombinations(horses, 5)); // 6 five-folds
          combinations.push(...generateCombinations(horses, 6)); // 1 six-fold
        } else if (betType === "superheinz") {
          combinations.push(...generateCombinations(horses, 2)); // 21 doubles
          combinations.push(...generateCombinations(horses, 3)); // 35 trebles
          combinations.push(...generateCombinations(horses, 4)); // 35 four-folds
          combinations.push(...generateCombinations(horses, 5)); // 21 five-folds
          combinations.push(...generateCombinations(horses, 6)); // 7 six-folds
          combinations.push(...generateCombinations(horses, 7)); // 1 seven-fold
        } else if (betType === "goliath") {
          combinations.push(...generateCombinations(horses, 2)); // 28 doubles
          combinations.push(...generateCombinations(horses, 3)); // 56 trebles
          combinations.push(...generateCombinations(horses, 4)); // 70 four-folds
          combinations.push(...generateCombinations(horses, 5)); // 56 five-folds
          combinations.push(...generateCombinations(horses, 6)); // 28 six-folds
          combinations.push(...generateCombinations(horses, 7)); // 8 seven-folds
          combinations.push(...generateCombinations(horses, 8)); // 1 eight-fold
        }

        totalStake = combinations.length * baseStake * eachWayMultiplier;

        combinations.forEach((combination, index) => {
          const returns = calculateBetReturns(combination, baseStake);
          totalReturns += returns;
          if (returns > 0) winningBets++;
          
          const betTypeName = combination.length === 1 ? "Single" :
                             combination.length === 2 ? "Double" :
                             combination.length === 3 ? "Treble" :
                             combination.length === 4 ? "Four-fold" :
                             combination.length === 5 ? "Five-fold" :
                             combination.length === 6 ? "Six-fold" :
                             combination.length === 7 ? "Seven-fold" :
                             "Eight-fold";
          
          breakdown.push({
            type: betTypeName,
            horses: combination.map(h => h.name),
            stake: baseStake * eachWayMultiplier,
            returns: returns,
            profit: returns - (baseStake * eachWayMultiplier)
          });
        });
      }

      const totalProfit = totalReturns - totalStake;
      const explanation = generateExplanation(breakdown);

      setResults({
        totalReturns: Math.round(totalReturns * 100) / 100,
        totalProfit: Math.round(totalProfit * 100) / 100,
        totalStake: Math.round(totalStake * 100) / 100,
        winningBets,
        breakdown,
        explanation
      });

      toast({
        title: "Calculation complete",
        description: `Your ${betTypeInfo.name} returns have been calculated`,
      });
    } catch (error) {
      toast({
        title: "Calculation error",
        description: "There was an error processing your calculation",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    setStake("1.00");
    setOddsFormat("fractional");
    setEachWay(false);
    setEwTerms("1/4");
    setEwPlaces("3");
    setRule4Deduction("0");
    setBetType("single");
    setHorses([
      { id: 1, name: "Horse 1", odds: "2/1", status: 'loss' }
    ]);
    setResults({
      totalReturns: 0,
      totalProfit: 0,
      totalStake: 0,
      winningBets: 0,
      breakdown: [],
      explanation: ""
    });
  };

  const handleOddsFormatChange = (newFormat: string) => {
    // Convert all existing odds to new format
    const updatedHorses = horses.map(horse => ({
      ...horse,
      odds: convertFromDecimal(convertToDecimal(horse.odds, oddsFormat), newFormat)
    }));
    setHorses(updatedHorses);
    setOddsFormat(newFormat);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-betting-dark">
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Horse Racing <span className="text-betting-green">Returns Calculator</span>
            </h1>
            <p className="text-gray-300 mb-8">
              Calculate your potential returns from all types of horse racing bets, including singles, multiples, and complex bets like Patents, Yankees, and Goliaths.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Calculator */}
              <Card className="lg:col-span-2 bg-betting-dark border-betting-green/20">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Bet Configuration</CardTitle>
                  <CardDescription className="text-gray-400">
                    Configure your bet type and horses
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Bet Type and Stake */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="betType" className="text-white">Bet Type</Label>
                      <Select value={betType} onValueChange={setBetType}>
                        <SelectTrigger id="betType" className="bg-betting-dark/50 border-betting-green/20 text-white">
                          <SelectValue placeholder="Select bet type" />
                        </SelectTrigger>
                        <SelectContent className="bg-betting-dark border-betting-green/20 max-h-60">
                          {Object.entries(BET_TYPES).map(([key, type]) => (
                            <SelectItem key={key} value={key}>
                              {type.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stake" className="text-white">Stake per Bet</Label>
                      <Input 
                        id="stake" 
                        type="number" 
                        value={stake} 
                        onChange={(e) => setStake(e.target.value)}
                        className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                        min="0.01"
                        step="0.01"
                        placeholder="£1.00"
                      />
                    </div>
                  </div>

                  {/* Odds Format and Settings */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-betting-green/10">
                    <div className="space-y-2">
                      <Label htmlFor="oddsFormat" className="text-white">Odds Format</Label>
                      <Select value={oddsFormat} onValueChange={handleOddsFormatChange}>
                        <SelectTrigger id="oddsFormat" className="bg-betting-dark/50 border-betting-green/20 text-white">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent className="bg-betting-dark border-betting-green/20">
                          <SelectItem value="fractional">Fractional (e.g., 5/1)</SelectItem>
                          <SelectItem value="decimal">Decimal (e.g., 6.00)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rule4Deduction" className="text-white">Rule 4 (%)</Label>
                      <Input 
                        id="rule4Deduction" 
                        type="number" 
                        value={rule4Deduction} 
                        onChange={(e) => setRule4Deduction(e.target.value)}
                        className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                        min="0"
                        max="90"
                        step="1"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Each Way Section */}
                  <div className="pt-4 border-t border-betting-green/10">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label className="text-white">Each Way Bet</Label>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={eachWay}
                            onCheckedChange={setEachWay}
                          />
                          <span className="text-gray-300 text-sm">
                            {eachWay ? 'Yes' : 'No'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ewTerms" className="text-white">Each Way Terms</Label>
                        <Select value={ewTerms} onValueChange={setEwTerms} disabled={!eachWay}>
                          <SelectTrigger id="ewTerms" className="bg-betting-dark/50 border-betting-green/20 text-white disabled:opacity-50">
                            <SelectValue placeholder="Select terms" />
                          </SelectTrigger>
                          <SelectContent className="bg-betting-dark border-betting-green/20">
                            <SelectItem value="1/4">1/4 odds</SelectItem>
                            <SelectItem value="1/5">1/5 odds</SelectItem>
                            <SelectItem value="1/3">1/3 odds</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ewPlaces" className="text-white">Places Paid</Label>
                        <Select value={ewPlaces} onValueChange={setEwPlaces} disabled={!eachWay}>
                          <SelectTrigger id="ewPlaces" className="bg-betting-dark/50 border-betting-green/20 text-white disabled:opacity-50">
                            <SelectValue placeholder="Select places" />
                          </SelectTrigger>
                          <SelectContent className="bg-betting-dark border-betting-green/20">
                            <SelectItem value="2">2 places</SelectItem>
                            <SelectItem value="3">3 places</SelectItem>
                            <SelectItem value="4">4 places</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Horses Section */}
                  <div className="pt-4 border-t border-betting-green/10">
                    <h3 className="text-lg font-semibold text-white mb-4">
                      Horses ({horses.length} required)
                    </h3>
                    <div className="space-y-4">
                      {horses.map((horse, index) => (
                        <div key={horse.id} className="p-4 bg-betting-dark/30 rounded-lg border border-betting-green/10">
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                            <div className="space-y-2">
                              <Label className="text-white text-sm">Horse Name</Label>
                              <Input 
                                value={horse.name}
                                onChange={(e) => updateHorse(horse.id, 'name', e.target.value)}
                                className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                                placeholder={`Horse ${index + 1}`}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-white text-sm">Odds</Label>
                              <Input 
                                value={horse.odds}
                                onChange={(e) => updateHorse(horse.id, 'odds', e.target.value)}
                                className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                                placeholder={oddsFormat === "fractional" ? "2/1" : "3.00"}
                              />
                            </div>

                            <div className="space-y-2">
                              <Label className="text-white text-sm">Result</Label>
                              <Select 
                                value={horse.status} 
                                onValueChange={(value: 'win' | 'place' | 'loss') => updateHorse(horse.id, 'status', value)}
                              >
                                <SelectTrigger className="bg-betting-dark/50 border-betting-green/20 text-white">
                                  <SelectValue placeholder="Select result" />
                                </SelectTrigger>
                                <SelectContent className="bg-betting-dark border-betting-green/20">
                                  <SelectItem value="win">Win</SelectItem>
                                  <SelectItem value="place">Place</SelectItem>
                                  <SelectItem value="loss">Loss</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="flex items-center justify-center">
                              <div className={`w-4 h-4 rounded-full ${
                                horse.status === 'win' ? 'bg-green-500' : 
                                horse.status === 'place' ? 'bg-yellow-500' : 
                                'bg-red-500'
                              }`} />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="outline" onClick={handleReset} className="border-betting-green/50 text-betting-green hover:bg-betting-green/10">
                      Reset
                    </Button>
                    <Button onClick={calculateReturns} className="bg-betting-green hover:bg-betting-secondary text-white">
                      Calculate Returns
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Results */}
              <Card className="bg-betting-dark border-betting-green/20">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Results</CardTitle>
                  <CardDescription className="text-gray-400">
                    Your bet returns summary
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-betting-green/10 pb-2">
                      <span className="text-gray-300">Total Returns:</span>
                      <span className="text-white font-bold">£{results.totalReturns.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-betting-green/10 pb-2">
                      <span className="text-gray-300">Total Profit:</span>
                      <span className={`font-bold ${results.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {results.totalProfit >= 0 ? '+£' : '-£'}{Math.abs(results.totalProfit).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-betting-green/10 pb-2">
                      <span className="text-gray-300">Total Stake:</span>
                      <span className="text-white font-bold">£{results.totalStake.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-betting-green/10 pb-2">
                      <span className="text-gray-300">Winning Bets:</span>
                      <span className="text-white font-bold">{results.winningBets}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">Total Bets:</span>
                      <span className="text-white font-bold">{BET_TYPES[betType]?.bets || 0}</span>
                    </div>
                  </div>

                  {results.breakdown.length > 0 && (
                    <div className="mt-6 pt-4 border-t border-betting-green/10">
                      <h4 className="text-white font-semibold mb-3">Bet Breakdown</h4>
                      <div className="max-h-60 overflow-y-auto space-y-2">
                        {results.breakdown.map((bet, index) => (
                          <div key={index} className="text-xs p-2 bg-betting-dark/30 rounded">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-300">{bet.type}</span>
                              <span className={`font-bold ${bet.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {bet.profit >= 0 ? '+£' : '-£'}{Math.abs(bet.profit).toFixed(2)}
                              </span>
                            </div>
                            <div className="text-gray-400 text-xs">
                              {bet.horses.join(', ')}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Explanation Box */}
            {results.explanation && (
              <div className="mt-6 bg-betting-dark border border-betting-green/20 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-betting-green mb-3">Calculation Explanation</h3>
                <div className="text-gray-300 whitespace-pre-line text-sm">
                  {results.explanation}
                </div>
              </div>
            )}
            
            {/* How to Use Section */}
            <div className="mt-12 bg-betting-dark border border-betting-green/20 rounded-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-white mb-6">How to Use This Calculator</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-betting-green mb-3">Step by Step Guide</h3>
                  <ol className="list-decimal list-inside text-gray-300 space-y-2">
                    <li>Select your bet type from the comprehensive list</li>
                    <li>Enter your stake per bet</li>
                    <li>Choose odds format (fractional or decimal)</li>
                    <li>Toggle each way betting for the entire bet if needed</li>
                    <li>Configure each way terms and Rule 4 if applicable</li>
                    <li>Enter horse names and odds for each selection</li>
                    <li>Set the result status for each horse (Win/Place/Loss)</li>
                    <li>Click Calculate to see your returns</li>
                  </ol>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-betting-green mb-3">Bet Types Explained</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• <strong>Singles:</strong> One horse, one bet</li>
                    <li>• <strong>Multiples:</strong> All horses must win</li>
                    <li>• <strong>Patent:</strong> 3 horses, 7 bets (includes singles)</li>
                    <li>• <strong>Yankee:</strong> 4 horses, 11 bets (no singles)</li>
                    <li>• <strong>Lucky 15:</strong> 4 horses, 15 bets (includes singles)</li>
                    <li>• <strong>Each Way:</strong> Two bets - win and place portions</li>
                    <li>• <strong>Rule 4:</strong> Deduction when horses withdrawn</li>
                    <li>• <strong>Complex Bets:</strong> Multiple combinations for better coverage</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 