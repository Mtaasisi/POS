import React, { useState, useEffect } from 'react';
import { X, DollarSign, CreditCard, Smartphone, Building, CheckCircle, Loader2, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePaymentMethods } from '../hooks/usePaymentMethods';
import { usePaymentAccounts } from '../hooks/usePaymentAccounts';
import GlassCard from '../features/shared/components/ui/GlassCard';
import GlassButton from '../features/shared/components/ui/GlassButton';
import GlassInput from '../features/shared/components/ui/GlassInput';
import { PaymentAccountSelector } from '../features/shared/components/ui/PaymentMethodSelector';
import { validateMobileMoneyReference, requiresReferenceNumber, getReferencePlaceholder, getReferenceHelpText } from '../utils/mobileMoneyValidation';
import { toast } from 'react-hot-toast';

interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'credit_card' | 'mobile_money' | 'bank_transfer' | 'other';
  icon: string;
  isActive: boolean;
  requiresReference?: boolean;
  requiresAccount?: boolean;
}

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
  showCustomerInfo?: boolean;
  allowMultiplePayments?: boolean;
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
  allowMultiplePayments = true
}) => {
  const { user } = useAuth();
  const { paymentMethods, loading: methodsLoading } = usePaymentMethods();
  const { paymentAccounts, loading: accountsLoading } = usePaymentAccounts();
  
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
  const [selectedPaymentAccount, setSelectedPaymentAccount] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Multiple payments state
  const [paymentEntries, setPaymentEntries] = useState<PaymentEntry[]>([]);
  const [currentPaymentAmount, setCurrentPaymentAmount] = useState(0);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [quickAmount, setQuickAmount] = useState(0);
  const [autoFillAmount, setAutoFillAmount] = useState(true);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedPaymentMethod('');
      setSelectedPaymentAccount('');
      setReference('');
      setNotes('');
      setPaymentEntries([]);
      setCurrentPaymentAmount(0);
      setShowAddPayment(false);
      setQuickAmount(0);
      setAutoFillAmount(true);
    }
  }, [isOpen]);

  // Auto-fill amount when modal opens
  useEffect(() => {
    if (isOpen && autoFillAmount && !allowMultiplePayments) {
      setCurrentPaymentAmount(amount);
    }
  }, [isOpen, amount, autoFillAmount, allowMultiplePayments]);

  // Calculate totals
  const totalPaid = paymentEntries.reduce((sum, payment) => sum + payment.amount, 0);
  const remainingAmount = amount - totalPaid;
  const isFullyPaid = remainingAmount <= 0;

  // Get payment method icon
  const getPaymentMethodIcon = (methodType: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      'cash': <DollarSign className="w-4 h-4" />,
      'card': <CreditCard className="w-4 h-4" />,
      'mobile_money': <Smartphone className="w-4 h-4" />,
      'bank': <Building className="w-4 h-4" />,
      'bank_transfer': <Building className="w-4 h-4" />,
      'credit_card': <CreditCard className="w-4 h-4" />,
      'savings': <Building className="w-4 h-4" />,
      'investment': <Building className="w-4 h-4" />
    };
    return iconMap[methodType] || <DollarSign className="w-4 h-4" />;
  };

  // Handle payment method selection
  const handlePaymentMethodChange = (methodId: string) => {
    setSelectedPaymentMethod(methodId);
    // Auto-select first available account for this method type
    const method = paymentMethods.find(m => m.id === methodId);
    if (method) {
      const compatibleAccount = paymentAccounts.find(account => 
        account.type === method.type || 
        (method.type === 'mobile_money' && account.type === 'mobile_money') ||
        (method.type === 'card' && account.type === 'credit_card')
      );
      if (compatibleAccount) {
        setSelectedPaymentAccount(compatibleAccount.id);
      }
    }
  };

  // Add payment entry
  const addPaymentEntry = () => {
    if (!selectedPaymentMethod || !selectedPaymentAccount || currentPaymentAmount <= 0) return;
    
    const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
    if (selectedMethod?.requires_reference && !reference.trim()) {
      toast.error('Reference number is required for this payment method');
      return;
    }

    const newPayment: PaymentEntry = {
      id: crypto.randomUUID(),
      amount: currentPaymentAmount,
      paymentMethod: selectedMethod?.name || selectedPaymentMethod,
      paymentAccountId: selectedPaymentAccount,
      reference: reference.trim() || undefined,
      notes: notes.trim() || undefined,
      timestamp: new Date().toISOString()
    };

    setPaymentEntries(prev => [...prev, newPayment]);
    
    // Reset form
    setSelectedPaymentMethod('');
    setSelectedPaymentAccount('');
    setReference('');
    setNotes('');
    setCurrentPaymentAmount(0);
    setShowAddPayment(false);
  };

  // Remove payment entry
  const removePaymentEntry = (paymentId: string) => {
    setPaymentEntries(prev => prev.filter(p => p.id !== paymentId));
  };

  // Quick payment functions
  const quickAddPayment = (paymentMethod: string, amount: number) => {
    const method = paymentMethods.find(m => m.id === paymentMethod);
    if (!method) return;

    const newPayment: PaymentEntry = {
      id: crypto.randomUUID(),
      amount: amount,
      paymentMethod: method.name,
      paymentAccountId: '', // Will be auto-selected
      reference: '',
      notes: '',
      timestamp: new Date().toISOString()
    };

    // Auto-select first compatible account
    const compatibleAccount = paymentAccounts.find(account => 
      account.type === method.type || 
      (method.type === 'mobile_money' && account.type === 'mobile_money') ||
      (method.type === 'card' && account.type === 'credit_card')
    );
    
    if (compatibleAccount) {
      newPayment.paymentAccountId = compatibleAccount.id;
    }

    setPaymentEntries(prev => [...prev, newPayment]);
  };


  // Validate form
  const isFormValid = () => {
    if (!selectedPaymentMethod || !selectedPaymentAccount) return false;
    if (currentPaymentAmount <= 0) return false;
    
    const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
    if (selectedMethod?.requires_reference && !reference.trim()) return false;
    
    return true;
  };

  // Handle payment submission
  const handlePaymentSubmit = async () => {
    if (paymentEntries.length === 0) {
      toast.error('Please add at least one payment');
      return;
    }

    if (!allowMultiplePayments && paymentEntries.length > 1) {
      toast.error('Only single payment is allowed');
      return;
    }

    setIsProcessing(true);
    try {
      await onPaymentComplete(paymentEntries, totalPaid);
      toast.success(`Payment processed successfully! Total: ${totalPaid.toFixed(2)}`);
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

        {/* Payment Summary - Enhanced */}
        <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="text-center mb-4">
            <div className="text-sm text-gray-600 mb-1">Total Amount</div>
            <div className="text-3xl font-bold text-blue-600">
              ${amount.toFixed(2)}
            </div>
          </div>
          
          {paymentEntries.length > 0 && (
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600 mb-1">Paid</div>
                <div className={`text-xl font-bold ${isFullyPaid ? 'text-green-600' : 'text-orange-600'}`}>
                  ${totalPaid.toFixed(2)}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">Remaining</div>
                <div className={`text-xl font-bold ${remainingAmount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ${remainingAmount.toFixed(2)}
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  isFullyPaid ? 'bg-green-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min((totalPaid / amount) * 100, 100)}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500 mt-1 text-center">
              {Math.round((totalPaid / amount) * 100)}% Complete
            </div>
          </div>
        </div>

        {/* Payment Entries List */}
        {paymentEntries.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment Entries</h3>
            <div className="space-y-2">
              {paymentEntries.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getPaymentMethodIcon(payment.paymentMethod.toLowerCase().replace(/\s+/g, '_'))}
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
                    onClick={() => removePaymentEntry(payment.id)}
                    className="p-1 text-red-500 hover:text-red-700 transition-colors"
                    disabled={isProcessing}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Streamlined Add Payment Form */}
        {showAddPayment && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Add Payment</h3>
              <button
                onClick={() => {
                  setShowAddPayment(false);
                  setSelectedPaymentMethod('');
                  setSelectedPaymentAccount('');
                  setReference('');
                  setNotes('');
                  setCurrentPaymentAmount(0);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Payment Amount - Auto-filled */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount
                </label>
                <GlassInput
                  type="number"
                  value={currentPaymentAmount}
                  onChange={(e) => setCurrentPaymentAmount(Number(e.target.value))}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  max={remainingAmount}
                  leftIcon={<DollarSign className="w-4 h-4" />}
                />
              </div>

              {/* Payment Method - Quick Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
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
              </div>

              {/* Payment Account - Auto-selected */}
              {selectedPaymentMethod && (
                <div>
                  <PaymentAccountSelector
                    value={selectedPaymentAccount}
                    onChange={setSelectedPaymentAccount}
                    type="all"
                    showIcons={true}
                    showDescriptions={false}
                    disabled={isProcessing}
                    required={true}
                  />
                </div>
              )}

              {/* Reference Number - Only if required */}
              {selectedPaymentMethod && (() => {
                const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
                const requiresRef = selectedMethod && requiresReferenceNumber(selectedMethod);
                
                if (!requiresRef) return null;
                
                return (
                  <div>
                    <GlassInput
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder={getReferencePlaceholder(selectedMethod?.name)}
                      disabled={isProcessing}
                    />
                  </div>
                );
              })()}

              {/* Quick Add Button */}
              <GlassButton
                onClick={addPaymentEntry}
                variant="primary"
                className="w-full"
                disabled={!isFormValid() || isProcessing}
                icon={<Plus className="w-4 h-4" />}
              >
                Add Payment
              </GlassButton>
            </div>
          </div>
        )}

        {/* One-Click Payment Buttons (Single Payment) */}
        {!allowMultiplePayments && !showAddPayment && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick Pay</h3>
            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.slice(0, 4).map((method) => (
                <button
                  key={method.id}
                  onClick={() => {
                    setSelectedPaymentMethod(method.id);
                    setCurrentPaymentAmount(amount);
                    // Auto-select compatible account
                    const compatibleAccount = paymentAccounts.find(account => 
                      account.type === method.type || 
                      (method.type === 'mobile_money' && account.type === 'mobile_money') ||
                      (method.type === 'card' && account.type === 'credit_card')
                    );
                    if (compatibleAccount) {
                      setSelectedPaymentAccount(compatibleAccount.id);
                    }
                    setShowAddPayment(true);
                  }}
                  className="p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all text-center"
                  disabled={isProcessing}
                >
                  <div className="flex flex-col items-center space-y-2">
                    {getPaymentMethodIcon(method.type)}
                    <span className="text-sm font-medium">{method.name}</span>
                    <span className="text-xs text-gray-500">${amount.toFixed(2)}</span>
                  </div>
                </button>
              ))}
            </div>
            
            <div className="mt-3">
              <GlassButton
                onClick={() => setShowAddPayment(true)}
                variant="outline"
                className="w-full"
                icon={<Plus className="w-4 h-4" />}
              >
                Custom Payment
              </GlassButton>
            </div>
          </div>
        )}

        {/* Single Payment Form */}
        {!allowMultiplePayments && showAddPayment && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Payment Details</h3>
              <button
                onClick={() => {
                  setShowAddPayment(false);
                  setSelectedPaymentMethod('');
                  setSelectedPaymentAccount('');
                  setReference('');
                  setNotes('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Payment Method - Pre-selected */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
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
              </div>

              {/* Payment Account - Auto-selected */}
              {selectedPaymentMethod && (
                <div>
                  <PaymentAccountSelector
                    value={selectedPaymentAccount}
                    onChange={setSelectedPaymentAccount}
                    type="all"
                    showIcons={true}
                    showDescriptions={false}
                    disabled={isProcessing}
                    required={true}
                  />
                </div>
              )}

              {/* Reference Number - Only if required */}
              {selectedPaymentMethod && (() => {
                const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
                const requiresRef = selectedMethod && requiresReferenceNumber(selectedMethod);
                
                if (!requiresRef) return null;
                
                return (
                  <div>
                    <GlassInput
                      type="text"
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      placeholder={getReferencePlaceholder(selectedMethod?.name)}
                      disabled={isProcessing}
                    />
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Quick Payment Buttons */}
        {!isFullyPaid && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Quick Payments</h3>
            
            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { label: '25%', value: amount * 0.25 },
                { label: '50%', value: amount * 0.5 },
                { label: '75%', value: amount * 0.75 },
                { label: 'Full', value: amount },
                { label: 'Custom', value: 0 }
              ].map((quick) => (
                <button
                  key={quick.label}
                  onClick={() => {
                    if (quick.label === 'Custom') {
                      setShowAddPayment(true);
                    } else {
                      setCurrentPaymentAmount(quick.value);
                      setShowAddPayment(true);
                    }
                  }}
                  className={`p-3 rounded-lg border-2 transition-all text-sm font-medium ${
                    quick.label === 'Custom'
                      ? 'border-dashed border-gray-300 text-gray-600 hover:border-gray-400'
                      : 'border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                  disabled={isProcessing}
                >
                  {quick.label === 'Custom' ? 'Custom' : `$${quick.value.toFixed(0)}`}
                </button>
              ))}
            </div>

            {/* Quick Payment Method Buttons */}
            {currentPaymentAmount > 0 && (
              <div className="space-y-2">
                <div className="text-sm text-gray-600 mb-2">
                  Pay ${currentPaymentAmount.toFixed(2)} with:
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.slice(0, 4).map((method) => (
                    <button
                      key={method.id}
                      onClick={() => {
                        setSelectedPaymentMethod(method.id);
                        // Auto-select compatible account
                        const compatibleAccount = paymentAccounts.find(account => 
                          account.type === method.type || 
                          (method.type === 'mobile_money' && account.type === 'mobile_money') ||
                          (method.type === 'card' && account.type === 'credit_card')
                        );
                        if (compatibleAccount) {
                          setSelectedPaymentAccount(compatibleAccount.id);
                        }
                        setShowAddPayment(true);
                      }}
                      className="p-3 rounded-lg border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all"
                      disabled={isProcessing}
                    >
                      <div className="flex items-center space-x-2">
                        {getPaymentMethodIcon(method.type)}
                        <span className="text-sm font-medium">{method.name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

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
          
          {/* Single Payment Button */}
          {!allowMultiplePayments && selectedPaymentMethod && selectedPaymentAccount && (
            <GlassButton
              onClick={async () => {
                if (!isFormValid()) return;
                
                const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
                const newPayment: PaymentEntry = {
                  id: crypto.randomUUID(),
                  amount: currentPaymentAmount || amount,
                  paymentMethod: selectedMethod?.name || selectedPaymentMethod,
                  paymentAccountId: selectedPaymentAccount,
                  reference: reference.trim() || undefined,
                  notes: notes.trim() || undefined,
                  timestamp: new Date().toISOString()
                };
                
                await onPaymentComplete([newPayment], newPayment.amount);
                onClose();
              }}
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
                  Pay ${(currentPaymentAmount || amount).toFixed(2)}
                </>
              )}
            </GlassButton>
          )}
          
          {/* Multiple Payment Button */}
          {allowMultiplePayments && (
            <GlassButton
              onClick={handlePaymentSubmit}
              variant="primary"
              className="flex-1"
              disabled={paymentEntries.length === 0 || isProcessing}
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
                  {isFullyPaid ? 'Complete Payment' : `Pay ${totalPaid.toFixed(2)} of ${amount.toFixed(2)}`}
                </>
              )}
            </GlassButton>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default PaymentsPopupModal;
