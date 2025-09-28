import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, Smartphone, Building, CheckCircle, Loader2, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { usePaymentAccounts } from '../hooks/usePaymentAccounts';
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
    toast.success('Payment added');
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

  const getMethodIcon = (type: string) => {
    const icons = {
      'cash': <DollarSign className="w-4 h-4" />,
      'credit_card': <CreditCard className="w-4 h-4" />,
      'mobile_money': <Smartphone className="w-4 h-4" />,
      'bank': <Building className="w-4 h-4" />,
      'bank_transfer': <Building className="w-4 h-4" />
    };
    return icons[type as keyof typeof icons] || <DollarSign className="w-4 h-4" />;
  };

  const getMethodColor = (type: string) => {
    const colors = {
      'cash': 'bg-green-500 border-green-400 text-white shadow-lg shadow-green-500/25',
      'credit_card': 'bg-blue-500 border-blue-400 text-white shadow-lg shadow-blue-500/25',
      'mobile_money': 'bg-purple-500 border-purple-400 text-white shadow-lg shadow-purple-500/25',
      'bank': 'bg-gray-600 border-gray-500 text-white shadow-lg shadow-gray-500/25',
      'bank_transfer': 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/25'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-600 border-gray-500 text-white shadow-lg shadow-gray-500/25';
  };

  const getMethodSelectedColor = (type: string) => {
    const colors = {
      'cash': 'bg-green-600 border-green-300 text-white shadow-xl shadow-green-500/40 ring-2 ring-green-300/50',
      'credit_card': 'bg-blue-600 border-blue-300 text-white shadow-xl shadow-blue-500/40 ring-2 ring-blue-300/50',
      'mobile_money': 'bg-purple-600 border-purple-300 text-white shadow-xl shadow-purple-500/40 ring-2 ring-purple-300/50',
      'bank': 'bg-gray-700 border-gray-400 text-white shadow-xl shadow-gray-500/40 ring-2 ring-gray-400/50',
      'bank_transfer': 'bg-indigo-600 border-indigo-300 text-white shadow-xl shadow-indigo-500/40 ring-2 ring-indigo-300/50'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-700 border-gray-400 text-white shadow-xl shadow-gray-500/40 ring-2 ring-gray-400/50';
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

            {/* Progress */}
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

            {/* Amount Input */}
            <div className="space-y-3">
              <label className="text-white/90 text-sm">Amount</label>
              <GlassInput
                type="number"
                value={currentAmount || ''}
                onChange={(e) => setCurrentAmount(Number(e.target.value))}
                placeholder="0.00"
                min="0"
                max={remainingAmount}
                leftIcon={<DollarSign className="w-4 h-4" />}
                className="bg-white/10 border-white/20 text-white placeholder-white/50"
              />
              
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
              <div className="grid grid-cols-2 gap-2">
                {paymentMethods.map((method) => {
                  const autoAccount = getAutoSelectedAccount(method.id);
                  const isSelected = selectedMethod === method.id;
                  return (
                    <button
                      key={method.id}
                      onClick={() => setSelectedMethod(method.id)}
                      className={`p-3 rounded-xl border transition-all text-left ${
                        isSelected
                          ? getMethodSelectedColor(method.type)
                          : `${getMethodColor(method.type)} hover:opacity-80`
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="opacity-80">
                          {getMethodIcon(method.type)}
                        </div>
                        <div className="text-xs">
                          <div className="font-medium">{method.name}</div>
                          {autoAccount && (
                            <div className="opacity-60 truncate">{autoAccount.name}</div>
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
              Add Payment
            </GlassButton>

            {/* Payment Entries */}
            {paymentEntries.length > 0 && (
              <div className="space-y-2">
                <div className="text-white/90 text-sm">Payments</div>
                {paymentEntries.map((payment) => {
                  const methodType = payment.paymentMethod.toLowerCase().replace(/\s+/g, '_');
                  return (
                    <div key={payment.id} className={`flex items-center justify-between p-3 rounded-lg border ${getMethodColor(methodType)}`}>
                      <div className="flex items-center gap-3">
                        <div className="opacity-80">
                          {getMethodIcon(methodType)}
                        </div>
                        <div>
                          <div className="text-sm font-medium">
                            ${payment.amount.toFixed(2)} - {payment.paymentMethod}
                          </div>
                          {payment.reference && (
                            <div className="opacity-60 text-xs">Ref: {payment.reference}</div>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removePayment(payment.id)}
                        className="opacity-60 hover:opacity-100 transition-opacity p-1 hover:bg-red-500/20 rounded"
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
                {isProcessing ? 'Processing...' : 'Complete'}
              </GlassButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPopupModal;