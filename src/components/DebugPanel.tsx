import React, { useState, useEffect } from 'react';
import DebugUtils from '../utils/debugUtils';
import { Settings, X, Trash2, Eye, EyeOff } from 'lucide-react';

interface DebugPanelProps {
  isVisible: boolean;
  onToggle: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ isVisible, onToggle }) => {
  const [verboseLogging, setVerboseLogging] = useState(false);
  const [logCounts, setLogCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    // Load current verbose logging state
    const isVerbose = localStorage.getItem('verbose_logging') === 'true';
    setVerboseLogging(isVerbose);
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    // Update log counts every 2 seconds when visible
    const interval = setInterval(() => {
      setLogCounts(DebugUtils.getLogCounts());
    }, 2000);

    return () => clearInterval(interval);
  }, [isVisible]);

  const handleVerboseLoggingToggle = () => {
    const newValue = !verboseLogging;
    setVerboseLogging(newValue);
    DebugUtils.setVerboseLogging(newValue);
  };

  const clearLogCounts = () => {
    DebugUtils.clearLogCounts();
    setLogCounts({});
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg p-4 w-80 z-50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5" />
          <h3 className="font-semibold text-sm">Debug Panel</h3>
        </div>
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="space-y-3">
        {/* Verbose Logging Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm">Verbose Logging</span>
          <button
            onClick={handleVerboseLoggingToggle}
            className={`flex items-center gap-2 px-3 py-1 rounded text-xs ${
              verboseLogging
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
            }`}
          >
            {verboseLogging ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {verboseLogging ? 'Enabled' : 'Disabled'}
          </button>
        </div>

        {/* Log Counts */}
        {Object.keys(logCounts).length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Log Counts</span>
              <button
                onClick={clearLogCounts}
                className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            </div>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {Object.entries(logCounts).map(([key, count]) => (
                <div key={key} className="flex justify-between text-xs">
                  <span className="text-gray-600 dark:text-gray-400 truncate">{key}</span>
                  <span className="font-mono">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Development Mode: {import.meta.env.DEV ? '✅ Enabled' : '❌ Disabled'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;
