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

async function addMissingSupplierColumns() {
  console.log('🔧 Adding missing columns to lats_suppliers table...\n');

  try {
    // Step 1: Check current columns
    console.log('📋 Step 1: Checking current columns...');
    const { data: simpleData, error: simpleError } = await supabase
      .from('lats_suppliers')
      .select('*')
      .limit(1);

    if (simpleError) {
      console.log('❌ Cannot access table:', simpleError.message);
      return;
    }

    console.log('✅ Can access table. Sample data keys:', Object.keys(simpleData[0] || {}));

    // Step 2: Try to add missing columns one by one
    const missingColumns = [
      'company_name',
      'description', 
      'phone2',
      'whatsapp',
      'instagram',
      'wechat_id',
      'city',
      'country',
      'payment_account_type',
      'mobile_money_account',
      'bank_account_number',
      'bank_name',
      'is_active'
    ];

    console.log('\n📋 Step 2: Adding missing columns...');
    
    for (const column of missingColumns) {
      try {
        // Try to select the column to see if it exists
        const { data: testData, error: testError } = await supabase
          .from('lats_suppliers')
          .select(column)
          .limit(1);

        if (testError && testError.message.includes('does not exist')) {
          console.log(`📋 Adding column: ${column}`);
          
          // Add the column by trying to insert a record with the new column
          const { data: insertData, error: insertError } = await supabase
            .from('lats_suppliers')
            .insert({
              name: `Test Supplier ${Date.now()}`,
              [column]: column === 'is_active' ? true : `test_${column}`
            })
            .select()
            .single();

          if (insertError) {
            console.log(`❌ Could not add column ${column}:`, insertError.message);
          } else {
            console.log(`✅ Added column: ${column}`);
            
            // Clean up the test record
            await supabase
              .from('lats_suppliers')
              .delete()
              .eq('id', insertData.id);
          }
        } else {
          console.log(`✅ Column ${column} already exists`);
        }
      } catch (error) {
        console.log(`⚠️ Error checking column ${column}:`, error.message);
      }
    }

    // Step 3: Test the full query again
    console.log('\n📋 Step 3: Testing full query...');
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
      console.log('❌ Full query still fails:', testError.message);
      console.log('❌ Error details:', {
        code: testError.code,
        details: testError.details,
        hint: testError.hint
      });
    } else {
      console.log('✅ Full query works! Found', testData?.length || 0, 'suppliers');
      console.log('🎉 Success! The 400 error should now be resolved.');
    }

  } catch (error) {
    console.error('❌ Error in script:', error);
  }
}

// Run the script
addMissingSupplierColumns();
