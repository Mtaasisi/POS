import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixRLSPolicies() {
  console.log('🔧 Fixing RLS policies for WhatsApp tables...\n');

  try {
    // First, let's check if we can access the tables at all
    console.log('📋 Checking current table access...');
    const { data: tables, error: tablesError } = await supabase
      .from('whatsapp_chats')
      .select('count')
      .limit(1);

    if (tablesError) {
      console.log('❌ Cannot access whatsapp_chats table:', tablesError.message);
      console.log('💡 This indicates RLS is blocking access');
    } else {
      console.log('✅ whatsapp_chats table is accessible');
    }

    // Provide the SQL fix for RLS policies
    console.log('\n📋 RLS Policy Fix Required:');
    console.log('============================================================');
    console.log(`
-- Fix RLS policies for WhatsApp tables
-- Run this in Supabase SQL Editor

-- Drop existing policies first
DROP POLICY IF EXISTS "Enable all operations for authenticated users on whatsapp_chats" ON whatsapp_chats;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on whatsapp_messages" ON whatsapp_messages;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on scheduled_whatsapp_messages" ON scheduled_whatsapp_messages;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on whatsapp_templates" ON whatsapp_templates;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on whatsapp_autoresponders" ON whatsapp_autoresponders;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on whatsapp_campaigns" ON whatsapp_campaigns;

-- Create more permissive policies for development
CREATE POLICY "Enable all access for all users on whatsapp_chats" 
ON whatsapp_chats FOR ALL USING (true);

CREATE POLICY "Enable all access for all users on whatsapp_messages" 
ON whatsapp_messages FOR ALL USING (true);

CREATE POLICY "Enable all access for all users on scheduled_whatsapp_messages" 
ON scheduled_whatsapp_messages FOR ALL USING (true);

CREATE POLICY "Enable all access for all users on whatsapp_templates" 
ON whatsapp_templates FOR ALL USING (true);

CREATE POLICY "Enable all access for all users on whatsapp_autoresponders" 
ON whatsapp_autoresponders FOR ALL USING (true);

CREATE POLICY "Enable all access for all users on whatsapp_campaigns" 
ON whatsapp_campaigns FOR ALL USING (true);

-- Also fix LATS tables RLS policies
DROP POLICY IF EXISTS "Enable all operations for authenticated users on lats_categories" ON lats_categories;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on lats_brands" ON lats_brands;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on lats_suppliers" ON lats_suppliers;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on lats_products" ON lats_products;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on lats_product_variants" ON lats_product_variants;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on lats_sales" ON lats_sales;
DROP POLICY IF EXISTS "Enable all operations for authenticated users on lats_sale_items" ON lats_sale_items;

CREATE POLICY "Enable all access for all users on lats_categories" 
ON lats_categories FOR ALL USING (true);

CREATE POLICY "Enable all access for all users on lats_brands" 
ON lats_brands FOR ALL USING (true);

CREATE POLICY "Enable all access for all users on lats_suppliers" 
ON lats_suppliers FOR ALL USING (true);

CREATE POLICY "Enable all access for all users on lats_products" 
ON lats_products FOR ALL USING (true);

CREATE POLICY "Enable all access for all users on lats_product_variants" 
ON lats_product_variants FOR ALL USING (true);

CREATE POLICY "Enable all access for all users on lats_sales" 
ON lats_sales FOR ALL USING (true);

CREATE POLICY "Enable all access for all users on lats_sale_items" 
ON lats_sale_items FOR ALL USING (true);

-- Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename LIKE 'whatsapp_%' OR tablename LIKE 'lats_%'
ORDER BY tablename, policyname;
`);
    console.log('============================================================');
    console.log('\n📝 Instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the SQL above');
    console.log('4. Click "Run" to execute');
    console.log('5. Return to the app and test WhatsApp functionality');
    console.log('\n⚠️  Note: These policies allow all access for development.');
    console.log('   For production, you should implement proper authentication-based policies.');

  } catch (error) {
    console.error('❌ Error checking RLS policies:', error);
  }
}

// Run the fix
fixRLSPolicies().catch(console.error);
