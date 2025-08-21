import React, { useState, useEffect } from 'react';
import { whatsappService } from '../services/whatsappService';
import DebugUtils from '../utils/debugUtils';

export const WhatsAppDebugPanel: React.FC = () => {
  const [status, setStatus] = useState<any>(null);
  const [isVisible, setIsVisible] = useState(false);

  const updateStatus = () => {
    const serviceStatus = whatsappService.getInitializationStatus();
    setStatus(serviceStatus);
  };

  useEffect(() => {
    updateStatus();
    const interval = setInterval(updateStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const resetInitialization = () => {
    whatsappService.resetInitialization();
    updateStatus();
  };

  const debugService = () => {
    DebugUtils.debugWhatsAppService();
  };

  if (!import.meta.env.DEV) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-blue-600 transition-colors"
      >
        🔍 WhatsApp Debug
      </button>
      
      {isVisible && (
        <div className="absolute bottom-full right-0 mb-2 bg-white border border-gray-300 rounded-lg shadow-xl p-4 min-w-80">
          <h3 className="font-bold text-lg mb-3">WhatsApp Service Debug</h3>
          
          {status && (
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Initialized:</span>
                <span className={status.isInitialized ? 'text-green-600' : 'text-red-600'}>
                  {status.isInitialized ? '✅ Yes' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Initializing:</span>
                <span className={status.isInitializing ? 'text-yellow-600' : 'text-gray-600'}>
                  {status.isInitializing ? '⏳ Yes' : 'No'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Instances:</span>
                <span>{status.instanceCount}</span>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <button
              onClick={updateStatus}
              className="w-full bg-gray-500 text-white px-3 py-1 rounded text-sm hover:bg-gray-600"
            >
              Refresh Status
            </button>
            <button
              onClick={resetInitialization}
              className="w-full bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
            >
              Reset Initialization
            </button>
            <button
              onClick={debugService}
              className="w-full bg-purple-500 text-white px-3 py-1 rounded text-sm hover:bg-purple-600"
            >
              Debug Service
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
