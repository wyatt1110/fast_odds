# Free Racing Data Tool - Complete Documentation

## Overview
This is a comprehensive data search tool built for the horse racing section that allows users to search for horses, jockeys, trainers, owners, sires, dams, and damsires with detailed statistics and analysis.

## Main Components Created

### 1. Main Page Component
**File**: `src/app/horse-racing/data/page.tsx` (1539 lines)
**Backup**: `src/app/horse-racing/data/page.tsx.CHAT_BACKUP`

**Features**:
- Toggle selection for 7 search types (horse, jockey, trainer, owner, sire, dam, damsire)
- Search interface with professional UI
- Dual search approach: Supabase first, then Racing API
- Detailed data display with statistics tables
- Modern styling with blue/gray theme

### 2. API Endpoint for Horse Search
**File**: `src/app/api/racing/horses/search/route.ts`

**Purpose**: Searches Supabase database for existing horses
**Method**: POST
**Request Body**: `{ name: string }`
**Response**: Array of horses with horse_id and horse_name

## API Integration Details

### Racing API Credentials
- **Username**: KQ9W7rQeAHWMUgxH93ie3yEc
- **Password**: T5BoPivL3Q2h6RhCdLv4EwZu

### Search Flow
1. **User Input**: Search query for any entity type
2. **Supabase Search**: First check local database for existing entities
3. **Racing API Search**: Get comprehensive results from external API
4. **Merge Results**: Combine and deduplicate results
5. **Detailed Data**: Fetch comprehensive analysis on selection

## Entity-Specific API Endpoints

### Horse Search & Analysis
**Search Endpoint**: `/horses/search?name={query}`
**Data Points Retrieved**:
- Basic horse info (id, name, age, sex, color)
- Pro card data: `/horses/{id}/pro`
  - Date of birth, sex, color, breeder
  - Sire, dam, damsire information
- Distance/Times Analysis: `/horses/{id}/analysis/distance-times`
  - Performance by distance (runs, wins, places)
  - Lifetime statistics (total runs, wins, profit/loss)
  - Win rates and percentages
- Recent race results (last 3 months)

### Jockey Search & Analysis
**Search Endpoint**: `/jockeys/search?name={query}`
**Analysis Endpoints**:
- `/jockeys/{id}/analysis/courses` - Performance by racecourse
- `/jockeys/{id}/analysis/distances` - Performance by distance
- `/jockeys/{id}/analysis/trainers` - Partnership with trainers
- `/jockeys/{id}/analysis/owners` - Performance for different owners
- `/jockeys/{id}/results` - Recent race results

**Data Points**:
- Career summary (total rides, wins, win percentage)
- Course-specific statistics
- Trainer partnerships
- Recent form (last 3 months)
- Profit/loss calculations

### Trainer Search & Analysis
**Search Endpoint**: `/trainers/search?name={query}`
**Analysis Endpoints**:
- `/trainers/{id}/analysis/courses` - Performance by racecourse
- `/trainers/{id}/analysis/distances` - Performance by distance
- `/trainers/{id}/analysis/jockeys` - Partnership with jockeys
- `/trainers/{id}/analysis/owners` - Performance for different owners

**Data Points**:
- Career statistics (runners, wins, win percentage)
- Course and distance analysis
- Jockey partnerships
- Owner statistics
- Recent form and performance trends

### Owner Search & Analysis
**Search Endpoint**: `/owners/search?name={query}`
**Analysis Endpoints**:
- `/owners/{id}/analysis/courses` - Performance by racecourse
- `/owners/{id}/analysis/distances` - Performance by distance
- `/owners/{id}/analysis/trainers` - Trainer partnerships
- `/owners/{id}/analysis/jockeys` - Jockey partnerships

### Breeding Entity Search (Sire, Dam, Damsire)
**Search Endpoints**: 
- `/sires/search?name={query}`
- `/dams/search?name={query}`
- `/damsires/search?name={query}`

**Note**: These entities typically don't exist in Supabase, so they search directly via Racing API.

## Key Functions

### Search Functions
- `searchHorse()` - Dual search for horses
- `searchJockey()` - Entity search for jockeys
- `searchTrainer()` - Entity search for trainers
- `searchOwner()` - Entity search for owners
- `searchBreedingEntity()` - API-only search for breeding entities

### Detail Functions
- `getHorseDetails()` - Comprehensive horse analysis
- `getJockeyDetails()` - Complete jockey statistics
- `getTrainerDetails()` - Full trainer analysis
- `getOwnerDetails()` - Owner performance data
- `getBreedingDetails()` - Breeding entity information

### Utility Functions
- `formatOdds()` - Convert odds formats
- `getPlaceholderText()` - Dynamic search placeholders

## Data Processing

### Horse Data Structure
```typescript
{
  basic_info: { id, name, age, sex, color },
  pro_card: { dob, breeder, sire, dam, damsire },
  distance_analysis: { 
    distances: [{ distance, runs, wins, places, profit_loss }],
    total_runs, total_wins, total_places 
  },
  recent_races: [{ race_info, position, sp }],
  lifetime_stats: { total_runs, total_wins, win_percentage, profit_loss }
}
```

### Jockey Data Structure
```typescript
{
  basic_info: { id, name },
  courses: [{ course, rides, wins, win_percentage, profit_loss }],
  distances: [{ distance, rides, wins, statistics }],
  trainers: [{ trainer, partnership_stats }],
  owners: [{ owner, performance_stats }],
  career_summary: { total_rides, total_wins, win_percentage },
  recent_form: { rides, wins, recent_statistics }
}
```

## UI Components

### Search Type Toggle
- 7 buttons for different search types
- Active state styling with blue theme
- Icons for each entity type (Zap, User, Trophy)

### Search Interface
- Single search input
- Dynamic placeholder text based on selected type
- Loading states and error handling

### Results Display
- Card-based layout for search results
- Click to expand detailed analysis
- Professional styling with statistics tables

### Detailed Data Views
- Entity-specific data presentation
- Performance statistics tables
- Career summaries and recent form
- Profit/loss calculations

## Installation & Setup

### 1. Files to Restore
- Copy `src/app/horse-racing/data/page.tsx.CHAT_BACKUP` to `src/app/horse-racing/data/page.tsx`
- Ensure `src/app/api/racing/horses/search/route.ts` exists

### 2. Dependencies
- All dependencies already exist in the project
- Uses existing Layout, Supabase client, and Racing API proxy

### 3. Navigation
- Accessible via `/horse-racing/data`
- Back button links to `/horse-racing`

## API Rate Limiting Strategy
- **Supabase First**: Check local database to minimize API calls
- **Racing API Second**: Only call external API when needed
- **Deduplicate Results**: Avoid duplicate API calls for same entities

## Error Handling
- Try/catch blocks for all API calls
- Graceful fallbacks when data unavailable
- Console logging for debugging
- User-friendly error messages

## Testing Completed
- Horse search with multiple result handling
- Jockey analysis with career statistics
- Trainer partnerships and performance data
- Owner statistics and recent form
- API endpoint testing and data structure validation
- UI responsiveness and professional styling

## Key Features
1. **Comprehensive Search**: All major racing entities
2. **Dual Data Sources**: Supabase + Racing API
3. **Rich Analytics**: Detailed performance statistics
4. **Professional UI**: Modern, clean design
5. **Efficient API Usage**: Minimized external calls
6. **Responsive Design**: Works on all screen sizes
7. **Real-time Data**: Live Racing API integration

This tool provides a complete racing data search solution with professional presentation and comprehensive statistics for all major racing entities. 