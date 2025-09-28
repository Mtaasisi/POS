import React, { useState, useEffect } from 'react';
import { 
  Package, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Smartphone, 
  Wifi,
  X,
  Plus
} from 'lucide-react';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../../features/shared/components/ui/GlassButton';
import GlassBadge from '../../../../features/shared/components/ui/GlassBadge';
import SearchBar from '../../../../features/shared/components/ui/SearchBar';
import Modal from '../../../../features/shared/components/ui/Modal';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../../lib/supabaseClient';

interface InventoryItem {
  id: string;
  product_id: string;
  variant_id?: string;
  serial_number: string;
  imei?: string;
  mac_address?: string;
  barcode?: string;
  status: 'available' | 'reserved' | 'sold' | 'damaged' | 'returned' | 'repair' | 'warranty';
  location?: string;
  cost_price?: number;
  selling_price?: number;
  notes?: string;
  created_at: string;
}

interface SerialNumberSelectorProps {
  productId: string;
  productName: string;
  variantId?: string;
  quantity: number;
  isOpen: boolean;
  onClose: () => void;
  onItemsSelected: (selectedItems: InventoryItem[]) => void;
}

const SerialNumberSelector: React.FC<SerialNumberSelectorProps> = ({
  productId,
  productName,
  variantId,
  quantity,
  isOpen,
  onClose,
  onItemsSelected
}) => {
  const [availableItems, setAvailableItems] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen && productId) {
      loadAvailableItems();
    }
  }, [isOpen, productId, variantId]);

  const loadAvailableItems = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('inventory_items')
        .select('*')
        .eq('product_id', productId)
        .eq('status', 'available');

      if (variantId) {
        query = query.eq('variant_id', variantId);
      }

      const { data, error } = await query.order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading available items:', error);
        toast.error('Failed to load available items');
        return;
      }

      setAvailableItems(data || []);
    } catch (error) {
      console.error('Error loading available items:', error);
      toast.error('Failed to load available items');
    } finally {
      setLoading(false);
    }
  };

  const handleItemSelect = (item: InventoryItem) => {
    if (selectedItems.length >= quantity) {
      toast.error(`You can only select ${quantity} item(s)`);
      return;
    }

    if (selectedItems.find(selected => selected.id === item.id)) {
      toast.error('This item is already selected');
      return;
    }

    setSelectedItems(prev => [...prev, item]);
  };

  const handleItemDeselect = (itemId: string) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleConfirmSelection = () => {
    if (selectedItems.length !== quantity) {
      toast.error(`Please select exactly ${quantity} item(s)`);
      return;
    }

    onItemsSelected(selectedItems);
    onClose();
  };

  const filteredItems = availableItems.filter(item => {
    const matchesSearch = item.serial_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.mac_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.barcode?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const isNotSelected = !selectedItems.find(selected => selected.id === item.id);
    
    return matchesSearch && isNotSelected;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800';
      case 'reserved':
        return 'bg-yellow-100 text-yellow-800';
      case 'sold':
        return 'bg-blue-100 text-blue-800';
      case 'damaged':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-orange-100 text-orange-800';
      case 'repair':
        return 'bg-purple-100 text-purple-800';
      case 'warranty':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Select Serial Numbers</h2>
            <p className="text-gray-600">{productName} - Select {quantity} item(s)</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Selection Summary */}
        {selectedItems.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Selected Items ({selectedItems.length}/{quantity})
            </h3>
            <div className="space-y-2">
              {selectedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium text-gray-900">{item.serial_number}</p>
                      {item.imei && (
                        <p className="text-sm text-gray-600">IMEI: {item.imei}</p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleItemDeselect(item.id)}
                    className="p-1 hover:bg-red-100 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-red-600" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="mb-6">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by serial number, IMEI, MAC address, or barcode..."
          />
        </div>

        {/* Available Items */}
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading available items...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No available items found</p>
              <p className="text-sm text-gray-500 mt-1">
                {availableItems.length === 0 
                  ? 'No serialized items available for this product'
                  : 'No items match your search criteria'
                }
              </p>
            </div>
          ) : (
            filteredItems.map((item) => (
              <GlassCard key={item.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <Package className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{item.serial_number}</h3>
                        <GlassBadge className={`${getStatusColor(item.status)} text-xs`}>
                          {item.status}
                        </GlassBadge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {item.imei && (
                          <p className="flex items-center gap-1">
                            <Smartphone className="w-3 h-3" />
                            IMEI: {item.imei}
                          </p>
                        )}
                        {item.mac_address && (
                          <p className="flex items-center gap-1">
                            <Wifi className="w-3 h-3" />
                            MAC: {item.mac_address}
                          </p>
                        )}
                        {item.location && (
                          <p>Location: {item.location}</p>
                        )}
                        {item.selling_price && (
                          <p>Price: TSH {item.selling_price.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  </div>
                  <GlassButton
                    variant="primary"
                    size="sm"
                    icon={<Plus className="w-4 h-4" />}
                    onClick={() => handleItemSelect(item)}
                    disabled={selectedItems.length >= quantity}
                  >
                    Select
                  </GlassButton>
                </div>
              </GlassCard>
            ))
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
          <GlassButton
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </GlassButton>
          <GlassButton
            variant="primary"
            onClick={handleConfirmSelection}
            disabled={selectedItems.length !== quantity}
          >
            Confirm Selection ({selectedItems.length}/{quantity})
          </GlassButton>
        </div>
      </div>
    </Modal>
  );
};

export default SerialNumberSelector;
