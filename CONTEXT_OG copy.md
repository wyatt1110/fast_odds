# Sports Betting Solutions - Project Summary

## Project Overview
Sports Betting Solutions is a professional horse racing betting platform designed to help bettors track, analyze, and optimize their betting strategies. The application provides a comprehensive dashboard for managing bets, analyzing performance, and gaining insights into betting patterns. The platform specializes in horse racing betting data but supports other sports betting as well.

## Technology Stack
- **Frontend**: Next.js 14+ (React framework)
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL database, authentication, real-time subscriptions)
- **Hosting**: Vercel
- **State Management**: React hooks and context
- **Authentication**: Supabase Auth
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **Horse Racing API**: TheRacingAPI for race data

## Project Structure
```
sports-betting-solutions/
├── src/
│   ├── app/                    # Next.js app router (routes only)
│   ├── frontend-ui/            # Main UI components
│   │   ├── components/         # Reusable UI components
│   │   ├── layouts/            # Layout components (DashboardLayout, etc.)
│   │   └── pages/              # Page components
│   ├── components/             # Shared components
│   ├── lib/                    # Utilities and helpers
│   │   └── supabase/           # Supabase client and functions
│   ├── services/               # Service functions
│   ├── contexts/               # React contexts
│   └── types/                  # TypeScript type definitions
├── scripts/                    # Backend scripts
├── supabase/                   # Supabase configuration
└── public/                     # Static assets
```

## UI Development Workflow

### Key Principle: "The Golden Rule"
```
✓ EDIT files in: /src/frontend-ui/**
✗ DON'T EDIT files in: /src/app/**
```

The frontend structure follows a clear separation:
- Route files in `/src/app/**` - minimal, only import components
- UI components in `/src/frontend-ui/**` - contain all UI logic and JSX

### Main UI Components
- **DashboardLayout**: `/src/frontend-ui/layouts/DashboardLayout.tsx` - The main layout for the dashboard
- **BettingDashboardPage**: `/src/frontend-ui/pages/betting-dashboard-page.tsx` - Main dashboard page
- **BetEntryForm**: `/src/frontend-ui/components/betting/bet-entry-form.tsx` - Form for adding new bets
- **BetHistoryTable**: `/src/frontend-ui/components/betting/bet-history-table.tsx` - Table for displaying bet history

## Detailed UI Components & User Flows

### Dashboard Layout
The `DashboardLayout` component includes:
- Sidebar navigation with links to all main sections
- Logo and branding in top-left corner
- Navigation items categorized under Main, Bet Tracking, Account, and Support
- Logout button at the bottom of the sidebar
- Main content area that renders the current page

### Betting Dashboard
The main dashboard (`betting-dashboard-page.tsx`) includes:
- Key performance metrics displayed in card components at the top:
  - Total profit/loss with positive/negative styling based on value
  - ROI percentage 
  - Total bets placed
  - Strike rate (win percentage)
- Performance chart showing profit/loss over time
- "Add Bet" button that opens the BetEntryForm modal
- Quick access buttons to view pending and settled bets

### Bet Entry Process
The `BetEntryForm` component handles the core betting functionality:
1. User clicks "Add Bet" button on dashboard
2. Bet form modal opens with these key sections:
   - Bet type selection (Single, Double, Treble, etc.) dropdown
   - Horse selection fields (1-5 horses depending on bet type)
   - Horse search with race track and date filters
   - Odds and stake input fields
   - Each-way checkbox toggle
   - Bookmaker and tipster/model fields
   - Notes field for additional information
   - Cancel and Save buttons

**Horse Verification Process**:
1. User enters horse name in the search field
2. System attempts to match against TheRacingAPI data
3. If matched:
   - Horse details auto-populate (jockey, trainer, race details)
   - "Verified" badge appears with checkmark
4. If not matched:
   - "Not Verified" warning appears
   - User has two options:
     - Try a different spelling/name
     - Check "Manual Entry" box to override verification
5. All horses must be either verified or marked as manual entry
6. Form can't be submitted until all required fields are complete

**Bet Submission Flow**:
1. User fills all required fields and clicks "Save"
2. The `betSubmissionService` processes the form data:
   - Validates all fields
   - Creates appropriate database records based on bet type
   - For multiple bets (e.g., Lucky 15), creates parent and component bets
   - Stores all horse data in additional horse records table
3. User receives confirmation and form closes
4. Dashboard refreshes to show the new bet

### Bet History and Management
The `BetHistoryTable` component shows all bets with:
- Date, event, selection, stake, odds, status, and P/L columns
- Filtering by bankroll and sport type
- Color-coded status badges (green for won, red for lost, yellow for pending)
- Action buttons:
  - **View Details**: Expands the row to show full bet information
  - **Edit Bet**: Only available for pending bets, opens edit form
  - **Delete Bet**: Only available for pending bets, shows confirmation dialog
  - **Settle Bet**: For manually settling bets without API results

**Edit Bet Flow**:
1. User clicks "Edit" on a pending bet
2. BetEntryForm opens with pre-populated data
3. User makes changes and saves
4. System updates all related records

**Delete Bet Flow**:
1. User clicks "Delete" on a pending bet
2. Confirmation dialog appears
3. If confirmed, bet and all related records are removed
4. Dashboard refreshes to show updated data

## Backend Scripts

### BSP Updater
`bsp-updater.js` - Updates Betfair Starting Prices (BSP) for races after they start:
- Runs every hour via GitHub Actions scheduled workflow
- Fetches race data from TheRacingAPI
- Processes results to extract BSP (Betfair Starting Price) data
- Updates the `racing_bets` table in Supabase with closing odds
- Calculates closing line value (CLV) for each bet
- Format conversion between fractional/decimal odds

### Racing Results Updater
Scripts in `racing-results-updater/` directory perform these tasks:
- `bet-results-updater.js`: Main script that processes results and updates bets
  - Fetches race results from multiple providers
  - Matches horse names from bets to results (fuzzy matching)
  - Determines bet outcomes (win/place/loss)
  - Calculates returns based on bet type and odds
  - Updates bet status, returns, and profit/loss
  - Handles multiple bet types (singles, each-way, multiples)
- `results-formatter.js`: Normalizes data from different racing APIs
- `horse-name-matcher.js`: Advanced algorithm for matching horse names with typos/variations

The updater handles special cases like:
- Non-runners (void bets)
- Rule 4 deductions
- Dead heats
- Each-way place terms (based on number of runners)

### Supabase Functions
`supabase_update_function.sql` - Database triggers and functions for:
- Calculating profit/loss when results come in
- Updating user statistics
- Maintaining data consistency
- Handling parent/child relationships between multiple bets
- Tracking bankroll changes with each bet
- Automatically updating user performance metrics

## Database Schema
The Supabase database includes:
- **users**: User account information
- **racing_bets**: Individual bet records (horse, race, odds, stake, etc.)
- **tracks**: Race track information
- **racing_results**: Race results data
- **additional_horses**: Additional horses for multiple bets
- **user_profiles**: Extended user information (preferences, settings)
- **bankrolls**: User bankroll tracking
- **bet_components**: Child bets that make up multiple bets

## Current Features
1. **Betting Dashboard**: Overview of betting performance with key metrics
2. **Bet Tracking**: Add, edit, and view all placed bets
3. **Performance Analytics**: ROI, strike rate, P/L over time
4. **Settled/Pending Bet Views**: Filter and manage bets by status
5. **User Profile Management**: Account settings and preferences
6. **Closing Line Value Tracking**: Compare bet odds to starting prices

## Future Features

### AI Agent Integration (In Development)
- AI agent using MCP (Model Context Protocol) tools to:
  - Add bets through natural language
  - Navigate the app interface
  - Provide betting insights
  - Example: "Add a $50 bet on Thunder Strike at Belmont Park today at odds of 3.5"
  - The agent will parse this, find the correct horse and race, and create the bet

### RAG-Based Racing Advisor
- Uses Retrieval Augmented Generation to:
  - Analyze horse racing data
  - Provide race insights
  - Suggest potential value bets
  - Access historical performance data
  - Identify patterns in horse/jockey/trainer combinations

### Proprietary Betting Models
- Machine learning models for:
  - Race outcome prediction
  - Value bet identification
  - Alerts to users for high-value opportunities
  - Personalized recommendations based on user betting history
  - Pre-race adjustments based on weather, track conditions, etc.

### Community Features
- Horse racing forum
- News aggregation
- Expert analysis sharing
- User community bet sharing
- Tipster leaderboards and performance tracking

### Public Website
- Landing page
- Marketing content
- User acquisition
- Blog and educational resources
- Conversion path to dashboard registration

## Code Examples

### Next.js Route Structure
```tsx
// src/app/betting-dashboard/page.tsx
'use client';

import React from 'react';
import BettingDashboardPage from '../../frontend-ui/pages/betting-dashboard-page';
import DashboardLayout from '../../frontend-ui/layouts/DashboardLayout';

export default function BettingDashboard() {
  return (
    <DashboardLayout>
      <BettingDashboardPage />
    </DashboardLayout>
  );
}
```

### Dashboard Layout Component
```tsx
// src/frontend-ui/layouts/DashboardLayout.tsx (simplified)
'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Navigation links */}
      </aside>
      
      {/* Main content */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
```

### Bet Submission Service
```tsx
// lib/services/bet-submission-service.ts (key function)
public async submitBet(
  userId: string,
  formData: BetFormData,
  horses: HorseData[]
): Promise<SubmissionResult> {
  // Validate required fields
  if (!formData.stake) {
    return {
      success: false,
      error: 'Missing required bet details (stake)'
    };
  }

  // Check bet type and validate required horses
  const betTypeKey = formData.bet_type as keyof typeof BET_TYPES;
  const betTypeInfo = BET_TYPES[betTypeKey];
  
  if (!betTypeInfo) {
    return {
      success: false,
      error: `Unknown bet type: ${formData.bet_type}`
    };
  }
  
  // Ensure we have enough horses for this bet type
  if (horses.length < betTypeInfo.requiredHorses) {
    return {
      success: false,
      error: `Bet type ${formData.bet_type} requires ${betTypeInfo.requiredHorses} horses`
    };
  }

  // Generate all the bets to insert based on the bet type
  const betsToInsert = this.generateComponentBets(userId, formData, horses);
  
  // Insert all the bets to database
  // ... database operations ...
  
  return { success: true, betIds: [parentBetId, ...componentBetIds] };
}
```

## Key Interfaces
```tsx
// Common interfaces used in the application

interface Bet {
  id: string;
  user_id: string;
  horse_name: string;
  track_name: string;
  race_number: string;
  race_date: string;
  jockey: string;
  trainer: string;
  odds: number;
  stake: number;
  each_way: boolean;
  closing_odds: number | null;
  profit_loss: number | null;
  bet_status: 'Pending' | 'Won' | 'Lost' | 'Placed' | 'Void';
  created_at: string;
  bookmaker: string;
  model_tipster: string;
  notes: string;
}

interface BetStats {
  totalBets: number;
  totalStaked: number;
  totalReturned: number;
  profitLoss: number;
  roi: number;
  strikeRate: number;
  avgOdds: number;
  clvAvg: number;
}
```

## Current UI Design
The current UI uses a basic Tailwind setup with a standard dashboard layout:
- Blue/white color scheme
- Sidebar navigation
- Card-based metric displays
- Data tables for bet history
- Line charts for performance visualization

The project aims to enhance this with more professional, horse racing-themed UI components while maintaining the current architecture and backend functionality.

## Common User Actions

1. **Adding a New Bet**:
   - Click "Add Bet" button on dashboard
   - Fill out bet form with horse details
   - Verify horse data against API
   - Set stake and odds
   - Save bet to database

2. **Viewing Bet Performance**:
   - Dashboard shows overall P/L and ROI
   - Analytics page has detailed charts
   - Bet history table shows individual bets
   - Filters allow sorting by date, track, etc.

3. **Editing/Deleting Bets**:
   - Find bet in history table
   - Click edit/delete buttons
   - Confirm changes
   - System updates all related records

4. **Managing Account**:
   - Access profile page from sidebar
   - Update personal details
   - Manage bankroll settings
   - Configure notification preferences

The primary goal is to create a professional, intuitive interface for horse racing bettors to track their bets and analyze their performance accurately. 