#!/usr/bin/env node

// Apply Missing Tables to Supabase using REST API
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔧 Setting up missing tables in Supabase...');

async function setupMissingTables() {
  const missingTables = [
    'inventory_products',
    'purchase_orders', 
    'whatsapp_messages',
    'user_goals'
  ];
  
  try {
    console.log('📋 Checking missing tables...');
    
    for (const tableName of missingTables) {
      try {
        // Try to fetch from the table to see if it exists
        const { data, error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);
        
        if (!error && data !== null) {
          console.log(`✅ ${tableName} table already exists`);
        } else {
          console.log(`❌ ${tableName} table does not exist`);
        }
      } catch (error) {
        console.log(`❌ ${tableName} table does not exist (${error.message})`);
      }
    }
    
    console.log('');
    console.log('⚠️  Manual setup required for missing tables:');
    console.log('1. Go to https://supabase.com/dashboard/project/jxhzveborezjhsmzsgbc/editor');
    console.log('2. Open the SQL editor');
    console.log('3. Copy the contents of setup_missing_tables.sql');
    console.log('4. Paste and execute the SQL');
    console.log('');
    console.log('📋 Missing tables that need to be created:');
    console.log('- inventory_products (alias for products)');
    console.log('- purchase_orders (purchase order management)');
    console.log('- whatsapp_messages (WhatsApp message storage)');
    console.log('- user_goals (user goal tracking)');
    console.log('- whatsapp_chats (WhatsApp chat management)');
    console.log('- scheduled_whatsapp_messages (scheduled messages)');
    console.log('- user_daily_goals (daily goal tracking)');
    console.log('- staff_points (staff point system)');
    console.log('- customer_checkins (customer check-in tracking)');
    console.log('- communication_templates (message templates)');
    
  } catch (error) {
    console.error('❌ Error checking tables:', error);
  }
}

// Run the setup
setupMissingTables(); 