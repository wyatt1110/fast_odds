#!/usr/bin/env python3
import asyncio
import httpx
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_bet365():
    """Test Bet365 parsing in isolation"""
    try:
        url = "http://116.202.109.99/v2/bet365/sports/horse-racing/races"
        headers = {
            "accept": "*/*",
            "x-rapidapi-proxy-secret": "84cc5f87-13fa-4333-b8ba-1b92674f41d7"
        }
        
        async with httpx.AsyncClient(timeout=10) as client:
            response = await client.get(url, headers=headers)
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                try:
                    data = response.json()
                    races = data.get("races", [])
                    print(f"✅ JSON PARSE SUCCESS: Got {len(races)} races")
                    
                    total_horses = 0
                    for race in races:
                        horses = race.get("horses", [])
                        print(f"Race: {race.get('league', 'Unknown')} - {len(horses)} horses")
                        for horse in horses:
                            name = horse.get("na", "")
                            odds = horse.get("OD", "")
                            if name and odds and odds != "SP":
                                total_horses += 1
                    
                    print(f"🎯 TOTAL PARSEABLE HORSES: {total_horses}")
                    
                except Exception as json_error:
                    print(f"❌ JSON PARSE FAILED: {json_error}")
                    print(f"Raw response: {response.text[:200]}...")
                    
            else:
                print(f"❌ HTTP Error: {response.status_code}")
                
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_bet365()) 