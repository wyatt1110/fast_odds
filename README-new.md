# 🏇 Fast Odds Tracker

**High-performance horse racing odds tracker for Bet365 and William Hill, optimized for Railway deployment.**

## 🚀 Features

- **Live odds from Bet365 & William Hill**
- **10-second automatic refresh** during UK betting hours (07:00-21:00 GMT)
- **Intelligent matching**: Flexible horse name and track name matching with normalization
- **Memory optimization**: In-memory caching for improved performance
- **Batch processing**: Bulk database updates for maximum efficiency
- **Railway optimized**: Configured for seamless deployment

## 📊 Performance Optimizations

- **Memory caching**: Daily horses cached for 5 minutes to reduce database queries
- **Batch updates**: Groups database operations for improved throughput
- **Normalized matching**: Handles case sensitivity and punctuation differences
- **Chunked processing**: Processes updates in 50-horse chunks
- **Timeout optimization**: 8-second API timeout for faster fail-recovery

## 🏃‍♂️ Quick Start

### Bet365 Tracker
```bash
npm install
npm run bet365
```

### William Hill Tracker
```bash
npm install
npm run williamhill
```

### Both Services (Default)
```bash
npm install
npm start  # Runs Bet365 by default
```

## 🔧 Environment Variables

Required environment variables for Railway deployment:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
NODE_ENV=production
TZ=Europe/London
```

## 🗂️ Database Schema

### Bet365 Fast Odds Table
Updates the `bet365_fast_odds` table with these columns:
- `odds`: Current live odds
- `previous_odds`: Previous odds value (when changed)
- `odds_changed_at`: Timestamp of odds change
- `last_updated_at`: Last update timestamp
- `is_active`: Active status based on live odds and race time

### William Hill Fast Odds Table
Updates the `williamhill_fast_odds` table with the same structure as Bet365.

## 🎯 Matching Logic

1. **Horse Name**: Normalized matching (case-insensitive, punctuation-flexible)
2. **Track Name**: Flexible matching using `contains` logic (e.g., "Kempton" matches "Kempton (AW)")
3. **Active Status**: Based on live odds presence and 30-minute post-race cutoff

## 📈 Logging

- **Minimal noise**: Only logs significant odds changes (>10%) and errors
- **Concise summaries**: Shows matched/unmatched counts per cycle
- **Error tracking**: Detailed error reporting for debugging

## 🛠️ Railway Deployment

### Bet365 Deployment
1. Connect this repository to Railway
2. Use the default `railway.json` configuration
3. Set environment variables in Railway dashboard
4. Deploy automatically

### William Hill Deployment
1. Create a new Railway service
2. Use the `williamhill-railway.json` configuration
3. Set the same environment variables
4. Deploy with the William Hill script

### Local Development
```bash
npm install

# For Bet365
npm run bet365

# For William Hill
npm run williamhill
```

## 📋 API Sources

### Bet365
- Endpoint: `116.202.109.99/v2/bet365/sports/horse-racing/races`
- Updates every 10 seconds during active hours
- Handles fractional and decimal odds conversion

### William Hill
- Endpoint: `116.202.109.99/v2/williamhill/sports/horse-racing/races`
- Updates every 10 seconds during active hours
- Handles fractional and decimal odds conversion

## ⚡ Performance Stats

- **Processing time**: ~2-3 seconds per 300+ horse update cycle
- **Memory usage**: Optimized with caching and batch processing
- **Database load**: Minimized with bulk operations and intelligent caching
- **API efficiency**: 8-second timeout with graceful error handling

## 📊 Typical Output

```
✅ 352/352 horses processed
✅ Update complete at 11/06/2025, 13:42:07
📊 34 races, 352 horses from API
📈 Beauty Nation: 15 → 8 (46.7%)
📈 Massimo Blue: 15 → 8 (46.7%)
📈 Evening's Empire: 2.88 → 19 (559.7%)
```

## 🔒 Security

- API credentials stored as environment variables
- Supabase service role key with minimal required permissions
- No sensitive data exposed in logs
- Graceful error handling for API failures

## 📞 Support

The system is designed to be self-maintaining. Check Railway logs for any issues.

---

**Built for OddsVantage** - Real-time betting intelligence platform  
**Last Updated**: June 2025  
**Version**: 2.0.0 