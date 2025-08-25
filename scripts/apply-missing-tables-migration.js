import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMissingTablesMigration() {
  console.log('🔧 Applying Missing Tables Migration...\n');

  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250122000001_fix_missing_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📋 Migration SQL loaded successfully');
    console.log('📝 Please run the following SQL in your Supabase SQL Editor:\n');
    console.log('=' .repeat(80));
    console.log(migrationSQL);
    console.log('=' .repeat(80));
    console.log('\n📋 After running the SQL, test the tables:');
    console.log('1. Run: node scripts/check-enhanced-tables.js');
    console.log('2. Restart your application');
    console.log('3. Check the console for any remaining errors');

    // Test if tables exist after manual application
    console.log('\n🧪 Testing table access (after you run the SQL)...');
    
    setTimeout(async () => {
      try {
        // Test whatsapp_notifications
        const { data: notificationsTest, error: notificationsTestError } = await supabase
          .from('whatsapp_notifications')
          .select('*')
          .limit(1);
        
        if (notificationsTestError) {
          console.log('❌ whatsapp_notifications table test failed:', notificationsTestError.message);
        } else {
          console.log('✅ whatsapp_notifications table accessible');
        }

        // Test notification_settings
        const { data: settingsTest, error: settingsTestError } = await supabase
          .from('notification_settings')
          .select('*')
          .limit(1);
        
        if (settingsTestError) {
          console.log('❌ notification_settings table test failed:', settingsTestError.message);
        } else {
          console.log('✅ notification_settings table accessible');
        }

        // Test lats_sales
        const { data: salesTest, error: salesTestError } = await supabase
          .from('lats_sales')
          .select('*')
          .limit(1);
        
        if (salesTestError) {
          console.log('❌ lats_sales table test failed:', salesTestError.message);
        } else {
          console.log('✅ lats_sales table accessible');
        }

        console.log('\n🎉 Migration testing completed!');
      } catch (error) {
        console.error('❌ Error testing tables:', error);
      }
    }, 5000); // Wait 5 seconds for manual SQL execution

  } catch (error) {
    console.error('❌ Error applying migration:', error);
  }
}

applyMissingTablesMigration();
