#!/usr/bin/env node

/**
 * Create customer_communications table
 * This script creates the missing customer_communications table
 */

const fs = require('fs');

async function createCustomerCommunicationsTable() {
  try {
    console.log('🔄 Creating customer_communications table...');
    
    // Read the SQL file
    const sql = fs.readFileSync('create-customer-communications-table.sql', 'utf8');
    
    // Execute the SQL using browser fetch (since we're in a browser-like environment)
    const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({ sql_query: sql })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    console.log('✅ customer_communications table created successfully!');
    
    // Test the table by trying to query it
    console.log('🔄 Testing table access...');
    const testResponse = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/customer_communications?select=id&limit=1`, {
      headers: {
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    });
    
    if (testResponse.ok) {
      console.log('✅ Table is accessible and working correctly!');
    } else {
      console.log('⚠️  Table created but may have access issues:', await testResponse.text());
    }
    
  } catch (error) {
    console.error('❌ Error creating table:', error.message);
    
    // Try alternative approach - direct SQL execution
    console.log('🔄 Trying alternative approach...');
    try {
      const response = await fetch(`${process.env.VITE_SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
        },
        body: JSON.stringify({
          query: `
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
          `
        })
      });
      
      if (response.ok) {
        console.log('✅ Table created using alternative method!');
      } else {
        console.error('❌ Alternative method also failed:', await response.text());
      }
    } catch (altError) {
      console.error('❌ Alternative method error:', altError.message);
    }
  }
}

// Check if we have the required environment variables
if (!process.env.VITE_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅' : '❌');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
  console.error('\n💡 Please set these environment variables and try again.');
  process.exit(1);
}

createCustomerCommunicationsTable().catch(console.error);
