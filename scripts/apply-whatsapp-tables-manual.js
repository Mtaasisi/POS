import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function showWhatsAppMigrationInstructions() {
  console.log('🚀 WhatsApp Tables Migration Instructions');
  console.log('==========================================\n');
  
  try {
    // Read the migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20241201000060_create_whatsapp_tables.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('❌ Migration file not found:', migrationPath);
      return;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📋 To fix the 404 error for whatsapp_instances table, you need to apply this migration:');
    console.log('\n🔧 Manual Steps:');
    console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard');
    console.log('2. Select your project: jxhzveborezjhsmzsgbc');
    console.log('3. Navigate to SQL Editor (in the left sidebar)');
    console.log('4. Copy and paste the SQL below');
    console.log('5. Click "Run" to execute the migration');
    console.log('\n📋 SQL to execute:');
    console.log('='.repeat(80));
    console.log(migrationSQL);
    console.log('='.repeat(80));
    
    console.log('\n✅ After applying the migration:');
    console.log('- The whatsapp_instances table will be created');
    console.log('- The whatsapp_messages table will be created');
    console.log('- The whatsapp_webhooks table will be created');
    console.log('- All necessary indexes and RLS policies will be set up');
    console.log('- The 404 error should be resolved');
    
    console.log('\n🧪 Testing the migration:');
    console.log('After applying the migration, you can test it by running:');
    console.log('node scripts/test-whatsapp-tables.js');
    
  } catch (error) {
    console.error('💥 Error reading migration file:', error);
  }
}

// Run the instructions
showWhatsAppMigrationInstructions();
