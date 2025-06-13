import asyncio
import httpx

async def test_bet365():
    print("Testing Bet365...")
    url = "http://116.202.109.99/v2/bet365/sports/horse-racing/races"
    headers = {"x-rapidapi-proxy-secret": "84cc5f87-13fa-4333-b8ba-1b92674f41d7"}
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers)
        data = resp.json()
        races = data.get("races", [])
        
        count = 0
        for race in races:
            for horse in race.get("horses", []):
                name = horse.get("na", "")
                odds = horse.get("OD", "")
                if name and odds and odds != "SP":
                    try:
                        if "/" in str(odds):
                            parts = str(odds).split("/")
                            if len(parts) == 2:
                                num, den = parts
                                decimal = (float(num) / float(den)) + 1
                                count += 1
                                if count <= 3:
                                    print(f"  {name}: {odds} -> {decimal}")
                        else:
                            count += 1
                    except Exception as e:
                        print(f"  Error parsing {name} {odds}: {e}")
                        
        print(f"✅ Bet365: {count} horses processed")

async def test_william_hill():
    print("\nTesting William Hill...")
    url = "http://116.202.109.99/willhill/horse-racing/races"
    headers = {"x-rapidapi-proxy-secret": "84cc5f87-13fa-4333-b8ba-1b92674f41d7"}
    
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers=headers)
        data = resp.json()
        races = data.get("races", [])
        active_races = [r for r in races if not r.get("settled", False)]
        
        # Count raw horses
        raw_count = sum(len(r.get("horses", [])) for r in active_races)
        print(f"  Raw horses: {raw_count}")
        
        # Test deduplication
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
                if horse_key in unique_horses:
                    continue
                    
                ew_data = horse.get("EW", {})
                if isinstance(ew_data, dict):
                    odds = ew_data.get("decimal") or ew_data.get("fractional")
                    if odds:
                        try:
                            unique_horses[horse_key] = float(odds)
                        except:
                            pass
        
        print(f"✅ William Hill: {len(unique_horses)} horses after deduplication")

async def main():
    await test_bet365()
    await test_william_hill()

if __name__ == "__main__":
    asyncio.run(main()) 