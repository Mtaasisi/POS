// SCRIPT TO FIND PROBLEMATIC AUTH_USERS QUERIES
// This script searches for any code that might be causing the 400 error

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function findProblematicQueries() {
  console.log('🔍 SEARCHING FOR PROBLEMATIC AUTH_USERS QUERIES...');
  console.log('================================================');
  
  const testCases = [
    {
      name: 'Test 1: Query by name (CORRECT)',
      query: () => supabase.from('auth_users').select('id,name,email').eq('name', 'care')
    },
    {
      name: 'Test 2: Query by role (CORRECT)',
      query: () => supabase.from('auth_users').select('id,name,email').eq('role', 'technician')
    },
    {
      name: 'Test 3: Query by email (CORRECT)',
      query: () => supabase.from('auth_users').select('id,name,email').eq('email', 'care@example.com')
    },
    {
      name: 'Test 4: Query multiple names (CORRECT)',
      query: () => supabase.from('auth_users').select('id,name,email').in('name', ['care', 'admin'])
    },
    {
      name: 'Test 5: Query by actual UUID (CORRECT)',
      query: () => supabase.from('auth_users').select('id,name,email').eq('id', 'e066f1ca-7f21-47b3-9290-e0579716bb70')
    }
  ];

  for (const testCase of testCases) {
    try {
      console.log(`\n🧪 ${testCase.name}`);
      const { data, error } = await testCase.query();
      
      if (error) {
        console.log(`❌ FAILED: ${error.message}`);
        if (error.message.includes('400')) {
          console.log('🚨 This is the problematic query pattern!');
        }
      } else {
        console.log(`✅ SUCCESS: Found ${data?.length || 0} records`);
        if (data && data.length > 0) {
          console.log(`   Sample: ${data[0].name} (${data[0].email})`);
        }
      }
    } catch (err) {
      console.log(`❌ EXCEPTION: ${err.message}`);
    }
  }

  console.log('\n📝 RECOMMENDATIONS:');
  console.log('1. If any test failed with 400 error, that\'s your problematic pattern');
  console.log('2. Replace .in("id", ["care"]) with .eq("name", "care")');
  console.log('3. Use .eq("name", "care") instead of .in("id", ["care"])');
  console.log('4. Check browser console for the exact error URL');
}

// Run the search
findProblematicQueries().catch(console.error);
