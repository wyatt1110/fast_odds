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
    
    this.browser = await puppeteer.launch({
      headless: config.puppeteer.headless,
      slowMo: config.puppeteer.slowMo,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    this.page = await this.browser.newPage();
    
    // Set a realistic user agent
    await this.page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set viewport
    await this.page.setViewport({ width: 1920, height: 1080 });

    // Listen for console messages from the browser context
    this.page.on('console', msg => {
      for (let i = 0; i < msg.args().length; ++i) {
        console.log(`BROWSER CONSOLE: ${msg.args()[i]}`);
      }
    });
    
    console.log('✅ Browser initialized');
  }

  async login() {
    console.log('🔐 Logging into Timeform...');
    
    try {
      // Navigate to racecards page directly for login
      await this.page.goto(config.timeform.racecardsUrl, { 
        waitUntil: 'networkidle2',
        timeout: config.puppeteer.timeout 
      });

      // Look for sign in button/link
      const signInSelector = 'a[href*="/account/sign-in"]';
      await this.page.waitForSelector(signInSelector, { timeout: config.puppeteer.timeout });
      
      // Add a small delay to ensure element is fully interactive
      await delay(1000);

      // Click sign in using evaluate for more robustness
      await this.page.evaluate((selector) => {
        document.querySelector(selector)?.click();
      }, signInSelector);
      
      // Take screenshot and save HTML immediately after sign-in click
      await this.page.screenshot({ path: 'login-step1-after-signin-click.png', fullPage: true });
      const htmlAfterSignInClick = await this.page.content();
      fs.writeFileSync('login-after-signin-click.html', htmlAfterSignInClick);
      console.log('Page HTML after sign-in click saved to login-after-signin-click.html');

      // Wait for email input (assuming login form appears on the new login page)
      const emailSelector = 'input[id="EmailAddress"]';
      await this.page.waitForSelector(emailSelector, { timeout: config.puppeteer.timeout });
      await this.page.type(emailSelector, config.timeform.email);
      await this.page.screenshot({ path: 'login-step2-after-email.png', fullPage: true });

      // Wait for password input
      const passwordSelector = 'input[id="Password"]';
      await this.page.waitForSelector(passwordSelector, { timeout: config.puppeteer.timeout });
      await this.page.type(passwordSelector, config.timeform.password);
      await this.page.screenshot({ path: 'login-step3-after-password.png', fullPage: true });

      // Submit login form
      const submitSelector = 'input[type="submit"][value="Sign In"]';
      await this.page.click(submitSelector);
      
      // Wait for a common element on the page after successful login, or wait for the login form to disappear.
      // For now, let's wait for the login form to disappear, or a new element that indicates successful login.
      // Example: wait for 'My Account' link or a specific element on the racecards page after login redirects.
      await this.page.waitForFunction(() => {
        return document.querySelector('input[id="EmailAddress"]') === null;
      }, { timeout: config.puppeteer.timeout });
      console.log('✅ Login successful!');

    } catch (error) {
      console.error('❌ Login failed:', error.message);
      await this.page.screenshot({ path: 'login-failed.png', fullPage: true });
      throw error;
    }
  }