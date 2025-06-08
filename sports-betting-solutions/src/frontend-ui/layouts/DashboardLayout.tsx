'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Home,
  HelpCircle,
  Settings,
  LogOut,
  ClipboardList,
  Clock,
  UserCircle,
  LineChart,
  CircleDollarSign,
  BarChart2,
  ChevronDown,
  Wrench,
  TrendingUp,
  Database
} from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { useTheme } from '@/components/providers';
import { useUserProfile } from '@/hooks/useUserProfile';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const { hasProAccess, loading } = useUserProfile();
  const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);
  const [proToolsDropdownOpen, setProToolsDropdownOpen] = useState(false);

  const isActive = (path: string) => {
    return pathname === path;
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Determine theme-specific styles
  const getActiveStyle = (isItemActive: boolean) => {
    if (isItemActive) {
      return 'bg-betting-green/10 text-betting-green';
    } else {
      return 'text-white hover:text-betting-green hover:bg-betting-green/10';
    }
  };

  // Get navbar background - use betting-dark like OddsVantage
  const getNavbarBackground = () => {
    return 'bg-betting-dark/90 backdrop-blur-md border-betting-green/20';
  };
  
  // Get dropdown background - use betting-dark like OddsVantage
  const getDropdownBackground = () => {
    return 'bg-betting-dark border-betting-green/20';
  };
  
  // Get heading text color - use white like OddsVantage
  const getHeaderTextColor = () => {
    return 'text-white';
  };

  // Get subtext color - use gray-300 like OddsVantage
  const getSubtextColor = () => {
    return 'text-gray-300';
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className={`${getNavbarBackground()} border-b sticky top-0 z-50`}>
        <div className="flex items-center justify-between px-4 max-w-7xl mx-auto">
          {/* Logo and Title */}
          <div className="py-4 px-4 flex items-center">
            <div>
              <h1 className="font-heading text-2xl font-bold text-white">
                Turf<span className="text-betting-green">Tracker</span>
              </h1>
            </div>
          </div>
          
          {/* Main Navigation */}
          <nav className="flex items-center space-x-6 mx-auto">
            <Link 
              href="/betting-dashboard"
              className={`py-3 px-5 text-base font-medium transition ${
                getActiveStyle(isActive('/betting-dashboard'))
              }`}
            >
              Dashboard
            </Link>
            
            <Link 
              href="/analytics"
              className={`py-3 px-5 text-base font-medium transition ${
                getActiveStyle(isActive('/analytics'))
              }`}
            >
              Analytics
            </Link>
            
            <Link 
              href="/all-bets"
              className={`py-3 px-5 text-base font-medium transition ${
                getActiveStyle(isActive('/all-bets'))
              }`}
            >
              All Bets
            </Link>
            
            {/* Account Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setAccountDropdownOpen(!accountDropdownOpen);
                  if (proToolsDropdownOpen) setProToolsDropdownOpen(false);
                }}
                className={`flex items-center gap-x-2 py-3 px-5 text-base font-medium transition ${
                  isActive('/account') || isActive('/settings') || isActive('/help') ? 
                  'bg-betting-green/10 text-betting-green' : 
                  'text-white hover:text-betting-green hover:bg-betting-green/10'
                }`}
              >
                Account
                <ChevronDown className={`w-4 h-4 transition-transform ${accountDropdownOpen ? 'transform rotate-180' : ''}`} />
              </button>
              
              {accountDropdownOpen && (
                <div className={`absolute right-0 mt-1 w-48 rounded-md shadow-lg ${getDropdownBackground()} border`}>
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      onClick={() => router.push('/account')}
                      className="block w-full text-left px-4 py-2 text-base font-medium text-white hover:bg-betting-green/10 hover:text-betting-green transition"
                      role="menuitem"
                    >
                      Profile (OddsVantage)
                    </button>
                    <Link 
                      href="/settings"
                      className={`block px-4 py-2 text-base font-medium transition ${getActiveStyle(isActive('/settings'))}`}
                      role="menuitem"
                    >
                      Settings
                    </Link>
                    <Link 
                      href="/help"
                      className={`block px-4 py-2 text-base font-medium transition ${getActiveStyle(isActive('/help'))}`}
                      role="menuitem"
                    >
                      Help & Support
                    </Link>
                    <button 
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-base font-medium text-white hover:bg-betting-green/10 hover:text-betting-green transition"
                      role="menuitem"
                    >
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* Pro Tools Dropdown */}
            <div className="relative">
              <button 
                onClick={() => {
                  setProToolsDropdownOpen(!proToolsDropdownOpen);
                  if (accountDropdownOpen) setAccountDropdownOpen(false);
                }}
                className={`flex items-center gap-x-2 py-3 px-5 text-base font-medium transition ${
                  isActive('/pro-analytics') || isActive('/large-data-tool') ? 
                  'bg-betting-green/10 text-betting-green' : 
                  'text-white hover:text-betting-green hover:bg-betting-green/10'
                }`}
              >
                Pro Tools
                <ChevronDown className={`w-4 h-4 transition-transform ${proToolsDropdownOpen ? 'transform rotate-180' : ''}`} />
              </button>
              
              {proToolsDropdownOpen && (
                <div className={`absolute right-0 mt-1 w-56 rounded-md shadow-lg ${getDropdownBackground()} border`}>
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    {loading ? (
                      <div className="py-2 px-4 text-center">
                        <p className={`text-sm ${getSubtextColor()}`}>Loading...</p>
                      </div>
                    ) : hasProAccess ? (
                      <>
                        <Link
                          href="/pro-analytics"
                          className={`flex items-center gap-x-2 px-4 py-2 text-base font-medium transition ${getActiveStyle(isActive('/pro-analytics'))}`}
                          role="menuitem"
                        >
                          <TrendingUp className="w-4 h-4" />
                          Pro Analytics
                        </Link>
                        <Link
                          href="/large-data-tool"
                          className={`flex items-center gap-x-2 px-4 py-2 text-base font-medium transition ${getActiveStyle(isActive('/large-data-tool'))}`}
                          role="menuitem"
                        >
                          <Database className="w-4 h-4" />
                          Large Data Tool
                        </Link>
                      </>
                    ) : (
                      <div className="py-3 px-4 text-center">
                        <p className={`text-sm ${getSubtextColor()} mb-2`}>
                          Pro Tools require premium membership
                        </p>
                        <button
                          onClick={() => router.push('/account')}
                          className="text-xs px-3 py-1 rounded bg-betting-green/20 text-betting-green hover:bg-betting-green/30 transition"
                        >
                          Upgrade Plan
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </nav>
          
          {/* Back to OddsVantage Link */}
          <div className="w-[200px] flex justify-end">
            <button
              onClick={() => router.push('/account')}
              className="text-sm px-3 py-2 rounded text-white hover:text-betting-green hover:bg-betting-green/10 transition"
            >
              ← Back to OddsVantage
            </button>
          </div>
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
} 