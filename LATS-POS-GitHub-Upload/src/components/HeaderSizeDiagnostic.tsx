import React, { useState, useEffect } from 'react';
import { LocalStorageCleaner, LocalStorageItem } from '../utils/localStorageCleaner';

interface HeaderSizeDiagnosticProps {
  onClose?: () => void;
}

const HeaderSizeDiagnostic: React.FC<HeaderSizeDiagnosticProps> = ({ onClose }) => {
  const [localStorageItems, setLocalStorageItems] = useState<LocalStorageItem[]>([]);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [issues, setIssues] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [cleanupResult, setCleanupResult] = useState<any>(null);

  useEffect(() => {
    analyzeLocalStorage();
  }, []);

  const analyzeLocalStorage = () => {
    setIsLoading(true);
    
    try {
      const items = LocalStorageCleaner.scanLargeItems();
      const stats = LocalStorageCleaner.getUsageStats();
      const headerIssues = LocalStorageCleaner.checkForHeaderSizeIssues();
      
      setLocalStorageItems(items);
      setUsageStats(stats);
      setIssues(headerIssues);
    } catch (error) {
      console.error('Error analyzing localStorage:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCleanup = () => {
    const result = LocalStorageCleaner.cleanupLargeItems();
    setCleanupResult(result);
    analyzeLocalStorage(); // Refresh analysis
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const kilobyte = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(kilobyte));
    return parseFloat((bytes / Math.pow(kilobyte, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p>Analyzing localStorage...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">HTTP 431 Header Size Diagnostic</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {/* Usage Statistics */}
        {usageStats && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">LocalStorage Usage Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Items:</span>
                <div className="font-medium">{usageStats.totalItems}</div>
              </div>
              <div>
                <span className="text-gray-600">Total Size:</span>
                <div className="font-medium">{formatBytes(usageStats.totalSize)}</div>
              </div>
              <div>
                <span className="text-gray-600">Large Items:</span>
                <div className="font-medium">{usageStats.largeItems}</div>
              </div>
              <div>
                <span className="text-gray-600">Largest Item:</span>
                <div className="font-medium">
                  {usageStats.largestItem ? formatBytes(usageStats.largestItem.size) : 'None'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Issues */}
        {issues && issues.hasIssues && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <h3 className="font-semibold text-red-800 mb-2">⚠️ Potential Issues Detected</h3>
            <ul className="text-sm text-red-700 space-y-1">
              {issues.issues.map((issue: string, index: number) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
            {issues.recommendations.length > 0 && (
              <div className="mt-3">
                <h4 className="font-medium text-red-800 mb-1">Recommendations:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  {issues.recommendations.map((rec: string, index: number) => (
                    <li key={index}>• {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Cleanup Results */}
        {cleanupResult && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">🧹 Cleanup Results</h3>
            {cleanupResult.removed.length > 0 && (
              <div className="mb-2">
                <span className="text-sm text-green-700">Removed items:</span>
                <ul className="text-sm text-green-700 ml-4">
                  {cleanupResult.removed.map((item: string, index: number) => (
                    <li key={index}>• {item}</li>
                  ))}
                </ul>
              </div>
            )}
            {cleanupResult.errors.length > 0 && (
              <div>
                <span className="text-sm text-red-700">Errors:</span>
                <ul className="text-sm text-red-700 ml-4">
                  {cleanupResult.errors.map((error: string, index: number) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* LocalStorage Items */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-3">
            <h3 className="font-semibold">LocalStorage Items</h3>
            <button
              onClick={handleCleanup}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
            >
              Cleanup Large Items
            </button>
          </div>
          
          <div className="max-h-64 overflow-y-auto border rounded">
            {localStorageItems.length === 0 ? (
              <div className="p-4 text-center text-gray-500">No localStorage items found</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Key</th>
                    <th className="text-left p-2">Size</th>
                    <th className="text-left p-2">Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {localStorageItems.map((item, index) => (
                    <tr key={index} className={`border-t ${item.isLarge ? 'bg-red-50' : ''}`}>
                      <td className="p-2 font-mono text-xs">{item.key}</td>
                      <td className="p-2">
                        <span className={item.isLarge ? 'text-red-600 font-medium' : ''}>
                          {formatBytes(item.size)}
                        </span>
                      </td>
                      <td className="p-2 text-xs text-gray-600 max-w-xs truncate">
                        {item.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={analyzeLocalStorage}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Analysis
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default HeaderSizeDiagnostic;
