import React, { useState, useEffect } from 'react';
import { getRepairParts, getRepairPartImages } from '../services/repairPartsApi';
import SparePartDetailsCard from './SparePartDetailsCard';

interface SparePartInfoExampleProps {
  deviceId: string;
}

const SparePartInfoExample: React.FC<SparePartInfoExampleProps> = ({ deviceId }) => {
  const [repairParts, setRepairParts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadRepairParts();
  }, [deviceId]);

  const loadRepairParts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await getRepairParts(deviceId);
      if (result.ok && result.data) {
        setRepairParts(result.data);
        console.log('✅ Enhanced spare part information loaded:', result.data);
        
        // Log detailed information for each part
        result.data.forEach((part, index) => {
          console.log(`📦 Part ${index + 1}:`, {
            name: part.spare_part?.name,
            partNumber: part.spare_part?.part_number,
            brand: part.spare_part?.brand,
            category: part.spare_part?.category?.name,
            condition: part.spare_part?.condition,
            location: part.spare_part?.location,
            stock: part.spare_part?.quantity,
            minStock: part.spare_part?.min_quantity,
            costPrice: part.spare_part?.cost_price,
            sellingPrice: part.spare_part?.selling_price,
            supplier: part.spare_part?.supplier?.name,
            variants: part.spare_part?.variants?.length || 0,
            hasImages: part.spare_part?.images?.length > 0,
            description: part.spare_part?.description
          });
        });
      } else {
        setError(result.message || 'Failed to load repair parts');
      }
    } catch (err) {
      console.error('Error loading repair parts:', err);
      setError('Failed to load repair parts');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading spare part information...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800 font-medium">Error loading spare parts</div>
        <div className="text-red-600 text-sm mt-1">{error}</div>
        <button 
          onClick={loadRepairParts}
          className="mt-2 px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (repairParts.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500">No repair parts found for this device</div>
        <button 
          onClick={loadRepairParts}
          className="mt-2 px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          📦 Enhanced Spare Part Information
        </h3>
        <p className="text-blue-700 text-sm">
          Now fetching comprehensive spare part details including:
        </p>
        <ul className="text-blue-700 text-sm mt-2 list-disc list-inside">
          <li>Part name, number, brand, and description</li>
          <li>Category, condition, and location</li>
          <li>Stock levels and pricing information</li>
          <li>Supplier contact details</li>
          <li>Product images and variants</li>
          <li>Usage history and metadata</li>
        </ul>
      </div>

      {repairParts.map((part) => (
        <SparePartDetailsCard
          key={part.id}
          repairPart={part}
          showImages={true}
          showVariants={true}
          compact={false}
        />
      ))}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">🔍 Console Logs</h4>
        <p className="text-gray-600 text-sm">
          Check your browser console to see the detailed spare part information being fetched.
          Each part now includes comprehensive data for better repair management.
        </p>
      </div>
    </div>
  );
};

export default SparePartInfoExample;
