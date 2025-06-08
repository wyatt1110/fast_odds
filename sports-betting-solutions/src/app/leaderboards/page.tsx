'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import Layout from "@/components/layout/Layout";

export default function Leaderboards() {
  return (
    <Layout>
      <div className="flex flex-col min-h-screen">
        {/* Hero Section */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 bg-betting-dark z-0"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-betting-dark via-betting-dark/95 to-betting-dark/70 z-10"></div>
          
          <div className="container relative z-20 mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 animate-fade-in">
                Betting <span className="text-betting-purple">Leaderboards</span>
              </h1>
              <p className="text-lg md:text-xl text-gray-300 mb-12 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                Compare your performance with the community and top bettors
              </p>
              
              <div className="relative w-full max-w-2xl mx-auto aspect-video premium-card p-4 overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-betting-dark to-betting-dark/90 backdrop-blur-sm opacity-95">
                  <div className="text-center p-8">
                    <h2 className="font-heading text-3xl font-bold text-white mb-4">Coming Soon</h2>
                    <p className="text-gray-300 mb-6">
                      Our community leaderboards and social betting features are currently in development. 
                      Sign up to participate when we launch.
                    </p>
                    <Link href="/register">
                      <Button className="bg-betting-purple hover:bg-betting-secondary text-white">
                        Join The Waiting List
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Layout>
  );
} 