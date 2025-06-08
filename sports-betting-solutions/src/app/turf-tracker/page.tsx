'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/supabase/client";
import Layout from "@/components/layout/Layout";

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
  
  if (!loading && !user) {
    router.push("/login");
    return null;
  }
  
  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen bg-betting-dark">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-betting-green"></div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <div className="flex-1 space-y-6 p-4 md:p-8 max-w-4xl mx-auto bg-betting-dark min-h-screen">
        <Card className="bg-betting-dark border-betting-green/20">
          <CardHeader className="pb-2">
            <CardTitle className="font-heading text-2xl text-white">Turf Tracker</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center p-8">
              <h2 className="text-2xl font-bold mb-6 text-white">Welcome to Turf Tracker</h2>
              <p className="text-lg mb-8 text-gray-300">
                Your premium horse racing analysis and betting tracking tool.
              </p>
              
              <div className="mb-8">
                <p className="mb-4 text-gray-300">Turf Tracker helps you:</p>
                <ul className="text-left max-w-md mx-auto space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2 text-betting-green">✓</span>
                    <span className="text-gray-300">Track all your horse racing bets in one place</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-betting-green">✓</span>
                    <span className="text-gray-300">Analyze your betting performance with advanced analytics</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-betting-green">✓</span>
                    <span className="text-gray-300">Get insights on profitable tracks and jockeys</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-betting-green">✓</span>
                    <span className="text-gray-300">Access premium horse racing data and predictions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2 text-betting-green">✓</span>
                    <span className="text-gray-300">Verify race information with our racing API integration</span>
                  </li>
                </ul>
              </div>
              
              <Button 
                className="bg-betting-green hover:bg-betting-secondary text-white px-8 py-6 text-lg"
                onClick={() => router.push("/betting-dashboard")}
              >
                Launch Turf Tracker App
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
} 