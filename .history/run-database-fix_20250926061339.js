// Run Database Fix Script
// This script will execute the database structure fix through Supabase

import { createClient } from '@supabase/supabase-js';

// Configuration - replace with your actual Supabase credentials
const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fixDatabaseStructure() {
  console.log('🔧 Starting database structure fix...');
  
  try {
    // First, let's check the current structure
    console.log('📋 Checking current lats_sales table structure...');
    const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
      query: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'lats_sales' 
        ORDER BY ordinal_position;
      `
    });
    
    if (columnsError) {
      console.error('❌ Error checking table structure:', columnsError);
      return;
    }
    
    console.log('📊 Current columns:', columns);
    
    // Add missing columns
    const alterQueries = [
      // Add sale_number column if it doesn't exist
      `ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS sale_number VARCHAR(50);`,
      `ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS subtotal DECIMAL(15,2) DEFAULT 0;`,
      `ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(15,2) DEFAULT 0;`,
      `ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS discount_type VARCHAR(20) DEFAULT 'fixed';`,
      `ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS discount_value DECIMAL(15,2) DEFAULT 0;`,
      `ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS customer_name VARCHAR(255);`,
      `ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS customer_phone VARCHAR(20);`,
      `ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS tax DECIMAL(15,2) DEFAULT 0;`,
      `ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS total_amount DECIMAL(15,2) DEFAULT 0;`,
      `ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'cash';`,
      `ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'completed';`,
      `ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS created_by TEXT;`,
      `ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS notes TEXT;`,
      `ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`,
      `ALTER TABLE lats_sales ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`
    ];
    
    console.log('🔨 Adding missing columns...');
    for (const query of alterQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { query });
        if (error) {
          console.warn('⚠️ Warning for query:', query, error);
        } else {
          console.log('✅ Success:', query);
        }
      } catch (err) {
        console.warn('⚠️ Warning for query:', query, err);
      }
    }
    
    // Add constraints and indexes
    const constraintQueries = [
      `ALTER TABLE lats_sales ADD CONSTRAINT IF NOT EXISTS chk_discount_type CHECK (discount_type IN ('fixed', 'percentage'));`,
      `ALTER TABLE lats_sales ADD CONSTRAINT IF NOT EXISTS chk_status CHECK (status IN ('pending', 'completed', 'cancelled', 'refunded'));`,
      `CREATE UNIQUE INDEX IF NOT EXISTS idx_lats_sales_sale_number ON lats_sales(sale_number);`,
      `CREATE INDEX IF NOT EXISTS idx_lats_sales_customer_id ON lats_sales(customer_id);`,
      `CREATE INDEX IF NOT EXISTS idx_lats_sales_total_amount ON lats_sales(total_amount);`,
      `CREATE INDEX IF NOT EXISTS idx_lats_sales_created_at ON lats_sales(created_at);`
    ];
    
    console.log('🔧 Adding constraints and indexes...');
    for (const query of constraintQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { query });
        if (error) {
          console.warn('⚠️ Warning for constraint query:', query, error);
        } else {
          console.log('✅ Success:', query);
        }
      } catch (err) {
        console.warn('⚠️ Warning for constraint query:', query, err);
      }
    }
    
    // Enable RLS
    console.log('🔒 Enabling Row Level Security...');
    try {
      const { error: rlsError } = await supabase.rpc('exec_sql', {
        query: `ALTER TABLE lats_sales ENABLE ROW LEVEL SECURITY;`
      });
      if (rlsError) {
        console.warn('⚠️ RLS warning:', rlsError);
      } else {
        console.log('✅ RLS enabled');
      }
    } catch (err) {
      console.warn('⚠️ RLS error:', err);
    }
    
    // Create RLS policies
    const policyQueries = [
      `DROP POLICY IF EXISTS "Enable read access for all users" ON lats_sales;`,
      `DROP POLICY IF EXISTS "Enable insert access for all users" ON lats_sales;`,
      `DROP POLICY IF EXISTS "Enable update access for all users" ON lats_sales;`,
      `CREATE POLICY "Enable read access for all users" ON lats_sales FOR SELECT USING (true);`,
      `CREATE POLICY "Enable insert access for all users" ON lats_sales FOR INSERT WITH CHECK (true);`,
      `CREATE POLICY "Enable update access for all users" ON lats_sales FOR UPDATE USING (true);`
    ];
    
    console.log('🛡️ Creating RLS policies...');
    for (const query of policyQueries) {
      try {
        const { error } = await supabase.rpc('exec_sql', { query });
        if (error) {
          console.warn('⚠️ Warning for policy query:', query, error);
        } else {
          console.log('✅ Success:', query);
        }
      } catch (err) {
        console.warn('⚠️ Warning for policy query:', query, err);
      }
    }
    
    // Test the structure
    console.log('🧪 Testing the updated structure...');
    const { data: testData, error: testError } = await supabase
      .from('lats_sales')
      .select('*')
      .limit(1);
    
    if (testError) {
      console.error('❌ Test query failed:', testError);
    } else {
      console.log('✅ Test query successful');
    }
    
    console.log('🎉 Database structure fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing database structure:', error);
  }
}

// Run the fix
fixDatabaseStructure().catch(console.error);
