import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkPOSStatus() {
  console.log('🔍 Quick POS System Status Check...\n');
  
  try {
    const { data: products } = await supabase.from('lats_products').select('*').eq('is_active', true);
    const { data: variants } = await supabase.from('lats_product_variants').select('*');
    
    const productCount = products?.length || 0;
    const variantCount = variants?.length || 0;
    
    console.log(`📦 Products: ${productCount}`);
    console.log(`🔧 Variants: ${variantCount}`);
    
    if (productCount > 0 && variantCount > 0) {
      console.log('\n✅ POS System is WORKING!');
      console.log('🌐 Open http://localhost:5173 to test the POS system');
      
      console.log('\n📋 Sample products available:');
      products?.slice(0, 3).forEach(product => {
        console.log(`  - ${product.name} ($${product.total_value})`);
      });
    } else {
      console.log('\n❌ POS System needs data!');
      console.log('📋 Follow the steps in POS_SYSTEM_FIX_GUIDE.md');
      console.log('🔗 Or run: node scripts/test-pos-products.js for detailed info');
    }
    
  } catch (error) {
    console.error('❌ Error checking status:', error.message);
  }
}

checkPOSStatus();
