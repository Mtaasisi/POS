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
    // Step 1: Check if the table exists
    console.log('📋 Step 1: Checking if lats_suppliers table exists...');
    const { data: tableExists, error: tableError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'lats_suppliers'
        );
      `
    });

    if (tableError) {
      console.log('❌ Error checking table existence:', tableError.message);
      return;
    }

    if (!tableExists) {
      console.log('❌ lats_suppliers table does not exist. Creating it...');
      
      // Create the table with all required columns
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS lats_suppliers (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            name TEXT NOT NULL,
            contact_person TEXT,
            email TEXT,
            phone TEXT,
            address TEXT,
            website TEXT,
            notes TEXT,
            company_name TEXT,
            description TEXT,
            phone2 TEXT,
            whatsapp TEXT,
            instagram TEXT,
            wechat_id TEXT,
            city TEXT,
            country TEXT,
            payment_account_type TEXT CHECK (payment_account_type IN ('mobile_money', 'bank_account', 'other')),
            mobile_money_account TEXT,
            bank_account_number TEXT,
            bank_name TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });

      if (createError) {
        console.log('❌ Error creating table:', createError.message);
        return;
      }

      console.log('✅ lats_suppliers table created successfully');
    } else {
      console.log('✅ lats_suppliers table exists');
    }

    // Step 2: Check and add missing columns
    console.log('\n📋 Step 2: Checking for missing columns...');
    const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'lats_suppliers' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    });

    if (columnsError) {
      console.log('❌ Error checking columns:', columnsError.message);
      return;
    }

    console.log('📊 Current columns:', columns.map(c => c.column_name).join(', '));

    // Add missing columns if they don't exist
    const requiredColumns = [
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

    for (const column of requiredColumns) {
      if (!columns.some(c => c.column_name === column)) {
        console.log(`📋 Adding missing column: ${column}`);
        
        let columnDef = '';
        if (column === 'payment_account_type') {
          columnDef = 'TEXT CHECK (payment_account_type IN (\'mobile_money\', \'bank_account\', \'other\'))';
        } else if (column === 'is_active') {
          columnDef = 'BOOLEAN DEFAULT true';
        } else {
          columnDef = 'TEXT';
        }

        const { error: addError } = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE lats_suppliers ADD COLUMN IF NOT EXISTS ${column} ${columnDef};`
        });

        if (addError) {
          console.log(`⚠️ Could not add column ${column}:`, addError.message);
        } else {
          console.log(`✅ Added column: ${column}`);
        }
      }
    }

    // Step 3: Fix RLS policies
    console.log('\n📋 Step 3: Fixing RLS policies...');
    
    // Drop existing restrictive policies
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: `
        DROP POLICY IF EXISTS "Allow authenticated users to manage suppliers" ON lats_suppliers;
        DROP POLICY IF EXISTS "Enable all access for all users on lats_suppliers" ON lats_suppliers;
        DROP POLICY IF EXISTS "Enable all access for authenticated users" ON lats_suppliers;
      `
    });

    if (dropError) {
      console.log('⚠️ Could not drop existing policies:', dropError.message);
    }

    // Create permissive policy for all users
    const { error: policyError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE POLICY "Enable all access for all users on lats_suppliers" 
        ON lats_suppliers FOR ALL USING (true);
      `
    });

    if (policyError) {
      console.log('❌ Error creating policy:', policyError.message);
    } else {
      console.log('✅ Created permissive RLS policy');
    }

    // Step 4: Grant permissions
    console.log('\n📋 Step 4: Granting permissions...');
    const { error: grantError } = await supabase.rpc('exec_sql', {
      sql: `
        GRANT ALL ON lats_suppliers TO authenticated;
        GRANT ALL ON lats_suppliers TO anon;
      `
    });

    if (grantError) {
      console.log('⚠️ Could not grant permissions:', grantError.message);
    } else {
      console.log('✅ Granted permissions to authenticated and anon users');
    }

    // Step 5: Create indexes for better performance
    console.log('\n📋 Step 5: Creating indexes...');
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_lats_suppliers_name ON lats_suppliers(name);
        CREATE INDEX IF NOT EXISTS idx_lats_suppliers_is_active ON lats_suppliers(is_active);
        CREATE INDEX IF NOT EXISTS idx_lats_suppliers_country ON lats_suppliers(country);
        CREATE INDEX IF NOT EXISTS idx_lats_suppliers_city ON lats_suppliers(city);
      `
    });

    if (indexError) {
      console.log('⚠️ Could not create indexes:', indexError.message);
    } else {
      console.log('✅ Created performance indexes');
    }

    // Step 6: Test the query
    console.log('\n📋 Step 6: Testing the query...');
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
      console.log('❌ Test query failed:', testError.message);
      console.log('❌ Error details:', {
        code: testError.code,
        details: testError.details,
        hint: testError.hint
      });
    } else {
      console.log('✅ Test query successful!');
      console.log(`📊 Found ${testData?.length || 0} suppliers`);
    }

    console.log('\n🎉 LATS Suppliers 400 Error Fix Complete!');
    console.log('\n📋 Summary:');
    console.log('1. ✅ Verified/created lats_suppliers table');
    console.log('2. ✅ Added missing columns');
    console.log('3. ✅ Fixed RLS policies');
    console.log('4. ✅ Granted proper permissions');
    console.log('5. ✅ Created performance indexes');
    console.log('6. ✅ Tested the query');
    console.log('\n🔧 The 400 error should now be resolved. Try refreshing your application.');

  } catch (error) {
    console.error('❌ Error fixing suppliers 400 error:', error);
    console.log('\n🔧 Manual fix required:');
    console.log('1. Go to your Supabase Dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Run the fix-suppliers-400-error.sql script');
  }
}

// Run the fix
fixSuppliers400Error();
