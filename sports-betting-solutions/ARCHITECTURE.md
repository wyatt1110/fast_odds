# Sports Betting Solutions - Architecture Guide

This document provides a comprehensive overview of the project's architecture and file organization.

## 🏗️ Project Structure

```
sports-betting-solutions/
├── src/
│   ├── app/                      # Next.js App Router (ROUTING ONLY)
│   │   ├── page.tsx              # Landing page route
│   │   ├── betting-dashboard/    # Main dashboard route
│   │   ├── all-bets/             # All bets page route (includes pending & settled)
│   │   ├── analytics/            # Analytics page route
│   │   ├── account/              # Account page route
│   │   ├── settings/             # Settings page route
│   │   ├── help/                 # Help & Support page route
│   │   └── api/                  # API routes
│   │
│   ├── frontend-ui/              # 🌟 ACTUAL UI COMPONENTS 🌟
│   │   ├── pages/                # Main page components 
│   │   │   ├── betting-dashboard-page.tsx  # Dashboard UI
│   │   │   ├── all-bets-page.tsx           # All bets UI (with pending/settled tabs)
│   │   │   ├── analytics-page.tsx          # Analytics UI
│   │   │   ├── account-details-page.tsx    # Account profile UI
│   │   │   ├── settings-page.tsx           # Settings UI
│   │   │   └── help-support-page.tsx       # Help & Support UI
│   │   │
│   │   ├── layouts/              # Layout components
│   │   │   └── DashboardLayout.tsx         # Shared sidebar layout
│   │   │
│   │   ├── components/           # Reusable UI components
│   │   │   ├── betting/          # Betting components
│   │   │   │   ├── bet-entry-form.tsx      # Form for entering bets
│   │   │   │   ├── bet-history-table.tsx   # Table of bet history
│   │   │   │   ├── bet-filters.tsx         # Filters for bets
│   │   │   │   ├── pending-bet-card.tsx    # Card for displaying a bet (used for both pending & settled)
│   │   │   │   └── racing-assistant-interface.tsx  # Racing AI assistant
│   │   │   │
│   │   │   └── ...               # Other component categories
│   │   │
│   │   ├── providers/            # Context providers
│   │   └── templates/            # Reusable page templates
│   │
│   ├── components/               # Legacy components (being migrated)
│   │   ├── bets/                 # Legacy bet components
│   │   │   └── BetForm.tsx       # Legacy bet form (referenced in dashboard)
│   │   └── ...                   # Other legacy components
│   │
│   ├── lib/                      # Utility libraries and services
│   │   ├── racing-api/           # Horse racing API integration
│   │   │   ├── client.ts         # API client implementation
│   │   │   ├── index.ts          # Main entry point
│   │   │   └── types.ts          # Type definitions
│   │   │
│   │   ├── supabase/             # Supabase client and database functions
│   │   ├── ai/                   # AI integration utilities
│   │   ├── auth/                 # Authentication utilities
│   │   └── ...                   # Other utility categories
│   │
│   ├── data-types/               # TypeScript type definitions
│   ├── api-endpoints/            # API endpoint definitions
│   ├── services/                 # Service integrations
│   ├── ai-prompts/               # AI model prompts
│   └── config/                   # Configuration files
│
├── public/                       # Static assets
├── scripts/                      # Build and utility scripts
├── supabase/                     # Supabase configuration
└── ...                           # Configuration files
```

## 📱 Application Flow

1. User navigates to a URL (e.g., `/betting-dashboard`)
2. Next.js routes to the corresponding page in `/src/app/betting-dashboard/page.tsx`
3. This page imports and renders the actual component from `/src/frontend-ui/pages/betting-dashboard-page.tsx`
4. The component typically uses the `DashboardLayout` from `/src/frontend-ui/layouts/DashboardLayout.tsx`
5. The component may import and use other components from `/src/frontend-ui/components/`
6. API calls are made using utilities from `/src/lib/`

## 🚫 Current Issues and Solutions

### Issue 1: Duplication Between Legacy and New Components

We currently have both:
- `/src/components/bets/BetForm.tsx` (legacy)
- `/src/frontend-ui/components/betting/bet-entry-form.tsx` (new)

**Solution**: We're migrating components from the legacy structure to the new structure. During migration, both may exist, but we're working to eliminate duplicates.

### Issue 2: Inconsistent Import Paths

Some files use relative imports while others use path aliases.

**Solution**: Standardize on path aliases (`@/`) for all imports to prevent path calculation issues.

### Issue 3: Bet Status Management

The application now manages different bet statuses (pending, settled) within a single page.

**Solution**: We've implemented a tabbed interface in the All Bets page with proper filtering and sorting for each view.

## ⚠️ IMPORTANT EDITING GUIDELINES ⚠️

1. **NEVER edit components in `/src/app/**` directories**
   - These files ONLY import and render the real components
   - They should only have minimal code that imports and renders components

2. **ALWAYS edit components in `/src/frontend-ui/**` directories**
   - This is where the ACTUAL UI code lives
   - All UI logic, state, and presentation should be here

3. **The flow is:**
   - NextJS routes to a URL using `/src/app/[route]/page.tsx`
   - That file imports a real component from `/src/frontend-ui/pages/[component].tsx`
   - The real component is wrapped with DashboardLayout from `/src/frontend-ui/layouts/`

4. **Working with the All Bets page:**
   - The page now handles both pending and settled bets
   - Be careful when modifying filtering logic so it works for all bet types
   - Remember that switching between tabs requires client-side filtering
   - The default sort differs between pending (scheduled_race_time) and settled (created_at) bets

## 📌 Quick Reference

| If you want to change... | Edit this file |
|--------------------------|---------------|
| Main dashboard | `/src/frontend-ui/pages/betting-dashboard-page.tsx` |
| All Bets page | `/src/frontend-ui/pages/all-bets-page.tsx` |
| Analytics page | `/src/frontend-ui/pages/analytics-page.tsx` |
| Account page | `/src/frontend-ui/pages/account-details-page.tsx` |
| Settings page | `/src/frontend-ui/pages/settings-page.tsx` |
| Help & Support page | `/src/frontend-ui/pages/help-support-page.tsx` |
| Sidebar layout | `/src/frontend-ui/layouts/DashboardLayout.tsx` |
| Bet entry form | `/src/frontend-ui/components/betting/bet-entry-form.tsx` |
| Bet history table | `/src/frontend-ui/components/betting/bet-history-table.tsx` |
| Bet card | `/src/frontend-ui/components/betting/pending-bet-card.tsx` |
| Bet filters | `/src/frontend-ui/components/betting/bet-filters.tsx` |
| Racing assistant | `/src/frontend-ui/components/betting/racing-assistant-interface.tsx` |

## 🔄 Adding New Pages

1. Create a new component in `/src/frontend-ui/pages/your-feature-page.tsx`
2. Create route handler in `/src/app/your-feature/page.tsx` that imports your component
3. Wrap your component with DashboardLayout
4. Add a link to it in the sidebar if needed

## 🧠 State Management

This project uses React's built-in state management with:
- Local component state (useState)
- Context API for cross-component state (in `/src/frontend-ui/providers/`)
- Supabase for persistent data storage

## 🔌 API Integration

- Horse racing data is fetched using the racing API client in `/src/lib/racing-api/`
- Database operations use the Supabase client in `/src/lib/supabase/`
- Authentication is handled through Supabase Auth 

## 🚦 Common Errors and Solutions

### 1. Bet Status Filtering Issues

**Problem**: Bets aren't appearing in the correct tab or filter view.

**Solution**:
- Check the `selectedView` state in `all-bets-page.tsx`
- Verify the Supabase query is correctly applying filters
- Check client-side filter handlers for logic errors

### 2. Component Name Conflicts

**Problem**: Components with similar names may be confused.

**Solution**:
- The `pending-bet-card.tsx` component is used for all bet types (not just pending bets)
- Consider renaming components that might cause confusion in the future

### 3. Navigation Issues

**Problem**: Sidebar navigation doesn't correctly highlight the active page.

**Solution**:
- The `DashboardLayout.tsx` uses the `usePathname()` hook to determine the active page
- Make sure your route paths match exactly with what's checked in the `isActive` function 