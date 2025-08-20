#!/usr/bin/env node

/**
 * WhatsApp Diagnostics Script
 * 
 * This script helps diagnose WhatsApp sending issues by checking:
 * - Database settings
 * - Connection status
 * - Rate limiting
 * - Recent errors
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.log('Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWhatsAppSettings() {
  console.log('\n🔍 Checking WhatsApp Settings...');
  
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['whatsapp_instance_id', 'whatsapp_green_api_key', 'whatsapp_api_url', 'whatsapp_media_url']);
    
    if (error) {
      console.error('❌ Error fetching settings:', error.message);
      return false;
    }
    
    const settings = {};
    data?.forEach(row => {
      settings[row.key] = row.value;
    });
    
    console.log('📋 Settings Status:');
    console.log(`   Instance ID: ${settings.whatsapp_instance_id ? '✓ Set' : '✗ Not set'}`);
    console.log(`   API Key: ${settings.whatsapp_green_api_key ? '✓ Set' : '✗ Not set'}`);
    console.log(`   API URL: ${settings.whatsapp_api_url || 'Using default'}`);
    console.log(`   Media URL: ${settings.whatsapp_media_url || 'Using default'}`);
    
    return settings.whatsapp_instance_id && settings.whatsapp_green_api_key;
  } catch (error) {
    console.error('❌ Error checking settings:', error.message);
    return false;
  }
}

async function checkRecentErrors() {
  console.log('\n🔍 Checking Recent Errors...');
  
  try {
    // Check for recent failed messages
    const { data: failedMessages, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('status', 'failed')
      .gte('sent_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('sent_at', { ascending: false })
      .limit(5);
    
    if (error) {
      console.error('❌ Error fetching failed messages:', error.message);
      return;
    }
    
    if (failedMessages && failedMessages.length > 0) {
      console.log('⚠️  Recent Failed Messages:');
      failedMessages.forEach(msg => {
        console.log(`   ${msg.sent_at}: ${msg.error_message || 'Unknown error'}`);
      });
    } else {
      console.log('✅ No recent failed messages found');
    }
  } catch (error) {
    console.error('❌ Error checking recent errors:', error.message);
  }
}

async function checkConnectionStatus() {
  console.log('\n🔍 Checking Connection Status...');
  
  try {
    const { data: settings } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'whatsapp_instance_id')
      .single();
    
    if (!settings?.value) {
      console.log('❌ No Instance ID configured');
      return;
    }
    
    const instanceId = settings.value;
    
    // Try to check connection status via Green API
    const { data: apiKey } = await supabase
      .from('settings')
      .select('value')
      .eq('key', 'whatsapp_green_api_key')
      .single();
    
    if (!apiKey?.value) {
      console.log('❌ No API Key configured');
      return;
    }
    
    const url = `https://api.green-api.com/waInstance${instanceId}/getStateInstance/${apiKey.value}`;
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('📡 Connection Status:', data.stateInstance);
      
      switch (data.stateInstance) {
        case 'authorized':
          console.log('✅ WhatsApp is authorized and ready');
          break;
        case 'notAuthorized':
          console.log('❌ WhatsApp not authorized - scan QR code');
          break;
        case 'blocked':
          console.log('❌ WhatsApp account is blocked');
          break;
        default:
          console.log('❓ Unknown state:', data.stateInstance);
      }
    } catch (error) {
      console.log('❌ Could not check connection status:', error.message);
    }
  } catch (error) {
    console.error('❌ Error checking connection:', error.message);
  }
}

async function checkRateLimiting() {
  console.log('\n🔍 Checking Rate Limiting...');
  
  try {
    // Check for recent API calls
    const { data: recentMessages, error } = await supabase
      .from('whatsapp_messages')
      .select('sent_at, status')
      .gte('sent_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order('sent_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error checking recent messages:', error.message);
      return;
    }
    
    if (recentMessages && recentMessages.length > 0) {
      console.log(`📊 Messages in last hour: ${recentMessages.length}`);
      
      const failedCount = recentMessages.filter(msg => msg.status === 'failed').length;
      if (failedCount > 0) {
        console.log(`⚠️  Failed messages: ${failedCount}`);
      }
      
      // Check for rapid sending
      const rapidSending = recentMessages.some((msg, index) => {
        if (index === 0) return false;
        const timeDiff = new Date(msg.sent_at) - new Date(recentMessages[index - 1].sent_at);
        return timeDiff < 30000; // Less than 30 seconds
      });
      
      if (rapidSending) {
        console.log('⚠️  Rapid message sending detected - may cause rate limiting');
      }
    } else {
      console.log('✅ No recent message activity');
    }
  } catch (error) {
    console.error('❌ Error checking rate limiting:', error.message);
  }
}

async function checkDatabaseTables() {
  console.log('\n🔍 Checking Database Tables...');
  
  const tables = ['whatsapp_messages', 'whatsapp_chats', 'settings'];
  
  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table}: Accessible`);
      }
    } catch (error) {
      console.log(`❌ Table ${table}: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 WhatsApp Diagnostics Tool');
  console.log('============================');
  
  // Check database connection
  console.log('\n🔍 Checking Database Connection...');
  try {
    const { error } = await supabase.from('settings').select('key').limit(1);
    if (error) {
      console.error('❌ Database connection failed:', error.message);
      process.exit(1);
    }
    console.log('✅ Database connection successful');
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
  
  // Run all checks
  await checkDatabaseTables();
  const settingsOk = await checkWhatsAppSettings();
  await checkConnectionStatus();
  await checkRecentErrors();
  await checkRateLimiting();
  
  // Summary
  console.log('\n📋 Summary:');
  console.log('==========');
  
  if (!settingsOk) {
    console.log('❌ WhatsApp credentials not configured');
    console.log('   → Configure Instance ID and API Key in settings');
  } else {
    console.log('✅ WhatsApp credentials configured');
  }
  
  console.log('\n💡 Next Steps:');
  console.log('   1. Check the troubleshooting guide: docs/WHATSAPP_TROUBLESHOOTING.md');
  console.log('   2. Verify Green API credentials at green-api.com');
  console.log('   3. Test connection in the WhatsApp interface');
  console.log('   4. Check for rate limiting if sending multiple messages');
}

// Run diagnostics
main().catch(console.error);
