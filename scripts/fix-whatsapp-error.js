import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixWhatsAppError() {
  try {
    console.log('🔧 Fixing WhatsApp scheduled_for column error...\n');
    
    // Check if tables exist
    console.log('🔍 Checking existing WhatsApp tables...');
    
    const { data: existingTables, error: checkError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .like('table_name', 'whatsapp_%');
    
    if (checkError) {
      console.log('⚠️  Could not check existing tables');
    } else if (existingTables && existingTables.length > 0) {
      console.log('📋 Found existing WhatsApp tables:');
      existingTables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
      
      // Check if scheduled_whatsapp_messages table has the right structure
      console.log('\n🔍 Checking scheduled_whatsapp_messages table structure...');
      
      const { data: columns, error: columnError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type')
        .eq('table_schema', 'public')
        .eq('table_name', 'scheduled_whatsapp_messages');
      
      if (columnError) {
        console.log('⚠️  Could not check table structure');
      } else if (columns) {
        console.log('📋 Current columns in scheduled_whatsapp_messages:');
        columns.forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type}`);
        });
        
        const hasScheduledFor = columns.some(col => col.column_name === 'scheduled_for');
        if (!hasScheduledFor) {
          console.log('\n❌ scheduled_for column is missing!');
          console.log('📝 You need to recreate the table with the correct structure.');
        } else {
          console.log('\n✅ scheduled_for column exists');
        }
      }
    } else {
      console.log('📋 No WhatsApp tables found');
    }
    
    console.log('\n📄 To fix this error, run the following SQL in your Supabase dashboard:');
    console.log('='.repeat(60));
    
    // Read and display the fix SQL
    const fixSqlPath = path.join(__dirname, '..', 'fix-whatsapp-column-error.sql');
    if (fs.existsSync(fixSqlPath)) {
      const sqlContent = fs.readFileSync(fixSqlPath, 'utf8');
      console.log(sqlContent);
    } else {
      console.log('-- Fix for WhatsApp scheduled_for column error');
      console.log('-- Run this in Supabase SQL Editor');
      console.log('');
      console.log('-- Drop existing tables to recreate with correct structure');
      console.log('DROP TABLE IF EXISTS scheduled_whatsapp_messages CASCADE;');
      console.log('DROP TABLE IF EXISTS whatsapp_campaigns CASCADE;');
      console.log('DROP TABLE IF EXISTS whatsapp_autoresponders CASCADE;');
      console.log('DROP TABLE IF EXISTS whatsapp_templates CASCADE;');
      console.log('DROP TABLE IF EXISTS whatsapp_messages CASCADE;');
      console.log('DROP TABLE IF EXISTS whatsapp_chats CASCADE;');
      console.log('');
      console.log('-- Then run the complete table creation script from whatsapp-tables-simple.sql');
    }
    
    console.log('='.repeat(60));
    console.log('\n📝 Instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Copy and paste the SQL above');
    console.log('4. Click "Run" to execute');
    console.log('5. Return to the app and refresh the WhatsApp page');
    console.log('\n⚠️  Note: This will drop and recreate all WhatsApp tables.');
    console.log('   If you have existing data, make sure to backup first!');
    
  } catch (error) {
    console.error('❌ Error during fix check:', error);
    console.log('\n📝 Manual Fix Instructions:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to SQL Editor');
    console.log('3. Drop the scheduled_whatsapp_messages table');
    console.log('4. Recreate it with the scheduled_for column');
    console.log('5. Or run the complete fix script from fix-whatsapp-column-error.sql');
  }
}

fixWhatsAppError();
