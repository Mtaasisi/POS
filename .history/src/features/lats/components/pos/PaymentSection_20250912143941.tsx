// PaymentSection component for LATS module
import React, { useState, useEffect } from 'react';
import { LATS_CLASSES } from '../../tokens';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import GlassBadge from '../ui/GlassBadge';
import GlassInput from '../ui/GlassInput';
import GlassSelect from '../ui/GlassSelect';
import { t } from '../../lib/i18n/t';
import { format } from '../../lib/format';
import { usePaymentMethodsContext } from '../../../../context/PaymentMethodsContext';
import { validateMobileMoneyReference, requiresReferenceNumber, getReferencePlaceholder, getReferenceHelpText } from '../../../../utils/mobileMoneyValidation';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'mobile_money' | 'bank_transfer' | 'other';
  icon: string;
  isActive: boolean;
  requiresReference?: boolean;
  requiresAccount?: boolean;
}

interface PaymentSectionProps {
  total: number;
  onPaymentComplete: (paymentData: PaymentData) => Promise<void>;
  onCancel: () => void;
  paymentMethods?: PaymentMethod[];
  loading?: boolean;
  className?: string;
}

interface PaymentData {
  method: PaymentMethod;
  amount: number;
  reference?: string;
  accountNumber?: string;
  notes?: string;
  changeAmount?: number;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
  total,
  onPaymentComplete,
  onCancel,
  paymentMethods = [],
  loading = false,
  className = ''
}) => {
  const { paymentMethods: paymentMethodsWithAccounts, loading: methodsLoading } = usePaymentMethodsContext();
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState(total);
  const [reference, setReference] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Default payment methods if none provided
  const defaultPaymentMethods: PaymentMethod[] = [
    {
      id: 'cash',
      name: 'Cash',
      type: 'cash',
      icon: '💵',
      isActive: true
    },
    {
      id: 'card',
      name: 'Card',
      type: 'card',
      icon: '💳',
      isActive: true,
      requiresReference: true
    },
    {
      id: 'zenopay',
      name: 'ZenoPay',
      type: 'mobile_money',
      icon: '📱',
      isActive: true,
      requiresReference: false
    },
    {
      id: 'mpesa',
      name: 'M-Pesa',
      type: 'mobile_money',
      icon: '📱',
      isActive: true,
      requiresReference: true
    },
    {
      id: 'airtel_money',
      name: 'Airtel Money',
      type: 'mobile_money',
      icon: '📱',
      isActive: true,
      requiresReference: true
    },
    {
      id: 'bank_transfer',
      name: 'Bank Transfer',
      type: 'bank_transfer',
      icon: '🏦',
      isActive: true,
      requiresReference: true,
      requiresAccount: true
    }
  ];

  // Convert managed payment methods to the component's format
  const managedMethods: PaymentMethod[] = (paymentMethodsWithAccounts || []).map(method => ({
    id: method.id,
    name: method.name,
    type: method.type as any,
    icon: method.payment_icon || '💳',
    isActive: method.is_active,
    requiresReference: method.requires_reference,
    requiresAccount: method.requires_account_number
  }));

  // Always prioritize database methods over hardcoded defaults
  // Show database methods if available, otherwise show defaults
  const availableMethods = managedMethods.length > 0 ? managedMethods : 
                          (paymentMethods.length > 0 ? paymentMethods : defaultPaymentMethods);
  const activeMethods = availableMethods.filter(method => method.isActive);

  // Calculate change
  const changeAmount = selectedMethod?.type === 'cash' && amount > total ? amount - total : 0;

  // Handle payment method selection
  const handleMethodSelect = (method: PaymentMethod) => {
    setSelectedMethod(method);
    if (method.type === 'cash') {
      setAmount(total); // Reset to total for cash payments
    }
  };

  // Handle amount change
  const handleAmountChange = (value: number) => {
    setAmount(value);
  };

  // Handle payment submission
  const handlePaymentSubmit = async () => {
    if (!selectedMethod) return;

    // Validate reference number for payments that require it
    if (requiresReferenceNumber(selectedMethod)) {
      const validation = validateMobileMoneyReference(reference, selectedMethod.name);
      if (!validation.isValid) {
        alert(validation.error);
        return;
      }
    }

    setIsProcessing(true);
    try {
      const paymentData: PaymentData = {
        method: selectedMethod,
        amount,
        reference: reference.trim() || undefined,
        accountNumber: accountNumber.trim() || undefined,
        notes: notes.trim() || undefined,
        changeAmount: changeAmount > 0 ? changeAmount : undefined
      };

      await onPaymentComplete(paymentData);
    } catch (error) {
      console.error('Payment processing error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Get payment method icon
  const getMethodIcon = (method: PaymentMethod) => {
    return (
      <span className="text-2xl" role="img" aria-label={method.name}>
        {method.icon}
      </span>
    );
  };

  // Get payment method badge
  const getMethodBadge = (method: PaymentMethod) => {
    const variantMap = {
      cash: 'success' as const,
      card: 'primary' as const,
      mobile_money: 'warning' as const,
      bank_transfer: 'info' as const,
      other: 'ghost' as const
    };

    return (
      <GlassBadge variant={variantMap[method.type]} size="sm">
        {method.name}
      </GlassBadge>
    );
  };

  // Validate form
  const isFormValid = () => {
    if (!selectedMethod) return false;
    if (amount < total) return false;
    if (selectedMethod.requiresReference && !reference.trim()) return false;
    if (selectedMethod.requiresAccount && !accountNumber.trim()) return false;
    return true;
  };

  return (
    <GlassCard className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-lats-text">Payment</h2>
          <p className="text-sm text-lats-text-secondary mt-1">
            Select payment method and complete transaction
          </p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-lats-text">
            {format.money(total)}
          </div>
          <div className="text-sm text-lats-text-secondary">
            Total Amount
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="mb-6">
        <h3 className="text-lg font-medium text-lats-text mb-3">Select Payment Method</h3>
        {methodsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-lats-primary"></div>
            <span className="ml-3 text-lats-text/70">Loading payment methods...</span>
          </div>
        ) : activeMethods.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-lats-text/50 mb-2">No payment methods available</div>
            <div className="text-sm text-lats-text/40">Please set up payment methods in the admin panel</div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {activeMethods.map((method) => (
            <button
              key={method.id}
              onClick={() => handleMethodSelect(method)}
              className={`p-4 rounded-lats-radius-md border transition-all duration-200 text-center ${
                selectedMethod?.id === method.id
                  ? 'border-lats-primary bg-lats-primary/10'
                  : 'border-lats-glass-border bg-lats-surface/30 hover:bg-lats-surface/50'
              }`}
            >
              <div className="mb-2">{getMethodIcon(method)}</div>
              <div className="text-sm font-medium text-lats-text">{method.name}</div>
              {selectedMethod?.id === method.id && (
                <div className="mt-2">
                  {getMethodBadge(method)}
                </div>
              )}
            </button>
          ))}
          </div>
        )}
      </div>

      {/* Payment Details */}
      {selectedMethod && (
        <div className="space-y-4 mb-6">
          <h3 className="text-lg font-medium text-lats-text">Payment Details</h3>
          
          {/* Amount Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-lats-text">
              Amount Received
            </label>
            <GlassInput
              type="number"
              value={amount}
              onChange={(value) => handleAmountChange(parseFloat(value) || 0)}
              min={total}
              step={0.01}
              placeholder="Enter amount"
              className="text-lg font-semibold"
              icon={
                <svg className="w-5 h-5 text-lats-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              }
            />
          </div>

          {/* Change Amount */}
          {selectedMethod.type === 'cash' && changeAmount > 0 && (
            <div className="p-3 bg-lats-success/10 border border-lats-success/20 rounded-lats-radius-md">
              <div className="flex items-center justify-between text-sm">
                <span className="text-lats-text-secondary">Change:</span>
                <span className="font-bold text-lats-success">
                  {format.money(changeAmount)}
                </span>
              </div>
            </div>
          )}

          {/* Reference Number */}
          {selectedMethod.requiresReference && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-lats-text">
                Reference Number *
              </label>
              <GlassInput
                value={reference}
                onChange={(value) => setReference(value)}
                placeholder={getReferencePlaceholder(selectedMethod.name)}
                maxLength={50}
              />
              <div className="text-xs text-lats-text-secondary">
                {getReferenceHelpText(selectedMethod.name)}
              </div>
            </div>
          )}

          {/* Account Number */}
          {selectedMethod.requiresAccount && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-lats-text">
                Account Number
              </label>
              <GlassInput
                value={accountNumber}
                onChange={(value) => setAccountNumber(value)}
                placeholder="Enter account number"
                maxLength={20}
              />
            </div>
          )}

          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-lats-text">
              Notes (Optional)
            </label>
            <GlassInput
              value={notes}
              onChange={(value) => setNotes(value)}
              placeholder="Additional notes about this payment"
              multiline
              rows={3}
              maxLength={200}
            />
          </div>
        </div>
      )}

      {/* Payment Summary */}
      {selectedMethod && (
        <div className="mb-6 p-4 bg-lats-surface/30 rounded-lats-radius-md border border-lats-glass-border">
          <h4 className="text-sm font-medium text-lats-text mb-3">Payment Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-lats-text-secondary">Method:</span>
              <span className="text-lats-text">{selectedMethod.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lats-text-secondary">Amount Due:</span>
              <span className="text-lats-text">{format.money(total)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-lats-text-secondary">Amount Received:</span>
              <span className="text-lats-text">{format.money(amount)}</span>
            </div>
            {changeAmount > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-lats-text-secondary">Change:</span>
                <span className="text-lats-success font-medium">{format.money(changeAmount)}</span>
              </div>
            )}
            {reference && (
              <div className="flex items-center justify-between">
                <span className="text-lats-text-secondary">Reference:</span>
                <span className="text-lats-text font-mono">{reference}</span>
              </div>
            )}
            {accountNumber && (
              <div className="flex items-center justify-between">
                <span className="text-lats-text-secondary">Account:</span>
                <span className="text-lats-text font-mono">{accountNumber}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pt-4 border-t border-lats-glass-border">
        <GlassButton
          variant="secondary"
          size="md"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1"
        >
          Cancel
        </GlassButton>
        <GlassButton
          variant="primary"
          size="md"
          onClick={handlePaymentSubmit}
          disabled={!isFormValid() || isProcessing}
          loading={isProcessing}
          className="flex-1"
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        >
          {isProcessing ? 'Processing...' : 'Complete Payment'}
        </GlassButton>
      </div>

      {/* Payment Instructions */}
      {selectedMethod && (
        <div className="mt-4 p-3 bg-lats-info/10 border border-lats-info/20 rounded-lats-radius-md">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-lats-info mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-xs text-lats-text-secondary">
              <strong>Payment Instructions:</strong> Ensure you have received the correct amount before completing the transaction. 
              {selectedMethod.requiresReference && ' Please verify the reference number is correct.'}
              {selectedMethod.requiresAccount && ' Please verify the account number is correct.'}
            </div>
          </div>
        </div>
      )}
    </GlassCard>
  );
};

// Export with display name for debugging
PaymentSection.displayName = 'PaymentSection';

export default PaymentSection;
