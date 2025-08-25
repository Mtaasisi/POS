import React, { useState } from 'react';
import { BeemCheckoutButton } from '../payments/components/BeemCheckoutButton';
import { OrderData } from '../payments/types';

export default function BeemTestPage() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const testOrderData: OrderData = {
    orderId: `test_order_${Date.now()}`,
    amount: 1000, // 10 TZS
    currency: 'TZS',
    buyerEmail: 'test@example.com',
    buyerName: 'Test Customer',
    buyerPhone: '+255123456789'
  };

  const handleSuccess = (result: any) => {
    setTestResults(prev => [...prev, { type: 'success', data: result, timestamp: new Date() }]);
  };

  const handleError = (error: string) => {
    setTestResults(prev => [...prev, { type: 'error', data: error, timestamp: new Date() }]);
  };

  const handleLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🧪 Beem Africa Integration Test
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Test Configuration */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Test Configuration</h2>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium text-blue-900 mb-2">API Credentials</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p><strong>API Key:</strong> 6d829f20896bd90e</p>
                  <p><strong>Secret Key:</strong> NTg0ZjY5Mzc3MGFkMjU5Y2M2ZjY2NjFlNGEzNGRiZjZlNDQ5ZTlkM2YzNmEyMzE0ZmI3YzFjM2ZhYmMxYjk0Yw==</p>
                </div>
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2">Test Order Data</h3>
                <div className="text-sm text-green-800 space-y-1">
                  <p><strong>Order ID:</strong> {testOrderData.orderId}</p>
                  <p><strong>Amount:</strong> {testOrderData.amount} {testOrderData.currency}</p>
                  <p><strong>Customer:</strong> {testOrderData.buyerName}</p>
                  <p><strong>Email:</strong> {testOrderData.buyerEmail}</p>
                  <p><strong>Phone:</strong> {testOrderData.buyerPhone}</p>
                </div>
              </div>

              <div className="space-y-3">
                <BeemCheckoutButton
                  orderData={testOrderData}
                  onSuccess={handleSuccess}
                  onError={handleError}
                  onLoading={handleLoading}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? '🔄 Processing...' : '💳 Test Beem Africa Payment'}
                </BeemCheckoutButton>

                <button
                  onClick={clearResults}
                  className="w-full px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  🗑️ Clear Results
                </button>
              </div>
            </div>

            {/* Test Results */}
            <div className="space-y-4">
              <h2 className="text-xl font-semibold text-gray-800">Test Results</h2>
              
              {testResults.length === 0 ? (
                <div className="bg-gray-50 p-8 rounded-lg text-center">
                  <p className="text-gray-500">No test results yet. Click the test button to start.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {testResults.map((result, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${
                        result.type === 'success' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${
                          result.type === 'success' ? 'text-green-900' : 'text-red-900'
                        }`}>
                          {result.type === 'success' ? '✅ Success' : '❌ Error'}
                        </span>
                        <span className="text-xs text-gray-500">
                          {result.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      <pre className="text-xs overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mt-8 bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-medium text-yellow-900 mb-2">📋 Test Instructions</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Click the test button to create a Beem Africa checkout session</li>
              <li>• You'll be redirected to Beem Africa's hosted checkout page</li>
              <li>• Complete or cancel the payment to test the flow</li>
              <li>• Check the results section for API responses</li>
              <li>• Monitor the browser console for additional logs</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
