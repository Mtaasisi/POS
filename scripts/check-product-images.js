import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Check product_images table and create sample data if needed
 */
async function checkProductImages() {
  try {
    console.log('🔍 Checking product_images table...');
    
    // Check if table exists
    const { data: tableCheck, error: tableError } = await supabase
      .from('product_images')
      .select('id')
      .limit(1);
    
    if (tableError) {
      console.error('❌ product_images table error:', tableError);
      return;
    }
    
    console.log('✅ product_images table exists');
    
    // Check how many images exist
    const { data: imageCount, error: countError } = await supabase
      .from('product_images')
      .select('id', { count: 'exact' });
    
    if (countError) {
      console.error('❌ Error counting images:', countError);
    } else {
      console.log(`📸 Found ${imageCount?.length || 0} product images`);
    }
    
    // Get sample images
    const { data: sampleImages, error: sampleError } = await supabase
      .from('product_images')
      .select('id, product_id, image_url, is_primary, created_at')
      .limit(5);
    
    if (sampleError) {
      console.error('❌ Error fetching sample images:', sampleError);
    } else {
      console.log('🔍 Sample images:', sampleImages);
    }
    
    // Get products that might need images
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select('id, name')
      .limit(5);
    
    if (productsError) {
      console.error('❌ Error fetching products:', productsError);
      return;
    }
    
    if (!products || products.length === 0) {
      console.log('⚠️ No products found');
      return;
    }
    
    console.log(`📦 Found ${products.length} products`);
    
    // Check if any products have images
    for (const product of products) {
      const { data: productImages, error: productImagesError } = await supabase
        .from('product_images')
        .select('id, image_url, is_primary')
        .eq('product_id', product.id);
      
      if (productImagesError) {
        console.error(`❌ Error checking images for product ${product.name}:`, productImagesError);
      } else {
        console.log(`📸 Product "${product.name}" has ${productImages?.length || 0} images`);
        if (productImages && productImages.length > 0) {
          console.log('   Sample image:', productImages[0]);
        }
      }
    }
    
    // Create sample images if none exist
    const { data: allImages, error: allImagesError } = await supabase
      .from('product_images')
      .select('id')
      .limit(1);
    
    if (allImagesError) {
      console.error('❌ Error checking all images:', allImagesError);
      return;
    }
    
    if (!allImages || allImages.length === 0) {
      console.log('🧪 Creating sample images for products...');
      
      for (const product of products) {
        const sampleImage = {
          product_id: product.id,
          image_url: `https://via.placeholder.com/300x300/4F46E5/FFFFFF?text=${encodeURIComponent(product.name)}`,
          is_primary: true,
          uploaded_by: null
        };
        
        const { error: insertError } = await supabase
          .from('product_images')
          .insert(sampleImage);
        
        if (insertError) {
          console.error(`❌ Error creating image for product ${product.name}:`, insertError);
        } else {
          console.log(`✅ Created sample image for product "${product.name}"`);
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error in checkProductImages:', error);
  }
}

// Run the script
async function main() {
  console.log('🚀 Starting product images check...');
  await checkProductImages();
  console.log('✅ Script completed');
}

main().catch(console.error);
