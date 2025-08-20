import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  try {
    console.log('🚀 Creating Chrome extension tables...');
    
    // Test connection first
    console.log('🔍 Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('devices')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection test failed:', testError);
      return;
    }
    
    console.log('✅ Connection test successful');
    
    // Create tables by attempting to insert test data
    console.log('📊 Creating whatsapp_messages table...');
    try {
      const { error: msgError } = await supabase
        .from('whatsapp_messages')
        .insert({
          message_id: 'test-message-001',
          chat_id: 'test-chat-001',
          content: 'Test message content',
          message_type: 'text',
          message_timestamp: new Date().toISOString(),
          is_from_me: false,
          customer_phone: '+1234567890',
          customer_name: 'Test Customer'
        });
      
      if (msgError && msgError.message.includes('does not exist')) {
        console.log('⚠️ whatsapp_messages table does not exist, creating...');
        // The table doesn't exist, we need to create it manually
        console.log('📝 Please create the whatsapp_messages table manually in your Supabase dashboard');
      } else if (msgError) {
        console.log('⚠️ whatsapp_messages table error:', msgError.message);
      } else {
        console.log('✅ whatsapp_messages table exists and is working');
      }
    } catch (err) {
      console.log('⚠️ whatsapp_messages table test:', err.message);
    }
    
    // Test support_tickets table
    console.log('📊 Testing support_tickets table...');
    try {
      const { error: ticketError } = await supabase
        .from('support_tickets')
        .insert({
          customer_phone: '+1234567890',
          customer_name: 'Test Customer',
          issue_type: 'test',
          description: 'Test support ticket',
          source: 'whatsapp',
          status: 'new'
        });
      
      if (ticketError && ticketError.message.includes('does not exist')) {
        console.log('⚠️ support_tickets table does not exist');
      } else if (ticketError) {
        console.log('⚠️ support_tickets table error:', ticketError.message);
      } else {
        console.log('✅ support_tickets table exists and is working');
      }
    } catch (err) {
      console.log('⚠️ support_tickets table test:', err.message);
    }
    
    // Test appointments table
    console.log('📊 Testing appointments table...');
    try {
      const { error: apptError } = await supabase
        .from('appointments')
        .insert({
          customer_phone: '+1234567890',
          customer_name: 'Test Customer',
          description: 'Test appointment',
          source: 'whatsapp',
          status: 'pending'
        });
      
      if (apptError && apptError.message.includes('does not exist')) {
        console.log('⚠️ appointments table does not exist');
      } else if (apptError) {
        console.log('⚠️ appointments table error:', apptError.message);
      } else {
        console.log('✅ appointments table exists and is working');
      }
    } catch (err) {
      console.log('⚠️ appointments table test:', err.message);
    }
    
    // Test chrome_extension_settings table
    console.log('📊 Testing chrome_extension_settings table...');
    try {
      const { error: settingsError } = await supabase
        .from('chrome_extension_settings')
        .select('*')
        .limit(1);
      
      if (settingsError && settingsError.message.includes('does not exist')) {
        console.log('⚠️ chrome_extension_settings table does not exist');
      } else if (settingsError) {
        console.log('⚠️ chrome_extension_settings table error:', settingsError.message);
      } else {
        console.log('✅ chrome_extension_settings table exists and is working');
      }
    } catch (err) {
      console.log('⚠️ chrome_extension_settings table test:', err.message);
    }
    
    // Test auto_reply_templates table
    console.log('📊 Testing auto_reply_templates table...');
    try {
      const { error: templatesError } = await supabase
        .from('auto_reply_templates')
        .select('*')
        .limit(1);
      
      if (templatesError && templatesError.message.includes('does not exist')) {
        console.log('⚠️ auto_reply_templates table does not exist');
      } else if (templatesError) {
        console.log('⚠️ auto_reply_templates table error:', templatesError.message);
      } else {
        console.log('✅ auto_reply_templates table exists and is working');
      }
    } catch (err) {
      console.log('⚠️ auto_reply_templates table test:', err.message);
    }
    
    console.log('\n📋 SUMMARY:');
    console.log('If tables do not exist, you need to create them manually in your Supabase dashboard.');
    console.log('Here are the SQL commands to run:');
    console.log('\n1. whatsapp_messages table:');
    console.log(`
CREATE TABLE whatsapp_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message_id VARCHAR(255) NOT NULL UNIQUE,
    chat_id VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    message_type VARCHAR(20) NOT NULL DEFAULT 'text',
    message_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    is_from_me BOOLEAN NOT NULL DEFAULT false,
    customer_phone VARCHAR(20),
    customer_name VARCHAR(255),
    processed BOOLEAN NOT NULL DEFAULT false,
    auto_replied BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
    
    console.log('\n2. support_tickets table:');
    console.log(`
CREATE TABLE support_tickets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_phone VARCHAR(20),
    customer_name VARCHAR(255),
    issue_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    source VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
    status VARCHAR(20) NOT NULL DEFAULT 'new',
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    assigned_to UUID,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
    
    console.log('\n3. appointments table:');
    console.log(`
CREATE TABLE appointments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    customer_phone VARCHAR(20),
    customer_name VARCHAR(255),
    description TEXT,
    appointment_date TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    source VARCHAR(20) NOT NULL DEFAULT 'whatsapp',
    confirmed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
    
    console.log('\n4. chrome_extension_settings table:');
    console.log(`
CREATE TABLE chrome_extension_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    api_key VARCHAR(255) NOT NULL,
    webhook_url TEXT,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    auto_reply_enabled BOOLEAN NOT NULL DEFAULT true,
    auto_ticket_creation BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
    
    console.log('\n5. auto_reply_templates table:');
    console.log(`
CREATE TABLE auto_reply_templates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    trigger_keywords TEXT[] NOT NULL,
    message TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
    
    console.log('\n🎉 Table creation check completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run the table creation
createTables();
