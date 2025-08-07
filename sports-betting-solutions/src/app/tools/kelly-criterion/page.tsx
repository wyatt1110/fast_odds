'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Slider } from '@/components/ui/slider'
import { useToast } from '@/components/ui/use-toast'
import Layout from '@/components/layout/Layout'
import { Calculator, TrendingUp, AlertTriangle, Info, BookOpen } from 'lucide-react'

// Function to convert between odds formats
const convertOdds = (odds: string, fromFormat: string, toFormat: string): string => {
  if (!odds || isNaN(parseFloat(odds))) return ""
  
  let decimalOdds: number
  
  // Convert input to decimal odds
  if (fromFormat === "decimal") {
    decimalOdds = parseFloat(odds)
  } else if (fromFormat === "fractional") {
    const [numerator, denominator] = odds.split("/").map(Number)
    if (!denominator) return ""
    decimalOdds = numerator / denominator + 1
  } else if (fromFormat === "american") {
    const americanOdds = parseFloat(odds)
    if (americanOdds > 0) {
      decimalOdds = (americanOdds / 100) + 1
    } else {
      decimalOdds = (100 / Math.abs(americanOdds)) + 1
    }
  } else {
    return ""
  }
  
  // Convert decimal odds to target format
  if (toFormat === "decimal") {
    return decimalOdds.toFixed(2)
  } else if (toFormat === "fractional") {
    const decimal = decimalOdds - 1
    // Find a reasonable approximation for the fraction
    for (let denominator = 1; denominator <= 100; denominator++) {
      const numerator = Math.round(decimal * denominator)
      if (Math.abs(decimal - (numerator / denominator)) < 0.01) {
        return `${numerator}/${denominator}`
      }
    }
    // If no good approximation found, return a simplified fraction
    const numerator = Math.round(decimal * 100)
    let gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a
    const divisor = gcd(numerator, 100)
    return `${numerator/divisor}/${100/divisor}`
  } else if (toFormat === "american") {
    if (decimalOdds >= 2) {
      return "+" + Math.round((decimalOdds - 1) * 100).toString()
    } else {
      return Math.round(-100 / (decimalOdds - 1)).toString()
    }
  } else {
    return ""
  }
}

export default function KellyCriterionCalculatorPage() {
  const [odds, setOdds] = useState('')
  const [winProbability, setWinProbability] = useState('')
  const [oddsFormat, setOddsFormat] = useState('decimal')
  const [kellyPercentage, setKellyPercentage] = useState([100])
  
  const [results, setResults] = useState({
    kellyStake: 0,
    fractionalKelly: 0,
    expectedValue: 0,
    isPositiveExpectedValue: false
  })

  const { toast } = useToast()

  const getRiskLevel = (percentage: number): { level: string; color: string } => {
    if (percentage <= 19) return { level: '(0-19% Very Low Risk)', color: 'text-white' }
    if (percentage <= 39) return { level: '(20%-39% Low Risk)', color: 'text-white' }
    if (percentage <= 59) return { level: '(40%-59% Moderate Risk)', color: 'text-white' }
    if (percentage <= 79) return { level: '(60%-79% High Risk)', color: 'text-white' }
    return { level: '(80%+ Very High Risk)', color: 'text-white' }
  }

  const handleCalculate = () => {
    if (!odds || !winProbability) {
      toast({
        title: "Missing information",
        description: "Please enter both odds and win probability",
        variant: "destructive"
      })
      return
    }

    const decimalOdds = parseFloat(convertOdds(odds, oddsFormat, "decimal"))
    const winProb = parseFloat(winProbability) / 100
    const loseProb = 1 - winProb
    
    if (decimalOdds <= 0 || winProb <= 0 || winProb >= 1) {
      toast({
        title: "Invalid input",
        description: "Please check your odds and probability values",
        variant: "destructive"
      })
      return
    }

    // Kelly Criterion formula: f = (bp - q) / b
    // where f = fraction of bankroll to bet
    // b = odds received on the wager (decimal odds - 1)
    // p = probability of winning
    // q = probability of losing (1 - p)
    
    const b = decimalOdds - 1 // Net odds
    const p = winProb
    const q = loseProb
    
    const kellyFraction = (b * p - q) / b
    const kellyStakePercentage = Math.max(0, kellyFraction * 100) // Don't bet if negative
    
    // Calculate fractional Kelly based on user selection
    const fractionalKellyStake = (kellyStakePercentage * kellyPercentage[0]) / 100
    
    // Expected Value calculation
    const expectedValue = (winProb * b) - loseProb

    setResults({
      kellyStake: kellyStakePercentage,
      fractionalKelly: fractionalKellyStake,
      expectedValue: expectedValue,
      isPositiveExpectedValue: expectedValue > 0
    })
  }

  const handleReset = () => {
    setOdds('')
    setWinProbability('')
    setOddsFormat('decimal')
    setKellyPercentage([100])
    setResults({
      kellyStake: 0,
      fractionalKelly: 0,
      expectedValue: 0,
      isPositiveExpectedValue: false
    })
  }

  return (
    <Layout>
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Calculator className="h-12 w-12 text-betting-green" />
              <h1 className="text-4xl font-bold text-white">Kelly Criterion Calculator</h1>
            </div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Calculate optimal bet sizing using the Kelly Criterion formula for maximum long-term growth
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Calculator */}
            <Card className="bg-betting-dark/50 border-betting-green/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Kelly Calculator
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Enter your odds and win probability to calculate optimal stake
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Odds Format Selection */}
                <div className="space-y-2">
                  <Label className="text-white">Odds Format</Label>
                  <Select value={oddsFormat} onValueChange={setOddsFormat}>
                    <SelectTrigger className="bg-betting-dark border-betting-green/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="decimal">Decimal (e.g., 2.50)</SelectItem>
                      <SelectItem value="fractional">Fractional (e.g., 3/2)</SelectItem>
                      <SelectItem value="american">American (e.g., +150)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Odds Input */}
                <div className="space-y-2">
                  <Label className="text-white">Odds</Label>
                  <Input
                    value={odds}
                    onChange={(e) => setOdds(e.target.value)}
                    placeholder={
                      oddsFormat === 'decimal' ? '2.50' :
                      oddsFormat === 'fractional' ? '3/2' :
                      '+150'
                    }
                    className="bg-betting-dark border-betting-green/20 text-white placeholder:text-gray-400"
                  />
                </div>

                {/* Win Probability */}
                <div className="space-y-2">
                  <Label className="text-white">Win Probability (%)</Label>
                  <Input
                    value={winProbability}
                    onChange={(e) => setWinProbability(e.target.value)}
                    placeholder="55"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className="bg-betting-dark border-betting-green/20 text-white placeholder:text-gray-400"
                  />
                </div>

                {/* Kelly Percentage Slider */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-white">Kelly Percentage</Label>
                    <span className="text-white font-semibold">{kellyPercentage[0]}%</span>
                  </div>
                  
                  {/* Custom Progress Bar Slider */}
                  <div className="relative">
                    <div className="w-full h-6 bg-gray-700 rounded-lg overflow-hidden">
                      <div 
                        className="h-full bg-betting-green"
                        style={{ width: `${kellyPercentage[0]}%` }}
                      />
                    </div>
                    {/* Slider thumb/handle - positioned at the end of the filled bar */}
                    <div 
                      className="absolute top-1/2 w-6 h-6 bg-white border-2 border-betting-green rounded-full transform -translate-y-1/2 -translate-x-1/2 shadow-lg pointer-events-none"
                      style={{ left: `${kellyPercentage[0]}%` }}
                    />
                    <input
                      type="range"
                      min="1"
                      max="100"
                      step="1"
                      value={kellyPercentage[0]}
                      onChange={(e) => setKellyPercentage([parseInt(e.target.value)])}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                  
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>1%</span>
                    <span>50%</span>
                    <span>100%</span>
                  </div>
                  <div className="text-center">
                    <span className={`text-sm font-medium ${getRiskLevel(kellyPercentage[0]).color}`}>
                      {getRiskLevel(kellyPercentage[0]).level}
                    </span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button 
                    onClick={handleCalculate} 
                    className="flex-1 bg-betting-green hover:bg-betting-secondary text-white"
                  >
                    Calculate Kelly Stake
                  </Button>
                  <Button 
                    onClick={handleReset} 
                    variant="outline"
                    className="border-betting-green/20 text-white hover:bg-betting-green/10"
                  >
                    Reset
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <Card className="bg-betting-dark/50 border-betting-green/20">
              <CardHeader>
                <CardTitle className="text-white">Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {results.kellyStake > 0 ? (
                  <>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="bg-betting-dark/30 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-1">Full Kelly Stake</div>
                        <div className="text-2xl font-bold text-white">
                          {results.kellyStake.toFixed(2)}%
                        </div>
                        <div className="text-sm text-gray-300">of bankroll</div>
                      </div>

                      <div className="bg-betting-dark/30 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-1">
                          {kellyPercentage[0]}% Kelly Stake
                        </div>
                        <div className="text-2xl font-bold text-betting-green">
                          {results.fractionalKelly.toFixed(2)}%
                        </div>
                        <div className="text-sm text-gray-300">of bankroll (recommended)</div>
                      </div>

                      <div className="bg-betting-dark/30 rounded-lg p-4">
                        <div className="text-sm text-gray-400 mb-1">Expected Value</div>
                        <div className={`text-2xl font-bold ${results.isPositiveExpectedValue ? 'text-green-400' : 'text-red-400'}`}>
                          {results.expectedValue > 0 ? '+' : ''}{(results.expectedValue * 100).toFixed(2)}%
                        </div>
                        <div className="text-sm text-gray-300">
                          {results.isPositiveExpectedValue ? 'Positive bet' : 'Negative bet - avoid'}
                        </div>
                      </div>
                    </div>

                    {!results.isPositiveExpectedValue && (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                        <div className="flex items-center gap-2 text-red-400">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            Negative Expected Value - This bet is not recommended
                          </span>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Enter odds and win probability to see results</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Educational Content */}
          <div className="max-w-6xl mx-auto">
            <Tabs defaultValue="guide" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-betting-dark/50 border-betting-green/20">
                <TabsTrigger 
                  value="guide" 
                  className="text-white data-[state=active]:bg-betting-green data-[state=active]:text-white"
                >
                  Step-by-Step Guide
                </TabsTrigger>
                <TabsTrigger 
                  value="about" 
                  className="text-white data-[state=active]:bg-betting-green data-[state=active]:text-white"
                >
                  What is Kelly Criterion?
                </TabsTrigger>
                <TabsTrigger 
                  value="cases" 
                  className="text-white data-[state=active]:bg-betting-green data-[state=active]:text-white"
                >
                  Use Cases
                </TabsTrigger>
              </TabsList>

              <TabsContent value="guide" className="mt-6">
                <Card className="bg-betting-dark/50 border-betting-green/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      How to Use the Kelly Criterion Calculator
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-white font-semibold mb-3">Step 1: Select Odds Format</h3>
                        <p className="text-sm mb-4">Choose your preferred odds format:</p>
                        <ul className="text-sm space-y-1 ml-4">
                          <li>• <strong>Decimal:</strong> 2.50 (common in Europe)</li>
                          <li>• <strong>Fractional:</strong> 3/2 (common in UK)</li>
                          <li>• <strong>American:</strong> +150 (common in US)</li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-white font-semibold mb-3">Step 2: Enter Your Odds</h3>
                        <p className="text-sm mb-4">Input the odds offered by the bookmaker for your selected bet.</p>
                        <p className="text-sm">The calculator will automatically convert between formats for internal calculations.</p>
                      </div>
                      
                      <div>
                        <h3 className="text-white font-semibold mb-3">Step 3: Estimate Win Probability</h3>
                        <p className="text-sm mb-4">Enter your estimated probability of winning (0-100%).</p>
                        <p className="text-sm">This is your edge - how likely you think the outcome is to occur based on your analysis.</p>
                      </div>
                      
                      <div>
                        <h3 className="text-white font-semibold mb-3">Step 4: Set Kelly Percentage</h3>
                        <p className="text-sm mb-4">Use the slider to set what percentage of the full Kelly stake you want to bet.</p>
                        <p className="text-sm">Most professional bettors use 20-50% Kelly to reduce variance.</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="about" className="mt-6">
                <Card className="bg-betting-dark/50 border-betting-green/20">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Understanding the Kelly Criterion
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300 space-y-6">
                    <div>
                      <h3 className="text-white font-semibold mb-3">What is the Kelly Criterion?</h3>
                      <p className="mb-4">
                        The Kelly Criterion is a mathematical formula developed by John Kelly Jr. in 1956 that determines the optimal bet size 
                        to maximize long-term growth of your bankroll. It balances the trade-off between growth and risk of ruin.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-white font-semibold mb-3">The Mathematics</h3>
                      <div className="bg-betting-dark/30 rounded-lg p-4 mb-4">
                        <p className="font-mono text-center text-lg mb-2 text-betting-green">f = (bp - q) / b</p>
                        <div className="text-sm space-y-1">
                          <p><strong>f</strong> = fraction of bankroll to bet</p>
                          <p><strong>b</strong> = net odds received (decimal odds - 1)</p>
                          <p><strong>p</strong> = probability of winning</p>
                          <p><strong>q</strong> = probability of losing (1 - p)</p>
                        </div>
                      </div>
                      <p>
                        The formula calculates the percentage of your bankroll that should be wagered to maximize logarithmic growth 
                        over the long term, assuming you have a positive expected value.
                      </p>
                    </div>

                    <div>
                      <h3 className="text-white font-semibold mb-3">Key Principles</h3>
                      <ul className="space-y-2 ml-4">
                        <li>• <strong>Positive Expected Value Required:</strong> Only bet when your win probability × odds &gt; 1</li>
                        <li>• <strong>Logarithmic Growth:</strong> Maximizes long-term wealth growth rate</li>
                        <li>• <strong>Risk Management:</strong> Prevents betting too much and going broke</li>
                        <li>• <strong>Optimal Sizing:</strong> Neither too conservative nor too aggressive</li>
                      </ul>
                    </div>

                    <div>
                      <h3 className="text-white font-semibold mb-3">Fractional Kelly</h3>
                      <p>
                        Most professional bettors don't use full Kelly due to its high variance. Common approaches include:
                      </p>
                      <ul className="space-y-1 ml-4 mt-2">
                        <li>• <strong>Quarter Kelly (25%):</strong> Very conservative, smooth growth</li>
                        <li>• <strong>Half Kelly (50%):</strong> Balanced approach, popular among professionals</li>
                        <li>• <strong>Three-Quarter Kelly (75%):</strong> More aggressive but still manageable</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="cases" className="mt-6">
                <Card className="bg-betting-dark/50 border-betting-green/20">
                  <CardHeader>
                    <CardTitle className="text-white">When to Use Kelly Criterion</CardTitle>
                  </CardHeader>
                  <CardContent className="text-gray-300 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-white font-semibold mb-3">Best Use Cases</h3>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-betting-green rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <strong>Value Betting:</strong> When you've identified odds that are higher than the true probability
                            </div>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-betting-green rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <strong>Professional Betting:</strong> Long-term bankroll management for serious bettors
                            </div>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-betting-green rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <strong>Sports Arbitrage:</strong> Sizing bets in arbitrage opportunities
                            </div>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-betting-green rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <strong>Investment Portfolio:</strong> Any scenario with measurable probabilities and returns
                            </div>
                          </li>
                        </ul>
                      </div>
                      
                      <div>
                        <h3 className="text-white font-semibold mb-3">Limitations</h3>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <strong>Probability Estimation:</strong> Requires accurate assessment of win probability
                            </div>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <strong>High Variance:</strong> Full Kelly can lead to large swings in bankroll
                            </div>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <strong>Psychological Pressure:</strong> Can be difficult to follow during losing streaks
                            </div>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                            <div>
                              <strong>Market Efficiency:</strong> Less effective in highly efficient markets
                            </div>
                          </li>
                        </ul>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-white font-semibold mb-3">Example Scenarios</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-betting-dark/30 rounded-lg p-4">
                          <h4 className="text-white font-medium mb-2">Horse Racing</h4>
                          <p className="text-sm">
                            You've analyzed a horse with 40% win probability but bookmaker odds of 3.00 (33.3% implied). 
                            Kelly suggests betting 10% of bankroll.
                          </p>
                        </div>
                        <div className="bg-betting-dark/30 rounded-lg p-4">
                          <h4 className="text-white font-medium mb-2">Football Match</h4>
                          <p className="text-sm">
                            Your model gives Team A 60% win chance, but odds are 2.20 (45.5% implied). 
                            Kelly recommends 22.7% of bankroll.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </Layout>
  )
} 