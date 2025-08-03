import React, { useState } from 'react';
import { PaymentMethod } from '../../types';
import TouchOptimizedButton from '../ui/TouchOptimizedButton';
import Modal from '../ui/Modal';
import {
  DollarSign,
  CreditCard,
  Banknote,
  Smartphone,
  Truck,
  Clock,
  Calculator,
  X,
  Plus,
  Minus
} from 'lucide-react';

interface QuickPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  amountPaid: number;
  setAmountPaid: (amount: number) => void;
  finalAmount: number;
  balanceDue: number;
  onComplete: () => void;
}

const QuickPaymentModal: React.FC<QuickPaymentModalProps> = ({
  isOpen,
  onClose,
  paymentMethod,
  setPaymentMethod,
  amountPaid,
  setAmountPaid,
  finalAmount,
  balanceDue,
  onComplete
}) => {
  const [tempAmount, setTempAmount] = useState(amountPaid.toString());

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
        return <Banknote className="w-6 h-6" />;
      case 'card':
        return <CreditCard className="w-6 h-6" />;
      case 'transfer':
        return <Smartphone className="w-6 h-6" />;
      case 'installment':
        return <Clock className="w-6 h-6" />;
      case 'payment_on_delivery':
        return <Truck className="w-6 h-6" />;
      default:
        return <DollarSign className="w-6 h-6" />;
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

  const handleQuickAmount = (amount: number) => {
    setTempAmount(amount.toString());
    setAmountPaid(amount);
  };

  const handleAmountChange = (value: string) => {
    const amount = parseFloat(value) || 0;
    setTempAmount(value);
    setAmountPaid(amount);
  };

  const handleComplete = () => {
    onComplete();
    onClose();
  };

  const paymentMethods: PaymentMethod[] = ['cash', 'card', 'transfer', 'installment', 'payment_on_delivery'];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl">
              <DollarSign className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Payment</h2>
              <p className="text-gray-600">Select payment method and amount</p>
            </div>
          </div>
          <TouchOptimizedButton
            onClick={onClose}
            variant="secondary"
            size="sm"
            icon={X}
            className="w-12 h-12 rounded-full"
          >
            Close
          </TouchOptimizedButton>
        </div>

        {/* Payment Method Selection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h3>
          <div className="grid grid-cols-2 gap-4">
            {paymentMethods.map((method) => (
              <TouchOptimizedButton
                key={method}
                onClick={() => setPaymentMethod(method)}
                variant={paymentMethod === method ? 'primary' : 'secondary'}
                size="md"
                icon={getPaymentMethodIcon(method)}
                className="text-left justify-start"
              >
                <div className="flex flex-col items-start">
                  <span className="font-semibold text-sm">{getPaymentMethodLabel(method)}</span>
                </div>
              </TouchOptimizedButton>
            ))}
          </div>
        </div>

        {/* Amount Entry */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Amount</h3>
          
          {/* Amount Input */}
          <div className="mb-4">
            <input
              type="number"
              value={tempAmount}
              onChange={(e) => handleAmountChange(e.target.value)}
              placeholder="Enter amount..."
              className="w-full px-4 py-4 border-2 border-gray-200 rounded-2xl bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-2xl font-bold text-center"
            />
          </div>

          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <TouchOptimizedButton
              onClick={() => handleQuickAmount(finalAmount)}
              variant="secondary"
              size="sm"
              className="text-sm"
            >
              Full Amount
            </TouchOptimizedButton>
            <TouchOptimizedButton
              onClick={() => handleQuickAmount(finalAmount * 0.5)}
              variant="secondary"
              size="sm"
              className="text-sm"
            >
              Half
            </TouchOptimizedButton>
            <TouchOptimizedButton
              onClick={() => handleQuickAmount(0)}
              variant="secondary"
              size="sm"
              className="text-sm"
            >
              Clear
            </TouchOptimizedButton>
          </div>

          {/* Amount Increment/Decrement */}
          <div className="flex items-center justify-center gap-4">
            <TouchOptimizedButton
              onClick={() => handleQuickAmount(amountPaid - 1000)}
              variant="secondary"
              size="sm"
              icon={Minus}
              className="w-16 h-16 rounded-full"
            >
              1000
            </TouchOptimizedButton>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{formatCurrency(amountPaid)}</div>
              <div className="text-sm text-gray-600">Amount Paid</div>
            </div>
            
            <TouchOptimizedButton
              onClick={() => handleQuickAmount(amountPaid + 1000)}
              variant="secondary"
              size="sm"
              icon={Plus}
              className="w-16 h-16 rounded-full"
            >
              1000
            </TouchOptimizedButton>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="mb-6 p-4 bg-gray-50 rounded-2xl">
          <div className="space-y-2">
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
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <TouchOptimizedButton
            onClick={handleComplete}
            variant="primary"
            size="lg"
            icon={DollarSign}
            disabled={amountPaid < 0}
            className="flex-1"
          >
            Complete Payment
          </TouchOptimizedButton>
          
          <TouchOptimizedButton
            onClick={onClose}
            variant="secondary"
            size="lg"
            icon={X}
            className="flex-1"
          >
            Cancel
          </TouchOptimizedButton>
        </div>
      </div>
    </Modal>
  );
};

export default QuickPaymentModal; 