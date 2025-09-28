import { useState, useEffect } from 'react';
import { 
  getRequestedSparePartsNames, 
  getSparePartsByStatus 
} from '../services/repairPartsApi';

interface UseRequestedSparePartsOptions {
  deviceId?: string;
  status?: 'all' | 'needed' | 'ordered' | 'received' | 'used';
  autoLoad?: boolean;
}

interface RequestedSparePart {
  id: string;
  name: string;
  part_number: string;
  quantity_needed: number;
  quantity_used?: number;
  status: string;
  total_cost?: number;
  device_id?: string;
  device_info?: {
    brand: string;
    model: string;
    serialNumber: string;
  };
  spare_part_info?: {
    brand?: string;
    category?: string;
    location?: string;
    stock_quantity: number;
  };
}

export const useRequestedSpareParts = (options: UseRequestedSparePartsOptions = {}) => {
  const { deviceId, status = 'all', autoLoad = true } = options;
  
  const [parts, setParts] = useState<RequestedSparePart[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadParts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      let result;
      
      if (status === 'all') {
        result = await getRequestedSparePartsNames(deviceId);
      } else {
        result = await getSparePartsByStatus(status, deviceId);
      }
      
      if (result.ok && result.data) {
        setParts(result.data);
        console.log('📦 Requested spare parts loaded:', result.data);
        
        // Log just the names for easy access
        const partNames = result.data.map(part => part.name);
        console.log('📝 Spare part names:', partNames);
        
        return result.data;
      } else {
        setError(result.message || 'Failed to load requested parts');
        return [];
      }
    } catch (err) {
      console.error('Error loading requested parts:', err);
      setError('Failed to load requested parts');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getPartNames = (): string[] => {
    return parts.map(part => part.name);
  };

  const getPartNamesWithQuantities = (): string[] => {
    return parts.map(part => `${part.name} (Qty: ${part.quantity_needed})`);
  };

  const getPartNamesWithStatus = (): string[] => {
    return parts.map(part => `${part.name} - ${part.status.toUpperCase()}`);
  };

  const getPartsByStatus = (statusFilter: string): RequestedSparePart[] => {
    return parts.filter(part => part.status === statusFilter);
  };

  const getTotalQuantity = (): number => {
    return parts.reduce((total, part) => total + part.quantity_needed, 0);
  };

  const getTotalCost = (): number => {
    return parts.reduce((total, part) => total + (part.total_cost || 0), 0);
  };

  const searchParts = (searchTerm: string): RequestedSparePart[] => {
    const term = searchTerm.toLowerCase();
    return parts.filter(part => 
      part.name.toLowerCase().includes(term) ||
      part.part_number.toLowerCase().includes(term) ||
      part.device_info?.brand.toLowerCase().includes(term) ||
      part.device_info?.model.toLowerCase().includes(term)
    );
  };

  useEffect(() => {
    if (autoLoad) {
      loadParts();
    }
  }, [deviceId, status, autoLoad]);

  return {
    parts,
    loading,
    error,
    loadParts,
    getPartNames,
    getPartNamesWithQuantities,
    getPartNamesWithStatus,
    getPartsByStatus,
    getTotalQuantity,
    getTotalCost,
    searchParts,
    // Quick access to just the names
    partNames: getPartNames(),
    partNamesWithQuantities: getPartNamesWithQuantities(),
    partNamesWithStatus: getPartNamesWithStatus()
  };
};

export default useRequestedSpareParts;
