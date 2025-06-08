'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import Layout from "@/components/layout/Layout";

export default function DoubleChancePage() {
  const [totalStake, setTotalStake] = useState<string>("");
  const [homeOdds, setHomeOdds] = useState<string>("");
  const [drawOdds, setDrawOdds] = useState<string>("");
  const [awayOdds, setAwayOdds] = useState<string>("");
  const [doubleChanceType, setDoubleChanceType] = useState<string>("home-draw");
  const [oddsFormat, setOddsFormat] = useState<string>("decimal");
  
  const [results, setResults] = useState({
    outcome1Stake: 0,
    outcome2Stake: 0,
    profit: 0
  });

  const { toast } = useToast();

  const convertToDecimal = (odds: string, format: string): number => {
    if (format === "decimal") {
      return parseFloat(odds);
    } else if (format === "fractional") {
      const [numerator, denominator] = odds.split("/").map(Number);
      if (isNaN(numerator) || isNaN(denominator) || denominator === 0) {
        throw new Error("Invalid fractional odds format");
      }
      return numerator / denominator + 1;
    }
    return 0;
  };

  const calculateDoubleChance = () => {
    if (!totalStake || !homeOdds || !drawOdds || !awayOdds) {
      toast({
        title: "Missing information",
        description: "Please fill in all the required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const stake = parseFloat(totalStake);
      const homeDecimalOdds = convertToDecimal(homeOdds, oddsFormat);
      const drawDecimalOdds = convertToDecimal(drawOdds, oddsFormat);
      const awayDecimalOdds = convertToDecimal(awayOdds, oddsFormat);
      
      if (stake <= 0 || homeDecimalOdds <= 1 || drawDecimalOdds <= 1 || awayDecimalOdds <= 1) {
        toast({
          title: "Invalid values",
          description: "Stake must be positive and odds must be greater than 1",
          variant: "destructive"
        });
        return;
      }

      // Determine the two outcomes we're backing based on the double chance type
      let odds1, odds2, outcome1, outcome2;
      
      if (doubleChanceType === "home-draw") {
        odds1 = homeDecimalOdds;
        odds2 = drawDecimalOdds;
        outcome1 = "Home";
        outcome2 = "Draw";
      } else if (doubleChanceType === "draw-away") {
        odds1 = drawDecimalOdds;
        odds2 = awayDecimalOdds;
        outcome1 = "Draw";
        outcome2 = "Away";
      } else { // home-away
        odds1 = homeDecimalOdds;
        odds2 = awayDecimalOdds;
        outcome1 = "Home";
        outcome2 = "Away";
      }
      
      // Calculate the fair double chance odds
      const p1 = 1 / odds1;
      const p2 = 1 / odds2;
      const fairDoubleChanceOdds = 1 / (p1 + p2);
      
      // Calculate the optimal stake distribution to ensure equal profit
      const totalOddsProduct = odds1 * odds2;
      const stake1 = stake * odds2 / (odds1 + odds2);
      const stake2 = stake * odds1 / (odds1 + odds2);
      
      // Calculate the profit (will be the same for either outcome)
      const profit = (stake1 * odds1) - stake;
      
      setResults({
        outcome1Stake: Math.round(stake1 * 100) / 100,
        outcome2Stake: Math.round(stake2 * 100) / 100,
        profit: Math.round(profit * 100) / 100
      });

      toast({
        title: "Calculation complete",
        description: "Your Double Chance calculation has been updated",
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
    setTotalStake("");
    setHomeOdds("");
    setDrawOdds("");
    setAwayOdds("");
    setDoubleChanceType("home-draw");
    setOddsFormat("decimal");
    setResults({
      outcome1Stake: 0,
      outcome2Stake: 0,
      profit: 0
    });
  };

  const getOutcomeLabels = () => {
    switch (doubleChanceType) {
      case "home-draw":
        return { outcome1: "Home", outcome2: "Draw", outcome3: "Away" };
      case "draw-away":
        return { outcome1: "Draw", outcome2: "Away", outcome3: "Home" };
      case "home-away":
        return { outcome1: "Home", outcome2: "Away", outcome3: "Draw" };
      default:
        return { outcome1: "Outcome 1", outcome2: "Outcome 2", outcome3: "Outcome 3" };
    }
  };

  const labels = getOutcomeLabels();

  return (
    <Layout>
      <div className="min-h-screen bg-betting-dark">
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Double Chance <span className="text-betting-green">Calculator</span>
            </h1>
            <p className="text-gray-300 mb-8">
              Create a Double Chance bet from a traditional 1X2 market. This calculator helps you determine how much to stake on each outcome to create a bet that wins if either of your chosen outcomes occurs.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 bg-betting-dark border-betting-green/20">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Calculator Inputs</CardTitle>
                  <CardDescription className="text-gray-400">
                    Enter match odds and your total stake
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="totalStake" className="text-white">Total Stake</Label>
                      <Input 
                        id="totalStake" 
                        type="number" 
                        value={totalStake} 
                        onChange={(e) => setTotalStake(e.target.value)}
                        className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                        min="0.01"
                        step="0.01"
                        placeholder="£100.00"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="oddsFormat" className="text-white">Odds Format</Label>
                      <Select value={oddsFormat} onValueChange={setOddsFormat}>
                        <SelectTrigger id="oddsFormat" className="bg-betting-dark/50 border-betting-green/20 text-white">
                          <SelectValue placeholder="Select odds format" />
                        </SelectTrigger>
                        <SelectContent className="bg-betting-dark border-betting-green/20">
                          <SelectItem value="decimal">Decimal (e.g., 2.50)</SelectItem>
                          <SelectItem value="fractional">Fractional (e.g., 6/4)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 pb-2 border-t border-betting-green/10">
                    <div className="space-y-2">
                      <Label htmlFor="homeOdds" className="text-white">Home Win Odds</Label>
                      <Input 
                        id="homeOdds" 
                        value={homeOdds} 
                        onChange={(e) => setHomeOdds(e.target.value)}
                        className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                        placeholder={oddsFormat === "decimal" ? "2.50" : "6/4"}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="drawOdds" className="text-white">Draw Odds</Label>
                      <Input 
                        id="drawOdds" 
                        value={drawOdds} 
                        onChange={(e) => setDrawOdds(e.target.value)}
                        className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                        placeholder={oddsFormat === "decimal" ? "3.40" : "12/5"}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="awayOdds" className="text-white">Away Win Odds</Label>
                      <Input 
                        id="awayOdds" 
                        value={awayOdds} 
                        onChange={(e) => setAwayOdds(e.target.value)}
                        className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                        placeholder={oddsFormat === "decimal" ? "2.80" : "9/5"}
                      />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-betting-green/10">
                    <div className="space-y-2">
                      <Label htmlFor="doubleChanceType" className="text-white">Double Chance Type</Label>
                      <Select value={doubleChanceType} onValueChange={setDoubleChanceType}>
                        <SelectTrigger id="doubleChanceType" className="bg-betting-dark/50 border-betting-green/20 text-white">
                          <SelectValue placeholder="Select double chance type" />
                        </SelectTrigger>
                        <SelectContent className="bg-betting-dark border-betting-green/20">
                          <SelectItem value="home-draw">Home or Draw (1X)</SelectItem>
                          <SelectItem value="draw-away">Draw or Away (X2)</SelectItem>
                          <SelectItem value="home-away">Home or Away (12)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="outline" onClick={handleReset} className="border-betting-green/50 text-betting-green hover:bg-betting-green/10">
                      Reset
                    </Button>
                    <Button onClick={calculateDoubleChance} className="bg-betting-green hover:bg-betting-secondary text-white">
                      Calculate
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-betting-dark border-betting-green/20">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Results</CardTitle>
                  <CardDescription className="text-gray-400">
                    Your stake distribution
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-betting-green/10 pb-2">
                      <span className="text-gray-300">{labels.outcome1} Stake:</span>
                      <span className="text-white font-bold">£{results.outcome1Stake.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-betting-green/10 pb-2">
                      <span className="text-gray-300">{labels.outcome2} Stake:</span>
                      <span className="text-white font-bold">£{results.outcome2Stake.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-betting-green/10 pb-2">
                      <span className="text-gray-300">If Either Wins:</span>
                      <span className={`font-bold ${results.profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {results.profit >= 0 ? '+£' : '-£'}{Math.abs(results.profit).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">If {labels.outcome3} Wins:</span>
                      <span className="text-red-400 font-bold">-£{totalStake || '0.00'}</span>
                    </div>
                    <div className="mt-4 p-3 bg-betting-green/10 rounded-lg">
                      <p className="text-sm text-gray-300">
                        <strong>Coverage:</strong> You win if {labels.outcome1} OR {labels.outcome2} occurs.
                      </p>
                    </div>
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
                    <li>Enter your total stake amount</li>
                    <li>Choose your preferred odds format</li>
                    <li>Input the odds for Home Win, Draw, and Away Win</li>
                    <li>Select your Double Chance type (1X, X2, or 12)</li>
                    <li>Click Calculate to see your stake distribution</li>
                    <li>Place the calculated stakes on the respective outcomes</li>
                  </ol>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-betting-green mb-3">Double Chance Types</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• <strong>1X (Home or Draw):</strong> Win if home team wins or draws</li>
                    <li>• <strong>X2 (Draw or Away):</strong> Win if match draws or away team wins</li>
                    <li>• <strong>12 (Home or Away):</strong> Win if either team wins (no draw)</li>
                    <li>• <strong>Risk Reduction:</strong> Covers 2 out of 3 possible outcomes</li>
                    <li>• <strong>Lower Odds:</strong> Reduced risk means lower potential profit</li>
                    <li>• <strong>Strategy:</strong> Great for avoiding one specific outcome</li>
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