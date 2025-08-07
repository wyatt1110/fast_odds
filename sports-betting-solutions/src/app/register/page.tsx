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


export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Validation
    if (password !== confirmPassword) {
      toast({
        title: "Registration failed",
        description: "Passwords do not match.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (password.length < 8) {
      toast({
        title: "Registration failed",
        description: "Password must be at least 8 characters long.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (!agreeToTerms) {
      toast({
        title: "Registration failed",
        description: "Please agree to the terms and conditions.",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }
    
    try {
      // Create user using server-side API (no Supabase email confirmation)
      const registrationResponse = await fetch('/api/create-user-without-confirmation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          password: password,
          fullName: fullName,
        }),
      });
      
      if (!registrationResponse.ok) {
        const errorData = await registrationResponse.json();
        console.error('Registration failed:', errorData);
        throw new Error(errorData.error || 'Registration failed');
      }
      
      const result = await registrationResponse.json();
      console.log('User and profile created successfully:', result);

      // Sign the user in after creating them
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: password,
      });

      if (signInError) {
        console.error('Error signing in user:', signInError);
      } else {
        console.log('User signed in successfully:', signInData.user?.id);
      }

      // Send welcome email from our business email
      try {
        const emailResponse = await fetch('/api/send-welcome-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            fullName: fullName,
          }),
        });
        
        if (emailResponse.ok) {
          console.log('Welcome email sent successfully');
        } else {
          console.error('Failed to send welcome email');
        }
      } catch (emailError) {
        console.error('Error sending welcome email:', emailError);
        // Don't fail registration if email fails
      }
      
      // Success
      toast({
        title: "Registration successful!",
        description: "Welcome to OddsVantage! Choose your membership tier.",
      });
      
      // Clear form
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFullName("");
      setAgreeToTerms(false);
      
      // Redirect to membership page
      setTimeout(() => {
        router.push("/membership");
      }, 2000);
      
    } catch (error: any) {
      console.error("Registration error:", error);
      
      toast({
        title: "Registration failed",
        description: error.message || "Please try again.",
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
                  Create Account
                </h1>
                <p className="text-gray-300">
                  Join OddsVantage and access premium betting tools
                </p>
              </div>
              
              <div className="bg-betting-dark border border-betting-green/20 rounded-xl p-6 md:p-8 shadow-xl">
                <form onSubmit={handleRegister}>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="fullName" className="text-white">Full Name</Label>
                      <Input 
                        id="fullName" 
                        type="text" 
                        placeholder="Your full name" 
                        className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)} 
                        required
                      />
                    </div>

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
                        minLength={8}
                      />
                    </div>

                    <div>
                      <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
                      <Input 
                        id="confirmPassword" 
                        type="password" 
                        placeholder="••••••••" 
                        className="bg-betting-dark/50 border-betting-green/20 text-white placeholder:text-gray-400"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="terms" 
                        checked={agreeToTerms}
                        onCheckedChange={(checked) => setAgreeToTerms(checked as boolean)}
                      />
                      <Label htmlFor="terms" className="text-sm text-gray-300">
                        I agree to the{" "}
                        <Link href="/terms" className="text-betting-green hover:underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link href="/privacy" className="text-betting-green hover:underline">
                          Privacy Policy
                        </Link>
                      </Label>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Button 
                      type="submit" 
                      className="w-full bg-betting-green hover:bg-betting-secondary text-white"
                      disabled={isLoading}
                    >
                      {isLoading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </div>
                </form>
                
                <div className="mt-6 text-center text-sm text-gray-400">
                  Already have an account?{" "}
                  <Link href="/login" className="text-betting-green hover:underline">
                    Sign in
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