// FIX FOR AUTH_USERS 400 ERROR IN APPLICATION CODE
// This file shows how to fix the malformed query issue in your React application

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

// ❌ WRONG WAYS (causes 400 error):
async function wrongWays() {
  console.log('❌ WRONG WAYS (causes 400 error):');
  
  // ❌ WRONG 1: Using string as ID in in() filter
  // const { data, error } = await supabase
  //   .from('auth_users')
  //   .select('id,name,email')
  //   .in('id', ['care']); // This creates id=in.(care) which is malformed
  
  // ❌ WRONG 2: Using non-UUID string in id field
  // const { data, error } = await supabase
  //   .from('auth_users')
  //   .select('id,name,email')
  //   .in('id', ['care', 'admin']); // Both 'care' and 'admin' are not UUIDs
  
  console.log('These patterns cause 400 Bad Request error');
}

// ✅ CORRECT WAYS (works properly):
async function correctWays() {
  console.log('✅ CORRECT WAYS (works properly):');
  
  try {
    // ✅ CORRECT 1: Query by name field
    console.log('1. Query by name field:');
    const { data: usersByName, error: errorByName } = await supabase
      .from('auth_users')
      .select('id,name,email,username,role')
      .eq('name', 'care');
    
    if (errorByName) {
      console.log('❌ Error:', errorByName.message);
    } else {
      console.log('✅ Success:', usersByName);
    }

    // ✅ CORRECT 2: Query by email field
    console.log('2. Query by email field:');
    const { data: usersByEmail, error: errorByEmail } = await supabase
      .from('auth_users')
      .select('id,name,email,username,role')
      .eq('email', 'care@example.com');
    
    if (errorByEmail) {
      console.log('❌ Error:', errorByEmail.message);
    } else {
      console.log('✅ Success:', usersByEmail);
    }

    // ✅ CORRECT 3: Query by role
    console.log('3. Query by role:');
    const { data: usersByRole, error: errorByRole } = await supabase
      .from('auth_users')
      .select('id,name,email,username,role')
      .eq('role', 'technician');
    
    if (errorByRole) {
      console.log('❌ Error:', errorByRole.message);
    } else {
      console.log('✅ Success:', usersByRole);
    }

    // ✅ CORRECT 4: Query multiple names (correct in() usage)
    console.log('4. Query multiple names:');
    const { data: usersByNames, error: errorByNames } = await supabase
      .from('auth_users')
      .select('id,name,email,username,role')
      .in('name', ['care', 'admin', 'technician']); // This is correct syntax
    
    if (errorByNames) {
      console.log('❌ Error:', errorByNames.message);
    } else {
      console.log('✅ Success:', usersByNames);
    }

    // ✅ CORRECT 5: Query by actual UUIDs (if you have them)
    console.log('5. Query by actual UUIDs:');
    const { data: allUsers } = await supabase
      .from('auth_users')
      .select('id,name,email,username,role')
      .limit(3);
    
    if (allUsers && allUsers.length > 0) {
      const userIds = allUsers.map(user => user.id);
      const { data: usersByIds, error: errorByIds } = await supabase
        .from('auth_users')
        .select('id,name,email,username,role')
        .in('id', userIds); // This is correct - using actual UUIDs
      
      if (errorByIds) {
        console.log('❌ Error:', errorByIds.message);
      } else {
        console.log('✅ Success:', usersByIds);
      }
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
  }
}

// Function to demonstrate the fix for your specific use case
async function fixSpecificUseCase() {
  console.log('🔧 FIXING YOUR SPECIFIC USE CASE:');
  
  // If you were trying to query for user 'care' by ID, do this instead:
  
  // ❌ OLD CODE (causes 400 error):
  // const { data, error } = await supabase
  //   .from('auth_users')
  //   .select('id,name,email')
  //   .in('id', ['care']);
  
  // ✅ NEW CODE (works correctly):
  const { data, error } = await supabase
    .from('auth_users')
    .select('id,name,email')
    .eq('name', 'care');
  
  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ Fixed query successful:', data);
  }
}

// Main function to run all tests
async function main() {
  console.log('🚀 AUTH_USERS 400 ERROR FIX DEMONSTRATION');
  console.log('==========================================');
  
  await wrongWays();
  console.log('\n');
  await correctWays();
  console.log('\n');
  await fixSpecificUseCase();
  
  console.log('\n🎉 FIX SUMMARY:');
  console.log('1. ❌ WRONG: .in("id", ["care"]) - causes 400 error');
  console.log('2. ✅ CORRECT: .eq("name", "care") - works properly');
  console.log('3. ✅ CORRECT: .in("name", ["care", "admin"]) - works for multiple names');
  console.log('4. ✅ CORRECT: .in("id", [uuid1, uuid2]) - works for actual UUIDs');
  
  console.log('\n📝 SOLUTION FOR YOUR CODE:');
  console.log('Replace any .in("id", ["care"]) with .eq("name", "care")');
  console.log('The error occurs because "care" is not a valid UUID for the id field');
}

// Run the demonstration
main().catch(console.error);
