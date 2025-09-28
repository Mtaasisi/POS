import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, Smartphone, Building, CheckCircle, Loader2, AlertCircle, Plus, Settings } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { usePaymentAccounts } from '../hooks/usePaymentAccounts';
import { usePaymentMethodsContext } from '../context/PaymentMethodsContext';
import GlassCard from '../features/shared/components/ui/GlassCard';
import GlassButton from '../features/shared/components/ui/GlassButton';
import GlassInput from '../features/shared/components/ui/GlassInput';
import { PaymentAccountSelector } from '../features/shared/components/ui/PaymentMethodSelector';
import { validateMobileMoneyReference, requiresReferenceNumber, getReferencePlaceholder, getReferenceHelpText } from '../utils/mobileMoneyValidation';
import { toast } from 'react-hot-toast';
import { FinanceAccount } from '../lib/financeAccountService';

// Use FinanceAccount directly as PaymentMethod
type PaymentMethod = FinanceAccount;

interface PaymentData {
  amount: number;
  paymentMethod: string;
  paymentAccountId: string;
  reference?: string;
  notes?: string;
  customerId?: string;
  customerName?: string;
  description?: string;
}

interface PaymentsPopupModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  customerId?: string;
  customerName?: string;
  description?: string;
  onPaymentComplete: (paymentData: PaymentData) => void;
  title?: string;
  showCustomerInfo?: boolean;
  showPaymentMethodManagement?: boolean;
  onManagePaymentMethods?: () => void;
}

const PaymentsPopupModal: React.FC<PaymentsPopupModalProps> = ({
  isOpen,
  onClose,
  amount,
  customerId,
  customerName,
  description,
  onPaymentComplete,
  title = "Process Payment",
  showCustomerInfo = true,
  showPaymentMethodManagement = true,
  onManagePaymentMethods
}) => {
  const { user } = useAuth();
  const { paymentMethods, loading: methodsLoading } = usePaymentMethods();
  const { paymentAccounts, loading: accountsLoading } = usePaymentAccounts();
  const { paymentMethods: contextMethods, loading: contextLoading, refreshPaymentMethods } = usePaymentMethodsContext();
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPaymentMethod('');
      setSelectedPaymentAccount('');
      setReference('');
      setNotes('');
    }
  }, [isOpen]);

  // Use context methods if available, otherwise fallback to hook methods
  const availableMethods = contextMethods.length > 0 ? contextMethods : paymentMethods;
  const isLoading = contextLoading || methodsLoading;

  // Get payment method icon
  const getPaymentMethodIcon = (method: PaymentMethod) => {
    // Use custom icon if available
    if (method.payment_icon) {
      return <span className="text-lg" role="img" aria-label={method.name}>{method.payment_icon}</span>;
    }
    
    // Fallback to type-based icons
    const iconMap: Record<string, React.ReactNode> = {
      'cash': <DollarSign className="w-4 h-4" />,
      'credit_card': <CreditCard className="w-4 h-4" />,
      'mobile_money': <Smartphone className="w-4 h-4" />,
      'bank': <Building className="w-4 h-4" />,
      'savings': <Building className="w-4 h-4" />,
      'investment': <Building className="w-4 h-4" />,
      'other': <CreditCard className="w-4 h-4" />
    };
    return iconMap[method.type] || <DollarSign className="w-4 h-4" />;
  };

  // Handle payment method selection
  const handlePaymentMethodChange = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    // Auto-select first available account for this method type
    const method = availableMethods.find(m => m.id === methodId);
    if (method) {
      const compatibleAccount = paymentAccounts.find(account => 
        account.type === method.type || 
        (method.type === 'mobile_money' && account.type === 'mobile_money') ||
        (method.type === 'credit_card' && account.type === 'credit_card')
      );
      if (compatibleAccount) {
        setSelectedPaymentAccount(compatibleAccount.id);
      }
    }
  };

  // Validate form
  const isFormValid = () => {
    if (!selectedPaymentMethod || !selectedPaymentAccount) return false;
    if (amount <= 0) return false;
    
    const selectedMethod = availableMethods.find(m => m.id === selectedPaymentMethod);
    if (selectedMethod?.requires_reference && !reference.trim()) return false;
    
    return true;
  };

  // Handle payment submission
  const handlePaymentSubmit = async () => {
    if (!isFormValid() || !user) return;

    // Validate reference number for payments that require it
    const selectedMethod = availableMethods.find(m => m.id === selectedPaymentMethod);
    if (selectedMethod && requiresReferenceNumber(selectedMethod)) {
      const validation = validateMobileMoneyReference(reference, selectedMethod.name);
      if (!validation.isValid) {
        toast.error(validation.error);
        return;
      }
    }

    setIsProcessing(true);
    try {
      const selectedMethod = availableMethods.find(m => m.id === selectedPaymentMethod);
      const selectedAccount = paymentAccounts.find(a => a.id === selectedPaymentAccount);

      // Create payment data
      const paymentData: PaymentData = {
        amount,
        paymentMethod: selectedMethod?.name || selectedPaymentMethod,
        paymentAccountId: selectedPaymentAccount,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        customerId,
        customerName,
        description: description || `Payment - ${selectedMethod?.name || 'Unknown method'}`
      };

      await onPaymentComplete(paymentData);
      toast.success('Payment processed successfully!');
      onClose();

    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error('Failed to process payment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-800">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer Info */}
        {showCustomerInfo && (customerName || customerId) && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            {customerName && (
              <>
                <div className="text-sm text-gray-600 mb-2">Customer</div>
                <div className="font-medium text-gray-800">{customerName}</div>
              </>
            )}
            {description && (
              <>
                <div className="text-sm text-gray-600 mt-2 mb-1">Description</div>
                <div className="font-medium text-gray-800">{description}</div>
              </>
            )}
            <div className="text-sm text-gray-600 mt-2 mb-1">Amount</div>
            <div className="text-2xl font-bold text-green-600">
              ${amount.toFixed(2)}
            </div>
          </div>
        )}

        {/* Amount Display (when no customer info) */}
        {!showCustomerInfo && (
          <div className="mb-6 p-4 bg-green-50 rounded-lg text-center">
            <div className="text-sm text-gray-600 mb-1">Payment Amount</div>
            <div className="text-3xl font-bold text-green-600">
              ${amount.toFixed(2)}
            </div>
          </div>
        )}

        {/* Payment Method Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Payment Method
          </label>
          {methodsLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.id}
                  onClick={() => handlePaymentMethodChange(method.id)}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    selectedPaymentMethod === method.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  disabled={isProcessing}
                >
                  <div className="flex items-center space-x-2">
                    {getPaymentMethodIcon(method.type)}
                    <span className="text-sm font-medium">{method.name}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Payment Account Selection */}
        {selectedPaymentMethod && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Account
            </label>
            <PaymentAccountSelector
              value={selectedPaymentAccount}
              onChange={setSelectedPaymentAccount}
              type="all"
              showIcons={true}
              showDescriptions={true}
              disabled={isProcessing}
              required={true}
            />
          </div>
        )}

        {/* Reference Number */}
        {selectedPaymentMethod && (() => {
          const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
          const requiresRef = selectedMethod && requiresReferenceNumber(selectedMethod);
          
          if (!requiresRef) return null;
          
          return (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number *
              </label>
              <GlassInput
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={getReferencePlaceholder(selectedMethod?.name)}
                disabled={isProcessing}
              />
              <div className="text-xs text-gray-500 mt-1">
                {getReferenceHelpText(selectedMethod?.name)}
              </div>
            </div>
          );
        })()}

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notes (Optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add payment notes..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            rows={3}
            disabled={isProcessing}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <GlassButton
            onClick={onClose}
            variant="ghost"
            className="flex-1"
            disabled={isProcessing}
          >
            Cancel
          </GlassButton>
          <GlassButton
            onClick={handlePaymentSubmit}
            variant="primary"
            className="flex-1"
            disabled={!isFormValid() || isProcessing}
            loading={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Process Payment
              </>
            )}
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};

export default PaymentsPopupModal;
