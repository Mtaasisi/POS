import React, { useState } from 'react';
import { GlassCard, GlassButton, GlassBadge } from '../components/ui';
import { useZenoPay } from '../hooks/useZenoPay';
import { CartItem, Sale } from '../types/pos';

const ZenoPayTestPage: React.FC = () => {
  const [customerName, setCustomerName] = useState('John Doe');
  const [customerEmail, setCustomerEmail] = useState('john@example.com');
  const [customerPhone, setCustomerPhone] = useState('0744963858');
  const [amount, setAmount] = useState(1000);
  const [orderId, setOrderId] = useState('');
  const [testResults, setTestResults] = useState<string[]>([]);

  const {
    isLoading,
    error,
    currentOrder,
    createOrder,
    checkOrderStatus,
    processPayment,
    clearError,
    resetOrder
  } = useZenoPay();

  // Sample cart items for testing
  const sampleCartItems: CartItem[] = [
    {
      id: 'item_1',
      productId: 'prod_1',
      variantId: 'var_1',
      productName: 'Test Product 1',
      variantName: 'Standard',
      sku: 'TEST001',
      quantity: 2,
      unitPrice: 500,
      totalPrice: 1000,
      availableQuantity: 10
    }
  ];

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleCreateOrder = async () => {
    addTestResult('Creating payment order...');
    
    const orderData = {
      buyer_email: customerEmail,
      buyer_name: customerName,
      buyer_phone: customerPhone,
      amount: amount,
      metadata: {
        test_mode: true,
        test_page: 'ZenoPayTestPage'
      }
    };

    const order = await createOrder(orderData);
    if (order) {
      setOrderId(order.order_id);
      addTestResult(`✅ Order created: ${order.order_id}`);
    } else {
      addTestResult(`❌ Failed to create order: ${error}`);
    }
  };

  const handleCheckStatus = async () => {
    if (!orderId) {
      addTestResult('❌ No order ID to check');
      return;
    }

    addTestResult(`Checking status for order: ${orderId}`);
    const order = await checkOrderStatus(orderId);
    if (order) {
      addTestResult(`✅ Status: ${order.payment_status}`);
      if (order.reference) {
        addTestResult(`Reference: ${order.reference}`);
      }
    } else {
      addTestResult(`❌ Failed to check status: ${error}`);
    }
  };

  const handleProcessPayment = async () => {
    addTestResult('Processing complete payment flow...');
    
    const customer = {
      id: 'test_customer_1',
      name: customerName,
      email: customerEmail,
      phone: customerPhone
    };

    const sale = await processPayment(sampleCartItems, amount, customer);
    if (sale) {
      addTestResult(`✅ Payment completed! Sale ID: ${sale.saleNumber}`);
      addTestResult(`Total: ${sale.total} TZS`);
    } else {
      addTestResult(`❌ Payment failed: ${error}`);
    }
  };

  const handleClearResults = () => {
    setTestResults([]);
    clearError();
    resetOrder();
    setOrderId('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ZenoPay Integration Test
          </h1>
          <p className="text-gray-600">
            Test the ZenoPay mobile money payment integration
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Test Controls */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">Test Controls</h2>
            
            {/* Customer Information */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Customer Name
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0744963858"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (TZS)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="100"
                />
              </div>
            </div>

            {/* Test Actions */}
            <div className="space-y-3">
              <GlassButton
                onClick={handleCreateOrder}
                disabled={isLoading}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Creating...' : 'Create Payment Order'}
              </GlassButton>
              
              <GlassButton
                onClick={handleCheckStatus}
                disabled={!orderId || isLoading}
                variant="outline"
                className="w-full"
              >
                Check Order Status
              </GlassButton>
              
              <GlassButton
                onClick={handleProcessPayment}
                disabled={isLoading}
                variant="secondary"
                className="w-full"
              >
                Process Complete Payment
              </GlassButton>
              
              <GlassButton
                onClick={handleClearResults}
                variant="ghost"
                className="w-full"
              >
                Clear Results
              </GlassButton>
            </div>
          </GlassCard>

          {/* Test Results */}
          <GlassCard className="p-6">
            <h2 className="text-xl font-semibold mb-4">Test Results</h2>
            
            {/* Current Status */}
            {currentOrder && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <GlassBadge variant="primary" size="sm">
                    Order: {currentOrder.order_id.slice(-8)}
                  </GlassBadge>
                  <GlassBadge 
                    variant={
                      currentOrder.payment_status === 'COMPLETED' ? 'success' :
                      currentOrder.payment_status === 'FAILED' ? 'error' :
                      currentOrder.payment_status === 'CANCELLED' ? 'error' : 'warning'
                    } 
                    size="sm"
                  >
                    {currentOrder.payment_status}
                  </GlassBadge>
                </div>
                <div className="text-sm text-gray-600">
                  Amount: {currentOrder.amount.toLocaleString('en-US', { style: 'currency', currency: 'TZS' })}
                </div>
                {currentOrder.reference && (
                  <div className="text-sm text-gray-600">
                    Reference: {currentOrder.reference}
                  </div>
                )}
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-red-800 text-sm">
                  <strong>Error:</strong> {error}
                </div>
              </div>
            )}

            {/* Test Log */}
            <div className="bg-gray-50 p-3 rounded-lg max-h-64 overflow-y-auto">
              <div className="text-sm font-medium text-gray-700 mb-2">Test Log:</div>
              {testResults.length === 0 ? (
                <div className="text-gray-500 text-sm">No test results yet. Start testing to see results here.</div>
              ) : (
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-xs text-gray-600 font-mono">
                      {result}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </GlassCard>
        </div>

        {/* Instructions */}
        <GlassCard className="p-6">
          <h2 className="text-xl font-semibold mb-4">Testing Instructions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <h3 className="font-medium text-gray-800 mb-2">1. Create Order</h3>
              <ul className="space-y-1">
                <li>• Fill in customer details</li>
                <li>• Set payment amount</li>
                <li>• Click "Create Payment Order"</li>
                <li>• Check the test results</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">2. Check Status</h3>
              <ul className="space-y-1">
                <li>• After creating an order</li>
                <li>• Click "Check Order Status"</li>
                <li>• Monitor payment status</li>
                <li>• Wait for customer payment</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">3. Complete Payment</h3>
              <ul className="space-y-1">
                <li>• Use "Process Complete Payment"</li>
                <li>• Simulates full payment flow</li>
                <li>• Creates sale record</li>
                <li>• Tests webhook integration</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium text-gray-800 mb-2">4. Important Notes</h3>
              <ul className="space-y-1">
                <li>• Use real phone numbers for testing</li>
                <li>• Start with small amounts (100 TZS)</li>
                <li>• Check logs in /logs directory</li>
                <li>• Monitor webhook delivery</li>
              </ul>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default ZenoPayTestPage;

