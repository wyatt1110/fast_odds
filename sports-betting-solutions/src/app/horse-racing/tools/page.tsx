'use client';

import Link from "next/link";
import { ArrowLeft, Star, Zap, TrendingUp, Target, BarChart3, Brain } from "lucide-react";
import Layout from "@/components/layout/Layout";

const freeTools = [
  {
    name: "Horse Racing Returns Calculator",
    description: "Calculate potential returns for all bet types including singles, multiples, and complex bets like Patents and Yankees.",
    link: "/tools/horse-racing-returns",
    icon: <BarChart3 size={24} />
  },
  {
    name: "Matched Betting Calculator", 
    description: "Calculate optimal stakes for matched betting opportunities and qualifying losses.",
    link: "/tools/matched-betting",
    icon: <Target size={24} />
  },
  {
    name: "Draw No Bet Calculator",
    description: "Create Draw No Bet positions from traditional 1X2 markets with optimal stake distribution.",
    link: "/tools/draw-no-bet", 
    icon: <TrendingUp size={24} />
  },
  {
    name: "Double Chance Calculator",
    description: "Build Double Chance bets covering two outcomes with equal profit calculations.",
    link: "/tools/double-chance",
    icon: <Zap size={24} />
  }
];

const premiumFeatures = [
  {
    title: "Advanced Bet Tracking",
    description: "Complete performance management with automatic P&L calculations, ROI tracking, and detailed analytics.",
    icon: <BarChart3 size={32} className="text-betting-green" />
  },
  {
    title: "AI Race Analysis", 
    description: "Machine learning powered predictions with form analysis, speed figures, and value bet identification.",
    icon: <Brain size={32} className="text-betting-green" />
  },
  {
    title: "Speed Figures & Sectionals",
    description: "Advanced speed ratings, sectional times, and pace analysis for every runner.",
    icon: <Zap size={32} className="text-betting-green" />
  },
  {
    title: "Trainer/Jockey Stats",
    description: "Comprehensive statistics and trends for all trainers and jockeys with strike rates and profit analysis.",
    icon: <TrendingUp size={32} className="text-betting-green" />
  },
  {
    title: "Market Analysis",
    description: "Real-time odds movements, market trends, and money tracking across all major bookmakers.",
    icon: <Target size={32} className="text-betting-green" />
  },
  {
    title: "Portfolio Management",
    description: "Multi-bankroll tracking, staking plans, and risk management tools for professional punters.",
    icon: <Star size={32} className="text-betting-green" />
  }
];

export default function HorseRacingTools() {
  return (
    <Layout>
      <div className="min-h-screen bg-betting-dark text-white py-8 font-sans">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link href="/horse-racing" className="inline-flex items-center text-betting-green hover:text-white mb-4 transition">
              <ArrowLeft size={20} className="mr-2" />
              Back to Horse Racing Hub
            </Link>
            <h1 className="text-4xl font-heading text-betting-green mb-2">Horse Racing Tools</h1>
            <p className="text-lg text-gray-300 max-w-3xl">
              Professional betting tools and calculators for serious horse racing punters. Free tools available to all users, premium features with Turf Tracker.
            </p>
          </div>

          {/* Turf Tracker Premium Section */}
          <div className="mb-12">
            <div className="bg-gradient-to-r from-betting-green/10 to-betting-dark/80 border border-betting-green/30 rounded-xl p-8 shadow-lg">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                <div className="flex-1">
                  <div className="flex items-center mb-4">
                    <Star size={32} className="text-betting-green mr-3" />
                    <h2 className="text-3xl font-heading text-betting-green">Turf Tracker Premium</h2>
                  </div>
                  <p className="text-lg text-gray-200 mb-6">
                    The ultimate horse racing analysis and bet tracking platform. Advanced AI predictions, comprehensive form analysis, 
                    and professional-grade portfolio management tools used by winning punters.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Link href="/turf-tracker" className="bg-betting-green text-white px-8 py-3 rounded-lg hover:bg-betting-secondary transition font-semibold text-center">
                      Launch Turf Tracker
                    </Link>
                    <Link href="/turf-tracker" className="border border-betting-green text-betting-green px-8 py-3 rounded-lg hover:bg-betting-green hover:text-white transition font-semibold text-center">
                      View Features
                    </Link>
                  </div>
                </div>
                <div className="w-80 h-48 bg-betting-green/20 rounded-xl border border-betting-green/30 flex items-center justify-center">
                  <span className="text-betting-green/60 text-lg">Turf Tracker Preview</span>
                </div>
              </div>
            </div>
          </div>

          {/* Premium Features Grid */}
          <div className="mb-12">
            <h2 className="text-2xl font-heading text-betting-green mb-6">Premium Features</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {premiumFeatures.map((feature, index) => (
                <div key={index} className="bg-betting-dark border border-betting-green/20 rounded-xl p-6 hover:border-betting-green/40 transition">
                  <div className="mb-4">{feature.icon}</div>
                  <h3 className="text-lg font-heading text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Free Tools Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-heading text-betting-green mb-6">Free Betting Calculators</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {freeTools.map((tool, index) => (
                <Link key={index} href={tool.link} className="block bg-betting-green/10 border border-betting-green/30 hover:bg-betting-green/20 p-6 rounded-xl transition group">
                  <div className="flex items-start gap-4">
                    <div className="text-betting-green group-hover:text-white transition">
                      {tool.icon}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-betting-green transition">{tool.name}</h3>
                      <p className="text-gray-300 text-sm leading-relaxed">{tool.description}</p>
                      <div className="mt-3 text-betting-green font-semibold text-sm group-hover:text-white transition">
                        Try Calculator →
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Coming Soon Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-heading text-betting-green mb-6">Coming Soon</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-betting-dark border border-betting-green/20 rounded-xl p-6 opacity-75">
                <div className="mb-4">
                  <Brain size={24} className="text-betting-green/60" />
                </div>
                <h3 className="text-lg font-heading text-gray-400 mb-3">Form Analyzer</h3>
                <p className="text-gray-500 text-sm">AI-powered form analysis tool for individual horses and races.</p>
              </div>
              <div className="bg-betting-dark border border-betting-green/20 rounded-xl p-6 opacity-75">
                <div className="mb-4">
                  <Target size={24} className="text-betting-green/60" />
                </div>
                <h3 className="text-lg font-heading text-gray-400 mb-3">Value Bet Finder</h3>
                <p className="text-gray-500 text-sm">Automated value bet identification across all markets.</p>
              </div>
              <div className="bg-betting-dark border border-betting-green/20 rounded-xl p-6 opacity-75">
                <div className="mb-4">
                  <TrendingUp size={24} className="text-betting-green/60" />
                </div>
                <h3 className="text-lg font-heading text-gray-400 mb-3">Trend Analyzer</h3>
                <p className="text-gray-500 text-sm">Historical trend analysis for tracks, trainers, and jockeys.</p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-betting-dark border border-betting-green/20 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-heading text-betting-green mb-4">Ready to Take Your Betting to the Next Level?</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Join thousands of successful punters who use our professional tools and analysis to gain an edge over the bookmakers. 
              Start with our free tools or upgrade to Turf Tracker for the complete experience.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/turf-tracker" className="bg-betting-green text-white px-8 py-3 rounded-lg hover:bg-betting-secondary transition font-semibold">
                Start Free Trial
              </Link>
              <Link href="/horse-racing/data" className="border border-betting-green text-betting-green px-8 py-3 rounded-lg hover:bg-betting-green hover:text-white transition font-semibold">
                View Free Data
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 