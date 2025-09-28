// Debug script to check for duplicate products
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

if (!supabaseUrl.includes('your-project') && !supabaseKey.includes('your-anon-key')) {
  const supabase = createClient(supabaseUrl, supabaseKey);

  async function checkForDuplicateProducts() {
    console.log('🔍 Checking for duplicate products...');
    
    try {
      // Fetch all products
      const { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('❌ Error fetching products:', error);
        return;
      }

      console.log(`📊 Total products in database: ${products.length}`);

      // Check for duplicates by name
      const nameGroups = {};
      products.forEach(product => {
        const name = product.name?.toLowerCase().trim();
        if (name) {
          if (!nameGroups[name]) {
            nameGroups[name] = [];
          }
          nameGroups[name].push(product);
        }
      });

      const duplicateNames = Object.entries(nameGroups).filter(([name, products]) => products.length > 1);
      
      if (duplicateNames.length > 0) {
        console.log(`⚠️ Found ${duplicateNames.length} product names with duplicates:`);
        duplicateNames.forEach(([name, products]) => {
          console.log(`  - "${name}": ${products.length} products`);
          products.forEach(product => {
            console.log(`    * ID: ${product.id}, SKU: ${product.sku || 'N/A'}, Created: ${product.created_at}`);
          });
        });
      } else {
        console.log('✅ No duplicate product names found');
      }

      // Check for duplicates by SKU
      const skuGroups = {};
      products.forEach(product => {
        const sku = product.sku?.toLowerCase().trim();
        if (sku) {
          if (!skuGroups[sku]) {
            skuGroups[sku] = [];
          }
          skuGroups[sku].push(product);
        }
      });

      const duplicateSkus = Object.entries(skuGroups).filter(([sku, products]) => products.length > 1);
      
      if (duplicateSkus.length > 0) {
        console.log(`⚠️ Found ${duplicateSkus.length} SKUs with duplicates:`);
        duplicateSkus.forEach(([sku, products]) => {
          console.log(`  - SKU "${sku}": ${products.length} products`);
          products.forEach(product => {
            console.log(`    * ID: ${product.id}, Name: ${product.name}, Created: ${product.created_at}`);
          });
        });
      } else {
        console.log('✅ No duplicate SKUs found');
      }

      // Check for exact duplicates (same name, sku, category, supplier)
      const exactDuplicates = [];
      for (let i = 0; i < products.length; i++) {
        for (let j = i + 1; j < products.length; j++) {
          const product1 = products[i];
          const product2 = products[j];
          
          if (product1.name === product2.name && 
              product1.sku === product2.sku && 
              product1.category_id === product2.category_id && 
              product1.supplier_id === product2.supplier_id) {
            exactDuplicates.push([product1, product2]);
          }
        }
      }

      if (exactDuplicates.length > 0) {
        console.log(`⚠️ Found ${exactDuplicates.length} exact duplicate products:`);
        exactDuplicates.forEach(([product1, product2]) => {
          console.log(`  - "${product1.name}" (SKU: ${product1.sku})`);
          console.log(`    * Product 1: ID ${product1.id}, Created: ${product1.created_at}`);
          console.log(`    * Product 2: ID ${product2.id}, Created: ${product2.created_at}`);
        });
      } else {
        console.log('✅ No exact duplicate products found');
      }

      // Summary
      console.log('\n📋 Summary:');
      console.log(`- Total products: ${products.length}`);
      console.log(`- Duplicate names: ${duplicateNames.length}`);
      console.log(`- Duplicate SKUs: ${duplicateSkus.length}`);
      console.log(`- Exact duplicates: ${exactDuplicates.length}`);

    } catch (error) {
      console.error('❌ Error during duplicate check:', error);
    }
  }

  checkForDuplicateProducts();
} else {
  console.log('⚠️ Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  console.log('Or update the script with your actual Supabase credentials');
}
