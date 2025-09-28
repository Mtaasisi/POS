#!/usr/bin/env node

/**
 * Simple SMS System Test Script
 * This script tests the SMS system functionality using built-in Node.js modules
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSMSSystem() {
  console.log('🔍 Testing SMS System...\n');

  // Test 1: Check database connection
  console.log('1. Testing database connection...');
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .limit(1);
    
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      return false;
    }
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }

  // Test 2: Check SMS configuration
  console.log('\n2. Checking SMS configuration...');
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .or('key.eq.sms_provider_api_key,key.eq.sms_api_url');

    if (error) {
      console.error('❌ Failed to fetch SMS settings:', error.message);
      return false;
    }

    const smsConfig = {};
    data?.forEach(setting => {
      smsConfig[setting.key] = setting.value;
    });

    console.log('📋 SMS Configuration:');
    console.log('  - API Key:', smsConfig.sms_provider_api_key ? '✅ Set' : '❌ Missing');
    console.log('  - API URL:', smsConfig.sms_api_url ? '✅ Set' : '❌ Missing');

    if (!smsConfig.sms_provider_api_key || !smsConfig.sms_api_url) {
      console.log('⚠️  SMS configuration is incomplete');
      console.log('   Please configure SMS settings in the admin panel');
      return false;
    }

    console.log('✅ SMS configuration found');
  } catch (error) {
    console.error('❌ SMS configuration check failed:', error.message);
    return false;
  }

  // Test 3: Check SMS tables
  console.log('\n3. Checking SMS database tables...');
  try {
    // Check sms_logs table
    const { data: logsData, error: logsError } = await supabase
      .from('sms_logs')
      .select('id')
      .limit(1);

    if (logsError) {
      console.error('❌ sms_logs table error:', logsError.message);
      return false;
    }
    console.log('✅ sms_logs table accessible');

    // Check sms_templates table
    const { data: templatesData, error: templatesError } = await supabase
      .from('sms_templates')
      .select('id')
      .limit(1);

    if (templatesError) {
      console.error('❌ sms_templates table error:', templatesError.message);
      return false;
    }
    console.log('✅ sms_templates table accessible');

    // Check sms_triggers table
    const { data: triggersData, error: triggersError } = await supabase
      .from('sms_triggers')
      .select('id')
      .limit(1);

    if (triggersError) {
      console.error('❌ sms_triggers table error:', triggersError.message);
      return false;
    }
    console.log('✅ sms_triggers table accessible');

  } catch (error) {
    console.error('❌ SMS tables check failed:', error.message);
    return false;
  }

  // Test 4: Check recent SMS logs
  console.log('\n4. Checking recent SMS activity...');
  try {
    const { data: recentLogs, error } = await supabase
      .from('sms_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('❌ Failed to fetch SMS logs:', error.message);
      return false;
    }

    if (recentLogs && recentLogs.length > 0) {
      console.log(`📊 Found ${recentLogs.length} recent SMS logs:`);
      recentLogs.forEach((log, index) => {
        console.log(`   ${index + 1}. ${log.phone_number} - ${log.status} (${log.created_at})`);
      });
    } else {
      console.log('📊 No recent SMS logs found');
    }

  } catch (error) {
    console.error('❌ SMS logs check failed:', error.message);
    return false;
  }

  // Test 5: Check SMS templates
  console.log('\n5. Checking SMS templates...');
  try {
    const { data: templates, error } = await supabase
      .from('sms_templates')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Failed to fetch SMS templates:', error.message);
      return false;
    }

    if (templates && templates.length > 0) {
      console.log(`📝 Found ${templates.length} SMS templates:`);
      templates.forEach((template, index) => {
        console.log(`   ${index + 1}. ${template.name} - ${template.is_active ? 'Active' : 'Inactive'}`);
      });
    } else {
      console.log('📝 No SMS templates found');
    }

  } catch (error) {
    console.error('❌ SMS templates check failed:', error.message);
    return false;
  }

  console.log('\n🎉 SMS System Test Complete!');
  return true;
}

// Run the test
testSMSSystem()
  .then(success => {
    if (success) {
      console.log('\n✅ SMS system appears to be working correctly');
      console.log('💡 You can now test SMS functionality through the web interface');
    } else {
      console.log('\n❌ SMS system has issues that need to be addressed');
      console.log('💡 Check the errors above and configure missing settings');
    }
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('\n💥 Test script failed:', error);
    process.exit(1);
  });
