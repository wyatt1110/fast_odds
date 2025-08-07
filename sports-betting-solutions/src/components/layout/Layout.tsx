'use client';

import { ReactNode } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';
import { Toaster } from '@/components/ui/toaster';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Global background wallpaper - commented out as we're applying it per-page for now */}
      {/* <div className="bg-wallpaper"></div>
      <div className="bg-overlay"></div> */}
      <Navbar />
      <main className="flex-grow">{children}</main>
      <Footer />
      <Toaster />
    </div>
  );
} 