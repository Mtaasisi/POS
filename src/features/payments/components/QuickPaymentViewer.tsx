import React, { useState } from 'react';
import PaymentDetailsViewer from './PaymentDetailsViewer';
import GlassButton from '../../shared/components/ui/GlassButton';
import { Search, X } from 'lucide-react';

interface QuickPaymentViewerProps {
  defaultTransactionId?: string;
}

const QuickPaymentViewer: React.FC<QuickPaymentViewerProps> = ({ 
  defaultTransactionId = 'TXN-3304CA9C' 
}) => {
  const [transactionId, setTransactionId] = useState(defaultTransactionId);
  const [showDetails, setShowDetails] = useState(false);

  const handleView = () => {
    if (transactionId.trim()) {
      setShowDetails(true);
    }
  };

  const handleClose = () => {
    setShowDetails(false);
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Quick Payment Viewer</h3>
        {showDetails && (
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {!showDetails ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Transaction ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                placeholder="Enter Transaction ID (e.g., TXN-3304CA9C)"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                onKeyPress={(e) => e.key === 'Enter' && handleView()}
              />
              <GlassButton
                onClick={handleView}
                icon={<Search size={16} />}
                disabled={!transactionId.trim()}
              >
                View Details
              </GlassButton>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>Enter a transaction ID to view detailed payment information.</p>
            <p className="mt-1">Example: <code className="bg-gray-100 px-1 rounded">TXN-3304CA9C</code></p>
          </div>
        </div>
      ) : (
        <PaymentDetailsViewer 
          transactionId={transactionId} 
          onClose={handleClose}
          isModal={false}
        />
      )}
    </div>
  );
};

export default QuickPaymentViewer;
