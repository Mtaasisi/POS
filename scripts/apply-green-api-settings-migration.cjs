#!/usr/bin/env node

/**
 * Apply Green API Settings Migration
 * This script applies the database migration for Green API settings
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   - VITE_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  console.log('🔧 Applying Green API Settings Migration');
  console.log('========================================\n');

  try {
    console.log('📝 Adding Green API configuration columns...');

    // Add columns one by one
    const { error: addInstanceIdError } = await supabase
      .rpc('sql', { query: 'ALTER TABLE whatsapp_hub_settings ADD COLUMN IF NOT EXISTS green_api_instance_id VARCHAR(50)' });

    if (addInstanceIdError) {
      console.log('⚠️  Instance ID column might already exist:', addInstanceIdError.message);
    } else {
      console.log('✅ Added green_api_instance_id column');
    }

    const { error: addTokenError } = await supabase
      .rpc('sql', { query: 'ALTER TABLE whatsapp_hub_settings ADD COLUMN IF NOT EXISTS green_api_token VARCHAR(255)' });

    if (addTokenError) {
      console.log('⚠️  Token column might already exist:', addTokenError.message);
    } else {
      console.log('✅ Added green_api_token column');
    }

    const { error: addUrlError } = await supabase
      .rpc('sql', { query: 'ALTER TABLE whatsapp_hub_settings ADD COLUMN IF NOT EXISTS green_api_url VARCHAR(255) DEFAULT \'https://api.green-api.com\'' });

    if (addUrlError) {
      console.log('⚠️  URL column might already exist:', addUrlError.message);
    } else {
      console.log('✅ Added green_api_url column');
    }

    // Test the new columns
    console.log('\n🧪 Testing new columns...');
    
    const { data: testData, error: testError } = await supabase
      .from('whatsapp_hub_settings')
      .select('green_api_instance_id, green_api_token, green_api_url')
      .limit(1);

    if (testError) {
      console.error('❌ Test query failed:', testError.message);
      process.exit(1);
    }

    console.log('✅ New columns are accessible');
    console.log('📊 Sample data structure:', testData);

    // Update existing settings with default Green API URL
    console.log('\n🔄 Updating existing settings...');
    
    const { error: updateError } = await supabase
      .from('whatsapp_hub_settings')
      .update({ green_api_url: 'https://api.green-api.com' })
      .is('green_api_url', null);

    if (updateError) {
      console.error('❌ Update failed:', updateError.message);
    } else {
      console.log('✅ Existing settings updated with default Green API URL');
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Restart your development server');
    console.log('   2. Open WhatsApp Hub settings');
    console.log('   3. Configure your Green API credentials:');
    console.log('      - Instance ID: 7105306911');
    console.log('      - API Token: your_api_token_here');
    console.log('      - API URL: https://api.green-api.com');
    console.log('   4. Save the settings');
    console.log('   5. Test sending a WhatsApp message');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    process.exit(1);
  }
}

// Run the migration
applyMigration();
