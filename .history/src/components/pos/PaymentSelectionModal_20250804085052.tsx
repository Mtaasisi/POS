import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Smartphone, Building, PiggyBank, TrendingUp, Wallet, Check, Truck } from 'lucide-react';
import Modal from '../ui/Modal';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { financeAccountService } from '../../lib/financeAccountService';
import { FinanceAccount } from '../../types/finance';

interface PaymentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentSelect: (accountId: string) => void;
  totalAmount: number;
  onShowDeliveryOptions?: () => void;
}

const PaymentSelectionModal: React.FC<PaymentSelectionModalProps> = ({
  isOpen,
  onClose,
  onPaymentSelect,
  totalAmount,
  onShowDeliveryOptions
}) => {
  const [paymentAccounts, setPaymentAccounts] = useState<FinanceAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [showDeliveryStep, setShowDeliveryStep] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadPaymentAccounts();
      setShowDeliveryStep(false);
      setSelectedAccount(null);
    }
  }, [isOpen]);

  const loadPaymentAccounts = async () => {
    try {
      setLoading(true);
      const accounts = await financeAccountService.getPaymentMethods();
      console.log('🔧 Loaded payment accounts in modal:', accounts);
      setPaymentAccounts(accounts);
    } catch (error) {
      console.error('Error loading payment accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSelect = (accountId: string) => {
    console.log('🔧 Payment account selected in modal:', accountId);
    setSelectedAccount(accountId);
  };

  const handleConfirmPayment = () => {
    console.log('🔧 Confirm Payment clicked, selectedAccount:', selectedAccount);
    if (selectedAccount) {
      console.log('🔧 Calling onPaymentSelect with:', selectedAccount);
      onPaymentSelect(selectedAccount);
      // Show delivery options as next step in same popup
      setShowDeliveryStep(true);
    } else {
      console.log('🔧 No account selected!');
    }
  };

  const handleContinueToDelivery = () => {
    if (onShowDeliveryOptions) {
      onShowDeliveryOptions();
    }
    onClose();
  };

  const handleDeliverySelect = (deliveryType: 'pickup' | 'delivery') => {
    // Set delivery method and continue to complete sale
    if (onShowDeliveryOptions) {
      onShowDeliveryOptions();
    }
    onClose();
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
              className={`${iconSize} object-cover rounded-full`}
              onError={(e) => {
                console.warn(`Failed to load local icon: ${localIconPath}`);
                e.currentTarget.style.display = 'none';
                // Show a simple fallback text instead of trying to append React element
                const fallbackText = document.createElement('span');
                fallbackText.className = `${iconSize} text-gray-500`;
                fallbackText.textContent = '💰';
                e.currentTarget.parentElement?.appendChild(fallbackText);
              }}
            />
          </div>
        );
      }
      
      // Handle external URLs (must start with http/https)
      if (customIcon.startsWith('http://') || customIcon.startsWith('https://')) {
        return (
          <div className={`${baseClasses} bg-gray-100`}>
            <img 
              src={customIcon} 
              alt="Custom icon" 
              className={`${iconSize} object-cover rounded-full`}
              onError={(e) => {
                console.warn(`Failed to load external icon: ${customIcon}`);
                e.currentTarget.style.display = 'none';
                // Show a simple fallback text instead of trying to append React element
                const fallbackText = document.createElement('span');
                fallbackText.className = `${iconSize} text-gray-500`;
                fallbackText.textContent = '💰';
                e.currentTarget.parentElement?.appendChild(fallbackText);
              }}
            />
          </div>
        );
      }
      
      // Invalid URL format - fallback to default
      console.warn(`Invalid payment icon format: ${customIcon}`);
    }
    
    // Return default icon based on type
    return getDefaultIcon(type);
  };

  const getDefaultIcon = (type: FinanceAccount['type']) => {
    const iconSize = "w-6 h-6";
    const baseClasses = "rounded-full p-2";
    
    switch (type) {
      case 'bank':
        return (
          <div className={`${baseClasses} bg-blue-100 text-blue-600`}>
            <Building className={iconSize} />
          </div>
        );
      case 'cash':
        return (
          <div className={`${baseClasses} bg-green-100 text-green-600`}>
            <DollarSign className={iconSize} />
          </div>
        );
      case 'mobile_money':
        return (
          <div className={`${baseClasses} bg-purple-100 text-purple-600`}>
            <Smartphone className={iconSize} />
          </div>
        );
      case 'credit_card':
        return (
          <div className={`${baseClasses} bg-indigo-100 text-indigo-600`}>
            <CreditCard className={iconSize} />
          </div>
        );
      case 'savings':
        return (
          <div className={`${baseClasses} bg-yellow-100 text-yellow-600`}>
            <PiggyBank className={iconSize} />
          </div>
        );
      case 'investment':
        return (
          <div className={`${baseClasses} bg-emerald-100 text-emerald-600`}>
            <TrendingUp className={iconSize} />
          </div>
        );
      default:
        return (
          <div className={`${baseClasses} bg-gray-100 text-gray-600`}>
            <Wallet className={iconSize} />
          </div>
        );
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <GlassCard className="w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center">
              <CreditCard size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {showDeliveryStep ? 'Delivery Options' : 'Payment Method Selection'}
              </h2>
              <p className="text-sm text-gray-600">
                {showDeliveryStep 
                  ? 'Configure delivery settings for this order' 
                  : 'Choose how you want to receive payment'
                }
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {!showDeliveryStep ? (
          // Payment Selection Step
          <>
            {/* Total Amount Display */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="text-3xl font-bold text-gray-900">Tsh{totalAmount.toFixed(2)}</p>
              </div>
            </div>

            {/* Payment Methods Grid */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Available Payment Methods</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Loading payment methods...</span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paymentAccounts.length > 0 ? (
                    paymentAccounts.map((account) => (
                      <button
                        key={account.id}
                        onClick={() => handlePaymentSelect(account.id)}
                        className={`p-4 rounded-xl border-2 transition-all hover:shadow-lg ${
                          selectedAccount === account.id
                            ? 'border-blue-500 bg-blue-50 shadow-lg'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        style={{ 
                          borderColor: selectedAccount === account.id 
                            ? financeAccountService.getColorForAccountType(account.type) 
                            : undefined 
                        }}
                      >
                        <div className="flex flex-col items-center text-center">
                          <div className="relative w-full mb-3">
                            <div 
                              className="w-12 h-12 rounded-full flex items-center justify-center overflow-hidden mx-auto"
                              style={{ backgroundColor: financeAccountService.getColorForAccountType(account.type) + '20' }}
                            >
                              {getAccountTypeIcon(account.type, account.payment_icon)}
                            </div>
                            
                            {selectedAccount === account.id && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                              </div>
                            )}
                          </div>
                          
                          <div className="text-center">
                            <span className="font-medium text-gray-900 text-sm block">{account.name}</span>
                            <p className="text-xs text-gray-500 mt-1">{account.type}</p>
                            <p className="text-xs font-semibold text-gray-700 mt-1">Tsh{account.balance.toFixed(2)}</p>
                          </div>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="col-span-full text-center py-8 text-gray-500">
                      <p>No payment methods available</p>
                      <p className="text-sm">Please add payment methods in the admin panel</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <GlassButton
                variant="outline"
                onClick={onClose}
                className="flex-1"
              >
                Cancel
              </GlassButton>
              
              <GlassButton
                variant="primary"
                onClick={handleConfirmPayment}
                disabled={!selectedAccount}
                className="flex-1"
              >
                Confirm Payment
              </GlassButton>
            </div>
          </>
        ) : (
          // Delivery Options Step
          <>
            {/* Payment Confirmation */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
                  <Check size={16} className="text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">Payment Method Confirmed</h3>
                  <p className="text-sm text-green-600">
                    {paymentAccounts.find(a => a.id === selectedAccount)?.name || 'Payment method'} selected
                  </p>
                </div>
              </div>
            </div>

            {/* Delivery Options */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Options</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                      <Building size={20} className="text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Pickup</h4>
                      <p className="text-sm text-gray-600">Customer picks up from store</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 border border-gray-200 rounded-xl hover:border-green-300 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                      <Truck size={20} className="text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">Delivery</h4>
                      <p className="text-sm text-gray-600">We deliver to customer</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <GlassButton
                variant="outline"
                onClick={() => setShowDeliveryStep(false)}
                className="flex-1"
              >
                ← Back to Payment
              </GlassButton>
              
              <GlassButton
                variant="primary"
                onClick={handleContinueToDelivery}
                className="flex-1"
              >
                Continue to Complete Sale
              </GlassButton>
            </div>
          </>
        )}
      </GlassCard>
    </Modal>
  );
};

export default PaymentSelectionModal; 