const puppeteer = require('puppeteer');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

class SmarterSigScraper {
    constructor() {
        this.browser = null;
        this.page = null;
        this.loginUrl = 'http://www.smartersig.com/home.php';
        this.paceUrl = 'http://www.smartersig.com/showpace.php';
        this.credentials = {
            userid: 'contact.wyattbets@gmail.com',
            password: 'millreef'
        };
        
        // Initialize Supabase client (using same config as timeform scraper)
        this.supabase = createClient(
            config.supabase.url,
            config.supabase.serviceRoleKey
        );
        
        // Use the date format that matches the races in Supabase
        this.todaysDate = '2025-07-03'; // Date that matches the scraped data
        this.matchingStats = {
            totalRaces: 0,
            matchedRaces: 0,
            unmatchedRaces: [],
            totalHorses: 0,
            matchedHorses: 0,
            unmatchedHorses: [],
            insertedRecords: 0,
            errors: []
        };
    }

    async init() {
        console.log('Initializing browser...');
        this.browser = await puppeteer.launch({ 
            headless: true, // Run in headless mode so browser isn't visible
            defaultViewport: null,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        this.page = await this.browser.newPage();
        
        // Set user agent to avoid detection
        await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    }

    async login() {
        console.log('Navigating to login page...');
        await this.page.goto(this.loginUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        
        // Wait for login form to be visible
        await this.page.waitForSelector('input[name="userid"]', { timeout: 15000 });
        
        console.log('Filling login credentials...');
        await this.page.type('input[name="userid"]', this.credentials.userid);
        await this.page.type('input[name="password"]', this.credentials.password);
        
        // Click login button and wait for navigation
        console.log('Submitting login form...');
        await Promise.all([
            this.page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
            this.page.click('input[type="SUBMIT"][value="Login"]')
        ]);
        
        console.log('Login completed');
        
        // Add a small delay to ensure page is fully loaded
        await new Promise(resolve => setTimeout(resolve, 2000));
    }

    async scrapePaceData() {
        console.log('Navigating to race pace page...');
        await this.page.goto(this.paceUrl, { waitUntil: 'networkidle2', timeout: 60000 });
        
        // Add a delay to ensure page loads fully
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check if we're still logged in by looking for the data
        const hasData = await this.page.$('table[border="1"]');
        if (!hasData) {
            // Take a screenshot for debugging
            await this.page.screenshot({ path: 'debug-pace-page.png' });
            throw new Error('Not logged in or no data available on pace page');
        }

        console.log('Scraping race pace data...');
        
        const raceData = await this.page.evaluate(() => {
            const races = [];
            const tables = document.querySelectorAll('table[border="1"]');
            
            tables.forEach(table => {
                const caption = table.querySelector('caption');
                if (!caption) return;
                
                const raceInfo = caption.textContent.trim();
                const horses = [];
                let raceAverage = null;
                
                const rows = table.querySelectorAll('tbody tr');
                
                rows.forEach(row => {
                    const cells = row.querySelectorAll('td');
                    
                    // Check if this is the race average row
                    if (cells.length === 1 && cells[0].getAttribute('colspan') === '3') {
                        const avgText = cells[0].textContent.trim();
                        const avgMatch = avgText.match(/Race Average ([\d.]+)/);
                        if (avgMatch) {
                            raceAverage = parseFloat(avgMatch[1]);
                        }
                        return;
                    }
                    
                    // Skip header rows and rows without 3 cells
                    if (cells.length !== 3) return;
                    if (cells[0].tagName === 'TH') return;
                    
                    const horseName = cells[0].textContent.trim();
                    const draw = parseInt(cells[1].textContent.trim());
                    const paceCell = cells[2];
                    
                    // Get background color
                    const bgColor = paceCell.getAttribute('bgcolor') || '#ffffff';
                    
                                         // Parse pace figure and last time out
                     const paceText = paceCell.textContent.trim();
                     const fontElement = paceCell.querySelector('font');
                     
                     let currentPaceFig = '?';
                     let lastTimeOutPaceFig = '?';
                     
                     if (fontElement) {
                         // Extract current pace figure (before the font tag)
                         const cellHTML = paceCell.innerHTML;
                         const beforeFontMatch = cellHTML.match(/^([^<]+)/);
                         if (beforeFontMatch) {
                             currentPaceFig = beforeFontMatch[1].trim();
                         }
                         
                         // Extract last time out pace figure (inside font tag in brackets)
                         const fontText = fontElement.textContent.trim();
                         // Handle multiline brackets like (1.8\n)
                         const lastMatch = fontText.match(/\(([\d.?]+)/);
                         if (lastMatch) {
                             lastTimeOutPaceFig = lastMatch[1];
                         }
                     } else {
                         // Fallback parsing if no font tag
                         const match = paceText.match(/([\d.?]+)\s*\(([\d.?]+)\)/);
                         if (match) {
                             currentPaceFig = match[1];
                             lastTimeOutPaceFig = match[2];
                         }
                     }
                    
                                         
                     // Determine pace style number based on background color
                     let paceStyleNumber = 0;
                     switch (bgColor.toLowerCase()) {
                         case '#f83838':
                             paceStyleNumber = 1; // red - front runner
                             break;
                         case '#feafaf':
                             paceStyleNumber = 2; // pink - press pace
                             break;
                         case '#fae2e2':
                             paceStyleNumber = 3; // cream - mid division
                             break;
                         case '#cfd0f1':
                             paceStyleNumber = 4; // purple - hold back
                             break;
                         default:
                             paceStyleNumber = 0; // white or unknown - no data
                             break;
                     }
                     
                     horses.push({
                         horseName,
                         draw,
                         paceFigure: currentPaceFig,
                         paceFigureLastTimeOut: lastTimeOutPaceFig,
                         colour: bgColor,
                         paceStyle: paceStyleNumber
                     });
                });
                
                                 if (horses.length > 0) {
                     races.push({
                         raceInfo,
                         totalRaceFigure: raceAverage,
                         horses
                     });
                 }
            });
            
            return races;
        });

        return raceData;
    }

    async saveData(data) {
        const timestamp = new Date().toISOString().split('T')[0];
        const filename = `smartersig-pace-data-${timestamp}.json`;
        
        const output = {
            scrapeDate: new Date().toISOString(),
            totalRaces: data.length,
            totalHorses: data.reduce((sum, race) => sum + race.horses.length, 0),
            races: data
        };
        
        fs.writeFileSync(filename, JSON.stringify(output, null, 2));
        console.log(`Data saved to ${filename}`);
        
        return { dataFile: filename };
    }

    cleanCourseName(courseName) {
        // Remove everything in brackets and trim
        return courseName.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
    }
    
    timeToMinutes(timeStr) {
        if (!timeStr) return null;
        
        // Handle various time formats
        let hours = 0;
        let minutes = 0;
        
        // Format: "HH:MM" or "H:MM"
        if (timeStr.includes(':')) {
            const [h, m] = timeStr.split(':');
            hours = parseInt(h);
            minutes = parseInt(m);
        } 
        // Format: "H.MM"
        else if (timeStr.includes('.')) {
            const [h, m] = timeStr.split('.');
            hours = parseInt(h);
            minutes = parseInt(m);
        }
        // Just a number (assume hours)
        else {
            hours = parseInt(timeStr);
        }
        
        if (isNaN(hours) || isNaN(minutes)) return null;
        
        return hours * 60 + minutes;
    }

    parseRaceInfo(raceInfo) {
        // Parse "Newbury 18:05 5f 34y" format
        const parts = raceInfo.split(' ');
        if (parts.length < 2) return null;
        
        const course = parts[0].toLowerCase();
        const time24h = parts[1]; // In 24-hour HH:MM format
        
        // Convert 24-hour time to 12-hour format without leading zeros (e.g., 18:05 -> 6:05)
        let time = time24h;
        if (time24h.includes(':')) {
            const [hours, minutes] = time24h.split(':');
            const hour12 = parseInt(hours) > 12 ? parseInt(hours) - 12 : parseInt(hours);
            time = `${hour12}:${minutes}`;
        }
        
        return { course, time };
    }

    async matchRaceInSupabase(raceInfo) {
        const parsed = this.parseRaceInfo(raceInfo);
        if (!parsed) {
            console.log(`❌ Could not parse race info: ${raceInfo}`);
            return null;
        }

        try {
            // Query races table for today's date with all columns to determine structure
            const { data: races, error } = await this.supabase
                .from('races')
                .select('*')
                .eq('race_date', this.todaysDate);

            if (error) {
                console.log(`❌ Error querying races: ${error.message}`);
                this.matchingStats.errors.push(`Race query error: ${error.message}`);
                return null;
            }

            // Find matching race
            const matchedRace = races.find(race => {
                const cleanSupabaseCourse = this.cleanCourseName(race.course);
                const courseMatch = cleanSupabaseCourse === parsed.course;
                
                // Extract time from off_time (could be various formats)
                let timeMatch = false;
                if (race.off_time) {
                    const timeStr = race.off_time.includes(':') ? 
                        race.off_time.split(' ')[0] : // If it has date, take time part
                        race.off_time;
                    timeMatch = timeStr === parsed.time;
                }

                return courseMatch && timeMatch;
            });

            if (matchedRace) {
                // Use race_id as the primary key since that's what the table uses
                const primaryKeyValue = matchedRace.race_id;
                console.log(`✅ Matched race: ${raceInfo} -> Race ID: ${primaryKeyValue}`);
                // Ensure we have a standard id property for consistent access
                return {
                    ...matchedRace,
                    id: primaryKeyValue
                };
            } else {
                console.log(`❌ No match found for race: ${raceInfo}`);
                console.log(`   Looking for: Course='${parsed.course}', Time='${parsed.time}', Date='${this.todaysDate}'`);
                this.matchingStats.unmatchedRaces.push(raceInfo);
                return null;
            }

        } catch (error) {
            console.log(`❌ Error matching race ${raceInfo}: ${error.message}`);
            this.matchingStats.errors.push(`Race matching error for ${raceInfo}: ${error.message}`);
            return null;
        }
    }

    async matchHorsesInSupabase(raceId, race) {
        try {
            // Get all runners for this race
            const { data: runners, error } = await this.supabase
                .from('runners')
                .select('id, horse_id, horse_name')
                .eq('race_id', raceId);

            if (error) {
                console.log(`❌ Error querying runners for race ${raceId}: ${error.message}`);
                this.matchingStats.errors.push(`Runners query error for race ${raceId}: ${error.message}`);
                return [];
            }

            const matchedHorses = [];
            const raceAverage = race.totalRaceFigure;
            
            race.horses.forEach(horse => {
                // Try exact match first
                let matchedRunner = runners.find(runner => 
                    runner.horse_name.toLowerCase() === horse.horseName.toLowerCase()
                );

                // If no exact match, try partial match (remove common suffixes/prefixes)
                if (!matchedRunner) {
                    const cleanHorseName = horse.horseName.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
                    matchedRunner = runners.find(runner => {
                        const cleanRunnerName = runner.horse_name.replace(/\s*\([^)]*\)/g, '').trim().toLowerCase();
                        return cleanRunnerName === cleanHorseName;
                    });
                }

                if (matchedRunner) {
                    console.log(`✅ Matched horse: ${horse.horseName} -> Runner ID: ${matchedRunner.id}`);
                    matchedHorses.push({
                        ...horse,
                        raceId: raceId,
                        horseId: matchedRunner.id,
                        raceAverage: raceAverage
                    });
                    this.matchingStats.matchedHorses++;
                } else {
                    console.log(`❌ No match found for horse: ${horse.horseName} in race ${raceId}`);
                    this.matchingStats.unmatchedHorses.push({
                        horseName: horse.horseName,
                        raceId: raceId
                    });
                }
                this.matchingStats.totalHorses++;
            });

            return matchedHorses;

        } catch (error) {
            console.log(`❌ Error matching horses for race ${raceId}: ${error.message}`);
            this.matchingStats.errors.push(`Horse matching error for race ${raceId}: ${error.message}`);
            return [];
        }
    }

    async insertPaceFigs(matchedHorses) {
        if (matchedHorses.length === 0) {
            console.log(`⚠️ No matched horses to insert`);
            return;
        }

        try {
            // Prepare data for insertion
            const insertData = matchedHorses.map(horse => ({
                race_id: horse.raceId, // Keep race_id exactly as is (including "rac_" prefix)
                horse_id: horse.horseId, // Keep horse_id exactly as is
                horse_name: horse.horseName,
                draw: horse.draw,
                pace_figure: horse.paceFigure,
                pace_figure_lto: horse.paceFigureLastTimeOut,
                pace_style: horse.paceStyle,
                race_average: horse.raceAverage
            }));
            
            // Track how many records were inserted vs skipped
            let inserted = 0;
            let skipped = 0;
            
            // Process each horse individually to check for duplicates
            for (const horse of insertData) {
                // Check if this horse already exists in the pace_figs table
                const { data: existingData, error: checkError } = await this.supabase
                    .from('pace_figs')
                    .select('*')
                    .eq('race_id', horse.race_id)
                    .eq('horse_id', horse.horse_id)
                    .limit(1);
                
                if (checkError) {
                    console.log(`❌ Error checking for existing record: ${checkError.message}`);
                    this.matchingStats.errors.push(`Check error for ${horse.horse_name}: ${checkError.message}`);
                    continue;
                }
                
                // If record doesn't exist, insert it
                if (existingData.length === 0) {
                    const { error: insertError } = await this.supabase
                        .from('pace_figs')
                        .insert([horse]);
                    
                    if (insertError) {
                        console.log(`❌ Error inserting pace figure for ${horse.horse_name}: ${insertError.message}`);
                        this.matchingStats.errors.push(`Insert error for ${horse.horse_name}: ${insertError.message}`);
                    } else {
                        inserted++;
                    }
                } else {
                    skipped++;
                }
            }

            this.matchingStats.insertedRecords += inserted;
            console.log(`✅ Successfully inserted ${inserted} pace figure records${skipped > 0 ? ` (skipped ${skipped} duplicates)` : ''}`);

        } catch (error) {
            console.log(`❌ Error during pace figures insertion: ${error.message}`);
            this.matchingStats.errors.push(`Insertion error: ${error.message}`);
        }
    }

    async processRaceData(raceData) {
        console.log(`\n🔄 Processing ${raceData.length} races for Supabase integration...`);
        console.log(`📅 Looking for races on: ${this.todaysDate}`);

        // Debug: List all races in the database for the target date
        let allRacesInDb = [];
        let unmatchedRaces = [];
        let processedRaceIds = new Set(); // Keep track of already matched races
        
        try {
            const { data: allRaces, error } = await this.supabase
                .from('races')
                .select('*')
                .eq('race_date', this.todaysDate);
                
            if (error) {
                console.log(`❌ Error listing races: ${error.message}`);
            } else if (allRaces && allRaces.length > 0) {
                allRacesInDb = allRaces;
                console.log(`\n📋 Found ${allRaces.length} races in database for ${this.todaysDate}:`);
                allRaces.forEach(race => {
                    console.log(`   - ${race.course} ${race.off_time}`);
                });
            } else {
                console.log(`\n⚠️ No races found in database for date: ${this.todaysDate}`);
            }
        } catch (error) {
            console.log(`❌ Error checking races: ${error.message}`);
        }

        // First pass - process races with valid race info
        for (const race of raceData) {
            this.matchingStats.totalRaces++;
            
            // Check if race info is empty or invalid
            if (!race.raceInfo || race.raceInfo.trim() === '') {
                console.log(`\n❌ INVALID RACE INFO: Empty or missing race information`);
                console.log(`Race details: ${JSON.stringify(race)}`);
                unmatchedRaces.push(race); // Add to unmatched races for second pass
                continue;
            }
            
            console.log(`\n--- Processing Race: ${race.raceInfo} ---`);

            // Match race in Supabase
            const matchedRace = await this.matchRaceInSupabase(race.raceInfo);
                
            if (matchedRace) {
                this.matchingStats.matchedRaces++;
                processedRaceIds.add(matchedRace.id); // Track this race as processed
                
                // Match horses in this race
                const matchedHorses = await this.matchHorsesInSupabase(matchedRace.id, race);
                
                // Insert matched horses into pace_figs table
                if (matchedHorses.length > 0) {
                    await this.insertPaceFigs(matchedHorses);
                }
            } else {
                // Race wasn't matched - log more details to help diagnose why
                const parsed = this.parseRaceInfo(race.raceInfo);
                if (parsed) {
                    console.log(`❌ UNMATCHED RACE DETAILS:`);
                    console.log(`   - Race info: ${race.raceInfo}`);
                    console.log(`   - Parsed course: ${parsed.course}`);
                    console.log(`   - Parsed time: ${parsed.time}`);
                    
                    // Try to find similar races in the database
                    console.log(`   - Similar races in database:`);
                    const similarCourses = allRacesInDb.filter(dbRace => 
                        this.cleanCourseName(dbRace.course).includes(parsed.course) || 
                        parsed.course.includes(this.cleanCourseName(dbRace.course))
                    );
                    
                    if (similarCourses.length > 0) {
                        similarCourses.forEach(similar => {
                            console.log(`     * ${similar.course} at ${similar.off_time} (ID: ${similar.id})`);
                        });
                    } else {
                        console.log(`     * No similar courses found`);
                    }
                }
                
                unmatchedRaces.push(race); // Add to unmatched races for second pass
                this.matchingStats.unmatchedRaces.push(race.raceInfo || "INVALID: Empty race info");
            }
        }
        
        // Second pass - try to match unmatched races using context and horse names
        if (unmatchedRaces.length > 0) {
            console.log(`\n🔍 Attempting to match ${unmatchedRaces.length} unmatched races using fallback method...`);
            
            // Get remaining unmatched races in database
            const remainingRaces = allRacesInDb.filter(race => !processedRaceIds.has(race.id));
            console.log(`   - ${remainingRaces.length} unmatched races in database`);
            
            // Convert raceData to an array for easier indexing
            const raceDataArray = raceData.map(race => race);
            
            for (let i = 0; i < unmatchedRaces.length; i++) {
                const unmatchedRace = unmatchedRaces[i];
                console.log(`\n--- Trying to match race with ${unmatchedRace.horses.length} horses ---`);
                
                // Find the index of this race in the original data
                const unmatchedIndex = raceDataArray.findIndex(r => 
                    r === unmatchedRace || 
                    (r.horses && unmatchedRace.horses && 
                     r.horses.length === unmatchedRace.horses.length && 
                     r.horses[0]?.horseName === unmatchedRace.horses[0]?.horseName)
                );
                
                if (unmatchedIndex === -1) {
                    console.log(`❌ Could not find unmatched race in original data`);
                    continue;
                }
                
                // Determine possible courses based on surrounding races
                let possibleCourses = new Set();
                let previousRace = null;
                let nextRace = null;
                
                // Get previous race if it exists
                if (unmatchedIndex > 0) {
                    previousRace = raceDataArray[unmatchedIndex - 1];
                    if (previousRace.raceInfo) {
                        const parsed = this.parseRaceInfo(previousRace.raceInfo);
                        if (parsed && parsed.course) {
                            possibleCourses.add(parsed.course);
                            console.log(`   - Previous race course: ${parsed.course}`);
                        }
                    }
                }
                
                // Get next race if it exists
                if (unmatchedIndex < raceDataArray.length - 1) {
                    nextRace = raceDataArray[unmatchedIndex + 1];
                    if (nextRace.raceInfo) {
                        const parsed = this.parseRaceInfo(nextRace.raceInfo);
                        if (parsed && parsed.course) {
                            possibleCourses.add(parsed.course);
                            console.log(`   - Next race course: ${parsed.course}`);
                        }
                    }
                }
                
                // If previous and next are from the same course, it's highly likely this race is from that course
                let likelyCourse = null;
                if (previousRace && nextRace && previousRace.raceInfo && nextRace.raceInfo) {
                    const prevParsed = this.parseRaceInfo(previousRace.raceInfo);
                    const nextParsed = this.parseRaceInfo(nextRace.raceInfo);
                    
                    if (prevParsed && nextParsed && prevParsed.course === nextParsed.course) {
                        likelyCourse = prevParsed.course;
                        console.log(`   - Likely course: ${likelyCourse} (same course before and after)`);
                    }
                }
                
                // Filter races by possible courses
                let candidateRaces = remainingRaces;
                if (possibleCourses.size > 0) {
                    candidateRaces = remainingRaces.filter(race => {
                        const cleanCourse = this.cleanCourseName(race.course).toLowerCase();
                        return Array.from(possibleCourses).some(course => 
                            cleanCourse.includes(course.toLowerCase()) || 
                            course.toLowerCase().includes(cleanCourse)
                        );
                    });
                    
                    console.log(`   - Filtered to ${candidateRaces.length} races from possible courses: ${Array.from(possibleCourses).join(', ')}`);
                }
                
                // If we have a likely course, prioritize those races
                if (likelyCourse) {
                    const likelyCourseRaces = candidateRaces.filter(race => 
                        this.cleanCourseName(race.course).toLowerCase().includes(likelyCourse.toLowerCase()) ||
                        likelyCourse.toLowerCase().includes(this.cleanCourseName(race.course).toLowerCase())
                    );
                    
                    if (likelyCourseRaces.length > 0) {
                        candidateRaces = likelyCourseRaces;
                        console.log(`   - Further filtered to ${candidateRaces.length} races from likely course: ${likelyCourse}`);
                    }
                }
                
                // Check for missing race times at the likely course
                if (likelyCourse && previousRace && nextRace) {
                    const prevParsed = this.parseRaceInfo(previousRace.raceInfo);
                    const nextParsed = this.parseRaceInfo(nextRace.raceInfo);
                    
                    if (prevParsed && nextParsed && prevParsed.time && nextParsed.time) {
                        // Convert times to minutes for comparison
                        const prevTimeMinutes = this.timeToMinutes(prevParsed.time);
                        const nextTimeMinutes = this.timeToMinutes(nextParsed.time);
                        
                        if (prevTimeMinutes && nextTimeMinutes) {
                            console.log(`   - Time range: between ${prevParsed.time} and ${nextParsed.time}`);
                            
                            // Find races that fall between these times
                            const betweenTimeRaces = candidateRaces.filter(race => {
                                const raceTimeMinutes = this.timeToMinutes(race.off_time);
                                return raceTimeMinutes && 
                                       raceTimeMinutes > prevTimeMinutes && 
                                       raceTimeMinutes < nextTimeMinutes;
                            });
                            
                            if (betweenTimeRaces.length > 0) {
                                candidateRaces = betweenTimeRaces;
                                console.log(`   - Found ${betweenTimeRaces.length} races between ${prevParsed.time} and ${nextParsed.time}`);
                            }
                        }
                    }
                }
                
                // For each remaining race in the database, try to match by horse names
                let bestMatch = null;
                let bestMatchScore = 0;
                let bestMatchRace = null;
                
                for (const dbRace of candidateRaces) {
                    // Get runners for this race
                    const { data: runners, error } = await this.supabase
                        .from('runners')
                        .select('id, horse_name')
                        .eq('race_id', dbRace.id);
                        
                    if (error || !runners) continue;
                    
                    // Count how many horse names match
                    let matchCount = 0;
                    for (const horse of unmatchedRace.horses) {
                        const horseName = horse.horseName.toLowerCase();
                        const matchedRunner = runners.find(runner => 
                            runner.horse_name.toLowerCase() === horseName ||
                            runner.horse_name.toLowerCase().includes(horseName) ||
                            horseName.includes(runner.horse_name.toLowerCase())
                        );
                        
                        if (matchedRunner) matchCount++;
                    }
                    
                    // Calculate match score as percentage of horses matched
                    const matchScore = (matchCount / Math.max(unmatchedRace.horses.length, runners.length)) * 100;
                    
                    if (matchScore > bestMatchScore) {
                        bestMatchScore = matchScore;
                        bestMatch = dbRace;
                        bestMatchRace = runners;
                    }
                }
                
                // If we found a good match (at least 40% of horses match)
                if (bestMatch && bestMatchScore >= 40) {
                    console.log(`✅ FOUND POTENTIAL MATCH: ${bestMatch.course} ${bestMatch.off_time} (ID: ${bestMatch.id})`);
                    console.log(`   - Match confidence: ${bestMatchScore.toFixed(1)}%`);
                    console.log(`   - Matched ${Math.round(bestMatchScore * bestMatchRace.length / 100)} of ${bestMatchRace.length} horses`);
                    
                    // Process this match
                    processedRaceIds.add(bestMatch.id); // Mark as processed
                    
                    // Match horses in this race
                    const matchedHorses = await this.matchHorsesInSupabase(bestMatch.id, unmatchedRace);
                    
                    // Insert matched horses into pace_figs table
                    if (matchedHorses.length > 0) {
                        await this.insertPaceFigs(matchedHorses);
                        this.matchingStats.matchedRaces++; // Increment matched races count
                        
                        // Remove from unmatched races
                        const index = this.matchingStats.unmatchedRaces.findIndex(
                            r => r === "INVALID: Empty race info"
                        );
                        if (index !== -1) {
                            this.matchingStats.unmatchedRaces.splice(index, 1);
                        }
                    }
                } else {
                    console.log(`❌ No match found for race with ${unmatchedRace.horses.length} horses`);
                    if (bestMatch) {
                        console.log(`   - Best match was ${bestMatch.course} ${bestMatch.off_time} with ${bestMatchScore.toFixed(1)}% confidence`);
                    }
                }
            }
        }

        this.printMatchingStats();
    }

    printMatchingStats() {
        console.log(`\n📊 MATCHING STATISTICS 📊`);
        console.log(`========================`);
        console.log(`📅 Date: ${this.todaysDate}`);
        console.log(`🏁 Races: ${this.matchingStats.matchedRaces}/${this.matchingStats.totalRaces} matched`);
        console.log(`🐎 Horses: ${this.matchingStats.matchedHorses}/${this.matchingStats.totalHorses} matched`);
        console.log(`💾 Records inserted: ${this.matchingStats.insertedRecords}`);
        
        if (this.matchingStats.unmatchedRaces.length > 0) {
            console.log(`\n❌ UNMATCHED RACES:`);
            this.matchingStats.unmatchedRaces.forEach(race => console.log(`   - ${race}`));
        }
        
        if (this.matchingStats.unmatchedHorses.length > 0) {
            console.log(`\n❌ UNMATCHED HORSES:`);
            this.matchingStats.unmatchedHorses.forEach(horse => 
                console.log(`   - ${horse.horseName} (Race ID: ${horse.raceId})`)
            );
        }
        
        if (this.matchingStats.errors.length > 0) {
            console.log(`\n⚠️ ERRORS:`);
            this.matchingStats.errors.forEach(error => console.log(`   - ${error}`));
        }
    }

    async close() {
        if (this.browser) {
            await this.browser.close();
        }
    }

    async run() {
        try {
            await this.init();
            await this.login();
            const data = await this.scrapePaceData();
            
            console.log(`\nScraping completed successfully!`);
            console.log(`Found ${data.length} races`);
            console.log(`Total horses: ${data.reduce((sum, race) => sum + race.horses.length, 0)}`);
            
                        const files = await this.saveData(data);
            
            // Print summary to console
            console.log('\n--- RACE SUMMARY ---');
            data.forEach((race, index) => {
                console.log(`\nRace ${index + 1}: ${race.raceInfo}`);
                console.log(`Total Race Figure: ${race.totalRaceFigure}`);
                console.log(`Horses: ${race.horses.length}`);
                
                race.horses.forEach(horse => {
                    console.log(`  ${horse.horseName} (Draw: ${horse.draw}) - Pace: ${horse.paceFigure} (${horse.paceFigureLastTimeOut}) - Style: ${horse.paceStyle} - Colour: ${horse.colour}`);
                });
            });

            // Process data for Supabase integration
            await this.processRaceData(data);
            
            return data;
            
        } catch (error) {
            console.error('Error during scraping:', error);
            throw error;
        } finally {
            await this.close();
        }
    }
}

// Main execution
async function main() {
    const scraper = new SmarterSigScraper();
    
    try {
        await scraper.run();
        console.log('\nScraping completed successfully!');
    } catch (error) {
        console.error('Scraping failed:', error);
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = SmarterSigScraper; 