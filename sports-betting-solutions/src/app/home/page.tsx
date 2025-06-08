'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart2, TrendingUp, Dumbbell } from 'lucide-react';
import Layout from '@/components/layout/Layout';

export default function Home() {
  return (
    <Layout>
      <div className="flex flex-col min-h-screen bg-betting-dark">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-betting-dark z-0"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-betting-dark via-betting-dark/95 to-betting-dark/70 z-10"></div>
          
          <div className="container relative z-20 mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="text-center lg:text-left">
                <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-in">
                  Gain the <span className="text-betting-green">Edge</span> in Horse Racing
                </h1>
                <p className="text-lg md:text-xl text-gray-300 mb-8 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                  Professional betting tools and data analysis for serious players. Elevate your strategy with advanced insights and predictive analytics.
                </p>
                <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-medium text-white bg-betting-green hover:bg-betting-secondary focus:outline-none focus:ring-2 focus:ring-betting-green"
                  >
                    Get Started
                    <ArrowRight size={16} className="ml-2" />
                  </Link>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-md border border-betting-green px-6 py-3 text-base font-medium text-betting-green hover:bg-betting-green hover:text-white focus:outline-none focus:ring-2 focus:ring-betting-green"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
              
              <div className="hidden lg:block p-4 animate-scale-in" style={{ animationDelay: "0.6s" }}>
                <div className="aspect-video rounded-lg bg-gradient-to-br from-betting-dark to-betting-secondary flex items-center justify-center shadow-xl border border-betting-green/20">
                  <div className="text-center">
                    <p className="text-gray-300 mb-4 text-lg">Dashboard Preview</p>
                    <p className="text-sm text-gray-400">Video showcase coming soon</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section className="py-20 bg-gradient-to-b from-betting-dark to-betting-dark/95">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
                Betting Intelligence Redefined
              </h2>
              <p className="text-gray-300 max-w-2xl mx-auto">
                Our tools are crafted for professionals who expect excellence. Gain insights that others miss.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div 
                  key={index} 
                  className="bg-betting-dark border border-betting-green/20 rounded-xl p-6 flex flex-col items-center text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${0.2 * index}s` }}
                >
                  <div className="w-16 h-16 rounded-full bg-betting-green/20 flex items-center justify-center mb-5">
                    <feature.icon className="text-betting-green" size={24} />
                  </div>
                  <h3 className="font-heading text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        
        {/* Video Preview Section */}
        <section className="py-20 bg-betting-dark">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto text-center mb-12">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
                The Power of OddsVantage
              </h2>
              <p className="text-gray-300">
                See our premium dashboard and betting tools in action. Designed for serious players who demand excellence.
              </p>
            </div>
            
            <div className="bg-betting-dark border border-betting-green/20 rounded-xl p-6 max-w-5xl mx-auto shadow-xl">
              <div className="aspect-video rounded-lg bg-gradient-to-br from-betting-dark to-betting-secondary flex items-center justify-center border border-betting-green/10">
                <div className="text-center">
                  <h3 className="font-heading text-2xl font-semibold text-white mb-4">TurfTracker Preview</h3>
                  <p className="text-gray-300 mb-6">Explore our intuitive interface and powerful tools</p>
                  <Link
                    href="/login"
                    className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white bg-betting-green hover:bg-betting-secondary focus:outline-none focus:ring-2 focus:ring-betting-green"
                  >
                    Access TurfTracker
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-b from-betting-dark/95 to-betting-dark">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-betting-dark border border-betting-green/20 rounded-xl p-8 md:p-12 max-w-5xl mx-auto shadow-xl">
              <div className="text-center">
                <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-6">
                  Ready to Elevate Your Betting Strategy?
                </h2>
                <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                  Join the professionals who rely on OddsVantage for premium insights and betting intelligence.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    href="/register"
                    className="inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-medium text-white bg-betting-green hover:bg-betting-secondary focus:outline-none focus:ring-2 focus:ring-betting-green"
                  >
                    Create Your Account
                    <ArrowRight size={16} className="ml-2" />
                  </Link>
                  <Link
                    href="/horse-racing"
                    className="inline-flex items-center justify-center rounded-md border border-betting-green px-6 py-3 text-base font-medium text-betting-green hover:bg-betting-green hover:text-white focus:outline-none focus:ring-2 focus:ring-betting-green"
                  >
                    Explore Racing Data
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
}

// Feature data
const features = [
  {
    title: "Advanced Analytics",
    description: "Comprehensive data analysis of racing forms, jockey performance, and course conditions.",
    icon: BarChart2,
  },
  {
    title: "Market Trading Tools",
    description: "Real-time odds comparison and market movement analysis for optimal value identification.",
    icon: TrendingUp,
  },
  {
    title: "Performance Tracking",
    description: "Monitor your betting performance with detailed statistics and trend analysis.",
    icon: Dumbbell,
  }
]; 