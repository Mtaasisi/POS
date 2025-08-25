import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  console.error('Please set VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixSuppliers400Error() {
  console.log('🔧 Fixing LATS Suppliers 400 Error...\n');

  try {
    // Step 1: Test the current query to see the exact error
    console.log('📋 Step 1: Testing current query...');
    const { data: testData, error: testError } = await supabase
      .from('lats_suppliers')
      .select(`
        id, 
        name, 
        contact_person, 
        email, 
        phone, 
        address, 
        website, 
        notes, 
        company_name,
        description,
        phone2,
        whatsapp,
        instagram,
        wechat_id,
        city,
        country,
        payment_account_type,
        mobile_money_account,
        bank_account_number,
        bank_name,
        created_at, 
        updated_at
      `)
      .order('name')
      .limit(5);

    if (testError) {
      console.log('❌ Current query fails:', testError.message);
      console.log('❌ Error details:', {
        code: testError.code,
        details: testError.details,
        hint: testError.hint
      });
    } else {
      console.log('✅ Current query works! Found', testData?.length || 0, 'suppliers');
      return;
    }

    // Step 2: Try a simpler query to see if it's a column issue
    console.log('\n📋 Step 2: Testing simple query...');
    const { data: simpleData, error: simpleError } = await supabase
      .from('lats_suppliers')
      .select('id, name')
      .limit(5);

    if (simpleError) {
      console.log('❌ Simple query also fails:', simpleError.message);
      console.log('❌ This suggests a table or permission issue');
    } else {
      console.log('✅ Simple query works! Found', simpleData?.length || 0, 'suppliers');
      console.log('❌ This suggests a column issue');
    }

    // Step 3: Try to create a test supplier to see if INSERT works
    console.log('\n📋 Step 3: Testing INSERT...');
    const { data: insertData, error: insertError } = await supabase
      .from('lats_suppliers')
      .insert({
        name: 'Test Supplier',
        contact_person: 'Test Contact',
        email: 'test@example.com',
        phone: '1234567890'
      })
      .select()
      .single();

    if (insertError) {
      console.log('❌ INSERT fails:', insertError.message);
    } else {
      console.log('✅ INSERT works! Created test supplier:', insertData.id);
      
      // Clean up the test supplier
      await supabase
        .from('lats_suppliers')
        .delete()
        .eq('id', insertData.id);
      console.log('🧹 Cleaned up test supplier');
    }

    // Step 4: Check if we can access the table at all
    console.log('\n📋 Step 4: Testing table access...');
    const { data: countData, error: countError } = await supabase
      .from('lats_suppliers')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Cannot access table:', countError.message);
    } else {
      console.log('✅ Can access table. Total suppliers:', countData);
    }

    console.log('\n🔧 Manual fix required:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the fix-suppliers-400-error.sql script');
    console.log('4. Or check the RLS policies in Authentication > Policies');

  } catch (error) {
    console.error('❌ Error in fix script:', error);
  }
}

// Run the fix
fixSuppliers400Error();
