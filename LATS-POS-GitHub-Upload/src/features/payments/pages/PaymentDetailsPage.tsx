import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PaymentDetailsViewer from '../components/PaymentDetailsViewer';
import GlassButton from '../../shared/components/ui/GlassButton';
import { ArrowLeft, Search } from 'lucide-react';

const PaymentDetailsPage: React.FC = () => {
  const { transactionId } = useParams<{ transactionId: string }>();
  const navigate = useNavigate();
  const [searchId, setSearchId] = useState(transactionId || '');

  const handleSearch = () => {
    if (searchId.trim()) {
      navigate(`/payments/details/${searchId.trim()}`);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <GlassButton
                onClick={handleBack}
                variant="secondary"
                icon={<ArrowLeft size={20} />}
              >
                Back
              </GlassButton>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Payment Details</h1>
                <p className="text-gray-600">View detailed transaction information</p>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex gap-2 max-w-md">
            <input
              type="text"
              value={searchId}
              onChange={(e) => setSearchId(e.target.value)}
              placeholder="Enter Transaction ID (e.g., TXN-3304CA9C)"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <GlassButton
              onClick={handleSearch}
              icon={<Search size={16} />}
              disabled={!searchId.trim()}
            >
              Search
            </GlassButton>
          </div>
        </div>

        {/* Payment Details */}
        {transactionId ? (
          <PaymentDetailsViewer 
            transactionId={transactionId} 
            isModal={false}
          />
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">💳</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">No Transaction Selected</h3>
            <p className="text-gray-600 mb-4">Enter a transaction ID above to view details</p>
            <div className="text-sm text-gray-500">
              <p>Example: TXN-3304CA9C</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentDetailsPage;
