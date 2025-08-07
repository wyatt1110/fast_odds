import './globals.css';
import { Providers } from '@/components/providers';
import type { Metadata } from 'next';
import { Inter, Montserrat, Playfair_Display, Outfit } from 'next/font/google';
import Layout from '@/components/layout/Layout';
import { validateConfig } from '@/lib/config';
import ErrorBoundary from '@/components/ErrorBoundary';

// Define fonts
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const montserrat = Montserrat({
  subsets: ['latin'],
  variable: '--font-montserrat',
  display: 'swap'
});
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap'
});
const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap'
});

export const metadata: Metadata = {
  title: 'OddsVantage - Sports Betting Analysis',
  description: 'Professional betting solutions for serious sports bettors - including TurfTracker for horse racing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Validate configuration on server side
  if (typeof window === 'undefined') {
    console.log('🔧 Server-side config validation...');
    validateConfig();
  }

  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Enhanced client-side error handling
              console.log('🚀 Client-side script loading...');
              
              // Global error handler
              window.addEventListener('error', function(e) {
                console.error('🚨 Client-side error:', e.error);
                console.error('🚨 Error details:', {
                  message: e.error?.message,
                  stack: e.error?.stack,
                  filename: e.filename,
                  lineno: e.lineno,
                  colno: e.colno
                });
                
                // Send error to server for logging
                fetch('/api/log-error', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'client-error',
                    message: e.error?.message || 'Unknown error',
                    stack: e.error?.stack,
                    filename: e.filename,
                    lineno: e.lineno,
                    colno: e.colno,
                    url: window.location.href,
                    userAgent: navigator.userAgent
                  })
                }).catch(err => console.error('Failed to log error:', err));
              });

              // Unhandled promise rejection handler
              window.addEventListener('unhandledrejection', function(e) {
                console.error('🚨 Unhandled promise rejection:', e.reason);
                
                // Send error to server for logging
                fetch('/api/log-error', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'unhandled-rejection',
                    reason: e.reason?.toString(),
                    url: window.location.href,
                    userAgent: navigator.userAgent
                  })
                }).catch(err => console.error('Failed to log error:', err));
              });

              // React error boundary fallback
              window.addEventListener('DOMContentLoaded', function() {
                console.log('✅ DOM loaded successfully');
              });

              // Check if React is loading
              window.addEventListener('load', function() {
                console.log('✅ Page fully loaded');
                console.log('🔧 Checking React availability...');
                if (typeof React !== 'undefined') {
                  console.log('✅ React is available');
                } else {
                  console.error('❌ React is not available');
                }
              });
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${montserrat.variable} ${playfair.variable} ${outfit.variable} font-sans min-h-screen flex flex-col`}
        suppressHydrationWarning={true}
      >
        <ErrorBoundary>
          <Providers>
            {children}
          </Providers>
        </ErrorBoundary>
      </body>
    </html>
  );
} 