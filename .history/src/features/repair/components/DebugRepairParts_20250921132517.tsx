import React, { useState, useEffect } from 'react';
import { getRepairParts } from '../services/repairPartsApi';

interface DebugRepairPartsProps {
  deviceId: string;
}

const DebugRepairParts: React.FC<DebugRepairPartsProps> = ({ deviceId }) => {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchDebugData = async () => {
    setLoading(true);
    try {
      console.log('🔍 [DEBUG] Starting debug fetch for device:', deviceId);
      const result = await getRepairParts(deviceId);
      console.log('🔍 [DEBUG] Debug result:', result);
      setDebugData(result);
    } catch (error) {
      console.error('🔍 [DEBUG] Debug error:', error);
      setDebugData({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (deviceId) {
      fetchDebugData();
    }
  }, [deviceId]);

  if (loading) {
    return (
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <div className="text-blue-800 font-medium">🔍 Debugging repair parts...</div>
        <div className="text-blue-600 text-sm">Check console for detailed logs</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-yellow-800 font-medium">🔍 Debug: Repair Parts Data</h3>
        <button
          onClick={fetchDebugData}
          className="px-3 py-1 bg-yellow-600 text-white rounded text-sm hover:bg-yellow-700"
        >
          Refresh Debug
        </button>
      </div>
      
      <div className="text-sm text-yellow-700 space-y-2">
        <div><strong>Device ID:</strong> {deviceId}</div>
        <div><strong>API Response OK:</strong> {debugData?.ok ? '✅ Yes' : '❌ No'}</div>
        <div><strong>Parts Count:</strong> {debugData?.data?.length || 0}</div>
        <div><strong>Message:</strong> {debugData?.message || 'No message'}</div>
        
        {debugData?.data && debugData.data.length > 0 && (
          <div className="mt-3">
            <div className="font-medium mb-2">Parts Details:</div>
            {debugData.data.map((part: any, index: number) => (
              <div key={part.id} className="bg-white p-2 rounded border mb-2">
                <div><strong>Part {index + 1}:</strong></div>
                <div className="ml-2 text-xs">
                  <div>ID: {part.id}</div>
                  <div>Spare Part ID: {part.spare_part_id}</div>
                  <div>Has Spare Part Data: {part.spare_part ? '✅ Yes' : '❌ No'}</div>
                  {part.spare_part && (
                    <>
                      <div>Name: {part.spare_part.name || 'NULL'}</div>
                      <div>Part Number: {part.spare_part.part_number || 'NULL'}</div>
                      <div>Brand: {part.spare_part.brand || 'NULL'}</div>
                    </>
                  )}
                  <div>Status: {part.status}</div>
                  <div>Quantity Needed: {part.quantity_needed}</div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {debugData?.error && (
          <div className="mt-3 p-2 bg-red-100 border border-red-200 rounded">
            <div className="text-red-800 font-medium">Error:</div>
            <div className="text-red-600 text-xs">{debugData.error}</div>
          </div>
        )}
      </div>
      
      <div className="mt-3 text-xs text-yellow-600">
        💡 Check browser console for detailed debugging information
      </div>
    </div>
  );
};

export default DebugRepairParts;
