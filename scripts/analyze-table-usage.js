// Script to analyze which database tables are actually used in the codebase
import fs from 'fs';
import path from 'path';

// List of all tables from the database interface
const ALL_TABLES = [
  'lats_pos_user_permissions_settings',
  'lats_product_variants',
  'lats_products',
  'lats_purchase_order_items',
  'lats_purchase_orders',
  'lats_receipts',
  'lats_sales',
  'lats_shipping_agent_offices',
  'lats_shipping_agents',
  'lats_shipping_agents_with_offices',
  'lats_shipping_carriers',
  'lats_shipping_events',
  'lats_shipping_info',
  'lats_shipping_managers',
  'lats_shipping_settings',
  'lats_spare_part_usage',
  'lats_spare_parts',
  'lats_stock_movements',
  'lats_storage_rooms',
  'lats_store_locations',
  'lats_store_shelves',
  'lats_suppliers',
  'locations',
  'loyalty_customers',
  'loyalty_rewards',
  'notification_actions'
];

// Helper function to get all source files
function getAllSourceFiles() {
  const sourceFiles = [];
  const srcDir = path.join(process.cwd(), 'src');
  const scriptsDir = path.join(process.cwd(), 'scripts');
  const supabaseDir = path.join(process.cwd(), 'supabase');
  
  function scanDirectory(dir) {
    try {
      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
          // Skip node_modules and other common directories
          if (!['node_modules', '.git', 'dist', 'build'].includes(item)) {
            scanDirectory(fullPath);
          }
        } else if (stat.isFile()) {
          // Include relevant file types
          const ext = path.extname(item);
          if (['.ts', '.tsx', '.js', '.jsx', '.sql', '.json'].includes(ext)) {
            sourceFiles.push(fullPath);
          }
        }
      }
    } catch (error) {
      // Skip directories that can't be read
    }
  }
  
  scanDirectory(srcDir);
  scanDirectory(scriptsDir);
  scanDirectory(supabaseDir);
  
  return sourceFiles;
}

function analyzeTableUsage() {
  console.log('🔍 Analyzing Database Table Usage in Codebase\n');
  console.log('==============================================\n');

  const results = {
    used: [],
    unused: [],
    partiallyUsed: [],
    errors: []
  };

  // Search for table references in the codebase
  for (const tableName of ALL_TABLES) {
    console.log(`Checking ${tableName}...`);
    
    try {
      // Search for table references in source files
      const sourceFiles = getAllSourceFiles();
      let foundReferences = 0;
      let referenceFiles = [];

      for (const filePath of sourceFiles) {
        try {
          const content = fs.readFileSync(filePath, 'utf8');
          
          // Check for various patterns of table usage
          const patterns = [
            new RegExp(`from\\s*['"]${tableName}['"]`, 'g'),
            new RegExp(`\\.from\\s*\\(['"]${tableName}['"]\\)`, 'g'),
            new RegExp(`table_name\\s*[=:]\\s*['"]${tableName}['"]`, 'g'),
            new RegExp(`['"]${tableName}['"]`, 'g'),
            new RegExp(`\\b${tableName}\\b`, 'g')
          ];

          for (const pattern of patterns) {
            const matches = content.match(pattern);
            if (matches && matches.length > 0) {
              foundReferences += matches.length;
              if (!referenceFiles.includes(filePath)) {
                referenceFiles.push(filePath);
              }
            }
          }
        } catch (fileError) {
          // Skip files that can't be read
          continue;
        }
      }

      console.log(`  📊 References found: ${foundReferences} in ${referenceFiles.length} files`);
      
      if (foundReferences > 0) {
        results.used.push({
          table: tableName,
          referenceCount: foundReferences,
          files: referenceFiles.length,
          fileList: referenceFiles.slice(0, 5) // Show first 5 files
        });
      } else {
        results.unused.push({
          table: tableName,
          reason: 'No references found in codebase'
        });
      }

    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}`);
      results.errors.push({
        table: tableName,
        error: err.message
      });
    }
  }

  // Generate report
  console.log('\n📋 USAGE ANALYSIS REPORT');
  console.log('========================\n');

  console.log('✅ TABLES WITH CODE REFERENCES (Used):');
  console.log('--------------------------------------');
  if (results.used.length > 0) {
    results.used.forEach(item => {
      console.log(`  • ${item.table}: ${item.referenceCount} references in ${item.files} files`);
      if (item.fileList && item.fileList.length > 0) {
        console.log(`    Files: ${item.fileList.map(f => path.basename(f)).join(', ')}`);
      }
    });
  } else {
    console.log('  No tables with code references found');
  }

  console.log('\n❌ TABLES WITHOUT CODE REFERENCES (Potentially Unused):');
  console.log('-------------------------------------------------------');
  if (results.unused.length > 0) {
    results.unused.forEach(item => {
      console.log(`  • ${item.table}: ${item.reason}`);
    });
  } else {
    console.log('  All tables have code references');
  }

  console.log('\n⚠️  TABLES WITH ISSUES:');
  console.log('----------------------');
  if (results.partiallyUsed.length > 0) {
    results.partiallyUsed.forEach(item => {
      console.log(`  • ${item.table}: ${item.reason}`);
    });
  }

  if (results.errors.length > 0) {
    console.log('\n❌ TABLES WITH ERRORS:');
    console.log('----------------------');
    results.errors.forEach(item => {
      console.log(`  • ${item.table}: ${item.error}`);
    });
  }

  // Summary
  console.log('\n📊 SUMMARY:');
  console.log('===========');
  console.log(`Total tables analyzed: ${ALL_TABLES.length}`);
  console.log(`Tables with code references: ${results.used.length}`);
  console.log(`Tables without code references: ${results.unused.length}`);
  console.log(`Tables with issues: ${results.partiallyUsed.length}`);
  console.log(`Tables with errors: ${results.errors.length}`);

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  console.log('===================');
  
  if (results.unused.length > 0) {
    console.log('\n🗑️  Consider removing these unused tables:');
    results.unused.forEach(item => {
      console.log(`  • ${item.table}`);
    });
  }

  if (results.errors.length > 0) {
    console.log('\n🔧 Fix these table access issues:');
    results.errors.forEach(item => {
      console.log(`  • ${item.table}: ${item.error}`);
    });
  }

  // Save detailed report to file
  const reportPath = path.join(process.cwd(), 'table-usage-analysis.json');
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  return results;
}

// Run the analysis
try {
  analyzeTableUsage();
  console.log('\n✅ Analysis complete!');
} catch (error) {
  console.error('❌ Analysis failed:', error);
}
