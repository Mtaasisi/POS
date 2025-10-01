#!/usr/bin/env node

/**
 * Quick Product Specification Enhancement Script
 * 
 * This script can be run directly to enhance all product specifications
 * Run with: node scripts/run-specification-enhancement.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Enhanced specification templates
const specificationTemplates = {
  'smartphone': {
    'device_type': 'Smartphone',
    'screen_size': '6.1 inches',
    'display_type': 'OLED',
    'resolution': '1080x2400',
    'processor': 'Octa-core',
    'ram': '8GB',
    'storage': '128GB',
    'camera_main': '50MP',
    'camera_front': '12MP',
    'battery_capacity': '4000mAh',
    'charging': 'Fast charging',
    'connectivity': '5G',
    'water_resistance': 'IP68',
    'weight': '180g',
    'dimensions': '150x70x8mm'
  },
  'laptop': {
    'device_type': 'Laptop',
    'screen_size': '13.3 inches',
    'display_type': 'IPS',
    'resolution': '1920x1080',
    'processor': 'Intel Core i7',
    'ram': '16GB',
    'storage': '512GB SSD',
    'graphics': 'Integrated',
    'battery_life': '10 hours',
    'weight': '1.3kg',
    'ports': 'USB-C, USB-A, HDMI',
    'connectivity': 'WiFi 6, Bluetooth 5.0',
    'os': 'Windows 11',
    'dimensions': '310x220x15mm'
  },
  'audio': {
    'device_type': 'Audio',
    'driver_size': '40mm',
    'frequency_response': '20Hz-20kHz',
    'impedance': '32 ohms',
    'sensitivity': '100dB',
    'connectivity': 'Bluetooth 5.0',
    'battery_life': '30 hours',
    'charging_time': '2 hours',
    'weight': '250g',
    'noise_cancellation': 'Active',
    'water_resistance': 'IPX4',
    'microphone': 'Built-in',
    'controls': 'Touch controls'
  },
  'tablet': {
    'device_type': 'Tablet',
    'screen_size': '10.9 inches',
    'display_type': 'LCD',
    'resolution': '2360x1640',
    'processor': 'A14 Bionic',
    'ram': '4GB',
    'storage': '64GB',
    'camera_main': '12MP',
    'camera_front': '7MP',
    'battery_life': '10 hours',
    'weight': '460g',
    'connectivity': 'WiFi, Cellular',
    'os': 'iPadOS',
    'stylus_support': 'Apple Pencil',
    'dimensions': '250x174x7mm'
  },
  'footwear': {
    'product_type': 'Footwear',
    'size_range': 'US 7-12',
    'material': 'Mesh/Leather',
    'sole_material': 'Rubber',
    'weight': '300g',
    'heel_height': '2cm',
    'closure_type': 'Lace-up',
    'water_resistance': 'Waterproof',
    'breathability': 'High',
    'cushioning': 'Air cushion',
    'traction': 'High grip',
    'durability': 'Long-lasting',
    'care_instructions': 'Machine washable'
  },
  'clothing': {
    'product_type': 'Clothing',
    'material': 'Cotton/Polyester',
    'size_range': 'S-XXL',
    'care_instructions': 'Machine wash',
    'color_options': 'Multiple',
    'fit': 'Regular',
    'season': 'All season',
    'features': 'Comfortable',
    'durability': 'High',
    'breathability': 'Good',
    'stretch': '4-way stretch',
    'weight': 'Lightweight',
    'origin': 'Made in China'
  },
  'home_garden': {
    'product_type': 'Home & Garden',
    'material': 'Stainless steel',
    'dimensions': 'Various',
    'weight': 'Medium',
    'color': 'Silver',
    'durability': 'Long-lasting',
    'maintenance': 'Easy clean',
    'safety': 'Safe to use',
    'warranty': '1 year',
    'origin': 'Made in China',
    'features': 'Multi-purpose',
    'storage': 'Compact',
    'eco_friendly': 'Yes'
  }
};

// Model detection patterns
const modelPatterns = {
  'smartphone': [
    /iphone|galaxy|pixel|oneplus|xiaomi|huawei|oppo|vivo|realme|phone|mobile|smartphone/i
  ],
  'laptop': [
    /macbook|dell|hp|lenovo|asus|acer|msi|surface|laptop|notebook|ultrabook/i
  ],
  'audio': [
    /airpods|beats|sony|bose|sennheiser|jbl|audio|headphone|earphone|earbud|headset/i
  ],
  'tablet': [
    /ipad|surface|galaxy tab|fire|kindle|tablet|pad/i
  ],
  'footwear': [
    /nike|adidas|puma|converse|vans|jordan|shoe|sneaker|boot|sandal/i
  ],
  'clothing': [
    /shirt|pants|dress|jacket|hoodie|sweater|clothing|apparel|garment/i
  ],
  'home_garden': [
    /kitchen|garden|home|furniture|appliance|tool|utensil|decor/i
  ]
};

/**
 * Detect product category based on name and description
 */
function detectProductCategory(product) {
  const text = `${product.name} ${product.description || ''}`.toLowerCase();
  
  for (const [category, patterns] of Object.entries(modelPatterns)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return category;
      }
    }
  }
  
  return 'general';
}

/**
 * Extract brand from product name
 */
function extractBrand(productName) {
  const brandPatterns = [
    /apple|samsung|google|sony|bose|nike|adidas|dell|hp|lenovo|asus|acer/i,
    /xiaomi|huawei|oppo|vivo|oneplus|realme|jbl|beats/i
  ];
  
  for (const pattern of brandPatterns) {
    const match = productName.match(pattern);
    if (match) {
      return match[0].charAt(0).toUpperCase() + match[0].slice(1);
    }
  }
  
  return 'Unknown';
}

/**
 * Enhance specifications based on product category and existing data
 */
function enhanceSpecifications(product, category) {
  const existingSpecs = product.attributes || {};
  const template = specificationTemplates[category] || {};
  
  // Merge existing specs with template, prioritizing existing data
  const enhancedSpecs = { ...template, ...existingSpecs };
  
  // Add model-specific enhancements
  if (product.name) {
    enhancedSpecs.model = product.name;
    enhancedSpecs.brand = extractBrand(product.name);
  }
  
  // Add category-specific enhancements
  enhancedSpecs.category = category;
  enhancedSpecs.last_updated = new Date().toISOString();
  
  return enhancedSpecs;
}

/**
 * Main function to enhance all product specifications
 */
async function enhanceAllProductSpecifications() {
  console.log('🚀 Starting product specification enhancement...\n');
  
  try {
    // Fetch all products with their variants
    console.log('📊 Fetching products from database...');
    const { data: products, error: fetchError } = await supabase
      .from('lats_products')
      .select(`
        id,
        name,
        description,
        attributes,
        created_at,
        lats_categories(name)
      `)
      .eq('is_active', true);
    
    if (fetchError) {
      console.error('❌ Error fetching products:', fetchError);
      return;
    }
    
    if (!products || products.length === 0) {
      console.log('ℹ️  No products found in database');
      return;
    }
    
    console.log(`📦 Found ${products.length} products to analyze\n`);
    
    let successCount = 0;
    let skipCount = 0;
    const results = [];
    
    // Process each product
    for (const product of products) {
      console.log(`🔍 Processing: ${product.name}`);
      
      // Detect product category
      const category = detectProductCategory(product);
      console.log(`   📂 Detected category: ${category}`);
      
      // Enhance specifications
      const enhancedSpecs = enhanceSpecifications(product, category);
      console.log(`   ✨ Enhanced with ${Object.keys(enhancedSpecs).length} specifications`);
      
      // Update database
      try {
        const { error } = await supabase
          .from('lats_products')
          .update({
            attributes: enhancedSpecs,
            updated_at: new Date().toISOString()
          })
          .eq('id', product.id);
        
        if (error) {
          console.error(`   ❌ Error updating product:`, error);
          skipCount++;
          results.push({
            id: product.id,
            name: product.name,
            category,
            status: 'failed'
          });
        } else {
          successCount++;
          results.push({
            id: product.id,
            name: product.name,
            category,
            specCount: Object.keys(enhancedSpecs).length,
            status: 'success'
          });
          console.log(`   ✅ Updated successfully`);
        }
      } catch (error) {
        console.error(`   ❌ Exception updating product:`, error);
        skipCount++;
        results.push({
          id: product.id,
          name: product.name,
          category,
          status: 'failed'
        });
      }
      
      console.log('');
      
      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Summary
    console.log('\n📊 ENHANCEMENT SUMMARY');
    console.log('='.repeat(50));
    console.log(`✅ Successfully updated: ${successCount} products`);
    console.log(`❌ Failed to update: ${skipCount} products`);
    console.log(`📦 Total processed: ${products.length} products`);
    
    // Category breakdown
    const categoryStats = {};
    results.forEach(result => {
      categoryStats[result.category] = (categoryStats[result.category] || 0) + 1;
    });
    
    console.log('\n📂 CATEGORY BREAKDOWN');
    console.log('-'.repeat(30));
    Object.entries(categoryStats).forEach(([category, count]) => {
      console.log(`${category}: ${count} products`);
    });
    
    // Show some examples
    console.log('\n🎯 SAMPLE ENHANCED SPECIFICATIONS');
    console.log('-'.repeat(40));
    const successfulResults = results.filter(r => r.status === 'success').slice(0, 3);
    successfulResults.forEach(result => {
      console.log(`\n📦 ${result.name} (${result.category})`);
      console.log(`   📊 ${result.specCount} specifications added`);
    });
    
    console.log('\n🎉 Product specification enhancement completed!');
    
  } catch (error) {
    console.error('❌ Fatal error during enhancement:', error);
  }
}

// Run the enhancement script
if (require.main === module) {
  enhanceAllProductSpecifications()
    .then(() => {
      console.log('\n✨ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script failed:', error);
      process.exit(1);
    });
}

module.exports = {
  enhanceAllProductSpecifications,
  detectProductCategory,
  enhanceSpecifications,
  specificationTemplates
};
