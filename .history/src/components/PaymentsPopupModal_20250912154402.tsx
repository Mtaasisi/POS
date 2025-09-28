import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, Smartphone, Building, CheckCircle, Loader2, Plus, ArrowRight, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { usePaymentAccounts } from '../hooks/usePaymentAccounts';
import GlassCard from '../features/shared/components/ui/GlassCard';
import GlassButton from '../features/shared/components/ui/GlassButton';
import GlassInput from '../features/shared/components/ui/GlassInput';
import { toast } from 'react-hot-toast';

interface PaymentEntry {
  id: string;
  amount: number;
  paymentMethod: string;
  paymentAccountId: string;
  reference?: string;
  notes?: string;
  timestamp: string;
}

interface PaymentsPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  customerId?: string;
  customerName?: string;
  description?: string;
  onPaymentComplete: (payments: PaymentEntry[], totalPaid: number) => void;
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
  title = "Process Payment"
}) => {
  const { user } = useAuth();
  const { paymentMethods, loading: methodsLoading } = usePaymentMethods();
  const { paymentAccounts, loading: accountsLoading } = usePaymentAccounts();
  
  const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([]);
  const [currentAmount, setCurrentAmount] = useState(0);
  const [selectedMethod, setSelectedMethod] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPaymentEntries([]);
      setCurrentAmount(amount);
      setSelectedMethod('');
      setReference('');
      setNotes('');
    }
  }, [isOpen, amount]);

  const totalPaid = paymentEntries.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = amount - totalPaid;
  const isFullyPaid = remainingAmount <= 0;

  // Quick amount buttons with better values
  const quickAmounts = [
    { label: '25%', value: amount * 0.25, color: 'bg-blue-100 text-blue-700 hover:bg-blue-200' },
    { label: '50%', value: amount * 0.5, color: 'bg-green-100 text-green-700 hover:bg-green-200' },
    { label: '75%', value: amount * 0.75, color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200' },
    { label: 'Full', value: amount, color: 'bg-purple-100 text-purple-700 hover:bg-purple-200' }
  ];

  const handleQuickAmount = (value: number) => {
    setCurrentAmount(Math.min(value, remainingAmount));
  };

  // Auto-select the first available account for the selected payment method
  const getAutoSelectedAccount = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    if (!method) return null;

    const compatibleAccount = paymentAccounts.find(account => 
      account.type === method.type || 
      (method.type === 'mobile_money' && account.type === 'mobile_money') ||
      (method.type === 'credit_card' && account.type === 'credit_card')
    );

    return compatibleAccount;
  };

  const addPayment = () => {
    if (!selectedMethod || currentAmount <= 0) {
      toast.error('Please select a payment method and enter an amount');
      return;
    }

    if (currentAmount > remainingAmount) {
      toast.error('Payment amount cannot exceed remaining amount');
      return;
    }

    const method = paymentMethods.find(m => m.id === selectedMethod);
    const account = getAutoSelectedAccount(selectedMethod);

    if (!method || !account) {
      toast.error('No compatible account found for this payment method');
      return;
    }

    const newPayment: PaymentEntry = {
      id: Date.now().toString(),
      amount: currentAmount,
      paymentMethod: method.name,
      paymentAccountId: account.id,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
      timestamp: new Date().toISOString()
    };

    setPaymentEntries(prev => [...prev, newPayment]);
    setCurrentAmount(remainingAmount - currentAmount);
    setReference('');
    setNotes('');
    toast.success('Payment added successfully');
  };

  const removePayment = (id: string) => {
    setPaymentEntries(prev => prev.filter(p => p.id !== id));
    toast.success('Payment removed');
  };

  const handleSubmit = async () => {
    if (paymentEntries.length === 0) {
      toast.error('Please add at least one payment');
      return;
    }

    setIsProcessing(true);
    try {
      await onPaymentComplete(paymentEntries, totalPaid);
      toast.success('Payment processed successfully');
      onClose();
    } catch (error) {
      toast.error('Failed to process payment');
      console.error('Payment processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getMethodIcon = (type: string) => {
    const icons = {
      'cash': <DollarSign className="w-5 h-5" />,
      'credit_card': <CreditCard className="w-5 h-5" />,
      'mobile_money': <Smartphone className="w-5 h-5" />,
      'bank': <Building className="w-5 h-5" />,
      'bank_transfer': <Building className="w-5 h-5" />
    };
    return icons[type as keyof typeof icons] || <DollarSign className="w-5 h-5" />;
  };

  const getMethodColor = (type: string) => {
    const colors = {
      'cash': 'bg-green-50 border-green-200 text-green-800',
      'credit_card': 'bg-blue-50 border-blue-200 text-blue-800',
      'mobile_money': 'bg-purple-50 border-purple-200 text-purple-800',
      'bank': 'bg-gray-50 border-gray-200 text-gray-800',
      'bank_transfer': 'bg-indigo-50 border-indigo-200 text-indigo-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-50 border-gray-200 text-gray-800';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl max-h-[95vh] overflow-hidden">
        <GlassCard className="p-0 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">{title}</h2>
                <p className="text-blue-100 mt-1">Process payment securely</p>
              </div>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                disabled={isProcessing}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
            {/* Customer Info Card */}
            {(customerName || description) && (
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">Payment Details</h3>
                    <p className="text-sm text-gray-600">Transaction information</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {customerName && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Customer</div>
                      <div className="font-medium text-gray-800">{customerName}</div>
                    </div>
                  )}
                  {description && (
                    <div>
                      <div className="text-sm text-gray-600 mb-1">Description</div>
                      <div className="font-medium text-gray-800">{description}</div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <div className="text-sm text-gray-600 mb-1">Total Amount</div>
                  <div className="text-3xl font-bold text-green-600">${amount.toFixed(2)}</div>
                </div>
              </div>
            )}

            {/* Payment Progress */}
            <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Payment Progress</h3>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  <span className="text-sm text-gray-600">{Math.round((totalPaid / amount) * 100)}% Complete</span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-800">${amount.toFixed(2)}</div>
                  <div className="text-sm text-gray-600">Total</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${totalPaid > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                    ${totalPaid.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Paid</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${remainingAmount.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600">Remaining</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${
                    isFullyPaid ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-blue-500 to-indigo-500'
                  }`}
                  style={{ width: `${Math.min((totalPaid / amount) * 100, 100)}%` }}
                />
              </div>
            </div>

            {/* Add Payment Form */}
            <div className="mb-6 p-6 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Plus className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Add Payment</h3>
                  <p className="text-sm text-gray-600">Select method and enter amount</p>
                </div>
              </div>
              
              {/* Amount Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Amount
                </label>
                <div className="relative">
                  <GlassInput
                    type="number"
                    value={currentAmount || ''}
                    onChange={(e) => setCurrentAmount(Number(e.target.value))}
                    placeholder="0.00"
                    min="0"
                    max={remainingAmount}
                    leftIcon={<DollarSign className="w-5 h-5" />}
                    className="text-lg font-semibold"
                  />
                </div>
                
                {/* Quick Amount Buttons */}
                <div className="flex gap-2 mt-3">
                  {quickAmounts.map((quick) => (
                    <button
                      key={quick.label}
                      onClick={() => handleQuickAmount(quick.value)}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${quick.color} ${
                        quick.value > remainingAmount ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={quick.value > remainingAmount}
                    >
                      {quick.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {paymentMethods.map((method) => {
                    const autoAccount = getAutoSelectedAccount(method.id);
                    const isSelected = selectedMethod === method.id;
                    return (
                      <button
                        key={method.id}
                        onClick={() => setSelectedMethod(method.id)}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 shadow-md'
                            : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            isSelected ? 'bg-blue-100 text-blue-600' : getMethodColor(method.type)
                          }`}>
                            {getMethodIcon(method.type)}
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-gray-800">{method.name}</div>
                            {autoAccount && (
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <ArrowRight className="w-3 h-3" />
                                {autoAccount.name}
                              </div>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Reference and Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reference Number
                  </label>
                  <GlassInput
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="Optional reference"
                    disabled={isProcessing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <GlassInput
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              <GlassButton
                onClick={addPayment}
                disabled={!selectedMethod || currentAmount <= 0 || isProcessing}
                className="w-full py-3 text-lg font-semibold"
                icon={<Plus className="w-5 h-5" />}
              >
                Add Payment
              </GlassButton>
            </div>

            {/* Payment Entries */}
            {paymentEntries.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800">Payment Entries</h3>
                </div>
                <div className="space-y-3">
                  {paymentEntries.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          {getMethodIcon(payment.paymentMethod.toLowerCase().replace(/\s+/g, '_'))}
                        </div>
                        <div>
                          <div className="font-medium text-gray-800">
                            ${payment.amount.toFixed(2)} - {payment.paymentMethod}
                          </div>
                          {payment.reference && (
                            <div className="text-sm text-gray-600">Ref: {payment.reference}</div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removePayment(payment.id)}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                        disabled={isProcessing}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <GlassButton
                onClick={onClose}
                variant="secondary"
                className="flex-1 py-3"
                disabled={isProcessing}
              >
                Cancel
              </GlassButton>
              
              <GlassButton
                onClick={handleSubmit}
                className="flex-1 py-3 text-lg font-semibold"
                disabled={paymentEntries.length === 0 || isProcessing}
                loading={isProcessing}
                icon={isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />}
              >
                {isProcessing ? 'Processing...' : 'Complete Payment'}
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default PaymentsPopupModal;