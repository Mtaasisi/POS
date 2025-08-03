import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRelationships() {
  console.log('🔧 Fixing foreign key relationships...');
  
  const sqlStatements = [
    // Add foreign key for category_id
    `ALTER TABLE products ADD CONSTRAINT IF NOT EXISTS fk_products_category 
     FOREIGN KEY (category_id) REFERENCES inventory_categories(id)`,
    
    // Add foreign key for supplier_id  
    `ALTER TABLE products ADD CONSTRAINT IF NOT EXISTS fk_products_supplier 
     FOREIGN KEY (supplier_id) REFERENCES suppliers(id)`,
    
    // Add foreign key for product_id in product_variants
    `ALTER TABLE product_variants ADD CONSTRAINT IF NOT EXISTS fk_variants_product 
     FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE`,
    
    // Add indexes for better performance
    `CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id)`,
    `CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id)`,
    `CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id)`
  ];
  
  for (let i = 0; i < sqlStatements.length; i++) {
    const statement = sqlStatements[i];
    console.log(`📝 Executing statement ${i + 1}...`);
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        console.log(`⚠️  Statement ${i + 1} failed: ${error.message}`);
      } else {
        console.log(`✅ Statement ${i + 1} executed successfully`);
      }
    } catch (e) {
      console.log(`⚠️  Statement ${i + 1} skipped: ${e.message}`);
    }
  }
  
  // Test the query again
  console.log('\n🧪 Testing the query again...');
  try {
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
      console.log('❌ Query still failing:', error.message);
    } else {
      console.log('✅ Query now works!');
      console.log(`📊 Found ${data?.length || 0} products`);
    }
  } catch (e) {
    console.log('❌ Exception:', e.message);
  }
}

fixRelationships(); 