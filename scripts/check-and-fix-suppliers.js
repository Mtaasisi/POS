// Script to check and fix lats_suppliers table
import { supabase } from '../src/lib/supabaseClient.ts';

async function checkAndFixSuppliers() {
  console.log('🔍 Checking lats_suppliers table...\n');

  try {
    // Step 1: Check if table exists
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
      console.log('❌ Error checking table:', tableError.message);
      return;
    }

    if (tableExists[0]?.exists) {
      console.log('✅ lats_suppliers table exists');
      
      // Step 2: Check columns
      const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable
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

      console.log('📊 Current columns:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });

      // Step 3: Add missing columns if needed
      const requiredColumns = [
        'company_name', 'description', 'phone2', 'whatsapp', 'instagram', 
        'wechat_id', 'city', 'country', 'payment_account_type', 
        'mobile_money_account', 'bank_account_number', 'bank_name', 
        'currency', 'payment_terms', 'is_active'
      ];

      const existingColumns = columns.map(col => col.column_name);
      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

      if (missingColumns.length > 0) {
        console.log('\n🔧 Adding missing columns...');
        
        for (const column of missingColumns) {
          let alterSQL = '';
          
          switch (column) {
            case 'payment_account_type':
              alterSQL = `ALTER TABLE lats_suppliers ADD COLUMN IF NOT EXISTS ${column} TEXT CHECK (${column} IN ('mobile_money', 'bank_account', 'other'));`;
              break;
            case 'is_active':
              alterSQL = `ALTER TABLE lats_suppliers ADD COLUMN IF NOT EXISTS ${column} BOOLEAN DEFAULT true;`;
              break;
            default:
              alterSQL = `ALTER TABLE lats_suppliers ADD COLUMN IF NOT EXISTS ${column} TEXT;`;
          }

          const { error: alterError } = await supabase.rpc('exec_sql', { sql: alterSQL });
          
          if (alterError) {
            console.log(`❌ Error adding column ${column}:`, alterError.message);
          } else {
            console.log(`✅ Added column: ${column}`);
          }
        }
      } else {
        console.log('✅ All required columns exist');
      }

    } else {
      console.log('❌ lats_suppliers table does not exist');
      console.log('Run the migration script to create it');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkAndFixSuppliers();
