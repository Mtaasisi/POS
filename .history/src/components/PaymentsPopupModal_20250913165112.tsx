import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Loader2, CreditCard, DollarSign, AlertCircle, CheckCircle2 } from 'lucide-react';
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
  showReference?: boolean;
  showNotes?: boolean;
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

    const amount = paymentAmount || parseFloat(customAmount) || 0;
    
    if (amount < 0) {
      toast.error('Amount cannot be negative');
      return;
    }

    if (amount > remainingAmount) {
      toast.error('Amount exceeds remaining balance');
      return;
    }

    const newEntry: PaymentEntry = {
      id: crypto.randomUUID(),
      method: method.name,
      methodId: method.id,
      amount: amount,
      account: account.name,
      accountId: account.id,
      reference: '',
      notes: '',
      showReference: false,
      showNotes: false
    };

    setPaymentEntries(prev => [...prev, newEntry]);
    setCustomAmount('');
  };

  const removePayment = (index: number) => {
    setPaymentEntries(prev => prev.filter((_, i) => i !== index));
  };

  const updatePaymentEntry = (index: number, field: keyof PaymentEntry, value: string | number) => {
    setPaymentEntries(prev => prev.map((entry, i) => 
      i === index ? { ...entry, [field]: value } : entry
    ));
  };

  const handlePayment = async () => {
    if (isMultipleMode) {
      if (paymentEntries.length === 0) {
        toast.error('Please add at least one payment');
        return;
      }
      
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
        className="relative bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[95vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <p className="text-sm text-gray-500">
                {customerName ? `Customer: ${customerName}` : 'Payment Processing'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(95vh-140px)]">
          {/* Payment Summary */}
          <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-blue-800">Payment Summary</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-blue-600 uppercase tracking-wide">Total Amount</span>
                <p className="text-lg font-bold text-blue-900">
                  TZS {amount.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-xs text-blue-600 uppercase tracking-wide">Remaining</span>
                <p className="text-lg font-bold text-blue-900">
                  TZS {remainingAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Mode Toggle */}
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMultipleMode(false)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  !isMultipleMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Single Payment
              </button>
              <button
                onClick={() => setIsMultipleMode(true)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  isMultipleMode 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                Multiple Payments
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Payment Method
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedMethod(method.id)}
                          className={`p-4 rounded-lg border-2 transition-colors text-left ${
                            selectedMethod === method.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <PaymentMethodIcon 
                              type={method.type} 
                              name={method.name} 
                              className="w-6 h-6" 
                            />
                            <div>
                              <p className="font-medium text-sm text-gray-900">{method.name}</p>
                              <p className="text-xs text-gray-500">
                                Balance: {method.currency} {method.balance.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Multiple Payment Mode */
                <div className="space-y-4">
                  {/* Add Payment Section */}
                  <div className="p-6 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-4">Add Payment</h4>
                    
                    {/* Amount Input */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                      <input
                        type="number"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        placeholder="Enter amount"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    {/* Payment Method Buttons */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Select Payment Method</label>
                      <div className="grid grid-cols-2 gap-3">
                        {paymentMethods.map((method) => {
                          const isAlreadyAdded = paymentEntries.some(entry => entry.methodId === method.id);
                          const isDisabled = isProcessing || isAlreadyAdded;
                          
                          return (
                            <button
                              key={method.id}
                              onClick={() => addPayment(method.id)}
                              disabled={isDisabled}
                              className={`p-4 rounded-lg border-2 transition-colors text-left ${
                                isDisabled
                                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <PaymentMethodIcon 
                                  type={method.type} 
                                  name={method.name} 
                                  className="w-6 h-6" 
                                />
                                <div>
                                  <p className="font-medium text-sm text-gray-900">{method.name}</p>
                                  <p className="text-xs text-gray-500">
                                    Balance: {method.currency} {method.balance.toLocaleString()}
                                  </p>
                                  {isAlreadyAdded && (
                                    <p className="text-xs text-orange-600">Already added</p>
                                  )}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Payment Entries */}
                  {paymentEntries.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Payment Entries</h4>
                      {paymentEntries.map((entry, index) => (
                        <div key={entry.id} className="p-6 bg-white border border-gray-200 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <PaymentMethodIcon 
                                type={paymentMethods.find(m => m.id === entry.methodId)?.type || 'other'} 
                                name={entry.method} 
                                className="w-5 h-5" 
                              />
                              <div>
                                <p className="font-medium text-sm text-gray-900">{entry.method}</p>
                                <p className="text-xs text-gray-500">{entry.account}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => removePayment(index)}
                              className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="space-y-4">
                            {/* Amount Field - Optional */}
                            <div>
                              <div className="flex items-center justify-between mb-2">
                                <label className="block text-sm font-medium text-gray-700">Amount</label>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs text-gray-500">Auto: TZS {remainingAmount.toLocaleString()}</span>
                                  <button
                                    onClick={() => {
                                      updatePaymentEntry(index, 'amount', remainingAmount);
                                    }}
                                    className="text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 bg-blue-50 rounded hover:bg-blue-100 transition-colors"
                                  >
                                    Use Full
                                  </button>
                                </div>
                              </div>
                              <div className="relative">
                                <input
                                  type="number"
                                  value={entry.amount || ''}
                                  onChange={(e) => updatePaymentEntry(index, 'amount', parseFloat(e.target.value) || 0)}
                                  placeholder="Enter amount or use full amount"
                                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                />
                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                  <span className="text-xs text-gray-500">TZS</span>
                                </div>
                              </div>
                              {entry.amount > remainingAmount && (
                                <p className="text-xs text-red-600 mt-1">
                                  Amount exceeds remaining balance (TZS {remainingAmount.toLocaleString()})
                                </p>
                              )}
                            </div>

                            {/* Optional Fields - Only show for non-cash payments */}
                            {entry.method.toLowerCase() !== 'cash' && (
                              <div className="space-y-3">
                                {/* Reference Field */}
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs text-gray-500">Reference</label>
                                    <button
                                      onClick={() => {
                                        updatePaymentEntry(index, 'showReference', !entry.showReference);
                                        if (entry.showReference) {
                                          updatePaymentEntry(index, 'reference', '');
                                        }
                                      }}
                                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                      {entry.showReference ? 'Remove' : 'Add'}
                                    </button>
                                  </div>
                                  {entry.showReference && (
                                    <input
                                      type="text"
                                      value={entry.reference || ''}
                                      onChange={(e) => updatePaymentEntry(index, 'reference', e.target.value)}
                                      placeholder="Enter reference number"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  )}
                                </div>

                                {/* Notes Field */}
                                <div>
                                  <div className="flex items-center justify-between mb-1">
                                    <label className="block text-xs text-gray-500">Notes</label>
                                    <button
                                      onClick={() => {
                                        updatePaymentEntry(index, 'showNotes', !entry.showNotes);
                                        if (entry.showNotes) {
                                          updatePaymentEntry(index, 'notes', '');
                                        }
                                      }}
                                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                      {entry.showNotes ? 'Remove' : 'Add'}
                                    </button>
                                  </div>
                                  {entry.showNotes && (
                                    <input
                                      type="text"
                                      value={entry.notes || ''}
                                      onChange={(e) => updatePaymentEntry(index, 'notes', e.target.value)}
                                      placeholder="Enter notes"
                                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    />
                                  )}
                                </div>
                              </div>
                            )}
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
            <div className="mt-8 p-6 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h4 className="text-sm font-semibold text-green-800">Payment Summary</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-green-600 uppercase tracking-wide">Total Paid</span>
                  <p className="text-lg font-bold text-green-900">
                    TZS {totalPaid.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-green-600 uppercase tracking-wide">Remaining</span>
                  <p className={`text-lg font-bold ${remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    TZS {remainingAmount.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50">
          <div className="text-sm text-gray-600">
            {remainingAmount > 0 ? (
              <span className="text-orange-600">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                TZS {remainingAmount.toLocaleString()} remaining
              </span>
            ) : (
              <span className="text-green-600">
                <CheckCircle2 className="w-4 h-4 inline mr-1" />
                Payment complete
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-sm font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handlePayment}
              disabled={isProcessing || (isMultipleMode ? paymentEntries.length === 0 : !selectedMethod)}
              className="px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
            >
              {isProcessing ? 'Processing...' : 'Process Payment'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPopupModal;