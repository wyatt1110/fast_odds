'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import Layout from "@/components/layout/Layout";

export default function DrawNoBetPage() {
  const [totalStake, setTotalStake] = useState<string>("");
  const [homeOdds, setHomeOdds] = useState<string>("");
  const [drawOdds, setDrawOdds] = useState<string>("");
  const [awayOdds, setAwayOdds] = useState<string>("");
  const [selectedTeam, setSelectedTeam] = useState<string>("home");
  const [oddsFormat, setOddsFormat] = useState<string>("decimal");
  
  const [results, setResults] = useState({
    teamStake: 0,
    drawStake: 0,
    teamWinProfit: 0,
    drawProfit: 0
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

  const calculateDrawNoBet = () => {
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

      // The team odds we're backing
      const teamOdds = selectedTeam === "home" ? homeDecimalOdds : awayDecimalOdds;
      
      // Calculate the proportion of the total stake to put on each option
      const drawProportion = (teamOdds - 1) / (teamOdds + drawDecimalOdds - 2);
      const teamProportion = 1 - drawProportion;
      
      const teamStake = stake * teamProportion;
      const drawStake = stake * drawProportion;
      
      // Calculate profits
      const teamWinProfit = (teamStake * teamOdds) - stake;
      const drawProfit = 0; // Draw returns your stake
      
      setResults({
        teamStake: Math.round(teamStake * 100) / 100,
        drawStake: Math.round(drawStake * 100) / 100,
        teamWinProfit: Math.round(teamWinProfit * 100) / 100,
        drawProfit: drawProfit
      });

      toast({
        title: "Calculation complete",
        description: "Your Draw No Bet calculation has been updated",
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
    setSelectedTeam("home");
    setOddsFormat("decimal");
    setResults({
      teamStake: 0,
      drawStake: 0,
      teamWinProfit: 0,
      drawProfit: 0
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-betting-dark">
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Draw No Bet <span className="text-betting-green">Calculator</span>
            </h1>
            <p className="text-gray-300 mb-8">
              Create a Draw No Bet position from a traditional 1X2 market. This calculator helps you determine how much to stake on each outcome to create a bet that returns your stake if the match ends in a draw.
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
                      <Label htmlFor="selectedTeam" className="text-white">Team to Back</Label>
                      <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                        <SelectTrigger id="selectedTeam" className="bg-betting-dark/50 border-betting-green/20 text-white">
                          <SelectValue placeholder="Select team to back" />
                        </SelectTrigger>
                        <SelectContent className="bg-betting-dark border-betting-green/20">
                          <SelectItem value="home">Home Team</SelectItem>
                          <SelectItem value="away">Away Team</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="outline" onClick={handleReset} className="border-betting-green/50 text-betting-green hover:bg-betting-green/10">
                      Reset
                    </Button>
                    <Button onClick={calculateDrawNoBet} className="bg-betting-green hover:bg-betting-secondary text-white">
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
                      <span className="text-gray-300">{selectedTeam === "home" ? "Home" : "Away"} Stake:</span>
                      <span className="text-white font-bold">£{results.teamStake.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-betting-green/10 pb-2">
                      <span className="text-gray-300">Draw Stake:</span>
                      <span className="text-white font-bold">£{results.drawStake.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-betting-green/10 pb-2">
                      <span className="text-gray-300">If {selectedTeam === "home" ? "Home" : "Away"} Wins:</span>
                      <span className={`font-bold ${results.teamWinProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {results.teamWinProfit >= 0 ? '+£' : '-£'}{Math.abs(results.teamWinProfit).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">If Draw:</span>
                      <span className="text-white font-bold">£{results.drawProfit.toFixed(2)}</span>
                    </div>
                    <div className="mt-4 p-3 bg-betting-green/10 rounded-lg">
                      <p className="text-sm text-gray-300">
                        <strong>Note:</strong> If the opposing team wins, you lose your entire stake.
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
                    <li>Select which team you want to back</li>
                    <li>Click Calculate to see your stake distribution</li>
                    <li>Place the calculated stakes on the selected team and draw</li>
                  </ol>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-betting-green mb-3">What is Draw No Bet?</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• <strong>Concept:</strong> Your stake is returned if the match ends in a draw</li>
                    <li>• <strong>Risk Reduction:</strong> Eliminates the draw risk from football betting</li>
                    <li>• <strong>Two Outcomes:</strong> Either win profit or get your stake back</li>
                    <li>• <strong>Example:</strong> Back Manchester United vs Liverpool Draw No Bet</li>
                    <li>• <strong>Result:</strong> Win if United wins, stake back if draw, lose if Liverpool wins</li>
                    <li>• <strong>Lower Odds:</strong> Typically lower than straight win odds due to reduced risk</li>
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