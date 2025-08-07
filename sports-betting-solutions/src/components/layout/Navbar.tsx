'use client';

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  ChevronDown, 
  ChevronUp,
  LogIn,
  UserPlus,
  User,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { getCurrentUser, supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/use-toast";

const Navbar = () => {
  const [toolsOpen, setToolsOpen] = useState(false);
  const [racingDropdownOpen, setRacingDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Auth check failed:", error);
      } finally {
        setLoading(false);
      }
    };
    checkAuth();

    // Listen to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setUser(session?.user || null);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  // Close dropdowns when route changes
  useEffect(() => {
    setRacingDropdownOpen(false);
    setToolsOpen(false);
    setMobileMenuOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
      toast({
        title: "Signed out successfully",
      });
      router.push("/");
    } catch (error: any) {
      console.error("Sign out error:", error);
      toast({
        title: "Sign out failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-betting-dark/90 backdrop-blur-md border-b border-betting-green/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <span className="font-heading text-2xl font-bold text-white">
                Odds<span className="text-betting-green">Vantage</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-white hover:text-betting-green transition">
              <span>Home</span>
            </Link>

            {/* Horse Racing Dropdown */}
            <div className="relative group">
              <button
                type="button"
                className="flex items-center space-x-1 text-white hover:text-betting-green transition"
                onMouseEnter={() => setRacingDropdownOpen(true)}
                onMouseLeave={() => setRacingDropdownOpen(false)}
              >
                <span>Horse Racing</span>
                <ChevronDown size={16} />
              </button>
              
              <div className={`absolute left-0 mt-2 w-56 bg-betting-dark border border-betting-green/20 rounded-md shadow-lg z-50 ${racingDropdownOpen ? 'opacity-100 visible' : 'opacity-0 invisible'} transition-all duration-200`}
                   onMouseEnter={() => setRacingDropdownOpen(true)}
                   onMouseLeave={() => setRacingDropdownOpen(false)}>
                <Link href="/horse-racing/racecards" className="block px-4 py-2 text-white hover:bg-betting-green/10 transition">Racecards</Link>
                <Link href="/horse-racing/data" className="block px-4 py-2 text-white hover:bg-betting-green/10 transition">Free Racing Data</Link>
                <Link href="/turf-tracker" className="block px-4 py-2 text-white hover:bg-betting-green/10 transition">Turf Tracker</Link>
                <Link href="/horse-racing/pro-dashboard" className="block px-4 py-2 text-white hover:bg-betting-green/10 transition">Pro Dashboard</Link>
                <Link href="/horse-racing/ov-models" className="block px-4 py-2 text-white hover:bg-betting-green/10 transition">OV Models</Link>
              </div>
            </div>

            <Link href="/football" className="text-white hover:text-betting-green transition">
              <span>Football</span>
            </Link>

            {/* Betting Calculators Dropdown */}
            <div className="relative group">
              <button 
                className="flex items-center space-x-1 text-white hover:text-betting-green transition"
                type="button"
                onMouseEnter={() => setToolsOpen(true)}
                onMouseLeave={() => setToolsOpen(false)}
              >
                <span>Betting Calculators</span>
                <ChevronDown size={16} />
              </button>
              
              <div className={`absolute left-0 mt-2 w-56 bg-betting-dark border border-betting-green/20 rounded-md shadow-lg z-50 ${toolsOpen ? 'opacity-100 visible' : 'opacity-0 invisible'} transition-all duration-200`}
                   onMouseEnter={() => setToolsOpen(true)}
                   onMouseLeave={() => setToolsOpen(false)}>
                <Link href="/tools/matched-betting" className="block px-4 py-2 text-white hover:bg-betting-green/10 transition">Matched Betting Calculator</Link>
                <Link href="/tools/horse-racing-returns" className="block px-4 py-2 text-white hover:bg-betting-green/10 transition">Horse Racing Returns</Link>
                <Link href="/tools/draw-no-bet" className="block px-4 py-2 text-white hover:bg-betting-green/10 transition">Draw No Bet Calculator</Link>
                <Link href="/tools/double-chance" className="block px-4 py-2 text-white hover:bg-betting-green/10 transition">Double Chance Calculator</Link>
                <Link href="/tools/vig-calculator" className="block px-4 py-2 text-white hover:bg-betting-green/10 transition">Vig Calculator</Link>
                <Link href="/tools/kelly-criterion" className="block px-4 py-2 text-white hover:bg-betting-green/10 transition">Kelly Criterion Calculator</Link>
                <Link href="/tools/poisson-calculator" className="block px-4 py-2 text-white hover:bg-betting-green/10 transition">Poisson Probability Calculator</Link>
              </div>
            </div>

            <Link href="/leaderboards" className="text-white hover:text-betting-green transition">
              <span>Leaderboards</span>
            </Link>
          </div>

          {/* Authentication Section */}
          <div className="flex items-center space-x-3">
            {loading ? (
              <div className="w-24 h-8 bg-betting-dark/40 animate-pulse rounded"></div>
            ) : user ? (
              <>
                <Link href="/account">
                  <Button variant="outline" size="sm" className="border-betting-green text-betting-green hover:bg-betting-green hover:text-white">
                    <User size={16} className="mr-1" />
                    Account
                  </Button>
                </Link>
                <Button size="sm" className="bg-betting-green hover:bg-betting-secondary text-white" onClick={handleSignOut}>
                  <LogOut size={16} className="mr-1" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="outline" size="sm" className="border-betting-green text-betting-green hover:bg-betting-green hover:text-white">
                    <LogIn size={16} className="mr-1" />
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm" className="bg-betting-green hover:bg-betting-secondary text-white">
                    <UserPlus size={16} className="mr-1" />
                    Sign Up
                  </Button>
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button 
              className="md:hidden text-white" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-betting-green/20">
            <div className="flex flex-col space-y-4">
              <Link href="/" className="text-white hover:text-betting-green transition" onClick={() => setMobileMenuOpen(false)}>
                <span>Home</span>
              </Link>
              
              <Link href="/horse-racing" className="text-white hover:text-betting-green transition" onClick={() => setMobileMenuOpen(false)}>
                <span>Horse Racing</span>
              </Link>
              
              <Link href="/football" className="text-white hover:text-betting-green transition" onClick={() => setMobileMenuOpen(false)}>
                <span>Football</span>
              </Link>
              
              <Link href="/tools/matched-betting" className="text-white hover:text-betting-green transition" onClick={() => setMobileMenuOpen(false)}>
                <span>Betting Calculators</span>
              </Link>
              
              <Link href="/leaderboards" className="text-white hover:text-betting-green transition" onClick={() => setMobileMenuOpen(false)}>
                <span>Leaderboards</span>
              </Link>

              {user && (
                <>
                  <Link href="/turf-tracker" className="text-betting-green font-semibold hover:text-betting-secondary transition" onClick={() => setMobileMenuOpen(false)}>
                    <span>Turf Tracker</span>
                  </Link>
                  <Link href="/horse-racing/pro-dashboard" className="text-betting-green font-semibold hover:text-betting-secondary transition" onClick={() => setMobileMenuOpen(false)}>
                    <span>Pro Dashboard</span>
                  </Link>
                  <Link href="/horse-racing/ov-models" className="text-betting-green font-semibold hover:text-betting-secondary transition" onClick={() => setMobileMenuOpen(false)}>
                    <span>OV Models</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar; 