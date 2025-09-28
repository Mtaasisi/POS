#!/usr/bin/env node

/**
 * Apply customer_communications table fix
 * This script creates the missing customer_communications table
 */

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

async function createCustomerCommunicationsTable() {
  try {
    console.log('🔄 Creating customer_communications table...');
    
    const createTableSQL = `
      -- Create customer_communications table for tracking customer communications
      CREATE TABLE IF NOT EXISTS customer_communications (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
          device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
          
          -- Communication details
          type VARCHAR(20) NOT NULL CHECK (type IN ('sms', 'whatsapp', 'email', 'phone_call')),
          message TEXT,
          status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'read', 'failed', 'pending')),
          
          -- Contact information
          phone_number VARCHAR(20),
          email VARCHAR(255),
          
          -- Metadata
          sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          delivered_at TIMESTAMP WITH TIME ZONE,
          read_at TIMESTAMP WITH TIME ZONE,
          
          -- Error tracking
          error_message TEXT,
          retry_count INTEGER DEFAULT 0,
          
          -- User tracking
          sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
          
          -- Timestamps
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Create indexes for better performance
      CREATE INDEX IF NOT EXISTS idx_customer_communications_customer_id ON customer_communications(customer_id);
      CREATE INDEX IF NOT EXISTS idx_customer_communications_device_id ON customer_communications(device_id);
      CREATE INDEX IF NOT EXISTS idx_customer_communications_type ON customer_communications(type);
      CREATE INDEX IF NOT EXISTS idx_customer_communications_status ON customer_communications(status);
      CREATE INDEX IF NOT EXISTS idx_customer_communications_sent_at ON customer_communications(sent_at DESC);
      CREATE INDEX IF NOT EXISTS idx_customer_communications_phone_number ON customer_communications(phone_number);

      -- Enable Row Level Security
      ALTER TABLE customer_communications ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies
      CREATE POLICY "Users can view their own communications" ON customer_communications
          FOR SELECT USING (
              auth.uid() IN (
                  SELECT user_id FROM customers WHERE id = customer_id
              ) OR
              auth.uid() = sent_by
          );

      CREATE POLICY "Users can insert communications" ON customer_communications
          FOR INSERT WITH CHECK (
              auth.uid() = sent_by OR
              auth.uid() IN (
                  SELECT user_id FROM customers WHERE id = customer_id
              )
          );

      CREATE POLICY "Users can update their own communications" ON customer_communications
          FOR UPDATE USING (
              auth.uid() = sent_by OR
              auth.uid() IN (
                  SELECT user_id FROM customers WHERE id = customer_id
              )
          );
    `;
    
    // Execute the SQL using the REST API
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
      console.log('✅ customer_communications table created successfully!');
      
      // Test the table by trying to query it
      console.log('🔄 Testing table access...');
      const testResponse = await fetch(`${supabaseUrl}/rest/v1/customer_communications?select=id&limit=1`, {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        }
      });
      
      if (testResponse.ok) {
        console.log('✅ Table is accessible and working correctly!');
        console.log('🎉 SMS functionality should now work properly!');
      } else {
        const errorText = await testResponse.text();
        console.log('⚠️ Table created but test query failed:', errorText);
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Error creating table:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the script
createCustomerCommunicationsTable();
