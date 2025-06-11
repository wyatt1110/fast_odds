# OddsVantage Master Results Population

This repository contains the automated script and workflow for populating the `master_results` table with comprehensive racing data for machine learning purposes.

## Overview

The master results table combines data from multiple sources:
- Racing API results (race outcomes)
- Supabase racecard data (pre-race information)
- UK and Ireland BSP data
- Comprehensive odds history from 30+ bookmakers

## Automated Workflow

The GitHub workflow runs twice daily:
- **12:00 UK Time**: Initial population with previous day's data
- **20:00 UK Time**: Update run to fill any missing data

## Files

- `populate-master-results.js` - Main script for data population
- `.github/workflows/populate-master-results.yml` - GitHub Actions workflow
- `MASTER_RESULTS_README.md` - Detailed documentation
- `package.json` - Node.js dependencies

## Environment Variables Required

The workflow requires these GitHub secrets:
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Service role key for database access

## Manual Execution

You can manually trigger the workflow from the GitHub Actions tab, choosing between INSERT or UPDATE modes.

For detailed information about the data structure and processing logic, see `MASTER_RESULTS_README.md`.

### Races Table
Complete race information including course, time, distance, prize money, going conditions, and more.

### Runners Table  
Detailed horse information including breeding, connections, form, ratings, and performance data.

### Odds Table
Live odds from all bookmakers with historical tracking via timestamped columns:
- `odds_14_30_fractional` - Fractional odds at 2:30 PM
- `odds_14_30_decimal` - Decimal odds at 2:30 PM
- And so on for each 10-minute update...

## 🚀 Setup

### 1. Repository Secrets
Add these secrets to your GitHub repository:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key

### 2. Database Schema
Run the SQL schema in `UPDATED_SUPABASE_SCHEMA.sql` in your Supabase SQL editor to create the required tables.

### 3. Automatic Execution
The GitHub Action runs automatically every 10 minutes from 6 AM to 11 PM GMT during racing hours.

## 📅 Schedule

- **Frequency**: Every 10 minutes
- **Hours**: 6 AM - 11 PM GMT (racing hours)
- **Manual Trigger**: Available via GitHub Actions interface

## 🔧 Manual Execution

To run manually:
1. Go to the "Actions" tab in GitHub
2. Select "Update Racecards" workflow
3. Click "Run workflow"

## 📈 Monitoring

Check the GitHub Actions logs to monitor:
- Number of races processed
- Number of runners updated
- Number of odds entries processed
- Any errors or race finish notifications

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Add your Supabase credentials to .env
# Run manually
npm run update
```

## 📋 API Coverage

Fetches data from The Racing API including:
- **Global Coverage**: UK, Ireland, France, Germany, Hong Kong, Japan, and more
- **All Race Types**: Flat, National Hunt, All-Weather
- **Complete Data**: Every field from the API is stored
- **Live Odds**: 15-20 bookmakers per race

## 🔒 Security

- API credentials are stored as GitHub secrets
- Private repository protects sensitive data
- Service role key has minimal required permissions
- No sensitive data exposed in logs

## 📞 Support

The system is designed to be self-maintaining. Check GitHub Actions logs for any issues.

---

**Last Updated**: May 2025  
**Version**: 1.0.0 

# Fast Odds API

**Live horse racing odds updated every 5 seconds for instant betting model access.**

## 🚀 Features

- **Live odds from Bet365 & William Hill**
- **5-second automatic refresh**
- **Instant API responses** (in-memory storage)
- **Multiple endpoints** for betting model integration
- **Real-time horse search**

## 📊 Live Data

Currently serving **1600+ live horse racing odds** updated every 5 seconds.

## 🔗 API Endpoints

### Get All Odds
```bash
GET /odds
# Returns all live odds from both bookmakers
```

### Get Bookmaker Specific Odds
```bash
GET /bet365          # Bet365 odds only
GET /william-hill    # William Hill odds only
```

### Search Horses
```bash
GET /horse/{name}    # Find specific horse across all bookmakers
```

### Status
```bash
GET /              # API status and total odds count
```

## 🏃‍♂️ Quick Start

### Local Development
```bash
pip install fastapi uvicorn httpx
python main.py
```

API will be available at `http://127.0.0.1:8000`

### Example Usage for Betting Models

```python
import httpx

# Get all live odds
response = httpx.get("http://your-api-url/odds")
odds = response.json()

# Compare Bet365 vs William Hill
bet365_odds = httpx.get("http://your-api-url/bet365").json()["odds"]
william_hill_odds = httpx.get("http://your-api-url/william-hill").json()["odds"]

# Find specific horse
horse_data = httpx.get("http://your-api-url/horse/thunderbolt").json()
```

## 📈 Response Format

```json
{
  "bet365": [
    {
      "horse": "Thunder Bolt",
      "race": "Race 3 - Kempton",
      "odds": 3.5,
      "bookmaker": "bet365"
    }
  ],
  "william_hill": [
    {
      "horse": "Lightning Strike", 
      "race": "16:30 Southwell",
      "odds": 2.8,
      "bookmaker": "william_hill"
    }
  ],
  "total": 1604,
  "last_updated": "2025-06-09T17:42:57.397760",
  "update_count": 44
}
```

## ⚡ Performance

- **Update frequency**: Every 5 seconds
- **Response time**: <100ms (in-memory storage)
- **Data freshness**: Always current
- **Uptime**: 99.9%

## 🎯 Perfect for Betting Models

This API is designed specifically for algorithmic betting models that need:
- **Fast access** to current odds
- **Reliable updates** every 5 seconds  
- **Clean data format** for easy processing
- **Multiple bookmaker comparison**

## 🔧 Tech Stack

- **FastAPI** - High-performance async API
- **httpx** - Fast HTTP client for data fetching
- **uvicorn** - ASGI server
- **In-memory storage** - Instant response times

## 📝 License

MIT License - Use freely for your betting models! 

# 🏇 Bet365 Fast Odds Tracker

High-performance Bet365 odds tracker optimized for Railway deployment. Updates live horse racing odds every 10 seconds during UK betting hours (07:00-21:00 GMT).

## 🚀 Features

- **Ultra-fast updates**: 10-second intervals for real-time odds tracking
- **Intelligent matching**: Flexible horse name and track name matching with normalization
- **Memory optimization**: In-memory caching for improved performance
- **Batch processing**: Bulk database updates for maximum efficiency
- **Active hours only**: Runs 07:00-21:00 UK time to optimize resources
- **Railway optimized**: Configured for seamless Railway deployment

## 📊 Performance Optimizations

- **Memory caching**: Daily horses cached for 5 minutes to reduce database queries
- **Batch updates**: Groups database operations for improved throughput
- **Normalized matching**: Handles case sensitivity and punctuation differences
- **Chunked processing**: Processes updates in 50-horse chunks
- **Timeout optimization**: 8-second API timeout for faster fail-recovery

## 🔧 Environment Variables

Required environment variables for Railway deployment:

```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
NODE_ENV=production
TZ=Europe/London
```

## 🗂️ Database Schema

Updates the `bet365_fast_odds` table with these columns:
- `odds`: Current live odds
- `previous_odds`: Previous odds value (when changed)
- `odds_changed_at`: Timestamp of odds change
- `last_updated_at`: Last update timestamp
- `is_active`: Active status based on live odds and race time

## 🎯 Matching Logic

1. **Horse Name**: Normalized matching (case-insensitive, punctuation-flexible)
2. **Track Name**: Flexible matching using `contains` logic (e.g., "Kempton" matches "Kempton (AW)")
3. **Active Status**: Based on live odds presence and 30-minute post-race cutoff

## 📈 Logging

- **Minimal noise**: Only logs significant odds changes (>10%) and errors
- **Concise summaries**: Shows matched/unmatched counts per cycle
- **Error tracking**: Detailed error reporting for debugging

## 🛠️ Deployment

### Railway

1. Connect this repository to Railway
2. Set environment variables in Railway dashboard
3. Deploy automatically - Railway will use `railway.json` configuration

### Local Development

```bash
npm install
npm start
```

## 📋 API Source

Connects to Bet365 horse racing API:
- Endpoint: `116.202.109.99/v2/bet365/sports/horse-racing/races`
- Updates every 10 seconds during active hours
- Handles fractional and decimal odds conversion

## ⚡ Performance Stats

- **Processing time**: ~2-3 seconds per 300+ horse update cycle
- **Memory usage**: Optimized with caching and batch processing
- **Database load**: Minimized with bulk operations and intelligent caching
- **API efficiency**: 8-second timeout with graceful error handling

---

Built for **OddsVantage** - Real-time betting intelligence platform 