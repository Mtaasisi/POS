#!/usr/bin/env node

/**
 * WhatsApp Debug Script
 * 
 * This script helps monitor WhatsApp API usage and identify rate limiting issues.
 * Run with: node scripts/whatsapp-debug.js
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials. Please check your .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkWhatsAppTables() {
  console.log('🔍 Checking WhatsApp database tables...');
  
  try {
    // Check if WhatsApp tables exist
    const tables = ['whatsapp_chats', 'whatsapp_messages', 'whatsapp_campaigns', 'scheduled_whatsapp_messages'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
        } else {
          console.log(`✅ Table ${table}: OK`);
        }
      } catch (err) {
        console.log(`❌ Table ${table}: ${err.message}`);
      }
    }
  } catch (error) {
    console.error('Error checking tables:', error);
  }
}

async function checkWhatsAppSettings() {
  console.log('\n🔧 Checking WhatsApp settings...');
  
  try {
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .like('key', 'whatsapp_%');
    
    if (error) {
      console.error('Error fetching settings:', error);
      return;
    }
    
    const settings = {};
    data.forEach(row => {
      settings[row.key] = row.value;
    });
    
    console.log('Current WhatsApp settings:');
    console.log('- Green API Key:', settings.whatsapp_green_api_key ? '✅ Set' : '❌ Not set');
    console.log('- Instance ID:', settings.whatsapp_instance_id ? '✅ Set' : '❌ Not set');
    console.log('- Enable Realtime:', settings.whatsapp_enable_realtime ? '✅ Enabled' : '❌ Disabled');
    console.log('- Enable Bulk:', settings.whatsapp_enable_bulk ? '✅ Enabled' : '❌ Disabled');
    console.log('- Enable Auto:', settings.whatsapp_enable_auto ? '✅ Enabled' : '❌ Disabled');
  } catch (error) {
    console.error('Error checking settings:', error);
  }
}

async function checkWhatsAppData() {
  console.log('\n📊 Checking WhatsApp data...');
  
  try {
    // Check chats
    const { data: chats, error: chatsError } = await supabase
      .from('whatsapp_chats')
      .select('count');
    
    if (chatsError) {
      console.log('❌ Error fetching chats:', chatsError.message);
    } else {
      console.log(`✅ WhatsApp chats: ${chats?.length || 0}`);
    }
    
    // Check messages
    const { data: messages, error: messagesError } = await supabase
      .from('whatsapp_messages')
      .select('count');
    
    if (messagesError) {
      console.log('❌ Error fetching messages:', messagesError.message);
    } else {
      console.log(`✅ WhatsApp messages: ${messages?.length || 0}`);
    }
    
    // Check customers with WhatsApp numbers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id')
      .not('whatsapp', 'is', null)
      .not('whatsapp', 'eq', '');
    
    if (customersError) {
      console.log('❌ Error fetching customers:', customersError.message);
    } else {
      console.log(`✅ Customers with WhatsApp: ${customers?.length || 0}`);
    }
  } catch (error) {
    console.error('Error checking data:', error);
  }
}

async function checkRateLimiting() {
  console.log('\n🚫 Checking rate limiting status...');
  
  try {
    // Check localStorage-like data in database
    const { data, error } = await supabase
      .from('settings')
      .select('key, value')
      .in('key', ['whatsapp_rate_limit_backoff', 'whatsapp_last_error', 'whatsapp_error_count', 'whatsapp_last_check']);
    
    if (error) {
      console.log('No rate limiting data found');
      return;
    }
    
    const rateLimitData = {};
    data.forEach(row => {
      rateLimitData[row.key] = row.value;
    });
    
    if (rateLimitData.whatsapp_last_error) {
      console.log('❌ Last error:', rateLimitData.whatsapp_last_error);
    }
    
    if (rateLimitData.whatsapp_error_count) {
      console.log('⚠️ Error count:', rateLimitData.whatsapp_error_count);
    }
    
    if (rateLimitData.whatsapp_last_check) {
      const lastCheck = new Date(parseInt(rateLimitData.whatsapp_last_check));
      const now = new Date();
      const diffMinutes = Math.round((now - lastCheck) / (1000 * 60));
      console.log(`📅 Last check: ${diffMinutes} minutes ago`);
    }
    
    if (rateLimitData.whatsapp_rate_limit_backoff) {
      const backoffUntil = new Date(parseInt(rateLimitData.whatsapp_rate_limit_backoff));
      const now = new Date();
      if (backoffUntil > now) {
        const remainingMinutes = Math.round((backoffUntil - now) / (1000 * 60));
        console.log(`⏰ Rate limit backoff active: ${remainingMinutes} minutes remaining`);
      } else {
        console.log('✅ Rate limit backoff expired');
      }
    }
  } catch (error) {
    console.error('Error checking rate limiting:', error);
  }
}

async function main() {
  console.log('🔍 WhatsApp Debug Script\n');
  
  await checkWhatsAppTables();
  await checkWhatsAppSettings();
  await checkWhatsAppData();
  await checkRateLimiting();
  
  console.log('\n✅ Debug check complete!');
  console.log('\n💡 Recommendations:');
  console.log('1. If you see rate limiting errors, wait before making more API calls');
  console.log('2. Check your Green API credentials in the settings');
  console.log('3. Ensure WhatsApp tables are properly created');
  console.log('4. Monitor the browser console for detailed error messages');
}

main().catch(console.error);
