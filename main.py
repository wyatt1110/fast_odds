#!/usr/bin/env python3
"""
Fast Odds API - WIN Odds Only
Returns exactly 1 entry per horse per race
"""

import asyncio
import httpx
import logging
from datetime import datetime, timezone
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Fast WIN Odds API", version="2.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global storage
odds_data = {
    "bet365": [],
    "william_hill": [],
    "last_updated": None,
    "update_count": 0
}

updating = False

def is_racing_hours() -> bool:
    """Check if it's UK racing time (7AM-9PM UTC)"""
    try:
        uk_time = datetime.now(timezone.utc)
        current_hour = uk_time.hour
        is_racing_time = 7 <= current_hour <= 21
        
        if not is_racing_time:
            logger.info(f"🛌 Outside racing hours (7AM-9PM UTC). Current time: {uk_time.strftime('%H:%M')} - Sleeping...")
        
        return is_racing_time
    except Exception as e:
        logger.error(f"❌ Time check failed: {e} - Defaulting to racing hours")
        return True  # Default to always racing in case of timezone issues

async def fetch_bet365():
    """Fetch Bet365 WIN odds - 1 entry per horse"""
    try:
        url = "http://116.202.109.99/v2/bet365/sports/horse-racing/races"
        headers = {
            "accept": "*/*",
            "x-rapidapi-proxy-secret": "84cc5f87-13fa-4333-b8ba-1b92674f41d7"
        }
        
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                races = data.get("races", [])
                
                formatted = []
                for race in races:
                    race_name = race.get("league", "Unknown")
                    race_num = race.get("raceNum", "")
                    if race_num:
                        race_name = f"Race {race_num} - {race_name}"
                    
                    for horse in race.get("horses", []):
                        name = horse.get("na", "")
                        odds = horse.get("OD", "")
                        
                        if name and odds and odds != "SP":
                            try:
                                # Convert fractional odds to decimal
                                if "/" in str(odds):
                                    parts = str(odds).split("/")
                                    if len(parts) == 2:
                                        numerator, denominator = parts
                                        decimal_odds = (float(numerator) / float(denominator)) + 1
                                    else:
                                        continue
                                else:
                                    decimal_odds = float(odds)
                                
                                formatted.append({
                                    "horse": name,
                                    "race": race_name,
                                    "odds": decimal_odds,
                                    "bookmaker": "bet365"
                                })
                            except Exception as e:
                                pass
                
                logger.info(f"✅ Bet365: {len(formatted)} horses")
                if len(formatted) == 0:
                    logger.error(f"🚨 BET365 DEBUG: {len(races)} races found but 0 horses parsed!")
                    if races:
                        sample_race = races[0]
                        sample_horses = sample_race.get("horses", [])
                        logger.error(f"🚨 Sample race has {len(sample_horses)} horses")
                        if sample_horses:
                            sample_horse = sample_horses[0]
                            logger.error(f"🚨 Sample horse: {sample_horse}")
                return formatted
            else:
                logger.error(f"❌ Bet365 error: {response.status_code}")
                return []
    except Exception as e:
        logger.error(f"❌ Bet365 fetch failed: {e}")
        return []

async def fetch_william_hill():
    """Fetch William Hill WIN odds - 1 entry per horse (deduplicated)"""
    try:
        url = "http://116.202.109.99/willhill/horse-racing/races"
        headers = {
            "x-rapidapi-proxy-secret": "84cc5f87-13fa-4333-b8ba-1b92674f41d7"
        }
        
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                races = data.get("races", [])
                active_races = [r for r in races if not r.get("settled", False)]
                
                # Deduplicate horses by race + name
                unique_horses = {}
                
                for race in active_races:
                    race_name = race.get("name", "Unknown")
                    
                    for horse in race.get("horses", []):
                        if not horse.get("active", True):
                            continue
                        
                        name = horse.get("name", "")
                        if not name:
                            continue
                            
                        horse_key = f"{race_name}|{name}"
                        
                        # Skip duplicates
                        if horse_key in unique_horses:
                            continue
                            
                        ew_data = horse.get("EW", {})
                        if isinstance(ew_data, dict):
                            odds = ew_data.get("decimal") or ew_data.get("fractional")
                            if odds:
                                try:
                                    unique_horses[horse_key] = {
                                        "horse": name,
                                        "race": race_name,
                                        "odds": float(odds),
                                        "bookmaker": "william_hill"
                                    }
                                except:
                                    pass
                
                formatted = list(unique_horses.values())
                logger.info(f"✅ William Hill: {len(formatted)} horses")
                if len(formatted) > 1000:
                    raw_total = sum(len(r.get("horses", [])) for r in active_races)
                    logger.error(f"🚨 WILLIAM HILL DEBUG: Deduplication failed! Raw: {raw_total}, After: {len(formatted)}")
                    logger.error(f"🚨 Sample keys: {list(unique_horses.keys())[:5]}")
                return formatted
            else:
                logger.error(f"❌ William Hill error: {response.status_code}")
                return []
    except Exception as e:
        logger.error(f"❌ William Hill fetch failed: {e}")
        return []

async def update_odds():
    """Update odds from both APIs"""
    global odds_data
    
    bet365_odds, william_hill_odds = await asyncio.gather(
        fetch_bet365(),
        fetch_william_hill()
    )
    
    odds_data.update({
        "bet365": bet365_odds,
        "william_hill": william_hill_odds,
        "last_updated": datetime.now().isoformat(),
        "update_count": odds_data["update_count"] + 1
    })
    
    total = len(bet365_odds) + len(william_hill_odds)
    logger.info(f"🔄 Update #{odds_data['update_count']}: {total} total WIN odds")

async def odds_updater():
    """Background task - updates every 5 seconds during racing hours"""
    global updating
    updating = True
    
    logger.info("🚀 Starting WIN odds updater (7AM-9PM UTC)...")
    
    while updating:
        try:
            if is_racing_hours():
                await update_odds()
                await asyncio.sleep(5)
            else:
                await asyncio.sleep(300)  # 5 minutes outside racing hours
        except Exception as e:
            logger.error(f"❌ Updater error: {e}")
            await asyncio.sleep(5)

@app.on_event("startup")
async def startup():
    """Start background updater"""
    await update_odds()
    asyncio.create_task(odds_updater())
    logger.info("✅ Fast WIN Odds API started!")

@app.on_event("shutdown") 
async def shutdown():
    """Stop updater"""
    global updating
    updating = False

@app.get("/")
async def root():
    """API status"""
    uk_time = datetime.now(timezone.utc)
    racing_active = is_racing_hours()
    
    return {
        "service": "Fast WIN Odds API",
        "status": "running" if racing_active else "sleeping",
        "racing_hours": "07:00-21:00 UTC",
        "current_time_utc": uk_time.strftime("%H:%M"),
        "total_horses": len(odds_data["bet365"]) + len(odds_data["william_hill"]),
        "bet365_horses": len(odds_data["bet365"]),
        "william_hill_horses": len(odds_data["william_hill"]),
        "last_updated": odds_data["last_updated"],
        "update_count": odds_data["update_count"]
    }

@app.get("/odds")
async def get_all_odds():
    """Get all WIN odds from both bookmakers"""
    all_odds = odds_data["bet365"] + odds_data["william_hill"]
    return {
        "horses": all_odds,
        "total": len(all_odds),
        "bet365_count": len(odds_data["bet365"]),
        "william_hill_count": len(odds_data["william_hill"]),
        "last_updated": odds_data["last_updated"]
    }

@app.get("/bet365")
async def get_bet365():
    """Get Bet365 WIN odds only"""
    return {
        "horses": odds_data["bet365"],
        "count": len(odds_data["bet365"]),
        "last_updated": odds_data["last_updated"]
    }

@app.get("/william-hill")
async def get_william_hill():
    """Get William Hill WIN odds only"""
    return {
        "horses": odds_data["william_hill"],
        "count": len(odds_data["william_hill"]),
        "last_updated": odds_data["last_updated"]
    }

@app.get("/horse/{horse_name}")
async def find_horse(horse_name: str):
    """Find a specific horse across both bookmakers"""
    all_odds = odds_data["bet365"] + odds_data["william_hill"]
    matching = [horse for horse in all_odds if horse_name.lower() in horse["horse"].lower()]
    
    return {
        "query": horse_name,
        "matches": matching,
        "count": len(matching)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 