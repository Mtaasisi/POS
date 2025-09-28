// Script to create admin_notifications table directly
// This script will execute the SQL to create the missing table

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY not found in environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createAdminNotificationsTable() {
  console.log('🚀 Creating admin_notifications table...');
  
  try {
    // Read the SQL migration file
    const migrationPath = path.join(process.cwd(), 'supabase', 'migrations', '20250131000041_create_admin_notifications_table.sql');
    const sqlContent = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📄 SQL migration content loaded');
    
    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`);
    
    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          const { data, error } = await supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.warn(`⚠️ Statement ${i + 1} warning:`, error.message);
            // Continue with other statements even if one fails
          } else {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          }
        } catch (err) {
          console.warn(`⚠️ Statement ${i + 1} error:`, err.message);
          // Continue with other statements
        }
      }
    }
    
    console.log('🎉 Admin notifications table creation completed!');
    
    // Test the table by trying to insert a test record
    console.log('🧪 Testing table by inserting a test record...');
    
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
      console.error('❌ Test insert failed:', insertError);
    } else {
      console.log('✅ Test insert successful:', insertData);
      
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
    }
    
  } catch (error) {
    console.error('❌ Error creating admin_notifications table:', error);
  }
}

// Alternative approach: Create table using direct SQL execution
async function createTableDirectly() {
  console.log('🚀 Creating admin_notifications table directly...');
  
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS admin_notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        device_id UUID,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'unread' CHECK (status IN ('unread', 'read', 'archived')),
        priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
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
  `;
  
  try {
    // Try to execute the SQL directly
    const { data, error } = await supabase.rpc('exec_sql', { sql: createTableSQL });
    
    if (error) {
      console.error('❌ Error creating table:', error);
      return false;
    }
    
    console.log('✅ Table created successfully');
    
    // Create indexes
    const indexSQLs = [
      'CREATE INDEX IF NOT EXISTS idx_admin_notifications_device_id ON admin_notifications(device_id);',
      'CREATE INDEX IF NOT EXISTS idx_admin_notifications_status ON admin_notifications(status);',
      'CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);',
      'CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);'
    ];
    
    for (const indexSQL of indexSQLs) {
      const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL });
      if (indexError) {
        console.warn('⚠️ Index creation warning:', indexError.message);
      }
    }
    
    // Enable RLS
    const { error: rlsError } = await supabase.rpc('exec_sql', { 
      sql: 'ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;' 
    });
    
    if (rlsError) {
      console.warn('⚠️ RLS enable warning:', rlsError.message);
    }
    
    // Create policies
    const policySQLs = [
      `CREATE POLICY "Enable read access for all users" ON admin_notifications FOR SELECT USING (true);`,
      `CREATE POLICY "Enable insert access for all users" ON admin_notifications FOR INSERT WITH CHECK (true);`,
      `CREATE POLICY "Enable update access for all users" ON admin_notifications FOR UPDATE USING (true);`
    ];
    
    for (const policySQL of policySQLs) {
      const { error: policyError } = await supabase.rpc('exec_sql', { sql: policySQL });
      if (policyError) {
        console.warn('⚠️ Policy creation warning:', policyError.message);
      }
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Error in direct table creation:', error);
    return false;
  }
}

// Main execution
async function main() {
  console.log('🔧 Admin Notifications Table Creation Script');
  console.log('==========================================');
  
  // Try direct approach first
  const success = await createTableDirectly();
  
  if (success) {
    console.log('🎉 Admin notifications table created successfully!');
    console.log('✅ The diagnostic checklist should now work without 404 errors');
  } else {
    console.log('❌ Failed to create admin notifications table');
    console.log('💡 You may need to create the table manually in the Supabase dashboard');
  }
}

main().catch(console.error);
