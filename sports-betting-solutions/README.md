# OddsVantage Frontend

A comprehensive horse racing analytics and betting platform built with Next.js, TypeScript, and Supabase.

## 🏇 Features

### Core Functionality
- **Turf Tracker**: Advanced horse racing analytics and tracking
- **Pro Dashboard**: Professional betting dashboard with real-time data
- **OV Models**: Multiple betting models with live performance tracking
- **Racecards**: Comprehensive race information and handicapping tools
- **Membership System**: Tiered subscription management with Stripe integration

### Technical Stack
- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Real-time)
- **Payments**: Stripe integration
- **Email**: Resend with custom domain
- **Charts**: Chart.js with react-chartjs-2
- **UI Components**: Custom components with Lucide React icons

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- Stripe account (for payments)
- Resend account (for emails)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/wyatt1110/oddsvantage-frontend.git
   cd oddsvantage-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file with:
   ```env
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   
   # Stripe
   STRIPE_SECRET_KEY=your_stripe_secret_key
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
   
   # Resend
   RESEND_API_KEY=your_resend_api_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── api/               # API routes
│   ├── horse-racing/      # Racing-specific pages
│   ├── membership/        # Membership pages
│   └── ...
├── components/            # Reusable UI components
├── lib/                   # Utility libraries and services
├── services/              # Business logic services
├── types/                 # TypeScript type definitions
└── hooks/                 # Custom React hooks
```

## 🔧 Key Features

### Authentication & User Management
- Supabase Auth integration
- Automatic user profile creation
- Membership tier management
- Email verification system

### Horse Racing Analytics
- Real-time race data
- Performance tracking
- Multiple betting models
- Historical analysis

### Payment Integration
- Stripe checkout sessions
- Subscription management
- Webhook handling
- Automatic membership updates

### Email System
- Welcome emails
- Business domain integration
- Automated notifications

## 🚀 Deployment

### Railway Deployment
1. Connect your GitHub repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically on push to main branch

### Environment Variables Required
- All Supabase credentials
- Stripe API keys
- Resend API key
- Domain configuration

## 📊 Database Schema

### Key Tables
- `user_profiles`: User information and membership data
- `sharp_win_signals`: Win model betting signals
- `ov-bankers`: Bankers model data
- `ov_signals`: +EV opportunities data
- `timeform`: Historical racing data

## 🔒 Security

- Row Level Security (RLS) enabled on all tables
- Service role key for admin operations
- Environment variable protection
- Input validation and sanitization

## 📈 Performance

- Next.js 14 App Router
- Server-side rendering where appropriate
- Optimized database queries
- Efficient state management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is proprietary software. All rights reserved.

## 🆘 Support

For support, email contact@oddsvantage.io

---

**Built with ❤️ for the horse racing community** 