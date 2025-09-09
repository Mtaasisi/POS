import React, { useState } from 'react';
import GlassCard from './ui/GlassCard';
import GlassButton from './ui/GlassButton';
import { useDynamicDataStore, simulateSale } from '../lib/data/dynamicDataStore';

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
    // Note: Sale simulation removed - use real POS transactions instead
    alert('Sale simulation is no longer available. Use the POS system to create real transactions.');
  };

  const handleSimulateMultipleSales = () => {
    // Note: Sale simulation removed - use real POS transactions instead
    alert('Sale simulation is no longer available. Use the POS system to create real transactions.');
  };

  const handleSimulateLowStock = () => {
    // Note: Low stock simulation removed - use real inventory management instead
    alert('Low stock simulation is no longer available. Use real inventory management to track stock levels.');
  };

  const handleInitializeTestData = () => {
    // Note: Test data initialization removed - use real database data instead
    alert('Test data initialization is no longer available. Use real database data instead.');
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


    </div>
  );
};

export default DynamicDataDemo;
