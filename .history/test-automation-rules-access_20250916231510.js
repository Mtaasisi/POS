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
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

// Test with anon key (what the frontend uses)
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey);

// Test with service key (what should work)
const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

async function testAutomationRulesAccess() {
  console.log('🔍 Testing automation_rules table access...');
  
  // Test 1: Try with anon key (frontend)
  console.log('\n📱 Testing with anon key (frontend):');
  try {
    const { data, error } = await supabaseAnon
      .from('automation_rules')
      .select('*')
      .order('priority', { ascending: false });
    
    if (error) {
      console.error('❌ Anon key error:', error);
    } else {
      console.log('✅ Anon key success:', data?.length || 0, 'rules found');
    }
  } catch (err) {
    console.error('❌ Anon key exception:', err);
  }
  
  // Test 2: Try with service key
  console.log('\n🔧 Testing with service key:');
  try {
    const { data, error } = await supabaseService
      .from('automation_rules')
      .select('*')
      .order('priority', { ascending: false });
    
    if (error) {
      console.error('❌ Service key error:', error);
    } else {
      console.log('✅ Service key success:', data?.length || 0, 'rules found');
      if (data && data.length > 0) {
        console.log('📋 Sample rules:');
        data.slice(0, 3).forEach(rule => {
          console.log(`   - ${rule.name} (${rule.type}, ${rule.status})`);
        });
      }
    }
  } catch (err) {
    console.error('❌ Service key exception:', err);
  }
  
  // Test 3: Check table existence with service key
  console.log('\n🔍 Checking table existence:');
  try {
    const { data, error } = await supabaseService
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'automation_rules');
    
    if (error) {
      console.error('❌ Table check error:', error);
    } else {
      console.log('✅ Table exists:', data?.length > 0);
    }
  } catch (err) {
    console.error('❌ Table check exception:', err);
  }
  
  // Test 4: Check RLS policies
  console.log('\n🔒 Checking RLS policies:');
  try {
    const { data, error } = await supabaseService
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'automation_rules');
    
    if (error) {
      console.error('❌ RLS check error:', error);
    } else {
      console.log('✅ RLS policies found:', data?.length || 0);
      if (data && data.length > 0) {
        data.forEach(policy => {
          console.log(`   - ${policy.policyname}: ${policy.cmd}`);
        });
      }
    }
  } catch (err) {
    console.error('❌ RLS check exception:', err);
  }
}

// Run the test
testAutomationRulesAccess();
