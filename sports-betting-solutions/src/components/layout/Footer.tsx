'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-betting-dark border-t border-betting-green/20">
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo and company info */}
          <div className="col-span-1 md:col-span-1">
            <Link href="/" className="inline-block mb-4">
              <div className="text-white font-heading text-xl font-bold">
                Odds<span className="text-betting-green">Vantage</span>
              </div>
            </Link>
            <p className="text-gray-300 text-sm mb-4">
              Revolutionizing sports betting with smart analytics and data-driven insights.
            </p>
            <div className="flex space-x-4">
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-betting-green transition-colors">
                <Twitter size={20} />
                <span className="sr-only">Twitter</span>
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-betting-green transition-colors">
                <Facebook size={20} />
                <span className="sr-only">Facebook</span>
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-betting-green transition-colors">
                <Instagram size={20} />
                <span className="sr-only">Instagram</span>
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-betting-green transition-colors">
                <Linkedin size={20} />
                <span className="sr-only">LinkedIn</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-gray-300 text-sm hover:text-betting-green transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/horse-racing" className="text-gray-300 text-sm hover:text-betting-green transition-colors">
                  Horse Racing
                </Link>
              </li>
              <li>
                <Link href="/account" className="text-gray-300 text-sm hover:text-betting-green transition-colors">
                  Account
                </Link>
              </li>
              <li>
                <Link href="/turf-tracker" className="text-gray-300 text-sm hover:text-betting-green transition-colors">
                  TurfTracker
                </Link>
              </li>
              <li>
                <Link href="/betting-tools" className="text-gray-300 text-sm hover:text-betting-green transition-colors">
                  Betting Tools
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/guides" className="text-gray-300 text-sm hover:text-betting-green transition-colors">
                  Betting Guides
                </Link>
              </li>
              <li>
                <Link href="/faq" className="text-gray-300 text-sm hover:text-betting-green transition-colors">
                  FAQ
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-gray-300 text-sm hover:text-betting-green transition-colors">
                  Support
                </Link>
              </li>
              <li>
                <Link href="/api" className="text-gray-300 text-sm hover:text-betting-green transition-colors">
                  API Documentation
                </Link>
              </li>
              <li>
                <Link href="/tutorials" className="text-gray-300 text-sm hover:text-betting-green transition-colors">
                  Video Tutorials
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="col-span-1">
            <h3 className="text-sm font-semibold text-white mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/terms" className="text-gray-300 text-sm hover:text-betting-green transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-gray-300 text-sm hover:text-betting-green transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookies" className="text-gray-300 text-sm hover:text-betting-green transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="/disclaimer" className="text-gray-300 text-sm hover:text-betting-green transition-colors">
                  Disclaimer
                </Link>
              </li>
              <li>
                <Link href="/responsible-gambling" className="text-gray-300 text-sm hover:text-betting-green transition-colors">
                  Responsible Gambling
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-betting-green/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © {currentYear} OddsVantage. All rights reserved.
            </p>
            <div className="mt-4 md:mt-0">
              <p className="text-gray-400 text-sm">
                Designed with ♥ for sports bettors worldwide
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 