#!/usr/bin/env python3
import asyncio
import httpx
import json
from datetime import datetime

async def fetch_and_compare():
    """Fetch both APIs and compare race structures"""
    
    # API configurations
    bet365_url = "http://116.202.109.99/v2/bet365/sports/horse-racing/races"
    william_hill_url = "http://116.202.109.99/willhill/horse-racing/races"
    headers = {"x-rapidapi-proxy-secret": "84cc5f87-13fa-4333-b8ba-1b92674f41d7"}
    
    async with httpx.AsyncClient(timeout=15) as client:
        # Fetch both APIs
        print("🔍 Fetching Bet365...")
        bet365_response = await client.get(bet365_url, headers=headers)
        
        print("🔍 Fetching William Hill...")
        william_hill_response = await client.get(william_hill_url, headers=headers)
        
        # Parse responses
        bet365_data = bet365_response.json() if bet365_response.status_code == 200 else {}
        william_hill_data = william_hill_response.json() if william_hill_response.status_code == 200 else {}
        
        # Save raw responses
        timestamp = datetime.now().strftime("%H%M%S")
        
        with open(f"bet365_raw_{timestamp}.json", "w") as f:
            json.dump(bet365_data, f, indent=2)
        
        with open(f"william_hill_raw_{timestamp}.json", "w") as f:
            json.dump(william_hill_data, f, indent=2)
        
        # Analyze Bet365
        bet365_races = bet365_data.get("races", [])
        bet365_total_horses = sum(len(race.get("horses", [])) for race in bet365_races)
        
        print(f"\n📊 BET365 ANALYSIS:")
        print(f"   Status: {bet365_response.status_code}")
        print(f"   Total races: {len(bet365_races)}")
        print(f"   Total horses: {bet365_total_horses}")
        print(f"   Avg horses per race: {bet365_total_horses/len(bet365_races) if bet365_races else 0:.1f}")
        
        # Show first few race names
        print(f"   First 5 races:")
        for i, race in enumerate(bet365_races[:5]):
            race_name = race.get("league", "Unknown")
            race_num = race.get("raceNum", "")
            horse_count = len(race.get("horses", []))
            print(f"     {i+1}. Race {race_num} - {race_name} ({horse_count} horses)")
        
        # Analyze William Hill
        william_hill_races = william_hill_data.get("races", [])
        william_hill_total_horses = 0
        william_hill_active_races = 0
        
        for race in william_hill_races:
            if not race.get("settled", False):  # Only active races
                william_hill_active_races += 1
                for horse in race.get("horses", []):
                    if horse.get("active", True):
                        william_hill_total_horses += 1
        
        print(f"\n📊 WILLIAM HILL ANALYSIS:")
        print(f"   Status: {william_hill_response.status_code}")
        print(f"   Total races: {len(william_hill_races)}")
        print(f"   Active races: {william_hill_active_races}")
        print(f"   Total active horses: {william_hill_total_horses}")
        print(f"   Avg horses per active race: {william_hill_total_horses/william_hill_active_races if william_hill_active_races else 0:.1f}")
        
        # Show first few race names
        print(f"   First 5 active races:")
        count = 0
        for race in william_hill_races:
            if not race.get("settled", False) and count < 5:
                race_name = race.get("name", "Unknown")
                active_horses = sum(1 for h in race.get("horses", []) if h.get("active", True))
                print(f"     {count+1}. {race_name} ({active_horses} horses)")
                count += 1
        
        # Compare race coverage
        print(f"\n🔍 COMPARISON:")
        print(f"   Bet365: {len(bet365_races)} races, {bet365_total_horses} horses")
        print(f"   William Hill: {william_hill_active_races} active races, {william_hill_total_horses} horses")
        print(f"   Horse count difference: {william_hill_total_horses - bet365_total_horses}")
        print(f"   Race count difference: {william_hill_active_races - len(bet365_races)}")
        
        # Look for common race names
        bet365_race_names = set()
        for race in bet365_races:
            name = race.get("league", "").lower()
            if name:
                bet365_race_names.add(name)
        
        william_hill_race_names = set()
        for race in william_hill_races:
            if not race.get("settled", False):
                name = race.get("name", "").lower()
                if name:
                    william_hill_race_names.add(name)
        
        common_names = bet365_race_names.intersection(william_hill_race_names)
        print(f"\n🎯 RACE NAME OVERLAP:")
        print(f"   Bet365 unique race names: {len(bet365_race_names)}")
        print(f"   William Hill unique race names: {len(william_hill_race_names)}")
        print(f"   Common race names: {len(common_names)}")
        
        if common_names:
            print(f"   Sample common races: {list(common_names)[:3]}")
        
        print(f"\n📁 Raw data saved to:")
        print(f"   bet365_raw_{timestamp}.json")
        print(f"   william_hill_raw_{timestamp}.json")

if __name__ == "__main__":
    asyncio.run(fetch_and_compare()) 