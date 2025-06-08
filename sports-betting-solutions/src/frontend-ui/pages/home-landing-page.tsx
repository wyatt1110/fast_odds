'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { ArrowRight, BarChart2, TrendingUp, Dumbbell } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if user is already logged in
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If logged in, redirect to account page
      if (session) {
        router.push('/account');
      }
    };
    
    checkSession();
  }, [router]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-950">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gray-950 z-0"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-950/95 to-gray-950/70 z-10"></div>
        
        <div className="container relative z-20 mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-in">
                Gain the <span className="text-green-500">Edge</span> in Horse Racing
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-8">
                Professional betting tools and data analysis for serious players. Elevate your strategy with advanced insights and predictive analytics.
              </p>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/turf-tracker"
                  className="inline-flex items-center justify-center rounded-md border border-green-600 px-6 py-3 text-base font-medium text-green-500 hover:bg-green-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Explore TurfTracker
                </Link>
              </div>
            </div>
            
            <div className="hidden lg:block p-4">
              <div className="aspect-video rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center shadow-xl border border-gray-800">
                <div className="text-center">
                  <p className="text-gray-300 mb-4 text-lg">TurfTracker Dashboard</p>
                  <p className="text-sm text-gray-400">Advanced betting analytics platform</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 bg-gradient-to-b from-gray-950 to-gray-950/95">
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
                className="bg-gray-900 border border-gray-800 rounded-xl p-6 flex flex-col items-center text-center shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-16 h-16 rounded-full bg-green-900/20 flex items-center justify-center mb-5">
                  <feature.icon className="text-green-500" size={24} />
                </div>
                <h3 className="font-heading text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-gray-300">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Video Preview Section */}
      <section className="py-20 bg-gray-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center mb-12">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-4">
              The Power of OddsVantage
            </h2>
            <p className="text-gray-300">
              See our premium dashboard and betting tools in action. Designed for serious players who demand excellence.
            </p>
          </div>
          
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 max-w-5xl mx-auto shadow-xl">
            <div className="aspect-video rounded-lg bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center border border-gray-800">
              <div className="text-center">
                <h3 className="font-heading text-2xl font-semibold text-white mb-4">TurfTracker Preview</h3>
                <p className="text-gray-300 mb-6">Explore our intuitive interface and powerful tools</p>
                <Link
                  href="/turf-tracker"
                  className="inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Go to Dashboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-b from-gray-950/95 to-gray-950">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 md:p-12 max-w-5xl mx-auto shadow-xl">
            <div className="text-center">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-white mb-6">
                Ready to Elevate Your Betting Strategy?
              </h2>
              <p className="text-lg text-gray-300 mb-8 max-w-2xl mx-auto">
                Join the professionals who rely on OddsVantage for premium insights and betting intelligence.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Create Your Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
                <Link
                  href="/turf-tracker"
                  className="inline-flex items-center justify-center rounded-md border border-green-600 px-6 py-3 text-base font-medium text-green-500 hover:bg-green-600 hover:text-white focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  Explore TurfTracker
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
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