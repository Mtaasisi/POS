import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, Smartphone, Building, CheckCircle, Loader2, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { usePaymentAccounts } from '../hooks/usePaymentAccounts';
import GlassCard from '../features/shared/components/ui/GlassCard';
import GlassButton from '../features/shared/components/ui/GlassButton';
import GlassInput from '../features/shared/components/ui/GlassInput';
import { PaymentAccountSelector } from '../features/shared/components/ui/PaymentMethodSelector';
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

  // Quick amount buttons
  const quickAmounts = [
    { label: '25%', value: amount * 0.25 },
    { label: '50%', value: amount * 0.5 },
    { label: '75%', value: amount * 0.75 },
    { label: 'Full', value: amount }
  ];

  const handleQuickAmount = (value: number) => {
    setCurrentAmount(Math.min(value, remainingAmount));
  };

  // Auto-select the first available account for the selected payment method
  const getAutoSelectedAccount = (methodId: string) => {
    const method = paymentMethods.find(m => m.id === methodId);
    if (!method) return null;

    // Find the first compatible account for this payment method
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
      'cash': <DollarSign className="w-4 h-4" />,
      'credit_card': <CreditCard className="w-4 h-4" />,
      'mobile_money': <Smartphone className="w-4 h-4" />,
      'bank': <Building className="w-4 h-4" />,
      'bank_transfer': <Building className="w-4 h-4" />
    };
    return icons[type as keyof typeof icons] || <DollarSign className="w-4 h-4" />;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Info */}
        {(customerName || description) && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            {customerName && (
              <div className="mb-2">
                <div className="text-sm text-gray-600">Customer</div>
                <div className="font-medium text-gray-800">{customerName}</div>
              </div>
            )}
            {description && (
              <div className="mb-2">
                <div className="text-sm text-gray-600">Description</div>
                <div className="font-medium text-gray-800">{description}</div>
              </div>
            )}
            <div>
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="text-2xl font-bold text-green-600">${amount.toFixed(2)}</div>
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-sm text-gray-600">Total</div>
              <div className="text-lg font-bold text-gray-800">${amount.toFixed(2)}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Paid</div>
              <div className={`text-lg font-bold ${totalPaid > 0 ? 'text-green-600' : 'text-gray-400'}`}>
                ${totalPaid.toFixed(2)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Remaining</div>
              <div className={`text-lg font-bold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                ${remainingAmount.toFixed(2)}
              </div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isFullyPaid ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min((totalPaid / amount) * 100, 100)}%` }}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1 text-center">
              {Math.round((totalPaid / amount) * 100)}% Complete
            </div>
          </div>
        </div>

        {/* Add Payment Form */}
        <div className="mb-6 p-4 bg-white rounded-lg border">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Payment</h3>
          
          {/* Amount Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount
            </label>
            <GlassInput
              type="number"
              value={currentAmount || ''}
              onChange={(e) => setCurrentAmount(Number(e.target.value))}
              placeholder="0.00"
              min="0"
              max={remainingAmount}
              leftIcon={<DollarSign className="w-4 h-4" />}
            />
            
            {/* Quick Amount Buttons */}
            <div className="flex gap-2 mt-2">
              {quickAmounts.map((quick) => (
                <button
                  key={quick.label}
                  onClick={() => handleQuickAmount(quick.value)}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  disabled={quick.value > remainingAmount}
                >
                  {quick.label}
                </button>
              ))}
            </div>
          </div>

          {/* Payment Method */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method
            </label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => setSelectedMethod(method.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {getMethodIcon(method.type)}
                    <span className="text-sm font-medium">{method.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Payment Account */}
          {selectedMethod && (
            <div className="mb-4">
              <PaymentAccountSelector
                value={selectedAccount}
                onChange={setSelectedAccount}
                paymentMethodId={selectedMethod}
                required={true}
              />
            </div>
          )}

          {/* Reference Number */}
          <div className="mb-4">
            <GlassInput
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Reference number (optional)"
              disabled={isProcessing}
            />
          </div>

          {/* Notes */}
          <div className="mb-4">
            <GlassInput
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notes (optional)"
              disabled={isProcessing}
            />
          </div>

          <GlassButton
            onClick={addPayment}
            disabled={!selectedMethod || !selectedAccount || currentAmount <= 0 || isProcessing}
            className="w-full"
            icon={<Plus className="w-4 h-4" />}
          >
            Add Payment
          </GlassButton>
        </div>

        {/* Payment Entries */}
        {paymentEntries.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Entries</h3>
            <div className="space-y-2">
              {paymentEntries.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getMethodIcon(payment.paymentMethod.toLowerCase().replace(/\s+/g, '_'))}
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
                    className="p-1 text-red-500 hover:text-red-700 transition-colors"
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
        <div className="flex space-x-3">
          <GlassButton
            onClick={onClose}
            variant="secondary"
            className="flex-1"
            disabled={isProcessing}
          >
            Cancel
          </GlassButton>
          
          <GlassButton
            onClick={handleSubmit}
            className="flex-1"
            disabled={paymentEntries.length === 0 || isProcessing}
            loading={isProcessing}
            icon={isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
          >
            {isProcessing ? 'Processing...' : 'Complete Payment'}
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};

export default PaymentsPopupModal;