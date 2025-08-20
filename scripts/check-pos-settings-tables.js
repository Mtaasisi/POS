import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkPOSTables() {
  console.log('🔍 Checking POS settings tables...\n');

  const tables = [
    'lats_pos_barcode_scanner_settings',
    'lats_pos_search_filter_settings',
    'lats_pos_user_permissions_settings',
    'lats_pos_loyalty_customer_settings',
    'lats_pos_analytics_reporting_settings',
    'lats_pos_notification_settings'
  ];

  for (const table of tables) {
    try {
      console.log(`📋 Checking table: ${table}`);
      
      // Try to get table structure using a simple query
      const { data: testData, error: testError } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (testError) {
        console.log(`❌ Table ${table} does not exist or is not accessible:`, testError.message);
      } else {
        console.log(`✅ Table ${table} exists and is accessible`);
        
        // Try to get column information
        try {
          const { data: columns, error: columnError } = await supabase.rpc('exec_sql', {
            sql: `
              SELECT column_name, data_type, is_nullable
              FROM information_schema.columns 
              WHERE table_name = '${table}'
              ORDER BY ordinal_position;
            `
          });

          if (columnError) {
            console.log(`⚠️ Could not get column structure for ${table}:`, columnError.message);
          } else {
            console.log(`📊 Table ${table} has ${columns.length} columns:`);
            columns.forEach(col => {
              console.log(`   - ${col.column_name}: ${col.data_type} ${col.is_nullable === 'YES' ? '(nullable)' : '(not null)'}`);
            });
          }
        } catch (err) {
          console.log(`⚠️ Could not get column structure for ${table}:`, err.message);
        }
      }

      console.log(''); // Empty line for readability
    } catch (err) {
      console.log(`💥 Exception checking ${table}:`, err.message);
      console.log('');
    }
  }
}

async function main() {
  console.log('🚀 Starting POS settings tables check...\n');
  
  await checkPOSTables();
  
  console.log('✅ Check completed');
}

main().catch(console.error);
