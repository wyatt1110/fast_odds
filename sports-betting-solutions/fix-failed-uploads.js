#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const SUPABASE_URL = 'https://gwvnmzflxttdlhrkejmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3dm5temZseHR0ZGxocmtlam15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5MDg3OTUsImV4cCI6MjA0OTQ4NDc5NX0.SppgaGx3B0NVXOqM-Myqn2GSW7JxO-lpP7Akr5I3I2g';
const BUCKET_NAME = 'complete-website-backup';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Files that failed to upload
const failedFiles = [
  {
    localPath: 'src/app/api/bets/[id]/route.ts',
    safeName: 'src/app/api/bets/id-param/route.ts'
  },
  {
    localPath: 'src/app/api/racing/[...path]/route.ts',
    safeName: 'src/app/api/racing/path-param/route.ts'
  }
];

async function uploadFailedFiles() {
  console.log('🔧 Fixing failed uploads...');
  
  const timestamp = new Date().toISOString().split('T')[0];
  
  for (const file of failedFiles) {
    try {
      console.log(`📤 Uploading: ${file.localPath} as ${file.safeName}`);
      
      const fileContent = fs.readFileSync(file.localPath);
      const backupPath = `backup-${timestamp}/${file.safeName}`;
      
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(backupPath, fileContent, {
          contentType: 'application/typescript',
          upsert: true
        });
      
      if (error) {
        throw error;
      }
      
      console.log(`✅ Uploaded: ${backupPath}`);
      
      // Also create a note file explaining the name change
      const noteContent = `This file was originally named: ${file.localPath}

The file was renamed to ${file.safeName} for storage compatibility.
Square brackets and other special characters in file names are not supported by Supabase storage.

Original file path: ${file.localPath}
Safe file path: ${file.safeName}
Upload date: ${new Date().toISOString()}
`;
      
      const notePath = `backup-${timestamp}/${file.safeName}.NOTE.txt`;
      await supabase.storage
        .from(BUCKET_NAME)
        .upload(notePath, noteContent, {
          contentType: 'text/plain',
          upsert: true
        });
      
      console.log(`📝 Note created: ${notePath}`);
      
    } catch (error) {
      console.error(`❌ Failed to upload ${file.localPath}:`, error.message);
    }
  }
  
  console.log('✅ Failed uploads fixed!');
}

uploadFailedFiles().catch(console.error); 