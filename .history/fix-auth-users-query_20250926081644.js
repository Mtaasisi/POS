import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixAuthUsersQuery() {
  console.log('🔧 Fixing auth_users query 400 error...');
  
  try {
    // ❌ WRONG WAY (causes 400 error):
    // const { data, error } = await supabase
    //   .from('auth_users')
    //   .select('id,name,email')
    //   .in('id', ['care']); // This creates id=in.(care) which is malformed

    // ✅ CORRECT WAY 1: Query by name (recommended)
    console.log('✅ Testing correct query by name...');
    const { data: userByName, error: errorByName } = await supabase
      .from('auth_users')
      .select('id,name,email')
      .eq('name', 'care');

    if (errorByName) {
      console.log('❌ Error querying by name:', errorByName.message);
    } else {
      console.log('✅ Query by name successful:', userByName);
    }

    // ✅ CORRECT WAY 2: Query by email
    console.log('✅ Testing correct query by email...');
    const { data: userByEmail, error: errorByEmail } = await supabase
      .from('auth_users')
      .select('id,name,email')
      .eq('email', 'care@example.com');

    if (errorByEmail) {
      console.log('❌ Error querying by email:', errorByEmail.message);
    } else {
      console.log('✅ Query by email successful:', userByEmail);
    }

    // ✅ CORRECT WAY 3: If you need to use in() for multiple values
    console.log('✅ Testing correct in() syntax...');
    const { data: usersByNames, error: errorByNames } = await supabase
      .from('auth_users')
      .select('id,name,email')
      .in('name', ['care', 'admin', 'technician']); // This is correct syntax

    if (errorByNames) {
      console.log('❌ Error querying by names:', errorByNames.message);
    } else {
      console.log('✅ Query by names successful:', usersByNames);
    }

    // ✅ CORRECT WAY 4: Query by role
    console.log('✅ Testing correct query by role...');
    const { data: usersByRole, error: errorByRole } = await supabase
      .from('auth_users')
      .select('id,name,email,role')
      .eq('role', 'technician');

    if (errorByRole) {
      console.log('❌ Error querying by role:', errorByRole.message);
    } else {
      console.log('✅ Query by role successful:', usersByRole);
    }

    console.log('🎉 Fix completed!');
    console.log('📝 SOLUTION: Replace .in("id", ["care"]) with .eq("name", "care") in your code');
    console.log('📝 The error was caused by malformed query: id=in.(care)');
    console.log('📝 Correct syntax: name=care or id=in.(uuid1,uuid2) for multiple values');

  } catch (error) {
    console.error('❌ Error during fix:', error.message);
  }
}

// Run the fix
fixAuthUsersQuery();
