#!/usr/bin/env node

/**
 * Production Cleanup Script
 * Removes console.log statements and development code for production
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Files to clean up (add more as needed)
const filesToClean = [
  'src/features/lats/pages/POSPageOptimized.tsx',
  'src/features/customers/pages/CustomersPage.tsx',
  'src/features/devices/pages/DevicesPage.tsx',
  'src/features/devices/pages/NewDevicePage.tsx',
  'src/features/lats/pages/InventorySparePartsPage.tsx'
];

function removeConsoleLogs(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Remove console.log statements (but keep console.error and console.warn)
    content = content.replace(/^\s*console\.log\([^)]*\);\s*$/gm, '');
    content = content.replace(/^\s*console\.debug\([^)]*\);\s*$/gm, '');
    content = content.replace(/^\s*console\.info\([^)]*\);\s*$/gm, '');
    
    // Remove empty lines that might be left behind
    content = content.replace(/\n\s*\n\s*\n/g, '\n\n');
    
    fs.writeFileSync(filePath, content);
    console.log(`✅ Cleaned: ${filePath}`);
  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🧹 Starting Production Cleanup...\n');
  
  filesToClean.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
      removeConsoleLogs(fullPath);
    } else {
      console.log(`⚠️  File not found: ${file}`);
    }
  });
  
  console.log('\n✅ Production cleanup complete!');
  console.log('\n📋 Next steps:');
  console.log('1. Run: npm run build');
  console.log('2. Test the application');
  console.log('3. Deploy to production');
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { removeConsoleLogs };
