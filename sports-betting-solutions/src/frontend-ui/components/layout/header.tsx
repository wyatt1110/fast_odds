'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogOut, Menu, X, Sun, Moon, Calendar } from 'lucide-react';
import { useTheme } from '@/components/providers';
import { Avatar } from '@/components/ui/avatar';

interface HeaderProps {
  onLogout: () => void;
  user?: {
    name?: string;
    email?: string;
    avatarUrl?: string;
  };
}

export default function Header({ onLogout, user }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  // Theme-specific styles
  const getHeaderBg = () => theme === 'dark' ? 'bg-gray-900' : theme === 'racing' ? 'bg-charcoal-900' : 'bg-white';
  const getBorderColor = () => theme === 'dark' ? 'border-gray-700' : theme === 'racing' ? 'border-charcoal-700' : 'border-gray-200';
  const getTextColor = () => theme === 'dark' || theme === 'racing' ? 'text-white' : 'text-gray-900';
  const getMutedTextColor = () => theme === 'dark' ? 'text-gray-400' : theme === 'racing' ? 'text-gray-300' : 'text-gray-500';
  const getLinkColor = () => theme === 'dark' ? 'text-gray-300 hover:text-white' : theme === 'racing' ? 'text-gray-200 hover:text-white' : 'text-gray-700 hover:text-gray-900';
  const getActiveLinkColor = () => {
    if (theme === 'dark') return 'text-blue-400 border-blue-400';
    if (theme === 'racing') return 'text-racing-500 border-racing-500';
    return 'text-blue-600 border-blue-600';
  };
  const getMobileMenuBg = () => theme === 'dark' ? 'bg-gray-800' : theme === 'racing' ? 'bg-charcoal-800' : 'bg-white';
  const getThemeButtonBg = () => theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600' : theme === 'racing' ? 'bg-charcoal-700 hover:bg-charcoal-600' : 'bg-gray-100 hover:bg-gray-200';

  // Toggle theme function
  const handleThemeChange = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('racing');
    else setTheme('light');
  };

  // Get theme icon
  const getThemeIcon = () => {
    if (theme === 'light') return <Moon className="h-4 w-4" />;
    if (theme === 'dark') return <Calendar className="h-4 w-4" />;
    return <Sun className="h-4 w-4" />;
  };

  // Function to check if a link is active
  const isLinkActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    <header className={`${getHeaderBg()} border-b ${getBorderColor()} sticky top-0 z-20`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Desktop Navigation */}
          <div className="flex items-center">
            <Link href="/" className={`font-bold text-xl ${getTextColor()} mr-8`}>
              {theme === 'racing' ? 'Racing Tracker' : 'Bet Manager'}
            </Link>
            
            <nav className="hidden md:flex space-x-4">
              <Link 
                href="/dashboard" 
                className={`py-2 px-3 font-medium border-b-2 ${isLinkActive('/dashboard') 
                  ? getActiveLinkColor() 
                  : `border-transparent ${getLinkColor()}`}`}
              >
                Dashboard
              </Link>
              <Link 
                href="/place-bet" 
                className={`py-2 px-3 font-medium border-b-2 ${isLinkActive('/place-bet') 
                  ? getActiveLinkColor() 
                  : `border-transparent ${getLinkColor()}`}`}
              >
                Place Bet
              </Link>
              <Link 
                href="/active-bets" 
                className={`py-2 px-3 font-medium border-b-2 ${isLinkActive('/active-bets') 
                  ? getActiveLinkColor() 
                  : `border-transparent ${getLinkColor()}`}`}
              >
                Active Bets
              </Link>
              <Link 
                href="/analytics" 
                className={`py-2 px-3 font-medium border-b-2 ${isLinkActive('/analytics') 
                  ? getActiveLinkColor() 
                  : `border-transparent ${getLinkColor()}`}`}
              >
                Analytics
              </Link>
            </nav>
          </div>
          
          {/* Right side: Theme Toggle, User Menu & Mobile Menu Button */}
          <div className="flex items-center">
            {/* Theme Toggle */}
            <button
              onClick={handleThemeChange}
              className={`p-2 rounded-full ${getThemeButtonBg()} ${getTextColor()} mr-4`}
              aria-label="Toggle theme"
            >
              {getThemeIcon()}
            </button>
            
            {/* User Info - Desktop */}
            <div className="hidden md:flex items-center">
              {user && (
                <div className="flex items-center mr-4">
                  <Avatar className="h-8 w-8 mr-2">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name || 'User'} />
                    ) : (
                      <div className="bg-blue-500 text-white h-full w-full flex items-center justify-center">
                        {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                    )}
                  </Avatar>
                  <div>
                    <p className={`text-sm font-medium ${getTextColor()}`}>
                      {user.name || user.email || 'User'}
                    </p>
                  </div>
                </div>
              )}
              
              <button
                onClick={onLogout}
                className={`flex items-center text-sm font-medium ${getLinkColor()} px-3 py-2 rounded-md`}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </button>
            </div>
            
            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-md focus:outline-none"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className={`h-6 w-6 ${getTextColor()}`} />
              ) : (
                <Menu className={`h-6 w-6 ${getTextColor()}`} />
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className={`md:hidden ${getMobileMenuBg()} border-t ${getBorderColor()}`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            <Link 
              href="/dashboard" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${isLinkActive('/dashboard') 
                ? getActiveLinkColor() 
                : getLinkColor()}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Dashboard
            </Link>
            <Link 
              href="/place-bet" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${isLinkActive('/place-bet') 
                ? getActiveLinkColor() 
                : getLinkColor()}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Place Bet
            </Link>
            <Link 
              href="/active-bets" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${isLinkActive('/active-bets') 
                ? getActiveLinkColor() 
                : getLinkColor()}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Active Bets
            </Link>
            <Link 
              href="/analytics" 
              className={`block px-3 py-2 rounded-md text-base font-medium ${isLinkActive('/analytics') 
                ? getActiveLinkColor() 
                : getLinkColor()}`}
              onClick={() => setIsMenuOpen(false)}
            >
              Analytics
            </Link>
          </div>
          
          {/* User info in mobile menu */}
          {user && (
            <div className={`border-t ${getBorderColor()} pt-4 pb-3 px-4`}>
              <div className="flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name || 'User'} />
                  ) : (
                    <div className="bg-blue-500 text-white h-full w-full flex items-center justify-center">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                </Avatar>
                <div>
                  <p className={`text-sm font-medium ${getTextColor()}`}>
                    {user.name || 'User'}
                  </p>
                  {user.email && (
                    <p className={`text-xs ${getMutedTextColor()}`}>
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="mt-3">
                <button
                  onClick={onLogout}
                  className={`flex items-center w-full text-left px-3 py-2 rounded-md text-base font-medium ${getLinkColor()}`}
                >
                  <LogOut className="h-5 w-5 mr-2" />
                  Logout
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
} 