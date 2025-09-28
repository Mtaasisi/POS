import React, { useState } from 'react';
import { getSparePartNamesForDevice } from '../services/repairPartsApi';

interface GetSparePartNamesProps {
  deviceId: string;
}

const GetSparePartNames: React.FC<GetSparePartNamesProps> = ({ deviceId }) => {
  const [partNames, setPartNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPartNames = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getSparePartNamesForDevice(deviceId);
      if (result.ok) {
        setPartNames(result.data);
        console.log('📝 Spare part names:', result.data);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to fetch part names');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      alert('Copied to clipboard!');
    });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">📦 Get Spare Part Names</h3>
        <button
          onClick={fetchPartNames}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Fetch Names'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-800 font-medium">Error:</div>
          <div className="text-red-600 text-sm">{error}</div>
        </div>
      )}

      {partNames.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Found {partNames.length} spare part names
            </div>
            <button
              onClick={() => copyToClipboard(partNames.join(', '))}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Copy All
            </button>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border">
            <div className="text-sm font-medium text-gray-700 mb-2">Part Names:</div>
            <div className="space-y-1">
              {partNames.map((name, index) => (
                <div key={index} className="flex items-center justify-between bg-white p-2 rounded border">
                  <span className="text-sm">{name}</span>
                  <button
                    onClick={() => copyToClipboard(name)}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                  >
                    Copy
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
            <div className="text-sm font-medium text-blue-800 mb-2">As Comma-Separated List:</div>
            <div className="bg-white p-2 rounded border text-sm font-mono">
              {partNames.join(', ')}
            </div>
          </div>
        </div>
      )}

      {partNames.length === 0 && !loading && !error && (
        <div className="text-center py-4 text-gray-500">
          Click "Fetch Names" to get the spare part names for this device
        </div>
      )}
    </div>
  );
};

export default GetSparePartNames;
