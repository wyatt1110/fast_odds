// Dashboard UI Template Components

// Stat Cards Component
import { ArrowDownRight, ArrowUpRight, BarChart3, Clock, DollarSign, Percent, Target } from 'lucide-react';
import { motion } from 'framer-motion';

// StatCard Component
interface StatCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

export const StatCard = ({ title, value, change, isPositive, icon }: StatCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-xl shadow-sm p-6 border border-gray-100"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
        <div className="text-emerald-600 bg-emerald-50 p-2 rounded-lg">
          {icon}
        </div>
      </div>
      <div className="mb-2">
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className="flex items-center">
        {isPositive ? (
          <ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-rose-500 mr-1" />
        )}
        <span
          className={`text-sm font-medium ${
            isPositive ? 'text-emerald-500' : 'text-rose-500'
          }`}
        >
          {change} {title.includes('Rate') ? '' : 'from last month'}
        </span>
      </div>
    </motion.div>
  );
};

// Racing Stats Component
export const RacingStats = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="Return on Investment"
        value="18.7%"
        change="3.2%"
        isPositive={true}
        icon={<Percent className="w-5 h-5" />}
      />
      <StatCard
        title="Win Rate"
        value="32.4%"
        change="1.5%"
        isPositive={true}
        icon={<Target className="w-5 h-5" />}
      />
      <StatCard
        title="Profit/Loss"
        value="$12,450"
        change="4.8%"
        isPositive={false}
        icon={<DollarSign className="w-5 h-5" />}
      />
      <StatCard
        title="Average Odds"
        value="3.75"
        change="0.25"
        isPositive={true}
        icon={<BarChart3 className="w-5 h-5" />}
      />
    </div>
  );
};

// Sample Dashboard Layout
export const SampleDashboard = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Racing Portfolio Dashboard</h1>
        <RacingStats />
        {/* Other dashboard components would go here */}
      </div>
    </div>
  );
};

// Horse Racing Bets Table Component
interface Bet {
  id: string;
  raceName: string;
  horseName: string;
  stake: number;
  odds: number;
  result: 'Win' | 'Loss';
  profitLoss: number;
}

export const HorseRacingBetsTable = () => {
  // Sample data
  const recentBets: Bet[] = [
    {
      id: '1',
      raceName: 'Royal Ascot - Gold Cup',
      horseName: 'Northern Eclipse',
      stake: 500,
      odds: 3.5,
      result: 'Win',
      profitLoss: 1250,
    },
    {
      id: '2',
      raceName: 'Kentucky Derby',
      horseName: 'Swift Thunder',
      stake: 1000,
      odds: 2.2,
      result: 'Loss',
      profitLoss: -1000,
    },
    {
      id: '3',
      raceName: 'Melbourne Cup',
      horseName: 'Golden Arrow',
      stake: 750,
      odds: 4.0,
      result: 'Win',
      profitLoss: 2250,
    },
    {
      id: '4',
      raceName: 'Belmont Stakes',
      horseName: 'Midnight Runner',
      stake: 600,
      odds: 5.5,
      result: 'Loss',
      profitLoss: -600,
    },
    {
      id: '5',
      raceName: 'Cheltenham Gold Cup',
      horseName: 'Highland Warrior',
      stake: 850,
      odds: 3.8,
      result: 'Win',
      profitLoss: 2380,
    },
  ];

  // Calculate total profit/loss
  const totalProfitLoss = recentBets.reduce((sum, bet) => sum + bet.profitLoss, 0);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-gray-900">Recent Bets</h2>
        <p className="text-sm text-gray-500 mt-1">Your last 5 racing investments</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Race
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Horse
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Stake
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Odds
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Result
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Profit/Loss
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {recentBets.map((bet) => (
              <tr key={bet.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {bet.raceName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {bet.horseName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  ${bet.stake.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {bet.odds.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      bet.result === 'Win'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {bet.result === 'Win' ? (
                      <ArrowUpRight className="w-3 h-3 mr-1" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3 mr-1" />
                    )}
                    {bet.result}
                  </span>
                </td>
                <td
                  className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                    bet.profitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {bet.profitLoss >= 0 ? '+' : ''}${bet.profitLoss.toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50">
              <td colSpan={5} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                Total Profit/Loss
              </td>
              <td
                className={`px-6 py-3 whitespace-nowrap text-sm font-medium ${
                  totalProfitLoss >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {totalProfitLoss >= 0 ? '+' : ''}${totalProfitLoss.toLocaleString()}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

// Premium Investment Dashboard Layout
export const RacingDashboard = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 hidden md:block bg-white border-r border-gray-200 shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-emerald-700">My Racing Pal</h2>
          <p className="text-xs text-gray-500 mt-1">Premium Investment Platform</p>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-1">
            <li>
              <a href="#" className="flex items-center px-4 py-3 text-sm rounded-lg bg-emerald-50 text-emerald-700 font-medium">
                <BarChart3 className="w-5 h-5 mr-3" />
                Dashboard
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-4 py-3 text-sm rounded-lg text-gray-600 hover:bg-gray-50 font-medium">
                <Target className="w-5 h-5 mr-3 text-gray-400" />
                Analytics
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-4 py-3 text-sm rounded-lg text-gray-600 hover:bg-gray-50 font-medium">
                <DollarSign className="w-5 h-5 mr-3 text-gray-400" />
                Investors
              </a>
            </li>
            <li>
              <a href="#" className="flex items-center px-4 py-3 text-sm rounded-lg text-gray-600 hover:bg-gray-50 font-medium">
                <Clock className="w-5 h-5 mr-3 text-gray-400" />
                Settings
              </a>
            </li>
          </ul>
        </nav>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm p-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-bold text-gray-900">Racing Investment Dashboard</h1>
            <div className="flex items-center space-x-4">
              <button className="px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                New Bet
              </button>
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-medium">
                JD
              </div>
            </div>
          </div>
        </header>
        
        {/* Dashboard Content */}
        <main className="p-6">
          {/* Stats Section */}
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* ROI Stat Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 text-sm font-medium">Return on Investment</h3>
                  <div className="text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                    <Percent className="w-5 h-5" />
                  </div>
                </div>
                <div className="mb-2">
                  <p className="text-3xl font-bold text-gray-900">18.7%</p>
                </div>
                <div className="flex items-center">
                  <ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
                  <span className="text-sm font-medium text-emerald-500">3.2% from last month</span>
                </div>
              </div>
              
              {/* Win Rate Stat Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 text-sm font-medium">Win Rate</h3>
                  <div className="text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                    <Target className="w-5 h-5" />
                  </div>
                </div>
                <div className="mb-2">
                  <p className="text-3xl font-bold text-gray-900">32.4%</p>
                </div>
                <div className="flex items-center">
                  <ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
                  <span className="text-sm font-medium text-emerald-500">1.5%</span>
                </div>
              </div>
              
              {/* P/L Stat Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 text-sm font-medium">Profit/Loss</h3>
                  <div className="text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                    <DollarSign className="w-5 h-5" />
                  </div>
                </div>
                <div className="mb-2">
                  <p className="text-3xl font-bold text-gray-900">$12,450</p>
                </div>
                <div className="flex items-center">
                  <ArrowDownRight className="w-4 h-4 text-rose-500 mr-1" />
                  <span className="text-sm font-medium text-rose-500">4.8% from last month</span>
                </div>
              </div>
              
              {/* Avg Odds Stat Card */}
              <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-gray-500 text-sm font-medium">Average Odds</h3>
                  <div className="text-emerald-600 bg-emerald-50 p-2 rounded-lg">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                </div>
                <div className="mb-2">
                  <p className="text-3xl font-bold text-gray-900">3.75</p>
                </div>
                <div className="flex items-center">
                  <ArrowUpRight className="w-4 h-4 text-emerald-500 mr-1" />
                  <span className="text-sm font-medium text-emerald-500">0.25</span>
                </div>
              </div>
            </div>
          </section>
          
          {/* More dashboard sections would go here */}
        </main>
      </div>
    </div>
  );
}; 