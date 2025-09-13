import React, { useState } from 'react';
import DebugUtils from '../utils/debugUtils';

interface DebugPanelProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({ 
  isVisible = false, 
  onToggle 
}) => {
  const [isOpen, setIsOpen] = useState(isVisible);

  const togglePanel = () => {
    setIsOpen(!isOpen);
    onToggle?.();
  };

  const resetSessionLogging = () => {
    DebugUtils.resetSessionLogging();
  };

  const clearLogCounts = () => {
    DebugUtils.clearLogCounts();
  };

  const getLogCounts = () => {
    return DebugUtils.getLogCounts();
  };

  if (!import.meta.env.DEV) {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <button
        onClick={togglePanel}
        className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg"
        title="Debug Panel"
      >
        🐛
      </button>

      {/* Debug Panel */}
      {isOpen && (
        <div className="absolute bottom-16 right-0 bg-white border border-gray-300 rounded-lg shadow-xl p-4 w-80">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Debug Panel</h3>
            <button
              onClick={togglePanel}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <div className="space-y-3">
            {/* Log Counts */}
            <div>
              <h4 className="font-medium text-sm text-gray-700 mb-2">Log Counts</h4>
              <div className="bg-gray-100 p-2 rounded text-xs">
                <pre>{JSON.stringify(getLogCounts(), null, 2)}</pre>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              <button
                onClick={resetSessionLogging}
                className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-sm"
              >
                Reset Session Logging
              </button>
              
              <button
                onClick={clearLogCounts}
                className="w-full bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm"
              >
                Clear Log Counts
              </button>
            </div>

            {/* Info */}
            <div className="text-xs text-gray-500">
              <p>• Session logs appear only once per browser session</p>
              <p>• Init logs are throttled to reduce spam</p>
              <p>• Only visible in development mode</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DebugPanel;
