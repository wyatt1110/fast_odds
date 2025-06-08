'use client';

import React from 'react';
import { Bell, Eye, Moon, Sun, Globe, Save, Zap } from 'lucide-react';
import { useTheme } from '@/components/providers';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  
  // Handle theme change
  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTheme(e.target.value as 'light' | 'dark' | 'racing');
  };

  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold heading-text">Settings</h1>
        <p className="mt-1 text-sm muted-text">Manage your application preferences</p>
      </header>
      
      <div className="space-y-8">
        {/* General Settings */}
        <div className="bg-card shadow rounded-lg overflow-hidden border border-themed">
          <div className="px-4 py-5 sm:px-6 border-b border-themed">
            <h3 className="text-lg font-medium leading-6 heading-text">General Settings</h3>
            <p className="mt-1 text-sm muted-text">Configure your general application preferences</p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              {/* Theme Setting */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {theme === 'light' && <Sun className="h-5 w-5 text-amber-500 mr-3" />}
                  {theme === 'dark' && <Moon className="h-5 w-5 text-indigo-500 mr-3" />}
                  {theme === 'racing' && <Zap className="h-5 w-5 text-green-500 mr-3" />}
                  <div>
                    <p className="text-sm font-medium body-text">Theme</p>
                    <p className="text-xs muted-text">Choose your preferred theme</p>
                  </div>
                </div>
                
                <div>
                  <select 
                    value={theme}
                    onChange={handleThemeChange}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-card body-text"
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="racing">Racing</option>
                  </select>
                </div>
              </div>
              
              {/* Language Setting */}
              <div className="border-t border-themed pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Globe className="h-5 w-5 muted-text mr-3" />
                    <div>
                      <p className="text-sm font-medium body-text">Language</p>
                      <p className="text-xs muted-text">Select your preferred language</p>
                    </div>
                  </div>
                  
                  <div>
                    <select 
                      className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-card body-text"
                    >
                      <option>English (UK)</option>
                      <option>English (US)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Notification Settings */}
        <div className="bg-card shadow rounded-lg overflow-hidden border border-themed">
          <div className="px-4 py-5 sm:px-6 border-b border-themed">
            <h3 className="text-lg font-medium leading-6 heading-text">Notification Settings</h3>
            <p className="mt-1 text-sm muted-text">Configure how you want to receive notifications</p>
          </div>
          
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-6">
              {/* Email Notifications */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bell className="h-5 w-5 muted-text mr-3" />
                  <div>
                    <p className="text-sm font-medium body-text">Email Notifications</p>
                    <p className="text-xs muted-text">Receive email updates about your bets</p>
                  </div>
                </div>
                
                <div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" value="" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>
              
              {/* Race Reminders */}
              <div className="border-t border-themed pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bell className="h-5 w-5 muted-text mr-3" />
                    <div>
                      <p className="text-sm font-medium body-text">Race Reminders</p>
                      <p className="text-xs muted-text">Get notified before races you've bet on start</p>
                    </div>
                  </div>
                  
                  <div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="button"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
} 