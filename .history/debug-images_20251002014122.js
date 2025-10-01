// Debug script to check product images
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugProductImages() {
  console.log('🔍 Debugging product images...');
  
  try {
    // Check if product_images table exists and has data
    const { data: productImages, error: productImagesError } = await supabase
      .from('product_images')
      .select('*')
      .limit(5);
    
    console.log('📊 Product Images Table:');
    console.log('Error:', productImagesError);
    console.log('Count:', productImages?.length || 0);
    console.log('Sample data:', productImages);
    
    // Check lats_products table for images column
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select('id, name, images')
      .limit(5);
    
    console.log('\n📦 Products Table:');
    console.log('Error:', productsError);
    console.log('Count:', products?.length || 0);
    console.log('Sample data:', products);
    
    // Check specific products mentioned in the image
    const productNames = ['Sony KDL-40EX520', 'iMac', 'Mechanical Keyboards'];
    
    for (const name of productNames) {
      const { data: product, error } = await supabase
        .from('lats_products')
        .select('id, name, images')
        .ilike('name', `%${name}%`)
        .single();
      
      console.log(`\n🔍 Product: ${name}`);
      console.log('Error:', error);
      console.log('Data:', product);
      
      if (product?.id) {
        const { data: images, error: imagesError } = await supabase
          .from('product_images')
          .select('*')
          .eq('product_id', product.id);
        
        console.log('Product Images Error:', imagesError);
        console.log('Product Images:', images);
      }
    }
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugProductImages();
