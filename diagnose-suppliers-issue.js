// Diagnostic script to identify supplier fetching issues
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseSuppliersIssue() {
  console.log('🔍 Diagnosing suppliers fetching issue...');
  console.log('==========================================');
  
  try {
    // Test 1: Basic table access
    console.log('\n📋 Test 1: Basic table access');
    const { data: tableCheck, error: tableError } = await supabase
      .from('lats_suppliers')
      .select('count', { count: 'exact', head: true });
    
    if (tableError) {
      console.error('❌ Table access failed:', tableError);
      return;
    }
    console.log('✅ Table access successful');
    
    // Test 2: Simple select without authentication
    console.log('\n📋 Test 2: Simple select (no auth)');
    const { data: suppliers, error: fetchError } = await supabase
      .from('lats_suppliers')
      .select('*')
      .order('name');
    
    if (fetchError) {
      console.error('❌ Simple select failed:', fetchError);
      console.log('🔧 This indicates an RLS policy issue');
      return;
    }
    console.log(`✅ Simple select successful - Found ${suppliers.length} suppliers`);
    
    // Test 3: Check authentication status
    console.log('\n📋 Test 3: Authentication status');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('⚠️ Auth check failed:', authError.message);
    } else if (user) {
      console.log('✅ User authenticated:', user.email);
    } else {
      console.log('ℹ️ No user authenticated (anonymous access)');
    }
    
    // Test 4: Test with authenticated user
    console.log('\n📋 Test 4: Test with authentication');
    if (user) {
      const { data: authSuppliers, error: authFetchError } = await supabase
        .from('lats_suppliers')
        .select('*')
        .order('name');
      
      if (authFetchError) {
        console.error('❌ Authenticated fetch failed:', authFetchError);
      } else {
        console.log(`✅ Authenticated fetch successful - Found ${authSuppliers.length} suppliers`);
      }
    } else {
      console.log('ℹ️ Skipping authenticated test - no user logged in');
    }
    
    // Test 5: Check RLS policies
    console.log('\n📋 Test 5: RLS Policy Check');
    const { data: policies, error: policyError } = await supabase
      .rpc('get_table_policies', { table_name: 'lats_suppliers' })
      .catch(() => {
        // Fallback if RPC doesn't exist
        console.log('ℹ️ RPC not available, checking policies manually...');
        return { data: null, error: 'RPC not available' };
      });
    
    if (policyError) {
      console.log('ℹ️ Cannot check policies via RPC, but table access works');
    } else if (policies) {
      console.log('📋 Current policies:', policies);
    }
    
    // Test 6: Check environment variables
    console.log('\n📋 Test 6: Environment Variables');
    console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
    console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '✅ Set' : '❌ Missing');
    
    // Test 7: Network connectivity
    console.log('\n📋 Test 7: Network connectivity');
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/lats_suppliers?select=count`, {
        headers: {
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`
        }
      });
      
      if (response.ok) {
        console.log('✅ Direct API call successful');
      } else {
        console.log(`⚠️ Direct API call failed: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log('❌ Direct API call failed:', error.message);
    }
    
    console.log('\n==========================================');
    console.log('🎯 Diagnosis Summary:');
    
    if (suppliers && suppliers.length > 0) {
      console.log('✅ Suppliers can be fetched successfully');
      console.log('🔧 The issue might be in the application code or environment configuration');
      console.log('📝 Check browser console for JavaScript errors');
      console.log('📝 Verify environment variables in hosting platform');
    } else {
      console.log('❌ No suppliers found in database');
      console.log('🔧 This might be a data issue rather than a permissions issue');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the diagnosis
diagnoseSuppliersIssue().catch(console.error);
