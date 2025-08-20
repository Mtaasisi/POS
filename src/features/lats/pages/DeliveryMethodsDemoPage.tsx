import React, { useState } from 'react';
import DeliveryMethodsManager from '../components/pos/DeliveryMethodsManager';

interface DeliveryMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedTime: string;
  isDefault: boolean;
  enabled: boolean;
}

const DeliveryMethodsDemoPage: React.FC = () => {
  const [deliveryMethods, setDeliveryMethods] = useState<DeliveryMethod[]>([
    {
      id: '1',
      name: 'Standard Delivery',
      description: '2-3 business days',
      price: 500,
      estimatedTime: '2-3 days',
      isDefault: true,
      enabled: true
    },
    {
      id: '2',
      name: 'Express Delivery',
      description: '1-2 business days',
      price: 1000,
      estimatedTime: '1-2 days',
      isDefault: false,
      enabled: true
    },
    {
      id: '3',
      name: 'Same Day Delivery',
      description: 'Same day',
      price: 2000,
      estimatedTime: 'Same day',
      isDefault: false,
      enabled: true
    }
  ]);

  const handleMethodsChange = (methods: DeliveryMethod[]) => {
    setDeliveryMethods(methods);
    console.log('Updated delivery methods:', methods);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Delivery Methods Demo
            </h1>
            <p className="text-gray-600">
              This page demonstrates the delivery methods management functionality. 
              You can create, edit, and delete delivery methods, set defaults, and manage their availability.
            </p>
          </div>

          <DeliveryMethodsManager
            methods={deliveryMethods}
            onMethodsChange={handleMethodsChange}
          />

          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              Current Delivery Methods (JSON)
            </h3>
            <pre className="text-sm text-blue-800 bg-blue-100 p-3 rounded overflow-auto">
              {JSON.stringify(deliveryMethods, null, 2)}
            </pre>
          </div>

          <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Features Demonstrated
            </h3>
            <ul className="text-sm text-green-800 space-y-1">
              <li>• Create new delivery methods with custom names, descriptions, and prices</li>
              <li>• Edit existing delivery methods</li>
              <li>• Delete delivery methods (except the default one)</li>
              <li>• Set a delivery method as default</li>
              <li>• Enable/disable delivery methods</li>
              <li>• Visual indicators for default method (blue border and checkmark)</li>
              <li>• Responsive grid layout for method cards</li>
              <li>• Form validation for required fields</li>
              <li>• Toast notifications for user feedback</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeliveryMethodsDemoPage;
