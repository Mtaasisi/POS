/**
 * Debug script for when storage bucket exists but images don't display
 * Run this in browser console to identify the specific issue
 */

console.log('🔍 Debugging Image Display with Existing Bucket...\n');

console.log('✅ Storage bucket "product-images" already exists');
console.log('🔍 Now checking other potential issues...\n');

console.log('📋 DIAGNOSTIC STEPS:');
console.log('');

console.log('1️⃣ CHECK BUCKET POLICIES:');
console.log('   Go to Supabase Dashboard > Storage > Policies');
console.log('   Select "product-images" bucket');
console.log('   Verify these policies exist:');
console.log('   • "Public read access" (SELECT, public, true)');
console.log('   • "Authenticated upload" (INSERT, authenticated)');
console.log('   • "Authenticated update" (UPDATE, authenticated)');
console.log('   • "Authenticated delete" (DELETE, authenticated)');
console.log('');

console.log('2️⃣ TEST BUCKET ACCESS (Run in browser console):');
const testCode = `
// Test bucket access
async function testBucketAccess() {
  try {
    console.log('🔍 Testing bucket access...');
    
    // Test 1: List files in bucket
    const { data, error } = await supabase.storage
      .from('product-images')
      .list('', { limit: 5 });
    
    if (error) {
      console.error('❌ Bucket access error:', error);
      return false;
    }
    
    console.log('✅ Bucket accessible, files found:', data.length);
    console.log('📁 Sample files:', data);
    
    // Test 2: Check if bucket is public
    const testUrl = supabase.storage
      .from('product-images')
      .getPublicUrl('test-file.jpg');
    
    console.log('🔗 Public URL format:', testUrl.data.publicUrl);
    
    return true;
    
  } catch (error) {
    console.error('❌ Test error:', error);
    return false;
  }
}

testBucketAccess();
`;

console.log(testCode);
console.log('');

console.log('3️⃣ CHECK IMAGE DATA IN DATABASE:');
const dbTestCode = `
// Check product images in database
async function checkProductImages() {
  try {
    console.log('🔍 Checking product images in database...');
    
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Database query error:', error);
      return false;
    }
    
    console.log('✅ Product images found:', data.length);
    console.log('📊 Sample image data:', data);
    
    // Check image URLs
    data.forEach((img, index) => {
      console.log(\`Image \${index + 1}:\`);
      console.log('  URL:', img.image_url);
      console.log('  File:', img.file_name);
      console.log('  Size:', img.file_size);
      console.log('  Primary:', img.is_primary);
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Database check error:', error);
    return false;
  }
}

checkProductImages();
`;

console.log(dbTestCode);
console.log('');

console.log('4️⃣ CHECK SPECIFIC PRODUCT IMAGES:');
const productTestCode = `
// Check images for a specific product
async function checkProductImages(productId) {
  try {
    console.log('🔍 Checking images for product:', productId);
    
    const { data, error } = await supabase
      .from('product_images')
      .select('*')
      .eq('product_id', productId);
    
    if (error) {
      console.error('❌ Product image query error:', error);
      return false;
    }
    
    console.log('✅ Images for this product:', data.length);
    data.forEach((img, index) => {
      console.log(\`Image \${index + 1}:\`);
      console.log('  ID:', img.id);
      console.log('  URL:', img.image_url);
      console.log('  Primary:', img.is_primary);
      
      // Test if image URL is accessible
      fetch(img.image_url)
        .then(response => {
          if (response.ok) {
            console.log('  ✅ Image URL accessible');
          } else {
            console.log('  ❌ Image URL not accessible:', response.status);
          }
        })
        .catch(err => {
          console.log('  ❌ Image URL error:', err.message);
        });
    });
    
    return true;
    
  } catch (error) {
    console.error('❌ Product check error:', error);
    return false;
  }
}

// Replace 'your-product-id' with actual product ID
// checkProductImages('your-product-id');
`;

console.log(productTestCode);
console.log('');

console.log('5️⃣ COMMON ISSUES TO CHECK:');
console.log('');
console.log('🔸 Issue: Images uploaded but not displaying');
console.log('   Cause: Bucket policies not allowing public read');
console.log('   Fix: Add "Public read access" policy');
console.log('');
console.log('🔸 Issue: Upload works but images don\'t save to database');
console.log('   Cause: Database insert failing');
console.log('   Fix: Check product_images table and RLS policies');
console.log('');
console.log('🔸 Issue: Images show as broken links');
console.log('   Cause: URLs pointing to wrong location');
console.log('   Fix: Check Supabase project URL configuration');
console.log('');
console.log('🔸 Issue: Authentication errors');
console.log('   Cause: User not properly authenticated');
console.log('   Fix: Check auth token and login status');
console.log('');

console.log('6️⃣ QUICK FIXES TO TRY:');
console.log('');
console.log('• Refresh the page and try again');
console.log('• Log out and log back in');
console.log('• Check browser console for specific errors');
console.log('• Verify you\'re looking at the right product');
console.log('• Try uploading a new image to test');
console.log('');

console.log('💡 NEXT STEPS:');
console.log('1. Run the test codes above in browser console');
console.log('2. Share any error messages you see');
console.log('3. Let me know what the test results show');
console.log('4. I can then provide specific fixes based on the results');
