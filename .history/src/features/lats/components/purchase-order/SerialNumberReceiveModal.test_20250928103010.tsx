import React from 'react';

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
            <div className="w-5 h-5 text-orange-600">📦</div>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Receive Stock with Serial Numbers</h3>
            <p className="text-sm text-gray-600">Test modal</p>
          </div>
        </div>
        
        <div className="p-6">
          <div className="flex gap-3 mt-6">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SerialNumberReceiveModal;
