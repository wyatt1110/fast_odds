// Configuration for Timeform scraper
module.exports = {
  timeform: {
    email: process.env.TIMEFORM_EMAIL || 'miles.wigby@gmail.com',
    password: process.env.TIMEFORM_PASSWORD || 'Wiggers10',
    baseUrl: 'https://www.timeform.com',
    racecardsUrl: 'https://www.timeform.com/horse-racing/racecards'
  },
  puppeteer: {
    headless: process.env.NODE_ENV === 'production' ? true : true, // Always headless for cloud
    slowMo: process.env.NODE_ENV === 'production' ? 0 : 100,      // No slow mo in production
    timeout: 60000,   // 60 second timeout
    args: process.env.NODE_ENV === 'production' ? [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu'
    ] : []
  },
  supabase: {
    url: process.env.SUPABASE_URL || 'https://gwvnmzflxttdlhrkejmy.supabase.co',
    serviceRoleKey: process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3dm5temZseHR0ZGxocmtlam15Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMzkwODc5NSwiZXhwIjoyMDQ5NDg0Nzk1fQ.5FcuTSXJJLGhfnAVhOEKACTBGCxiDMdMIQeOR2n19eI',
  },
}; 