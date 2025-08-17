// Comprehensive test to check relationship between bucket images and product details
const { createClient } = require('@supabase/supabase-js');

// You'll need to add your Supabase URL and anon key here
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkImageRelationship() {
  console.log('🔍 Checking relationship between bucket images and product details...\n');
  
  try {
    // 1. Check if product_images table exists and has data
    console.log('1️⃣ Checking product_images table...');
    const { data: imageRecords, error: imageError } = await supabase
      .from('product_images')
      .select('*')
      .limit(10);
    
    if (imageError) {
      console.error('❌ Error accessing product_images table:', imageError);
      return;
    }
    
    console.log(`✅ Found ${imageRecords.length} image records in product_images table`);
    if (imageRecords.length > 0) {
      console.log('📋 Sample image record:', imageRecords[0]);
    }
    
    // 2. Check if lats_products table exists and has data
    console.log('\n2️⃣ Checking lats_products table...');
    const { data: products, error: productError } = await supabase
      .from('lats_products')
      .select('id, name, created_at')
      .limit(5);
    
    if (productError) {
      console.error('❌ Error accessing lats_products table:', productError);
      return;
    }
    
    console.log(`✅ Found ${products.length} products in lats_products table`);
    if (products.length > 0) {
      console.log('📋 Sample product:', products[0]);
    }
    
    // 3. Check foreign key relationship
    console.log('\n3️⃣ Checking foreign key relationship...');
    if (imageRecords.length > 0 && products.length > 0) {
      const sampleImage = imageRecords[0];
      const { data: relatedProduct, error: relationError } = await supabase
        .from('lats_products')
        .select('id, name')
        .eq('id', sampleImage.product_id)
        .single();
      
      if (relationError) {
        console.error('❌ Foreign key relationship error:', relationError);
      } else {
        console.log('✅ Foreign key relationship works:', {
          imageId: sampleImage.id,
          productId: sampleImage.product_id,
          productName: relatedProduct?.name
        });
      }
    }
    
    // 4. Check storage buckets
    console.log('\n4️⃣ Checking storage buckets...');
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('❌ Error listing buckets:', bucketError);
    } else {
      console.log(`✅ Found ${buckets.length} storage buckets:`, buckets.map(b => b.name));
      
      // Check if product-images bucket exists
      const productImagesBucket = buckets.find(b => b.name === 'product-images');
      if (productImagesBucket) {
        console.log('✅ product-images bucket exists');
        
        // List files in the bucket
        const { data: files, error: filesError } = await supabase.storage
          .from('product-images')
          .list();
        
        if (filesError) {
          console.error('❌ Error listing files in product-images bucket:', filesError);
        } else {
          console.log(`✅ Found ${files.length} files in product-images bucket`);
          if (files.length > 0) {
            console.log('📋 Sample files:', files.slice(0, 3));
          }
        }
      } else {
        console.log('❌ product-images bucket not found');
      }
    }
    
    // 5. Check if image URLs are accessible
    console.log('\n5️⃣ Checking image URL accessibility...');
    if (imageRecords.length > 0) {
      const sampleImage = imageRecords[0];
      console.log('🔍 Testing image URL:', sampleImage.image_url);
      
      try {
        const response = await fetch(sampleImage.image_url);
        if (response.ok) {
          console.log('✅ Image URL is accessible (HTTP 200)');
        } else {
          console.log(`❌ Image URL returned HTTP ${response.status}`);
        }
      } catch (error) {
        console.log('❌ Image URL is not accessible:', error.message);
      }
    }
    
    // 6. Check for orphaned images (images without products)
    console.log('\n6️⃣ Checking for orphaned images...');
    if (imageRecords.length > 0) {
      const imageProductIds = [...new Set(imageRecords.map(img => img.product_id))];
      const { data: existingProducts, error: existingError } = await supabase
        .from('lats_products')
        .select('id')
        .in('id', imageProductIds);
      
      if (existingError) {
        console.error('❌ Error checking existing products:', existingError);
      } else {
        const existingProductIds = existingProducts.map(p => p.id);
        const orphanedImages = imageProductIds.filter(id => !existingProductIds.includes(id));
        
        if (orphanedImages.length > 0) {
          console.log(`⚠️ Found ${orphanedImages.length} orphaned images (no corresponding product)`);
          console.log('Orphaned product IDs:', orphanedImages);
        } else {
          console.log('✅ No orphaned images found');
        }
      }
    }
    
    // 7. Check for products without images
    console.log('\n7️⃣ Checking for products without images...');
    if (products.length > 0) {
      const productIds = products.map(p => p.id);
      const { data: productsWithImages, error: withImagesError } = await supabase
        .from('product_images')
        .select('product_id')
        .in('product_id', productIds);
      
      if (withImagesError) {
        console.error('❌ Error checking products with images:', withImagesError);
      } else {
        const productsWithImageIds = [...new Set(productsWithImages.map(img => img.product_id))];
        const productsWithoutImages = productIds.filter(id => !productsWithImageIds.includes(id));
        
        if (productsWithoutImages.length > 0) {
          console.log(`⚠️ Found ${productsWithoutImages.length} products without images`);
          console.log('Product IDs without images:', productsWithoutImages);
        } else {
          console.log('✅ All products have images');
        }
      }
    }
    
    console.log('\n✅ Relationship check completed!');
    
  } catch (error) {
    console.error('❌ Relationship check failed:', error);
  }
}

checkImageRelationship();
