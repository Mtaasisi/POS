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

async function fixProductImagesRelationship() {
  console.log('🔧 Fixing product_images foreign key relationship...');
  
  try {
    // Check if the foreign key already exists
    console.log('1. Checking current foreign key constraints...');
    const { data: constraints, error: checkError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            tc.constraint_name, 
            tc.table_name, 
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
          FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_name = 'product_images'
            AND ccu.table_name = 'lats_products';
        `
      });
    
    if (checkError) {
      console.error('❌ Error checking constraints:', checkError);
    } else {
      console.log('   Current constraints:', constraints);
    }
    
    // Add the foreign key constraint if it doesn't exist
    console.log('2. Adding foreign key constraint...');
    const { error: fkError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          ALTER TABLE product_images 
          ADD CONSTRAINT fk_product_images_product_id 
          FOREIGN KEY (product_id) 
          REFERENCES lats_products(id) 
          ON DELETE CASCADE;
        `
      });
    
    if (fkError) {
      if (fkError.message.includes('already exists')) {
        console.log('✅ Foreign key constraint already exists');
      } else {
        console.error('❌ Error adding foreign key:', fkError);
      }
    } else {
      console.log('✅ Foreign key constraint added successfully');
    }
    
    // Test the relationship
    console.log('3. Testing the relationship...');
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
      console.error('❌ Test failed:', testError);
    } else {
      console.log('✅ Relationship test successful!');
      console.log('   Product name:', testData?.name);
      console.log('   Images count:', testData?.images?.length || 0);
      console.log('   Variants count:', testData?.variants?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Exception:', error);
  }
}

fixProductImagesRelationship();
