#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// SMS Service Configuration
const SMS_CONFIG = {
  API_BASE_URL: 'https://mshastra.com/sendurl.aspx',
  USER: 'Inauzwa',
  PASSWORD: '@Masika10',
  SENDER_ID: 'INAUZWA'
};

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔧 SMS Connections Test Suite');
console.log('=============================\n');

async function testDatabaseConnection() {
  console.log('📊 Testing Database Connection...');
  try {
    const { data, error } = await supabase.from('sms_logs').select('count').limit(1);
    
    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return false;
    }
    
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.log('❌ Database connection error:', error.message);
    return false;
  }
}

async function testSMSTables() {
  console.log('\n📱 Testing SMS Tables...');
  
  const tables = ['sms_logs', 'communication_templates'];
  let allTablesExist = true;
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      
      if (error) {
        console.log(`❌ Table '${table}' not accessible:`, error.message);
        allTablesExist = false;
      } else {
        console.log(`✅ Table '${table}' is accessible`);
      }
    } catch (error) {
      console.log(`❌ Error accessing table '${table}':`, error.message);
      allTablesExist = false;
    }
  }
  
  return allTablesExist;
}

async function testSMSLogCreation() {
  console.log('\n📝 Testing SMS Log Creation...');
  try {
    const testLog = {
      phone_number: '+255700000000',
      message: 'Test SMS from connection test',
      status: 'pending'
    };
    
    const { data, error } = await supabase
      .from('sms_logs')
      .insert(testLog)
      .select()
      .single();
    
    if (error) {
      console.log('❌ SMS log creation failed:', error.message);
      return false;
    }
    
    console.log('✅ SMS log creation successful');
    
    // Clean up test entry
    await supabase.from('sms_logs').delete().eq('id', data.id);
    console.log('✅ Test log entry cleaned up');
    
    return true;
  } catch (error) {
    console.log('❌ SMS log creation error:', error.message);
    return false;
  }
}

async function testMobishastraAPI() {
  console.log('\n📡 Testing Mobishastra API...');
  try {
    const params = new URLSearchParams({
      user: SMS_CONFIG.USER,
      pwd: SMS_CONFIG.PASSWORD,
      senderid: SMS_CONFIG.SENDER_ID,
      mobileno: '255700000000',
      msgtext: 'Test SMS from connection test',
      priority: 'high',
      countrycode: '255'
    });

    const response = await fetch(`${SMS_CONFIG.API_BASE_URL}?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseText = await response.text();
    console.log('📡 API Response:', responseText);

    const responseTextLower = responseText.toLowerCase();
    if (responseTextLower.includes('success') || responseTextLower.includes('sent') || responseTextLower.includes('successful')) {
      console.log('✅ Mobishastra API connection successful');
      return true;
    } else {
      console.log('❌ Mobishastra API returned error:', responseText);
      return false;
    }
  } catch (error) {
    console.log('❌ Mobishastra API connection failed:', error.message);
    return false;
  }
}

async function testBalanceCheck() {
  console.log('\n💰 Testing Balance Check...');
  try {
    const params = new URLSearchParams({
      user: SMS_CONFIG.USER,
      pwd: SMS_CONFIG.PASSWORD,
    });
    
    const response = await fetch(`https://mshastra.com/balance.aspx?${params.toString()}`);
    const responseText = await response.text();
    
    if (response.ok && !isNaN(Number(responseText.trim()))) {
      console.log(`✅ Balance check successful. Current balance: ${responseText.trim()} credits`);
      return true;
    } else {
      console.log('❌ Balance check failed:', responseText);
      return false;
    }
  } catch (error) {
    console.log('❌ Balance check error:', error.message);
    return false;
  }
}

async function testSMSTemplates() {
  console.log('\n📋 Testing SMS Templates...');
  try {
    const { data, error } = await supabase
      .from('communication_templates')
      .select('*')
      .eq('is_active', true)
      .limit(5);
    
    if (error) {
      console.log('❌ SMS templates fetch failed:', error.message);
      return false;
    }
    
    if (data && data.length > 0) {
      console.log(`✅ Found ${data.length} active SMS templates`);
      data.forEach(template => {
        console.log(`   - ${template.title} (${template.module})`);
      });
      return true;
    } else {
      console.log('⚠️  No active SMS templates found');
      return false;
    }
  } catch (error) {
    console.log('❌ SMS templates error:', error.message);
    return false;
  }
}

async function testSMSStats() {
  console.log('\n📊 Testing SMS Statistics...');
  try {
    const { data, error } = await supabase
      .from('sms_logs')
      .select('status, cost');
    
    if (error) {
      console.log('❌ SMS stats fetch failed:', error.message);
      return false;
    }
    
    const stats = {
      total: data.length,
      sent: data.filter(log => log.status === 'sent').length,
      failed: data.filter(log => log.status === 'failed').length,
      pending: data.filter(log => log.status === 'pending').length,
      delivered: data.filter(log => log.status === 'delivered').length,
      totalCost: data.reduce((sum, log) => sum + (log.cost || 0), 0)
    };
    
    console.log('✅ SMS Statistics:');
    console.log(`   - Total SMS: ${stats.total}`);
    console.log(`   - Sent: ${stats.sent}`);
    console.log(`   - Failed: ${stats.failed}`);
    console.log(`   - Pending: ${stats.pending}`);
    console.log(`   - Delivered: ${stats.delivered}`);
    console.log(`   - Total Cost: ${stats.totalCost}`);
    
    return true;
  } catch (error) {
    console.log('❌ SMS stats error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting SMS Connections Test Suite...\n');
  
  const results = {
    database: await testDatabaseConnection(),
    tables: await testSMSTables(),
    logCreation: await testSMSLogCreation(),
    api: await testMobishastraAPI(),
    balance: await testBalanceCheck(),
    templates: await testSMSTemplates(),
    stats: await testSMSStats()
  };
  
  console.log('\n📋 Test Summary');
  console.log('===============');
  
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${test}`);
  });
  
  console.log(`\n📈 Results: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All SMS connections are working properly!');
  } else {
    console.log('⚠️  Some SMS connections need attention.');
  }
  
  return results;
}

// Run the tests
runAllTests().catch(console.error); 