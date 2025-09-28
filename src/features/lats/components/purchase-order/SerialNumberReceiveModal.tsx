import React, { useState, useEffect } from 'react';
import { PackageCheck, Plus, X, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
      const receivedItemsArray: Array<{
        id: string;
        receivedQuantity: number;
        serialNumbers?: SerialNumberData[];
      }> = [];

      // Convert Map to Array
      receivedItems.forEach((data, itemId) => {
        if (data.quantity > 0) {
          receivedItemsArray.push({
            id: itemId,
            receivedQuantity: data.quantity,
            serialNumbers: data.serialNumbers.length > 0 ? data.serialNumbers : undefined
          });
        }
      });

      await onConfirm(receivedItemsArray);
      onClose();
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
              
              return (
                <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-gray-900">{item.name}</h4>
                      <p className="text-sm text-gray-600">Cost: ${item.cost_price}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateReceivedQuantity(item.id, Math.max(0, itemData.quantity - 1))}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        -
                      </button>
                      <span className="w-12 text-center">{itemData.quantity}</span>
                      <button
                        onClick={() => updateReceivedQuantity(item.id, Math.min(item.quantity, itemData.quantity + 1))}
                        className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-lg hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  
                  {itemData.quantity > 0 && (
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">Serial Numbers</span>
                        <button
                          onClick={() => addSerialNumber(item.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          <Plus className="w-3 h-3" />
                          Add
                        </button>
                      </div>
                      
                      {itemData.serialNumbers.map((serial, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <input
                            type="text"
                            placeholder="Serial Number"
                            value={serial.serial_number}
                            onChange={(e) => updateSerialNumber(item.id, index, 'serial_number', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                          <button
                            onClick={() => removeSerialNumber(item.id, index)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleConfirm}
              disabled={isLoading || getTotalReceivedItems() === 0}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Processing...' : 'Confirm Receive'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SerialNumberReceiveModal;
