'use client';

import Link from "next/link";
import { ArrowLeft, Calendar, User } from "lucide-react";
import Layout from "@/components/layout/Layout";

const featuredNews = [
  {
    title: "Today's Top Racing Tips & Value Bets",
    date: "2024-04-24",
    author: "Jane Smith",
    content: "Who wins the feature handicap at Cheltenham? Our expert shares must-have info for today's biggest races. With form analysis and insider knowledge, we break down the key contenders and highlight the best value opportunities across all meetings.",
    image: "/api/placeholder/400/200",
    id: "news-1",
    featured: true
  },
  {
    title: "Trainer Trends for Festival Week",
    date: "2024-04-23",
    author: "Sam Taylor",
    content: "Who's hot and who's not ahead of the big spring meetings in the UK. We analyze the top trainers' recent form and identify patterns that could give you the edge in upcoming races.",
    image: "/api/placeholder/400/200",
    id: "news-2",
    featured: false
  },
  {
    title: "Weekend Racing Preview: Key Selections",
    date: "2024-04-22",
    author: "Mike Johnson",
    content: "Our top picks for the weekend's action across all major tracks. From handicaps to Group races, we've identified the horses that offer the best value and winning potential.",
    image: "/api/placeholder/400/200",
    id: "news-3",
    featured: false
  },
  {
    title: "Jockey Championship Update",
    date: "2024-04-21",
    author: "Sarah Wilson",
    content: "Latest standings and form analysis for the championship race. See who's leading the way and which jockeys are hitting form at the right time of the season.",
    image: "/api/placeholder/400/200",
    id: "news-4",
    featured: false
  },
  {
    title: "Market Movers: Early Price Changes",
    date: "2024-04-20",
    author: "David Brown",
    content: "Significant market movements in today's racing markets. We track the money and identify which horses are attracting serious support from informed punters.",
    image: "/api/placeholder/400/200",
    id: "news-5",
    featured: false
  },
  {
    title: "Track Conditions Report",
    date: "2024-04-19",
    author: "Emma Davis",
    content: "How changing ground conditions could affect today's results. Our comprehensive guide to track conditions and their impact on different types of horses and running styles.",
    image: "/api/placeholder/400/200",
    id: "news-6",
    featured: false
  }
];

export default function HorseRacingNews() {
  const featured = featuredNews.find(article => article.featured);
  const otherNews = featuredNews.filter(article => !article.featured);

  return (
    <Layout>
      <div className="min-h-screen bg-betting-dark text-white py-8 font-sans">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <Link href="/horse-racing" className="inline-flex items-center text-betting-green hover:text-white mb-4 transition">
              <ArrowLeft size={20} className="mr-2" />
              Back to Horse Racing Hub
            </Link>
            <h1 className="text-4xl font-heading text-betting-green mb-2">Racing News & Tips</h1>
            <p className="text-lg text-gray-300 max-w-3xl">
              Stay ahead of the game with expert analysis, insider tips, and the latest racing news from our team of professional handicappers.
            </p>
          </div>

          {/* Featured Article */}
          {featured && (
            <div className="mb-12">
              <h2 className="text-2xl font-heading text-betting-green mb-6">Featured Story</h2>
              <div className="bg-betting-green/10 border border-betting-green/30 rounded-xl overflow-hidden shadow-lg">
                <div className="md:flex">
                  <div className="md:w-1/3">
                    <div className="h-64 md:h-full bg-betting-green/20 flex items-center justify-center">
                      <span className="text-betting-green/60">Featured Image</span>
                    </div>
                  </div>
                  <div className="md:w-2/3 p-6">
                    <h3 className="text-2xl font-heading font-bold text-betting-green mb-3">{featured.title}</h3>
                    <div className="flex items-center text-gray-400 text-sm mb-4">
                      <User size={16} className="mr-1" />
                      <span className="mr-4">{featured.author}</span>
                      <Calendar size={16} className="mr-1" />
                      <span>{featured.date}</span>
                    </div>
                    <p className="text-gray-200 mb-4 leading-relaxed">{featured.content}</p>
                    <button className="bg-betting-green text-white px-6 py-2 rounded-lg hover:bg-betting-secondary transition font-semibold">
                      Read Full Article
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* News Grid */}
          <div className="mb-12">
            <h2 className="text-2xl font-heading text-betting-green mb-6">Latest News</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {otherNews.map(article => (
                <div key={article.id} className="bg-betting-dark border border-betting-green/20 rounded-lg overflow-hidden shadow hover:shadow-lg transition">
                  <div className="h-48 bg-betting-green/20 flex items-center justify-center">
                    <span className="text-betting-green/60 text-sm">Article Image</span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-heading font-bold text-betting-green mb-2">{article.title}</h3>
                    <div className="flex items-center text-gray-400 text-xs mb-3">
                      <User size={14} className="mr-1" />
                      <span className="mr-3">{article.author}</span>
                      <Calendar size={14} className="mr-1" />
                      <span>{article.date}</span>
                    </div>
                    <p className="text-gray-200 text-sm mb-4 leading-relaxed">{article.content.substring(0, 120)}...</p>
                    <button className="text-betting-green font-semibold hover:text-white transition text-sm">
                      Read More →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Newsletter Signup */}
          <div className="bg-gradient-to-r from-betting-green/10 to-betting-dark/80 border border-betting-green/30 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-heading text-betting-green mb-4">Stay Updated</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Get our daily racing tips and analysis delivered straight to your inbox. Join thousands of successful punters who rely on our expert insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
              <input 
                type="email" 
                placeholder="Enter your email address"
                className="flex-1 px-4 py-2 rounded-lg bg-betting-dark border border-betting-green/30 text-white placeholder-gray-400 focus:outline-none focus:border-betting-green"
              />
              <button className="bg-betting-green text-white px-6 py-2 rounded-lg hover:bg-betting-secondary transition font-semibold">
                Subscribe
              </button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 