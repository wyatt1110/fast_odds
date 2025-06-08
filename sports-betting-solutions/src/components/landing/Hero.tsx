'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Button } from '../ui/button';

export default function Hero() {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className="relative bg-white overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-30" />

      <div className="relative container mx-auto px-4 pt-20 pb-16 sm:px-6 lg:px-8 lg:pt-32 lg:pb-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-xl"
          >
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Make smarter</span>
              <span className="block text-blue-600">betting decisions</span>
            </h1>
            <p className="mt-6 text-lg text-gray-600 max-w-lg">
              OddsVantage helps you track, analyze, and optimize your sports betting strategy with 
              advanced analytics, predictive models, and comprehensive data visualization.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="font-medium">
                <Link href="/signup">
                  Get Started
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="font-medium">
                <Link href="#features">
                  Learn More
                </Link>
              </Button>
            </div>
            <div className="mt-8">
              <p className="text-sm text-gray-500">Trusted by sports bettors worldwide</p>
              <div className="mt-3 flex items-center space-x-6">
                <div className="flex-shrink-0">
                  <p className="text-2xl font-bold text-gray-900">2000+</p>
                  <p className="text-sm text-gray-500">Active users</p>
                </div>
                <div className="flex-shrink-0">
                  <p className="text-2xl font-bold text-gray-900">98%</p>
                  <p className="text-sm text-gray-500">Customer satisfaction</p>
                </div>
                <div className="flex-shrink-0">
                  <p className="text-2xl font-bold text-gray-900">24/7</p>
                  <p className="text-sm text-gray-500">Support</p>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: isLoaded ? 1 : 0, scale: isLoaded ? 1 : 0.95 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="relative w-full h-[400px] lg:h-[500px] mt-12 lg:mt-0"
          >
            <Image
              src="/images/dashboard-preview.png"
              alt="OddsVantage Dashboard"
              fill
              className="object-contain rounded-lg shadow-xl"
              priority
              onLoad={() => setIsLoaded(true)}
            />
            <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-600 opacity-5" />
          </motion.div>
        </div>
      </div>
    </div>
  );
} 