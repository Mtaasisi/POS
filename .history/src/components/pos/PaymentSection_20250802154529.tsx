import React from 'react';
import { PaymentMethod } from '../../types';
import GlassButton from '../ui/GlassButton';
import {
  CreditCard,
  DollarSign,
  Calculator,
  AlertCircle,
  CheckCircle,
  Clock,
  Truck,
  Receipt,
  Wallet,
  Banknote,
  Smartphone,
  TrendingUp,
  TrendingDown,
  Percent,
  Minus,
  Plus
} from 'lucide-react';

interface PaymentSectionProps {
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  amountPaid: number;
  setAmountPaid: (amount: number) => void;
  finalAmount: number;
  balanceDue: number;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
  paymentMethod,
  setPaymentMethod,
  amountPaid,
  setAmountPaid,
  finalAmount,
  balanceDue
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'cash':
        return <Banknote className="w-5 h-5" />;
      case 'card':
        return <CreditCard className="w-5 h-5" />;
      case 'transfer':
        return <Smartphone className="w-5 h-5" />;
      case 'installment':
        return <Clock className="w-5 h-5" />;
      case 'payment_on_delivery':
        return <Truck className="w-5 h-5" />;
      default:
        return <Wallet className="w-5 h-5" />;
    }
  };

  const getPaymentMethodColor = (method: PaymentMethod) => {
    switch (method) {
      case 'cash':
        return 'from-green-500 to-emerald-600';
      case 'card':
        return 'from-blue-500 to-indigo-600';
      case 'transfer':
        return 'from-purple-500 to-pink-600';
      case 'installment':
        return 'from-yellow-500 to-orange-600';
      case 'payment_on_delivery':
        return 'from-red-500 to-pink-600';
      default:
        return 'from-gray-500 to-gray-600';
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

  const handleAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    setAmountPaid(amount);
  };

  const handleQuickAmount = (percentage: number) => {
    const amount = finalAmount * (percentage / 100);
    setAmountPaid(amount);
  };

  const isPaymentOnDelivery = paymentMethod === 'payment_on_delivery';
  const isInstallment = paymentMethod === 'installment';

  return (
    <div className="space-y-6">
      {/* Payment Method Selection */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-4">
          Payment Method
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['cash', 'card', 'transfer', 'installment', 'payment_on_delivery'] as PaymentMethod[]).map((method) => (
            <GlassButton
              key={method}
              variant={paymentMethod === method ? 'default' : 'outline'}
              onClick={() => setPaymentMethod(method)}
              className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-200 ${
                paymentMethod === method
                  ? `bg-gradient-to-r ${getPaymentMethodColor(method)} text-white shadow-lg`
                  : 'border-2 border-gray-200 hover:border-gray-300'
              }`}
            >
              {getPaymentMethodIcon(method)}
              <span className="font-medium">{getPaymentMethodLabel(method)}</span>
            </GlassButton>
          ))}
        </div>
      </div>

      {/* Payment Status */}
      <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-blue-100 rounded-xl">
            <Receipt className="w-5 h-5 text-blue-600" />
          </div>
          <span className="font-semibold text-blue-800">Payment Status</span>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Total Amount:</span>
            <span className="font-bold text-gray-900">{formatCurrency(finalAmount)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Amount Paid:</span>
            <span className="font-semibold text-green-600">{formatCurrency(amountPaid)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-gray-600">Balance Due:</span>
            <span className={`font-semibold ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(balanceDue)}
            </span>
          </div>
          
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
      </div>

      {/* Amount Input */}
      {!isPaymentOnDelivery && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            Amount Paid
          </label>
          
          <div className="space-y-4">
            {/* Amount Input Field */}
            <div className="relative">
              <input
                type="number"
                value={amountPaid || ''}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-lg font-semibold"
              />
              <DollarSign className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>

            {/* Quick Amount Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <GlassButton
                variant="outline"
                onClick={() => handleQuickAmount(25)}
                className="text-sm py-2 border-gray-200 hover:border-blue-300"
              >
                25%
              </GlassButton>
              <GlassButton
                variant="outline"
                onClick={() => handleQuickAmount(50)}
                className="text-sm py-2 border-gray-200 hover:border-blue-300"
              >
                50%
              </GlassButton>
              <GlassButton
                variant="outline"
                onClick={() => handleQuickAmount(100)}
                className="text-sm py-2 border-gray-200 hover:border-blue-300"
              >
                100%
              </GlassButton>
            </div>

            {/* Amount Adjustment Buttons */}
            <div className="flex items-center gap-2">
              <GlassButton
                variant="outline"
                onClick={() => setAmountPaid(Math.max(0, amountPaid - 1000))}
                className="flex-1 border-gray-200 hover:border-red-300 text-gray-600"
              >
                <Minus className="w-4 h-4 mr-2" />
                -1,000
              </GlassButton>
              
              <GlassButton
                variant="outline"
                onClick={() => setAmountPaid(amountPaid + 1000)}
                className="flex-1 border-gray-200 hover:border-green-300 text-gray-600"
              >
                <Plus className="w-4 h-4 mr-2" />
                +1,000
              </GlassButton>
            </div>
          </div>
        </div>
      )}

      {/* Payment on Delivery Notice */}
      {isPaymentOnDelivery && (
        <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200/50 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Truck className="w-5 h-5 text-yellow-600" />
            <span className="font-semibold text-yellow-800">Payment on Delivery</span>
          </div>
          <p className="text-sm text-yellow-700">
            Customer will pay the full amount of {formatCurrency(finalAmount)} upon delivery.
          </p>
        </div>
      )}

      {/* Installment Notice */}
      {isInstallment && balanceDue > 0 && (
        <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50 rounded-2xl">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-purple-600" />
            <span className="font-semibold text-purple-800">Installment Payment</span>
          </div>
          <p className="text-sm text-purple-700">
            Balance of {formatCurrency(balanceDue)} will be collected in installments.
          </p>
        </div>
      )}

      {/* Payment Summary */}
      <div className="p-4 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/50 rounded-2xl">
        <div className="flex items-center gap-3 mb-3">
          <Calculator className="w-5 h-5 text-emerald-600" />
          <span className="font-semibold text-emerald-800">Payment Summary</span>
        </div>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Method:</span>
            <span className="font-medium text-gray-900 capitalize">{getPaymentMethodLabel(paymentMethod)}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Status:</span>
            <span className={`font-medium ${balanceDue <= 0 ? 'text-green-600' : 'text-yellow-600'}`}>
              {balanceDue <= 0 ? 'Paid' : 'Partial'}
            </span>
          </div>
          
          {balanceDue > 0 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Remaining:</span>
              <span className="font-semibold text-red-600">{formatCurrency(balanceDue)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentSection; 