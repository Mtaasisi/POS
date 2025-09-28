import React, { useState, useEffect } from 'react';
import { X, CreditCard, DollarSign, Building, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { usePaymentMethods } from '../../../hooks/usePaymentMethods';
import { usePaymentAccounts } from '../../../hooks/usePaymentAccounts';
import { PurchaseOrder } from '../../lats/types/inventory';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import PaymentMethodIcon from '../../../components/PaymentMethodIcon';

interface PurchaseOrderPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder;
  onPaymentComplete: (paymentData: any) => Promise<void>;
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

const PurchaseOrderPaymentModal: React.FC<PurchaseOrderPaymentModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  onPaymentComplete
}) => {
  const { currentUser } = useAuth();
  const { paymentMethods, loading: methodsLoading } = usePaymentMethods();
  const { paymentAccounts, loading: accountsLoading } = usePaymentAccounts();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMultipleMode, setIsMultipleMode] = useState(false);
  const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([]);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [customAmount, setCustomAmount] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setIsMultipleMode(false);
      setPaymentEntries([]);
      setSelectedMethod('');
      setCustomAmount('');
    }
  }, [isOpen]);

  // Calculate totals
  const totalPaid = paymentEntries.reduce((sum, entry) => sum + entry.amount, 0);
  const remainingAmount = purchaseOrder.totalAmount - totalPaid;

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
          id: entry.id,
          amount: entry.amount,
          currency: purchaseOrder.currency || 'TZS', // Pass the purchase order currency
          paymentMethod: entry.method,
          paymentMethodId: entry.methodId,
          paymentAccountId: entry.accountId,
          purchaseOrderId: purchaseOrder.id,
          purchaseOrderNumber: purchaseOrder.orderNumber,
          supplierId: purchaseOrder.supplierId,
          supplierName: purchaseOrder.supplier?.name,
          reference: entry.reference || undefined,
          notes: entry.notes || undefined,
          timestamp: new Date().toISOString(),
          createdBy: currentUser.id
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

        const paymentData = [{
          id: crypto.randomUUID(),
          amount: purchaseOrder.totalAmount,
          currency: purchaseOrder.currency || 'TZS', // Pass the purchase order currency
          paymentMethod: method.name,
          paymentMethodId: method.id,
          paymentAccountId: account.id,
          purchaseOrderId: purchaseOrder.id,
          purchaseOrderNumber: purchaseOrder.orderNumber,
          supplierId: purchaseOrder.supplierId,
          supplierName: purchaseOrder.supplier?.name,
          timestamp: new Date().toISOString(),
          createdBy: currentUser.id
        }];

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
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Purchase Order Payment</h2>
              <p className="text-sm text-gray-500">
                {purchaseOrder.orderNumber} - {purchaseOrder.supplier?.name}
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {/* Payment Summary */}
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-semibold text-blue-800">Payment Summary</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-blue-600 uppercase tracking-wide">Total Amount</span>
                <p className="text-lg font-bold text-blue-900">
                  {purchaseOrder.currency} {purchaseOrder.totalAmount.toLocaleString()}
                </p>
              </div>
              <div>
                <span className="text-xs text-blue-600 uppercase tracking-wide">Remaining</span>
                <p className="text-lg font-bold text-blue-900">
                  {purchaseOrder.currency} {remainingAmount.toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Payment Mode Toggle */}
          <div className="mb-6">
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
                    <div className="grid grid-cols-2 gap-3">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.id}
                          onClick={() => setSelectedMethod(method.id)}
                          className={`p-3 rounded-lg border-2 transition-colors text-left ${
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
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700 mb-3">Add Payment</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Amount</label>
                        <input
                          type="number"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          placeholder="Enter amount"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Method</label>
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              addPayment(e.target.value);
                              e.target.value = '';
                            }
                          }}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">Select method</option>
                          {paymentMethods.map((method) => (
                            <option key={method.id} value={method.id}>
                              {method.name} ({method.currency} {method.balance.toLocaleString()})
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
                          className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Add Payment
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Payment Entries */}
                  {paymentEntries.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-sm font-medium text-gray-700">Payment Entries</h4>
                      {paymentEntries.map((entry, index) => (
                        <div key={entry.id} className="p-4 bg-white border border-gray-200 rounded-lg">
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
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Amount</label>
                              <input
                                type="number"
                                value={entry.amount}
                                onChange={(e) => updatePaymentEntry(index, 'amount', parseFloat(e.target.value) || 0)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Reference</label>
                              <input
                                type="text"
                                value={entry.reference || ''}
                                onChange={(e) => updatePaymentEntry(index, 'reference', e.target.value)}
                                placeholder="Optional"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Notes</label>
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

          {/* Payment Summary */}
          {paymentEntries.length > 0 && (
            <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <h4 className="text-sm font-semibold text-green-800">Payment Summary</h4>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs text-green-600 uppercase tracking-wide">Total Paid</span>
                  <p className="text-lg font-bold text-green-900">
                    {purchaseOrder.currency} {totalPaid.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-green-600 uppercase tracking-wide">Remaining</span>
                  <p className={`text-lg font-bold ${remainingAmount > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                    {purchaseOrder.currency} {remainingAmount.toLocaleString()}
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
                {purchaseOrder.currency} {remainingAmount.toLocaleString()} remaining
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

export default PurchaseOrderPaymentModal;
