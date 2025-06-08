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

// Only exclude these critical system files that could cause issues
const MINIMAL_EXCLUDE_PATTERNS = [
  '.DS_Store',
  'Thumbs.db',
  'desktop.ini'
];

// Maximum file size (100MB - increased from 50MB)
const MAX_FILE_SIZE = 100 * 1024 * 1024;

class ComprehensiveBackup {
  constructor() {
    this.uploadedFiles = 0;
    this.skippedFiles = 0;
    this.errors = [];
    this.startTime = Date.now();
    this.totalSize = 0;
    this.processedSize = 0;
  }

  shouldExclude(filePath) {
    const basename = path.basename(filePath);
    
    // Only exclude system files that could cause issues
    return MINIMAL_EXCLUDE_PATTERNS.includes(basename);
  }

  async getAllFiles(dir) {
    const files = [];
    
    try {
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const fullPath = path.join(dir, item);
        
        if (this.shouldExclude(fullPath)) {
          console.log(`⏭️  Excluding system file: ${path.relative(process.cwd(), fullPath)}`);
          continue;
        }
        
        try {
          const stat = fs.statSync(fullPath);
          
          if (stat.isDirectory()) {
            const subFiles = await this.getAllFiles(fullPath);
            files.push(...subFiles);
          } else if (stat.isFile()) {
            if (stat.size <= MAX_FILE_SIZE) {
              files.push({
                localPath: fullPath,
                relativePath: path.relative(process.cwd(), fullPath),
                size: stat.size
              });
              this.totalSize += stat.size;
            } else {
              console.log(`⚠️  File too large (${(stat.size / 1024 / 1024).toFixed(2)}MB): ${path.relative(process.cwd(), fullPath)}`);
              this.skippedFiles++;
            }
          }
        } catch (statError) {
          console.log(`⚠️  Cannot access: ${path.relative(process.cwd(), fullPath)} - ${statError.message}`);
          this.skippedFiles++;
        }
      }
    } catch (error) {
      console.error(`❌ Error reading directory ${dir}:`, error.message);
      this.errors.push(`Error reading directory ${dir}: ${error.message}`);
    }
    
    return files;
  }

  sanitizeFileName(fileName) {
    // Replace problematic characters for Supabase storage
    return fileName
      .replace(/\[/g, '(')
      .replace(/\]/g, ')')
      .replace(/\.\.\./g, 'spread')
      .replace(/[<>:"|?*]/g, '_')
      .replace(/\s+/g, '_');
  }

  async uploadFile(file, index, total) {
    try {
      const fileContent = fs.readFileSync(file.localPath);
      
      // Create a timestamp-based backup path with sanitized filename
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const sanitizedPath = this.sanitizeFileName(file.relativePath);
      const backupPath = `complete-backup-${timestamp}/${sanitizedPath}`;
      
      const progress = ((index + 1) / total * 100).toFixed(1);
      const sizeProgress = ((this.processedSize / this.totalSize) * 100).toFixed(1);
      
      console.log(`📤 [${index + 1}/${total}] (${progress}%) Uploading: ${file.relativePath}`);
      console.log(`   Size: ${(file.size / 1024).toFixed(2)}KB | Progress: ${sizeProgress}%`);
      
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
      this.processedSize += file.size;
      
      // Log every 100 files
      if (this.uploadedFiles % 100 === 0) {
        console.log(`✅ Milestone: ${this.uploadedFiles} files uploaded`);
      }
      
      return { success: true, path: backupPath };
    } catch (error) {
      console.error(`❌ Failed to upload ${file.relativePath}:`, error.message);
      this.errors.push(`Failed to upload ${file.relativePath}: ${error.message}`);
      this.processedSize += file.size; // Still count towards progress
      return { success: false, error: error.message };
    }
  }

  getContentType(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    const contentTypes = {
      // Text files
      '.js': 'application/javascript',
      '.jsx': 'application/javascript',
      '.ts': 'application/typescript',
      '.tsx': 'application/typescript',
      '.json': 'application/json',
      '.md': 'text/markdown',
      '.txt': 'text/plain',
      '.css': 'text/css',
      '.scss': 'text/css',
      '.sass': 'text/css',
      '.less': 'text/css',
      '.html': 'text/html',
      '.htm': 'text/html',
      '.xml': 'application/xml',
      '.yml': 'application/x-yaml',
      '.yaml': 'application/x-yaml',
      '.env': 'text/plain',
      '.sql': 'application/sql',
      '.sh': 'application/x-sh',
      '.bat': 'application/x-msdos-program',
      '.ps1': 'application/x-powershell',
      
      // Images
      '.svg': 'image/svg+xml',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.gif': 'image/gif',
      '.ico': 'image/x-icon',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.tiff': 'image/tiff',
      
      // Archives
      '.zip': 'application/zip',
      '.tar': 'application/x-tar',
      '.gz': 'application/gzip',
      '.rar': 'application/x-rar-compressed',
      '.7z': 'application/x-7z-compressed',
      
      // Documents
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      
      // Media
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      
      // Fonts
      '.woff': 'font/woff',
      '.woff2': 'font/woff2',
      '.ttf': 'font/ttf',
      '.otf': 'font/otf',
      '.eot': 'application/vnd.ms-fontobject'
    };
    
    return contentTypes[ext] || 'application/octet-stream';
  }

  async createComprehensiveManifest(files) {
    const manifest = {
      backup_date: new Date().toISOString(),
      backup_type: 'COMPREHENSIVE_COMPLETE_BACKUP',
      total_files: files.length,
      total_size: files.reduce((sum, file) => sum + file.size, 0),
      project_name: 'OddsVantage Combined Website - Complete Backup',
      source_directory: process.cwd(),
      backup_notes: 'This is a complete backup of ALL files in the sports-betting-solutions copy directory',
      files: files.map(file => ({
        original_path: file.relativePath,
        sanitized_path: this.sanitizeFileName(file.relativePath),
        size: file.size,
        checksum: this.calculateChecksum(file.localPath)
      }))
    };
    
    const manifestContent = JSON.stringify(manifest, null, 2);
    const timestamp = new Date().toISOString().split('T')[0];
    const manifestPath = `complete-backup-${timestamp}/COMPREHENSIVE_BACKUP_MANIFEST.json`;
    
    try {
      const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(manifestPath, manifestContent, {
          contentType: 'application/json',
          upsert: true
        });
      
      if (error) throw error;
      
      console.log(`📋 Comprehensive manifest created: ${manifestPath}`);
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
    console.log('🚀 Starting COMPREHENSIVE backup process...');
    console.log(`📁 Source directory: ${process.cwd()}`);
    console.log(`☁️  Destination: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/`);
    console.log('⚠️  This will backup ALL files (no filtering except system files)');
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
    console.log('📂 Scanning ALL files (this may take a while)...');
    const files = await this.getAllFiles(process.cwd());
    
    console.log(`\n📊 Found ${files.length} files to backup`);
    console.log(`📦 Total size: ${(this.totalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log('');
    
    if (files.length === 0) {
      console.log('❌ No files found to backup');
      return;
    }
    
    // Upload files sequentially to avoid overwhelming the API
    console.log('📤 Starting comprehensive upload...');
    console.log('⏱️  This will take a while - uploading one file at a time to ensure reliability');
    
    for (let i = 0; i < files.length; i++) {
      await this.uploadFile(files[i], i, files.length);
      
      // Small delay to avoid rate limiting
      if (i % 50 === 0 && i > 0) {
        console.log('⏸️  Brief pause to avoid rate limiting...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Create comprehensive manifest
    console.log('\n📋 Creating comprehensive backup manifest...');
    await this.createComprehensiveManifest(files);
    
    // Summary
    const duration = (Date.now() - this.startTime) / 1000;
    const minutes = Math.floor(duration / 60);
    const seconds = (duration % 60).toFixed(2);
    
    console.log('\n🎉 COMPREHENSIVE BACKUP COMPLETED!');
    console.log(`✅ Uploaded: ${this.uploadedFiles} files`);
    console.log(`⏭️  Skipped: ${this.skippedFiles} files`);
    console.log(`❌ Errors: ${this.errors.length}`);
    console.log(`📦 Total size uploaded: ${(this.totalSize / 1024 / 1024).toFixed(2)}MB`);
    console.log(`⏱️  Duration: ${minutes}m ${seconds}s`);
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      this.errors.slice(0, 10).forEach(error => console.log(`   - ${error}`));
      if (this.errors.length > 10) {
        console.log(`   ... and ${this.errors.length - 10} more errors`);
      }
    }
    
    console.log(`\n🔗 Access your complete backup at: ${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/complete-backup-${new Date().toISOString().split('T')[0]}/`);
  }
}

// Run the comprehensive backup
if (require.main === module) {
  const backup = new ComprehensiveBackup();
  backup.run().catch(error => {
    console.error('💥 Comprehensive backup failed:', error);
    process.exit(1);
  });
}

module.exports = ComprehensiveBackup; 