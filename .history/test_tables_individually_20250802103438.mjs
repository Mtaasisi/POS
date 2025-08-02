#!/usr/bin/env node

// Test Tables Individually to Identify Column Issues
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

console.log('🔧 Testing tables individually to identify column issues...');

const tablesToTest = [
    'inventory_products',
    'purchase_orders', 
    'purchase_order_items',
    'whatsapp_chats',
    'whatsapp_messages',
    'scheduled_whatsapp_messages',
    'user_goals',
    'user_daily_goals',
    'staff_points',
    'customer_checkins',
    'communication_templates'
];

async function testTable(tableName) {
    try {
        console.log(`\n📋 Testing ${tableName}...`);
        
        // Try to fetch from the table
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
        
        if (error) {
            console.log(`❌ ${tableName}: ${error.message}`);
            return { name: tableName, exists: false, error: error.message };
        } else {
            console.log(`✅ ${tableName}: Table exists and accessible`);
            return { name: tableName, exists: true, error: null };
        }
    } catch (error) {
        console.log(`❌ ${tableName}: Exception - ${error.message}`);
        return { name: tableName, exists: false, error: error.message };
    }
}

async function testAllTables() {
    const results = [];
    
    for (const tableName of tablesToTest) {
        const result = await testTable(tableName);
        results.push(result);
    }
    
    console.log('\n📊 Summary:');
    const existing = results.filter(r => r.exists);
    const missing = results.filter(r => !r.exists);
    
    console.log(`✅ Existing tables: ${existing.length}`);
    console.log(`❌ Missing tables: ${missing.length}`);
    
    if (missing.length > 0) {
        console.log('\n❌ Missing tables:');
        missing.forEach(table => {
            console.log(`  - ${table.name}: ${table.error}`);
        });
    }
    
    return results;
}

// Run the tests
testAllTables().then(results => {
    console.log('\n🎯 Next steps:');
    console.log('1. Use setup_missing_tables_simple.sql to create missing tables');
    console.log('2. Run this test again to verify all tables exist');
    console.log('3. Check your app - 404 errors should be resolved');
}); 