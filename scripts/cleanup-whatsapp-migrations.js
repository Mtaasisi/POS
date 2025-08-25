#!/usr/bin/env node

/**
 * WhatsApp Migration Cleanup Script
 * 
 * This script removes old WhatsApp-related migration files that are no longer needed
 * after the complete WhatsApp feature removal.
 * 
 * It keeps only the final cleanup migration and removes all others to prevent confusion.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Migration directory
const migrationsDir = path.join(__dirname, '..', 'supabase', 'migrations');

// Files to keep (the final cleanup migrations)
const filesToKeep = [
  '20250125000000_remove_whatsapp_features.sql',
  '20250126000000_complete_whatsapp_cleanup.sql'
];

// WhatsApp-related migration files to remove
const whatsappMigrationPatterns = [
  /.*whatsapp.*\.sql$/i,
  /.*green.*api.*\.sql$/i
];

function isWhatsAppMigration(filename) {
  // Skip files we want to keep
  if (filesToKeep.includes(filename)) {
    return false;
  }
  
  // Check if filename matches WhatsApp patterns
  return whatsappMigrationPatterns.some(pattern => pattern.test(filename));
}

function cleanupMigrations() {
  console.log('🧹 Starting WhatsApp migration cleanup...\n');
  
  if (!fs.existsSync(migrationsDir)) {
    console.error('❌ Migrations directory not found:', migrationsDir);
    process.exit(1);
  }
  
  const files = fs.readdirSync(migrationsDir);
  const whatsappFiles = files.filter(isWhatsAppMigration);
  
  if (whatsappFiles.length === 0) {
    console.log('✅ No WhatsApp migration files found to clean up.');
    return;
  }
  
  console.log(`Found ${whatsappFiles.length} WhatsApp migration files to remove:\n`);
  
  whatsappFiles.forEach(file => {
    console.log(`  📄 ${file}`);
  });
  
  console.log('\n❓ Do you want to remove these files? (y/N)');
  
  // Wait for user input
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.on('data', (key) => {
    const input = key.toString().toLowerCase();
    
    if (input === 'y' || input === 'yes\n') {
      console.log('\n🗑️  Removing WhatsApp migration files...\n');
      
      let removedCount = 0;
      whatsappFiles.forEach(file => {
        const filePath = path.join(migrationsDir, file);
        try {
          fs.unlinkSync(filePath);
          console.log(`  ✅ Removed: ${file}`);
          removedCount++;
        } catch (error) {
          console.log(`  ❌ Failed to remove: ${file} - ${error.message}`);
        }
      });
      
      console.log(`\n🎉 Cleanup completed! Removed ${removedCount} files.`);
      console.log('\n📁 Kept essential cleanup migrations:');
      filesToKeep.forEach(file => {
        const filePath = path.join(migrationsDir, file);
        if (fs.existsSync(filePath)) {
          console.log(`  ✅ ${file}`);
        }
      });
      
    } else {
      console.log('\n❌ Cleanup cancelled.');
    }
    
    process.exit(0);
  });
}

// Run the cleanup
cleanupMigrations();
