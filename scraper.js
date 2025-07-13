const puppeteer = require('puppeteer');
const fs = require('fs-extra');
const path = require('path');
const config = require('./config');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(config.supabase.url, config.supabase.serviceRoleKey);

// Utility function to replace deprecated waitForTimeout
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class TimeformScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.raceUrls = [];
    this.scrapedData = [];
    this.allScrapedData = []; // Initialize allScrapedData
  }

  async initialize() {
    console.log('🚀 Initializing Timeform scraper...');
    
    // Enhanced browser launch with anti-detection and cloud optimizations
    const baseArgs = config.puppeteer.args || [];
    const enhancedArgs = [
      ...baseArgs,
      '--disable-blink-features=AutomationControlled',
      '--exclude-switches=enable-automation',
      '--disable-extensions-file-access-check',
      '--disable-extensions-http-throttling',
      '--disable-extensions-except',
      '--disable-hang-monitor',
      '--disable-ipc-flooding-protection',
      '--disable-popup-blocking',
      '--disable-prompt-on-repost',
      '--disable-sync',
      '--disable-translate',
      '--hide-scrollbars',
      '--metrics-recording-only',
      '--mute-audio',
      '--no-first-run',
      '--safebrowsing-disable-auto-update',
      '--enable-automation=false',
      '--password-store=basic',
      '--use-mock-keychain',
      // Additional cloud environment optimizations
      '--disable-client-side-phishing-detection',
      '--disable-component-extensions-with-background-pages',
      '--disable-default-apps',
      '--disable-desktop-notifications',
      '--disable-extensions',
      '--disable-features=TranslateUI',
      '--disable-ipc-flooding-protection',
      '--disable-renderer-backgrounding',
      '--disable-backgrounding-occluded-windows',
      '--disable-background-timer-throttling',
      '--force-color-profile=srgb',
      '--disable-software-rasterizer',
      '--disable-background-networking',
      '--disable-field-trial-config',
      '--disable-back-forward-cache',
      '--enable-features=NetworkService,NetworkServiceInProcess',
      '--force-fieldtrials=*BackgroundTracing/default/'
    ];
    
    // Remove duplicate arguments
    const uniqueArgs = [...new Set(enhancedArgs)];
    
    this.browser = await puppeteer.launch({
      headless: config.puppeteer.headless,
      slowMo: config.puppeteer.slowMo,
      args: uniqueArgs,
      protocolTimeout: config.puppeteer.protocolTimeout,
      ignoreDefaultArgs: ['--enable-automation', '--enable-blink-features=AutomationControlled'],
      ignoreHTTPSErrors: true,
      // Additional cloud-friendly options
      pipe: process.env.NODE_ENV === 'production', // Use pipe instead of websocket in production
      handleSIGINT: false,
      handleSIGTERM: false,
      handleSIGHUP: false
    });
    
    this.page = await this.browser.newPage();
    
    // Set protocolTimeout on the page level as well
    this.page.setDefaultTimeout(config.puppeteer.timeout);
    this.page.setDefaultNavigationTimeout(config.puppeteer.timeout);
    
    // Remove webdriver traces with comprehensive script
    await this.page.evaluateOnNewDocument(() => {
      // Remove webdriver property
      Object.defineProperty(navigator, 'webdriver', {
        get: () => undefined,
      });
      
      // Remove automation indicators
      delete window.navigator.__proto__.webdriver;
      
      // Mock plugins
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
      
      // Mock languages
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en', 'en-GB'],
      });
      
      // Mock permissions
      const originalQuery = window.navigator.permissions.query;
      window.navigator.permissions.query = (parameters) => (
        parameters.name === 'notifications' ?
          Promise.resolve({ state: Notification.permission }) :
          originalQuery(parameters)
      );
      
      // Override chrome runtime
      if (window.chrome) {
        Object.defineProperty(window.chrome, 'runtime', {
          get: () => undefined,
        });
      }
      
      // Mock screen properties to appear more realistic
      Object.defineProperty(screen, 'colorDepth', {
        get: () => 24,
      });
      
      Object.defineProperty(screen, 'pixelDepth', {
        get: () => 24,
      });
      
      // Additional stealth measures
      Object.defineProperty(navigator, 'platform', {
        get: () => 'Win32',
      });
      
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        get: () => 4,
      });
    });
    
    // Set realistic user agent with version randomization
    const userAgents = [
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    ];
    const randomUserAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    await this.page.setUserAgent(randomUserAgent);
    console.log(`🎭 Using User Agent: ${randomUserAgent}`);
    
    // Set realistic viewport with slight randomization
    const viewports = [
      { width: 1920, height: 1080 },
      { width: 1366, height: 768 },
      { width: 1440, height: 900 },
      { width: 1536, height: 864 },
      { width: 1280, height: 720 }
    ];
    const randomViewport = viewports[Math.floor(Math.random() * viewports.length)];
    await this.page.setViewport(randomViewport);
    console.log(`📐 Using Viewport: ${randomViewport.width}x${randomViewport.height}`);
    
    // Set comprehensive headers
    await this.page.setExtraHTTPHeaders({
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Language': 'en-US,en;q=0.9,en-GB;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Cache-Control': 'max-age=0',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
      'Sec-Fetch-Dest': 'document',
      'Sec-Fetch-Mode': 'navigate',
      'Sec-Fetch-Site': 'none',
      'Sec-Fetch-User': '?1',
      'sec-ch-ua': '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
      'sec-ch-ua-mobile': '?0',
      'sec-ch-ua-platform': '"Windows"'
    });

    // Listen for console messages from the browser context
    this.page.on('console', msg => {
      for (let i = 0; i < msg.args().length; ++i) {
        console.log(`BROWSER CONSOLE: ${msg.args()[i]}`);
      }
    });
    
    // Optimized request interception for better performance
    await this.page.setRequestInterception(true);
    this.page.on('request', (req) => {
      const resourceType = req.resourceType();
      const url = req.url();
      
      // Block unnecessary resources but allow essential ones
      if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
        req.abort();
      } else if (resourceType === 'script' && (url.includes('analytics') || url.includes('tracking') || url.includes('ads'))) {
        req.abort();
      } else {
        req.continue();
      }
    });
    
    console.log('✅ Browser initialized with enhanced anti-detection measures');
  }

  async login() {
    console.log('🔐 Logging into Timeform...');
    console.log(`DEBUG: NODE_ENV = ${process.env.NODE_ENV}`);
    
    // Add better user agent and anti-detection
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await this.page.setViewport({ width: 1366, height: 768 });
    
    // Set additional headers to appear more like a real browser
    await this.page.setExtraHTTPHeaders({
      'Accept-Language': 'en-GB,en;q=0.9,en-US;q=0.8',
      'Accept-Encoding': 'gzip, deflate, br',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    });
    
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        console.log(`🔄 Login attempt ${retryCount + 1}/${maxRetries}`);
        
        // Navigate to racecards page directly for login
        await this.page.goto(config.timeform.racecardsUrl, { 
          waitUntil: 'networkidle2',
          timeout: config.puppeteer.timeout 
        });

        // Add random delay to appear more human-like
        await delay(2000 + Math.random() * 3000);

        // Look for sign in button/link with multiple selectors
        const signInSelectors = [
          'a[href*="/account/sign-in"]',
          'a[href*="sign-in"]',
          '.sign-in-link',
          'a:contains("Sign In")',
          'a:contains("Log In")',
          'a:contains("Login")'
        ];
        
        let signInElement = null;
        for (const selector of signInSelectors) {
          try {
            await this.page.waitForSelector(selector, { timeout: 10000 });
            signInElement = await this.page.$(selector);
            if (signInElement) {
              console.log(`✅ Found sign-in element with selector: ${selector}`);
              break;
            }
          } catch (e) {
            console.log(`⚠️ Selector ${selector} not found, trying next...`);
          }
        }
        
        if (!signInElement) {
          throw new Error('Could not find sign-in button with any selector');
        }
        
        // Add a small delay to ensure element is fully interactive
        await delay(1000);

        // Click sign in using evaluate for more robustness
        await this.page.evaluate((selector) => {
          const element = document.querySelector(selector);
          if (element) {
            element.click();
          }
        }, signInSelectors.find(sel => signInElement));
        
        // Take screenshot and save HTML immediately after sign-in click (only in development)
        const isProduction = process.env.NODE_ENV === 'production';
        console.log(`DEBUG: isProduction = ${isProduction}, skipping screenshots in production`);
        
        if (!isProduction) {
          console.log('Taking screenshot in development mode...');
          await this.page.screenshot({ path: 'login-step1-after-signin-click.png', fullPage: true });
          const htmlAfterSignInClick = await this.page.content();
          fs.writeFileSync('login-after-signin-click.html', htmlAfterSignInClick);
          console.log('Page HTML after sign-in click saved to login-after-signin-click.html');
        }

        // Wait for email input with multiple selectors
        const emailSelectors = [
          'input[id="EmailAddress"]',
          'input[name="email"]',
          'input[type="email"]',
          'input[placeholder*="email" i]',
          'input[placeholder*="Email" i]'
        ];
        
        let emailInput = null;
        for (const selector of emailSelectors) {
          try {
            await this.page.waitForSelector(selector, { timeout: 15000 });
            emailInput = await this.page.$(selector);
            if (emailInput) {
              console.log(`✅ Found email input with selector: ${selector}`);
              break;
            }
          } catch (e) {
            console.log(`⚠️ Email selector ${selector} not found, trying next...`);
          }
        }
        
        if (!emailInput) {
          throw new Error('Could not find email input field with any selector');
        }
        
        // Clear and type email with human-like delays
        await this.page.focus(emailSelectors.find(sel => emailInput));
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('KeyA');
        await this.page.keyboard.up('Control');
        await delay(500);
        
        // Type email character by character with random delays
        for (const char of config.timeform.email) {
          await this.page.keyboard.type(char);
          await delay(50 + Math.random() * 100);
        }
        
        if (!isProduction) {
          console.log('Taking email screenshot in development mode...');
          await this.page.screenshot({ path: 'login-step2-after-email.png', fullPage: true });
        }

        // Wait for password input with multiple selectors
        const passwordSelectors = [
          'input[id="Password"]',
          'input[name="password"]',
          'input[type="password"]',
          'input[placeholder*="password" i]',
          'input[placeholder*="Password" i]'
        ];
        
        let passwordInput = null;
        for (const selector of passwordSelectors) {
          try {
            await this.page.waitForSelector(selector, { timeout: 15000 });
            passwordInput = await this.page.$(selector);
            if (passwordInput) {
              console.log(`✅ Found password input with selector: ${selector}`);
              break;
            }
          } catch (e) {
            console.log(`⚠️ Password selector ${selector} not found, trying next...`);
          }
        }
        
        if (!passwordInput) {
          throw new Error('Could not find password input field with any selector');
        }
        
        // Clear and type password with human-like delays
        await this.page.focus(passwordSelectors.find(sel => passwordInput));
        await this.page.keyboard.down('Control');
        await this.page.keyboard.press('KeyA');
        await this.page.keyboard.up('Control');
        await delay(500);
        
        // Type password character by character with random delays
        for (const char of config.timeform.password) {
          await this.page.keyboard.type(char);
          await delay(50 + Math.random() * 100);
        }
        
        if (!isProduction) {
          console.log('Taking password screenshot in development mode...');
          await this.page.screenshot({ path: 'login-step3-after-password.png', fullPage: true });
        }

        // Submit login form with multiple approaches
        const submitSelectors = [
          'input[type="submit"][value="Sign In"]',
          'input[type="submit"]',
          'button[type="submit"]',
          'button:contains("Sign In")',
          'button:contains("Log In")',
          'button:contains("Login")',
          '.login-submit',
          '.sign-in-submit'
        ];
        
        let submitSuccess = false;
        for (const selector of submitSelectors) {
          try {
            const submitElement = await this.page.$(selector);
            if (submitElement) {
              console.log(`✅ Found submit button with selector: ${selector}`);
              await this.page.click(selector);
              submitSuccess = true;
              break;
            }
          } catch (e) {
            console.log(`⚠️ Submit selector ${selector} not found, trying next...`);
          }
        }
        
        if (!submitSuccess) {
          // Try pressing Enter as fallback
          console.log('🔄 Trying Enter key as fallback...');
          await this.page.keyboard.press('Enter');
        }
        
        // Wait for login success with sequential detection (more reliable for cloud environments)
        console.log('⏳ Waiting for login success indicators...');
        
        let loginSuccessMethod = null;
        const detectionTimeout = 20000; // Shorter timeout per method
        
        // Try multiple detection methods sequentially instead of Promise.race
        for (let i = 0; i < 6 && !loginSuccessMethod; i++) {
          try {
            console.log(`🔍 Login detection attempt ${i + 1}/6...`);
            
            switch (i) {
              case 0:
                // Method 1: Check if email field disappeared
                await this.page.waitForFunction(() => {
                  return document.querySelector('input[id="EmailAddress"]') === null;
                }, { timeout: detectionTimeout });
                loginSuccessMethod = 'email_field_disappeared';
                break;
                
              case 1:
                // Method 2: Check if any login form disappeared
                await this.page.waitForFunction(() => {
                  return document.querySelector('input[type="email"], input[id="EmailAddress"]') === null;
                }, { timeout: detectionTimeout });
                loginSuccessMethod = 'login_form_disappeared';
                break;
                
              case 2:
                // Method 3: Check URL doesn't contain login/sign-in
                await this.page.waitForFunction(() => {
                  const url = window.location.href.toLowerCase();
                  return !url.includes('sign-in') && !url.includes('login');
                }, { timeout: detectionTimeout });
                loginSuccessMethod = 'url_changed';
                break;
                
              case 3:
                // Method 4: Wait for racecards page elements
                await this.page.waitForSelector('.meeting-page__container, .w-racecard-grid', { timeout: detectionTimeout });
                loginSuccessMethod = 'racecards_elements_found';
                break;
                
              case 4:
                // Method 5: Look for account/user elements
                await this.page.waitForFunction(() => {
                  return document.querySelector('a[href*="account"], .user-menu, .account-menu') !== null;
                }, { timeout: detectionTimeout });
                loginSuccessMethod = 'account_elements_found';
                break;
                
              case 5:
                // Method 6: Final fallback - just wait and check if we're not on login page
                await delay(3000);
                const currentUrl = await this.page.url();
                if (!currentUrl.toLowerCase().includes('sign-in') && !currentUrl.toLowerCase().includes('login')) {
                  loginSuccessMethod = 'final_url_check';
                }
                break;
            }
            
            if (loginSuccessMethod) {
              console.log(`✅ Login successful! Detection method: ${loginSuccessMethod}`);
              break;
            }
            
          } catch (detectionError) {
            console.log(`⚠️ Detection method ${i + 1} failed: ${detectionError.message}`);
            // Continue to next detection method
            
            // Add a small delay between detection attempts
            await delay(1000);
          }
        }
        
        if (!loginSuccessMethod) {
          // Final attempt: check current state manually
          try {
            const currentUrl = await this.page.url();
            const hasEmailField = await this.page.$('input[id="EmailAddress"]');
            
            console.log(`🔍 Final state check - URL: ${currentUrl}, Has email field: ${hasEmailField !== null}`);
            
            if (!currentUrl.toLowerCase().includes('sign-in') && !currentUrl.toLowerCase().includes('login') && !hasEmailField) {
              loginSuccessMethod = 'manual_state_check';
              console.log(`✅ Login successful! Detection method: ${loginSuccessMethod}`);
            } else {
              throw new Error(`Login verification failed - URL: ${currentUrl}, Email field present: ${hasEmailField !== null}`);
            }
          } catch (finalCheckError) {
            throw new Error(`All login detection methods failed. Final check error: ${finalCheckError.message}`);
          }
        }
        
        return; // Success, exit retry loop
        
      } catch (error) {
        retryCount++;
        console.error(`❌ Login attempt ${retryCount} failed:`, error.message);
        
        if (retryCount >= maxRetries) {
          console.error('❌ All login attempts failed');
          const isProduction = process.env.NODE_ENV === 'production';
          if (!isProduction) {
            console.log('Taking error screenshot in development mode...');
            try {
              await this.page.screenshot({ path: 'login-failed.png', fullPage: true });
              const errorHtml = await this.page.content();
              fs.writeFileSync('login-failed.html', errorHtml);
            } catch (screenshotError) {
              console.error('Failed to take error screenshot:', screenshotError.message);
            }
          }
          throw error;
        }
        
        // Wait before retry with exponential backoff
        const backoffDelay = Math.min(5000 * Math.pow(2, retryCount - 1), 30000);
        console.log(`⏳ Waiting ${backoffDelay}ms before retry...`);
        await delay(backoffDelay);
      }
    }
  }

  async scrapeRacecardUrls() {
    console.log('🔗 Scraping racecard URLs...');
    await this.page.goto(config.timeform.racecardsUrl, { waitUntil: 'networkidle2', timeout: config.puppeteer.timeout });
    
    // Ensure the page is fully loaded and interactive by waiting for a common element on the racecards page
    // This might be redundant after goto, but adds robustness.
    await this.page.waitForSelector('.meeting-page__container, .w-racecard-grid', { timeout: config.puppeteer.timeout });

    const raceUrls = await this.page.evaluate(() => {
      const urls = [];
      // Select all links that contain '/horse-racing/racecards/' in their href attribute
      document.querySelectorAll('a[href*="/horse-racing/racecards/"]').forEach(link => {
        const href = link.href;
        // Filter out links that are for meeting summaries or other non-racecard pages
        if (href.includes('/horse-racing/racecards/') && !href.includes('meeting-summary')) {
          urls.push(href);
        }
      });
      return [...new Set(urls)]; // Return unique URLs
    });
    console.log(`✅ Found ${raceUrls.length} race URLs.`);
    return raceUrls;
  }

  async scrapeRaceData(raceUrl, raceData, currentUkTime) {
    console.log(`🐎 Scraping data from ${raceUrl}...`);
    try {
      await this.page.goto(raceUrl, {
        waitUntil: 'networkidle2',
        timeout: config.puppeteer.timeout 
      });

      // Get current UK time properly
      const now = new Date();
      const ukTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/London"}));
      const currentUkTimeForBrowser = {
        hour: ukTime.getHours(),
        minute: ukTime.getMinutes(),
        date: ukTime.toISOString().split('T')[0] // YYYY-MM-DD format
      };

      const data = await this.page.evaluate((initialRaceData, browserCurrentUkTime) => {
        const raceDataInBrowser = { ...initialRaceData };

        // Pre-scrape all pace map data to link to individual horses later
        const allHorsePaceMaps = {};
        // document.querySelectorAll('.pacemap thead th.pm-epf-col').forEach(header => {
        //     paceMapHeaders.push(header.innerText.trim());
        // });
        // console.log('BROWSER CONSOLE: DEBUG - Pace Map Headers:', JSON.stringify(paceMapHeaders));

        document.querySelectorAll('.pacemap tbody tr').forEach(row => {
            const horseNameElement = row.querySelector('.pm-th-horsename a');
            if (horseNameElement) {
                const horseName = horseNameElement.innerText.trim();
                const paceMapEntries = [];
                row.querySelectorAll('.pm-epf').forEach((epfTd, index) => {
                    const colorClassMatch = Array.from(epfTd.classList).find(cls => cls.startsWith('pm-probability-'));
                    const colorLevel = colorClassMatch ? parseInt(colorClassMatch.replace('pm-probability-', ''), 10) : 0;
                    const value = epfTd.querySelector('.pm-epf-inner')?.innerText.trim() || null;

                    // Extract EPF position from the title attribute
                    const title = epfTd.getAttribute('title');
                    let epfPosition = null;
                    if (title) {
                        const epfMatch = title.match(/(EPF \d)/);
                        if (epfMatch) {
                            epfPosition = epfMatch[1];
                        }
                    }

                    console.log(`BROWSER CONSOLE: DEBUG - Processing EPF for ${horseName}: index=${index}, epfTd.className=${epfTd.className}, value=${value}, epfPosition=${epfPosition}`);

                    if (value && epfPosition) {
                        paceMapEntries.push({ epfPosition, value, colorLevel });
                    }
                });
                allHorsePaceMaps[horseName] = paceMapEntries;
                console.log(`BROWSER CONSOLE: DEBUG - allHorsePaceMaps[${horseName}]: ${JSON.stringify(allHorsePaceMaps[horseName])}`);
            }
        });


        // Extract race title
        const raceTitleElement = document.querySelector('h1.rp-title');
        if (raceTitleElement) {
            raceDataInBrowser.raceTitle = raceTitleElement.innerText.trim();
        }

        // Extract course and date
        const courseNameElement = document.querySelector('.rp-title-course-name');
        if (courseNameElement) {
            let courseName = courseNameElement.innerText.replace('CLOSED', '').trim();
            // Normalize course name to title case for matching with Supabase
            courseName = courseName.replace(/\b\w/g, char => char.toUpperCase());
            raceDataInBrowser.course = courseName;

            const dateMatch = courseNameElement.innerText.match(/\d{1,2} \w+ \d{4}/);
            if (dateMatch) {
                raceDataInBrowser.date = new Date(dateMatch[0]).toISOString().slice(0, 10); // YYYY-MM-DD
            }
        }

        // Extract race time
        // Prioritize extracting from the title tag with improved regex
        const titleMatch = document.title.match(/(\d{1,2}:\d{2})/);
        if (titleMatch) {
            raceDataInBrowser.raceTime = titleMatch[1];
            console.log(`BROWSER CONSOLE: DEBUG - Race time extracted from title: ${titleMatch[1]}`);
        } else {
            // Fallback: Extract from JSON-LD if title tag not found or fails
            const schemaScript = document.querySelector('script[type="application/ld+json"]');
            if (schemaScript) {
                try {
                    const jsonData = JSON.parse(schemaScript.textContent);
                    if (jsonData.startDate) {
                        raceDataInBrowser.raceTime = jsonData.startDate.substring(11, 16);
                        console.log(`BROWSER CONSOLE: DEBUG - Race time extracted from JSON-LD: ${raceDataInBrowser.raceTime}`);
                    }
                } catch (e) {
                    console.error("Error parsing JSON-LD for race time:", e);
                }
            }
        }

        // Final fallback: Use the initial race time from URL if still no race time found
        if (!raceDataInBrowser.raceTime && initialRaceData.raceTime) {
            raceDataInBrowser.raceTime = initialRaceData.raceTime;
            console.log(`BROWSER CONSOLE: DEBUG - Using race time from URL as fallback: ${initialRaceData.raceTime}`);
        }

        if (!raceDataInBrowser.raceTime) {
            console.warn(`Could not extract raceTime for ${raceDataInBrowser.url}`);
        } else {
            console.log(`BROWSER CONSOLE: DEBUG - Final race time set to: ${raceDataInBrowser.raceTime}`);
        }

        // Extract Pace Forecast, Draw Bias, and Specific Pace Hint from rp-header-table
        let paceForecast = null;
        let drawBias = null;
        let specificPaceHint = null;

        // Try multiple selectors to find the pace information
        let headerTable = document.querySelector('.rp-header-table');
        if (!headerTable) {
            // Try alternative selectors
            headerTable = document.querySelector('table');
            console.log(`BROWSER CONSOLE: DEBUG - Using fallback table selector`);
        }
        
        if (headerTable) {
            console.log(`BROWSER CONSOLE: DEBUG - Found table, extracting pace data...`);
            
            // Extract all spans and check their content
            const allSpans = headerTable.querySelectorAll('span');
            console.log(`BROWSER CONSOLE: DEBUG - Found ${allSpans.length} spans in table`);
            
            // Also check all paragraphs for the pace information
            const allPs = headerTable.querySelectorAll('p');
            console.log(`BROWSER CONSOLE: DEBUG - Found ${allPs.length} paragraphs in table`);
            
            // Check all paragraphs for pace forecast info
            for (const p of allPs) {
                const pText = p.textContent.trim();
                console.log(`BROWSER CONSOLE: DEBUG - Checking paragraph: "${pText}"`);
                
                if (pText.includes('Pace Forecast :')) {
                    paceForecast = pText.replace('Pace Forecast :', '').trim();
                    console.log(`BROWSER CONSOLE: DEBUG - Found Pace Forecast: ${paceForecast}`);
                } else if (pText.includes('Draw Bias :')) {
                    drawBias = pText.replace('Draw Bias :', '').trim();
                    console.log(`BROWSER CONSOLE: DEBUG - Found Draw Bias: ${drawBias}`);
                } else if (pText.includes('Specific Pace Hint :')) {
                    specificPaceHint = pText.replace('Specific Pace Hint :', '').trim();
                    console.log(`BROWSER CONSOLE: DEBUG - Found Specific Pace Hint: ${specificPaceHint}`);
                }
            }
            
            for (const span of allSpans) {
                const spanText = span.textContent.trim();
                console.log(`BROWSER CONSOLE: DEBUG - Checking span: "${spanText}"`);
                
                if (spanText.includes('Pace Forecast :')) {
                    const parentP = span.closest('p');
                    if (parentP) {
                        paceForecast = parentP.textContent.replace('Pace Forecast :', '').trim();
                        console.log(`BROWSER CONSOLE: DEBUG - Found Pace Forecast: ${paceForecast}`);
                    }
                } else if (spanText.includes('Draw Bias :')) {
                    const parentP = span.closest('p');
                    if (parentP) {
                        drawBias = parentP.textContent.replace('Draw Bias :', '').trim();
                        console.log(`BROWSER CONSOLE: DEBUG - Found Draw Bias: ${drawBias}`);
                    }
                } else if (spanText.includes('Specific Pace Hint :')) {
                    const parentP = span.closest('p');
                    if (parentP) {
                        specificPaceHint = parentP.textContent.replace('Specific Pace Hint :', '').trim();
                        console.log(`BROWSER CONSOLE: DEBUG - Found Specific Pace Hint: ${specificPaceHint}`);
                    }
                }
            }
        } else {
            console.log(`BROWSER CONSOLE: DEBUG - No table found at all`);
        }
        
        // If still not found, search the entire page
        if (!paceForecast && !drawBias && !specificPaceHint) {
            console.log(`BROWSER CONSOLE: DEBUG - Searching entire page for pace information...`);
            const allPagePs = document.querySelectorAll('p');
            console.log(`BROWSER CONSOLE: DEBUG - Found ${allPagePs.length} paragraphs on page`);
            
            for (const p of allPagePs) {
                const pText = p.textContent.trim();
                if (pText.includes('Pace Forecast :')) {
                    paceForecast = pText.replace('Pace Forecast :', '').trim();
                    console.log(`BROWSER CONSOLE: DEBUG - Found Pace Forecast on page: ${paceForecast}`);
                } else if (pText.includes('Draw Bias :')) {
                    drawBias = pText.replace('Draw Bias :', '').trim();
                    console.log(`BROWSER CONSOLE: DEBUG - Found Draw Bias on page: ${drawBias}`);
                } else if (pText.includes('Specific Pace Hint :')) {
                    specificPaceHint = pText.replace('Specific Pace Hint :', '').trim();
                    console.log(`BROWSER CONSOLE: DEBUG - Found Specific Pace Hint on page: ${specificPaceHint}`);
                }
            }
        }

        // Store the extracted race-level data
        raceDataInBrowser.paceForecast = paceForecast;
        raceDataInBrowser.drawBias = drawBias;
        raceDataInBrowser.specificPaceHint = specificPaceHint;

        // Determine if the race has finished using the extracted raceTime and current UK time
        let isFinished = false;
        if (raceDataInBrowser.date && raceDataInBrowser.raceTime) {
            try {
                const [raceHour, raceMinute] = raceDataInBrowser.raceTime.split(':').map(Number);
                const raceDate = new Date(`${raceDataInBrowser.date}T${raceDataInBrowser.raceTime}:00`);

                const currentDateTime = new Date(`${browserCurrentUkTime.date}T${String(browserCurrentUkTime.hour).padStart(2, '0')}:${String(browserCurrentUkTime.minute).padStart(2, '0')}:00`);

                isFinished = raceDate < currentDateTime;
                console.log(`BROWSER CONSOLE: Debug - Race time: ${raceDataInBrowser.raceTime}, Race date: ${raceDataInBrowser.date}`);
                console.log(`BROWSER CONSOLE: Debug - Current UK time: ${browserCurrentUkTime.hour}:${browserCurrentUkTime.minute}, Current date: ${browserCurrentUkTime.date}`);
                console.log(`BROWSER CONSOLE: Debug - Is today: ${raceDate.toISOString().slice(0, 10) === currentDateTime.toISOString().slice(0, 10)}`);
                console.log(`BROWSER CONSOLE: Debug - Race minutes: ${raceHour * 60 + raceMinute}, Current minutes: ${browserCurrentUkTime.hour * 60 + browserCurrentUkTime.minute}`);

                if (isFinished) {
                    console.log(`BROWSER CONSOLE: Debug - Race is finished (race time < current time)`);
                } else {
                    console.log(`BROWSER CONSOLE: Debug - Race is upcoming (race time > current time)`);
                }
            } catch (e) {
                console.error("Error in isFinished calculation:", e);
                isFinished = true; // Assume finished on error to prevent infinite loops
            }
        }

        // Loop through each horse and extract its data
        const runners = [];
        const runnerRows = document.querySelectorAll('tbody.rp-horse-row');
        console.log(`BROWSER CONSOLE: DEBUG - Found ${runnerRows.length} runner rows`);
        
        runnerRows.forEach((row, index) => {
            // Extract horse name from the first row
            const horseNameElement = row.querySelector('tr.rp-horse-row-1 a.rp-horse');
            const horseName = horseNameElement ? horseNameElement.innerText.trim() : null;
            console.log(`BROWSER CONSOLE: DEBUG - Processing runner ${index + 1}: ${horseName}`);

            if (!horseName) {
                console.log(`BROWSER CONSOLE: DEBUG - No horse name found for runner ${index + 1}, skipping`);
                return;
            }

            let comment = null;
            // Comments might be in a different structure - let's check for comment elements
            const commentElement = row.querySelector('.rp-entry-comment-text, .comment, [title*="comment"], [title*="Comment"]');
            if (commentElement) {
                comment = commentElement.innerText.trim();
                console.log(`BROWSER CONSOLE: DEBUG - Comment found for ${horseName}: ${comment}`);
            } else {
                console.log(`BROWSER CONSOLE: DEBUG - No comment found for ${horseName}`);
            }

            // Extract past performances from horseFormBox table
            const pastPerformances = [];
            const horseIdMatch = horseNameElement.getAttribute('id')?.match(/horseFormButton(\d+)/);
            if (horseIdMatch) {
                const horseId = horseIdMatch[1];
                console.log(`BROWSER CONSOLE: DEBUG - Looking for form box with ID: horseFormBox${horseId}`);
                const formBoxTable = document.querySelector(`#horseFormBox${horseId} table tbody.rp-rf-table-row`);
                if (formBoxTable) {
                    console.log(`BROWSER CONSOLE: DEBUG - Found form box table for ${horseName}`);
                    const formRows = formBoxTable.querySelectorAll('tr');
                    console.log(`BROWSER CONSOLE: DEBUG - Found ${formRows.length} form rows for ${horseName}`);
                    formRows.forEach((formRow, formIndex) => {
                        const cells = formRow.querySelectorAll('td');
                        console.log(`BROWSER CONSOLE: DEBUG - Form row ${formIndex + 1} has ${cells.length} cells for ${horseName}`);
                        if (cells.length >= 18) {
                            const performance = {
                                date: cells[0]?.querySelector('a')?.innerText.trim() || cells[0]?.innerText.trim() || null,
                                course: cells[2]?.innerText.trim() || null,
                                result: cells[3]?.innerText.trim() || null,
                                beaten_by: cells[4]?.innerText.trim() || null,
                                type: cells[5]?.innerText.trim() || null,
                                official_rating: cells[6]?.innerText.trim() || null,
                                distance: cells[7]?.innerText.trim() || null,
                                going: cells[8]?.innerText.trim() || null,
                                equipment: cells[9]?.innerText.trim() || null,
                                jockey: cells[10]?.querySelector('a')?.innerText.trim() || cells[10]?.innerText.trim() || null,
                                isp: cells[11]?.innerText.trim() || null,
                                bsp: cells[12]?.innerText.trim() || null,
                                ip_hi_lo: cells[13]?.innerText.trim() || null,
                                ips: cells[14]?.innerText.trim() || null,
                                finishing_speed: cells[15]?.innerText.trim() || null,
                                tfig: cells[16]?.innerText.trim() || null,
                                tfr: cells[17]?.innerText.trim() || null,
                                adj: cells[18]?.innerText.trim() || null
                            };
                            pastPerformances.push(performance);
                            console.log(`BROWSER CONSOLE: DEBUG - Added past performance for ${horseName}: ${performance.date} at ${performance.course}`);
                        }
                    });
                } else {
                    console.log(`BROWSER CONSOLE: DEBUG - No form box table found for ${horseName}`);
                }
            } else {
                console.log(`BROWSER CONSOLE: DEBUG - No horse ID found for ${horseName}`);
            }

            // Extract per-horse pacemap data (EPF positions 1-5)
            let pacemap_1 = null;
            let pacemap_2 = null;

            const paceMapData = allHorsePaceMaps[horseName];
            console.log(`BROWSER CONSOLE: DEBUG - Pace map data for ${horseName}: ${JSON.stringify(paceMapData)}`);

            if (paceMapData && paceMapData.length > 0) {
                // Sort by color level (darkest first)
                paceMapData.sort((a, b) => b.colorLevel - a.colorLevel);

                // Get the top two EPF positions and their values
                if (paceMapData[0]) {
                    pacemap_1 = `${paceMapData[0].epfPosition} ${paceMapData[0].value}`;
                }
                if (paceMapData[1]) {
                    pacemap_2 = `${paceMapData[1].epfPosition} ${paceMapData[1].value}`;
                }
            }
            console.log(`BROWSER CONSOLE: DEBUG - Final pacemap_1 for ${horseName}: ${pacemap_1}`);
            console.log(`BROWSER CONSOLE: DEBUG - Final pacemap_2 for ${horseName}: ${pacemap_2}`);

            // Extract other horse data from the row structure
            const jockeyElement = row.querySelector('tr.rp-horse-row-1 .rp-jockey a, tr.rp-horse-row-1 .rp-jockey');
            const trainerElement = row.querySelector('tr.rp-horse-row-1 .rp-trainer a, tr.rp-horse-row-1 .rp-trainer');
            const weightElement = row.querySelector('tr.rp-horse-row-1 .rp-weight, tr.rp-horse-row-1 [title*="weight"]');
            const ageElement = row.querySelector('tr.rp-horse-row-1 .rp-age, tr.rp-horse-row-1 [title*="age"]');
            const formElement = row.querySelector('tr.rp-horse-row-1 .rp-form, tr.rp-horse-row-1 [title*="form"]');
            const oddsElement = row.querySelector('tr.rp-horse-row-1 .rp-odds, tr.rp-horse-row-1 .price-decimal');
            const timeformRatingElement = row.querySelector('tr.rp-horse-row-1 .rp-rating, tr.rp-horse-row-1 .rp-tfr');

            runners.push({
                horseName,
                jockey: jockeyElement ? jockeyElement.innerText.trim() : null,
                trainer: trainerElement ? trainerElement.innerText.trim() : null,
                weight: weightElement ? weightElement.innerText.trim() : null,
                age: ageElement ? ageElement.innerText.trim() : null,
                form: formElement ? formElement.innerText.trim() : null,
                odds: oddsElement ? oddsElement.innerText.trim() : null,
                timeformRating: timeformRatingElement ? timeformRatingElement.innerText.trim() : null,
                pastPerformances,
                comment,
                bettingForecastOdds: null, // Will need to extract separately
                pacemap_1,
                pacemap_2
            });
            
            console.log(`BROWSER CONSOLE: DEBUG - Added runner: ${horseName} with ${pastPerformances.length} past performances`);
        });

        raceDataInBrowser.runners = runners;
        raceDataInBrowser.isFinished = isFinished;

        return raceDataInBrowser;
      }, raceData, currentUkTimeForBrowser); // Correct arguments passed to page.evaluate

      // After page.evaluate, process the 'data' object returned from the browser
      if (data.isFinished) {
        console.log(`Skipped finished race: ${data.course} (Race time: ${data.raceTime})`);
        return null;
      }

      console.log(`✅ Scraped data for ${raceUrl}`);
      return data; // Return the final scraped data from the Node.js function

    } catch (error) { // Outer catch block for the entire function
      console.error(`❌ Error scraping ${raceUrl}:`, error.message);
      return null;
    }
  }

  async scrapeAllRaces() {
    console.log('🎯 Starting to scrape all race data...');
    
    for (let i = 0; i < this.raceUrls.length; i++) {
      const raceUrl = this.raceUrls[i];
      console.log(`\n📍 Processing race ${i + 1}/${this.raceUrls.length}`);
      
      try {
        const raceData = await this.scrapeRaceData(raceUrl);
        if (raceData) {
          this.scrapedData.push(raceData);
        }
        
        // Add delay between requests to be respectful
        await delay(2000);
        
      } catch (error) {
        console.error(`❌ Error processing race ${i + 1}:`, error.message);
        continue;
      }
    }
    
    console.log(`\n🎉 Completed scraping ${this.scrapedData.length} races`);
  }

  async saveData() {
    const timestamp = new Date().toISOString().slice(0, 10);
    const dataFileName = `timeform-data-${timestamp}.json`;
    const summaryFileName = `timeform-summary-${timestamp}.json`;

    const racesSummary = this.scrapedData.map(race => ({
      course: race.course,
      raceTitle: race.raceTitle,
      raceTime: race.raceTime,
      runners: race.runners.length,
      url: race.url
    }));

    await fs.writeJson(dataFileName, this.scrapedData, { spaces: 2 });
    await fs.writeJson(summaryFileName, racesSummary, { spaces: 2 });
    console.log(`💾 Data saved to ${dataFileName}`);
    console.log(`📋 Summary saved to ${summaryFileName}`);
  }

  async cleanup() {
    console.log('🧹 Cleaning up browser...');
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
      console.log('✅ Browser closed.');
    }
  }

  async run() {
    try {
      await this.initialize();
      await this.login();
      await this.scrapeRacecardUrls();
      await this.scrapeAllRaces();
      await this.saveData();
      
    } catch (error) {
      console.error('❌ Scraper failed:', error.message);
      throw error;
      
    } finally {
      await this.cleanup();
    }
  }

  async scrapeTomorrowsRacecards() {
    console.log('🗓️ Navigating to tomorrow\'s racecards...');
    
    try {
      // Navigate to racecards page
      await this.page.goto(config.timeform.racecardsUrl, { 
        waitUntil: 'networkidle2', 
        timeout: config.puppeteer.timeout 
      });

      // Wait for the navigation buttons to be available
      await this.page.waitForSelector('.w-racecard-grid-nav-button', { timeout: config.puppeteer.timeout });

      // Click the "Tomorrow" button - use generic approach to find by text
      console.log('🔄 Looking for Tomorrow button...');
      const tomorrowClicked = await this.page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('.w-racecard-grid-nav-button'));
        const tomorrowBtn = buttons.find(btn => btn.textContent.trim() === 'Tomorrow');
        if (tomorrowBtn) {
          tomorrowBtn.click();
          return true;
        }
        return false;
      });
      
      if (tomorrowClicked) {
        console.log('✅ Successfully clicked Tomorrow button');
      } else {
        console.log('⚠️ Tomorrow button not found, may already be on tomorrow\'s page');
      }

      // Wait for the content to load
      await delay(3000);
      await this.page.waitForSelector('.w-racecard-grid-container', { timeout: config.puppeteer.timeout });

      // Ensure we're on GB & IRE region (should be default, but let's make sure)
      const gbIreButton = await this.page.$('button.w-course-region-tabs-button[data-region-id="0"]');
      if (gbIreButton) {
        await gbIreButton.click();
        await delay(2000);
      }

      // Extract all race URLs from GB & IRE region
      const raceUrls = await this.page.evaluate(() => {
        const urls = [];
        
        // Get all race links within the GB & IRE region
        const raceLinks = document.querySelectorAll('.w-racecard-grid-meeting-races a[href*="/horse-racing/racecards/"]');
        
        raceLinks.forEach(link => {
          const href = link.href;
          // Only include actual race pages, not meeting summaries
          if (href.includes('/horse-racing/racecards/') && 
              !href.includes('meeting-summary') && 
              !href.includes('racecourse')) {
            urls.push(href);
          }
        });
        
        return [...new Set(urls)]; // Return unique URLs
      });

      console.log(`✅ Found ${raceUrls.length} tomorrow's race URLs for GB & IRE`);
      this.raceUrls = raceUrls;
      return raceUrls;

    } catch (error) {
      console.error('❌ Error navigating to tomorrow\'s racecards:', error.message);
      throw error;
    }
  }

  async scrapeTomorrowsAllRaces() {
    console.log('🎯 Starting to scrape all tomorrow\'s race data...');
    
    for (let i = 0; i < this.raceUrls.length; i++) {
      const raceUrl = this.raceUrls[i];
      console.log(`\n📍 Processing race ${i + 1}/${this.raceUrls.length}: ${raceUrl}`);
      
      try {
        // Extract basic race info from URL for initial data
        const urlParts = raceUrl.split('/');
        const course = urlParts[5] || 'Unknown';
        const date = urlParts[6] || new Date().toISOString().slice(0, 10);
        const time = urlParts[7] || '0000';
        
        const raceTimeFromUrl = `${time.slice(0, 2)}:${time.slice(2, 4)}`;
        console.log(`📍 URL parsing for ${raceUrl}:`);
        console.log(`   Course: ${course}`);
        console.log(`   Date: ${date}`);
        console.log(`   Time from URL: ${time} -> ${raceTimeFromUrl}`);
        
        const initialRaceData = {
          url: raceUrl,
          course: course.charAt(0).toUpperCase() + course.slice(1).replace(/-/g, ' '),
          raceDate: date,
          raceTime: raceTimeFromUrl,
          runners: []
        };

        const raceData = await this.scrapeRaceData(raceUrl, initialRaceData);
        if (raceData) {
          this.scrapedData.push(raceData);
        }
        
        // Add delay between requests to be respectful
        await delay(2000);
        
      } catch (error) {
        console.error(`❌ Error processing race ${i + 1}:`, error.message);
        continue;
      }
    }
    
    console.log(`\n🎉 Completed scraping ${this.scrapedData.length} tomorrow's races`);
  }

  async saveTomorrowsData() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowDate = tomorrow.toISOString().slice(0, 10);
    
    const dataFileName = `tomorrows-timeform-data-${tomorrowDate}.json`;
    const summaryFileName = `tomorrows-timeform-summary-${tomorrowDate}.json`;

    const racesSummary = this.scrapedData.map(race => ({
      course: race.course,
      raceTitle: race.raceTitle,
      raceTime: race.raceTime,
      runners: race.runners.length,
      url: race.url
    }));

    await fs.writeJson(dataFileName, this.scrapedData, { spaces: 2 });
    await fs.writeJson(summaryFileName, racesSummary, { spaces: 2 });
    console.log(`💾 Tomorrow's data saved to ${dataFileName}`);
    console.log(`📋 Tomorrow's summary saved to ${summaryFileName}`);
  }

  async runTomorrowsScraper() {
    try {
      await this.initialize();
      await this.login();
      await this.scrapeTomorrowsRacecards();
      await this.scrapeTomorrowsAllRaces();
      await this.saveTomorrowsData();
      
      // Upload to Supabase (production-ready)
      await this.uploadToSupabase();
      
    } catch (error) {
      console.error('❌ Tomorrow\'s scraper failed:', error.message);
      throw error;
      
    } finally {
      await this.cleanup();
    }
  }

  async runTodaysScraper() {
    try {
      await this.initialize();
      await this.login();
      await this.scrapeTodaysRacecards();
      await this.scrapeTodaysAllRaces();
      await this.saveTodaysData();
      
      // Upload to Supabase
      await this.uploadToSupabase();
      
    } catch (error) {
      console.error('❌ Today\'s scraper failed:', error.message);
      throw error;
      
    } finally {
      await this.cleanup();
    }
  }

  async scrapeTodaysRacecards() {
    console.log('📅 Navigating to today\'s racecards...');
    
    try {
      // Navigate to racecards page
      await this.page.goto(config.timeform.racecardsUrl, { 
        waitUntil: 'networkidle2', 
        timeout: config.puppeteer.timeout 
      });

      // Wait for the navigation buttons to be available
      await this.page.waitForSelector('.w-racecard-grid-nav-button', { timeout: config.puppeteer.timeout });

      // Click the "Today" button (should be active by default but let's make sure)
      const todayButton = await this.page.$('button.w-racecard-grid-nav-button:not(.w-racecard-grid-active)');
      if (todayButton) {
        const buttonText = await this.page.evaluate(el => el.textContent.trim(), todayButton);
        if (buttonText === 'Today') {
          await todayButton.click();
          console.log('✅ Clicked Today button');
          await delay(2000);
        }
      }

      // Wait for the content to load
      await delay(3000);
      await this.page.waitForSelector('.w-racecard-grid-container', { timeout: config.puppeteer.timeout });

      // Ensure we're on GB & IRE region (should be default, but let's make sure)
      const gbIreButton = await this.page.$('button.w-course-region-tabs-button[data-region-id="0"]');
      if (gbIreButton) {
        await gbIreButton.click();
        await delay(2000);
      }

      // Extract all race URLs from GB & IRE region
      const raceUrls = await this.page.evaluate(() => {
        const urls = [];
        
        // Get all race links within the GB & IRE region
        const raceLinks = document.querySelectorAll('.w-racecard-grid-meeting-races a[href*="/horse-racing/racecards/"]');
        
        raceLinks.forEach(link => {
          const href = link.href;
          // Only include actual race pages, not meeting summaries
          if (href.includes('/horse-racing/racecards/') && 
              !href.includes('meeting-summary') && 
              !href.includes('racecourse')) {
            urls.push(href);
          }
        });
        
        return [...new Set(urls)]; // Return unique URLs
      });

      console.log(`✅ Found ${raceUrls.length} today's race URLs for GB & IRE`);
      this.raceUrls = raceUrls;
      return raceUrls;

    } catch (error) {
      console.error('❌ Error navigating to today\'s racecards:', error.message);
      throw error;
    }
  }

  async scrapeTodaysAllRaces() {
    console.log('🎯 Starting to scrape all today\'s race data...');
    
    for (let i = 0; i < this.raceUrls.length; i++) {
      const raceUrl = this.raceUrls[i];
      console.log(`\n📍 Processing race ${i + 1}/${this.raceUrls.length}: ${raceUrl}`);
      
      try {
        // Extract basic race info from URL for initial data
        const urlParts = raceUrl.split('/');
        const course = urlParts[5] || 'Unknown';
        const date = urlParts[6] || new Date().toISOString().slice(0, 10);
        const time = urlParts[7] || '0000';
        
        const raceTimeFromUrl = `${time.slice(0, 2)}:${time.slice(2, 4)}`;
        console.log(`📍 URL parsing for ${raceUrl}:`);
        console.log(`   Course: ${course}`);
        console.log(`   Date: ${date}`);
        console.log(`   Time from URL: ${time} -> ${raceTimeFromUrl}`);
        
        const initialRaceData = {
          url: raceUrl,
          course: course.charAt(0).toUpperCase() + course.slice(1).replace(/-/g, ' '),
          raceDate: date,
          raceTime: raceTimeFromUrl,
          runners: []
        };

        const raceData = await this.scrapeRaceData(raceUrl, initialRaceData);
        if (raceData) {
          this.scrapedData.push(raceData);
        }
        
        // Add delay between requests to be respectful
        await delay(2000);
        
      } catch (error) {
        console.error(`❌ Error processing race ${i + 1}:`, error.message);
        continue;
      }
    }
    
    console.log(`\n🎉 Completed scraping ${this.scrapedData.length} today's races`);
  }

  async saveTodaysData() {
    const today = new Date().toISOString().slice(0, 10);
    
    const dataFileName = `todays-timeform-data-${today}.json`;
    const summaryFileName = `todays-timeform-summary-${today}.json`;

    const racesSummary = this.scrapedData.map(race => ({
      course: race.course,
      raceTitle: race.raceTitle,
      raceTime: race.raceTime,
      runners: race.runners.length,
      url: race.url
    }));

    await fs.writeJson(dataFileName, this.scrapedData, { spaces: 2 });
    await fs.writeJson(summaryFileName, racesSummary, { spaces: 2 });
    console.log(`💾 Today's data saved to ${dataFileName}`);
    console.log(`📋 Today's summary saved to ${summaryFileName}`);
  }

  async uploadToSupabase() {
    console.log('🚀 Starting Supabase upload...');
    
    if (!this.scrapedData || this.scrapedData.length === 0) {
      console.log('⚠️  No data to upload to Supabase');
      return;
    }

    let totalInserted = 0;
    let totalErrors = 0;

    for (const raceData of this.scrapedData) {
      try {
        // Step 1: Find the race_id from the races table
        const raceId = await this.findRaceId(raceData);
        
        if (!raceId) {
          console.log(`\n❌ RACE NOT FOUND:`);
          console.log(`   Race: ${raceData.course} ${raceData.raceTime} on ${raceData.raceDate}`);
          console.log(`   Could not match race in database`);
          console.log(`   ═══════════════════════════════════════\n`);
          totalErrors++;
          continue;
        }

        // Step 2: Process each runner  
        for (const runner of raceData.runners) {
          try {
            // Find the horse_id from the runners table
            const horseId = await this.findHorseId(raceId, runner.horseName);
            
            if (!horseId) {
              // Try reverse lookup - search for horse name across all races on same date and course
              console.log(`🔄 Attempting reverse lookup for ${runner.horseName}...`);
              const reverseHorseId = await this.reverseHorseLookup(runner.horseName, raceData);
              
              if (reverseHorseId) {
                console.log(`✅ REVERSE LOOKUP SUCCESS: Found ${runner.horseName} via fallback method`);
                
                // Use the reverse-found horse_id and continue processing
                const timeformRecord = this.prepareTimeformRecord(raceData, runner, reverseHorseId.race_id, reverseHorseId.horse_id);

                const { data: upsertData, error } = await supabase
                  .from('timeform')
                  .upsert(timeformRecord, {
                    onConflict: 'race_id,horse_id',
                    ignoreDuplicates: false
                  })
                  .select();

                if (error) {
                  console.error(`\n❌ DATABASE ERROR (Reverse Lookup):`);
                  console.error(`   Horse: ${runner.horseName}`);
                  console.error(`   Race: ${raceData.course} ${raceData.raceTime}`);
                  console.error(`   Error: ${error.message}`);
                  console.error(`   ═══════════════════════════════════════\n`);
                  totalErrors++;
                } else {
                  totalInserted++;
                }
                continue;
              }
              
              // If reverse lookup failed, log detailed error
              console.log(`\n❌ MISSING HORSE ERROR:`);
              console.log(`   Horse Name: "${runner.horseName}"`);
              console.log(`   Race: ${raceData.course} ${raceData.raceTime} on ${raceData.raceDate}`);
              console.log(`   Race ID: ${raceId}`);
              console.log(`   Timeform shows ${raceData.runners.length} runners in this race`);
              
              // Get all horses in this race from database
              const { data: allRunners, error: runnersError } = await supabase
                .from('runners')
                .select('horse_name, horse_id')
                .eq('race_id', raceId);
              
              if (runnersError) {
                console.log(`   Database Error: ${runnersError.message}`);
              } else if (allRunners && allRunners.length > 0) {
                console.log(`   Database shows ${allRunners.length} runners for this race:`);
                allRunners.forEach((r, idx) => {
                  console.log(`   ${idx + 1}. "${r.horse_name}" (${r.horse_id})`);
                });
                
                // Check for potential name matching issues
                const exactMatch = allRunners.find(r => r.horse_name === runner.horseName);
                const caseInsensitiveMatch = allRunners.find(r => 
                  r.horse_name.toLowerCase() === runner.horseName.toLowerCase()
                );
                const partialMatches = allRunners.filter(r => {
                  const dbName = r.horse_name.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim();
                  const timeformName = runner.horseName.toLowerCase().replace(/\s*\([^)]*\)\s*/g, '').trim();
                  return dbName.includes(timeformName.substring(0, Math.min(5, timeformName.length))) ||
                         timeformName.includes(dbName.substring(0, Math.min(5, dbName.length)));
                });
                
                if (exactMatch) {
                  console.log(`   ⚠️  EXACT MATCH FOUND but not detected by script: "${exactMatch.horse_name}"`);
                } else if (caseInsensitiveMatch) {
                  console.log(`   ⚠️  CASE-INSENSITIVE MATCH: "${caseInsensitiveMatch.horse_name}"`);
                } else if (partialMatches.length > 0) {
                  console.log(`   🔍 POTENTIAL MATCHES:`);
                  partialMatches.forEach(m => console.log(`      - "${m.horse_name}"`));
                } else {
                  console.log(`   ❌ NO SIMILAR NAMES FOUND - Likely non-runner or late entry`);
                }
              } else {
                console.log(`   ❌ Database shows NO runners for this race - Database sync issue`);
              }
              
              // Additional horse details from Timeform
              if (runner.age || runner.form || runner.odds) {
                console.log(`   Timeform Details: Age=${runner.age}, Form="${runner.form}", Odds=${runner.odds}`);
              }
              
              console.log(`   ═══════════════════════════════════════\n`);
              
              totalErrors++;
              continue;
            }

            // Step 3: Prepare the Timeform record
            const timeformRecord = this.prepareTimeformRecord(raceData, runner, raceId, horseId);

            // Step 4: Upsert into Timeform table (handles duplicates)
            const { data: upsertData, error } = await supabase
              .from('timeform')
              .upsert(timeformRecord, {
                onConflict: 'race_id,horse_id',
                ignoreDuplicates: false // This will update existing records
              })
              .select();

            if (error) {
              console.error(`\n❌ DATABASE ERROR:`);
              console.error(`   Horse: ${runner.horseName}`);
              console.error(`   Race: ${raceData.course} ${raceData.raceTime}`);
              console.error(`   Error: ${error.message}`);
              console.error(`   Record data:`, JSON.stringify(timeformRecord, null, 2));
              console.error(`   ═══════════════════════════════════════\n`);
              totalErrors++;
            } else {
              totalInserted++;
            }

          } catch (error) {
            console.error(`❌ Error processing runner ${runner.horseName}:`, error.message);
            console.error(`🔍 Stack trace:`, error.stack);
            totalErrors++;
          }
        }

      } catch (error) {
        console.error(`❌ Error processing race ${raceData.course}:`, error.message);
        totalErrors++;
      }
    }

    console.log(`\n🎊 Supabase upload completed!`);
    console.log(`✅ Successfully inserted: ${totalInserted} records`);
    console.log(`❌ Errors: ${totalErrors} records`);
  }

  async findRaceId(raceData) {
    try {
      // Convert race time from 24h to 12h format for database matching
      const timeFormats = this.generateTimeFormats(raceData.raceTime);
      
      // Generate course name variations for better matching
      const courseVariations = this.generateCourseVariations(raceData.course);

      // Try different combinations of course names and time formats
      for (const courseName of courseVariations) {
        for (const timeFormat of timeFormats) {
          const { data, error } = await supabase
            .from('races')
            .select('race_id, course, off_time')
            .ilike('course', `%${courseName}%`)
            .eq('race_date', raceData.raceDate)
            .eq('off_time', timeFormat)
            .limit(1);

          if (error) {
            continue;
          }

          if (data && data.length > 0) {
            return data[0].race_id;
          }
        }
      }

      // Fallback - try fuzzy matching without time
      for (const courseName of courseVariations) {
        const { data, error } = await supabase
          .from('races')
          .select('race_id, course, off_time')
          .ilike('course', `%${courseName}%`)
          .eq('race_date', raceData.raceDate)
          .limit(5);

        if (!error && data && data.length > 0) {
          // Try to find the closest time match
          const targetTime = this.parseTimeToMinutes(raceData.raceTime);
          let bestMatch = null;
          let smallestDiff = Infinity;
          
          for (const race of data) {
            const dbTime = this.parseTimeToMinutes(race.off_time);
            const diff = Math.abs(targetTime - dbTime);
            if (diff < smallestDiff) {
              smallestDiff = diff;
              bestMatch = race;
            }
          }
          
          if (bestMatch && smallestDiff <= 30) { // Within 30 minutes
            return bestMatch.race_id;
          }
        }
      }

      // Final fallback - use advanced fuzzy track name matching
      const fuzzyMatchId = await this.fuzzyTrackMatch(
        raceData.course, 
        raceData.raceDate, 
        raceData.raceTime
      );
      
      if (fuzzyMatchId) {
        return fuzzyMatchId;
      }

      return null;

    } catch (error) {
      console.error('❌ Error in findRaceId:', error.message);
      return null;
    }
  }

  generateTimeFormats(time24h) {
    // Convert from 24h format (e.g., "15:15") to various formats
    const [hours, minutes] = time24h.split(':').map(Number);
    
    const formats = [];
    
    // 24h format (original)
    formats.push(time24h);
    
    // 12h format without leading zero (e.g., "3:15")
    if (hours > 12) {
      formats.push(`${hours - 12}:${minutes.toString().padStart(2, '0')}`);
    } else if (hours === 0) {
      formats.push(`12:${minutes.toString().padStart(2, '0')}`);
    } else {
      formats.push(`${hours}:${minutes.toString().padStart(2, '0')}`);
    }
    
    // 12h format with leading zero (e.g., "03:15")
    if (hours > 12) {
      formats.push(`${(hours - 12).toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    } else if (hours === 0) {
      formats.push(`12:${minutes.toString().padStart(2, '0')}`);
    } else {
      formats.push(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    }
    
    return [...new Set(formats)]; // Remove duplicates
  }

  generateCourseVariations(courseName) {
    const variations = [];
    
    // Original name
    variations.push(courseName);
    
    // Lowercase
    variations.push(courseName.toLowerCase());
    
    // Title case
    variations.push(courseName.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()));
    
    // Remove common suffixes/prefixes
    const cleaned = courseName
      .replace(/\s*\([^)]*\)\s*/g, '') // Remove (IRE), (GER), (AW), etc.
      .replace(/\s+PARK$/i, '') // Remove PARK suffix
      .replace(/\s+RACECOURSE$/i, '') // Remove RACECOURSE suffix
      .replace(/-ON-DEE$/i, '') // Handle Bangor-on-Dee
      .trim();
    
    if (cleaned !== courseName) {
      variations.push(cleaned);
      variations.push(cleaned.toLowerCase());
      variations.push(cleaned.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()));
    }
    
    // Extract the main location name (first word) for fuzzy matching
    // This helps with cases like "Stratford-on-Avon" -> "Stratford"
    const mainLocation = courseName.split(/[\s-]+/)[0].trim();
    if (mainLocation && mainLocation.length > 3 && mainLocation !== courseName) {
      variations.push(mainLocation);
      variations.push(mainLocation.toLowerCase());
      variations.push(mainLocation.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()));
    }
    
    // Handle specific course name mappings
    const courseMap = {
      'NEWMARKET (JULY)': ['Newmarket', 'Newmarket July'],
      'LINGFIELD PARK': ['Lingfield'],
      'HAYDOCK PARK': ['Haydock'],
      'BANGOR-ON-DEE': ['Bangor'],
      'DOWN ROYAL': ['Down Royal'],
      'LIMERICK': ['Limerick'],
      'CHELMSFORD CITY': ['Chelmsford', 'Chelmsford (AW)'],
      'STRATFORD-ON-AVON': ['Stratford', 'Stratford Upon Avon'],
      'NEWTON ABBOT': ['Newton Abbot'],
      'SOUTHWELL': ['Southwell', 'Southwell (AW)'],
      'WOLVERHAMPTON': ['Wolverhampton', 'Wolverhampton (AW)']
    };
    
    const upperCourseName = courseName.toUpperCase();
    if (courseMap[upperCourseName]) {
      variations.push(...courseMap[upperCourseName]);
    }
    
    // Try to handle any track with "CITY" in the name
    if (upperCourseName.includes(' CITY')) {
      const withoutCity = upperCourseName.replace(' CITY', '');
      variations.push(withoutCity);
      variations.push(withoutCity.toLowerCase());
      variations.push(withoutCity.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()));
    }
    
    // Try to handle any track with "-ON-" in the name
    if (upperCourseName.includes('-ON-')) {
      const beforeOn = upperCourseName.split('-ON-')[0];
      variations.push(beforeOn);
      variations.push(beforeOn.toLowerCase());
      variations.push(beforeOn.toLowerCase().replace(/\b\w/g, l => l.toUpperCase()));
    }
    
    return [...new Set(variations)]; // Remove duplicates
  }

  // Calculate similarity between two strings (0-100%)
  calculateStringSimilarity(str1, str2) {
    if (!str1 || !str2) return 0;
    
    // Convert both strings to lowercase for case-insensitive comparison
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    
    // If strings are identical, return 100%
    if (s1 === s2) return 100;
    
    // Calculate Levenshtein distance
    const track = Array(s2.length + 1).fill(null).map(() => 
      Array(s1.length + 1).fill(null));
    
    for (let i = 0; i <= s1.length; i += 1) {
      track[0][i] = i;
    }
    
    for (let j = 0; j <= s2.length; j += 1) {
      track[j][0] = j;
    }
    
    for (let j = 1; j <= s2.length; j += 1) {
      for (let i = 1; i <= s1.length; i += 1) {
        const indicator = s1[i - 1] === s2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator, // substitution
        );
      }
    }
    
    // Calculate similarity as percentage (100% - normalized distance)
    const maxLength = Math.max(s1.length, s2.length);
    const distance = track[s2.length][s1.length];
    return Math.round((1 - distance / maxLength) * 100);
  }
  
  // Fuzzy track name matching as a fallback
  async fuzzyTrackMatch(courseName, raceDate, raceTime) {
    try {
      console.log(`🔍 Attempting fuzzy track name matching for "${courseName}"...`);
      
      // Get all races for the specific date
      const { data, error } = await supabase
        .from('races')
        .select('race_id, course, off_time')
        .eq('race_date', raceDate)
        .order('off_time', { ascending: true });
      
      if (error || !data || data.length === 0) {
        console.log(`   ❌ No races found for date ${raceDate}`);
        return null;
      }
      
      // Extract the main location part (first word) of the course name
      const mainLocation = courseName.split(/[\s-]+/)[0].trim().toLowerCase();
      
      // First try to find courses that contain the main location name
      const locationMatches = data.filter(race => 
        race.course.toLowerCase().includes(mainLocation)
      );
      
      if (locationMatches.length > 0) {
        console.log(`   ✅ Found ${locationMatches.length} potential matches by location name "${mainLocation}"`);
        
        // If we have location matches, find the closest time match
        const timeFormats = this.generateTimeFormats(raceTime);
        const timeMatch = locationMatches.find(race => 
          timeFormats.includes(race.off_time)
        );
        
        if (timeMatch) {
          console.log(`   ✅ MATCH FOUND: "${courseName}" → "${timeMatch.course}" at ${timeMatch.off_time}`);
          return timeMatch.race_id;
        }
        
        // If no exact time match, return the first location match
        console.log(`   ⚠️  No exact time match, using first location match: "${locationMatches[0].course}"`);
        return locationMatches[0].race_id;
      }
      
      // If no location matches, try fuzzy string matching on all courses for that day
      console.log(`   🔍 No location matches, trying fuzzy string matching...`);
      let bestMatch = null;
      let highestSimilarity = 0;
      
      for (const race of data) {
        // Calculate string similarity between course names
        const similarity = this.calculateStringSimilarity(courseName, race.course);
        
        // Consider it a match if similarity is above 70%
        if (similarity > highestSimilarity && similarity >= 70) {
          highestSimilarity = similarity;
          bestMatch = race;
        }
      }
      
      if (bestMatch) {
        console.log(`   ✅ FUZZY MATCH: "${courseName}" → "${bestMatch.course}" (${highestSimilarity}% similar)`);
        return bestMatch.race_id;
      }
      
      console.log(`   ❌ No fuzzy matches found above 70% similarity threshold`);
      return null;
      
    } catch (error) {
      console.error('   ❌ Error in fuzzyTrackMatch:', error.message);
      return null;
    }
  }

  parseTimeToMinutes(timeString) {
    if (!timeString) return 0;
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  async findHorseId(raceId, horseName) {
    try {
      // Try exact match first
      const { data, error } = await supabase
        .from('runners')
        .select('horse_id')
        .eq('race_id', raceId)
        .ilike('horse_name', horseName)
        .limit(1);

      if (error) {
        return null;
      }

      if (data && data.length > 0) {
        return data[0].horse_id;
      }

      // Try fuzzy matching for horse names
      const { data: data2, error: error2 } = await supabase
        .from('runners')
        .select('horse_id, horse_name')
        .eq('race_id', raceId);

      if (!error2 && data2) {
        // Simple fuzzy matching - remove common suffixes and prefixes
        const cleanHorseName = horseName.replace(/\s*\([^)]*\)\s*/g, '').trim();
        
        for (const runner of data2) {
          const cleanRunnerName = runner.horse_name.replace(/\s*\([^)]*\)\s*/g, '').trim();
          if (cleanRunnerName.toLowerCase() === cleanHorseName.toLowerCase()) {
            return runner.horse_id;
          }
        }
      }

      return null;

    } catch (error) {
      return null;
    }
  }

  // Reverse lookup method - search for horse name across all races on same date and course
  async reverseHorseLookup(horseName, raceData) {
    try {
      console.log(`   🔍 Searching for "${horseName}" across all races on ${raceData.raceDate} at ${raceData.course}...`);
      
      // Generate course name variations for better matching
      const courseVariations = this.generateCourseVariations(raceData.course);
      
      // Search for horse name in runners table, joined with races table
      for (const courseName of courseVariations) {
        const { data, error } = await supabase
          .from('runners')
          .select(`
            horse_id,
            horse_name,
            race_id,
            races (
              race_id,
              course,
              race_date,
              off_time
            )
          `)
          .ilike('horse_name', horseName)
          .eq('races.race_date', raceData.raceDate)
          .ilike('races.course', `%${courseName}%`)
          .limit(5);

        if (error) {
          console.log(`   ⚠️  Database error in reverse lookup: ${error.message}`);
          continue;
        }

        if (data && data.length > 0) {
          console.log(`   🔍 Found ${data.length} potential matches for "${horseName}":`);
          
          for (const match of data) {
            // Skip if race data is null (shouldn't happen with proper join)
            if (!match.races) {
              console.log(`      - "${match.horse_name}" (no race data)`);
              continue;
            }
            
            console.log(`      - "${match.horse_name}" in ${match.races.course} ${match.races.off_time}`);
            
            // Check if this is the same course (allowing for variations)
            const isMatchingCourse = courseVariations.some(variation => 
              match.races.course.toLowerCase().includes(variation.toLowerCase()) ||
              variation.toLowerCase().includes(match.races.course.toLowerCase())
            );
            
            if (isMatchingCourse && match.races.race_date === raceData.raceDate) {
              // Exact name match on same date and course - likely the correct horse
              if (match.horse_name.toLowerCase() === horseName.toLowerCase()) {
                console.log(`   ✅ EXACT MATCH: Using "${match.horse_name}" from ${match.races.course} ${match.races.off_time}`);
                return {
                  horse_id: match.horse_id,
                  race_id: match.race_id
                };
              }
              
              // Fuzzy name match - remove country codes and check
              const cleanDbName = match.horse_name.replace(/\s*\([^)]*\)\s*/g, '').trim().toLowerCase();
              const cleanTimeformName = horseName.replace(/\s*\([^)]*\)\s*/g, '').trim().toLowerCase();
              
              if (cleanDbName === cleanTimeformName) {
                console.log(`   ✅ FUZZY MATCH: Using "${match.horse_name}" from ${match.races.course} ${match.races.off_time}`);
                return {
                  horse_id: match.horse_id,
                  race_id: match.race_id
                };
              }
            }
          }
        }
      }
      
      console.log(`   ❌ No reverse lookup matches found for "${horseName}"`);
      return null;

    } catch (error) {
      console.log(`   ⚠️  Error in reverse lookup: ${error.message}`);
      return null;
    }
  }

  prepareTimeformRecord(raceData, runner, raceId, horseId) {
    const record = {
      race_id: raceId,
      horse_id: horseId,
      horse_name: runner.horseName,
      track: raceData.course,
      date: raceData.raceDate,
      race_time: raceData.raceTime,
      timeform_rating: runner.timeformRating || null,
      
      // Horse-specific pacemap data
      pacemap_1: runner.pacemap_1 || null,
      pacemap_2: runner.pacemap_2 || null,
      
      comment: runner.comment || null,
      betting_forecast_odds: runner.bettingForecastOdds || null,
      
      // Race-level pace analysis fields (same for all horses in the race)
      pace_forecast: raceData.paceForecast || null,
      draw_bias: raceData.drawBias || null,
      specific_pace_hint: raceData.specificPaceHint || null
    };

    // Add past performance data (up to 6 performances)
    if (runner.pastPerformances && runner.pastPerformances.length > 0) {
      runner.pastPerformances.slice(0, 6).forEach((pp, index) => {
        const ppNum = index + 1;
        
        // Parse date from "17 May 25" format
        record[`pp_${ppNum}_date`] = this.parseTimeformDate(pp.date) || null;
        
        // Extract course abbreviation from "course" field
        record[`pp_${ppNum}_track`] = pp.course || null;
        
        // Keep result as is (e.g., "4/7")
        record[`pp_${ppNum}_result`] = pp.result || null;
        
        // Extract beaten_by distance
        record[`pp_${ppNum}_btn`] = pp.beaten_by || null;
        
        // Keep type as is (e.g., "Turf")
        record[`pp_${ppNum}_type`] = pp.type || null;
        
        // Extract official_rating (e.g., "G3", "M", "85")
        record[`pp_${ppNum}_or`] = pp.official_rating || null;
        
        // Extract numeric distance from "distance" (e.g., "12f" -> "12")
        record[`pp_${ppNum}_dis`] = this.extractDistance(pp.distance) || null;
        
        // Keep going as is
        record[`pp_${ppNum}_going`] = pp.going || null;
        
        // Extract equipment (null, "(s)", etc.)
        record[`pp_${ppNum}_eq`] = pp.equipment || null;
        
        // Keep jockey as is
        record[`pp_${ppNum}_jockey`] = pp.jockey || null;
        
        // Keep ISP as is
        record[`pp_${ppNum}_isp`] = pp.isp || null;
        
        // Keep BSP as is
        record[`pp_${ppNum}_bsp`] = pp.bsp || null;
        
        // Extract ip_hi_lo exactly as is
        record[`pp_${ppNum}_iphilo`] = pp.ip_hi_lo || null;
        
        // Keep IPS as is
        record[`pp_${ppNum}_ips`] = pp.ips || null;
        
        // Extract finishing_speed numeric value
        record[`pp_${ppNum}_fs`] = pp.finishing_speed || null;
        
        // Keep TFIG as is
        record[`pp_${ppNum}_tfig`] = pp.tfig || null;
        
        // Keep TFR as is
        record[`pp_${ppNum}_tfr`] = pp.tfr || null;
        
        // Keep ADJ as is
        record[`pp_${ppNum}_adj`] = pp.adj || null;
      });
    }

    return record;
  }

  parseDate(dateString) {
    if (!dateString) return null;
    
    try {
      // Handle various date formats
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return null;
      }
      return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
    } catch (error) {
      return null;
    }
  }

  parseTimeformDate(dateString) {
    if (!dateString) return null;
    
    try {
      // Handle Timeform date format: "17 May 25" -> "2025-05-17"
      const parts = dateString.trim().split(' ');
      if (parts.length !== 3) return null;
      
      const day = parts[0].padStart(2, '0');
      const monthName = parts[1];
      const year = '20' + parts[2]; // Convert "25" to "2025"
      
      const monthMap = {
        'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
        'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
        'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
      };
      
      const month = monthMap[monthName];
      if (!month) return null;
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error parsing Timeform date:', dateString, error);
      return null;
    }
  }

  extractDistance(distanceString) {
    if (!distanceString) return null;
    
    try {
      // Extract numeric part from distance strings like "12f", "1m 4f", "6f", etc.
      const match = distanceString.match(/^(\d+(?:\.\d+)?)/);
      return match ? match[1] : null;
    } catch (error) {
      return null;
    }
  }
}

// Run the scraper if this file is executed directly
if (require.main === module) {
  const scraper = new TimeformScraper();
  
  scraper.run()
    .then(() => {
      console.log('🎊 Scraping completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Scraping failed:', error);
      process.exit(1);
    });
}

module.exports = TimeformScraper; 