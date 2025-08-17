// Script to apply the suppliers table migration
import { supabase } from '../src/lib/supabaseClient.ts';

const migrationSQL = `
-- Migration to update lats_suppliers table with additional fields
-- This migration adds the missing fields that the SupplierForm component expects

-- Add new columns to lats_suppliers table
ALTER TABLE lats_suppliers 
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS phone2 TEXT,
ADD COLUMN IF NOT EXISTS whatsapp TEXT,
ADD COLUMN IF NOT EXISTS instagram TEXT,
ADD COLUMN IF NOT EXISTS wechat_id TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS country TEXT,
ADD COLUMN IF NOT EXISTS payment_account_type TEXT CHECK (payment_account_type IN ('mobile_money', 'bank_account', 'other')),
ADD COLUMN IF NOT EXISTS mobile_money_account TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT;

-- Add comments to document the new fields
COMMENT ON COLUMN lats_suppliers.company_name IS 'Company name that the supplier represents';
COMMENT ON COLUMN lats_suppliers.description IS 'Detailed description of the supplier';
COMMENT ON COLUMN lats_suppliers.phone2 IS 'Secondary phone number';
COMMENT ON COLUMN lats_suppliers.whatsapp IS 'WhatsApp business number';
COMMENT ON COLUMN lats_suppliers.instagram IS 'Instagram handle';
COMMENT ON COLUMN lats_suppliers.wechat_id IS 'WeChat business account ID';
COMMENT ON COLUMN lats_suppliers.city IS 'City where supplier is located';
COMMENT ON COLUMN lats_suppliers.country IS 'Country where supplier is located';
COMMENT ON COLUMN lats_suppliers.payment_account_type IS 'Type of payment account (mobile_money, bank_account, other)';
COMMENT ON COLUMN lats_suppliers.mobile_money_account IS 'Mobile money phone number';
COMMENT ON COLUMN lats_suppliers.bank_account_number IS 'Bank account number';
COMMENT ON COLUMN lats_suppliers.bank_name IS 'Name of the bank';

-- Create index on commonly searched fields
CREATE INDEX IF NOT EXISTS idx_lats_suppliers_country ON lats_suppliers(country);
CREATE INDEX IF NOT EXISTS idx_lats_suppliers_city ON lats_suppliers(city);
CREATE INDEX IF NOT EXISTS idx_lats_suppliers_payment_type ON lats_suppliers(payment_account_type);
`;

async function applySuppliersMigration() {
  try {
    console.log('🔧 Applying suppliers table migration...');
    
    // Execute the migration SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error('❌ Migration failed:', error);
      
      // Try alternative approach using direct SQL execution
      console.log('🔄 Trying alternative approach...');
      
      // Split the SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      for (const statement of statements) {
        try {
          const { error: stmtError } = await supabase.rpc('exec_sql', { sql: statement + ';' });
          if (stmtError) {
            console.warn('⚠️ Statement failed (this might be expected):', stmtError.message);
          } else {
            console.log('✅ Statement executed successfully');
          }
        } catch (stmtErr) {
          console.warn('⚠️ Statement error (this might be expected):', stmtErr.message);
        }
      }
    } else {
      console.log('✅ Migration applied successfully');
    }
    
    // Verify the migration by checking if the new columns exist
    console.log('🔍 Verifying migration...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'lats_suppliers')
      .eq('table_schema', 'public');
    
    if (columnsError) {
      console.error('❌ Could not verify migration:', columnsError);
    } else {
      const columnNames = columns.map(col => col.column_name);
      const expectedColumns = [
        'company_name', 'description', 'phone2', 'whatsapp', 'instagram', 
        'wechat_id', 'city', 'country', 'payment_account_type', 
        'mobile_money_account', 'bank_account_number', 'bank_name'
      ];
      
      const missingColumns = expectedColumns.filter(col => !columnNames.includes(col));
      
      if (missingColumns.length === 0) {
        console.log('✅ All expected columns are present');
      } else {
        console.log('⚠️ Missing columns:', missingColumns);
      }
      
      console.log('📋 Current columns:', columnNames);
    }
    
  } catch (error) {
    console.error('❌ Migration script failed:', error);
  }
}

// Run the migration
applySuppliersMigration();
