'use client';

import Link from "next/link";
import { ArrowLeft, TrendingUp, Award, Clock, Target } from "lucide-react";
import Layout from "@/components/layout/Layout";

const topTrainers = [
  { name: "Willie Mullins", wins: 45, runs: 120, strikeRate: 37.5, profit: "+£2,450" },
  { name: "Gordon Elliott", wins: 38, runs: 105, strikeRate: 36.2, profit: "+£1,890" },
  { name: "Nicky Henderson", wins: 32, runs: 95, strikeRate: 33.7, profit: "+£1,650" },
  { name: "Paul Nicholls", wins: 29, runs: 88, strikeRate: 33.0, profit: "+£1,420" },
  { name: "Dan Skelton", wins: 26, runs: 82, strikeRate: 31.7, profit: "+£1,180" }
];

const topJockeys = [
  { name: "Rachael Blackmore", wins: 52, runs: 145, strikeRate: 35.9, profit: "+£2,890" },
  { name: "Paul Townend", wins: 48, runs: 132, strikeRate: 36.4, profit: "+£2,650" },
  { name: "Nico de Boinville", wins: 41, runs: 118, strikeRate: 34.7, profit: "+£2,210" },
  { name: "Harry Cobden", wins: 38, runs: 112, strikeRate: 33.9, profit: "+£1,980" },
  { name: "Brian Hughes", wins: 35, runs: 108, strikeRate: 32.4, profit: "+£1,750" }
];

const recentForm = [
  { 
    track: "Cheltenham", 
    race: "Champion Hurdle", 
    winner: "Constitution Hill", 
    odds: "4/6F", 
    trainer: "Nicky Henderson",
    jockey: "Nico de Boinville",
    time: "3:28.45"
  },
  { 
    track: "Aintree", 
    race: "Grand National", 
    winner: "Noble Yeats", 
    odds: "50/1", 
    trainer: "Emmet Mullins",
    jockey: "Sam Waley-Cohen",
    time: "9:20.26"
  },
  { 
    track: "Ascot", 
    race: "King George VI Chase", 
    winner: "L'Homme Presse", 
    odds: "9/2", 
    trainer: "Venetia Williams",
    jockey: "Charlie Deutsch",
    time: "6:42.18"
  }
];

const trackStats = [
  { name: "Cheltenham", races: 156, favorites: 52, favStrike: 33.3, avgField: 12.4 },
  { name: "Aintree", races: 142, favorites: 48, favStrike: 33.8, avgField: 11.8 },
  { name: "Ascot", races: 138, favorites: 46, favStrike: 33.3, avgField: 10.9 },
  { name: "Newmarket", races: 134, favorites: 51, favStrike: 38.1, avgField: 13.2 }
];

export default function HorseRacingData() {
  return (
    <Layout>
      <div className="min-h-screen bg-betting-dark text-white py-8 font-sans">
        <div className="max-w-7xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link href="/horse-racing" className="inline-flex items-center text-betting-green hover:text-white mb-4 transition">
              <ArrowLeft size={20} className="mr-2" />
              Back to Horse Racing Hub
            </Link>
            <h1 className="text-4xl font-heading text-betting-green mb-2">Free Racing Data</h1>
            <p className="text-lg text-gray-300 max-w-3xl">
              Access basic racing statistics, form data, and performance metrics. Upgrade to Turf Tracker for advanced analytics and AI predictions.
            </p>
          </div>

          {/* Quick Overview Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-betting-green/10 border border-betting-green/30 rounded-lg p-4 text-center">
              <TrendingUp size={24} className="text-betting-green mx-auto mb-2" />
              <div className="text-2xl font-bold text-betting-green">34.2%</div>
              <div className="text-sm text-gray-300">Avg Favorite Strike Rate</div>
            </div>
            <div className="bg-betting-green/10 border border-betting-green/30 rounded-lg p-4 text-center">
              <Award size={24} className="text-betting-green mx-auto mb-2" />
              <div className="text-2xl font-bold text-betting-green">570</div>
              <div className="text-sm text-gray-300">Races This Month</div>
            </div>
            <div className="bg-betting-green/10 border border-betting-green/30 rounded-lg p-4 text-center">
              <Clock size={24} className="text-betting-green mx-auto mb-2" />
              <div className="text-2xl font-bold text-betting-green">12.1</div>
              <div className="text-sm text-gray-300">Avg Field Size</div>
            </div>
            <div className="bg-betting-green/10 border border-betting-green/30 rounded-lg p-4 text-center">
              <Target size={24} className="text-betting-green mx-auto mb-2" />
              <div className="text-2xl font-bold text-betting-green">£4.2M</div>
              <div className="text-sm text-gray-300">Total Prize Money</div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 mb-8">
            {/* Top Trainers */}
            <div className="bg-betting-dark border border-betting-green/20 rounded-xl p-6">
              <h2 className="text-2xl font-heading text-betting-green mb-4">Top Trainers (Last 30 Days)</h2>
              <div className="space-y-3">
                {topTrainers.map((trainer, index) => (
                  <div key={trainer.name} className="flex items-center justify-between p-3 bg-betting-green/5 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-betting-green/20 rounded-full flex items-center justify-center text-betting-green font-bold text-sm mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{trainer.name}</div>
                        <div className="text-sm text-gray-400">{trainer.wins}/{trainer.runs} ({trainer.strikeRate}%)</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-betting-green font-semibold">{trainer.profit}</div>
                      <div className="text-xs text-gray-400">P&L</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Jockeys */}
            <div className="bg-betting-dark border border-betting-green/20 rounded-xl p-6">
              <h2 className="text-2xl font-heading text-betting-green mb-4">Top Jockeys (Last 30 Days)</h2>
              <div className="space-y-3">
                {topJockeys.map((jockey, index) => (
                  <div key={jockey.name} className="flex items-center justify-between p-3 bg-betting-green/5 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-betting-green/20 rounded-full flex items-center justify-center text-betting-green font-bold text-sm mr-3">
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{jockey.name}</div>
                        <div className="text-sm text-gray-400">{jockey.wins}/{jockey.runs} ({jockey.strikeRate}%)</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-betting-green font-semibold">{jockey.profit}</div>
                      <div className="text-xs text-gray-400">P&L</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Big Winners */}
          <div className="mb-8">
            <h2 className="text-2xl font-heading text-betting-green mb-4">Recent Notable Winners</h2>
            <div className="bg-betting-dark border border-betting-green/20 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-betting-green/10">
                    <tr>
                      <th className="text-left p-4 text-betting-green font-semibold">Track</th>
                      <th className="text-left p-4 text-betting-green font-semibold">Race</th>
                      <th className="text-left p-4 text-betting-green font-semibold">Winner</th>
                      <th className="text-left p-4 text-betting-green font-semibold">Odds</th>
                      <th className="text-left p-4 text-betting-green font-semibold">Trainer</th>
                      <th className="text-left p-4 text-betting-green font-semibold">Jockey</th>
                      <th className="text-left p-4 text-betting-green font-semibold">Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentForm.map((result, index) => (
                      <tr key={index} className="border-t border-betting-green/10 hover:bg-betting-green/5">
                        <td className="p-4 text-white font-semibold">{result.track}</td>
                        <td className="p-4 text-gray-300">{result.race}</td>
                        <td className="p-4 text-betting-green font-semibold">{result.winner}</td>
                        <td className="p-4 text-white">{result.odds}</td>
                        <td className="p-4 text-gray-300">{result.trainer}</td>
                        <td className="p-4 text-gray-300">{result.jockey}</td>
                        <td className="p-4 text-gray-300">{result.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Track Statistics */}
          <div className="mb-8">
            <h2 className="text-2xl font-heading text-betting-green mb-4">Track Statistics</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {trackStats.map((track) => (
                <div key={track.name} className="bg-betting-dark border border-betting-green/20 rounded-xl p-6">
                  <h3 className="text-lg font-heading text-betting-green mb-3">{track.name}</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Races:</span>
                      <span className="text-white font-semibold">{track.races}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fav Wins:</span>
                      <span className="text-white font-semibold">{track.favorites}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Fav Strike:</span>
                      <span className="text-betting-green font-semibold">{track.favStrike}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Avg Field:</span>
                      <span className="text-white font-semibold">{track.avgField}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Premium Upgrade Banner */}
          <div className="bg-gradient-to-r from-betting-green/10 to-betting-dark/80 border border-betting-green/30 rounded-xl p-8">
            <div className="text-center">
              <h3 className="text-2xl font-heading text-betting-green mb-4">Unlock Advanced Racing Analytics</h3>
              <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
                Get access to detailed form analysis, speed figures, sectional times, trainer/jockey combinations, AI predictions, and much more with Turf Tracker Premium.
              </p>
              <div className="grid md:grid-cols-3 gap-4 mb-6 max-w-3xl mx-auto">
                <div className="bg-betting-green/10 border border-betting-green/30 rounded-lg p-4">
                  <div className="text-betting-green font-semibold mb-2">Speed Figures</div>
                  <div className="text-sm text-gray-300">Advanced speed ratings and sectional analysis</div>
                </div>
                <div className="bg-betting-green/10 border border-betting-green/30 rounded-lg p-4">
                  <div className="text-betting-green font-semibold mb-2">AI Predictions</div>
                  <div className="text-sm text-gray-300">Machine learning powered race predictions</div>
                </div>
                <div className="bg-betting-green/10 border border-betting-green/30 rounded-lg p-4">
                  <div className="text-betting-green font-semibold mb-2">Bet Tracking</div>
                  <div className="text-sm text-gray-300">Complete performance management system</div>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/turf-tracker" className="bg-betting-green text-white px-8 py-3 rounded-lg hover:bg-betting-secondary transition font-semibold">
                  Upgrade to Turf Tracker
                </Link>
                <Link href="/tools/horse-racing-returns" className="border border-betting-green text-betting-green px-8 py-3 rounded-lg hover:bg-betting-green hover:text-white transition font-semibold">
                  Try Free Tools
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 