import React, { useState, useEffect } from 'react';
import { PackageCheck, Plus, X, AlertCircle, CheckCircle } from 'lucide-react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { toast } from 'react-hot-toast';
import { supabase } from '../../../../lib/supabaseClient';

interface PurchaseOrderItem {
  id: string;
  product_id: string;
  variant_id?: string;
  name: string;
  quantity: number;
  receivedQuantity?: number;
  cost_price: number;
}

interface SerialNumberData {
  serial_number: string;
  imei?: string;
  mac_address?: string;
  barcode?: string;
  location?: string;
  notes?: string;
}

interface SerialNumberReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: {
    id: string;
    items: PurchaseOrderItem[];
  };
  onConfirm: (receivedItems: Array<{
    id: string;
    receivedQuantity: number;
    serialNumbers?: SerialNumberData[];
  }>) => Promise<void>;
  isLoading?: boolean;
}

const SerialNumberReceiveModal: React.FC<SerialNumberReceiveModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onConfirm,
  isLoading = false
}) => {
  const [receivedItems, setReceivedItems] = useState<Map<string, {
    quantity: number;
    serialNumbers: SerialNumberData[];
  }>>(new Map());

  // Initialize received items when modal opens
  useEffect(() => {
    if (isOpen) {
      const initialItems = new Map();
      purchaseOrder.items.forEach(item => {
        initialItems.set(item.id, {
          quantity: item.receivedQuantity || 0,
          serialNumbers: []
        });
      });
      setReceivedItems(initialItems);
    }
  }, [isOpen, purchaseOrder.items]);

  const updateReceivedQuantity = (itemId: string, quantity: number) => {
    const maxQuantity = purchaseOrder.items.find(item => item.id === itemId)?.quantity || 0;
    if (quantity < 0 || quantity > maxQuantity) return;

    setReceivedItems(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(itemId) || { quantity: 0, serialNumbers: [] };
      newMap.set(itemId, {
        ...current,
        quantity
      });
      return newMap;
    });
  };

  const addSerialNumber = (itemId: string) => {
    setReceivedItems(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(itemId) || { quantity: 0, serialNumbers: [] };
      newMap.set(itemId, {
        ...current,
        serialNumbers: [...current.serialNumbers, {
          serial_number: '',
          imei: '',
          mac_address: '',
          barcode: '',
          location: '',
          notes: ''
        }]
      });
      return newMap;
    });
  };

  const removeSerialNumber = (itemId: string, index: number) => {
    setReceivedItems(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(itemId) || { quantity: 0, serialNumbers: [] };
      newMap.set(itemId, {
        ...current,
        serialNumbers: current.serialNumbers.filter((_, i) => i !== index)
      });
      return newMap;
    });
  };

  const updateSerialNumber = (itemId: string, index: number, field: keyof SerialNumberData, value: string) => {
    setReceivedItems(prev => {
      const newMap = new Map(prev);
      const current = newMap.get(itemId) || { quantity: 0, serialNumbers: [] };
      const updatedSerialNumbers = [...current.serialNumbers];
      updatedSerialNumbers[index] = {
        ...updatedSerialNumbers[index],
        [field]: value
      };
      newMap.set(itemId, {
        ...current,
        serialNumbers: updatedSerialNumbers
      });
      return newMap;
    });
  };

  const handleConfirm = async () => {
    try {
      // Validate that all serial numbers are provided if quantity > 0
      const itemsToReceive: Array<{
        id: string;
        receivedQuantity: number;
        serialNumbers?: SerialNumberData[];
      }> = [];

      for (const [itemId, data] of receivedItems) {
        if (data.quantity > 0) {
          // Check if serial numbers are provided
          const hasSerialNumbers = data.serialNumbers.length > 0;
          const allSerialNumbersFilled = data.serialNumbers.every(sn => sn.serial_number.trim() !== '');

          if (hasSerialNumbers && !allSerialNumbersFilled) {
            toast.error('Please fill in all serial numbers or remove empty entries');
            return;
          }

          itemsToReceive.push({
            id: itemId,
            receivedQuantity: data.quantity,
            serialNumbers: hasSerialNumbers ? data.serialNumbers : undefined
          });
        }
      }

      if (itemsToReceive.length === 0) {
        toast.error('Please specify quantities for at least one item');
        return;
      }

      await onConfirm(itemsToReceive);
    } catch (error) {
      console.error('Error confirming receive:', error);
      toast.error('Failed to process receive');
    }
  };

  const getTotalReceivedItems = () => {
    let total = 0;
    receivedItems.forEach(data => {
      total += data.quantity;
    });
    return total;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 mb-4 p-6 border-b border-gray-100">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
            <PackageCheck className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Receive Stock with Serial Numbers</h3>
            <p className="text-sm text-gray-600">Optional: Add serial numbers for individual items</p>
          </div>
        </div>
        
        <div className="p-6">
          <div className="mb-4 p-3 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2 text-blue-800">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Total items to receive: {getTotalReceivedItems()}
              </span>
            </div>
          </div>
          
          <div className="space-y-6">
            {purchaseOrder.items.map((item) => {
              const itemData = receivedItems.get(item.id) || { quantity: 0, serialNumbers: [] };
              const maxQuantity = item.quantity;
              const remainingQuantity = maxQuantity - (item.receivedQuantity || 0);
              
              return (
                <GlassCard key={item.id} className="p-4">
                  <div className="space-y-4">
                    {/* Item Header */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">{item.name}</h4>
                        <p className="text-sm text-gray-500">
                          Ordered: {maxQuantity} | 
                          Already received: {item.receivedQuantity || 0} | 
                          Remaining: {remainingQuantity}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">TSH {item.cost_price.toLocaleString()}</p>
                      </div>
                    </div>

                    {/* Quantity Input */}
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-gray-700 min-w-[100px]">
                        Receive Quantity:
                      </label>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateReceivedQuantity(item.id, Math.max(0, itemData.quantity - 1))}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          min="0"
                          max={remainingQuantity}
                          value={itemData.quantity}
                          onChange={(e) => updateReceivedQuantity(item.id, parseInt(e.target.value) || 0)}
                          className="w-20 px-3 py-1 border border-gray-300 rounded text-center"
                        />
                        <button
                          onClick={() => updateReceivedQuantity(item.id, Math.min(remainingQuantity, itemData.quantity + 1))}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Serial Numbers Section */}
                    {itemData.quantity > 0 && (
                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="text-sm font-medium text-gray-700">
                            Serial Numbers (Optional)
                          </h5>
                          <GlassButton
                            variant="secondary"
                            size="sm"
                            icon={<Plus className="w-3 h-3" />}
                            onClick={() => addSerialNumber(item.id)}
                          >
                            Add Serial
                          </GlassButton>
                        </div>

                        {itemData.serialNumbers.length > 0 && (
                          <div className="space-y-3">
                            {itemData.serialNumbers.map((serial, index) => (
                              <div key={index} className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Serial Number *
                                  </label>
                                  <input
                                    type="text"
                                    value={serial.serial_number}
                                    onChange={(e) => updateSerialNumber(item.id, index, 'serial_number', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                    placeholder="Enter serial number"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    IMEI
                                  </label>
                                  <input
                                    type="text"
                                    value={serial.imei}
                                    onChange={(e) => updateSerialNumber(item.id, index, 'imei', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                    placeholder="Enter IMEI"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    MAC Address
                                  </label>
                                  <input
                                    type="text"
                                    value={serial.mac_address}
                                    onChange={(e) => updateSerialNumber(item.id, index, 'mac_address', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                    placeholder="Enter MAC address"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Barcode
                                  </label>
                                  <input
                                    type="text"
                                    value={serial.barcode}
                                    onChange={(e) => updateSerialNumber(item.id, index, 'barcode', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                    placeholder="Enter barcode"
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-1">
                                    Location
                                  </label>
                                  <input
                                    type="text"
                                    value={serial.location}
                                    onChange={(e) => updateSerialNumber(item.id, index, 'location', e.target.value)}
                                    className="w-full px-2 py-1 text-sm border border-gray-300 rounded"
                                    placeholder="Enter location"
                                  />
                                </div>
                                <div className="flex items-end">
                                  <button
                                    onClick={() => removeSerialNumber(item.id, index)}
                                    className="w-full px-2 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded transition-colors"
                                  >
                                    Remove
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}

                        {itemData.serialNumbers.length === 0 && (
                          <div className="text-center py-4 text-gray-500">
                            <PackageCheck className="w-8 h-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No serial numbers added yet</p>
                            <p className="text-xs">Click "Add Serial" to track individual items</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </GlassCard>
              );
            })}
          </div>
          
          <div className="flex gap-3 mt-6 pt-6 border-t">
            <GlassButton
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={handleConfirm}
              disabled={isLoading || getTotalReceivedItems() === 0}
              className="flex-1"
            >
              {isLoading ? 'Processing...' : `Confirm Receive (${getTotalReceivedItems()} items)`}
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SerialNumberReceiveModal;
