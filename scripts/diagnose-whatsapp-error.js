import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function diagnoseWhatsAppError() {
  console.log('🔍 Diagnosing WhatsApp instances 400 error...\n');

  try {
    // 1. Check authentication
    console.log('1️⃣ Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error:', authError);
      return;
    }
    
    if (!user) {
      console.error('❌ No authenticated user found');
      return;
    }
    
    console.log('✅ User authenticated:', user.id);
    console.log('   Role:', user.user_metadata?.role);
    console.log('   Email:', user.email);

    // 2. Check if table exists
    console.log('\n2️⃣ Checking if whatsapp_instances table exists...');
    const { data: tableCheck, error: tableError } = await supabase
      .from('whatsapp_instances')
      .select('count')
      .limit(0);
    
    if (tableError) {
      console.error('❌ Table access error:', tableError);
      console.error('   Code:', tableError.code);
      console.error('   Message:', tableError.message);
      console.error('   Details:', tableError.details);
      console.error('   Hint:', tableError.hint);
    } else {
      console.log('✅ Table exists and is accessible');
    }

    // 3. Try different query approaches
    console.log('\n3️⃣ Testing different query approaches...');
    
    // Test 1: Simple select
    console.log('   Testing simple select...');
    const { data: simpleData, error: simpleError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .limit(1);
    
    if (simpleError) {
      console.error('   ❌ Simple select failed:', simpleError.message);
    } else {
      console.log('   ✅ Simple select works, found', simpleData?.length || 0, 'records');
    }

    // Test 2: Count query
    console.log('   Testing count query...');
    const { count, error: countError } = await supabase
      .from('whatsapp_instances')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('   ❌ Count query failed:', countError.message);
    } else {
      console.log('   ✅ Count query works, total records:', count);
    }

    // Test 3: Specific columns
    console.log('   Testing specific columns...');
    const { data: colData, error: colError } = await supabase
      .from('whatsapp_instances')
      .select('id, instance_id, phone_number')
      .limit(1);
    
    if (colError) {
      console.error('   ❌ Column select failed:', colError.message);
    } else {
      console.log('   ✅ Column select works');
    }

    // 4. Check RLS policies
    console.log('\n4️⃣ Checking RLS policies...');
    try {
      const { data: policies, error: policyError } = await supabase.rpc('exec_sql', {
        sql: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual,
            with_check
          FROM pg_policies 
          WHERE tablename = 'whatsapp_instances'
          ORDER BY policyname;
        `
      });
      
      if (policyError) {
        console.log('   ⚠️ Could not check policies (exec_sql not available):', policyError.message);
      } else {
        console.log('   📋 Current policies:');
        console.log(policies);
      }
    } catch (error) {
      console.log('   ⚠️ Could not check policies:', error.message);
    }

    // 5. Test with different auth context
    console.log('\n5️⃣ Testing with service role...');
    const serviceRoleKey = SUPABASE_KEY.replace('anon', 'service_role');
    const serviceSupabase = createClient(SUPABASE_URL, serviceRoleKey);
    
    const { data: serviceData, error: serviceError } = await serviceSupabase
      .from('whatsapp_instances')
      .select('*')
      .limit(1);
    
    if (serviceError) {
      console.error('   ❌ Service role also failed:', serviceError.message);
    } else {
      console.log('   ✅ Service role works, found', serviceData?.length || 0, 'records');
    }

    // 6. Summary
    console.log('\n📊 DIAGNOSIS SUMMARY:');
    console.log('=====================');
    
    if (tableError) {
      console.log('❌ MAIN ISSUE: Table access is blocked');
      console.log('   Error Code:', tableError.code);
      console.log('   Error Message:', tableError.message);
      
      if (tableError.code === 'PGRST116') {
        console.log('   💡 SOLUTION: RLS policy issue - run the fix script');
      } else if (tableError.code === 'PGRST301') {
        console.log('   💡 SOLUTION: Table does not exist - check migrations');
      } else {
        console.log('   💡 SOLUTION: Unknown error - check Supabase logs');
      }
    } else {
      console.log('✅ Table access is working correctly');
    }

  } catch (error) {
    console.error('❌ Diagnostic error:', error);
  }
}

// Run the diagnosis
diagnoseWhatsAppError();
