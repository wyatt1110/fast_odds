# BSP Updater

This document explains the BSP (Betfair Starting Price) updater script and how it works to keep your betting data up-to-date.

## Overview

The BSP updater script automatically updates the closing odds for horse racing bets in your database. It runs daily at 12:00 PM UTC to:

1. Find all bets that don't have closing odds (or have them marked as "?")
2. Match each bet's horse name and race date with historical BSP data from UK and USA sources
3. Update the closing odds field with the matched BSP value (to 2 decimal places)
4. Calculate closing line value metrics based on the opening vs. closing odds

## How It Works

### Data Matching Process

1. The script first fetches all racing bets with missing closing odds (null, empty, or "?").
2. It then loads all historical BSP data from both UK and USA tables.
3. For each bet, it:
   - Cleans the horse name for matching (removing special characters, normalizing whitespace)
   - Formats the date for consistent comparison
   - Tries to find a matching horse + date combination in the UK BSP data
   - If no UK match is found, it tries the USA BSP data
   - Updates the bet record with the found BSP value or "?" if no match

### Closing Line Value Calculation

For each bet where closing odds are found, the script also calculates:

- **Closing Line Value (%)**: `((best_odds / closing_odds) - 1) * 100`
  - A positive value indicates the bet had value (you got better odds than closing)
  - A negative value indicates negative value (odds shortened before the race)

- **Weighted Closing Value**: The closing value percentage multiplied by the stake amount
  - This weights the value by the stake, giving a better picture of total value captured

## Running the Script

### Automatic Daily Run

The script runs automatically every day at 12:00 PM UTC via GitHub Actions.

### Manual Execution

You can manually trigger the GitHub Actions workflow through the GitHub interface, or run the script locally:

```bash
# Set required environment variables
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run the script
node scripts/bsp-updater.js
```

## Troubleshooting

If the script fails to match horses correctly, check for:

1. Horse name discrepancies (spelling variations, country codes, etc.)
2. Date format issues (especially with UK vs. USA date formats)
3. Missing data in the BSP historical tables

## Adding More Data Sources

To add more BSP data sources:

1. Create a new table in Supabase with the appropriate structure
2. Update the script to query this table as another fallback source
3. Ensure date and horse name formats are properly handled for matching 