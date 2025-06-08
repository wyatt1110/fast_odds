'use client';

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import Layout from "@/components/layout/Layout";

const todayTracks = [
  { name: "Ascot", races: 6, firstRace: "13:15", trackId: "ascot" },
  { name: "Cheltenham", races: 6, firstRace: "13:30", trackId: "cheltenham" },
  { name: "Newmarket", races: 5, firstRace: "12:45", trackId: "newmarket" },
  { name: "Aintree", races: 7, firstRace: "13:00", trackId: "aintree" }
];

const news = [
  {
    title: "Today's Top Racing Tips & Value Bets",
    date: "2024-04-24",
    author: "Jane Smith",
    snippet: "Who wins the feature handicap at Cheltenham? Our expert shares must-have info...",
    id: "news-1"
  },
  {
    title: "Trainer Trends for Festival Week",
    date: "2024-04-23",
    author: "Sam Taylor",
    snippet: "Who's hot and who's not ahead of the big spring meetings in the UK...",
    id: "news-2"
  },
  {
    title: "Weekend Racing Preview: Key Selections",
    date: "2024-04-22",
    author: "Mike Johnson",
    snippet: "Our top picks for the weekend's action across all major tracks...",
    id: "news-3"
  },
  {
    title: "Jockey Championship Update",
    date: "2024-04-21",
    author: "Sarah Wilson",
    snippet: "Latest standings and form analysis for the championship race...",
    id: "news-4"
  }
];

export default function HorseRacingHome() {
  return (
    <Layout>
      <div className="min-h-screen bg-betting-dark text-white px-3 py-8 font-sans">
        <div className="max-w-5xl mx-auto">
          {/* HERO/INTRO */}
          <h1 className="text-4xl font-heading text-betting-green mb-2">Horse Racing Hub</h1>
          <p className="mb-6 max-w-3xl text-lg text-gray-300">All today's UK and Irish action. Live odds, racecards, expert previews, historical data & pro betting tools – everything you need in one place, free and premium!</p>
          
          {/* TRACKS */}
          <div className="mb-12">
            <h2 className="font-heading text-2xl text-betting-green mb-3">Today's Race Meetings</h2>
            <div className="flex gap-6 overflow-x-auto pb-2">
              {todayTracks.map(track => (
                <div key={track.trackId} className="bg-betting-green/10 border border-betting-green/40 px-6 py-4 rounded-xl min-w-[220px] shadow flex flex-col items-start">
                  <div className="font-heading font-bold text-xl mb-1 text-betting-green">{track.name}</div>
                  <div className="text-gray-300 mb-2">{track.races} races &middot; First off {track.firstRace}</div>
                  <Link 
                    href={`/horse-racing/racecards?track=${track.trackId}`}
                    className="text-betting-green flex items-center hover:text-white font-semibold"
                  >
                    View Racecards <ChevronRight size={16} className="ml-1" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* NEWS SNIPPETS */}
          <section className="mb-16">
            <h2 className="font-heading text-2xl text-betting-green mb-4">Latest News & Tips</h2>
            <div className="grid gap-6 sm:grid-cols-2">
              {news.map(item => (
                <div key={item.id} className="bg-betting-dark border border-betting-green/20 rounded-lg p-4 shadow">
                  <div className="text-base font-heading font-bold text-betting-green mb-1">{item.title}</div>
                  <div className="text-gray-400 text-xs mb-2">{item.author} &middot; {item.date}</div>
                  <p className="text-gray-200 mb-2">{item.snippet}</p>
                  <Link href="/horse-racing/news" className="text-betting-green underline font-semibold hover:text-betting-secondary">Read More</Link>
                </div>
              ))}
            </div>
            <div className="mt-6 text-right">
              <Link href="/horse-racing/news" className="text-betting-green font-semibold hover:text-white">More News &rarr;</Link>
            </div>
          </section>

          {/* QUICK STATS SECTION */}
          <section className="mb-16">
            <h2 className="font-heading text-2xl text-betting-green mb-4">Today's Quick Stats</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-betting-green/10 border border-betting-green/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-betting-green">24</div>
                <div className="text-sm text-gray-300">Total Races</div>
              </div>
              <div className="bg-betting-green/10 border border-betting-green/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-betting-green">6</div>
                <div className="text-sm text-gray-300">Active Tracks</div>
              </div>
              <div className="bg-betting-green/10 border border-betting-green/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-betting-green">3.2</div>
                <div className="text-sm text-gray-300">Avg Favourite</div>
              </div>
              <div className="bg-betting-green/10 border border-betting-green/30 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-betting-green">£2.1M</div>
                <div className="text-sm text-gray-300">Total Prize Money</div>
              </div>
            </div>
          </section>

          {/* FREE TOOLS SECTION */}
          <section className="mb-16">
            <h2 className="font-heading text-2xl text-betting-green mb-4">Free Racing Tools</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <Link href="/tools/horse-racing-returns" className="bg-betting-green/20 border border-betting-green/40 hover:bg-betting-green/30 p-4 rounded-xl transition">
                <div className="font-semibold text-white mb-2">Returns Calculator</div>
                <div className="text-sm text-gray-300">Calculate potential returns for all bet types</div>
              </Link>
              <Link href="/horse-racing/data" className="bg-betting-green/20 border border-betting-green/40 hover:bg-betting-green/30 p-4 rounded-xl transition">
                <div className="font-semibold text-white mb-2">Free Racing Data</div>
                <div className="text-sm text-gray-300">Access basic form and statistics</div>
              </Link>
              <Link href="/horse-racing/racecards" className="bg-betting-green/20 border border-betting-green/40 hover:bg-betting-green/30 p-4 rounded-xl transition">
                <div className="font-semibold text-white mb-2">Today's Racecards</div>
                <div className="text-sm text-gray-300">View all today's race information</div>
              </Link>
            </div>
          </section>

          {/* TURF TRACKER AD SNIPPET */}
          <div className="mt-10 rounded-xl bg-gradient-to-tr from-betting-green/10 to-betting-dark/80 border border-betting-green/30 p-6 shadow flex flex-col sm:flex-row items-center justify-between gap-5">
            <div>
              <div className="text-betting-green font-bold font-heading text-lg mb-2">Upgrade to Turf Tracker</div>
              <div className="text-white mb-1 max-w-xs text-sm">
                Advanced bet tracking, AI analysis, auto stats, and full betting performance management. Join our premium community and beat the bookies!
              </div>
              <Link href="/turf-tracker" className="inline-block mt-2 bg-betting-green text-white font-bold px-5 py-2 rounded-lg hover:bg-betting-secondary transition">See Turf Tracker Premium</Link>
            </div>
            <div className="w-32 h-20 bg-betting-green/10 rounded-lg flex items-center justify-center text-sm text-betting-green/60 border border-betting-green/30 blur-sm">
              {/* Placeholder for video or product image */}
              Feature Video
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
} 