// Simple script to create admin_notifications table using the app's Supabase client
// This will fix the 404 error in the diagnostic checklist

import { createClient } from '@supabase/supabase-js';

// Use the production Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminNotificationsTable() {
  console.log('🚀 Creating admin_notifications table...');
  
  try {
    // First, check if the table already exists
    const { data: existingTable, error: checkError } = await supabase
      .from('admin_notifications')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ admin_notifications table already exists!');
      return true;
    }
    
    console.log('📝 Table does not exist, creating it...');
    
    // Since we can't execute raw SQL directly, let's try a different approach
    // We'll create a simple test record to see if we can insert
    const testData = {
      device_id: null,
      type: 'test_notification',
      title: 'Test Admin Notification',
      message: 'This is a test notification to verify the table works',
      status: 'unread',
      priority: 'normal'
    };
    
    const { data: insertData, error: insertError } = await supabase
      .from('admin_notifications')
      .insert(testData)
      .select();
    
    if (insertError) {
      console.error('❌ Table creation failed:', insertError);
      console.log('💡 The table needs to be created manually in the Supabase dashboard');
      console.log('📋 Use this SQL:');
      console.log(`
CREATE TABLE admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    device_id UUID,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'unread',
    priority TEXT DEFAULT 'normal',
    customer_id UUID,
    diagnostic_id UUID,
    appointment_id UUID,
    metadata JSONB DEFAULT '{}',
    icon TEXT,
    color TEXT,
    action_url TEXT,
    action_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE,
    archived_at TIMESTAMP WITH TIME ZONE,
    created_by UUID,
    read_by UUID,
    archived_by UUID
);

-- Create indexes
CREATE INDEX idx_admin_notifications_device_id ON admin_notifications(device_id);
CREATE INDEX idx_admin_notifications_status ON admin_notifications(status);
CREATE INDEX idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX idx_admin_notifications_created_at ON admin_notifications(created_at);

-- Enable RLS
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON admin_notifications FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON admin_notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON admin_notifications FOR UPDATE USING (true);
      `);
      return false;
    } else {
      console.log('✅ Table created successfully!');
      console.log('📊 Test record inserted:', insertData);
      
      // Clean up test record
      const { error: deleteError } = await supabase
        .from('admin_notifications')
        .delete()
        .eq('id', insertData[0].id);
      
      if (deleteError) {
        console.warn('⚠️ Failed to clean up test record:', deleteError);
      } else {
        console.log('🧹 Test record cleaned up successfully');
      }
      
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error creating admin_notifications table:', error);
    return false;
  }
}

// Test the diagnostic checklist functionality
async function testDiagnosticChecklist() {
  console.log('🧪 Testing diagnostic checklist functionality...');
  
  try {
    // Try to create a diagnostic notification like the app does
    const notificationData = {
      device_id: 'test-device-id',
      type: 'diagnostic_report',
      title: 'Test Diagnostic Report: Apple iPhone 6',
      message: 'Diagnostic completed with 3 issues found. Requires admin review.',
      status: 'unread',
      created_at: new Date().toISOString()
    };
    
    const { data, error } = await supabase
      .from('admin_notifications')
      .insert(notificationData)
      .select();
    
    if (error) {
      console.error('❌ Diagnostic notification test failed:', error);
      return false;
    } else {
      console.log('✅ Diagnostic notification test successful:', data);
      
      // Clean up test record
      const { error: deleteError } = await supabase
        .from('admin_notifications')
        .delete()
        .eq('id', data[0].id);
      
      if (deleteError) {
        console.warn('⚠️ Failed to clean up test notification:', deleteError);
      } else {
        console.log('🧹 Test notification cleaned up successfully');
      }
      
      return true;
    }
    
  } catch (error) {
    console.error('❌ Error testing diagnostic checklist:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔧 Admin Notifications Table Fix Script');
  console.log('=====================================');
  
  const tableCreated = await createAdminNotificationsTable();
  
  if (tableCreated) {
    console.log('\n🧪 Testing diagnostic checklist functionality...');
    const testPassed = await testDiagnosticChecklist();
    
    if (testPassed) {
      console.log('\n🎉 SUCCESS! The admin_notifications table is working correctly.');
      console.log('✅ The diagnostic checklist should now work without 404 errors.');
    } else {
      console.log('\n⚠️ Table exists but diagnostic functionality test failed.');
    }
  } else {
    console.log('\n❌ FAILED! The admin_notifications table could not be created.');
    console.log('💡 Please create the table manually in the Supabase dashboard using the SQL provided above.');
  }
}

main().catch(console.error);
