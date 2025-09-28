#!/usr/bin/env node

/**
 * Create customer_communications table using browser fetch
 * This script creates the table using direct HTTP requests
 */

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

async function createTable() {
  try {
    console.log('🔄 Creating customer_communications table...');
    
    // First, let's try to create the table using a simple SQL execution
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS customer_communications (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
        device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
        type VARCHAR(20) NOT NULL CHECK (type IN ('sms', 'whatsapp', 'email', 'phone_call')),
        message TEXT,
        status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'pending')),
        phone_number VARCHAR(20),
        email VARCHAR(255),
        sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        delivered_at TIMESTAMP WITH TIME ZONE,
        read_at TIMESTAMP WITH TIME ZONE,
        error_message TEXT,
        retry_count INTEGER DEFAULT 0,
        sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    // Try to execute the SQL using the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({ 
        sql_query: createTableSQL 
      })
    });
    
    if (response.ok) {
      console.log('✅ Table creation request sent successfully');
    } else {
      const errorText = await response.text();
      console.log('⚠️  Table creation response:', response.status, errorText);
    }
    
    // Test if the table exists by trying to query it
    console.log('🔄 Testing table access...');
    const testResponse = await fetch(`${supabaseUrl}/rest/v1/customer_communications?select=id&limit=1`, {
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    });
    
    if (testResponse.ok) {
      console.log('✅ customer_communications table is now accessible!');
      console.log('🎉 The 404 error should be resolved.');
    } else if (testResponse.status === 404) {
      console.log('❌ Table still not found. The anon key may not have table creation permissions.');
      console.log('💡 You may need to create the table manually in the Supabase dashboard.');
    } else {
      const errorText = await testResponse.text();
      console.log('⚠️  Table test response:', testResponse.status, errorText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createTable();
