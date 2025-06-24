# AI GitHub Workflow Guide

## Repository Structure & Locations

### Primary Repositories:
- **OddsVantage Main**: `/Users/mileswigy/Downloads/odds-vantage-web-main-3`
- **Well Oiled Machine**: `/Users/mileswigy/Desktop/Well Oiled Machine/sports-betting-solutions`
- **Master App**: `/Users/mileswigy/Desktop/Well Oiled Machine/OddsVantage-App`
- **Fast Odds (GitHub)**: `/Users/mileswigy/Desktop/Oddsvantage - Combination`

### Critical Rule:
**ALWAYS edit in Master App location FIRST, then clone to Fast Odds for GitHub**

## Proper Git Workflow (NEVER DELETE FILES)

### 1. Pre-Commit Checks
```bash
git status                    # Check what's changed
ls -la | grep target_file     # Verify file exists in correct location
```

### 2. Standard Workflow
```bash
git add filename              # Add specific files
git commit -m "Clear message" # Descriptive commit
git push origin main          # Push to GitHub
```

### 3. File Location Verification
- Scripts: Must be in repository root
- Workflows: Must be in `.github/workflows/`
- Backups: Check `fast_odds_restore/` and `fast_odds_backup/`

## Current Automated Workflows (All Active)

### Fast Odds Repository Status:
- **16 workflows total** ✅
- **3 automated schedules** (ONLY THESE 3) ✅

### Schedule Summary (ONLY 3 ACTIVE WORKFLOWS):
- **Jockey Trainer**: Daily 2:00 & 5:00 AM UK 
- **Master Results**: Daily 12:00 & 20:00 PM UK
- **Timeform Scraper**: Daily 15:00 & 22:00 PM UK

## Emergency Recovery

### If Files Missing:
1. Check `fast_odds_restore/` directory
2. Copy missing files: `cp fast_odds_restore/filename .`
3. Restore workflows: `cp fast_odds_restore/.github/workflows/filename .github/workflows/`
4. Commit immediately: `git add . && git commit -m "Restore missing files" && git push origin main`

### Never Do:
- Delete repositories and recreate
- Force push without checking
- Commit without verifying file locations
- Push without running `git status` first

## File Priorities:
1. **timeform-scraper.js** + **timeform-scraper.yml** - Daily 15:00 & 22:00 UK
2. **daily-jockey-trainer-analysis.js** + **jockey-trainer-updater.yml** - Daily 2:00 & 5:00 AM UK  
3. **populate-master-results.js** + **master-results-updater.yml** - Daily 12:00 & 20:00 PM UK

---
**EXACTLY 3 workflows running at specified times. All schedules corrected. Repository is stable.** 