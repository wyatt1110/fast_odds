'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import Layout from "@/components/layout/Layout";

export default function MatchedBettingPage() {
  const [backStake, setBackStake] = useState<string>("");
  const [backOdds, setBackOdds] = useState<string>("");
  const [layOdds, setLayOdds] = useState<string>("");
  const [commission, setCommission] = useState<string>("5");
  const [betType, setBetType] = useState<string>("normal");
  
  const [result, setResult] = useState({
    layStake: 0,
    qualifyingLoss: 0,
    backWinProfit: 0,
    layWinProfit: 0
  });

  const { toast } = useToast();

  const calculateLayStake = (back: number, backOdds: number, layOdds: number, commission: number) => {
    return (back * backOdds) / (layOdds - commission / 100 * layOdds);
  };

  const calculateQualifyingLoss = (backStake: number, layStake: number, commission: number) => {
    return layStake * (commission / 100) - (backStake - layStake);
  };

  const handleCalculate = () => {
    if (!backStake || !backOdds || !layOdds) {
      toast({
        title: "Missing information",
        description: "Please fill in all the required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const back = parseFloat(backStake);
      const bOdds = parseFloat(backOdds);
      const lOdds = parseFloat(layOdds);
      const comm = parseFloat(commission);

      if (back <= 0 || bOdds <= 1 || lOdds <= 1) {
        toast({
          title: "Invalid values",
          description: "Stakes and odds must be positive, odds must be greater than 1",
          variant: "destructive"
        });
        return;
      }

      const layStake = calculateLayStake(back, bOdds, lOdds, comm);
      const qualifyingLoss = calculateQualifyingLoss(back, layStake, comm);
      const backWinProfit = back * (bOdds - 1) - layStake * (1 - comm / 100);
      const layWinProfit = layStake - back - layStake * (comm / 100);

      setResult({
        layStake: Math.round(layStake * 100) / 100,
        qualifyingLoss: Math.round(qualifyingLoss * 100) / 100,
        backWinProfit: Math.round(backWinProfit * 100) / 100,
        layWinProfit: Math.round(layWinProfit * 100) / 100
      });

      toast({
        title: "Calculation complete",
        description: "Your matched betting calculation has been updated",
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
    setBackStake("");
    setBackOdds("");
    setLayOdds("");
    setCommission("5");
    setBetType("normal");
    setResult({
      layStake: 0,
      qualifyingLoss: 0,
      backWinProfit: 0,
      layWinProfit: 0
    });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-betting-dark">
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Matched Betting <span className="text-betting-green">Calculator</span>
            </h1>
            <p className="text-gray-300 mb-8">
              This calculator helps you determine the optimal lay stake for matched betting, calculating your qualifying loss or bonus profit.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="md:col-span-2 bg-betting-dark border-betting-green/20">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Calculator Inputs</CardTitle>
                  <CardDescription className="text-gray-400">
                    Enter your betting details below
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="betType" className="text-white">Bet Type</Label>
                      <Select value={betType} onValueChange={setBetType}>
                        <SelectTrigger id="betType" className="bg-betting-dark/50 border-betting-green/20 text-white">
                          <SelectValue placeholder="Select bet type" />
                        </SelectTrigger>
                        <SelectContent className="bg-betting-dark border-betting-green/20">
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="free">Free Bet (SNR)</SelectItem>
                          <SelectItem value="free-sr">Free Bet (SR)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commission" className="text-white">Exchange Commission (%)</Label>
                      <Input 
                        id="commission" 
                        type="number" 
                        value={commission} 
                        onChange={(e) => setCommission(e.target.value)}
                        className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                        min="0"
                        max="100"
                        step="0.5"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 pb-2 border-t border-betting-green/10">
                    <div className="space-y-2">
                      <Label htmlFor="backStake" className="text-white">Back Stake</Label>
                      <Input 
                        id="backStake" 
                        type="number" 
                        value={backStake} 
                        onChange={(e) => setBackStake(e.target.value)}
                        className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                        min="0"
                        step="0.01"
                        placeholder="£10.00"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="backOdds" className="text-white">Back Odds</Label>
                      <Input 
                        id="backOdds" 
                        type="number" 
                        value={backOdds} 
                        onChange={(e) => setBackOdds(e.target.value)}
                        className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                        min="1.01"
                        step="0.01"
                        placeholder="2.50"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-betting-green/10">
                    <div className="space-y-2">
                      <Label htmlFor="layOdds" className="text-white">Lay Odds</Label>
                      <Input 
                        id="layOdds" 
                        type="number" 
                        value={layOdds} 
                        onChange={(e) => setLayOdds(e.target.value)}
                        className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                        min="1.01"
                        step="0.01"
                        placeholder="2.52"
                      />
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="outline" onClick={handleReset} className="border-betting-green/50 text-betting-green hover:bg-betting-green/10">
                      Reset
                    </Button>
                    <Button onClick={handleCalculate} className="bg-betting-green hover:bg-betting-secondary text-white">
                      Calculate
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-betting-dark border-betting-green/20">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Results</CardTitle>
                  <CardDescription className="text-gray-400">
                    Your calculation results
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center border-b border-betting-green/10 pb-2">
                      <span className="text-gray-300">Lay Stake:</span>
                      <span className="text-white font-bold">£{result.layStake.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-betting-green/10 pb-2">
                      <span className="text-gray-300">Qualifying Loss:</span>
                      <span className={`font-bold ${result.qualifyingLoss >= 0 ? 'text-red-400' : 'text-green-400'}`}>
                        {result.qualifyingLoss >= 0 ? '-£' : '+£'}{Math.abs(result.qualifyingLoss).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-b border-betting-green/10 pb-2">
                      <span className="text-gray-300">If Back Wins:</span>
                      <span className={`font-bold ${result.backWinProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {result.backWinProfit >= 0 ? '+£' : '-£'}{Math.abs(result.backWinProfit).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300">If Lay Wins:</span>
                      <span className={`font-bold ${result.layWinProfit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {result.layWinProfit >= 0 ? '+£' : '-£'}{Math.abs(result.layWinProfit).toFixed(2)}
                      </span>
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
                    <li>Enter your back stake (the amount you're betting at the bookmaker)</li>
                    <li>Input the back odds (in decimal format)</li>
                    <li>Enter the lay odds available at the exchange</li>
                    <li>Set the exchange commission percentage (typically 5% for most exchanges)</li>
                    <li>Choose your bet type (normal bet or free bet)</li>
                    <li>Click Calculate to see your optimal lay stake and potential profit/loss</li>
                  </ol>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-betting-green mb-3">Tips & Examples</h3>
                  <ul className="text-gray-300 space-y-2">
                    <li>• <strong>Normal Bet:</strong> Use for standard matched betting promotions</li>
                    <li>• <strong>Free Bet (SNR):</strong> Stake Not Returned - use for most free bet offers</li>
                    <li>• <strong>Free Bet (SR):</strong> Stake Returned - less common but higher value</li>
                    <li>• <strong>Example:</strong> £10 back at 2.50 odds, lay at 2.52 = £9.80 lay stake</li>
                    <li>• <strong>Lower commission = higher profits</strong> (Betdaq 2%, Smarkets 2%)</li>
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