'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import Layout from "@/components/layout/Layout";
import { Plus, Trash2, Calculator, Percent } from "lucide-react";

// Function to convert between odds formats
const convertOdds = (odds: string, fromFormat: string, toFormat: string): string => {
  if (!odds || isNaN(parseFloat(odds))) return "";
  
  let decimalOdds: number;
  
  // Convert input to decimal odds
  if (fromFormat === "decimal") {
    decimalOdds = parseFloat(odds);
  } else if (fromFormat === "fractional") {
    const [numerator, denominator] = odds.split("/").map(Number);
    if (!denominator) return "";
    decimalOdds = numerator / denominator + 1;
  } else if (fromFormat === "american") {
    const americanOdds = parseFloat(odds);
    if (americanOdds > 0) {
      decimalOdds = (americanOdds / 100) + 1;
    } else {
      decimalOdds = (100 / Math.abs(americanOdds)) + 1;
    }
  } else {
    return "";
  }
  
  // Convert decimal odds to target format
  if (toFormat === "decimal") {
    return decimalOdds.toFixed(2);
  } else if (toFormat === "fractional") {
    const decimal = decimalOdds - 1;
    // Find a reasonable approximation for the fraction
    for (let denominator = 1; denominator <= 100; denominator++) {
      const numerator = Math.round(decimal * denominator);
      if (Math.abs(decimal - (numerator / denominator)) < 0.01) {
        return `${numerator}/${denominator}`;
      }
    }
    // If no good approximation found, return a simplified fraction
    const numerator = Math.round(decimal * 100);
    let gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
    const divisor = gcd(numerator, 100);
    return `${numerator/divisor}/${100/divisor}`;
  } else if (toFormat === "american") {
    if (decimalOdds >= 2) {
      return "+" + Math.round((decimalOdds - 1) * 100).toString();
    } else {
      return Math.round(-100 / (decimalOdds - 1)).toString();
    }
  } else {
    return "";
  }
};

export default function VigCalculatorPage() {
  const [marketType, setMarketType] = useState<string>("two-way");
  const [oddsFormat, setOddsFormat] = useState<string>("decimal");
  const [twoWayOdds, setTwoWayOdds] = useState<{ outcome1: string; outcome2: string }>({
    outcome1: "",
    outcome2: ""
  });
  const [threeWayOdds, setThreeWayOdds] = useState<{ outcome1: string; outcome2: string; outcome3: string }>({
    outcome1: "",
    outcome2: "",
    outcome3: ""
  });
  const [multiWayOdds, setMultiWayOdds] = useState<Array<{ name: string; odds: string }>>([
    { name: "Outcome 1", odds: "" },
    { name: "Outcome 2", odds: "" }
  ]);
  
  const [results, setResults] = useState<{
    impliedProbabilities: Array<{ name: string; probability: number }>;
    totalImpliedProbability: number;
    vigPercentage: number;
    fairOdds: Array<{ name: string; odds: string }>;
    bookmarkerMargin: number;
  }>({
    impliedProbabilities: [],
    totalImpliedProbability: 0,
    vigPercentage: 0,
    fairOdds: [],
    bookmarkerMargin: 0
  });
  
  const { toast } = useToast();

  // Calculate implied probability from decimal odds
  const calculateImpliedProbability = (decimalOdds: number): number => {
    return 1 / decimalOdds;
  };

  // Calculate fair odds from implied probability
  const calculateFairOdds = (probability: number, format: string): string => {
    const fairDecimalOdds = 1 / probability;
    return convertOdds(fairDecimalOdds.toString(), "decimal", format);
  };

  const handleAddOutcome = () => {
    setMultiWayOdds([...multiWayOdds, { name: `Outcome ${multiWayOdds.length + 1}`, odds: "" }]);
  };

  const handleRemoveOutcome = (index: number) => {
    if (multiWayOdds.length <= 2) {
      toast({
        title: "Cannot remove outcome",
        description: "You need at least two outcomes for a valid market",
        variant: "destructive"
      });
      return;
    }
    
    const newOdds = [...multiWayOdds];
    newOdds.splice(index, 1);
    setMultiWayOdds(newOdds);
  };

  const handleMultiWayOddsChange = (index: number, field: 'name' | 'odds', value: string) => {
    const newOdds = [...multiWayOdds];
    newOdds[index][field] = value;
    setMultiWayOdds(newOdds);
  };

  const handleCalculate = () => {
    try {
      let oddsToCalculate: Array<{ name: string; odds: string }> = [];
      
      // Prepare odds based on market type
      if (marketType === "two-way") {
        if (!twoWayOdds.outcome1 || !twoWayOdds.outcome2) {
          toast({
            title: "Missing information",
            description: "Please enter odds for both outcomes",
            variant: "destructive"
          });
          return;
        }
        oddsToCalculate = [
          { name: "Outcome 1", odds: twoWayOdds.outcome1 },
          { name: "Outcome 2", odds: twoWayOdds.outcome2 }
        ];
      } else if (marketType === "three-way") {
        if (!threeWayOdds.outcome1 || !threeWayOdds.outcome2 || !threeWayOdds.outcome3) {
          toast({
            title: "Missing information",
            description: "Please enter odds for all three outcomes",
            variant: "destructive"
          });
          return;
        }
        oddsToCalculate = [
          { name: "Outcome 1", odds: threeWayOdds.outcome1 },
          { name: "Outcome 2", odds: threeWayOdds.outcome2 },
          { name: "Outcome 3", odds: threeWayOdds.outcome3 }
        ];
      } else if (marketType === "multi-way") {
        if (multiWayOdds.some(o => !o.odds)) {
          toast({
            title: "Missing information",
            description: "Please enter odds for all outcomes",
            variant: "destructive"
          });
          return;
        }
        oddsToCalculate = multiWayOdds;
      }
      
      // Convert all odds to decimal for calculations
      const decimalOdds = oddsToCalculate.map(o => ({
        name: o.name,
        odds: parseFloat(convertOdds(o.odds, oddsFormat, "decimal"))
      }));
      
      // Calculate implied probabilities
      const impliedProbabilities = decimalOdds.map(o => ({
        name: o.name,
        probability: calculateImpliedProbability(o.odds)
      }));
      
      // Calculate total implied probability
      const totalImpliedProbability = impliedProbabilities.reduce(
        (sum, item) => sum + item.probability, 0
      );
      
      // Calculate vig percentage
      const vigPercentage = (totalImpliedProbability - 1) * 100;
      
      // Calculate fair odds (removing the vig)
      const fairOdds = impliedProbabilities.map(item => ({
        name: item.name,
        odds: calculateFairOdds(
          item.probability / totalImpliedProbability,
          oddsFormat
        )
      }));
      
      // Calculate bookmaker margin
      const bookmarkerMargin = (totalImpliedProbability - 1) / totalImpliedProbability * 100;
      
      setResults({
        impliedProbabilities,
        totalImpliedProbability,
        vigPercentage,
        fairOdds,
        bookmarkerMargin
      });
      
      toast({
        title: "Calculation complete",
        description: "Vig calculation has been updated",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Calculation error",
        description: "There was an error processing your calculation",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    setTwoWayOdds({ outcome1: "", outcome2: "" });
    setThreeWayOdds({ outcome1: "", outcome2: "", outcome3: "" });
    setMultiWayOdds([
      { name: "Outcome 1", odds: "" },
      { name: "Outcome 2", odds: "" }
    ]);
    setResults({
      impliedProbabilities: [],
      totalImpliedProbability: 0,
      vigPercentage: 0,
      fairOdds: [],
      bookmarkerMargin: 0
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-betting-dark">
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Vig <span className="text-betting-green">Calculator</span>
            </h1>
            <p className="text-gray-300 mb-8">
              Calculate the vigorish (juice) in betting markets to understand the bookmaker's margin and find true fair odds.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-betting-dark border-betting-green/20">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Calculator Inputs</CardTitle>
                  <CardDescription className="text-gray-400">
                    Enter the odds for each outcome in your betting market
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="marketType" className="text-white">Market Type</Label>
                      <Select value={marketType} onValueChange={setMarketType}>
                        <SelectTrigger id="marketType" className="bg-betting-dark/50 border-betting-green/20 text-white">
                          <SelectValue placeholder="Select market type" />
                        </SelectTrigger>
                        <SelectContent className="bg-betting-dark border-betting-green/20">
                          <SelectItem value="two-way">Two-Way Market (e.g. Tennis)</SelectItem>
                          <SelectItem value="three-way">Three-Way Market (e.g. Soccer)</SelectItem>
                          <SelectItem value="multi-way">Multi-Way Market (e.g. Horse Racing)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="oddsFormat" className="text-white">Odds Format</Label>
                      <Select value={oddsFormat} onValueChange={setOddsFormat}>
                        <SelectTrigger id="oddsFormat" className="bg-betting-dark/50 border-betting-green/20 text-white">
                          <SelectValue placeholder="Select odds format" />
                        </SelectTrigger>
                        <SelectContent className="bg-betting-dark border-betting-green/20">
                          <SelectItem value="decimal">Decimal (2.00)</SelectItem>
                          <SelectItem value="fractional">Fractional (1/1)</SelectItem>
                          <SelectItem value="american">American (+100)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-betting-green/10">
                    <Tabs value={marketType} onValueChange={setMarketType} className="w-full">
                      <TabsList className="bg-betting-dark/50 border border-betting-green/20 mb-6">
                        <TabsTrigger value="two-way" className="data-[state=active]:bg-betting-green data-[state=active]:text-white">Two-Way</TabsTrigger>
                        <TabsTrigger value="three-way" className="data-[state=active]:bg-betting-green data-[state=active]:text-white">Three-Way</TabsTrigger>
                        <TabsTrigger value="multi-way" className="data-[state=active]:bg-betting-green data-[state=active]:text-white">Multi-Way</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="two-way" className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="outcome1" className="text-white">Outcome 1 Odds</Label>
                            <Input 
                              id="outcome1" 
                              value={twoWayOdds.outcome1} 
                              onChange={(e) => setTwoWayOdds({...twoWayOdds, outcome1: e.target.value})}
                              className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                              placeholder={oddsFormat === "decimal" ? "2.00" : oddsFormat === "fractional" ? "1/1" : "+100"}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="outcome2" className="text-white">Outcome 2 Odds</Label>
                            <Input 
                              id="outcome2" 
                              value={twoWayOdds.outcome2} 
                              onChange={(e) => setTwoWayOdds({...twoWayOdds, outcome2: e.target.value})}
                              className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                              placeholder={oddsFormat === "decimal" ? "2.00" : oddsFormat === "fractional" ? "1/1" : "+100"}
                            />
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="three-way" className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="outcome1_3way" className="text-white">Home Win Odds</Label>
                            <Input 
                              id="outcome1_3way" 
                              value={threeWayOdds.outcome1} 
                              onChange={(e) => setThreeWayOdds({...threeWayOdds, outcome1: e.target.value})}
                              className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                              placeholder={oddsFormat === "decimal" ? "2.50" : oddsFormat === "fractional" ? "3/2" : "+150"}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="outcome2_3way" className="text-white">Draw Odds</Label>
                            <Input 
                              id="outcome2_3way" 
                              value={threeWayOdds.outcome2} 
                              onChange={(e) => setThreeWayOdds({...threeWayOdds, outcome2: e.target.value})}
                              className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                              placeholder={oddsFormat === "decimal" ? "3.20" : oddsFormat === "fractional" ? "11/5" : "+220"}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="outcome3_3way" className="text-white">Away Win Odds</Label>
                            <Input 
                              id="outcome3_3way" 
                              value={threeWayOdds.outcome3} 
                              onChange={(e) => setThreeWayOdds({...threeWayOdds, outcome3: e.target.value})}
                              className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                              placeholder={oddsFormat === "decimal" ? "2.80" : oddsFormat === "fractional" ? "9/5" : "+180"}
                            />
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="multi-way" className="space-y-4">
                        {multiWayOdds.map((outcome, index) => (
                          <div key={index} className="grid grid-cols-5 gap-4 items-end">
                            <div className="space-y-2 col-span-2">
                              <Label htmlFor={`outcome_name_${index}`} className="text-white">Outcome Name</Label>
                              <Input 
                                id={`outcome_name_${index}`} 
                                value={outcome.name} 
                                onChange={(e) => handleMultiWayOddsChange(index, 'name', e.target.value)}
                                className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                                placeholder={`Outcome ${index + 1}`}
                              />
                            </div>
                            <div className="space-y-2 col-span-2">
                              <Label htmlFor={`outcome_odds_${index}`} className="text-white">Odds</Label>
                              <Input 
                                id={`outcome_odds_${index}`} 
                                value={outcome.odds} 
                                onChange={(e) => handleMultiWayOddsChange(index, 'odds', e.target.value)}
                                className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                                placeholder={oddsFormat === "decimal" ? "10.00" : oddsFormat === "fractional" ? "9/1" : "+900"}
                              />
                            </div>
                            <div>
                              <Button 
                                variant="outline" 
                                size="icon" 
                                onClick={() => handleRemoveOutcome(index)}
                                className="border-betting-green/50 text-betting-green hover:bg-betting-green/10"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                        <Button 
                          variant="outline" 
                          onClick={handleAddOutcome}
                          className="border-betting-green/50 text-betting-green hover:bg-betting-green/10"
                        >
                          <Plus className="h-4 w-4 mr-2" /> Add Outcome
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4 border-t border-betting-green/10">
                    <Button variant="outline" onClick={handleReset} className="border-betting-green/50 text-betting-green hover:bg-betting-green/10">
                      Reset
                    </Button>
                    <Button onClick={handleCalculate} className="bg-betting-green hover:bg-betting-secondary text-white">
                      <Calculator className="h-4 w-4 mr-2" /> Calculate Vig
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-betting-dark border-betting-green/20">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Results</CardTitle>
                  <CardDescription className="text-gray-400">
                    Vig calculation results
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="p-4 bg-betting-green/10 rounded-lg text-center">
                    <p className="text-gray-300 text-sm mb-1">Total Vig</p>
                    <div className="flex items-center justify-center">
                      <Percent className="h-5 w-5 text-betting-green mr-2" />
                      <p className="text-3xl font-bold text-white">
                        {results.vigPercentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Total Implied Probability</p>
                      <p className="text-lg font-semibold text-white">{(results.totalImpliedProbability * 100).toFixed(2)}%</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-400 mb-1">Bookmaker Margin</p>
                      <p className="text-lg font-semibold text-white">{results.bookmarkerMargin.toFixed(2)}%</p>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-betting-green/10">
                    <p className="text-sm text-gray-400 mb-3">Implied Probabilities</p>
                    {results.impliedProbabilities.map((item, index) => (
                      <div key={index} className="flex justify-between mb-2">
                        <p className="text-white">{item.name}</p>
                        <p className="text-betting-green">{(item.probability * 100).toFixed(2)}%</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="pt-4 border-t border-betting-green/10">
                    <p className="text-sm text-gray-400 mb-3">Fair Odds (No Vig)</p>
                    {results.fairOdds.map((item, index) => (
                      <div key={index} className="flex justify-between mb-2">
                        <p className="text-white">{item.name}</p>
                        <p className="text-betting-green">{item.odds}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            {/* How to Use Section */}
            <div className="mt-12 bg-betting-dark border border-betting-green/20 rounded-xl p-6 md:p-8">
              <h2 className="text-2xl font-bold text-white mb-6">How to Use This Calculator</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-betting-green mb-3">Step by Step Guide</h3>
                  <ol className="list-decimal list-inside text-gray-300 space-y-2">
                    <li>Select the market type (Two-Way, Three-Way, or Multi-Way)</li>
                    <li>Choose your preferred odds format (Decimal, Fractional, or American)</li>
                    <li>Enter the odds for each outcome in your betting market</li>
                    <li>Click "Calculate Vig" to see the results</li>
                    <li>Review the implied probabilities, total vig, and fair odds</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-betting-green mb-3">What is Vig?</h3>
                  <p className="text-gray-300">
                    Vig, short for <em>vigorish</em> and sometimes called <em>juice</em>, is the built-in commission or fee that sportsbooks charge for accepting your bet. This fee is not shown as a separate charge but is embedded within the odds themselves, ensuring that the bookmaker profits over time, regardless of who wins or loses the event.
                  </p>
                  <div className="mt-4">
                    <h3 className="text-lg font-semibold text-betting-green mb-3">Calculator Use Cases</h3>
                    <ul className="list-disc list-inside text-gray-300 space-y-2">
                      <li>Determine the true odds of your bet after removing the bookmaker's margin</li>
                      <li>Compare different sportsbooks to find the lowest vig, maximizing your returns</li>
                      <li>Make more informed betting decisions, especially when line shopping</li>
                      <li>Evaluate complex markets like futures and props where the vig is often higher and less obvious</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 