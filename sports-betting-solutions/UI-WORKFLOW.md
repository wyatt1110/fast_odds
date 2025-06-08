# UI Development Workflow Guide

This guide focuses on the practical steps for UI development in this project. For a complete architecture overview, please see [ARCHITECTURE.md](./ARCHITECTURE.md).

## 🔍 The Golden Rule

**The most important rule in this project:** 

```
✓ EDIT files in: /src/frontend-ui/**
✗ DON'T EDIT files in: /src/app/**
```

## 👨‍💻 Typical Development Workflow

### 1. Making Changes to Existing Pages

1. Identify which page you need to modify (see Reference table below)
2. Open the corresponding file in `/src/frontend-ui/pages/`
3. Make your changes
4. Save and check the browser to see your changes
5. If changes don't appear, see Troubleshooting section

### 2. Creating New Components

1. Determine where the component belongs:
   - Page component → `/src/frontend-ui/pages/`
   - Reusable component → `/src/frontend-ui/components/`
   - Layout component → `/src/frontend-ui/layouts/`

2. Create your component file with proper naming:
   - Use kebab-case for filenames: `my-component.tsx`
   - Use PascalCase for the exported component: `export default function MyComponent()`

3. Template for new components:

```tsx
/**
 * COMPONENT NAME
 * 
 * Purpose: [Brief description of the component's purpose]
 * Used by: [Where this component is used]
 */

'use client';

import React from 'react';

interface MyComponentProps {
  // Define your props here
}

export default function MyComponent({ /* your props */ }: MyComponentProps) {
  return (
    <div>
      {/* Your component content */}
    </div>
  );
}
```

### 3. Creating New Pages

1. Create the page component in `/src/frontend-ui/pages/your-feature-page.tsx`
2. Create a route file in `/src/app/your-feature/page.tsx` with:

```tsx
'use client';

import YourFeaturePage from '@/frontend-ui/pages/your-feature-page';
import DashboardLayout from '@/frontend-ui/layouts/DashboardLayout';

export default function YourFeatureRoute() {
  return (
    <DashboardLayout>
      <YourFeaturePage />
    </DashboardLayout>
  );
}
```

3. Add a link to the new page in the sidebar (`DashboardLayout.tsx`)
4. Test the navigation and rendering of your new page

## 🔧 Troubleshooting

If your changes don't appear in the browser:

1. **Clean the Next.js cache:**
   ```bash
   # Stop the current server (Ctrl+C)
   rm -rf .next
   npm run dev
   ```

2. **Check for errors in the terminal/console**

3. **Verify correct component imports:**
   - Ensure the route file in `/src/app/` correctly imports your component 
   - Make sure component names match exactly between the file and import

4. **Path alias troubleshooting:**
   - Use `@/` path aliases for imports (e.g., `@/frontend-ui/components/Button`)
   - Avoid relative paths (e.g., `../../../components/Button`)

5. **Add a test message to verify rendering:**
   ```tsx
   {/* TEST MESSAGE - Remove after verifying */}
   <div className="bg-red-500 text-white p-2 rounded">
     Test Message: {new Date().toLocaleTimeString()}
   </div>
   ```

6. **Understanding Bets Page Structure:**
   - The application has a single unified view for all bets:
     - **All Bets** (`/all-bets` → `all-bets-page.tsx`) - Shows all bets with filtering options for pending and settled bets
   - The page includes tabs to filter between "All", "Pending", and "Settled" bets
   - The default sort order changes based on the selected view:
     - Pending bets are sorted by scheduled race time (ascending)
     - Settled bets are sorted by creation date (descending)
   - Make sure client-side filter state is properly managed when switching between views

7. **Bet Status Filtering Issues:**
   - If bets aren't appearing in the correct tab:
     - Check the `selectedView` state value in `all-bets-page.tsx`
     - Verify the Supabase query is correctly applying the status filter
     - Ensure you're not accidentally overwriting filters in the filter handlers

## 📋 Component Quick Reference

| Page | Component Path |
|------|---------------|
| Dashboard | `/src/frontend-ui/pages/betting-dashboard-page.tsx` |
| All Bets | `/src/frontend-ui/pages/all-bets-page.tsx` |
| Analytics | `/src/frontend-ui/pages/analytics-page.tsx` |
| Account | `/src/frontend-ui/pages/account-details-page.tsx` |
| Settings | `/src/frontend-ui/pages/settings-page.tsx` |
| Help & Support | `/src/frontend-ui/pages/help-support-page.tsx` |

| Shared Component | Path |
|------------------|------|
| Main Layout | `/src/frontend-ui/layouts/DashboardLayout.tsx` |
| Bet Form | `/src/frontend-ui/components/betting/bet-entry-form.tsx` |
| Bet History | `/src/frontend-ui/components/betting/bet-history-table.tsx` |
| Bet Card | `/src/frontend-ui/components/betting/pending-bet-card.tsx` |
| Bet Filters | `/src/frontend-ui/components/betting/bet-filters.tsx` |

## 📝 Best Practices for This Project

1. **Follow the file structure religiously**
   - Route files in `/src/app/**` - minimal, only import components
   - UI components in `/src/frontend-ui/**` - contain all UI logic and JSX

2. **Component naming conventions**
   - Page components: `[name]-page.tsx` with PascalCase export `NamePage`
   - Component files: kebab-case (`bet-entry-form.tsx`)
   - Component exports: PascalCase (`BetEntryForm`)

3. **Component structure**
   - Keep components focused on a single responsibility
   - Extract reusable parts into separate components
   - Use TypeScript interfaces for props

4. **Import conventions**
   - Use path aliases: `import Component from '@/frontend-ui/components/Component';`
   - Avoid relative imports: `../../components/Component` 

5. **Bet Status Management**
   - Remember that bet status filtering can be done in two ways:
     - Server-side filtering: When initially loading data from Supabase (recommended for large datasets)
     - Client-side filtering: When switching between tab views via the UI (provides faster UI feedback)
   - When modifying a bet status, make sure to refresh data accordingly based on current view 