import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixAutomationRulesRLS() {
  try {
    console.log('🔧 Fixing automation_rules RLS policies...');
    
    // First, let's check if RLS is enabled
    console.log('🔍 Checking RLS status...');
    
    // Try to query the table with anon key to see the exact error
    const anonClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
    const { data: anonData, error: anonError } = await anonClient
      .from('automation_rules')
      .select('*')
      .limit(1);
    
    console.log('📱 Anon key test result:', anonError ? `Error: ${anonError.message}` : `Success: ${anonData?.length || 0} records`);
    
    // The issue is likely that the RLS policies are too restrictive
    // Let's create more permissive policies
    console.log('🔧 Creating permissive RLS policies...');
    
    // We need to execute SQL to fix the policies
    // Since we can't execute DDL directly, let's provide the SQL
    console.log('');
    console.log('📋 Copy and paste this SQL into the Supabase SQL Editor to fix RLS policies:');
    console.log('');
    console.log('-- Drop existing restrictive policies');
    console.log('DROP POLICY IF EXISTS "Users can view automation rules" ON automation_rules;');
    console.log('DROP POLICY IF EXISTS "Users can insert automation rules" ON automation_rules;');
    console.log('DROP POLICY IF EXISTS "Users can update automation rules" ON automation_rules;');
    console.log('DROP POLICY IF EXISTS "Users can delete automation rules" ON automation_rules;');
    console.log('');
    console.log('-- Create more permissive policies');
    console.log('CREATE POLICY "Allow all operations on automation_rules" ON automation_rules');
    console.log('    FOR ALL USING (true) WITH CHECK (true);');
    console.log('');
    console.log('-- Alternative: Create specific policies for authenticated users');
    console.log('-- CREATE POLICY "Authenticated users can view automation rules" ON automation_rules');
    console.log('--     FOR SELECT USING (auth.role() = \'authenticated\');');
    console.log('');
    console.log('-- CREATE POLICY "Authenticated users can insert automation rules" ON automation_rules');
    console.log('--     FOR INSERT WITH CHECK (auth.role() = \'authenticated\');');
    console.log('');
    console.log('-- CREATE POLICY "Authenticated users can update automation rules" ON automation_rules');
    console.log('--     FOR UPDATE USING (auth.role() = \'authenticated\');');
    console.log('');
    console.log('-- CREATE POLICY "Authenticated users can delete automation rules" ON automation_rules');
    console.log('--     FOR DELETE USING (auth.role() = \'authenticated\');');
    console.log('');
    console.log('✅ After running this SQL, the frontend should be able to access automation_rules.');
    
    // Test the current state
    console.log('\n🧪 Testing current access...');
    const { data: testData, error: testError } = await anonClient
      .from('automation_rules')
      .select('id, name, type, status')
      .limit(3);
    
    if (testError) {
      console.log('❌ Current anon access still failing:', testError.message);
    } else {
      console.log('✅ Current anon access working:', testData?.length || 0, 'rules found');
    }
    
  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error);
  }
}

// Run the fix
fixAutomationRulesRLS();
