#!/usr/bin/env node

// Check WhatsApp Table Schema
// This script checks the actual schema of the whatsapp_messages table

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

async function checkWhatsAppSchema() {
  console.log('🔍 Checking WhatsApp messages table schema...\n');

  try {
    // Try to get a sample record to see available columns
    console.log('📋 Step 1: Checking available columns...');
    
    const { data, error } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error querying table:', error);
      return;
    }

    console.log('✅ Table query successful!');
    console.log('📊 Number of records in table:', data?.length || 0);

    if (data && data.length > 0) {
      console.log('\n🔍 Available columns in the table:');
      const columns = Object.keys(data[0]);
      columns.forEach((col, index) => {
        console.log(`   ${index + 1}. ${col} (${typeof data[0][col]})`);
      });
      
      console.log('\n📋 Sample record:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('\n📋 Table is empty, trying to determine schema from structure...');
      
      // Try each problematic column individually
      const problematicColumns = ['chat_id', 'content', 'message', 'timestamp', 'direction', 'sender_name'];
      const workingColumns = [];
      const failingColumns = [];
      
      for (const column of problematicColumns) {
        try {
          const { error: colError } = await supabase
            .from('whatsapp_messages')
            .select(column)
            .limit(1);
          
          if (colError) {
            failingColumns.push(column);
            console.log(`❌ Column '${column}': ${colError.message}`);
          } else {
            workingColumns.push(column);
            console.log(`✅ Column '${column}': EXISTS`);
          }
        } catch (e) {
          failingColumns.push(column);
          console.log(`❌ Column '${column}': ${e.message}`);
        }
      }
      
      console.log(`\n📊 Working columns: ${workingColumns.join(', ')}`);
      console.log(`📊 Failing columns: ${failingColumns.join(', ')}`);
    }

    // Now let's try the exact query that's failing
    console.log('\n🔍 Testing the exact failing query...');
    const { data: testData, error: testError } = await supabase
      .from('whatsapp_messages')
      .select('chat_id,content,message,timestamp,direction,sender_name')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (testError) {
      console.log('❌ EXACT FAILING QUERY ERROR:');
      console.log(`   Code: ${testError.code}`);
      console.log(`   Message: ${testError.message}`);
      console.log(`   Details: ${JSON.stringify(testError.details, null, 2)}`);
    } else {
      console.log('✅ The exact query works! This might be a different issue.');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkWhatsAppSchema();
