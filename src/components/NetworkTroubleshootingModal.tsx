import React, { useState, useEffect } from 'react';
import { X, Wifi, WifiOff, RefreshCw, AlertTriangle, CheckCircle } from 'lucide-react';
import { checkNetworkHealth } from '../utils/networkErrorHandler';
import { checkConnectionHealth } from '../lib/supabaseClient';

interface NetworkTroubleshootingModalProps {
  isOpen: boolean;
  onClose: () => void;
  error?: string;
}

interface NetworkTest {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: string;
}

export function NetworkTroubleshootingModal({ 
  isOpen, 
  onClose, 
  error 
}: NetworkTroubleshootingModalProps) {
  const [tests, setTests] = useState<NetworkTest[]>([
    { name: 'Internet Connection', status: 'pending', message: 'Checking internet connectivity...' },
    { name: 'Supabase Connection', status: 'pending', message: 'Testing database connection...' },
    { name: 'Network Latency', status: 'pending', message: 'Measuring response times...' },
  ]);
  const [isRunning, setIsRunning] = useState(false);
  const [overallStatus, setOverallStatus] = useState<'pending' | 'success' | 'error'>('pending');

  const runTests = async () => {
    setIsRunning(true);
    setOverallStatus('pending');
    
    // Test 1: Internet Connection
    setTests(prev => prev.map(test => 
      test.name === 'Internet Connection' 
        ? { ...test, status: 'running', message: 'Testing internet connectivity...' }
        : test
    ));

    try {
      const networkHealth = await checkNetworkHealth();
      setTests(prev => prev.map(test => 
        test.name === 'Internet Connection' 
          ? { 
              ...test, 
              status: networkHealth.healthy ? 'success' : 'error',
              message: networkHealth.healthy 
                ? `Connected (${networkHealth.latency}ms)` 
                : `Connection failed: ${networkHealth.error}`,
              details: networkHealth.healthy 
                ? `Latency: ${networkHealth.latency}ms` 
                : networkHealth.error
            }
          : test
      ));
    } catch (err) {
      setTests(prev => prev.map(test => 
        test.name === 'Internet Connection' 
          ? { ...test, status: 'error', message: 'Internet connection test failed' }
          : test
      ));
    }

    // Test 2: Supabase Connection
    setTests(prev => prev.map(test => 
      test.name === 'Supabase Connection' 
        ? { ...test, status: 'running', message: 'Testing database connection...' }
        : test
    ));

    try {
      const supabaseHealth = await checkConnectionHealth();
      setTests(prev => prev.map(test => 
        test.name === 'Supabase Connection' 
          ? { 
              ...test, 
              status: supabaseHealth.healthy ? 'success' : 'error',
              message: supabaseHealth.healthy 
                ? `Database connected (${supabaseHealth.responseTime}ms)` 
                : `Database connection failed: ${supabaseHealth.error}`,
              details: supabaseHealth.healthy 
                ? `Response time: ${supabaseHealth.responseTime}ms` 
                : supabaseHealth.error
            }
          : test
      ));
    } catch (err) {
      setTests(prev => prev.map(test => 
        test.name === 'Supabase Connection' 
          ? { ...test, status: 'error', message: 'Database connection test failed' }
          : test
      ));
    }

    // Test 3: Network Latency
    setTests(prev => prev.map(test => 
      test.name === 'Network Latency' 
        ? { ...test, status: 'running', message: 'Measuring response times...' }
        : test
    ));

    try {
      const startTime = Date.now();
      const response = await fetch('https://httpbin.org/get', {
        method: 'GET',
        signal: AbortSignal.timeout(5000)
      });
      const latency = Date.now() - startTime;
      
      setTests(prev => prev.map(test => 
        test.name === 'Network Latency' 
          ? { 
              ...test, 
              status: 'success',
              message: `Good latency: ${latency}ms`,
              details: latency < 500 ? 'Excellent' : latency < 1000 ? 'Good' : 'Slow'
            }
          : test
      ));
    } catch (err) {
      setTests(prev => prev.map(test => 
        test.name === 'Network Latency' 
          ? { ...test, status: 'error', message: 'Latency test failed' }
          : test
      ));
    }

    // Determine overall status
    const allTests = tests.map(test => test.status);
    const hasErrors = allTests.includes('error');
    const allComplete = allTests.every(status => status === 'success' || status === 'error');
    
    if (allComplete) {
      setOverallStatus(hasErrors ? 'error' : 'success');
    }

    setIsRunning(false);
  };

  useEffect(() => {
    if (isOpen) {
      runTests();
    }
  }, [isOpen]);

  const getStatusIcon = (status: NetworkTest['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full bg-gray-300" />;
      case 'running':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: NetworkTest['status']) => {
    switch (status) {
      case 'pending':
        return 'text-gray-500';
      case 'running':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-2">
            <Wifi className="w-5 h-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Network Troubleshooting</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="font-medium text-red-800">Error Detected</h3>
              </div>
              <p className="text-red-700 text-sm mt-1">{error}</p>
            </div>
          )}

          <div className="space-y-3">
            {tests.map((test, index) => (
              <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {getStatusIcon(test.status)}
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-gray-900">{test.name}</h3>
                    <span className={`text-sm ${getStatusColor(test.status)}`}>
                      {test.status === 'running' ? 'Testing...' : 
                       test.status === 'success' ? 'OK' : 
                       test.status === 'error' ? 'Failed' : 'Pending'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{test.message}</p>
                  {test.details && (
                    <p className="text-xs text-gray-500 mt-1">{test.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-800 mb-2">Troubleshooting Tips</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Check your internet connection</li>
              <li>• Try refreshing the page</li>
              <li>• Clear your browser cache</li>
              <li>• Disable browser extensions temporarily</li>
              <li>• Try a different network if possible</li>
            </ul>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={runTests}
              disabled={isRunning}
              className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
            >
              <RefreshCw className={`w-4 h-4 ${isRunning ? 'animate-spin' : ''}`} />
              <span>{isRunning ? 'Running Tests...' : 'Run Tests Again'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}