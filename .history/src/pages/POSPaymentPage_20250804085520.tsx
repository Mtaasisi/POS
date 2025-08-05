import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { financeAccountService, FinanceAccount } from '../lib/financeAccountService';
import { 
  ArrowLeft,
  CreditCard,
  DollarSign,
  CheckCircle,
  Loader2,
  AlertCircle
} from 'lucide-react';

interface LocationState {
  cart: any[];
  selectedCustomer: any;
  totals: {
    subtotal: number;
    tax: number;
    shipping: number;
    total: number;
    balance: number;
  };
  customerType: 'retail' | 'wholesale';
  deliveryMethod: string;
  deliveryAddress: string;
  deliveryCity: string;
  deliveryNotes: string;
  currentLocation: any;
}

const POSPaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentAccounts, setPaymentAccounts] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  // Get data from navigation state
  const state = location.state as LocationState;
  const { cart, selectedCustomer, totals, customerType, deliveryMethod, deliveryAddress, deliveryCity, deliveryNotes, currentLocation } = state || {};

  useEffect(() => {
    if (!state) {
      // If no state, redirect back to POS
      navigate('/pos');
      return;
    }
    loadPaymentAccounts();
  }, [state]);

  const loadPaymentAccounts = async () => {
    try {
      setLoading(true);
      const accounts = await financeAccountService.getPaymentMethods();
      console.log('🔧 Loaded payment accounts:', accounts);
      setPaymentAccounts(accounts);
    } catch (error) {
      console.error('Error loading payment accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSelect = (accountId: string) => {
    console.log('🔧 Payment account selected:', accountId);
    setSelectedAccount(accountId);
  };

  const handleConfirmPayment = async () => {
    if (!selectedAccount) {
      return;
    }

    setProcessing(true);
    
    try {
      // Navigate to the next step with payment method selected
      navigate('/pos/process', {
        state: {
          ...state,
          paymentAccount: selectedAccount
        }
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      setProcessing(false);
    }
  };

  const goBack = () => {
    navigate('/pos', { state });
  };

  const getAccountTypeIcon = (type: FinanceAccount['type'], customIcon?: string) => {
    const iconSize = "w-6 h-6";
    const baseClasses = "rounded-full p-2";
    
    // If custom icon is provided, use it
    if (customIcon && customIcon.trim()) {
      // Handle local files (no http/https)
      if (!customIcon.startsWith('http') && !customIcon.startsWith('data:')) {
        const localIconPath = `/icons/payment-methods/${customIcon}`;
        return (
          <div className={`${baseClasses} bg-gray-100`}>
            <img 
              src={localIconPath} 
              alt="Custom icon"
              className={iconSize}
            />
          </div>
        );
      }
      // Handle remote URLs
      return (
        <div className={`${baseClasses} bg-gray-100`}>
          <img 
            src={customIcon} 
            alt="Custom icon"
            className={iconSize}
          />
        </div>
      );
    }
    
    // Default icons based on type
    switch (type) {
      case 'cash':
        return (
          <div className={`${baseClasses} bg-green-100 text-green-600`}>
            <DollarSign className={iconSize} />
          </div>
        );
      case 'card':
        return (
          <div className={`${baseClasses} bg-blue-100 text-blue-600`}>
            <CreditCard className={iconSize} />
          </div>
        );
      case 'mobile_money':
        return (
          <div className={`${baseClasses} bg-orange-100 text-orange-600`}>
            <CreditCard className={iconSize} />
          </div>
        );
      case 'bank_transfer':
        return (
          <div className={`${baseClasses} bg-purple-100 text-purple-600`}>
            <CreditCard className={iconSize} />
          </div>
        );
      default:
        return (
          <div className={`${baseClasses} bg-gray-100 text-gray-600`}>
            <CreditCard className={iconSize} />
          </div>
        );
    }
  };

  if (!state) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <GlassCard className="p-8 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Invalid Session</h2>
          <p className="text-gray-600 mb-4">No payment data found. Please return to POS.</p>
          <GlassButton onClick={() => navigate('/pos')} variant="primary">
            Return to POS
          </GlassButton>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <GlassButton
            variant="outline"
            onClick={goBack}
            className="mb-4"
          >
            <ArrowLeft size={20} />
            Back to POS
          </GlassButton>
          
          <GlassCard className="p-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Select Payment Method</h1>
            <p className="text-gray-600">Choose how you'd like to process this payment</p>
          </GlassCard>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Payment Methods */}
          <div className="lg:col-span-2">
            <GlassCard className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Available Payment Methods</h2>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="ml-2 text-gray-600">Loading payment methods...</span>
                </div>
              ) : paymentAccounts.length === 0 ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                  <p className="text-gray-600">No payment methods configured</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {paymentAccounts.map((account) => (
                    <div
                      key={account.id}
                      onClick={() => handlePaymentSelect(account.id)}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 hover:shadow-lg ${
                        selectedAccount === account.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {getAccountTypeIcon(account.type, account.custom_icon)}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{account.name}</h3>
                          <p className="text-sm text-gray-600">{account.description}</p>
                        </div>
                        {selectedAccount === account.id && (
                          <CheckCircle className="w-5 h-5 text-blue-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <GlassCard className="p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
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
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total:</span>
                    <span className="text-blue-600">${totals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-6">
                <h3 className="font-semibold text-gray-800">Customer</h3>
                <p className="text-gray-600">{selectedCustomer?.name}</p>
                <p className="text-sm text-gray-500">{selectedCustomer?.phone}</p>
              </div>

              <div className="space-y-3 mb-6">
                <h3 className="font-semibold text-gray-800">Items ({cart.length})</h3>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {cart.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-gray-600">{item.name}</span>
                      <span className="font-medium">${item.total.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <GlassButton
                variant="primary"
                size="lg"
                onClick={handleConfirmPayment}
                disabled={!selectedAccount || processing}
                className="w-full"
              >
                {processing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Confirm Payment
                  </>
                )}
              </GlassButton>
            </GlassCard>
          </div>
        </div>
      </div>
    </div>
  );
};

export default POSPaymentPage; 