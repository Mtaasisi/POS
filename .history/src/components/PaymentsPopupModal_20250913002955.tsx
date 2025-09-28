import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { usePaymentAccounts } from '../hooks/usePaymentAccounts';
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

  // Virtual keyboard handlers
  const handleKeyPress = (key: string) => {
    if (isMultiplePaymentMode) {
      const currentValue = currentAmount.toString();
      
      if (key === '.') {
        if (!currentValue.includes('.')) {
          setCurrentAmount(parseFloat(currentValue + '.') || 0);
        }
      } else if (key === '00') {
        setCurrentAmount(parseFloat(currentValue + '00') || 0);
      } else {
        const newValue = currentValue === '0' ? key : currentValue + key;
        setCurrentAmount(parseFloat(newValue) || 0);
      }
    } else {
      // In single payment mode, keyboard doesn't change the amount
      // It's just for display/confirmation
    }
  };

  const handleBackspace = () => {
    if (isMultiplePaymentMode) {
      const currentValue = currentAmount.toString();
      if (currentValue.length > 1) {
        setCurrentAmount(parseFloat(currentValue.slice(0, -1)) || 0);
      } else {
        setCurrentAmount(0);
      }
    }
  };

  const handleClear = () => {
    if (isMultiplePaymentMode) {
      setCurrentAmount(0);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast.error('Please select a payment method');
      return;
    }

    const method = paymentMethods.find(m => m.id === selectedMethod);
    const account = getAutoSelectedAccount(selectedMethod);
    
    if (!method || !account) {
      toast.error('No compatible account found for this payment method');
      return;
    }

    setIsProcessing(true);
    
    try {
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
      onClose();
    } catch (error) {
      console.error('Payment failed:', error);
      toast.error('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to add payment with specific method and amount
  const addPaymentWithMethod = (methodId: string, amount: number) => {
    const method = paymentMethods.find(m => m.id === methodId);
    const account = getAutoSelectedAccount(methodId);
    
    if (method && amount > 0) {
      const newPayment: PaymentEntry = {
        id: Date.now().toString(),
        paymentMethod: method.name,
        paymentMethodId: methodId,
        paymentAccountId: account?.id || '',
        amount: amount,
        reference: reference || '',
        notes: notes || ''
      };
      
      setPaymentEntries(prev => [...prev, newPayment]);
      setCurrentAmount(remainingAmount - amount);
      setReference('');
      setNotes('');
    }
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

    // Multiple payment mode - add to entries
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
              <div className="group relative">
                {/* Main container */}
                <div className="bg-white/8 backdrop-blur-lg rounded-xl border border-white/20 p-4 transition-all duration-300 hover:bg-white/12 hover:border-white/30 hover:shadow-lg">
                  <div className="flex items-center gap-3">
                    {/* Enhanced avatar with status */}
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/30 to-indigo-500/30 border border-white/20 flex items-center justify-center shadow-sm">
                        <span className="text-white text-sm font-bold">
                          {customerName ? customerName.charAt(0).toUpperCase() : 'C'}
                        </span>
                      </div>
                      {/* Online indicator */}
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-400 border-2 border-white shadow-sm"></div>
                    </div>
                    
                    {/* Customer details */}
                    <div className="flex-1 min-w-0">
                      {customerName && (
                        <div className="text-white/95 text-sm font-semibold mb-1 truncate">
                          {customerName}
                        </div>
                      )}
                      {description && (
                        <div className="text-white/70 text-xs flex items-center gap-2">
                          <div className="w-1 h-1 rounded-full bg-white/50"></div>
                          <span className="truncate">{description}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Action indicator */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="px-2 py-1 rounded-md bg-green-500/20 border border-green-400/30">
                        <span className="text-green-300 text-xs font-medium">Active</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Subtle bottom accent */}
                  <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
                </div>
              </div>
            )}

            {/* Total Amount - Most Prominent */}
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-sm rounded-xl p-8 border-2 border-white/20 text-center shadow-2xl shadow-blue-500/20">
              <div className="text-white/80 text-sm font-medium mb-3">Total Amount</div>
              <div className="text-white text-5xl font-bold mb-2 drop-shadow-lg">TSh {amount.toLocaleString()}</div>
              <div className="text-white/60 text-sm">Payment Required</div>
            </div>


            {/* Simple Amount Display */}
            <div className="bg-white/8 backdrop-blur-md rounded-xl border border-white/20 p-4 text-center">
              <div className="text-white/70 text-sm mb-2">Amount to Pay</div>
              <div className="text-white text-3xl font-bold">TSh {amount.toLocaleString()}</div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <label className="text-white/90 text-sm font-medium">
                {isMultiplePaymentMode ? 'Quick Add Payments' : 'Payment Method'}
              </label>
              <div className="grid grid-cols-3 gap-3">
                {paymentMethods.map((method) => {
                  const autoAccount = getAutoSelectedAccount(method.id);
                  const isSelected = selectedMethod === method.id;
                  
                  // Define gradient colors for each payment method - Different color schemes
                  const getMethodButtonColor = (methodName: string, selected: boolean) => {
                    const baseColors = {
                      'Cash': selected 
                        ? 'bg-gradient-to-r from-emerald-500/80 to-teal-500/80 hover:from-emerald-600/90 hover:to-teal-600/90 text-white border-white/40 ring-4 ring-emerald-300/70 shadow-lg shadow-emerald-500/30' 
                        : 'bg-gradient-to-r from-emerald-500/60 to-teal-500/60 hover:from-emerald-600/80 hover:to-teal-600/80 text-white border-white/20 hover:border-white/40',
                      'Bank Transfer': selected 
                        ? 'bg-gradient-to-r from-slate-500/80 to-gray-500/80 hover:from-slate-600/90 hover:to-gray-600/90 text-white border-white/40 ring-4 ring-slate-300/70 shadow-lg shadow-slate-500/30' 
                        : 'bg-gradient-to-r from-slate-500/60 to-gray-500/60 hover:from-slate-600/80 hover:to-gray-600/80 text-white border-white/20 hover:border-white/40',
                      'Airtel Money': selected 
                        ? 'bg-gradient-to-r from-rose-500/80 to-red-500/80 hover:from-rose-600/90 hover:to-red-600/90 text-white border-white/40 ring-4 ring-rose-300/70 shadow-lg shadow-rose-500/30' 
                        : 'bg-gradient-to-r from-rose-500/60 to-red-500/60 hover:from-rose-600/80 hover:to-red-600/80 text-white border-white/20 hover:border-white/40',
                      'M-Pesa': selected 
                        ? 'bg-gradient-to-r from-lime-500/80 to-green-500/80 hover:from-lime-600/90 hover:to-green-600/90 text-white border-white/40 ring-4 ring-lime-300/70 shadow-lg shadow-lime-500/30' 
                        : 'bg-gradient-to-r from-lime-500/60 to-green-500/60 hover:from-lime-600/80 hover:to-green-600/80 text-white border-white/20 hover:border-white/40',
                      'Tigo Pesa': selected 
                        ? 'bg-gradient-to-r from-violet-500/80 to-purple-500/80 hover:from-violet-600/90 hover:to-purple-600/90 text-white border-white/40 ring-4 ring-violet-300/70 shadow-lg shadow-violet-500/30' 
                        : 'bg-gradient-to-r from-violet-500/60 to-purple-500/60 hover:from-violet-600/80 hover:to-purple-600/80 text-white border-white/20 hover:border-white/40',
                      'HaloPesa': selected 
                        ? 'bg-gradient-to-r from-amber-500/80 to-yellow-500/80 hover:from-amber-600/90 hover:to-yellow-600/90 text-white border-white/40 ring-4 ring-amber-300/70 shadow-lg shadow-amber-500/30' 
                        : 'bg-gradient-to-r from-amber-500/60 to-yellow-500/60 hover:from-amber-600/80 hover:to-yellow-600/80 text-white border-white/20 hover:border-white/40'
                    };
                    return baseColors[methodName as keyof typeof baseColors] || baseColors['Cash'];
                  };
                  
                  // Handle click based on mode
                  const handleMethodClick = () => {
                    if (isMultiplePaymentMode) {
                      // In multiple mode, directly add payment with remaining amount
                      const paymentAmount = Math.min(currentAmount || remainingAmount, remainingAmount);
                      if (paymentAmount > 0) {
                        addPaymentWithMethod(method.id, paymentAmount);
                      }
                    } else {
                      // In single mode, just select method
                      setSelectedMethod(method.id);
                    }
                  };
                  
                  return (
                    <button
                      key={method.id}
                      onClick={handleMethodClick}
                      disabled={isMultiplePaymentMode && remainingAmount <= 0}
                      className={`aspect-square p-4 rounded-xl border backdrop-blur-md transition-all duration-300 text-center transform hover:scale-105 active:scale-[0.98] focus:ring-2 focus:ring-white/30 hover:shadow-lg font-medium ${
                        getMethodButtonColor(method.name, isSelected)
                      } ${isMultiplePaymentMode && remainingAmount <= 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <div className="flex flex-col items-center justify-center h-full gap-2">
                        <div className="text-2xl opacity-80">
                          {getMethodIcon(method.type, method.name)}
                        </div>
                        <div className="text-sm font-semibold leading-tight">
                          {method.name}
                        </div>
                        {autoAccount && (
                          <div className="opacity-70 text-xs text-center leading-tight">
                            {autoAccount.name}
                          </div>
                        )}
                        {isMultiplePaymentMode && remainingAmount > 0 && (
                          <div className="text-xs opacity-70 mt-1">
                            <Plus className="w-3 h-3 mx-auto" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>


            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="flex-1 py-3 px-6 bg-transparent border border-white/20 rounded-lg text-white/80 font-medium hover:bg-white/10 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              
              <button
                onClick={handlePayment}
                disabled={!selectedMethod || isProcessing}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 border border-green-400/30 rounded-lg text-white font-semibold transition-all duration-200 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Pay Now
                    <CheckCircle className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPopupModal;