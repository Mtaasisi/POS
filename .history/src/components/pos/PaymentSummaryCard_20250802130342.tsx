import React from 'react';
import { PaymentMethod } from '../../types';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import {
  CreditCard,
  DollarSign,
  Edit,
  CheckCircle,
  AlertCircle,
  Banknote,
  Smartphone,
  Clock,
  Truck
} from 'lucide-react';

interface PaymentSummaryCardProps {
  paymentMethod: PaymentMethod;
  amountPaid: number;
  finalAmount: number;
  balanceDue: number;
  onOpenPaymentModal: () => void;
}

const PaymentSummaryCard: React.FC<PaymentSummaryCardProps> = ({
  paymentMethod,
  amountPaid,
  finalAmount,
  balanceDue,
  onOpenPaymentModal
}) => {
  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'cash':
        return <Banknote className="w-4 h-4" />;
      case 'card':
        return <CreditCard className="w-4 h-4" />;
      case 'transfer':
        return <Smartphone className="w-4 h-4" />;
      case 'installment':
        return <Clock className="w-4 h-4" />;
      case 'payment_on_delivery':
        return <Truck className="w-4 h-4" />;
      default:
        return <DollarSign className="w-4 h-4" />;
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethod) => {
    switch (method) {
      case 'cash':
        return 'Cash';
      case 'card':
        return 'Card';
      case 'transfer':
        return 'Transfer';
      case 'installment':
        return 'Installment';
      case 'payment_on_delivery':
        return 'Payment on Delivery';
      default:
        return method;
    }
  };

  const getPaymentMethodColor = (method: PaymentMethod) => {
    switch (method) {
      case 'cash':
        return 'text-green-600 bg-green-100';
      case 'card':
        return 'text-blue-600 bg-blue-100';
      case 'transfer':
        return 'text-purple-600 bg-purple-100';
      case 'installment':
        return 'text-yellow-600 bg-yellow-100';
      case 'payment_on_delivery':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <GlassCard className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl">
            <CreditCard className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Payment</h3>
            <p className="text-sm text-gray-600">Method & amount</p>
          </div>
        </div>
        
        <GlassButton
          onClick={onOpenPaymentModal}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
        >
          <Edit className="w-4 h-4 mr-2" />
          Configure
        </GlassButton>
      </div>

      <div className="space-y-3">
        {/* Payment Method */}
        <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-xl">
          <div className="flex items-center gap-2">
            {getPaymentMethodIcon(paymentMethod)}
            <span className="font-medium text-gray-900">{getPaymentMethodLabel(paymentMethod)}</span>
          </div>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPaymentMethodColor(paymentMethod)}`}>
            {getPaymentMethodLabel(paymentMethod)}
          </span>
        </div>

        {/* Payment Summary */}
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-600">Total Amount:</span>
            <span className="font-semibold text-gray-900">{formatCurrency(finalAmount)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Amount Paid:</span>
            <span className="font-semibold text-green-600">{formatCurrency(amountPaid)}</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Balance Due:</span>
            <span className={`font-semibold ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(balanceDue)}
            </span>
          </div>
        </div>

        {/* Payment Status */}
        <div className="flex items-center gap-2 pt-2">
          {balanceDue > 0 ? (
            <>
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-red-600 font-medium">Payment Required</span>
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600 font-medium">Payment Complete</span>
            </>
          )}
        </div>
      </div>
    </GlassCard>
  );
};

export default PaymentSummaryCard; 