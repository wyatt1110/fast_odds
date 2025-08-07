'use client';

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import Layout from "@/components/layout/Layout";
import { Calculator, Percent } from "lucide-react";

// Poisson probability mass function: P(X = k) = (λ^k * e^(-λ)) / k!
const poissonProbability = (lambda: number, k: number): number => {
  if (k < 0 || lambda < 0) return 0;
  
  // Calculate factorial
  const factorial = (n: number): number => {
    if (n <= 1) return 1;
    return n * factorial(n - 1);
  };
  
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
};

// Calculate cumulative probability P(X <= k)
const poissonCumulativeProbability = (lambda: number, k: number): number => {
  let probability = 0;
  for (let i = 0; i <= k; i++) {
    probability += poissonProbability(lambda, i);
  }
  return probability;
};

// Convert probability to decimal odds
const probabilityToDecimalOdds = (probability: number): number => {
  if (probability <= 0 || probability >= 1) return 0;
  return 1 / probability;
};

// Convert decimal odds to American odds
const decimalToAmericanOdds = (decimal: number): string => {
  if (decimal >= 2) {
    return "+" + Math.round((decimal - 1) * 100);
  } else if (decimal > 1) {
    return Math.round(-100 / (decimal - 1)).toString();
  }
  return "+100";
};

export default function PoissonCalculatorPage() {
  const [expectedAverage, setExpectedAverage] = useState<string>("");
  const [proposition, setProposition] = useState<string>("");
  
  const [results, setResults] = useState<{
    exactProbability: number;
    exactOdds: string;
    lessThanProbability: number;
    lessThanOdds: string;
    orMoreProbability: number;
    orMoreOdds: string;
    moreThanProbability: number;
    moreThanOdds: string;
  }>({
    exactProbability: 0,
    exactOdds: "",
    lessThanProbability: 0,
    lessThanOdds: "",
    orMoreProbability: 0,
    orMoreOdds: "",
    moreThanProbability: 0,
    moreThanOdds: ""
  });
  
  const { toast } = useToast();

  const handleCalculate = () => {
    try {
      const lambda = parseFloat(expectedAverage);
      const k = parseInt(proposition);
      
      if (isNaN(lambda) || isNaN(k) || lambda <= 0 || k < 0) {
        toast({
          title: "Invalid input",
          description: "Please enter valid positive numbers for expected average and proposition",
          variant: "destructive"
        });
        return;
      }
      
      // Calculate exact probability P(X = k)
      const exactProb = poissonProbability(lambda, k);
      
      // Calculate less than k probability P(X < k) = P(X <= k-1)
      const lessThanProb = k > 0 ? poissonCumulativeProbability(lambda, k - 1) : 0;
      
      // Calculate k or more probability P(X >= k) = 1 - P(X <= k-1)
      const orMoreProb = 1 - lessThanProb;
      
      // Calculate more than k probability P(X > k) = 1 - P(X <= k)
      const moreThanProb = 1 - poissonCumulativeProbability(lambda, k);
      
      // Convert to odds
      setResults({
        exactProbability: exactProb,
        exactOdds: decimalToAmericanOdds(probabilityToDecimalOdds(exactProb)),
        lessThanProbability: lessThanProb,
        lessThanOdds: decimalToAmericanOdds(probabilityToDecimalOdds(lessThanProb)),
        orMoreProbability: orMoreProb,
        orMoreOdds: decimalToAmericanOdds(probabilityToDecimalOdds(orMoreProb)),
        moreThanProbability: moreThanProb,
        moreThanOdds: decimalToAmericanOdds(probabilityToDecimalOdds(moreThanProb))
      });
      
      toast({
        title: "Calculation complete",
        description: "Poisson probabilities and odds have been calculated successfully",
      });
      
    } catch (error) {
      console.error("Calculation error:", error);
      toast({
        title: "Calculation error",
        description: "An error occurred while calculating the probabilities",
        variant: "destructive"
      });
    }
  };

  const handleReset = () => {
    setExpectedAverage("");
    setProposition("");
    setResults({
      exactProbability: 0,
      exactOdds: "",
      lessThanProbability: 0,
      lessThanOdds: "",
      orMoreProbability: 0,
      orMoreOdds: "",
      moreThanProbability: 0,
      moreThanOdds: ""
    });
    
    toast({
      title: "Calculator reset",
      description: "All fields have been cleared"
    });
  };

  const hasResults = results.exactProbability > 0;
  const k = parseInt(proposition) || 0;

  return (
    <Layout>
      <div className="min-h-screen bg-betting-dark">
        <div className="container mx-auto py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Poisson <span className="text-betting-green">Probability Calculator</span>
            </h1>
            <p className="text-gray-300 mb-8">
              Calculate probabilities for player prop bets using the Poisson distribution. Perfect for analyzing scoring events, attempts, and other countable statistics.
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2 bg-betting-dark border-betting-green/20">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Calculator Inputs</CardTitle>
                  <CardDescription className="text-gray-400">
                    Enter the expected average and proposition value for your analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expectedAverage" className="text-white">Expected Average (λ)</Label>
                      <Input
                        id="expectedAverage"
                        type="number"
                        step="0.1"
                        min="0"
                        placeholder="e.g., 2.7"
                        value={expectedAverage}
                        onChange={(e) => setExpectedAverage(e.target.value)}
                        className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                      />
                      <p className="text-xs text-gray-500">
                        Historical average rate (e.g., player's average points, rebounds, assists per game)
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="proposition" className="text-white">Proposition Value (Over/Under Line)</Label>
                      <Input
                        id="proposition"
                        type="number"
                        min="0"
                        placeholder="e.g., 4"
                        value={proposition}
                        onChange={(e) => setProposition(e.target.value)}
                        className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                      />
                      <p className="text-xs text-gray-500">
                        The number used in the prop bet line (whole numbers only)
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4 border-t border-betting-green/10">
                    <Button 
                      variant="outline" 
                      onClick={handleReset} 
                      className="border-betting-green/50 text-betting-green hover:bg-betting-green/10"
                    >
                      Reset
                    </Button>
                    <Button 
                      onClick={handleCalculate} 
                      className="bg-betting-green hover:bg-betting-secondary text-white"
                      disabled={!expectedAverage || !proposition}
                    >
                      <Calculator className="h-4 w-4 mr-2" /> Calculate Probabilities
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-betting-dark border-betting-green/20">
                <CardHeader>
                  <CardTitle className="text-xl text-white">Results</CardTitle>
                  <CardDescription className="text-gray-400">
                    Poisson probability calculations
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {hasResults ? (
                    <>
                      <div className="p-4 bg-betting-green/10 rounded-lg text-center">
                        <p className="text-gray-300 text-sm mb-1">Most Likely Outcome</p>
                        <div className="flex items-center justify-center">
                          <Percent className="h-5 w-5 text-betting-green mr-2" />
                          <p className="text-3xl font-bold text-white">
                            {k} or more: {(results.orMoreProbability * 100).toFixed(2)}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Exactly {k}</p>
                          <div className="flex justify-between">
                            <p className="text-lg font-semibold text-white">{(results.exactProbability * 100).toFixed(2)}%</p>
                            <p className="text-betting-green">{results.exactOdds}</p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-400 mb-1">Less than {k} ({k > 0 ? `0-${k-1}` : '0'})</p>
                          <div className="flex justify-between">
                            <p className="text-lg font-semibold text-white">{(results.lessThanProbability * 100).toFixed(2)}%</p>
                            <p className="text-betting-green">{results.lessThanOdds}</p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-400 mb-1">{k} or more ({k}+)</p>
                          <div className="flex justify-between">
                            <p className="text-lg font-semibold text-white">{(results.orMoreProbability * 100).toFixed(2)}%</p>
                            <p className="text-betting-green">{results.orMoreOdds}</p>
                          </div>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-400 mb-1">More than {k} ({k+1}+)</p>
                          <div className="flex justify-between">
                            <p className="text-lg font-semibold text-white">{(results.moreThanProbability * 100).toFixed(2)}%</p>
                            <p className="text-betting-green">{results.moreThanOdds}</p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-betting-green/10">
                        <p className="text-sm text-gray-400 mb-3">Decimal Odds</p>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <p className="text-white">Exactly {k}</p>
                            <p className="text-betting-green">{probabilityToDecimalOdds(results.exactProbability).toFixed(2)}</p>
                          </div>
                          <div className="flex justify-between">
                            <p className="text-white">Less than {k}</p>
                            <p className="text-betting-green">{probabilityToDecimalOdds(results.lessThanProbability).toFixed(2)}</p>
                          </div>
                          <div className="flex justify-between">
                            <p className="text-white">{k} or more</p>
                            <p className="text-betting-green">{probabilityToDecimalOdds(results.orMoreProbability).toFixed(2)}</p>
                          </div>
                          <div className="flex justify-between">
                            <p className="text-white">More than {k}</p>
                            <p className="text-betting-green">{probabilityToDecimalOdds(results.moreThanProbability).toFixed(2)}</p>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Calculator className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">Enter values to calculate probabilities</p>
                    </div>
                  )}
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
                    <li>Find the player's historical average for the specific stat (points, rebounds, assists, etc.)</li>
                    <li>Enter this average in the "Expected Average" field</li>
                    <li>Enter the whole number from the sportsbook's over/under line</li>
                    <li>Click "Calculate Probabilities" to see the results</li>
                    <li>Compare calculated probabilities with sportsbook's implied odds to find value</li>
                  </ol>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold text-betting-green mb-3">What is Poisson Distribution?</h3>
                  <p className="text-gray-300 mb-4">
                    The Poisson distribution is a probability model that describes the likelihood of a given number of events occurring within a fixed interval, assuming events occur independently at a known average rate. In sports betting, it's particularly useful for analyzing player prop bets.
                  </p>
                  
                  <h3 className="text-lg font-semibold text-betting-green mb-3">Example Use Cases</h3>
                  <ul className="list-disc list-inside text-gray-300 space-y-2">
                    <li>Basketball: Points, rebounds, assists, three-pointers made</li>
                    <li>Baseball: Strikeouts, hits, home runs, RBIs</li>
                    <li>Football: Passing yards, rushing attempts, receptions</li>
                    <li>Soccer: Goals, shots on target, corners, cards</li>
                  </ul>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                <h4 className="text-lg font-semibold text-yellow-400 mb-2">Important Limitations</h4>
                <ul className="list-disc list-inside text-yellow-200 space-y-1">
                  <li>Assumes events are independent (not always true in sports)</li>
                  <li>Doesn't account for game context, injuries, or matchups</li>
                  <li>Works best with large sample sizes and consistent conditions</li>
                  <li>Should be combined with other analysis methods for best results</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 