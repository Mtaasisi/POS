import React from 'react';
import { useRequestedSpareParts } from '../hooks/useRequestedSpareParts';
import RequestedSparePartsList from './RequestedSparePartsList';

interface RequestedPartsExampleProps {
  deviceId?: string;
}

const RequestedPartsExample: React.FC<RequestedPartsExampleProps> = ({ deviceId }) => {
  const {
    parts,
    loading,
    error,
    partNames,
    partNamesWithQuantities,
    partNamesWithStatus,
    getTotalQuantity,
    getTotalCost,
    loadParts
  } = useRequestedSpareParts({ 
    deviceId, 
    status: 'all',
    autoLoad: true 
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading requested spare parts...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-medium">Error: {error}</div>
        <button 
          onClick={loadParts}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-blue-600">{parts.length}</div>
          <div className="text-sm text-blue-800">Total Parts</div>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">{getTotalQuantity()}</div>
          <div className="text-sm text-green-800">Total Quantity</div>
        </div>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-purple-600">${getTotalCost().toFixed(2)}</div>
          <div className="text-sm text-purple-800">Total Cost</div>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="text-2xl font-bold text-orange-600">
            {parts.filter(p => p.status === 'needed').length}
          </div>
          <div className="text-sm text-orange-800">Needed</div>
        </div>
      </div>

      {/* Quick Access to Names */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">📝 Quick Access - Spare Part Names</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Just Names */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-700">Part Names Only</h4>
              <button
                onClick={() => copyToClipboard(partNames.join(', '))}
                className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
              >
                Copy
              </button>
            </div>
            <div className="bg-gray-50 p-3 rounded border text-sm font-mono max-h-32 overflow-y-auto">
              {partNames.length > 0 ? partNames.join(', ') : 'No parts found'}
            </div>
          </div>

          {/* Names with Quantities */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-700">Names + Quantities</h4>
              <button
                onClick={() => copyToClipboard(partNamesWithQuantities.join(', '))}
                className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded hover:bg-green-200"
              >
                Copy
              </button>
            </div>
            <div className="bg-gray-50 p-3 rounded border text-sm font-mono max-h-32 overflow-y-auto">
              {partNamesWithQuantities.length > 0 ? partNamesWithQuantities.join(', ') : 'No parts found'}
            </div>
          </div>

          {/* Names with Status */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-gray-700">Names + Status</h4>
              <button
                onClick={() => copyToClipboard(partNamesWithStatus.join(', '))}
                className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200"
              >
                Copy
              </button>
            </div>
            <div className="bg-gray-50 p-3 rounded border text-sm font-mono max-h-32 overflow-y-auto">
              {partNamesWithStatus.length > 0 ? partNamesWithStatus.join(', ') : 'No parts found'}
            </div>
          </div>
        </div>
      </div>

      {/* Detailed List */}
      <RequestedSparePartsList 
        deviceId={deviceId}
        showDeviceInfo={true}
        compact={false}
      />

      {/* Console Information */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-medium text-yellow-800 mb-2">🔍 Console Information</h4>
        <p className="text-yellow-700 text-sm">
          Check your browser console to see the detailed spare part information and names being logged.
          You can also use the copy buttons above to quickly copy the part names for use in other applications.
        </p>
      </div>
    </div>
  );
};

export default RequestedPartsExample;
