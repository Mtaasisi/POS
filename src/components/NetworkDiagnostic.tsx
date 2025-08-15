import React, { useState, useEffect } from 'react';
import { supabase, testSupabaseConnection } from '../lib/supabaseClient';

interface DiagnosticResult {
  test: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  details?: any;
}

const NetworkDiagnostic: React.FC = () => {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test: string, status: 'pending' | 'success' | 'error', message: string, details?: any) => {
    setResults(prev => [...prev, { test, status, message, details }]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);

    // Test 1: Basic network connectivity
    addResult('Network Connectivity', 'pending', 'Testing basic internet connectivity...');
    try {
      const response = await fetch('https://httpbin.org/get');
      if (response.ok) {
        addResult('Network Connectivity', 'success', 'Internet connection is working');
      } else {
        addResult('Network Connectivity', 'error', `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      addResult('Network Connectivity', 'error', `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 2: Supabase URL accessibility
    addResult('Supabase URL', 'pending', 'Testing Supabase URL accessibility...');
    try {
      const response = await fetch('https://jxhzveborezjhsmzsgbc.supabase.co/rest/v1/', {
        method: 'HEAD',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
        }
      });
      if (response.ok) {
        addResult('Supabase URL', 'success', 'Supabase URL is accessible');
      } else {
        addResult('Supabase URL', 'error', `HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      addResult('Supabase URL', 'error', `Supabase URL error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 3: Supabase client connection
    addResult('Supabase Client', 'pending', 'Testing Supabase client connection...');
    try {
      const result = await testSupabaseConnection();
      if (result.success) {
        addResult('Supabase Client', 'success', 'Supabase client connection successful');
      } else {
        addResult('Supabase Client', 'error', `Supabase client error: ${result.error?.message || 'Unknown error'}`, result.error);
      }
    } catch (error) {
      addResult('Supabase Client', 'error', `Supabase client exception: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test 4: Environment variables
    addResult('Environment Variables', 'pending', 'Checking environment variables...');
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (envUrl && envKey) {
      addResult('Environment Variables', 'success', 'Environment variables are properly configured');
    } else {
      addResult('Environment Variables', 'error', `Missing environment variables: URL=${!!envUrl}, KEY=${!!envKey}`);
    }

    // Test 5: Browser compatibility
    addResult('Browser Compatibility', 'pending', 'Checking browser compatibility...');
    const isOnline = navigator.onLine;
    const userAgent = navigator.userAgent;
    const hasFetch = typeof fetch !== 'undefined';
    
    if (isOnline && hasFetch) {
      addResult('Browser Compatibility', 'success', 'Browser is compatible and online');
    } else {
      addResult('Browser Compatibility', 'error', `Browser issues: Online=${isOnline}, Fetch=${hasFetch}`);
    }

    setIsRunning(false);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Network Diagnostic Tool</h2>
      
      <button
        onClick={runDiagnostics}
        disabled={isRunning}
        className="mb-6 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
      </button>

      <div className="space-y-4">
        {results.map((result, index) => (
          <div key={index} className="border rounded p-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">{result.test}</h3>
              <span className={`px-2 py-1 rounded text-sm ${
                result.status === 'success' ? 'bg-green-100 text-green-800' :
                result.status === 'error' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {result.status.toUpperCase()}
              </span>
            </div>
            <p className="mt-2 text-gray-600">{result.message}</p>
            {result.details && (
              <details className="mt-2">
                <summary className="cursor-pointer text-sm text-gray-500">View Details</summary>
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify(result.details, null, 2)}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {results.length > 0 && !isRunning && (
        <div className="mt-6 p-4 bg-gray-100 rounded">
          <h3 className="font-semibold mb-2">Summary:</h3>
          <ul className="text-sm space-y-1">
            <li>✅ Successful tests: {results.filter(r => r.status === 'success').length}</li>
            <li>❌ Failed tests: {results.filter(r => r.status === 'error').length}</li>
            <li>⏳ Pending tests: {results.filter(r => r.status === 'pending').length}</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default NetworkDiagnostic;
