import { Providers } from '@/components/providers';
import './globals.css';
import type { Metadata } from 'next';
import { Inter, Montserrat, Playfair_Display } from 'next/font/google';
import Layout from '@/components/layout/Layout';
import StagewiseToolbar from '@/components/stagewise/StagewiseToolbar';

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

export const metadata: Metadata = {
  title: 'OddsVantage - Sports Betting Analysis',
  description: 'Professional betting solutions for serious sports bettors - including TurfTracker for horse racing.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${montserrat.variable} ${playfair.variable} font-sans min-h-screen flex flex-col`}>
        <Providers>
          {children}
        </Providers>
        <StagewiseToolbar />
      </body>
    </html>
  );
} 