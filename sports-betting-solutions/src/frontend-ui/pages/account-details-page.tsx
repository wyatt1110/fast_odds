'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser, supabase } from '@/lib/supabase/client';
import { User, Mail, Phone, MapPin, Calendar, Shield } from 'lucide-react';
import { useTheme } from '@/components/providers';

export default function AccountDetailsPage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { theme } = useTheme();

  // Theme helper functions
  const getCardBg = () => theme === 'dark' ? 'bg-gray-800' : theme === 'racing' ? 'bg-charcoal-800' : 'bg-white';
  const getBorderColor = () => theme === 'dark' ? 'border-gray-700' : theme === 'racing' ? 'border-charcoal-700' : 'border-gray-200';
  const getTextColor = () => theme === 'dark' || theme === 'racing' ? 'text-white' : 'text-gray-900';
  const getMutedTextColor = () => theme === 'dark' ? 'text-gray-400' : theme === 'racing' ? 'text-gray-300' : 'text-gray-500';
  const getIconColor = () => theme === 'dark' ? 'text-gray-500' : theme === 'racing' ? 'text-gray-400' : 'text-gray-400';
  const getButtonBg = () => theme === 'dark' ? 'bg-gray-700 hover:bg-gray-600 text-white' : theme === 'racing' ? 'bg-charcoal-700 hover:bg-charcoal-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700';
  const getHeaderBg = () => theme === 'dark' ? 'bg-gray-700' : theme === 'racing' ? 'bg-charcoal-700' : 'bg-gray-50';
  const getBadgeBg = () => theme === 'dark' ? 'bg-green-900 text-green-300' : theme === 'racing' ? 'bg-racing-900 text-racing-300' : 'bg-green-100 text-green-800';
  const getAvatarBg = () => theme === 'dark' ? 'bg-blue-900 text-blue-300' : theme === 'racing' ? 'bg-racing-800 text-racing-300' : 'bg-blue-100 text-blue-600';
  const getLoadingSpinnerColor = () => theme === 'racing' ? 'border-racing-500' : theme === 'dark' ? 'border-gray-300' : 'border-blue-600';
  
  // Special title styling for dark mode with animation
  const getTitleStyle = () => {
    if (theme === 'dark') {
      return 'text-blue-400 font-extrabold text-3xl tracking-wide animate-pulse shadow-text-blue';
    } else if (theme === 'racing') {
      return 'text-racing-400 font-bold text-2xl';
    } else {
      return 'text-gray-900 font-bold text-2xl';
    }
  };

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      const currentUser = await getCurrentUser();
      
      if (!currentUser) {
        router.push('/login');
        return;
      }
      
      setUser(currentUser);
      setIsLoading(false);
    };
    
    fetchUser();
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${getLoadingSpinnerColor()}`}></div>
      </div>
    );
  }

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <header className="mb-6">
        <h1 className={getTitleStyle()}>Account Profile</h1>
        <p className={`mt-1 text-sm ${getMutedTextColor()}`}>Manage your account information and preferences</p>
      </header>
      
      <div className={`${getCardBg()} shadow rounded-lg overflow-hidden border ${getBorderColor()}`}>
        <div className={`px-4 py-5 sm:px-6 border-b ${getBorderColor()}`}>
          <div className="flex items-center">
            <div className={`h-12 w-12 rounded-full ${getAvatarBg()} flex items-center justify-center font-bold text-xl`}>
              {user?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="ml-4">
              <h3 className={`text-lg font-medium leading-6 ${getTextColor()}`}>
                {user?.email?.split('@')[0] || 'User'}
              </h3>
              <p className={`text-sm ${getMutedTextColor()}`}>Member since {new Date(user?.created_at).toLocaleDateString() || 'N/A'}</p>
            </div>
          </div>
        </div>
        
        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <h4 className={`font-medium ${getTextColor()}`}>Account Information</h4>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Mail className={`h-5 w-5 ${getIconColor()} mr-3`} />
                  <div>
                    <p className={`text-sm font-medium ${getMutedTextColor()}`}>Email</p>
                    <p className={`text-sm ${getTextColor()}`}>{user?.email || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <User className={`h-5 w-5 ${getIconColor()} mr-3`} />
                  <div>
                    <p className={`text-sm font-medium ${getMutedTextColor()}`}>User ID</p>
                    <p className={`text-sm ${getTextColor()}`}>{user?.id || 'N/A'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className={`h-5 w-5 ${getIconColor()} mr-3`} />
                  <div>
                    <p className={`text-sm font-medium ${getMutedTextColor()}`}>Last Sign In</p>
                    <p className={`text-sm ${getTextColor()}`}>
                      {user?.last_sign_in_at 
                        ? new Date(user.last_sign_in_at).toLocaleString() 
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-6">
              <h4 className={`font-medium ${getTextColor()}`}>Security Settings</h4>
              
              <div className="space-y-4">
                <div className="flex items-center">
                  <Shield className={`h-5 w-5 ${getIconColor()} mr-3`} />
                  <div>
                    <p className={`text-sm font-medium ${getMutedTextColor()}`}>Account Status</p>
                    <p className={`text-sm ${getTextColor()}`}>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getBadgeBg()}`}>
                        Active
                      </span>
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="pt-4">
                <button
                  className={`inline-flex items-center px-4 py-2 border ${getBorderColor()} shadow-sm text-sm font-medium rounded-md ${getButtonBg()} focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
                >
                  Change Password
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 