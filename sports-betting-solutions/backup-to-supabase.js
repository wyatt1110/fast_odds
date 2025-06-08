#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Supabase configuration
const SUPABASE_URL = 'https://gwvnmzflxttdlhrkejmy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd3dm5temZseHR0ZGxocmtlam15Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzM5MDg3OTUsImV4cCI6MjA0OTQ4NDc5NX0.SppgaGx3B0NVXOqM-Myqn2GSW7JxO-lpP7Akr5I3I2g';
const BUCKET_NAME = 'complete-website-backup';

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Directories and files to exclude from backup
const EXCLUDE_PATTERNS = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  '.DS_Store',
  'Thumbs.db',
  '*.log',
  'npm-debug.log*',
  'yarn-debug.log*',
  'yarn-error.log*',
  '.npm',
  '.yarn-integrity',
  'coverage',
  '.nyc_output',
  '.cache',
  'tmp',
  'temp'
];

// File extensions to include (if empty, includes all)
const INCLUDE_EXTENSIONS = [
  '.js', '.jsx', '.ts', '.tsx', '.json', '.md', '.txt', '.yml', '.yaml',
  '.css', '.scss', '.sass', '.less', '.html', '.htm', '.xml', '.svg',
  '.png', '.jpg', '.jpeg', '.gif', '.ico', '.webp', '.env', '.env.local',
  '.env.example', '.gitignore', '.gitattributes', '.editorconfig',
  '.prettierrc', '.eslintrc', '.babelrc', '.npmrc', '.yarnrc',
  '.dockerignore', 'Dockerfile', '.sql', '.sh', '.bat', '.ps1'
];

// Maximum file size (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

class BackupManager {
  constructor() {
    this.uploadedFiles = 0;
    this.skippedFiles = 0;
    this.errors = [];
    this.startTime = Date.now();
  }

  shouldExclude(filePath) {
    const relativePath = path.relative(process.cwd(), filePath);
    
    // Check exclude patterns
    for (const pattern of EXCLUDE_PATTERNS) {
      if (pattern.includes('*')) {
        // Handle wildcard patterns
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        if (regex.test(relativePath) || regex.test(path.basename(filePath))) {
          return true;
        }
      } else {
        // Handle directory patterns
        if (relativePath.includes(pattern) || path.basename(filePath) === pattern) {
          return true;
        }
      }
    }

    return false;
  }

  shouldInclude(filePath) {
    if (INCLUDE_EXTENSIONS.length === 0) return true;
    
    const ext = path.extname(filePath).toLowerCase();
    const basename = path.basename(filePath);
    
    // Include files without extensions that are common config files
    const configFiles = [
      'Dockerfile', 'Makefile', 'Procfile', 'LICENSE', 'CHANGELOG',
      'CONTRIBUTING', 'AUTHORS', 'NOTICE', 'COPYING'
    ];
    
    if (!ext && configFiles.some(config => basename.toUpperCase().includes(config))) {
      return true;
    }
    
    return INCLUDE_EXTENSIONS.includes(ext) || !ext;
  }

  async getAllFiles(dir) {
    const files = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        
        if (this.shouldExclude(fullPath)) {
          console.log(`⏭️  Excluding: ${path.relative(process.cwd(), fullPath)}`);
          continue;
        }
        
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          const subFiles = await this.getAllFiles(fullPath);
          files.push(...subFiles);
        } else if (stat.isFile()) {
          if (this.shouldInclude(fullPath) && stat.size <= MAX_FILE_SIZE) {
            files.push({
              localPath: fullPath,
              relativePath: path.relative(process.cwd(), fullPath),
              size: stat.size
            });
          } else if (stat.size > MAX_FILE_SIZE) {
            console.log(`⚠️  File too large (${(stat.size / 1024 / 1024).toFixed(2)}MB): ${path.relative(process.cwd(), fullPath)}`);
            this.skippedFiles++;
          } else {
            console.log(`⏭️  Skipping file type: ${path.relative(process.cwd(), fullPath)}`);
            this.skippedFiles++;
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error reading directory ${dir}:`, error.message);
      this.errors.push(`Error reading directory ${dir}: ${error.message}`);
    }
    
    return files;
  }

  async uploadFile(file) {
    try {
      const fileContent = fs.readFileSync(file.localPath);
      
      // Create a timestamp-based backup path
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const backupPath = `backup-${timestamp}/${file.relativePath}`;
      
      console.log(`📤 Uploading: ${file.relativePath} (${(file.size / 1024).toFixed(2)}KB)`);
      
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(backupPath, fileContent, {
          contentType: this.getContentType(file.localPath),
          upsert: true // Overwrite if exists
        });
      
      if (error) {
        throw error;
      }
      
      this.uploadedFiles++;
      console.log(`✅ Uploaded: ${backupPath}`);
      
      return { success: true, path: backupPath };
    } catch (error) {
      console.error(`❌ Failed to upload ${file.relativePath}:`, error.message);
      this.errors.push(`Failed to upload ${file.relativePath}: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      '.js': 'application/javascript',
      '.jsx': 'application/javascript',
      '.ts': 'application/typescript',
      '.tsx': 'application/typescript',
      '.json': 'application/json',
      '.md': 'text/markdown',
      '.txt': 'text/plain',
      '.css': 'text/css',
      '.html': 'text/html',
      '.htm': 'text/html',
      '.xml': 'application/xml',
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.ico': 'image/x-icon',
      '.webp': 'image/webp',
      '.env': 'text/plain',
      '.sql': 'application/sql',
      '.sh': 'application/x-sh',
      '.yml': 'application/x-yaml',
      '.yaml': 'application/x-yaml'
    };
    
    return contentTypes[ext] || 'application/octet-stream';
  }

  async createManifest(files) {
    const manifest = {
      backup_date: new Date().toISOString(),
      total_files: files.length,
      total_size: files.reduce((sum, file) => sum + file.size, 0),
      project_name: 'OddsVantage Combined Website',
      files: files.map(file => ({
        path: file.relativePath,
        size: file.size,
        checksum: this.calculateChecksum(file.localPath)
      }))
    };
    
    const manifestContent = JSON.stringify(manifest, null, 2);
    const timestamp = new Date().toISOString().split('T')[0];
    const manifestPath = `backup-${timestamp}/BACKUP_MANIFEST.json`;
    
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(manifestPath, manifestContent, {
          contentType: 'application/json',
          upsert: true
        });
      
      if (error) throw error;
      
      console.log(`📋 Manifest created: ${manifestPath}`);
      return manifestPath;
    } catch (error) {
      console.error('❌ Failed to create manifest:', error.message);
      this.errors.push(`Failed to create manifest: ${error.message}`);
    }
  }

  calculateChecksum(filePath) {
    try {
      const fileContent = fs.readFileSync(filePath);
      return crypto.createHash('md5').update(fileContent).digest('hex');
    } catch (error) {
      return null;
    }
  }

  async run() {
    console.log('🚀 Starting backup process...');
    console.log(`📁 Source directory: ${process.cwd()}`);
    console.log(`☁️  Destination: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/`);
    console.log('');
    
    // Test connection to Supabase
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) throw error;
      console.log('✅ Connected to Supabase successfully');
    } catch (error) {
      console.error('❌ Failed to connect to Supabase:', error.message);
      return;
    }
    
    // Get all files
    console.log('📂 Scanning files...');
    const files = await this.getAllFiles(process.cwd());
    
    console.log(`\n📊 Found ${files.length} files to backup`);
    console.log(`📦 Total size: ${(files.reduce((sum, file) => sum + file.size, 0) / 1024 / 1024).toFixed(2)}MB`);
    console.log('');
    
    if (files.length === 0) {
      console.log('❌ No files found to backup');
      return;
    }
    
    // Upload files with progress
    console.log('📤 Starting upload...');
    const batchSize = 5; // Upload 5 files at a time
    
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const promises = batch.map(file => this.uploadFile(file));
      
      await Promise.all(promises);
      
      const progress = Math.min(i + batchSize, files.length);
      const percentage = ((progress / files.length) * 100).toFixed(1);
      console.log(`📈 Progress: ${progress}/${files.length} (${percentage}%)`);
    }
    
    // Create manifest
    console.log('\n📋 Creating backup manifest...');
    await this.createManifest(files);
    
    // Summary
    const duration = (Date.now() - this.startTime) / 1000;
    console.log('\n🎉 Backup completed!');
    console.log(`✅ Uploaded: ${this.uploadedFiles} files`);
    console.log(`⏭️  Skipped: ${this.skippedFiles} files`);
    console.log(`❌ Errors: ${this.errors.length}`);
    console.log(`⏱️  Duration: ${duration.toFixed(2)} seconds`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    console.log(`\n🔗 Access your backup at: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/backup-${new Date().toISOString().split('T')[0]}/`);
  }
}

// Run the backup
if (require.main === module) {
  const backup = new BackupManager();
  backup.run().catch(error => {
    console.error('💥 Backup failed:', error);
    process.exit(1);
  });
}

module.exports = BackupManager; 