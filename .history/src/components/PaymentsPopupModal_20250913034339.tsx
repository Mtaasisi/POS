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
  const [customAmount, setCustomAmount] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedMethod('');
      setIsProcessing(false);
      setIsMultipleMode(false);
      setPaymentEntries([]);
      setCustomAmount('');
    }
  }, [isOpen]);

  // Calculate totals
  const totalPaid = paymentEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const remainingAmount = amount - totalPaid;

  // Auto-select the first available account for the selected payment method
  const getAutoSelectedAccount = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    if (!method) return null;

    // In the current system, finance accounts with is_payment_method = true ARE the payment methods
    // So we just return the selected payment method as the account
    return method;
  };

  // Get payment method icon
  const getMethodIcon = (type: string, name: string) => {
    return <PaymentMethodIcon type={type} name={name} className="w-6 h-6" />;
  };

  // Add payment entry in multiple mode
  const addPayment = (methodId: string, paymentAmount?: number) => {
    const method = paymentMethods.find(m => m.id === methodId);
    const account = getAutoSelectedAccount(methodId);
    
    // Check if method already exists
    const existingEntry = paymentEntries.find(entry => entry.methodId === methodId);
    if (existingEntry) {
      toast.error('This payment method is already added');
      return;
    }
    
    // Use custom amount if provided, otherwise use remaining amount
    const amountToAdd = paymentAmount || parseFloat(customAmount) || remainingAmount;
    
    if (method && account && amountToAdd > 0) {
      setPaymentEntries(prev => [...prev, {
        method: method.name,
        methodId: method.id,
        amount: amountToAdd,
        account: account.name,
        accountId: account.id
      }]);
      setCustomAmount(''); // Clear custom amount after adding
    }
  };

  // Quick amount buttons
  const quickAmounts = [
    { label: '25%', value: amount * 0.25 },
    { label: '50%', value: amount * 0.5 },
    { label: '75%', value: amount * 0.75 },
    { label: 'Full', value: amount }
  ];

  // Remove payment entry
  const removePayment = (index: number) => {
    setPaymentEntries(prev => prev.filter((_, i) => i !== index));
  };

  const handlePayment = async () => {
    // Check if customer is selected
    if (!customerId) {
      toast.error('Please select a customer first');
      return;
    }

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
          paymentMethodId: entry.methodId,
          paymentAccountId: entry.accountId,
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
      
      // Provide more specific error messages based on the error type
      let errorMessage = 'Payment failed. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Customer information is required')) {
          errorMessage = 'Customer information is required for payment processing.';
        } else if (error.message.includes('No payment data received')) {
          errorMessage = 'No payment data received. Please try again.';
        } else if (error.message.includes('Failed to process sale')) {
          errorMessage = 'Sale processing failed. Please check your connection and try again.';
        } else if (error.message.includes('Database connection error')) {
          errorMessage = 'Database connection error. Please check your internet connection.';
        } else if (error.message.includes('Invalid payment method')) {
          errorMessage = 'Invalid payment method selected. Please choose a different method.';
        } else if (error.message.includes('Connection issue')) {
          errorMessage = 'Connection issue detected. Please check your internet connection.';
        } else {
          // Use the actual error message if it's informative
          errorMessage = error.message || errorMessage;
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-5xl">
        {/* Enhanced Glassmorphism Modal */}
        <div className="bg-white/8 backdrop-blur-2xl border border-white/30 rounded-3xl shadow-2xl shadow-purple-500/20 overflow-hidden relative">
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-purple-500/10"></div>
          <div className="relative z-10">
            {/* Enhanced Header */}
            <div className="p-8 border-b border-white/20 bg-gradient-to-r from-white/5 to-transparent">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">{title}</h2>
                  <p className="text-white/70 text-sm">Complete your payment securely</p>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/70 hover:text-white transition-all duration-200 p-3 hover:bg-white/10 rounded-xl hover:scale-105"
                  disabled={isProcessing}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-8">
              {/* Enhanced Mode Toggle */}
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-1 border border-white/20">
                  <button
                    onClick={() => setIsMultipleMode(false)}
                    className={`px-8 py-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      !isMultipleMode 
                        ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30' 
                        : 'text-white/70 hover:text-white/90 hover:bg-white/5'
                    }`}
                  >
                    Single Payment
                  </button>
                  <button
                    onClick={() => setIsMultipleMode(true)}
                    className={`px-8 py-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                      isMultipleMode 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg shadow-purple-500/30' 
                        : 'text-white/70 hover:text-white/90 hover:bg-white/5'
                    }`}
                  >
                    Multiple Payments
                  </button>
                </div>
              </div>

              {/* Main Content Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column - Amount & Payment Methods */}
                <div className="space-y-8">
                  {/* Enhanced Amount Display */}
                  <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/30 p-8 text-center shadow-xl shadow-blue-500/10">
                    {isMultipleMode ? (
                      <>
                        <div className="text-white/80 text-sm mb-3 font-medium">Total Amount</div>
                        <div className="text-white text-5xl font-bold mb-6 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                          TSh {amount.toLocaleString()}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gradient-to-br from-green-500/30 to-emerald-500/20 rounded-xl p-4 border border-green-400/30">
                            <div className="text-green-300 text-xs mb-2 font-semibold">PAID</div>
                            <div className="text-white font-bold text-lg">TSh {totalPaid.toLocaleString()}</div>
                          </div>
                          <div className="bg-gradient-to-br from-blue-500/30 to-cyan-500/20 rounded-xl p-4 border border-blue-400/30">
                            <div className="text-blue-300 text-xs mb-2 font-semibold">REMAINING</div>
                            <div className="text-white font-bold text-lg">TSh {remainingAmount.toLocaleString()}</div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="text-white/80 text-sm mb-3 font-medium">Amount to Pay</div>
                        <div className="text-white text-6xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                          TSh {amount.toLocaleString()}
                        </div>
                        <div className="mt-4 text-white/60 text-sm">Select a payment method below</div>
                      </>
                    )}
                  </div>

                  {/* Enhanced Payment Methods */}
                  <div className="space-y-4">
                    <div className="text-white/90 text-lg font-semibold text-center">
                      {isMultipleMode ? 'Add Payment Method' : 'Choose Payment Method'}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {paymentMethods.slice(0, 4).map((method) => {
                        const isSelected = selectedMethod === method.id;
                        const isAlreadyAdded = paymentEntries.some(entry => entry.methodId === method.id);
                        const isDisabled = isProcessing || (isMultipleMode && isAlreadyAdded);
                        
                        return (
                          <button
                            key={method.id}
                            onClick={() => {
                              if (isMultipleMode) {
                                // Add payment with custom amount or remaining amount
                                addPayment(method.id);
                              } else {
                                // Select method for single payment
                                setSelectedMethod(method.id);
                              }
                            }}
                            disabled={isDisabled}
                            className={`p-6 rounded-2xl border backdrop-blur-xl transition-all duration-300 text-center transform hover:scale-105 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group ${
                              isSelected 
                                ? 'bg-gradient-to-br from-blue-500/30 to-purple-500/30 border-blue-400/50 ring-2 ring-blue-300/50 shadow-lg shadow-blue-500/20' 
                                : isAlreadyAdded
                                ? 'bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-green-400/50 text-green-200 shadow-lg shadow-green-500/20'
                                : 'bg-white/10 border-white/30 hover:bg-white/15 hover:border-white/40 hover:shadow-lg hover:shadow-white/10'
                            }`}
                          >
                            <div className="flex flex-col items-center gap-3">
                              <div className="text-3xl text-white/90 group-hover:scale-110 transition-transform duration-200">
                                {getMethodIcon(method.type, method.name)}
                              </div>
                              <div className="text-white font-semibold text-sm">
                                {method.name}
                              </div>
                              {isAlreadyAdded && (
                                <div className="text-green-300 text-xs font-bold bg-green-500/20 px-2 py-1 rounded-full">
                                  ✓ Added
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
              </div>

                {/* Right Column - Multiple Payment Features */}
                <div className="space-y-8">
                  {/* Enhanced Custom Amount Input (Multiple Mode) */}
                  {isMultipleMode && (
                    <div className="space-y-4">
                      <div className="text-white/90 text-lg font-semibold text-center">Enter Amount</div>
                      <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/30 p-6 shadow-xl shadow-purple-500/10">
                        <input
                          type="number"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="Enter amount..."
                          className="w-full bg-transparent text-white text-center text-3xl font-bold placeholder-white/40 border-none outline-none"
                        />
                        <div className="text-white/70 text-sm text-center mt-3 font-medium">
                          Remaining: TSh {remainingAmount.toLocaleString()}
                        </div>
                      </div>
                      
                      {/* Enhanced Quick Amount Buttons */}
                      <div className="grid grid-cols-4 gap-3">
                        {quickAmounts.map((quick) => (
                          <button
                            key={quick.label}
                            onClick={() => setCustomAmount(quick.value.toString())}
                            className="py-3 px-4 bg-gradient-to-br from-white/15 to-white/5 border border-white/30 rounded-xl text-white/90 text-sm font-semibold hover:bg-white/20 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-white/10"
                          >
                            {quick.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Payment Entries (Multiple Mode) */}
                  {isMultipleMode && paymentEntries.length > 0 && (
                    <div className="space-y-4">
                      <div className="text-white/90 text-lg font-semibold">Payment Entries</div>
                      <div className="max-h-64 overflow-y-auto space-y-3">
                        {paymentEntries.map((entry, index) => {
                          const method = paymentMethods.find(m => m.id === entry.methodId);
                          return (
                            <div key={index} className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl rounded-xl border border-white/30 p-4 flex items-center justify-between shadow-lg hover:shadow-xl transition-all duration-200">
                              <div className="flex items-center gap-4">
                                <div className="text-white/90 text-2xl">
                                  {method ? getMethodIcon(method.type, method.name) : '💳'}
                                </div>
                                <div>
                                  <div className="text-white font-semibold text-sm">{entry.method}</div>
                                  <div className="text-white/70 text-xs">{entry.account}</div>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-white font-bold text-lg">TSh {entry.amount.toLocaleString()}</div>
                                <button
                                  onClick={() => removePayment(index)}
                                  className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/20 rounded-lg transition-all duration-200 hover:scale-110"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Enhanced Single Mode Info */}
                  {!isMultipleMode && (
                    <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl rounded-2xl border border-white/30 p-8 text-center shadow-xl shadow-blue-500/10">
                      <div className="text-white/80 text-sm mb-3 font-semibold">Payment Mode</div>
                      <div className="text-white text-2xl font-bold mb-3">Single Payment</div>
                      <div className="text-white/70 text-sm">
                        Select one payment method to pay the full amount
                      </div>
                    </div>
                  )}
              </div>
            </div>

              {/* Enhanced Action Buttons */}
              <div className="flex gap-6 pt-8 mt-8 border-t border-white/20">
                <button
                  onClick={onClose}
                  disabled={isProcessing}
                  className="flex-1 py-5 px-8 bg-transparent border-2 border-white/30 rounded-2xl text-white/90 font-semibold hover:bg-white/10 hover:border-white/50 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                >
                  Cancel
                </button>
                
                <button
                  onClick={handlePayment}
                  disabled={
                    isProcessing || 
                    !customerId ||
                    (isMultipleMode ? paymentEntries.length === 0 : !selectedMethod)
                  }
                  className="flex-1 py-5 px-8 bg-gradient-to-r from-green-500 via-emerald-500 to-green-600 hover:from-green-600 hover:via-emerald-600 hover:to-green-700 border-2 border-green-400/50 rounded-2xl text-white font-bold transition-all duration-300 hover:shadow-2xl hover:shadow-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:scale-105"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      {isMultipleMode ? 'Complete Payment' : 'Pay Now'}
                      <CheckCircle className="w-6 h-6" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPopupModal;
