import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { usePaymentAccounts } from '../hooks/usePaymentAccounts';
import PaymentMethodIcon from './PaymentMethodIcon';
import { toast } from 'react-hot-toast';

interface PaymentsPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  customerId?: string;
  customerName?: string;
  description?: string;
  onPaymentComplete: (paymentData: any) => Promise<void>;
  title?: string;
}

const PaymentsPopupModal: React.FC<PaymentsPopupModalProps> = ({
  isOpen,
  onClose,
  amount,
  customerId,
  customerName,
  description,
  onPaymentComplete,
  title = "Payment"
}) => {
  const { user } = useAuth();
  const { paymentMethods, loading: methodsLoading } = usePaymentMethods();
  const { paymentAccounts, loading: accountsLoading } = usePaymentAccounts();
  
  const [selectedMethod, setSelectedMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMultipleMode, setIsMultipleMode] = useState(false);
  const [paymentEntries, setPaymentEntries] = useState<Array<{
    method: string, 
    methodId: string,
    amount: number, 
    account: string,
    accountId: string
  }>>([]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMethod('');
      setIsProcessing(false);
      setIsMultipleMode(false);
      setPaymentEntries([]);
    }
  }, [isOpen]);

  // Calculate totals
  const totalPaid = paymentEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const remainingAmount = amount - totalPaid;

  // Auto-select the first available account for the selected payment method
  const getAutoSelectedAccount = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    if (!method) return null;

    const compatibleAccounts = paymentAccounts.filter(account => 
      account.paymentMethodId === methodId && account.isActive
    );
    
    return compatibleAccounts.length > 0 ? compatibleAccounts[0] : null;
  };

  // Get payment method icon
  const getMethodIcon = (type: string, name: string) => {
    return <PaymentMethodIcon type={type} name={name} className="w-6 h-6" />;
  };

  // Add payment entry in multiple mode
  const addPayment = (methodId: string, paymentAmount: number) => {
    const method = paymentMethods.find(m => m.id === methodId);
    const account = getAutoSelectedAccount(methodId);
    
    // Check if method already exists
    const existingEntry = paymentEntries.find(entry => entry.methodId === methodId);
    if (existingEntry) {
      toast.error('This payment method is already added');
      return;
    }
    
    if (method && account && paymentAmount > 0) {
      setPaymentEntries(prev => [...prev, {
        method: method.name,
        methodId: method.id,
        amount: paymentAmount,
        account: account.name,
        accountId: account.id
      }]);
    }
  };

  // Remove payment entry
  const removePayment = (index: number) => {
    setPaymentEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handlePayment = async () => {
    if (isMultipleMode) {
      // Multiple payment mode
      if (paymentEntries.length === 0) {
        toast.error('Please add at least one payment');
        return;
      }
      
      if (remainingAmount < 0) {
        toast.error('Payment amount exceeds required amount');
        return;
      }
    } else {
      // Single payment mode
      if (!selectedMethod) {
        toast.error('Please select a payment method');
        return;
      }
    }

    setIsProcessing(true);
    
    try {
      if (isMultipleMode) {
        // Process multiple payments
        const paymentData = paymentEntries.map(entry => ({
          amount: entry.amount,
          paymentMethod: entry.method,
          customerId: customerId,
          customerName: customerName,
          description: description,
          timestamp: new Date().toISOString()
        }));
        
        await onPaymentComplete(paymentData);
      } else {
        // Process single payment
        const method = paymentMethods.find(m => m.id === selectedMethod);
        const account = getAutoSelectedAccount(selectedMethod);
        
        if (!method || !account) {
          toast.error('No compatible account found for this payment method');
          return;
        }

        const paymentData = {
          amount: amount,
          paymentMethod: method.name,
          paymentMethodId: method.id,
          paymentAccountId: account.id,
          customerId: customerId,
          customerName: customerName,
          description: description,
          timestamp: new Date().toISOString()
        };

        await onPaymentComplete(paymentData);
      }
      
      onClose();
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md">
        {/* Glassmorphism Modal */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">{title}</h2>
                <p className="text-white/60 text-sm">Complete your payment</p>
              </div>
              <button
                onClick={onClose}
                className="text-white/70 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                disabled={isProcessing}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Mode Toggle */}
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setIsMultipleMode(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  !isMultipleMode 
                    ? 'bg-white/20 text-white border border-white/30' 
                    : 'bg-transparent text-white/60 hover:text-white/80'
                }`}
              >
                Single Payment
              </button>
              <button
                onClick={() => setIsMultipleMode(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  isMultipleMode 
                    ? 'bg-white/20 text-white border border-white/30' 
                    : 'bg-transparent text-white/60 hover:text-white/80'
                }`}
              >
                Multiple Payments
              </button>
            </div>

            {/* Customer Info */}
            {(customerName || description) && (
              <div className="bg-white/8 backdrop-blur-lg rounded-xl border border-white/20 p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 border border-white/20 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {customerName ? customerName.charAt(0).toUpperCase() : 'C'}
                    </span>
                  </div>
                  <div className="flex-1">
                    {customerName && (
                      <div className="text-white/95 text-sm font-semibold">
                        {customerName}
                      </div>
                    )}
                    {description && (
                      <div className="text-white/70 text-xs">
                        {description}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Amount Display */}
            <div className="bg-white/8 backdrop-blur-md rounded-xl border border-white/20 p-6 text-center">
              {isMultipleMode ? (
                <>
                  <div className="text-white/70 text-sm mb-2">Total Amount</div>
                  <div className="text-white text-3xl font-bold mb-2">TSh {amount.toLocaleString()}</div>
                  <div className="text-white/60 text-sm">
                    Paid: TSh {totalPaid.toLocaleString()} | 
                    Remaining: TSh {remainingAmount.toLocaleString()}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-white/70 text-sm mb-2">Amount to Pay</div>
                  <div className="text-white text-4xl font-bold">TSh {amount.toLocaleString()}</div>
                </>
              )}
            </div>

            {/* Payment Entries (Multiple Mode) */}
            {isMultipleMode && paymentEntries.length > 0 && (
              <div className="space-y-2">
                <div className="text-white/90 text-sm font-medium">Payment Entries</div>
                {paymentEntries.map((entry, index) => (
                  <div key={index} className="bg-white/8 backdrop-blur-md rounded-lg border border-white/20 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-white/80 text-sm">{entry.method}</div>
                      <div className="text-white/60 text-xs">{entry.account}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-white font-medium">TSh {entry.amount.toLocaleString()}</div>
                      <button
                        onClick={() => removePayment(index)}
                        className="text-red-400 hover:text-red-300 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Payment Methods */}
            <div className="space-y-3">
              <div className="text-white/90 text-sm font-medium text-center">
                {isMultipleMode ? 'Add Payment Method' : 'Choose Payment Method'}
              </div>
              <div className="grid grid-cols-2 gap-4">
                {paymentMethods.slice(0, 4).map((method) => {
                  const isSelected = selectedMethod === method.id;
                  const isDisabled = isMultipleMode && remainingAmount <= 0;
                  
                  return (
                    <button
                      key={method.id}
                      onClick={() => {
                        if (isMultipleMode) {
                          // Add payment with remaining amount
                          addPayment(method.id, remainingAmount);
                        } else {
                          // Select method for single payment
                          setSelectedMethod(method.id);
                        }
                      }}
                      disabled={isProcessing || isDisabled}
                      className={`p-4 rounded-xl border backdrop-blur-md transition-all duration-300 text-center transform hover:scale-105 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                        isSelected 
                          ? 'bg-white/20 border-white/40 ring-2 ring-white/30' 
                          : 'bg-white/10 border-white/20 hover:bg-white/15'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="text-2xl text-white/80">
                          {getMethodIcon(method.type, method.name)}
                        </div>
                        <div className="text-white font-medium text-sm">
                          {method.name}
                        </div>
                        {isMultipleMode && remainingAmount > 0 && (
                          <div className="text-white/60 text-xs">
                            +TSh {remainingAmount.toLocaleString()}
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 py-3 px-6 bg-transparent border border-white/20 rounded-lg text-white/80 font-medium hover:bg-white/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              
              <button
                onClick={handlePayment}
                disabled={
                  isProcessing || 
                  (isMultipleMode ? paymentEntries.length === 0 || remainingAmount > 0 : !selectedMethod)
                }
                className="flex-1 py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border border-green-400/30 rounded-lg text-white font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {isMultipleMode ? 'Complete Payment' : 'Pay Now'}
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPopupModal;
