#!/usr/bin/env node

/**
 * Direct Contact Import Script
 * Run this script to import contacts from SMS backup and CSV files
 */

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 Starting Direct Contact Import Process...\n');

try {
  // Run the unified contact import script
  console.log('📱 Processing SMS backup and CSV contacts...');
  
  const result = execSync('node import-unified-contacts.js', {
    cwd: __dirname,
    stdio: 'inherit',
    encoding: 'utf8'
  });

  console.log('\n✅ Contact import completed successfully!');
  console.log('📊 Check the output above for detailed statistics.');

} catch (error) {
  console.error('\n❌ Contact import failed:', error.message);
  process.exit(1);
}