'use client';

import { ReactNode, createContext, useContext, useState, useEffect } from 'react';

// Define theme types
export type Theme = 'light' | 'dark' | 'racing';

// Create theme context
interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Custom hook to use theme
export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Theme provider component
function ThemeProvider({ children }: { children: ReactNode }) {
  // Initialize from localStorage or default to dark
  const [theme, setTheme] = useState<Theme>('dark');
  
  // Update theme when it changes
  useEffect(() => {
    // Remove all theme classes first
    document.documentElement.classList.remove('theme-light', 'theme-dark', 'theme-racing');
    // Add current theme class
    document.documentElement.classList.add(`theme-${theme}`);
    // Save to localStorage
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme | null;
    if (savedTheme && ['light', 'dark', 'racing'].includes(savedTheme)) {
      setTheme(savedTheme);
    }
  }, []);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/**
 * PROVIDERS COMPONENT
 * 
 * This component wraps the application with necessary context providers.
 */
export function Providers({ children }: { children: ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
} 