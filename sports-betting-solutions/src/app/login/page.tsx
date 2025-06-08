'use client';

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import Layout from "@/components/layout/Layout";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Sign in with Supabase
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      
      // Success - redirect to account page
      toast({
        title: "Login successful",
        description: "Welcome back to OddsVantage!",
      });
      
      router.push("/account");
    } catch (error: any) {
      console.error("Login error:", error);
      
      toast({
        title: "Login failed",
        description: error.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex flex-col min-h-screen bg-betting-dark">
        {/* Hero Section */}
        <section className="py-12 md:py-16">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto">
              <div className="text-center mb-8">
                <h1 className="font-heading text-3xl font-bold text-white mb-2">
                  Sign In
                </h1>
                <p className="text-gray-300">
                  Access your OddsVantage account and premium features
                </p>
              </div>
              
              <div className="bg-betting-dark border border-betting-green/20 rounded-xl p-6 md:p-8 shadow-xl">
                <form onSubmit={handleLogin}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="email" className="text-white">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        placeholder="your@email.com" 
                        className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)} 
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="password" className="text-white">Password</Label>
                      <Input 
                        id="password" 
                        type="password" 
                        placeholder="••••••••" 
                        className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Checkbox id="remember" />
                        <Label htmlFor="remember" className="text-sm text-gray-300">
                          Remember me
                        </Label>
                      </div>
                      
                      <Link href="/forgot-password" className="text-sm text-betting-green hover:underline">
                        Forgot password?
                      </Link>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button 
                      type="submit" 
                      className="w-full bg-betting-green hover:bg-betting-secondary text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing in..." : "Sign In"}
                    </Button>
                  </div>
                </form>
                
                <div className="mt-6 text-center text-sm text-gray-400">
                  Don't have an account?{" "}
                  <Link href="/register" className="text-betting-green hover:underline">
                    Sign up
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