/**
 * Premium Dashboard UI Templates
 * 
 * This file contains templates and components received from the 21st magic component builder
 * for use in creating professional, upscale dashboard interfaces.
 */

// =====================================================================
// TEMPLATE 1: Premium Investment Dashboard with Sidebar
// =====================================================================

/**
"use client"

import React from "react"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PercentIcon, 
  Trophy, 
  BarChart3, 
  Home, 
  Users, 
  Settings, 
  HelpCircle, 
  LogOut,
  Menu,
  ChevronRight
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface StatCardProps {
  title: string
  value: string
  change?: {
    value: string
    positive: boolean
  }
  icon: React.ReactNode
  className?: string
}

const StatCard = ({ title, value, change, icon, className }: StatCardProps) => {
  return (
    <div className={cn(
      "flex flex-col justify-between p-6 border rounded-md bg-background shadow-sm",
      "hover:shadow-md transition-shadow duration-200",
      className
    )}>
      <div className="flex justify-between items-start mb-6">
        <div className="p-2 rounded-md bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
          {icon}
        </div>
        {change && (
          <div className={cn(
            "flex items-center text-sm font-medium rounded-full px-2 py-1",
            change.positive 
              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900/30" 
              : "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30"
          )}>
            {change.positive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {change.value}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-3xl font-bold tracking-tight text-foreground">
          {value}
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          {title}
        </p>
      </div>
    </div>
  )
}

interface SidebarItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  href?: string
}

const SidebarItem = ({ icon, label, active, href = "#" }: SidebarItemProps) => {
  return (
    <a 
      href={href}
      className={cn(
        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium",
        "transition-colors duration-200",
        active 
          ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400" 
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {icon}
      {label}
    </a>
  )
}

interface RacingDashboardProps {
  className?: string
}

function RacingDashboard({ className }: RacingDashboardProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <div className={cn("flex h-screen bg-background", className)}>
      {/* Mobile sidebar toggle */}
      <Button
        variant="outline"
        size="icon"
        className="fixed top-4 left-4 z-50 md:hidden"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <Menu className="h-4 w-4" />
      </Button>

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-40 w-64 bg-background border-r transform transition-transform duration-200 ease-in-out",
        "md:translate-x-0 md:static md:h-screen",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <Trophy className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              <h1 className="text-xl font-bold text-foreground">RaceInvest Pro</h1>
            </div>
          </div>
          
          <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
            <SidebarItem icon={<Home className="h-4 w-4" />} label="Dashboard" active />
            <SidebarItem icon={<BarChart3 className="h-4 w-4" />} label="Analytics" />
            <SidebarItem icon={<Users className="h-4 w-4" />} label="Investors" />
            <SidebarItem icon={<Settings className="h-4 w-4" />} label="Settings" />
            <SidebarItem icon={<HelpCircle className="h-4 w-4" />} label="Help & Support" />
          </div>
          
          <div className="p-4 border-t">
            <SidebarItem icon={<LogOut className="h-4 w-4" />} label="Logout" />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        <header className="sticky top-0 z-30 bg-background border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                Export Data
              </Button>
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                New Investment
              </Button>
            </div>
          </div>
        </header>

        <main className="p-6">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Performance Overview</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Last 30 days</span>
                <ChevronRight className="h-4 w-4" />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Return on Investment" 
                value="18.7%" 
                change={{ value: "2.3%", positive: true }}
                icon={<PercentIcon className="h-5 w-5" />}
              />
              <StatCard 
                title="Win Rate" 
                value="42.5%" 
                change={{ value: "4.1%", positive: true }}
                icon={<Trophy className="h-5 w-5" />}
              />
              <StatCard 
                title="Total Stake" 
                value="$24,850" 
                change={{ value: "12.5%", positive: true }}
                icon={<DollarSign className="h-5 w-5" />}
              />
              <StatCard 
                title="Profit/Loss" 
                value="$4,652" 
                change={{ value: "1.2%", positive: false }}
                icon={<BarChart3 className="h-5 w-5" />}
              />
            </div>
          </div>

          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Recent Investments</h2>
              <Button variant="link" className="text-emerald-600 dark:text-emerald-400">
                View All
              </Button>
            </div>
            
            <div className="bg-background border rounded-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Race</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Horse</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Stake</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Odds</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Result</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">P/L</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { race: "Ascot 3:30", horse: "Golden Thunder", stake: "$500", odds: "4.5", result: "Win", pl: "+$1,750" },
                      { race: "Newmarket 2:15", horse: "Silver Streak", stake: "$350", odds: "6.0", result: "Loss", pl: "-$350" },
                      { race: "Cheltenham 4:10", horse: "Royal Flush", stake: "$600", odds: "3.2", result: "Win", pl: "+$1,320" },
                      { race: "Doncaster 1:45", horse: "Lucky Charm", stake: "$400", odds: "5.5", result: "Loss", pl: "-$400" },
                    ].map((item, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-muted/50">
                        <td className="px-4 py-3 text-sm">{item.race}</td>
                        <td className="px-4 py-3 text-sm font-medium">{item.horse}</td>
                        <td className="px-4 py-3 text-sm">{item.stake}</td>
                        <td className="px-4 py-3 text-sm">{item.odds}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                            item.result === "Win" 
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" 
                              : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                          )}>
                            {item.result}
                          </span>
                        </td>
                        <td className={cn(
                          "px-4 py-3 text-sm font-medium",
                          item.pl.startsWith("+") ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                        )}>
                          {item.pl}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export { RacingDashboard, StatCard }
 */

// =====================================================================
// TEMPLATE 2: Professional Stat Cards with Animations
// =====================================================================

/**
import React from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Trophy, 
  Clock 
} from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: {
    value: string;
    isPositive: boolean;
  };
  icon: React.ReactNode;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  icon,
  delay = 0,
}) => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: delay + 0.2,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <motion.div
      className="flex flex-col justify-between p-6 border rounded-md bg-background hover:shadow-sm transition-shadow"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5, delay }}
    >
      <div className="text-muted-foreground mb-10">
        {icon}
      </div>
      
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-2"
      >
        <motion.h2 
          className="text-4xl tracking-tighter font-medium flex flex-row gap-4 items-end"
          variants={item}
        >
          {value}
          <span 
            className={`text-sm tracking-normal ${
              change.isPositive ? "text-success" : "text-destructive"
            }`}
          >
            {change.isPositive ? "+" : ""}{change.value}
          </span>
        </motion.h2>
        
        <motion.p 
          className="text-base leading-relaxed tracking-tight text-muted-foreground"
          variants={item}
        >
          {title}
        </motion.p>
      </motion.div>
    </motion.div>
  );
};

export interface RacingStatsProps {
  className?: string;
}

export const RacingStats: React.FC<RacingStatsProps> = ({ className }) => {
  return (
    <div className={`w-full ${className}`}>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <StatCard
          title="Return on Investment"
          value="18.7%"
          change={{ value: "3.2%", isPositive: true }}
          icon={<DollarSign className="w-5 h-5 text-primary" />}
          delay={0.1}
        />
        <StatCard
          title="Win Rate"
          value="32.4%"
          change={{ value: "1.5%", isPositive: true }}
          icon={<Trophy className="w-5 h-5 text-primary" />}
          delay={0.2}
        />
        <StatCard
          title="Profit/Loss"
          value="$12,450"
          change={{ value: "4.8%", isPositive: false }}
          icon={<TrendingDown className="w-5 h-5 text-destructive" />}
          delay={0.3}
        />
        <StatCard
          title="Average Odds"
          value="3.75"
          change={{ value: "0.25", isPositive: true }}
          icon={<Percent className="w-5 h-5 text-primary" />}
          delay={0.4}
        />
      </div>
    </div>
  );
};
 */

// =====================================================================
// TEMPLATE 3: Professional Bets Table
// =====================================================================

/**
import * as React from "react";
import { cn } from "@/lib/utils";
import { ArrowDown, ArrowUp } from "lucide-react";

const Table = React.forwardRef<HTMLTableElement, React.HTMLAttributes<HTMLTableElement>>(
  ({ className, ...props }, ref) => (
    <div className="relative w-full overflow-auto">
      <table ref={ref} className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  ),
);
Table.displayName = "Table";

const TableHeader = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => <thead ref={ref} className={cn(className)} {...props} />);
TableHeader.displayName = "TableHeader";

const TableBody = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tbody ref={ref} className={cn("[&_tr:last-child]:border-0", className)} {...props} />
));
TableBody.displayName = "TableBody";

const TableFooter = React.forwardRef<
  HTMLTableSectionElement,
  React.HTMLAttributes<HTMLTableSectionElement>
>(({ className, ...props }, ref) => (
  <tfoot
    ref={ref}
    className={cn(
      "border-t border-border bg-muted/50 font-medium [&>tr]:last:border-b-0",
      className,
    )}
    {...props}
  />
));
TableFooter.displayName = "TableFooter";

const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className,
      )}
      {...props}
    />
  ),
);
TableRow.displayName = "TableRow";

const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-12 px-3 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:w-px [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-0.5",
      className,
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

const TableCell = React.forwardRef<
  HTMLTableCellElement,
  React.TdHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <td
    ref={ref}
    className={cn(
      "p-3 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-0.5",
      className,
    )}
    {...props}
  />
));
TableCell.displayName = "TableCell";

const TableCaption = React.forwardRef<
  HTMLTableCaptionElement,
  React.HTMLAttributes<HTMLTableCaptionElement>
>(({ className, ...props }, ref) => (
  <caption ref={ref} className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />
));
TableCaption.displayName = "TableCaption";

export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow };
 */

// Usage Example for the Table Component:

/**
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableFooter, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { ArrowDown, ArrowUp } from "lucide-react";

interface BetRecord {
  id: string;
  raceName: string;
  horseName: string;
  stake: string;
  odds: string;
  result: "Win" | "Loss";
  profitLoss: string;
}

const recentBets: BetRecord[] = [
  {
    id: "1",
    raceName: "Royal Ascot - Gold Cup",
    horseName: "Stradivarius",
    stake: "$100.00",
    odds: "5/1",
    result: "Win",
    profitLoss: "+$500.00",
  },
  {
    id: "2",
    raceName: "Kentucky Derby",
    horseName: "Authentic",
    stake: "$200.00",
    odds: "8/1",
    result: "Loss",
    profitLoss: "-$200.00",
  },
  {
    id: "3",
    raceName: "Melbourne Cup",
    horseName: "Verry Elleegant",
    stake: "$150.00",
    odds: "10/1",
    result: "Win",
    profitLoss: "+$1,500.00",
  },
  {
    id: "4",
    raceName: "Cheltenham Gold Cup",
    horseName: "Al Boum Photo",
    stake: "$300.00",
    odds: "4/1",
    result: "Loss",
    profitLoss: "-$300.00",
  },
  {
    id: "5",
    raceName: "Dubai World Cup",
    horseName: "Mystic Guide",
    stake: "$250.00",
    odds: "6/1",
    result: "Win",
    profitLoss: "+$1,500.00",
  },
];

function HorseRacingBetsTable() {
  const totalProfitLoss = recentBets.reduce((total, bet) => {
    const amount = parseFloat(bet.profitLoss.replace(/[^0-9.-]+/g, ""));
    return total + amount;
  }, 0);

  const formattedTotal = totalProfitLoss >= 0 
    ? `+$${totalProfitLoss.toFixed(2)}` 
    : `-$${Math.abs(totalProfitLoss).toFixed(2)}`;

  return (
    <div className="bg-background">
      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <Table>
          <TableCaption>Recent horse racing bets and outcomes.</TableCaption>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="h-11">Race</TableHead>
              <TableHead className="h-11">Horse</TableHead>
              <TableHead className="h-11">Stake</TableHead>
              <TableHead className="h-11">Odds</TableHead>
              <TableHead className="h-11">Result</TableHead>
              <TableHead className="h-11 text-right">Profit/Loss</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentBets.map((bet) => (
              <TableRow key={bet.id}>
                <TableCell className="font-medium">{bet.raceName}</TableCell>
                <TableCell>{bet.horseName}</TableCell>
                <TableCell>{bet.stake}</TableCell>
                <TableCell>{bet.odds}</TableCell>
                <TableCell>
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
                    bet.result === "Win" 
                      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                  )}>
                    {bet.result === "Win" ? (
                      <ArrowUp className="mr-1 h-3 w-3" />
                    ) : (
                      <ArrowDown className="mr-1 h-3 w-3" />
                    )}
                    {bet.result}
                  </span>
                </TableCell>
                <TableCell className={cn(
                  "text-right font-medium",
                  bet.profitLoss.startsWith("+") 
                    ? "text-green-600 dark:text-green-400" 
                    : "text-red-600 dark:text-red-400"
                )}>
                  {bet.profitLoss}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter className="bg-transparent">
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5}>Total Profit/Loss</TableCell>
              <TableCell className={cn(
                "text-right font-medium",
                totalProfitLoss >= 0 
                  ? "text-green-600 dark:text-green-400" 
                  : "text-red-600 dark:text-red-400"
              )}>
                {formattedTotal}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </div>
    </div>
  );
}

export { HorseRacingBetsTable };
 */ 