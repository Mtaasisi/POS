import React from 'react';
import { PackageCheck } from 'lucide-react';

interface SerialNumberReceiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: {
    id: string;
    items: any[];
  };
  onConfirm: (receivedItems: any[]) => Promise<void>;
  isLoading?: boolean;
}

const SerialNumberReceiveModal: React.FC<SerialNumberReceiveModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onConfirm,
  isLoading = false
}) => {
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
              <span className="text-sm font-medium">
                Total items to receive: {purchaseOrder.items.length}
              </span>
            </div>
          </div>
          
          <div className="space-y-6">
            {purchaseOrder.items.map((item) => (
              <div key={item.id} className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{item.name}</h4>
                  <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                </div>
                <div className="text-sm text-gray-600">
                  Cost: ${item.cost_price}
                </div>
              </div>
            ))}
          </div>
          
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => onConfirm([])}
              disabled={isLoading}
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
