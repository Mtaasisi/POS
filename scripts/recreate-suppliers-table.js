// Script to recreate lats_suppliers table (USE WITH CAUTION - WILL DELETE ALL DATA)
import { supabase } from '../src/lib/supabaseClient.ts';

async function recreateSuppliersTable() {
  console.log('⚠️  WARNING: This will delete all supplier data!');
  console.log('🔄 Recreating lats_suppliers table...\n');

  try {
    // Step 1: Drop the table (this will delete all data!)
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS lats_suppliers CASCADE;'
    });

    if (dropError) {
      console.log('❌ Error dropping table:', dropError.message);
      return;
    }

    console.log('✅ Dropped existing table');

    // Step 2: Create the table with all columns
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
          currency TEXT,
          payment_terms TEXT,
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

    console.log('✅ Created new lats_suppliers table');

    // Step 3: Create indexes
    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE INDEX IF NOT EXISTS idx_lats_suppliers_country ON lats_suppliers(country);
        CREATE INDEX IF NOT EXISTS idx_lats_suppliers_city ON lats_suppliers(city);
        CREATE INDEX IF NOT EXISTS idx_lats_suppliers_payment_type ON lats_suppliers(payment_account_type);
      `
    });

    if (indexError) {
      console.log('⚠️  Warning: Error creating indexes:', indexError.message);
    } else {
      console.log('✅ Created indexes');
    }

    console.log('\n🎉 lats_suppliers table recreated successfully!');
    console.log('⚠️  Remember: All previous supplier data has been deleted');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Uncomment the line below to run (BE CAREFUL!)
// recreateSuppliersTable();
