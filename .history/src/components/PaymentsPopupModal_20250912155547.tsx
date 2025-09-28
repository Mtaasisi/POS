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
      'cash': 'bg-green-500/20 border-green-400/30 text-green-200',
      'credit_card': 'bg-blue-500/20 border-blue-400/30 text-blue-200',
      'mobile_money': 'bg-purple-500/20 border-purple-400/30 text-purple-200',
      'bank': 'bg-gray-500/20 border-gray-400/30 text-gray-200',
      'bank_transfer': 'bg-indigo-500/20 border-indigo-400/30 text-indigo-200'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500/20 border-gray-400/30 text-gray-200';
  };

  const getMethodSelectedColor = (type: string) => {
    const colors = {
      'cash': 'bg-green-500/30 border-green-400/50 text-green-100',
      'credit_card': 'bg-blue-500/30 border-blue-400/50 text-blue-100',
      'mobile_money': 'bg-purple-500/30 border-purple-400/50 text-purple-100',
      'bank': 'bg-gray-500/30 border-gray-400/50 text-gray-100',
      'bank_transfer': 'bg-indigo-500/30 border-indigo-400/50 text-indigo-100'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-500/30 border-gray-400/50 text-gray-100';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900/40 via-blue-900/40 to-indigo-900/40 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md">
        {/* Glassmorphism Modal */}
        <div className="bg-gradient-to-br from-white/15 via-white/10 to-white/5 backdrop-blur-xl border border-white/30 rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="p-6 border-b border-white/20 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-indigo-500/20">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-white">{title}</h2>
                <p className="text-white/80 text-sm font-medium">${amount.toFixed(2)}</p>
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
              <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-xl p-4 border border-green-400/20">
                {customerName && (
                  <div className="text-green-100 text-sm mb-1 font-medium">{customerName}</div>
                )}
                {description && (
                  <div className="text-green-200/80 text-xs">{description}</div>
                )}
              </div>
            )}

            {/* Progress */}
            <div className="bg-gradient-to-r from-blue-500/10 to-cyan-500/10 backdrop-blur-sm rounded-xl p-4 border border-blue-400/20">
              <div className="flex justify-between items-center mb-3">
                <span className="text-blue-100 text-sm font-medium">Progress</span>
                <span className="text-blue-200 text-sm font-semibold">{Math.round((totalPaid / amount) * 100)}%</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full h-3 transition-all duration-500 shadow-lg"
                  style={{ width: `${Math.min((totalPaid / amount) * 100, 100)}%` }}
                />
              </div>
              <div className="flex justify-between mt-3 text-xs">
                <span className="text-green-200 font-medium">Paid: ${totalPaid.toFixed(2)}</span>
                <span className="text-orange-200 font-medium">Remaining: ${remainingAmount.toFixed(2)}</span>
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
                    className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 text-white/90 rounded-lg transition-all border border-white/20"
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
                          ? 'bg-white/20 border-white/40 text-white'
                          : 'bg-white/5 border-white/20 text-white/80 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="text-white/70">
                          {getMethodIcon(method.type)}
                        </div>
                        <div className="text-xs">
                          <div className="font-medium">{method.name}</div>
                          {autoAccount && (
                            <div className="text-white/50 truncate">{autoAccount.name}</div>
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
              className="w-full bg-white/10 hover:bg-white/20 border-white/20 text-white"
              icon={<Plus className="w-4 h-4" />}
            >
              Add Payment
            </GlassButton>

            {/* Payment Entries */}
            {paymentEntries.length > 0 && (
              <div className="space-y-2">
                <div className="text-white/90 text-sm">Payments</div>
                {paymentEntries.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="text-white/70">
                        {getMethodIcon(payment.paymentMethod.toLowerCase().replace(/\s+/g, '_'))}
                      </div>
                      <div>
                        <div className="text-white/90 text-sm font-medium">
                          ${payment.amount.toFixed(2)} - {payment.paymentMethod}
                        </div>
                        {payment.reference && (
                          <div className="text-white/50 text-xs">Ref: {payment.reference}</div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => removePayment(payment.id)}
                      className="text-white/50 hover:text-white/80 transition-colors p-1"
                      disabled={isProcessing}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <GlassButton
                onClick={onClose}
                variant="secondary"
                className="flex-1 bg-white/5 hover:bg-white/10 border-white/20 text-white/90"
                disabled={isProcessing}
              >
                Cancel
              </GlassButton>
              
              <GlassButton
                onClick={handleSubmit}
                className="flex-1 bg-white/20 hover:bg-white/30 border-white/30 text-white"
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