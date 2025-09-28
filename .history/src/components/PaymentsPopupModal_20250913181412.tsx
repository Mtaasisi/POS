import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Loader2, CreditCard, DollarSign, AlertCircle, CheckCircle2, Plus, Edit3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { usePaymentAccounts } from '../hooks/usePaymentAccounts';
import PaymentMethodIcon from './PaymentMethodIcon';
import { devicePriceService } from '../lib/devicePriceService';
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
  deviceId?: string; // For price updates
  allowPriceEdit?: boolean; // Enable price editing feature
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
  title = "Payment",
  deviceId,
  allowPriceEdit = false
}) => {
  const { user } = useAuth();
  const { paymentMethods, loading: methodsLoading } = usePaymentMethods();
  const { paymentAccounts, loading: accountsLoading } = usePaymentAccounts();
  
  const [selectedMethod, setSelectedMethod] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMultipleMode, setIsMultipleMode] = useState(false);
  const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([]);
  const [customAmount, setCustomAmount] = useState('');
  const [showPriceEdit, setShowPriceEdit] = useState(false);
  const [newPrice, setNewPrice] = useState(amount.toString());
  const [priceEditReason, setPriceEditReason] = useState('');

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

    const amount = paymentAmount || parseFloat(customAmount) || remainingAmount;
    
    if (amount <= 0) {
      toast.error('Please enter a valid amount');
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
      notes: ''
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
        className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Complete Your Payment</h2>
              <p className="text-sm text-gray-600">
                {customerName ? `Thank you, ${customerName}!` : 'Secure payment processing'}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
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
                    <h5 className="text-md font-semibold text-gray-900 mb-2">How would you like to pay?</h5>
                    <p className="text-sm text-gray-600">Select your preferred payment method</p>
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
                              Accept payments via {method.name}
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
                    <p className="text-sm text-gray-600">Use multiple payment methods if needed</p>
                  </div>
                  
                  {/* Add Payment Section */}
                  <div className="p-5 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <h4 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      Add Another Payment Method
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                        <input
                          type="number"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              addPayment(e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                           <option value="">Choose method</option>
                           {paymentMethods.map((method) => (
                             <option key={method.id} value={method.id}>
                               {method.name} - Accept {method.currency} payments
                             </option>
                           ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <button
                          onClick={() => {
                            if (selectedMethod) {
                              addPayment(selectedMethod);
                            }
                          }}
                          className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Add Method
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Payment Entries */}
                  {paymentEntries.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-gray-800 mb-3">Your Payment Methods</h4>
                      {paymentEntries.map((entry, index) => (
                        <div key={entry.id} className="p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                <PaymentMethodIcon 
                                  type={paymentMethods.find(m => m.id === entry.methodId)?.type || 'other'} 
                                  name={entry.method} 
                                  className="w-5 h-5" 
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-gray-900">{entry.method}</p>
                                <p className="text-sm text-gray-600">{entry.account}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => removePayment(index)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                              <input
                                type="number"
                                value={entry.amount}
                                onChange={(e) => updatePaymentEntry(index, 'amount', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Reference</label>
                              <input
                                type="text"
                                value={entry.reference || ''}
                                onChange={(e) => updatePaymentEntry(index, 'reference', e.target.value)}
                                placeholder="Optional"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                              <input
                                type="text"
                                value={entry.notes || ''}
                                onChange={(e) => updatePaymentEntry(index, 'notes', e.target.value)}
                                placeholder="Optional"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

          {/* Price Edit Section - Show when customer pays more than original amount */}
          {allowPriceEdit && deviceId && totalPaid > amount && (
            <div className="mt-6 p-5 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center">
                  <Edit3 className="w-5 h-5 text-white" />
                </div>
                <h4 className="text-lg font-semibold text-amber-800">Customer Paid More</h4>
              </div>
              
              <div className="space-y-4">
                <div className="p-3 bg-white/50 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Original Price:</span>
                      <p className="font-semibold text-gray-700">TZS {amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Amount Paid:</span>
                      <p className="font-semibold text-green-600">TZS {totalPaid.toLocaleString()}</p>
                    </div>
                  </div>
                </div>

                {!showPriceEdit ? (
                  <div className="space-y-3">
                    <p className="text-sm text-amber-700">
                      Customer paid <span className="font-semibold">TZS {(totalPaid - amount).toLocaleString()}</span> more than the original price.
                    </p>
                    <button
                      onClick={() => setShowPriceEdit(true)}
                      className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Update Price to Match Payment
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-amber-800 mb-2">
                        New Repair Price
                      </label>
                      <input
                        type="number"
                        value={newPrice}
                        onChange={(e) => setNewPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        placeholder="Enter new price"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-amber-800 mb-2">
                        Reason for Price Change
                      </label>
                      <textarea
                        value={priceEditReason}
                        onChange={(e) => setPriceEditReason(e.target.value)}
                        className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                        rows={2}
                        placeholder="e.g., Customer paid more, additional services provided..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={async () => {
                          if (!deviceId || !user?.id) return;
                          
                          try {
                            await devicePriceService.updateDeviceRepairPrice({
                              deviceId,
                              repairPrice: parseFloat(newPrice),
                              updatedBy: user.id,
                              reason: priceEditReason || 'Price adjusted to match customer payment'
                            });
                            
                            toast.success('Device price updated successfully');
                            setShowPriceEdit(false);
                          } catch (error) {
                            console.error('Error updating device price:', error);
                            toast.error('Failed to update device price');
                          }
                        }}
                        className="flex-1 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
                      >
                        Update Price
                      </button>
                      <button
                        onClick={() => setShowPriceEdit(false)}
                        className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
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