import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

async function testProblematicData() {
  try {
    const customerId = 'c4aa2553-c004-464e-8b14-dea85379a89d';
    console.log(`🔍 Testing potentially problematic data: ${customerId}`);
    
    // Test cases with potentially problematic data
    const testCases = [
      // Test 1: Empty string values
      {
        name: 'Test with empty strings',
        data: {
          name: '',
          email: '',
          phone: '',
          city: ''
        }
      },
      
      // Test 2: Null values
      {
        name: 'Test with null values',
        data: {
          name: null,
          email: null,
          phone: null,
          city: null
        }
      },
      
      // Test 3: Undefined values
      {
        name: 'Test with undefined values',
        data: {
          name: undefined,
          email: undefined,
          phone: undefined,
          city: undefined
        }
      },
      
      // Test 4: Invalid data types
      {
        name: 'Test with invalid data types',
        data: {
          totalSpent: 'not a number',
          points: 'invalid',
          isActive: 'not boolean'
        }
      },
      
      // Test 5: Very long strings
      {
        name: 'Test with very long strings',
        data: {
          name: 'A'.repeat(1000),
          notes: 'B'.repeat(5000)
        }
      },
      
      // Test 6: Special characters
      {
        name: 'Test with special characters',
        data: {
          name: 'Test Customer <script>alert("xss")</script>',
          email: 'test@example.com<script>alert("xss")</script>'
        }
      },
      
      // Test 7: Invalid dates
      {
        name: 'Test with invalid dates',
        data: {
          lastVisit: 'invalid-date',
          joinedDate: 'not-a-date'
        }
      },
      
      // Test 8: Invalid enum values
      {
        name: 'Test with invalid enum values',
        data: {
          gender: 'invalid-gender',
          loyaltyLevel: 'invalid-level',
          colorTag: 'invalid-tag'
        }
      }
    ];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      console.log(`\n🧪 Test ${i + 1}: ${testCase.name}`);
      console.log('Data:', JSON.stringify(testCase.data, null, 2));
      
      try {
        const { data, error } = await supabase
          .from('customers')
          .update(testCase.data)
          .eq('id', customerId)
          .select();
        
        if (error) {
          console.error(`❌ Test ${i + 1} failed:`, error);
          console.error('Error details:', {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint
          });
        } else {
          console.log(`✅ Test ${i + 1} successful (unexpected!)`);
        }
      } catch (error) {
        console.error(`❌ Test ${i + 1} threw exception:`, error);
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

testProblematicData(); 