import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabaseClient';
import { useAuth } from '../../../context/AuthContext';
import { usePaymentMethods } from '../../../hooks/usePaymentMethods';
import { usePaymentAccounts } from '../../../hooks/usePaymentAccounts';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import GlassInput from '../../shared/components/ui/GlassInput';
import GlassSelect from '../../shared/components/ui/GlassSelect';
import { PaymentAccountSelector } from '../../shared/components/ui/PaymentMethodSelector';
import { 
  X, 
  DollarSign, 
  CreditCard, 
  Smartphone, 
  Building,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface RepairPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  deviceId?: string;
  deviceName?: string;
  repairAmount: number;
  onPaymentComplete: (paymentData: any) => void;
}

interface PaymentData {
  customerId: string;
  deviceId?: string;
  amount: number;
  paymentMethod: string;
  paymentAccountId: string;
  reference?: string;
  notes?: string;
  paymentType: 'repair_payment';
}

const RepairPaymentModal: React.FC<RepairPaymentModalProps> = ({
  isOpen,
  onClose,
  customerId,
  customerName,
  deviceId,
  deviceName,
  repairAmount,
  onPaymentComplete
}) => {
  const { user } = useAuth();
  const { paymentMethods, loading: methodsLoading } = usePaymentMethods();
  const { paymentAccounts, loading: accountsLoading } = usePaymentAccounts();
  
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

  // Validate form
  const isFormValid = () => {
    if (!selectedPaymentMethod || !selectedPaymentAccount) return false;
    if (repairAmount <= 0) return false;
    
    const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
    if (selectedMethod?.requiresReference && !reference.trim()) return false;
    
    return true;
  };

  // Handle payment submission
  const handlePaymentSubmit = async () => {
    if (!isFormValid() || !user) return;

    // Validate mobile money payments
    const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
    if (selectedMethod?.type === 'mobile_money') {
      if (!reference.trim()) {
        toast.error('Reference number is required for mobile money payments');
        return;
      }
      
      // Validate reference format for mobile money
      const referenceRegex = /^[0-9A-Za-z]{6,12}$/;
      if (!referenceRegex.test(reference.trim())) {
        toast.error('Please enter a valid reference number (6-12 characters)');
        return;
      }
    }

    setIsProcessing(true);
    try {
      const selectedMethod = paymentMethods.find(m => m.id === selectedPaymentMethod);
      const selectedAccount = paymentAccounts.find(a => a.id === selectedPaymentAccount);

      // Create payment record
      const paymentData: PaymentData = {
        customerId,
        deviceId,
        amount: repairAmount,
        paymentMethod: selectedMethod?.name || selectedPaymentMethod,
        paymentAccountId: selectedPaymentAccount,
        reference: reference.trim() || undefined,
        notes: notes.trim() || undefined,
        paymentType: 'repair_payment'
      };

      // Insert into customer_payments table
      const { data: paymentRecord, error: paymentError } = await supabase
        .from('customer_payments')
        .insert({
          customer_id: customerId,
          device_id: deviceId,
          amount: repairAmount,
          payment_method: selectedMethod?.name || selectedPaymentMethod,
          payment_account_id: selectedPaymentAccount,
          reference: reference.trim() || null,
          notes: notes.trim() || null,
          payment_type: 'payment',
          payment_status: 'completed',
          payment_date: new Date().toISOString(),
          created_by: user.id,
          source: 'repair_payment'
        })
        .select()
        .single();

      if (paymentError) {
        console.error('Error creating payment record:', paymentError);
        throw new Error('Failed to create payment record');
      }

      // Update finance account balance
      if (selectedAccount) {
        const { error: balanceError } = await supabase
          .from('finance_accounts')
          .update({ 
            balance: selectedAccount.balance + repairAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedPaymentAccount);

        if (balanceError) {
          console.error('Error updating account balance:', balanceError);
          // Don't throw error here as payment was already recorded
        }
      }

      // Create transaction record
      const { error: transactionError } = await supabase
        .from('finance_transactions')
        .insert({
          account_id: selectedPaymentAccount,
          type: 'income',
          amount: repairAmount,
          description: `Repair payment - ${customerName}${deviceName ? ` (${deviceName})` : ''}`,
          reference: reference.trim() || null,
          category: 'repair_services',
          created_by: user.id,
          payment_id: paymentRecord.id
        });

      if (transactionError) {
        console.error('Error creating transaction record:', transactionError);
        // Don't throw error here as payment was already recorded
      }

      toast.success('Repair payment processed successfully!');
      onPaymentComplete(paymentData);
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
            Process Repair Payment
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            disabled={isProcessing}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Customer and Device Info */}
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-2">Customer</div>
          <div className="font-medium text-gray-800">{customerName}</div>
          {deviceName && (
            <>
              <div className="text-sm text-gray-600 mt-2 mb-1">Device</div>
              <div className="font-medium text-gray-800">{deviceName}</div>
            </>
          )}
          <div className="text-sm text-gray-600 mt-2 mb-1">Amount</div>
          <div className="text-2xl font-bold text-green-600">
            ${repairAmount.toFixed(2)}
          </div>
        </div>

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
        {selectedPaymentMethod && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Number (Optional)
            </label>
            <GlassInput
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Enter reference number"
              disabled={isProcessing}
            />
          </div>
        )}

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

export default RepairPaymentModal;
