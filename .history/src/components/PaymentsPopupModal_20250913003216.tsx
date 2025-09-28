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

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMethod('');
      setIsProcessing(false);
    }
  }, [isOpen]);

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

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }

    const method = paymentMethods.find(m => m.id === selectedMethod);
    const account = getAutoSelectedAccount(selectedMethod);
    
    if (!method || !account) {
      toast.error('No compatible account found for this payment method');
      return;
    }

    setIsProcessing(true);
    
    try {
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
              <div className="text-white/70 text-sm mb-2">Amount to Pay</div>
              <div className="text-white text-4xl font-bold">TSh {amount.toLocaleString()}</div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <div className="text-white/90 text-sm font-medium text-center">Choose Payment Method</div>
              <div className="grid grid-cols-2 gap-4">
                {paymentMethods.slice(0, 4).map((method) => {
                  const isSelected = selectedMethod === method.id;
                  
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      disabled={isProcessing}
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
                disabled={!selectedMethod || isProcessing}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border border-green-400/30 rounded-lg text-white font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay Now
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

export default CleanPaymentsModal;
