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
  'src/features/devices/pages/NewDevicePage.tsx',
  'src/features/devices/components/DeviceRepairDetailModal.tsx',
  'src/features/lats/pages/InventorySparePartsPage.tsx',
  'src/features/lats/stores/useInventoryStore.ts',
  'src/features/lats/stores/usePOSStore.ts',
  'src/context/AuthContext.tsx',
  'src/lib/debugUtils.ts',
  'src/lib/supabaseClient.ts',
  'src/lib/customerApi/core.ts',
  'src/lib/deviceApi.ts',
  'src/lib/posSettingsApi.ts',
  'src/hooks/usePOSSettings.ts',
  'src/utils/repairAutoProgression.ts',
  'src/utils/repairValidation.ts'
];

function cleanFile(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let changes = 0;

    // Remove console.log statements
    const consoleLogRegex = /^\s*console\.log\([^)]*\);\s*$/gm;
    const consoleMatches = content.match(consoleLogRegex);
    if (consoleMatches) {
      content = content.replace(consoleLogRegex, '');
      changes += consoleMatches.length;
    }

    // Remove console.debug, console.info, console.warn (keep console.error)
    const consoleOtherRegex = /^\s*console\.(debug|info|warn)\([^)]*\);\s*$/gm;
    const otherMatches = content.match(consoleOtherRegex);
    if (otherMatches) {
      content = content.replace(consoleOtherRegex, '');
      changes += otherMatches.length;
    }

    // Remove TODO comments (optional - uncomment if needed)
    // const todoRegex = /^\s*\/\/\s*TODO:.*$/gm;
    // const todoMatches = content.match(todoRegex);
    // if (todoMatches) {
    //   content = content.replace(todoRegex, '');
    //   changes += todoMatches.length;
    // }

    if (changes > 0) {
      fs.writeFileSync(fullPath, content);
      console.log(`✅ Cleaned ${filePath}: removed ${changes} console statements`);
    } else {
      console.log(`✅ ${filePath}: no changes needed`);
    }

  } catch (error) {
    console.error(`❌ Error cleaning ${filePath}:`, error.message);
  }
}

function main() {
  console.log('🧹 Starting production cleanup...\n');
  
  let totalFiles = 0;
  let totalChanges = 0;

  filesToClean.forEach(file => {
    cleanFile(file);
    totalFiles++;
  });

  console.log(`\n🎉 Cleanup complete!`);
  console.log(`📊 Processed ${totalFiles} files`);
  console.log(`\n💡 Next steps:`);
  console.log(`   1. Run: npm run build`);
  console.log(`   2. Test your application`);
  console.log(`   3. Deploy to production`);
}

main();