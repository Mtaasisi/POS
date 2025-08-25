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

      // Test 2: Full query with all fields (simplified)
      addResult('2️⃣ Testing full query with all fields...');
      const { data: fullData, error: fullError } = await supabase
        .from('customers')
        .select(`
          id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, whatsapp, birth_month, birth_day, referral_source, initial_notes, total_returns, profile_image, created_at, updated_at
        `)
        .limit(1);
      
      if (fullError) {
        addResult(`❌ Full query failed: ${fullError.message}`);
      } else {
        addResult(`✅ Full query succeeded: ${fullData?.length || 0} records`);
      }

      // Test 3: Pagination query
      addResult('3️⃣ Testing pagination query...');
      const { data: paginatedData, error: paginatedError } = await supabase
        .from('customers')
        .select(`
          id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, whatsapp, birth_month, birth_day, referral_source, initial_notes, total_returns, profile_image, created_at, updated_at
        `, { count: 'exact' })
        .range(0, 49)
        .order('created_at', { ascending: false });
      
      if (paginatedError) {
        addResult(`❌ Pagination query failed: ${paginatedError.message}`);
      } else {
        addResult(`✅ Pagination query succeeded: ${paginatedData?.length || 0} records`);
      }

      // Test 4: Search query
      addResult('4️⃣ Testing search query...');
      const { data: searchData, error: searchError } = await supabase
        .from('customers')
        .select(`
          id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, whatsapp, birth_month, birth_day, referral_source, initial_notes, total_returns, profile_image, created_at, updated_at
        `)
        .or('name.ilike.%test%,email.ilike.%test%')
        .limit(5);
      
      if (searchError) {
        addResult(`❌ Search query failed: ${searchError.message}`);
      } else {
        addResult(`✅ Search query succeeded: ${searchData?.length || 0} records`);
      }

      // Test 5: Individual related data queries
      if (fullData && fullData.length > 0) {
        const customerId = fullData[0].id;
        addResult(`5️⃣ Testing related data queries for customer ${customerId}...`);
        
        // Test customer notes
        const { data: notesData, error: notesError } = await supabase
          .from('customer_notes')
          .select('*')
          .eq('customer_id', customerId);
        
        if (notesError) {
          addResult(`❌ Customer notes query failed: ${notesError.message}`);
        } else {
          addResult(`✅ Customer notes query succeeded: ${notesData?.length || 0} records`);
        }

        // Test customer payments
        const { data: paymentsData, error: paymentsError } = await supabase
          .from('customer_payments')
          .select('*')
          .eq('customer_id', customerId);
        
        if (paymentsError) {
          addResult(`❌ Customer payments query failed: ${paymentsError.message}`);
        } else {
          addResult(`✅ Customer payments query succeeded: ${paymentsData?.length || 0} records`);
        }

        // Test promo messages
        const { data: promosData, error: promosError } = await supabase
          .from('promo_messages')
          .select('*')
          .eq('customer_id', customerId);
        
        if (promosError) {
          addResult(`❌ Promo messages query failed: ${promosError.message}`);
        } else {
          addResult(`✅ Promo messages query succeeded: ${promosData?.length || 0} records`);
        }

        // Test devices
        const { data: devicesData, error: devicesError } = await supabase
          .from('devices')
          .select('*')
          .eq('customer_id', customerId);
        
        if (devicesError) {
          addResult(`❌ Devices query failed: ${devicesError.message}`);
        } else {
          addResult(`✅ Devices query succeeded: ${devicesData?.length || 0} records`);
        }
      }

      addResult('🎉 All tests completed!');

    } catch (error) {
      addResult(`❌ Test failed with error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Customer Query Test</h1>
      
      <div className="mb-4">
        <button
          onClick={runTest}
          disabled={loading}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mr-2 disabled:opacity-50"
        >
          {loading ? 'Running Tests...' : 'Run Tests'}
        </button>
        
        <button
          onClick={clearResults}
          className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
        >
          Clear Results
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="text-lg font-semibold mb-2">Test Results:</h2>
        {testResults.length === 0 ? (
          <p className="text-gray-500">No test results yet. Click "Run Tests" to start.</p>
        ) : (
          <div className="space-y-1">
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">What this test does:</h3>
        <ul className="text-sm space-y-1">
          <li>• Tests simple customer queries</li>
          <li>• Tests full customer queries with all fields</li>
          <li>• Tests pagination queries</li>
          <li>• Tests search queries</li>
          <li>• Tests individual related data queries (notes, payments, promos, devices)</li>
        </ul>
      </div>
    </div>
  );
};
