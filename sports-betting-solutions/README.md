# Sports Betting Solutions

A Next.js application for tracking and analyzing sports bets, with a focus on horse racing.

## 📌 IMPORTANT: File Structure Guide

This project uses a specific architecture pattern where:

1. **Route definitions** are in `/src/app/**` directories (handled by Next.js App Router)
2. **Actual UI components** are in `/src/frontend-ui/**` directories
3. **API services** are in `/src/lib/**` directories

### ⚠️ ALWAYS EDIT THE CORRECT FILES:

- **DON'T edit** components in `/src/app/**` - these are just route handlers
- **DO edit** components in `/src/frontend-ui/pages/*` - these contain the UI code
- **Legacy components** in `/src/components/*` are being migrated to the frontend-ui directory

## 📂 Key Directories

```
sports-betting-solutions/
├── src/
│   ├── app/                         # Next.js App Router (ROUTES ONLY)
│   │   ├── page.tsx                 # Home route (landing page)
│   │   ├── betting-dashboard/       # Dashboard route
│   │   │   └── page.tsx             # Imports the actual dashboard component
│   │   └── ...                      # Other routes
│   │
│   ├── frontend-ui/                 # 🌟 MAIN UI COMPONENTS 🌟
│   │   ├── pages/                   # Page components 
│   │   │   ├── betting-dashboard-page.tsx  # Dashboard UI
│   │   │   ├── all-bets-page.tsx           # All bets UI
│   │   │   └── ...                         # Other pages
│   │   │
│   │   ├── components/              # Reusable UI components
│   │   │   ├── betting/             # Betting-specific components
│   │   │   │   ├── bet-entry-form.tsx      # Form for entering bets
│   │   │   │   └── bet-history-table.tsx   # Table showing bet history
│   │   │   └── ...                         # Other components
│   │   │
│   │   └── layouts/                 # Layout components
│   │       └── DashboardLayout.tsx  # Main dashboard layout with sidebar
│   │
│   ├── components/                  # Legacy components (being migrated)
│   │   └── bets/                    # Legacy bet components
│   │       └── BetForm.tsx          # Old bet form (referenced in dashboard)
│   │
│   ├── lib/                         # Utility functions and services
│   │   ├── racing-api/              # Horse racing API integration
│   │   ├── supabase/                # Database client and functions
│   │   └── ...                      # Other utilities
│   │
│   └── ...                          # Other directories
│
└── ...                              # Config files, etc.
```

## 🚀 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   Copy `.env.local.example` to `.env.local` and add your Supabase credentials.

3. Run the development server:
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Key Features

### Core Features
- Track racing bets with automatic horse data lookup
- View performance analytics (P/L, ROI, etc.)
- Historical bet tracking
- Dashboard with visual analytics

### API Integrations
- Racing API for horse data verification
- Supabase for data storage and authentication

## ⚙️ Development Guidelines

1. **Creating new pages:**
   - Create component in `/src/frontend-ui/pages/your-page-name.tsx`
   - Create route in `/src/app/your-route/page.tsx` that imports your component
   - Wrap with DashboardLayout if needed

2. **Creating new components:**
   - Add component to `/src/frontend-ui/components/`
   - Use TypeScript interfaces for props
   - Follow existing naming conventions

3. **Troubleshooting:**
   - If changes don't appear, check if you're editing the correct files
   - Clean Next.js cache: `rm -rf .next`
   - Restart development server: `npm run dev`

## 📚 Project Documentation

- [UI Workflow Guide](./UI-WORKFLOW.md) - Detailed guide on UI development
- [Project Architecture](./ARCHITECTURE.md) - Overall architecture information

## 📊 Database Structure

This project uses Supabase with the following main tables:
- `horse_racing_bets` - Stores all bet information
- `users` - User authentication data (managed by Supabase Auth)
- `user_profiles` - Extended user information

## 🔧 Technologies

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **APIs**: Racing data APIs
- **Deployment**: Vercel

## 📜 License

This project is licensed under the MIT License.

## Features

### Core Features (Free Tier)
- AI-powered chat interface for natural language bet input
- Automated match identification and data extraction
- Real-time spreadsheet updates
- Basic performance analytics (ROI, win rate, etc.)

### Premium Features (Coming Soon)
- Closing line value tracking
- Betfair Exchange integration
- Advanced analytics with Kelly criterion-based stake sizing
- Sports intelligence with news aggregation and alerts

## Tech Stack

- **Frontend**: Next.js with TypeScript and Tailwind CSS
- **Backend**: Supabase (Authentication, Database, Storage)
- **AI**: OpenAI API for natural language processing
- **Hosting**: Vercel

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Database Setup

1. Create a new Supabase project
2. Run the SQL script in `supabase/schema.sql` to set up the database schema
3. Set up authentication providers in the Supabase dashboard

## Project Structure

```
sports-betting-solutions/
├── public/              # Static assets
├── src/
│   ├── app/             # Next.js app router pages
│   │   ├── page.tsx     # Home route (landing page)
│   │   ├── betting-dashboard/  # Dashboard route
│   │   └── ...             # Other routes
│   │
│   ├── frontend-ui/     # �� MAIN UI COMPONENTS 🌟
│   │   ├── pages/       # Page components 
│   │   └── ...         # Other pages
│   │
│   ├── components/      # Reusable UI components
│   └── layouts/         # Layout components
│       └── DashboardLayout.tsx  # Main dashboard layout with sidebar
│
└── ...                  # Config files, etc.
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.io/)
- [Tailwind CSS](https://tailwindcss.com/)
- [OpenAI](https://openai.com/) 