import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { X, DollarSign, AlertTriangle } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: {
    id: string;
    transactionId: string;
    customerName: string;
    amount: number;
    method: string;
    source: 'device_payment' | 'pos_sale' | 'repair_payment';
  };
  onRefundComplete: () => void;
}

const RefundModal: React.FC<RefundModalProps> = ({ 
  isOpen, 
  onClose, 
  payment, 
  onRefundComplete 
}) => {
  const [refundAmount, setRefundAmount] = useState(payment.amount);
  const [refundReason, setRefundReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const handleRefund = async () => {
    if (!refundReason.trim()) {
      toast.error('Please provide a refund reason');
      return;
    }

    if (refundAmount <= 0 || refundAmount > payment.amount) {
      toast.error('Invalid refund amount');
      return;
    }

    setIsProcessing(true);
    try {
      // Create refund record
      const refundData = {
        original_payment_id: payment.id,
        customer_id: payment.source === 'device_payment' ? payment.id : null,
        amount: refundAmount,
        refund_reason: refundReason.trim(),
        refund_method: payment.method,
        refund_status: 'completed',
        refund_date: new Date().toISOString(),
        transaction_id: `REF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        source: payment.source
      };

      let refundResult;
      
      if (payment.source === 'device_payment' || payment.source === 'repair_payment') {
        // Validate customer_id - must be UUID or null
        let validCustomerId = null;
        if (payment.id) {
          // Check if it's a valid UUID format
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(payment.id)) {
            validCustomerId = payment.id;
          } else {
            console.warn('⚠️ Invalid customer_id format in refund, using null instead:', payment.id);
            validCustomerId = null;
          }
        }

        // Insert into customer_payments with refund type
        refundResult = await supabase
          .from('customer_payments')
          .insert({
            customer_id: validCustomerId, // Validated UUID or null
            device_id: payment.source === 'device_payment' ? payment.id : null,
            amount: -refundAmount, // Negative amount for refund
            method: payment.method,
            payment_type: 'refund',
            status: 'completed',
            payment_date: new Date().toISOString()
          });
      } else {
        // For POS sales, create a refund transaction
        refundResult = await supabase
          .from('payment_transactions')
          .insert({
            order_id: `REF-${payment.id}`,
            provider: 'internal',
            amount: refundAmount,
            status: 'completed',
            customer_name: payment.customerName,
            reference: `Refund for ${payment.transactionId}`,
            metadata: {
              original_payment_id: payment.id,
              refund_reason: refundReason,
              refund_type: 'full'
            }
          });
      }

      if (refundResult.error) {
        throw new Error(refundResult.error.message);
      }

      toast.success(`Refund of ${formatMoney(refundAmount)} processed successfully`);
      onRefundComplete();
      onClose();
      
    } catch (error) {
      console.error('Error processing refund:', error);
      toast.error('Failed to process refund. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Process Refund</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Payment Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-medium text-gray-900">{payment.customerName}</div>
              <div className="text-sm text-gray-600">{payment.transactionId}</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-600">Original Amount</div>
              <div className="font-medium">{formatMoney(payment.amount)}</div>
            </div>
            <div>
              <div className="text-gray-600">Payment Method</div>
              <div className="font-medium">{payment.method}</div>
            </div>
          </div>
        </div>

        {/* Refund Form */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refund Amount
            </label>
            <input
              type="number"
              value={refundAmount}
              onChange={(e) => setRefundAmount(Number(e.target.value))}
              max={payment.amount}
              min={0}
              step="1000"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              <span>Maximum: {formatMoney(payment.amount)}</span>
              <span>Refunding: {formatMoney(refundAmount)}</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Refund Reason *
            </label>
            <textarea
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Please specify the reason for this refund..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              required
            />
          </div>

          {/* Warning */}
          <div className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-yellow-800">
              <div className="font-medium mb-1">Refund Warning</div>
              <div>This action will create a refund transaction and cannot be undone. Please ensure all details are correct.</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          <GlassButton
            onClick={onClose}
            variant="secondary"
            className="flex-1"
            disabled={isProcessing}
          >
            Cancel
          </GlassButton>
          <GlassButton
            onClick={handleRefund}
            className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white"
            disabled={isProcessing || !refundReason.trim()}
            loading={isProcessing}
          >
            {isProcessing ? 'Processing...' : `Refund ${formatMoney(refundAmount)}`}
          </GlassButton>
        </div>
      </GlassCard>
    </div>
  );
};

export default RefundModal;
