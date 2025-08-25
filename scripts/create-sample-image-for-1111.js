import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Create a sample image for product "1111"
 */
async function createSampleImageFor1111() {
  try {
    console.log('🔍 Finding product "1111"...');
    
    // Find the product with name "1111"
    const { data: product, error: productError } = await supabase
      .from('lats_products')
      .select('id, name')
      .eq('name', '1111')
      .single();
    
    if (productError) {
      console.error('❌ Error finding product "1111":', productError);
      return;
    }
    
    if (!product) {
      console.error('❌ Product "1111" not found');
      return;
    }
    
    console.log(`✅ Found product "${product.name}" with ID: ${product.id}`);
    
    // Check if product already has images
    const { data: existingImages, error: imagesError } = await supabase
      .from('product_images')
      .select('id, image_url, is_primary')
      .eq('product_id', product.id);
    
    if (imagesError) {
      console.error('❌ Error checking existing images:', imagesError);
      return;
    }
    
    if (existingImages && existingImages.length > 0) {
      console.log(`📸 Product already has ${existingImages.length} images`);
      console.log('Sample image:', existingImages[0]);
      return;
    }
    
    console.log('📸 Creating sample image for product "1111"...');
    
    // Create a sample image using a placeholder
    const sampleImage = {
      product_id: product.id,
      image_url: 'https://via.placeholder.com/400x400/4F46E5/FFFFFF?text=Product+1111',
      file_name: 'sample-product-1111.jpg',
      file_size: 1024,
      is_primary: true,
      uploaded_by: null
    };
    
    const { data: newImage, error: insertError } = await supabase
      .from('product_images')
      .insert(sampleImage)
      .select();
    
    if (insertError) {
      console.error('❌ Error creating image:', insertError);
    } else {
      console.log('✅ Successfully created sample image for product "1111"');
      console.log('Image details:', newImage[0]);
    }
    
  } catch (error) {
    console.error('❌ Error in createSampleImageFor1111:', error);
  }
}

// Run the script
async function main() {
  console.log('🚀 Creating sample image for product "1111"...');
  await createSampleImageFor1111();
  console.log('✅ Script completed');
}

main().catch(console.error);
