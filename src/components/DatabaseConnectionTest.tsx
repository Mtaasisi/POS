import React, { useState, useEffect } from 'react';
import { supabase, testSupabaseConnection, checkConnectionHealth } from '../lib/supabaseClient';
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, Database, Wifi, Shield, Clock } from 'lucide-react';

interface ConnectionTestResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
  responseTime?: number;
  details?: any;
}

const DatabaseConnectionTest: React.FC = () => {
  const [results, setResults] = useState<ConnectionTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'healthy' | 'warning' | 'error'>('healthy');

  const runConnectionTests = async () => {
    setIsRunning(true);
    setResults([]);
    
    const testResults: ConnectionTestResult[] = [];

    // Test 1: Basic Connection
    try {
      const startTime = Date.now();
      const { data, error } = await supabase
        .from('lats_storage_rooms')
        .select('id')
        .limit(1);
      
      const responseTime = Date.now() - startTime;
      
      testResults.push({
        test: 'Basic Database Connection',
        status: error ? 'error' : 'success',
        message: error ? error.message : 'Connection successful',
        responseTime,
        details: { data, error }
      });
    } catch (error: any) {
      testResults.push({
        test: 'Basic Database Connection',
        status: 'error',
        message: error.message,
        details: { error }
      });
    }

    // Test 2: Authentication
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      testResults.push({
        test: 'Authentication Check',
        status: error ? 'error' : 'success',
        message: error ? error.message : (user ? `Authenticated as ${user.email}` : 'No user authenticated (normal)'),
        details: { user, error }
      });
    } catch (error: any) {
      testResults.push({
        test: 'Authentication Check',
        status: 'error',
        message: error.message,
        details: { error }
      });
    }

    // Test 3: Key Tables Access
    const tables = [
      'lats_storage_rooms',
      'lats_store_shelves',
      'lats_products',
      'lats_shipping_info',
      'lats_purchase_orders'
    ];

    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        testResults.push({
          test: `Table Access: ${table}`,
          status: error ? 'error' : 'success',
          message: error ? error.message : 'Table accessible',
          details: { data, error }
        });
      } catch (error: any) {
        testResults.push({
          test: `Table Access: ${table}`,
          status: 'error',
          message: error.message,
          details: { error }
        });
      }
    }

    // Test 4: RPC Functions
    const functions = [
      'create_draft_products_from_po',
      'move_products_to_inventory',
      'get_shipment_validation_status'
    ];

    for (const func of functions) {
      try {
        const { error } = await supabase.rpc(func, {});
        
        let status: 'success' | 'error' | 'warning' = 'success';
        let message = 'Function exists';
        
        if (error) {
          if (error.message.includes('function') && error.message.includes('does not exist')) {
            status = 'error';
            message = 'Function does not exist';
          } else if (error.message.includes('permission denied')) {
            status = 'warning';
            message = 'Function exists (permission denied for test call)';
          } else {
            status = 'error';
            message = error.message;
          }
        }
        
        testResults.push({
          test: `RPC Function: ${func}`,
          status,
          message,
          details: { error }
        });
      } catch (error: any) {
        testResults.push({
          test: `RPC Function: ${func}`,
          status: 'error',
          message: error.message,
          details: { error }
        });
      }
    }

    // Test 5: Network Connectivity
    try {
      const startTime = Date.now();
      const response = await fetch('https://jxhzveborezjhsmzsgbc.supabase.co/rest/v1/', {
        method: 'GET',
        headers: {
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw',
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
        }
      });
      
      const responseTime = Date.now() - startTime;
      
      testResults.push({
        test: 'Network Connectivity',
        status: response.ok ? 'success' : 'error',
        message: response.ok ? 'Network connection good' : `${response.status} ${response.statusText}`,
        responseTime,
        details: { status: response.status, statusText: response.statusText }
      });
    } catch (error: any) {
      testResults.push({
        test: 'Network Connectivity',
        status: 'error',
        message: error.message,
        details: { error }
      });
    }

    setResults(testResults);
    
    // Determine overall status
    const hasErrors = testResults.some(r => r.status === 'error');
    const hasWarnings = testResults.some(r => r.status === 'warning');
    
    if (hasErrors) {
      setOverallStatus('error');
    } else if (hasWarnings) {
      setOverallStatus('warning');
    } else {
      setOverallStatus('healthy');
    }
    
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle size={16} className="text-green-500" />;
      case 'error': return <XCircle size={16} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-500" />;
      default: return <AlertTriangle size={16} className="text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'text-green-700 bg-green-50 border-green-200';
      case 'error': return 'text-red-700 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const getOverallStatusColor = () => {
    switch (overallStatus) {
      case 'healthy': return 'text-green-700 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'error': return 'text-red-700 bg-red-50 border-red-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database size={24} className="text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Database Connection Test</h2>
                <p className="text-gray-600">Comprehensive test of Supabase database connectivity</p>
              </div>
            </div>
            <button
              onClick={runConnectionTests}
              disabled={isRunning}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <RefreshCw size={16} className={isRunning ? 'animate-spin' : ''} />
              {isRunning ? 'Testing...' : 'Run Tests'}
            </button>
          </div>
        </div>

        {/* Overall Status */}
        {results.length > 0 && (
          <div className="p-6 border-b border-gray-200">
            <div className={`p-4 rounded-lg border ${getOverallStatusColor()}`}>
              <div className="flex items-center gap-3">
                {getStatusIcon(overallStatus)}
                <div>
                  <h3 className="font-semibold">
                    Overall Status: {overallStatus.charAt(0).toUpperCase() + overallStatus.slice(1)}
                  </h3>
                  <p className="text-sm opacity-80">
                    {overallStatus === 'healthy' && 'All tests passed successfully'}
                    {overallStatus === 'warning' && 'Some tests have warnings but system is functional'}
                    {overallStatus === 'error' && 'Some tests failed - check individual results below'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Test Results */}
        <div className="p-6">
          {results.length === 0 && !isRunning && (
            <div className="text-center py-8">
              <Database size={48} className="text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Click "Run Tests" to check database connection</p>
            </div>
          )}

          {isRunning && (
            <div className="text-center py-8">
              <RefreshCw size={48} className="text-blue-500 mx-auto mb-4 animate-spin" />
              <p className="text-gray-600">Running connection tests...</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="space-y-3">
              {results.map((result, index) => (
                <div key={index} className={`p-4 rounded-lg border ${getStatusColor(result.status)}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(result.status)}
                      <div>
                        <h4 className="font-medium">{result.test}</h4>
                        <p className="text-sm opacity-80">{result.message}</p>
                      </div>
                    </div>
                    {result.responseTime && (
                      <div className="flex items-center gap-1 text-sm opacity-70">
                        <Clock size={14} />
                        {result.responseTime}ms
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Configuration Info */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-3">Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Database URL:</span>
              <p className="text-gray-600 font-mono">https://jxhzveborezjhsmzsgbc.supabase.co</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">API Key:</span>
              <p className="text-gray-600 font-mono">eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DatabaseConnectionTest;
