#!/bin/bash

# Setup script for racecards cron job
# This script sets up a cron job to run the racecards updater every 10 minutes

SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
SCRIPT_PATH="$SCRIPT_DIR/update-supabase-racecards.js"
LOG_PATH="$SCRIPT_DIR/logs/racecards-update.log"

echo "🚀 Setting up racecards updater cron job..."

# Create logs directory if it doesn't exist
mkdir -p "$SCRIPT_DIR/logs"

# Make the script executable
chmod +x "$SCRIPT_PATH"

# Create the cron job entry
CRON_JOB="*/10 * * * * cd $SCRIPT_DIR && /usr/bin/node $SCRIPT_PATH >> $LOG_PATH 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "update-supabase-racecards.js"; then
    echo "⚠️  Cron job already exists. Removing old entry..."
    crontab -l 2>/dev/null | grep -v "update-supabase-racecards.js" | crontab -
fi

# Add the new cron job
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ Cron job added successfully!"
echo "📋 Job details:"
echo "   - Runs every 10 minutes"
echo "   - Script: $SCRIPT_PATH"
echo "   - Logs: $LOG_PATH"
echo ""
echo "📝 Current crontab:"
crontab -l

echo ""
echo "🔧 Setup Instructions:"
echo "1. Copy env.example to .env and fill in your Supabase credentials"
echo "2. Install dependencies: npm install"
echo "3. Test the script manually: npm run update"
echo "4. The cron job will start running automatically"
echo ""
echo "📊 To view logs: tail -f $LOG_PATH"
echo "🛑 To remove cron job: crontab -e (then delete the line)" 