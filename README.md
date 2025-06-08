# Racecards Updater

Automated system that fetches live racecards data from The Racing API and updates a Supabase database every 10 minutes during racing hours.

## 🏗️ Features

- **Live Data Sync**: Fetches racecards from The Racing API every 10 minutes
- **Smart Odds Tracking**: Creates timestamped columns to track odds movements throughout the day
- **Race Time Awareness**: Stops updating odds after races finish (with 5-minute buffer)
- **No Duplicates**: Uses intelligent upsert logic to prevent data duplication
- **Comprehensive Coverage**: Tracks races, runners, and odds from all major bookmakers
- **Automated Deployment**: Runs on GitHub Actions - no local server required

## 📊 Data Structure

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