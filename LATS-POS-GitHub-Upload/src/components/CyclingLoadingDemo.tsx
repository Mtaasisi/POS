import React, { useState } from 'react';
import { useCyclingLoadingMessage } from '../hooks/useCyclingLoadingMessage';
import { Play, Pause, RotateCcw } from 'lucide-react';

const CyclingLoadingDemo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);
  
  const { currentMessage, currentIndex, totalMessages, reset } = useCyclingLoadingMessage({
    enabled: isLoading,
    interval: 1500
  });

  const handleToggle = () => {
    if (isLoading) {
      setIsLoading(false);
    } else {
      setIsLoading(true);
      reset();
    }
  };

  const handleReset = () => {
    reset();
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-md mx-auto">
      <h2 className="text-xl font-bold mb-4 text-gray-800">Cycling Loading Messages Demo</h2>
      
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-3">
          {isLoading ? (
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          ) : (
            <div className="h-6 w-6 rounded-full bg-gray-300"></div>
          )}
          <div className="flex-1">
            <p className={`text-lg font-medium ${currentMessage.color || 'text-gray-700'}`}>
              {currentMessage.icon} {currentMessage.text}
            </p>
            <p className="text-sm text-gray-500">
              Message {currentIndex + 1} of {totalMessages}
            </p>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={handleToggle}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            isLoading 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-green-500 hover:bg-green-600 text-white'
          }`}
        >
          {isLoading ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          <span>{isLoading ? 'Stop' : 'Start'}</span>
        </button>
        
        <button
          onClick={handleReset}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Reset</span>
        </button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">Available Messages:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>📊 Loading data...</li>
          <li>📦 Fetching inventory...</li>
          <li>🔄 Syncing products...</li>
          <li>📁 Updating categories...</li>
          <li>👥 Loading customers...</li>
          <li>📈 Preparing analytics...</li>
          <li>📋 Checking stock levels...</li>
          <li>🔗 Connecting to database...</li>
          <li>⚡ Optimizing performance...</li>
          <li>🎯 Almost ready...</li>
        </ul>
      </div>
    </div>
  );
};

export default CyclingLoadingDemo;
