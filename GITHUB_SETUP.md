# 🚀 GitHub Repository Setup Instructions

## 📁 Upload Files to GitHub

1. **Navigate to your repository**: https://github.com/wyatt1110/fast_odds

2. **Create the timeform-scraper directory** and upload these files:
   ```
   timeform-scraper/
   ├── .github/workflows/manual-test.yml
   ├── .gitignore
   ├── config.js
   ├── Dockerfile
   ├── package.json
   ├── README.md
   ├── scraper.js
   └── timeform-scraper.js
   ```

## 🔐 Set Up GitHub Secrets

Go to your repository **Settings** → **Secrets and variables** → **Actions** and add these secrets:

### Required Secrets:
- `TIMEFORM_EMAIL`: Your Timeform login email
- `TIMEFORM_PASSWORD`: Your Timeform login password  
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_KEY`: Your Supabase service role key

## 🧪 Manual Testing

1. **Go to Actions tab** in your GitHub repository
2. **Click "Manual Timeform Scraper Test"** workflow
3. **Click "Run workflow"** button
4. **Choose debug mode** (optional) and click "Run workflow"

## 📊 What the Test Does

The manual test workflow will:
- ✅ Set up Node.js 18 environment
- ✅ Install all dependencies including Puppeteer
- ✅ Install required system packages for browser automation
- ✅ Run the Timeform scraper for tomorrow's racecards
- ✅ Show detailed logging and error information
- ✅ Upload logs as artifacts if the test fails
- ✅ Provide a comprehensive test summary

## 📋 Expected Test Results

### ✅ Successful Test:
```
🎯 Target date: Tomorrow's races
🔄 Looking for Tomorrow button...
✅ Successfully clicked Tomorrow button
✅ Found X tomorrow's race URLs for GB & IRE
🎊 Supabase upload completed!
✅ Successfully inserted: X records
❌ Errors: X records
```

### ❌ Common Issues:
- **Missing secrets**: Environment variables not set
- **Timeform login**: Incorrect credentials or site changes
- **Network issues**: Connectivity problems
- **Browser issues**: Puppeteer configuration problems

## 🔧 Troubleshooting

### If the test fails:
1. **Check the logs** in the GitHub Actions run
2. **Download artifacts** for detailed error information
3. **Verify secrets** are set correctly
4. **Check Timeform website** for any changes

### Common fixes:
- Ensure all secrets are set with correct values
- Verify Timeform credentials work manually
- Check if Timeform website structure changed
- Confirm Supabase connection details

## 🚀 Next Steps

Once manual testing is successful:
1. **Set up Railway deployment** for automated scheduling
2. **Configure cron jobs** for daily execution
3. **Monitor production runs** for any issues
4. **Set up alerts** for failed runs

## 📞 Support

If you encounter issues:
1. Check the GitHub Actions logs first
2. Review the error artifacts
3. Verify all configuration is correct
4. Test Timeform access manually

---

**The manual test workflow has no schedule - it only runs when you trigger it manually!** 