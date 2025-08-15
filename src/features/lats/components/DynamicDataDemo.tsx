import React, { useState } from 'react';
import GlassCard from './ui/GlassCard';
import GlassButton from './ui/GlassButton';
import { useDynamicDataStore, simulateSale, initializeTestData } from '../lib/data/dynamicDataStore';

const DynamicDataDemo: React.FC = () => {
  const [isUpdating, setIsUpdating] = useState(false);
  
  const { 
    sales, 
    customers, 
    products, 
    payments, 
    getTotalRevenue, 
    getTotalSales, 
    getTotalCustomers,
    getDailySales,
    getPaymentMethods
  } = useDynamicDataStore();

  const handleSimulateSale = () => {
    setIsUpdating(true);
    // Simulate a sale for the first customer with the first product
    if (customers.length > 0 && products.length > 0) {
      simulateSale(customers[0].id, [{ productId: products[0].id, quantity: 1 }]);
      setTimeout(() => {
        setIsUpdating(false);
        alert('Sale simulated! Check all LATS pages to see the updates.');
      }, 500);
    }
  };

  const handleSimulateMultipleSales = () => {
    // Simulate multiple sales to test the system
    if (customers.length > 0 && products.length > 0) {
      // Sale 1: iPhone to Mike
      simulateSale(customers[0].id, [{ productId: products[0].id, quantity: 1 }]);
      
      // Sale 2: MacBook to David
      if (customers.length > 1 && products.length > 2) {
        setTimeout(() => {
          simulateSale(customers[1].id, [{ productId: products[2].id, quantity: 1 }]);
        }, 1000);
      }
      
      // Sale 3: AirPods to John
      if (customers.length > 2 && products.length > 3) {
        setTimeout(() => {
          simulateSale(customers[2].id, [{ productId: products[3].id, quantity: 2 }]);
        }, 2000);
      }
      
      alert('Multiple sales simulated! Check all LATS pages to see the updates.');
    }
  };

  const handleSimulateLowStock = () => {
    // Simulate sales to create low stock situations
    if (customers.length > 0 && products.length > 0) {
      // Buy all remaining iPhone stock
      const iphone = products.find(p => p.name.includes('iPhone'));
      if (iphone && iphone.currentStock > 0) {
        simulateSale(customers[0].id, [{ productId: iphone.id, quantity: iphone.currentStock }]);
        alert('Low stock situation created! Check Inventory page for alerts.');
      }
    }
  };

  const handleInitializeTestData = () => {
    setIsUpdating(true);
    initializeTestData();
    setTimeout(() => {
      setIsUpdating(false);
      alert('Test data initialized! Check all LATS pages for comprehensive data.');
    }, 1000);
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS'
    }).format(amount);
  };

  return (
    <div className="p-6 bg-gradient-to-br from-green-50 to-blue-100 rounded-lg border-2 border-green-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">🔄 Dynamic Data Demo</h3>
        {isUpdating && (
          <div className="flex items-center space-x-2 text-blue-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm">Updating...</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <GlassCard className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{getTotalSales()}</div>
            <div className="text-sm text-gray-600">Total Sales</div>
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{formatMoney(getTotalRevenue())}</div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{getTotalCustomers()}</div>
            <div className="text-sm text-gray-600">Total Customers</div>
          </div>
        </GlassCard>
        
        <GlassCard className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">{products.length}</div>
            <div className="text-sm text-gray-600">Total Products</div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <GlassCard className="p-4">
          <h4 className="font-medium text-gray-800 mb-3">Recent Sales</h4>
          <div className="space-y-2">
            {sales.slice(-3).map((sale) => (
              <div key={sale.id} className="flex justify-between text-sm">
                <span className="text-gray-600">{sale.customerName}</span>
                <span className="font-medium">{formatMoney(sale.total)}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <h4 className="font-medium text-gray-800 mb-3">Payment Methods</h4>
          <div className="space-y-2">
            {getPaymentMethods().map((method) => (
              <div key={method.method} className="flex justify-between text-sm">
                <span className="text-gray-600">{method.method}</span>
                <span className="font-medium">{formatMoney(method.total)}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      <div className="text-center space-y-4">
        <div className="flex flex-wrap justify-center gap-3">
          <GlassButton
            variant="primary"
            onClick={handleSimulateSale}
          >
            🛒 Single Sale
          </GlassButton>
          
          <GlassButton
            variant="secondary"
            onClick={handleSimulateMultipleSales}
          >
            📈 Multiple Sales
          </GlassButton>
          
          <GlassButton
            variant="secondary"
            onClick={handleSimulateLowStock}
          >
            ⚠️ Low Stock Test
          </GlassButton>
          
          <GlassButton
            variant="secondary"
            onClick={handleInitializeTestData}
          >
            📊 Load Test Data
          </GlassButton>
        </div>
        
        <div className="text-sm text-gray-600">
          <p>💡 <strong>Testing Options:</strong></p>
          <p>• <strong>Load Test Data:</strong> Initialize comprehensive historical data</p>
          <p>• <strong>Single Sale:</strong> Create one test transaction</p>
          <p>• <strong>Multiple Sales:</strong> Create multiple transactions with delays</p>
          <p>• <strong>Low Stock Test:</strong> Create inventory alerts</p>
          <p>• Navigate to any LATS page to see real-time updates</p>
          <p>• All data is synchronized across the entire system</p>
        </div>
      </div>
    </div>
  );
};

export default DynamicDataDemo;
