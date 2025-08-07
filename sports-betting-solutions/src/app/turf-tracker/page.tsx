'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/supabase/client";
import Layout from "@/components/layout/Layout";
import PageProtection from "@/components/auth/PageProtection";

export default function TurfTracker() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      setLoading(false);
    };
    fetchUser();
  }, []);
  
  // Loading state is handled by PageProtection component
  
  return (
    <Layout>
      <PageProtection 
        requiredAuth={true}
        redirectTo="/login"
        notificationMessage="You need to be logged in to access Turf Tracker"
      >
        <div className="flex-1 space-y-6 p-4 md:p-8 max-w-7xl mx-auto bg-betting-dark min-h-screen">
        <Card className="bg-gradient-to-br from-gray-800 to-gray-900 border-betting-green/30 shadow-lg rounded-xl overflow-hidden" 
              style={{boxShadow: '0 10px 25px -5px rgba(46, 206, 96, 0.3), 0 8px 10px -6px rgba(46, 206, 96, 0.2)'}}>
          <div 
            className="py-8 border-b border-betting-green/30 bg-gradient-to-br from-gray-800/60 via-gray-700/60 to-gray-800/60 backdrop-blur-sm shadow-lg"
          >
            <div className="text-center">
              <h1 className="font-horse text-4xl text-white font-bold tracking-tight uppercase">
                TURF TRACKER
              </h1>
            </div>
          </div>
          <CardContent>
            <div className="text-center p-8">
              <p className="text-xl mb-10 text-white font-light max-w-3xl mx-auto">
                A professional standard dashboard for bet and large data tracking. Take your bet analysis to the next level!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                {/* Core Features Column */}
                <div>
                  <h3 className="text-2xl font-semibold mb-6 text-betting-green">Core Features</h3>
                  <ul className="text-left space-y-4">
                    <li className="flex items-start">
                      <span className="mr-3 text-betting-green text-lg">✓</span>
                      <span className="text-white">Track all your horse racing bets in one place</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 text-betting-green text-lg">✓</span>
                      <span className="text-white">Manage multiple tipsters, systems and models all in one place</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 text-betting-green text-lg">✓</span>
                      <span className="text-white">Analyse and visualise your betting performance with our in-depth analytics tools</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-3 text-betting-green text-lg">✓</span>
                      <span className="text-white">Track your large data, simply enter the horse name and track and we will do the rest!</span>
                    </li>
                  <li className="flex items-start">
                      <span className="mr-3 text-betting-green text-lg">✓</span>
                      <span className="text-white">Never guess again, you can see your profit to each jockey, trainer, track and more!</span>
                  </li>
                  <li className="flex items-start">
                      <span className="mr-3 text-betting-green text-lg">✓</span>
                      <span className="text-white">Automated bet settling, profit tracking and we add the BSP and SP of each of your bets to your spreadsheet for you</span>
                    </li>
                  </ul>
                </div>
                
                {/* Premium Features Column */}
                <div className="bg-betting-green/10 p-6 rounded-xl border border-betting-green/30">
                  <h3 className="text-2xl font-semibold mb-6 text-betting-green">Premium Only Tools</h3>
                  <ul className="text-left space-y-4">
                    <li className="flex items-start">
                      <span className="mr-3 text-betting-green text-lg">★</span>
                      <span className="text-white">Access to our large data tool with thousands of bets both positive and negative EV to find profitable models</span>
                  </li>
                  <li className="flex items-start">
                      <span className="mr-3 text-betting-green text-lg">★</span>
                      <span className="text-white">Verify your bets with live odds from every bookmaker at the time of bet entry, plus average bookmaker and exchange odds</span>
                  </li>
                  <li className="flex items-start">
                      <span className="mr-3 text-betting-green text-lg">★</span>
                      <span className="text-white">Share your dashboard and appear on our leaderboards. Promote your own betting model!</span>
                  </li>
                  <li className="flex items-start">
                      <span className="mr-3 text-betting-green text-lg">★</span>
                      <span className="text-white">This also includes our premium racecards and notification bots!</span>
                  </li>
                </ul>
                  
                  <div className="mt-6 text-center">
                    <Button 
                      className="bg-betting-green hover:bg-betting-secondary text-white px-6 py-2 rounded-lg"
                      onClick={() => router.push("/membership")}
                    >
                      View Membership Tiers
                    </Button>
                  </div>
                </div>
              </div>
              
              <div className="mt-12 pt-6 border-t border-betting-green/20">
              <Button 
                  className="bg-gradient-to-r from-betting-green to-betting-secondary hover:from-betting-secondary hover:to-betting-green text-white px-12 py-6 text-xl transform hover:scale-105 transition-all duration-200 rounded-lg shadow-lg"
                  style={{boxShadow: '0 4px 14px rgba(46, 206, 96, 0.4)'}}
                onClick={() => router.push("/betting-dashboard")}
              >
                Launch Turf Tracker App
              </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </PageProtection>
    </Layout>
  );
} 