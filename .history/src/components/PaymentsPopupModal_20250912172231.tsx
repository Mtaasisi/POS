import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, Smartphone, Building, CheckCircle, Loader2, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { usePaymentAccounts } from '../hooks/usePaymentAccounts';
import GlassButton from '../features/shared/components/ui/GlassButton';
import GlassInput from '../features/shared/components/ui/GlassInput';
import PaymentMethodIcon from './PaymentMethodIcon';
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
  title = "Payment"
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
  const [isMultiplePaymentMode, setIsMultiplePaymentMode] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setPaymentEntries([]);
      setCurrentAmount(amount);
      setSelectedMethod('');
      setReference('');
      setNotes('');
      setIsMultiplePaymentMode(false); // Default to single payment mode
    }
  }, [isOpen, amount]);

  const totalPaid = paymentEntries.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = amount - totalPaid;
  const isFullyPaid = remainingAmount <= 0;

  // Quick amount buttons with colors
  const quickAmounts = [
    { label: '25%', value: amount * 0.25, color: 'bg-blue-500/20 border-blue-400/30 text-blue-200 hover:bg-blue-500/30' },
    { label: '50%', value: amount * 0.5, color: 'bg-green-500/20 border-green-400/30 text-green-200 hover:bg-green-500/30' },
    { label: '75%', value: amount * 0.75, color: 'bg-yellow-500/20 border-yellow-400/30 text-yellow-200 hover:bg-yellow-500/30' },
    { label: 'Full', value: amount, color: 'bg-purple-500/20 border-purple-400/30 text-purple-200 hover:bg-purple-500/30' }
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

    if (isMultiplePaymentMode && currentAmount > remainingAmount) {
      toast.error('Payment amount cannot exceed remaining amount');
      return;
    }

    if (!isMultiplePaymentMode && currentAmount !== amount) {
      toast.error('Amount must match the total for single payment');
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

    if (isMultiplePaymentMode) {
      // Multiple payment mode - add to entries
      setPaymentEntries(prev => [...prev, newPayment]);
      setCurrentAmount(remainingAmount - currentAmount);
      setReference('');
      setNotes('');
      toast.success('Payment added');
    } else {
      // Single payment mode - add to entries and process
      setPaymentEntries([newPayment]);
      handleSubmit();
    }
  };

  const removePayment = (id: string) => {
    setPaymentEntries(prev => prev.filter(p => p.id !== id));
  };

  const handleSubmit = async () => {
    if (paymentEntries.length === 0) {
      toast.error('Please add at least one payment');
      return;
    }

    setIsProcessing(true);
    try {
      await onPaymentComplete(paymentEntries, totalPaid);
      toast.success('Payment completed');
      onClose();
    } catch (error) {
      toast.error('Payment failed');
      console.error('Payment processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getMethodIcon = (type: string, name?: string) => {
    return <PaymentMethodIcon type={type} name={name} size="sm" />;
  };

  const getMethodColor = (type: string) => {
    const colors = {
      'cash': 'bg-green-500/20 border-green-400/40 text-green-100 hover:bg-green-500/30',
      'credit_card': 'bg-blue-500/20 border-blue-400/40 text-blue-100 hover:bg-blue-500/30',
      'mobile_money': 'bg-purple-500/20 border-purple-400/40 text-purple-100 hover:bg-purple-500/30',
      'bank': 'bg-gray-500/20 border-gray-400/40 text-gray-100 hover:bg-gray-500/30',
      'bank_transfer': 'bg-indigo-500/20 border-indigo-400/40 text-indigo-100 hover:bg-indigo-500/30'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500/20 border-gray-400/40 text-gray-100 hover:bg-gray-500/30';
  };

  const getMethodSelectedColor = (type: string) => {
    const colors = {
      'cash': 'bg-gradient-to-br from-green-500 to-green-600 border-green-200 text-white shadow-2xl shadow-green-500/50 ring-4 ring-green-300/60',
      'credit_card': 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-200 text-white shadow-2xl shadow-blue-500/50 ring-4 ring-blue-300/60',
      'mobile_money': 'bg-gradient-to-br from-purple-500 to-purple-600 border-purple-200 text-white shadow-2xl shadow-purple-500/50 ring-4 ring-purple-300/60',
      'bank': 'bg-gradient-to-br from-gray-600 to-gray-700 border-gray-300 text-white shadow-2xl shadow-gray-500/50 ring-4 ring-gray-400/60',
      'bank_transfer': 'bg-gradient-to-br from-indigo-500 to-indigo-600 border-indigo-200 text-white shadow-2xl shadow-indigo-500/50 ring-4 ring-indigo-300/60'
    };
    return colors[type as keyof typeof colors] || 'bg-gradient-to-br from-gray-600 to-gray-700 border-gray-300 text-white shadow-2xl shadow-gray-500/50 ring-4 ring-gray-400/60';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl">
        {/* Glassmorphism Modal */}
        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-semibold text-white">{title}</h2>
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                    isMultiplePaymentMode 
                      ? 'bg-blue-500/20 text-blue-200 border border-blue-400/30' 
                      : 'bg-green-500/20 text-green-200 border border-green-400/30'
                  }`}>
                    {isMultiplePaymentMode ? 'Multiple' : 'Single'}
                  </div>
                </div>
                <p className="text-white/70 text-sm">${amount.toFixed(2)}</p>
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
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                {customerName && (
                  <div className="text-white/90 text-sm mb-1">{customerName}</div>
                )}
                {description && (
                  <div className="text-white/70 text-xs">{description}</div>
                )}
              </div>
            )}

            {/* Payment Mode Toggle */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white/90 text-sm font-medium">Payment Mode</h3>
                  <p className="text-white/60 text-xs">
                    {isMultiplePaymentMode ? 'Split payment across multiple methods' : 'Single payment method'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsMultiplePaymentMode(!isMultiplePaymentMode);
                    if (!isMultiplePaymentMode) {
                      // Switching to multiple mode - clear current entries
                      setPaymentEntries([]);
                      setSelectedMethod('');
                    } else {
                      // Switching to single mode - clear entries and reset amount
                      setPaymentEntries([]);
                      setCurrentAmount(amount);
                    }
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isMultiplePaymentMode ? 'bg-blue-500' : 'bg-gray-600'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isMultiplePaymentMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Progress - Only show in multiple payment mode */}
            {isMultiplePaymentMode && (
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-white/90 text-sm">Progress</span>
                  <span className="text-white/70 text-sm">{Math.round((totalPaid / amount) * 100)}%</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-white/80 rounded-full h-2 transition-all duration-500"
                    style={{ width: `${Math.min((totalPaid / amount) * 100, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-white/70">
                  <span>Paid: ${totalPaid.toFixed(2)}</span>
                  <span>Remaining: ${remainingAmount.toFixed(2)}</span>
                </div>
              </div>
            )}

            {/* Amount Input */}
            <div className="space-y-3">
              <label className="text-white/90 text-sm">
                {isMultiplePaymentMode ? 'Payment Amount' : 'Amount'}
              </label>
              <GlassInput
                type="number"
                value={currentAmount || ''}
                onChange={(e) => setCurrentAmount(Number(e.target.value))}
                placeholder="0.00"
                min="0"
                max={isMultiplePaymentMode ? remainingAmount : amount}
                leftIcon={<DollarSign className="w-4 h-4" />}
                className="bg-white/10 border-white/20 text-white placeholder-white/50"
              />
              {isMultiplePaymentMode && (
                <p className="text-white/60 text-xs">
                  Remaining: ${remainingAmount.toFixed(2)}
                </p>
              )}
              
              {/* Quick Amounts */}
              <div className="flex gap-2">
                {quickAmounts.map((quick) => (
                  <button
                    key={quick.label}
                    onClick={() => handleQuickAmount(quick.value)}
                    className={`px-3 py-1 text-xs rounded-lg transition-all border font-medium ${quick.color}`}
                    disabled={quick.value > remainingAmount}
                  >
                    {quick.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <label className="text-white/90 text-sm">Method</label>
              <div className="grid grid-cols-2 gap-4">
                {paymentMethods.map((method) => {
                  const autoAccount = getAutoSelectedAccount(method.id);
                  const isSelected = selectedMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 text-left transform hover:scale-105 ${
                        isSelected
                          ? `${getMethodSelectedColor(method.type)} ring-4 ring-white/30 shadow-2xl`
                          : `${getMethodColor(method.type)} hover:opacity-90 hover:shadow-lg hover:border-white/40`
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="opacity-80">
                          {getMethodIcon(method.type, method.name)}
                        </div>
                        <div className="text-sm">
                          <div className="font-semibold">{method.name}</div>
                          {autoAccount && (
                            <div className="opacity-80 truncate text-xs">{autoAccount.name}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Reference & Notes */}
            <div className="grid grid-cols-2 gap-3">
              <GlassInput
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Reference"
                disabled={isProcessing}
                className="bg-white/10 border-white/20 text-white placeholder-white/50 text-sm"
              />
              <GlassInput
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes"
                disabled={isProcessing}
                className="bg-white/10 border-white/20 text-white placeholder-white/50 text-sm"
              />
            </div>

            {/* Add Payment Button */}
            <GlassButton
              onClick={addPayment}
              disabled={!selectedMethod || currentAmount <= 0 || isProcessing}
              className="w-full bg-green-500/20 hover:bg-green-500/30 border-green-400/30 text-green-100 font-medium"
              icon={<Plus className="w-4 h-4" />}
            >
              {isMultiplePaymentMode ? 'Add Payment' : 'Process Payment'}
            </GlassButton>

            {/* Payment Entries - Only show in multiple payment mode */}
            {isMultiplePaymentMode && paymentEntries.length > 0 && (
              <div className="space-y-2">
                <div className="text-white/90 text-sm">Payments</div>
                {paymentEntries.map((payment) => {
                  const methodType = payment.paymentMethod.toLowerCase().replace(/\s+/g, '_');
                  return (
                    <div key={payment.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="text-white/70">
                          {getMethodIcon(methodType)}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-white/90">
                            ${payment.amount.toFixed(2)} - {payment.paymentMethod}
                          </div>
                          {payment.reference && (
                            <div className="text-white/60 text-xs">Ref: {payment.reference}</div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removePayment(payment.id)}
                        className="text-white/50 hover:text-white/80 hover:bg-red-500/20 transition-all p-1 rounded"
                        disabled={isProcessing}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <GlassButton
                onClick={onClose}
                variant="secondary"
                className="flex-1 bg-gray-500/20 hover:bg-gray-500/30 border-gray-400/30 text-gray-100 font-medium"
                disabled={isProcessing}
              >
                Cancel
              </GlassButton>
              
              <GlassButton
                onClick={handleSubmit}
                className="flex-1 bg-purple-500/20 hover:bg-purple-500/30 border-purple-400/30 text-purple-100 font-medium"
                disabled={paymentEntries.length === 0 || isProcessing}
                loading={isProcessing}
                icon={isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
              >
                {isProcessing ? 'Processing...' : (isMultiplePaymentMode ? 'Complete All Payments' : 'Complete Payment')}
              </GlassButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPopupModal;