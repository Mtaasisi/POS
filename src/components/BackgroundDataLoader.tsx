import React, { useState, useEffect } from 'react';
import { useInventoryStore } from '../features/lats/stores/useInventoryStore';
import { useCustomers } from '../context/CustomersContext';
import { Package, CheckCircle, Users, Smartphone, Settings } from 'lucide-react';
import { useCyclingLoadingMessage } from '../hooks/useCyclingLoadingMessage';

const BackgroundDataLoader: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const { products, categories, suppliers, isLoading: storeLoading } = useInventoryStore();
  const { customers } = useCustomers();
  
  // Cycling loading messages
  const { currentMessage } = useCyclingLoadingMessage({
    enabled: isLoading,
    interval: 2500
  });

  // Track loading states for different data types
  const [dataStates, setDataStates] = useState({
    inventory: false,
    customers: false,
    devices: false,
    settings: false
  });

  useEffect(() => {
    // Check if data is being loaded
    if (storeLoading) {
      setIsLoading(true);
      setIsComplete(false);
      setProgress(0);
    } else if ((products?.length > 0) || (categories?.length > 0) || (suppliers?.length > 0) || (customers?.length > 0)) {
      // Data has been loaded
      setIsLoading(false);
      setIsComplete(true);
      setProgress(100);
      
      // Hide the indicator after 3 seconds
      setTimeout(() => {
        setIsComplete(false);
      }, 3000);
    }
  }, [storeLoading, products?.length, categories?.length, suppliers?.length, customers?.length]);

  // Calculate progress based on loaded data
  useEffect(() => {
    if (isLoading) {
      const totalItems = 6; // products, categories, suppliers, customers, devices, settings
      const loadedItems = [
        products?.length > 0,
        categories?.length > 0,
        suppliers?.length > 0,
        customers?.length > 0,
        dataStates.devices,
        dataStates.settings
      ].filter(Boolean).length;
      
      setProgress((loadedItems / totalItems) * 100);
    }
  }, [isLoading, products?.length, categories?.length, suppliers?.length, customers?.length, dataStates]);

  if (!isLoading && !isComplete) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-white/90 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-center space-x-3">
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${currentMessage.color || 'text-gray-700'}`}>
                  {currentMessage.icon} {currentMessage.text}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <Package className="h-3 w-3 text-blue-500" />
                  <Users className="h-3 w-3 text-green-500" />
                  <Smartphone className="h-3 w-3 text-purple-500" />
                  <Settings className="h-3 w-3 text-orange-500" />
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                  <div 
                    className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>
              </div>
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium text-gray-700">Data loaded!</p>
                <p className="text-xs text-gray-500">
                  {products?.length || 0} products • {categories?.length || 0} categories • {suppliers?.length || 0} suppliers • {customers?.length || 0} customers
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackgroundDataLoader;
