import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { createClient } from '@supabase/supabase-js';

export const CustomerQueryTest: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Create a client without authentication for comparison
  const supabaseNoAuth = createClient(
    process.env.VITE_SUPABASE_URL || '',
    process.env.VITE_SUPABASE_ANON_KEY || ''
  );

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runTest = async () => {
    setLoading(true);
    setTestResults([]);
    
    try {
      addResult('🔍 Starting customer query test...');
      
      // Test 1: Simple query
      addResult('1️⃣ Testing simple query...');
      const { data: simpleData, error: simpleError } = await supabase
        .from('customers')
        .select('id, name')
        .limit(1);
      
      if (simpleError) {
        addResult(`❌ Simple query failed: ${simpleError.message}`);
      } else {
        addResult(`✅ Simple query succeeded: ${simpleData?.length || 0} records`);
      }

      // Test 2: Full complex query (the one that's failing)
      addResult('2️⃣ Testing full complex query...');
      const { data: fullData, error: fullError } = await supabase
        .from('customers')
        .select(`
          id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, birth_month, birth_day, referral_source, total_returns, profile_image, created_at, updated_at,
          customer_notes(*),
          customer_payments(
            *,
            devices(brand, model)
          ),
          promo_messages(*),
          devices(*)
        `)
        .limit(1);
      
      // Test 2.5: Shorter query to test if length is the issue
      addResult('2.5️⃣ Testing shorter query...');
      const { data: shortData, error: shortError } = await supabase
        .from('customers')
        .select('id, name, customer_notes(*), customer_payments(*), devices(*)')
        .limit(1);
      
      if (fullError) {
        addResult(`❌ Full complex query failed: ${fullError.message}`);
        addResult(`Error details: ${JSON.stringify({
          message: fullError.message,
          details: fullError.details,
          hint: fullError.hint,
          code: fullError.code
        }, null, 2)}`);
      } else {
        addResult(`✅ Full complex query succeeded: ${fullData?.length || 0} records`);
      }
      
      if (shortError) {
        addResult(`❌ Short query failed: ${shortError.message}`);
      } else {
        addResult(`✅ Short query succeeded: ${shortData?.length || 0} records`);
      }

      addResult('🏁 Test completed');
      
      // Test 3: Test without authentication
      addResult('3️⃣ Testing without authentication...');
      const { data: noAuthData, error: noAuthError } = await supabaseNoAuth
        .from('customers')
        .select(`
          id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, birth_month, birth_day, referral_source, total_returns, profile_image, created_at, updated_at,
          customer_notes(*),
          customer_payments(
            *,
            devices(brand, model)
          ),
          promo_messages(*),
          devices(*)
        `)
        .limit(1);
      
      if (noAuthError) {
        addResult(`❌ No auth query failed: ${noAuthError.message}`);
      } else {
        addResult(`✅ No auth query succeeded: ${noAuthData?.length || 0} records`);
      }
      
    } catch (error) {
      addResult(`❌ Test failed with exception: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Customer Query Test</h1>
      
      <button
        onClick={runTest}
        disabled={loading}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Running Test...' : 'Run Test'}
      </button>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Test Results:</h2>
        <div className="space-y-1">
          {testResults.map((result, index) => (
            <div key={index} className="text-sm font-mono">
              {result}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
