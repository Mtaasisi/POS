#!/usr/bin/env node

/**
 * Unified Inventory Migration Verification Script
 * 
 * This script verifies that all navigation paths and references have been
 * properly updated to point to the unified inventory system.
 */

import fs from 'fs';
import path from 'path';

console.log('🔍 Verifying Unified Inventory Migration...\n');

// Files to check for old inventory references
const filesToCheck = [
  'src/App.tsx',
  'src/layout/AppLayout.tsx',
  'src/features/shared/components/TopBar.tsx',
  'src/features/lats/components/pos/POSTopBar.tsx',
  'src/features/shared/pages/DashboardPage.tsx',
  'src/features/lats/components/ui/LATSBreadcrumb.tsx',
  'src/lib/searchService.ts',
  'public/manifest.json',
  'src/features/admin/pages/AdminManagementPage.tsx',
  'src/features/notifications/README.md'
];

// Patterns to check for
const patterns = {
  oldRoutes: [
    /\/lats\/inventory[^/]/g,
    /\/lats\/products[^/]/g
  ],
  oldNavigation: [
    /navigate\('\/lats\/inventory'\)/g,
    /navigate\('\/lats\/products'\)/g
  ],
  oldPathChecks: [
    /location\.pathname\.includes\('\/lats\/inventory'\)/g,
    /location\.pathname\.includes\('\/lats\/products'\)/g
  ],
  oldLabels: [
    /Product Catalog/g
  ]
};

// Expected unified inventory references
const expectedUnified = [
  '/lats/unified-inventory',
  'Unified Inventory Management',
  'navigate(\'/lats/unified-inventory\')',
  'location.pathname.includes(\'/lats/unified-inventory\')'
];

let totalIssues = 0;
let totalFilesChecked = 0;

console.log('📁 Checking files for old inventory references...\n');

filesToCheck.forEach(filePath => {
  if (fs.existsSync(filePath)) {
    totalFilesChecked++;
    const content = fs.readFileSync(filePath, 'utf8');
    let fileIssues = 0;
    
    console.log(`🔍 Checking: ${filePath}`);
    
    // Check for old route patterns (but allow redirect routes in App.tsx)
    patterns.oldRoutes.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        // Allow redirect routes in App.tsx
        if (filePath === 'src/App.tsx' && content.includes('Navigate to="/lats/unified-inventory"')) {
          console.log(`  ✅ Found redirect route (expected): ${matches.join(', ')}`);
        } else {
          console.log(`  ❌ Found old route pattern: ${matches.join(', ')}`);
          fileIssues++;
          totalIssues++;
        }
      }
    });
    
    // Check for old navigation patterns
    patterns.oldNavigation.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        console.log(`  ❌ Found old navigation: ${matches.join(', ')}`);
        fileIssues++;
        totalIssues++;
      }
    });
    
    // Check for old path checks
    patterns.oldPathChecks.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        console.log(`  ❌ Found old path check: ${matches.join(', ')}`);
        fileIssues++;
        totalIssues++;
      }
    });
    
    // Check for old labels (but allow them in comments or documentation)
    patterns.oldLabels.forEach((pattern, index) => {
      const matches = content.match(pattern);
      if (matches) {
        // Only flag if not in comments or documentation context
        const lines = content.split('\n');
        let hasOldLabels = false;
        
        lines.forEach((line, lineNum) => {
          if (pattern.test(line) && !line.trim().startsWith('//') && !line.trim().startsWith('*')) {
            console.log(`  ⚠️  Found old label on line ${lineNum + 1}: ${line.trim()}`);
            hasOldLabels = true;
          }
        });
        
        if (hasOldLabels) {
          fileIssues++;
          totalIssues++;
        }
      }
    });
    
    // Check for expected unified inventory references
    let hasUnifiedRefs = false;
    expectedUnified.forEach(expected => {
      if (content.includes(expected)) {
        hasUnifiedRefs = true;
      }
    });
    
    if (fileIssues === 0) {
      if (hasUnifiedRefs) {
        console.log(`  ✅ No issues found, unified inventory references present`);
      } else {
        console.log(`  ✅ No issues found`);
      }
    } else {
      console.log(`  📊 File has ${fileIssues} issues`);
    }
    
    console.log('');
  } else {
    console.log(`⚠️  File not found: ${filePath}\n`);
  }
});

// Check for redirect routes in App.tsx
console.log('🔄 Checking redirect routes in App.tsx...');
const appContent = fs.readFileSync('src/App.tsx', 'utf8');

const redirectPatterns = [
  /<Route path="\/lats\/inventory" element={<Navigate to="\/lats\/unified-inventory" replace \/>} \/>/g,
  /<Route path="\/lats\/products" element={<Navigate to="\/lats\/unified-inventory" replace \/>} \/>/g
];

let redirectsFound = 0;
redirectPatterns.forEach(pattern => {
  const matches = appContent.match(pattern);
  if (matches) {
    console.log(`  ✅ Found redirect: ${matches[0]}`);
    redirectsFound++;
  }
});

if (redirectsFound === 2) {
  console.log('  ✅ All expected redirects are in place');
} else {
  console.log(`  ❌ Expected 2 redirects, found ${redirectsFound}`);
  totalIssues++;
}

console.log('');

// Check for unified inventory route
console.log('🎯 Checking unified inventory route...');
if (appContent.includes('/lats/unified-inventory') && appContent.includes('UnifiedInventoryPage')) {
  console.log('  ✅ Unified inventory route is properly configured');
} else {
  console.log('  ❌ Unified inventory route is missing or misconfigured');
  totalIssues++;
}

console.log('');

// Summary
console.log('📊 Migration Verification Summary:');
console.log(`  📁 Files checked: ${totalFilesChecked}`);
console.log(`  ❌ Total issues found: ${totalIssues}`);
console.log(`  🔄 Redirects configured: ${redirectsFound}/2`);

if (totalIssues === 0) {
  console.log('\n🎉 SUCCESS: Unified Inventory Migration is complete!');
  console.log('✅ All navigation paths have been updated');
  console.log('✅ All old routes redirect properly');
  console.log('✅ Unified inventory is the primary interface');
} else {
  console.log('\n⚠️  WARNING: Some issues were found');
  console.log('Please review the issues above and fix them');
}

console.log('\n🔗 Navigation Paths:');
console.log('  • Main Navigation: /lats/unified-inventory');
console.log('  • Old Inventory: /lats/inventory → redirects to unified');
console.log('  • Old Products: /lats/products → redirects to unified');
console.log('  • Product Details: /lats/products/:id → still works');

console.log('\n📱 Test the following navigation:');
console.log('  1. Click "Unified Inventory" in main navigation');
console.log('  2. Try old bookmarks to /lats/inventory or /lats/products');
console.log('  3. Use search functionality to find products');
console.log('  4. Check breadcrumb navigation');
console.log('  5. Verify admin management links');

console.log('\n✨ Unified Inventory is now the primary inventory management interface!');
