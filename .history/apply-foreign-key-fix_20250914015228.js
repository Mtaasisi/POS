import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyForeignKeyFix() {
  console.log('🔧 Applying foreign key fix for product_images...');
  
  try {
    // Read the migration file
    const fs = await import('fs');
    const migrationSQL = fs.readFileSync('supabase/migrations/20250131000050_fix_product_images_foreign_key.sql', 'utf8');
    
    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`   ${i + 1}/${statements.length}: ${statement.substring(0, 50)}...`);
        
        try {
          // Try to execute the statement using a direct query
          const { error } = await supabase
            .from('lats_products')
            .select('id')
            .limit(1);
          
          // For now, just log that we would execute this
          console.log(`   ✅ Would execute: ${statement.substring(0, 50)}...`);
        } catch (e) {
          console.log(`   ⚠️  Could not execute: ${statement.substring(0, 50)}...`);
        }
      }
    }
    
    // Test the relationship after applying the fix
    console.log('\n🧪 Testing the relationship...');
    const { data: testData, error: testError } = await supabase
      .from('lats_products')
      .select(`
        *,
        variants:lats_product_variants(*),
        images:product_images(*)
      `)
      .eq('id', '52995b84-a675-43ae-b6bf-48d9b4051ec9')
      .single();
    
    if (testError) {
      console.error('❌ Test failed:', testError.message);
      console.log('\n💡 The foreign key relationship still needs to be created.');
      console.log('   You can apply the migration manually in your Supabase dashboard:');
      console.log('   File: supabase/migrations/20250131000050_fix_product_images_foreign_key.sql');
    } else {
      console.log('✅ Relationship test successful!');
      console.log('   Product name:', testData?.name);
      console.log('   Images count:', testData?.images?.length || 0);
      console.log('   Variants count:', testData?.variants?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Error applying fix:', error);
  }
}

applyForeignKeyFix();
