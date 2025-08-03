import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
  console.log('🔍 Testing the exact query that\'s failing...');
  
  try {
    // This is the exact query from the error
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        category:inventory_categories(*),
        supplier:suppliers(*),
        variants:product_variants(*)
      `)
      .eq('is_active', true)
      .order('name');
    
    if (error) {
      console.log('❌ Query failed:', error.message);
      console.log('🔍 Error details:', error);
    } else {
      console.log('✅ Query successful!');
      console.log(`📊 Found ${data?.length || 0} products`);
    }
  } catch (e) {
    console.log('❌ Exception:', e.message);
  }
}

testQuery(); 