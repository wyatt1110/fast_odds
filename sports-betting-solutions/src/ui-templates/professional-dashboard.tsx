/**
 * Professional Horse Racing Dashboard Template
 * 
 * This file contains the implementation template for the dashboard redesign,
 * with a focus on creating a professional, modern UI for serious investors.
 */

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  ChevronRight,
  DollarSign,
  Home,
  Menu,
  Percent,
  Settings,
  TrendingDown,
  TrendingUp,
  Trophy,
  User,
  Calendar,
  Clock,
  X
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// Types
interface StatCardProps {
  title: string;
  value: string;
  change?: {
    value: string;
    positive: boolean;
  };
  icon: React.ReactNode;
  color: "emerald" | "indigo" | "amber" | "rose";
}

interface BetRecord {
  id: string;
  raceName: string;
  horseName: string;
  stake: string;
  odds: string;
  result: "Win" | "Loss" | "Pending";
  profitLoss: string;
}

// Helper function for class names
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

// Components
const Button = ({ 
  children, 
  variant = "default", 
  size = "default", 
  className = "", 
  onClick 
}: { 
  children: React.ReactNode;
  variant?: "default" | "outline" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  onClick?: () => void;
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";
  
  const variantStyles = {
    default: "bg-emerald-600 text-white hover:bg-emerald-700",
    outline: "border border-input hover:bg-accent hover:text-accent-foreground",
    ghost: "hover:bg-accent hover:text-accent-foreground",
    link: "underline-offset-4 hover:underline text-emerald-600"
  };

  const sizeStyles = {
    default: "h-10 py-2 px-4",
    sm: "h-9 px-3 rounded-md text-sm",
    lg: "h-11 px-8 rounded-md",
    icon: "h-10 w-10"
  };

  return (
    <button
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

const StatCard = ({ title, value, change, icon, color }: StatCardProps) => {
  const colorClasses = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    rose: "bg-rose-50 text-rose-600 border-rose-100"
  };

  return (
    <div className="flex flex-col justify-between p-6 border rounded-lg bg-white shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-3 rounded-md", colorClasses[color])}>
          {icon}
        </div>
        {change && (
          <div className={cn(
            "flex items-center text-sm font-medium rounded-full px-2.5 py-1",
            change.positive 
              ? "text-emerald-600 bg-emerald-50" 
              : "text-rose-600 bg-rose-50"
          )}>
            {change.positive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {change.value}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-2xl font-bold tracking-tight">
          {value}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {title}
        </p>
      </div>
    </div>
  );
};

const NavLink = ({ href, active, icon, children }: { href: string; active?: boolean; icon: React.ReactNode; children: React.ReactNode }) => {
  return (
    <Link href={href} className={cn(
      "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
      active
        ? "bg-emerald-100 text-emerald-600"
        : "text-gray-500 hover:bg-gray-100 hover:text-gray-900"
    )}>
      {icon}
      {children}
    </Link>
  );
};

// Mock data
const recentBets: BetRecord[] = [
  {
    id: "1",
    raceName: "Royal Ascot - Gold Cup",
    horseName: "Stradivarius",
    stake: "$500",
    odds: "5/1",
    result: "Win",
    profitLoss: "+$2,000",
  },
  {
    id: "2",
    raceName: "Kentucky Derby",
    horseName: "Authentic",
    stake: "$350",
    odds: "8/1",
    result: "Loss",
    profitLoss: "-$350",
  },
  {
    id: "3",
    raceName: "Melbourne Cup",
    horseName: "Verry Elleegant",
    stake: "$600",
    odds: "10/1",
    result: "Win",
    profitLoss: "+$5,400",
  },
  {
    id: "4",
    raceName: "Cheltenham Gold Cup",
    horseName: "Al Boum Photo",
    stake: "$400",
    odds: "4/1",
    result: "Pending",
    profitLoss: "-",
  },
];

// Main Dashboard Component
export function ProfessionalDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<{ name: string } | null>(null);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoading(false);
      setUserData({ name: "John Smith" });
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar toggle */}
      <button
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-sm border md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-white border-r transform transition-transform duration-200 ease-in-out",
        "md:translate-x-0 md:static md:h-screen",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-emerald-600" />
              <h1 className="text-xl font-bold">RaceInvest Pro</h1>
            </div>
          </div>
          
          <div className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
            <NavLink href="/dashboard" active icon={<Home className="h-4 w-4" />}>
              Dashboard
            </NavLink>
            <NavLink href="/all-bets" icon={<BarChart3 className="h-4 w-4" />}>
              All Bets
            </NavLink>
            <NavLink href="/pending-bets" icon={<Clock className="h-4 w-4" />}>
              Pending Bets
            </NavLink>
            <NavLink href="/account-details" icon={<User className="h-4 w-4" />}>
              Account Details
            </NavLink>
            <NavLink href="/settings" icon={<Settings className="h-4 w-4" />}>
              Settings
            </NavLink>
          </div>
          
          <div className="p-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600">
                  {userData?.name?.[0] || "U"}
                </div>
                <div className="text-sm font-medium">{userData?.name || "User"}</div>
              </div>
              <Button variant="ghost" size="sm">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="sticky top-0 z-30 bg-white border-b px-6 py-4 shadow-sm">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">
                <Calendar className="inline-block h-4 w-4 mr-1" />
                {new Date().toLocaleDateString('en-US', { 
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </span>
              <Button variant="outline" size="sm">
                Export
              </Button>
              <Button size="sm">
                New Bet
              </Button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6 pb-20">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Performance Overview</h2>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <span>Last 30 days</span>
                  <ChevronRight className="h-4 w-4" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Return on Investment" 
                  value="18.7%" 
                  change={{ value: "2.3%", positive: true }}
                  icon={<Percent className="h-5 w-5" />}
                  color="emerald"
                />
                <StatCard 
                  title="Win Rate" 
                  value="42.5%" 
                  change={{ value: "4.1%", positive: true }}
                  icon={<Trophy className="h-5 w-5" />}
                  color="indigo"
                />
                <StatCard 
                  title="Total Stake" 
                  value="$24,850" 
                  change={{ value: "12.5%", positive: true }}
                  icon={<DollarSign className="h-5 w-5" />}
                  color="amber"
                />
                <StatCard 
                  title="Profit/Loss" 
                  value="$4,652" 
                  change={{ value: "1.2%", positive: false }}
                  icon={<BarChart3 className="h-5 w-5" />}
                  color="rose"
                />
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Recent Bets</h2>
                <Button variant="link">
                  View All
                </Button>
              </div>
              
              <div className="bg-white border rounded-lg overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Race</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Horse</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Stake</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Odds</th>
                        <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Result</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">P/L</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentBets.map((bet) => (
                        <tr key={bet.id} className="border-b last:border-0 hover:bg-gray-50">
                          <td className="px-4 py-4 text-sm">{bet.raceName}</td>
                          <td className="px-4 py-4 text-sm font-medium">{bet.horseName}</td>
                          <td className="px-4 py-4 text-sm">{bet.stake}</td>
                          <td className="px-4 py-4 text-sm">{bet.odds}</td>
                          <td className="px-4 py-4 text-sm">
                            <span className={cn(
                              "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium",
                              bet.result === "Win" 
                                ? "bg-emerald-100 text-emerald-700" 
                                : bet.result === "Loss"
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-amber-100 text-amber-700"
                            )}>
                              {bet.result}
                            </span>
                          </td>
                          <td className={cn(
                            "px-4 py-4 text-sm font-medium text-right",
                            bet.result === "Win" 
                              ? "text-emerald-600" 
                              : bet.result === "Loss"
                                ? "text-rose-600"
                                : "text-gray-500"
                          )}>
                            {bet.profitLoss}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 