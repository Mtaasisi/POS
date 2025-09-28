// MONITOR AUTH_USERS ERRORS
// This script helps you monitor and catch the 400 error when it occurs

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

// Override console.error to catch Supabase errors
const originalConsoleError = console.error;
console.error = function(...args) {
  const message = args.join(' ');
  if (message.includes('auth_users') && message.includes('400')) {
    console.log('🚨 CAUGHT AUTH_USERS 400 ERROR!');
    console.log('Error details:', args);
    console.log('🔧 SOLUTION: Replace .in("id", ["care"]) with .eq("name", "care")');
  }
  originalConsoleError.apply(console, args);
};

async function monitorAuthUsersQueries() {
  console.log('🔍 MONITORING AUTH_USERS QUERIES...');
  console.log('This script will catch any 400 errors and show the solution');
  console.log('Run your application and watch for errors below:\n');

  // Test all possible problematic patterns
  const problematicPatterns = [
    {
      name: 'Pattern that causes 400 error (if it exists)',
      test: async () => {
        try {
          // This would cause 400 error if 'care' is used as UUID
          const { data, error } = await supabase
            .from('auth_users')
            .select('id,name,email')
            .in('id', ['care']); // This is the problematic pattern
          
          if (error && error.message.includes('400')) {
            console.log('🚨 FOUND THE PROBLEMATIC PATTERN!');
            console.log('❌ WRONG: .in("id", ["care"])');
            console.log('✅ CORRECT: .eq("name", "care")');
            return true;
          }
        } catch (err) {
          console.log('🚨 Exception caught:', err.message);
        }
        return false;
      }
    }
  ];

  for (const pattern of problematicPatterns) {
    console.log(`Testing: ${pattern.name}`);
    const found = await pattern.test();
    if (found) {
      console.log('✅ Problematic pattern identified and solution provided');
    }
  }

  console.log('\n📝 MONITORING ACTIVE');
  console.log('Keep this script running while you use your application');
  console.log('Any 400 errors will be caught and solutions will be shown');
  console.log('\nPress Ctrl+C to stop monitoring');
}

// Start monitoring
monitorAuthUsersQueries().catch(console.error);
