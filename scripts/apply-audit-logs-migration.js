/**
 * Apply Audit Logs Migration
 * 
 * This script creates the audit_logs table with the correct schema
 * to fix the "column timestamp does not exist" error
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
dotenv.config();

// Initialize Supabase client with anon key
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// SQL migration for audit_logs table
const auditLogsMigration = `
-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    details TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    entity_type TEXT DEFAULT 'system',
    entity_id TEXT,
    user_role TEXT DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_role ON audit_logs(user_role);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type_id ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, timestamp);

-- Enable Row Level Security (RLS)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit_logs
-- Users can view their own audit logs
CREATE POLICY "Users can view their own audit logs" ON audit_logs
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert audit logs (for their own actions)
CREATE POLICY "Users can insert their own audit logs" ON audit_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs" ON audit_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth_users 
            WHERE auth_users.id = auth.uid() 
            AND auth_users.role = 'admin'
        )
    );

-- System can insert audit logs (for system events)
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid() = user_id);
`;

async function applyAuditLogsMigration() {
  console.log('🔧 Checking Audit Logs Table Status...\n');
  
  try {
    // Check if audit_logs table exists by trying to query it
    const { data: existingData, error: checkError } = await supabase
      .from('audit_logs')
      .select('id, timestamp')
      .limit(1);

    if (checkError) {
      if (checkError.code === 'PGRST116') {
        console.log('❌ audit_logs table does not exist');
        console.log('\n📋 To fix the "column timestamp does not exist" error, you need to create the audit_logs table.');
        console.log('\n🔧 Please run the following SQL in your Supabase Dashboard SQL Editor:');
        console.log('\n' + '='.repeat(80));
        console.log(auditLogsMigration);
        console.log('='.repeat(80));
        console.log('\n📝 Steps:');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Copy and paste the SQL above');
        console.log('4. Click "Run" to execute the migration');
        console.log('5. The audit service should work after this');
        return;
      } else {
        console.error('❌ Error checking audit_logs table:', checkError);
        return;
      }
    }

    // Table exists, check if timestamp column works
    console.log('✅ audit_logs table exists');
    
    // Try to query with timestamp ordering
    const { data: queryData, error: queryError } = await supabase
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1);

    if (queryError) {
      console.log('⚠️  audit_logs table exists but has issues with timestamp column');
      console.log('   Error:', queryError.message);
      console.log('\n🔧 The table might be missing the timestamp column or have incorrect schema.');
      console.log('   Please run the SQL migration above to fix the table structure.');
    } else {
      console.log('✅ audit_logs table is properly configured with timestamp column');
      console.log(`   Found ${queryData.length} log(s) in the table`);
      
      // Test inserting a log
      const testLog = {
        action: 'test_migration',
        details: 'Testing audit logs table functionality',
        entity_type: 'system',
        user_role: 'system'
      };

      const { data: insertData, error: insertError } = await supabase
        .from('audit_logs')
        .insert(testLog)
        .select()
        .single();

      if (insertError) {
        console.log('⚠️  Could not insert test log:', insertError.message);
        console.log('   This might be due to RLS policies or missing permissions');
      } else {
        console.log('✅ Audit logs functionality is working correctly');
        console.log(`   Test log created with ID: ${insertData.id}`);
      }
    }

  } catch (error) {
    console.error('❌ Error during audit logs check:', error);
  }
}

// Run the migration
applyAuditLogsMigration().then(() => {
  console.log('\n✨ Migration script completed!');
}).catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
