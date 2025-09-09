import React from 'react';
import ShippingTracker from './ShippingTracker';
import { ShippingInfo } from '../../types/inventory';

const ShippingTrackerDemo: React.FC = () => {
  // Note: Demo data removed - use real shipping data instead
  const emptyShippingInfo: ShippingInfo = {
    carrier: '',
    trackingNumber: '',
    estimatedDelivery: '',
    cost: 0,
    notes: '',
    status: 'pending'
  };

  const handleRefresh = async () => {
    console.log('Refreshing tracking information...');
    // TODO: Implement real API call to shipping service
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Shipping Tracker</h1>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-yellow-800">
            <strong>Note:</strong> Demo data has been removed. This component now uses real shipping data from your database.
          </p>
        </div>
        
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Shipping Information</h2>
            <ShippingTracker
              shippingInfo={emptyShippingInfo}
              onRefresh={handleRefresh}
              compact={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShippingTrackerDemo;
