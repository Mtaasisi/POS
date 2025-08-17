import fs from 'fs';
import path from 'path';

// Files that need to be updated
const filesToUpdate = [
  'src/features/lats/pages/ProductCatalogPage.tsx',
  'src/features/lats/pages/UnifiedInventoryPage.tsx',
  'src/features/lats/pages/NewPurchaseOrderPage.tsx',
  'src/features/lats/components/pos/EnhancedPOSComponent.tsx',
  'src/features/lats/components/pos/POSComponent.tsx'
];

function updateLoadProductsCalls(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Replace loadProducts() with loadProducts({ page: 1, limit: 50 })
    const updatedContent = content.replace(
      /loadProducts\(\)/g,
      'loadProducts({ page: 1, limit: 50 })'
    );
    
    if (content !== updatedContent) {
      fs.writeFileSync(filePath, updatedContent, 'utf8');
      console.log(`✅ Updated ${filePath}`);
      return true;
    } else {
      console.log(`⏭️ No changes needed for ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

console.log('🔧 Fixing loadProducts() calls...\n');

let updatedCount = 0;
for (const file of filesToUpdate) {
  if (fs.existsSync(file)) {
    if (updateLoadProductsCalls(file)) {
      updatedCount++;
    }
  } else {
    console.log(`⚠️ File not found: ${file}`);
  }
}

console.log(`\n🎉 Updated ${updatedCount} files successfully!`);
