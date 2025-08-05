import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { 
  CheckCircle,
  Printer,
  Plus,
  Receipt,
  Home,
  Download,
  Share2
} from 'lucide-react';

interface LocationState {
  saleOrder: any;
  cart: any[];
  selectedCustomer: any;
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    balance: number;
  };
}

const POSSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [printing, setPrinting] = useState(false);

  // Get data from navigation state
  const state = location.state as LocationState;
  const { saleOrder, cart, selectedCustomer, totals } = state || {};

  const handlePrintReceipt = async () => {
    setPrinting(true);
    try {
      // Simulate printing
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log('Printing receipt for order:', saleOrder?.id);
    } catch (error) {
      console.error('Error printing receipt:', error);
    } finally {
      setPrinting(false);
    }
  };

  const handleNewSale = () => {
    navigate('/pos');
  };

  const handleGoHome = () => {
    navigate('/dashboard');
  };

  const handleDownloadReceipt = () => {
    // Generate and download receipt as PDF
    console.log('Downloading receipt for order:', saleOrder?.id);
  };

  const handleShareReceipt = () => {
    // Share receipt via email or SMS
    console.log('Sharing receipt for order:', saleOrder?.id);
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <CheckCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Invalid Session</h2>
          <p className="text-gray-600 mb-4">No sale data found. Please return to POS.</p>
          <GlassButton onClick={() => navigate('/pos')} variant="primary">
            Return to POS
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Sale Completed!</h1>
          <p className="text-gray-600">Order #{saleOrder?.id} has been processed successfully</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Summary */}
          <div className="lg:col-span-2">
            <GlassCard className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Customer Info */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Customer</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600">{selectedCustomer?.name}</p>
                    <p className="text-sm text-gray-500">{selectedCustomer?.phone}</p>
                    <p className="text-sm text-gray-500">{selectedCustomer?.email}</p>
                  </div>
                </div>

                {/* Order Info */}
                <div>
                  <h3 className="font-semibold text-gray-800 mb-3">Order Details</h3>
                  <div className="space-y-2">
                    <p className="text-gray-600">Order ID: #{saleOrder?.id}</p>
                    <p className="text-sm text-gray-500">Date: {new Date().toLocaleDateString()}</p>
                    <p className="text-sm text-gray-500">Time: {new Date().toLocaleTimeString()}</p>
                  </div>
                </div>
              </div>

              {/* Items */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-800 mb-3">Items ({cart.length})</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {cart.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-800">{item.name}</p>
                        <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-gray-800">${item.total.toFixed(2)}</p>
                        <p className="text-sm text-gray-500">${item.unitPrice.toFixed(2)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Totals */}
              <div className="border-t pt-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-semibold">${totals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tax:</span>
                    <span className="font-semibold">${totals.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Shipping:</span>
                    <span className="font-semibold">${totals.shipping.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2">
                    <div className="flex justify-between text-xl font-bold">
                      <span>Total:</span>
                      <span className="text-green-600">${totals.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Actions */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Next Steps</h2>
              
              <div className="space-y-3">
                <GlassButton
                  variant="primary"
                  size="lg"
                  onClick={handlePrintReceipt}
                  disabled={printing}
                  className="w-full"
                >
                  {printing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Printing...
                    </>
                  ) : (
                    <>
                      <Printer className="w-5 h-5 mr-2" />
                      Print Receipt
                    </>
                  )}
                </GlassButton>

                <GlassButton
                  variant="outline"
                  size="lg"
                  onClick={handleNewSale}
                  className="w-full"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  New Sale
                </GlassButton>

                <GlassButton
                  variant="outline"
                  size="lg"
                  onClick={handleDownloadReceipt}
                  className="w-full"
                >
                  <Download className="w-5 h-5 mr-2" />
                  Download Receipt
                </GlassButton>

                <GlassButton
                  variant="outline"
                  size="lg"
                  onClick={handleShareReceipt}
                  className="w-full"
                >
                  <Share2 className="w-5 h-5 mr-2" />
                  Share Receipt
                </GlassButton>

                <GlassButton
                  variant="outline"
                  size="lg"
                  onClick={handleGoHome}
                  className="w-full"
                >
                  <Home className="w-5 h-5 mr-2" />
                  Go to Dashboard
                </GlassButton>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSSuccessPage; 