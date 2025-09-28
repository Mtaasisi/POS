import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Loader2, CreditCard, DollarSign, AlertCircle, CheckCircle2, Plus } from 'lucide-react';
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
  onPaymentComplete: (paymentData: any, totalPaid?: number) => Promise<void>;
  title?: string;
}

interface PaymentEntry {
  id: string;
  method: string;
  methodId: string;
  amount: number;
  account: string;
  accountId: string;
  reference?: string;
  notes?: string;
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
  const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([]);
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
    return method;
  };

  // Add payment entry in multiple mode
  const addPayment = (methodId: string, paymentAmount?: number) => {
    const method = paymentMethods.find(m => m.id === methodId);
    const account = getAutoSelectedAccount(methodId);
    
    if (!method || !account) {
      toast.error('Payment method or account not found');
      return;
    }

    // Use provided amount, or custom amount, or 0 (user will set it later)
    const amount = paymentAmount || parseFloat(customAmount) || 0;
    
    // Only validate if amount is provided
    if (amount > 0) {
      if (amount > remainingAmount) {
        toast.error('Amount exceeds remaining balance');
        return;
      }
      
      // For POS, we don't validate against method balance since customer is paying
      // The balance represents the business's available funds, not customer's payment limit
    }

    const newEntry: PaymentEntry = {
      id: crypto.randomUUID(),
      method: method.name,
      methodId: method.id,
      amount: amount,
      account: account.name,
      accountId: account.id,
      reference: '',
      notes: ''
    };

    setPaymentEntries(prev => [...prev, newEntry]);
    setCustomAmount('');
  };

  const removePayment = (index: number) => {
    setPaymentEntries(prev => prev.filter((_, i) => i !== index));
  };

  const updatePaymentEntry = (index: number, field: keyof PaymentEntry, value: string | number) => {
    setPaymentEntries(prev => prev.map((entry, i) => {
      if (i === index) {
        const updatedEntry = { ...entry, [field]: value };
        
        // Validate amount if it's being updated
        if (field === 'amount' && typeof value === 'number') {
          // For POS, we don't validate against method balance since customer is paying
          // The balance represents the business's available funds, not customer's payment limit
        }
        
        return updatedEntry;
      }
      return entry;
    }));
  };

  const handlePayment = async () => {
    if (isMultipleMode) {
      if (paymentEntries.length === 0) {
        toast.error('Please add at least one payment');
        return;
      }
      
      // Check if all entries have valid amounts
      const invalidEntries = paymentEntries.filter(entry => !entry.amount || entry.amount <= 0);
      if (invalidEntries.length > 0) {
        toast.error('Please set amounts for all payment methods');
        return;
      }
      
      // For POS, we don't validate against method balance since customer is paying
      // The balance represents the business's available funds, not customer's payment limit
      
      if (remainingAmount < 0) {
        toast.error('Payment amount exceeds required amount');
        return;
      }
    } else {
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
        
        await onPaymentComplete(paymentData, totalPaid);
      } else {
        // Process single payment
        const method = paymentMethods.find(m => m.id === selectedMethod);
        const account = getAutoSelectedAccount(selectedMethod);
        
        if (!method || !account) {
          toast.error('No compatible account found for this payment method');
          return;
        }

        const paymentData = [{
          amount: amount,
          paymentMethod: method.name,
          paymentMethodId: method.id,
          paymentAccountId: account.id,
          customerId: customerId,
          customerName: customerName,
          description: description,
          timestamp: new Date().toISOString()
        }];

        await onPaymentComplete(paymentData, totalPaid);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div 
        className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <CreditCard className="w-7 h-7 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Payment</h2>
                <p className="text-blue-100">
                  {customerName ? `Hello, ${customerName}!` : 'Complete your payment'}
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="p-3 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200 backdrop-blur-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Payment Summary */}
          <div className="mb-6 p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Total Amount Due</h3>
              <p className="text-3xl font-bold text-green-600 mb-2">
                TZS {amount.toLocaleString()}
              </p>
              {isMultipleMode && (
                <div className="mt-4 p-3 bg-white/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Paid:</span>
                      <p className="font-semibold text-green-600">TZS {totalPaid.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Remaining:</span>
                      <p className="font-semibold text-orange-600">TZS {remainingAmount.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Payment Mode Toggle */}
          <div className="mb-6">
            <div className="text-center mb-4">
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Choose Payment Method</h4>
              <p className="text-sm text-gray-600">Select how you'd like to pay</p>
            </div>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => setIsMultipleMode(false)}
                className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  !isMultipleMode 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                💳 Single Payment
              </button>
              <button
                onClick={() => setIsMultipleMode(true)}
                className={`px-6 py-3 rounded-xl font-medium text-sm transition-all duration-200 ${
                  isMultipleMode 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                💰 Split Payment
              </button>
            </div>
          </div>

          {/* Payment Methods */}
          {methodsLoading || accountsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-600">Loading payment methods...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {!isMultipleMode ? (
                /* Single Payment Mode */
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <h5 className="text-md font-semibold text-gray-900 mb-2">Select Your Payment Method</h5>
                    <p className="text-sm text-gray-600">Choose how you want to pay</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                          selectedMethod === method.id
                            ? 'border-blue-500 bg-blue-50 shadow-lg shadow-blue-500/20'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50/50'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                            selectedMethod === method.id ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <PaymentMethodIcon 
                              type={method.type} 
                              name={method.name} 
                              className="w-6 h-6" 
                            />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{method.name}</p>
                            <p className="text-sm text-gray-600">
                              Available: {method.currency} {method.balance.toLocaleString()}
                            </p>
                          </div>
                          {selectedMethod === method.id && (
                            <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-4 h-4 text-white" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Multiple Payment Mode */
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <h5 className="text-md font-semibold text-gray-900 mb-2">Split Your Payment</h5>
                    <p className="text-sm text-gray-600">Choose payment methods and amounts</p>
                  </div>
                  
                  {/* Payment Method Buttons */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <h4 className="text-sm font-semibold text-gray-800 mb-4 text-center">
                      Select Payment Methods
                    </h4>
                    <div className="grid grid-cols-2 gap-3">
                      {paymentMethods.map((method) => {
                        const isAlreadyAdded = paymentEntries.some(entry => entry.methodId === method.id);
                        const isDisabled = isProcessing || isAlreadyAdded;
                        
                        return (
                          <button
                            key={method.id}
                            onClick={() => {
                              if (!isAlreadyAdded) {
                                addPayment(method.id);
                              }
                            }}
                            disabled={isDisabled}
                            className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                              isDisabled
                                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isAlreadyAdded ? 'bg-green-100' : 'bg-gray-100'
                              }`}>
                                <PaymentMethodIcon 
                                  type={method.type} 
                                  name={method.name} 
                                  className="w-5 h-5" 
                                />
                              </div>
                              <div className="flex-1">
                                <p className="font-semibold text-sm text-gray-900">{method.name}</p>
                                <p className="text-xs text-gray-500">
                                  Available for payment
                                </p>
                                {isAlreadyAdded && (
                                  <p className="text-xs text-green-600 font-medium">Added</p>
                                )}
                              </div>
                              {isAlreadyAdded && (
                                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                </div>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Payment Entries - Compact Design */}
                  {paymentEntries.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-gray-800 mb-2 text-center">
                        Set Amounts
                      </h4>
                      {paymentEntries.map((entry, index) => (
                        <div key={entry.id} className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                          {/* Header Row - Method + Amount Input */}
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <PaymentMethodIcon 
                                type={paymentMethods.find(m => m.id === entry.methodId)?.type || 'other'} 
                                name={entry.method} 
                                className="w-4 h-4" 
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900 truncate">{entry.method}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="relative w-32">
                                <input
                                  type="number"
                                  value={entry.amount}
                                  onChange={(e) => updatePaymentEntry(index, 'amount', parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                />
                                <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                                  <span className="text-xs text-gray-500">TZS</span>
                                </div>
                              </div>
                              <button
                                onClick={() => removePayment(index)}
                                className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          
                          {/* Quick Actions Row */}
                          <div className="flex items-center justify-between">
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  const currentRemaining = amount - (totalPaid - entry.amount);
                                  updatePaymentEntry(index, 'amount', currentRemaining);
                                }}
                                className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                              >
                                Full
                              </button>
                              <button
                                onClick={() => {
                                  const currentRemaining = amount - (totalPaid - entry.amount);
                                  const evenSplit = Math.round(currentRemaining / paymentEntries.length);
                                  updatePaymentEntry(index, 'amount', evenSplit);
                                }}
                                className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                              >
                                Split
                              </button>
                            </div>
                            
                            {/* Optional Fields - Inline */}
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={entry.reference || ''}
                                onChange={(e) => updatePaymentEntry(index, 'reference', e.target.value)}
                                placeholder="Ref"
                                className="w-16 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              />
                              <input
                                type="text"
                                value={entry.notes || ''}
                                onChange={(e) => updatePaymentEntry(index, 'notes', e.target.value)}
                                placeholder="Notes"
                                className="w-20 px-2 py-1 border border-gray-300 rounded text-xs focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Payment Summary */}
          {paymentEntries.length > 0 && (
            <div className="mt-6 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-green-800">Payment Summary</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <span className="text-sm text-green-600 font-medium">Total Paid</span>
                  <p className="text-xl font-bold text-green-700">
                    TZS {totalPaid.toLocaleString()}
                  </p>
                </div>
                <div className="text-center p-3 bg-white/50 rounded-lg">
                  <span className="text-sm text-orange-600 font-medium">Remaining</span>
                  <p className={`text-xl font-bold ${remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    TZS {remainingAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-blue-50">
          <div className="text-sm text-gray-600">
            {remainingAmount > 0 ? (
              <span className="text-orange-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                TZS {remainingAmount.toLocaleString()} remaining
              </span>
            ) : (
              <span className="text-green-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Payment complete
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-6 py-3 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={isProcessing || (isMultipleMode ? paymentEntries.length === 0 : !selectedMethod)}
              className="px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-all duration-200 text-sm font-semibold shadow-lg shadow-green-500/25 flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  Complete Payment
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPopupModal;