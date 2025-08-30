#!/usr/bin/env node

// Fix Missing WhatsApp Table Script (Simplified)
// This script recreates the missing whatsapp_messages table using direct SQL

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration. Please check your environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixMissingWhatsAppTable() {
  console.log('🔧 Fixing missing WhatsApp messages table...\n');

  try {
    // Check if table exists by trying to query it
    console.log('📋 Step 1: Checking if whatsapp_messages table exists...');
    
    const { data: existingData, error: checkError } = await supabase
      .from('whatsapp_messages')
      .select('id')
      .limit(1);

    if (checkError && (
      checkError.message?.includes('relation "whatsapp_messages" does not exist') || 
      checkError.message?.includes('table "whatsapp_messages" does not exist') ||
      checkError.code === 'PGRST116' || 
      checkError.code === '42P01'
    )) {
      console.log('📊 Table exists: NO');
      console.log('✅ Table needs to be created.');
    } else if (!checkError) {
      console.log('📊 Table exists: YES');
      console.log('✅ Table already exists, no action needed.');
      return;
    } else {
      console.warn('⚠️ Unexpected error checking table:', checkError.message);
      console.log('🔄 Proceeding with table creation anyway...');
    }

    console.log('\n🚨 IMPORTANT: The whatsapp_messages table is missing from your database.');
    console.log('This is why you\'re seeing 400 Bad Request errors in your WhatsApp chat.');
    console.log('\n💡 SOLUTION: Please apply the database migration manually:');
    console.log('\n📁 Migration file created at: supabase/migrations/20250128000000_recreate_whatsapp_messages_table.sql');
    console.log('\n🔧 To fix this issue, run one of these commands:');
    console.log('1. Using Supabase CLI: supabase db push');
    console.log('2. Or copy the SQL from the migration file and run it in your Supabase dashboard');
    console.log('\n📝 The migration will create the whatsapp_messages table with the correct schema:');
    console.log('   - id (TEXT PRIMARY KEY)');
    console.log('   - instance_id, chat_id, sender_id, sender_name');
    console.log('   - type, content, message, direction, status');
    console.log('   - metadata (JSONB)');
    console.log('   - timestamp, created_at, updated_at');
    console.log('\n✅ Once applied, your WhatsApp chat will work correctly!');

    console.log('\n🔍 Root Cause Summary:');
    console.log('- Migration 20250125000000_remove_whatsapp_features.sql dropped all WhatsApp tables');
    console.log('- The whatsapp_messages table was never recreated afterward');
    console.log('- Your app code expects this table to exist for WhatsApp functionality');

  } catch (error) {
    console.error('❌ Error during table check:', error);
    console.log('\n🚨 This confirms the table is missing!');
    console.log('✅ Please apply the migration file to fix the issue.');
  }
}

// Run the check
fixMissingWhatsAppTable();
