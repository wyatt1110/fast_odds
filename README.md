# 🏇 Timeform Scraper

**Production-ready Timeform horse racing data scraper for tomorrow's GB & IRE racecards**

## 🚀 Features

- **Tomorrow's Racecards**: Always scrapes tomorrow's GB & IRE racecards automatically
- **Comprehensive Data**: Extracts all race info, horse details, pacemap data, and past performances
- **Supabase Integration**: Direct upload to production database with upsert logic
- **Enhanced Error Handling**: Detailed logging with reverse lookup for missing horses
- **Production Optimized**: Cloud-ready with proper Puppeteer configuration

## 📊 Data Extraction

### Race Level Data
- Race ID, course, date, time, title
- Pace forecast, draw bias, specific pace hints
- Going conditions, distance, prize money

### Horse Level Data  
- Horse name, jockey, trainer, weight
- Timeform rating, comments, betting forecast odds
- Pacemap data (EPF positions with confidence levels)
- Up to 6 past performances with 18+ fields each

### Past Performance Fields
- Date, track, result, beaten by distance
- Official rating, distance, going, equipment
- Jockey, ISP, BSP, IP Hi/Lo, finishing speed
- Timeform figure, Timeform rating, adjustments

## 🎯 Intelligent Matching

- **Race Matching**: Flexible course name variations and time format conversion
- **Horse Matching**: Exact and fuzzy matching with reverse lookup fallback
- **Error Recovery**: Attempts multiple matching strategies before failing

## ⚡ Performance Features

- **Reverse Lookup**: Finds horses in wrong time slots (e.g., Newmarket time confusion)
- **Batch Processing**: Efficient database operations with upsert logic
- **Memory Optimization**: Proper cleanup and resource management
- **Comprehensive Logging**: Detailed error reporting for database verification

## 🛠️ Setup

### Environment Variables

```bash
TIMEFORM_EMAIL=your_timeform_email
TIMEFORM_PASSWORD=your_timeform_password
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_supabase_service_key
NODE_ENV=production
```

### Installation

```bash
npm install
```

### Run

```bash
npm start
```

## 🗂️ Database Schema

Updates the `timeform` table with complete race and horse data including:
- Race metadata and conditions
- Horse details and ratings  
- Pacemap positioning data
- Historical performance records

## 📈 Typical Performance

- **Processing**: ~130-500 horses per run
- **Success Rate**: 85-95% successful matches
- **Execution Time**: 2-3 minutes for full scrape
- **Error Rate**: 5-15% (mostly non-runners or timing issues)

## 🔧 Production Notes

- Always scrapes **tomorrow's racecards** (day after execution)
- Handles Timeform navigation automatically
- Filters to GB & IRE races only
- Includes comprehensive error diagnostics
- Ready for automated scheduling

## 📊 Example Output

```
🎯 Target date: Sun Jun 22 2025 (Tomorrow's races)
🔄 Looking for Tomorrow button...
✅ Successfully clicked Tomorrow button
✅ Found 19 tomorrow's race URLs for GB & IRE

🎊 Supabase upload completed!
✅ Successfully inserted: 132 records
❌ Errors: 0 records

🎊 Production Timeform Scraper completed successfully!
⏱️  Total execution time: 132 seconds
```

## 🚨 Error Handling

The scraper provides detailed error logging for missing horses:
- Shows exact horse names and race details
- Lists database vs Timeform runner counts
- Attempts reverse lookup for timing mismatches
- Provides data for manual database verification

---

**Built for OddsVantage** - Real-time betting intelligence platform  
**Last Updated**: June 2025  
**Version**: 1.0.0 