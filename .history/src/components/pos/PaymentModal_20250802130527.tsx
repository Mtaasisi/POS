import React, { useState } from 'react';
import { PaymentMethod } from '../../types';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import Modal from '../ui/Modal';
import {
  CreditCard,
  DollarSign,
  Banknote,
  Smartphone,
  Clock,
  Truck,
  Plus,
  Minus,
  Percent,
  CheckCircle
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  paymentMethod: PaymentMethod;
  setPaymentMethod: (method: PaymentMethod) => void;
  amountPaid: number;
  setAmountPaid: (amount: number) => void;
  finalAmount: number;
  balanceDue: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  paymentMethod,
  setPaymentMethod,
  amountPaid,
  setAmountPaid,
  finalAmount,
  balanceDue
}) => {
  const [tempAmountPaid, setTempAmountPaid] = useState(amountPaid);

  const paymentMethods = [
    { value: 'cash', label: 'Cash', icon: <Banknote className="w-4 h-4" />, color: 'from-green-500 to-emerald-600' },
    { value: 'card', label: 'Card', icon: <CreditCard className="w-4 h-4" />, color: 'from-blue-500 to-indigo-600' },
    { value: 'transfer', label: 'Transfer', icon: <Smartphone className="w-4 h-4" />, color: 'from-purple-500 to-pink-600' },
    { value: 'installment', label: 'Installment', icon: <Clock className="w-4 h-4" />, color: 'from-yellow-500 to-orange-600' },
    { value: 'payment_on_delivery', label: 'Payment on Delivery', icon: <Truck className="w-4 h-4" />, color: 'from-red-500 to-pink-600' }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const handleQuickAmount = (percentage: number) => {
    const amount = (finalAmount * percentage) / 100;
    setTempAmountPaid(Math.round(amount));
  };

  const handleAmountAdjustment = (operation: 'add' | 'subtract', amount: number) => {
    if (operation === 'add') {
      setTempAmountPaid(prev => Math.min(prev + amount, finalAmount));
    } else {
      setTempAmountPaid(prev => Math.max(prev - amount, 0));
    }
  };

  const handleConfirm = () => {
    setAmountPaid(tempAmountPaid);
    toast.success('Payment configuration updated');
    onClose();
  };

  const handleCancel = () => {
    setTempAmountPaid(amountPaid);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title="Payment Configuration"
      size="lg"
    >
      <div className="p-6 space-y-6">
        {/* Payment Method Selection */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Payment Method
          </label>
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => (
              <GlassButton
                key={method.value}
                variant={paymentMethod === method.value ? 'default' : 'outline'}
                onClick={() => setPaymentMethod(method.value as PaymentMethod)}
                className={`flex items-center gap-2 py-3 ${
                  paymentMethod === method.value 
                    ? `bg-gradient-to-r ${method.color} text-white` 
                    : 'border-2 border-gray-200 hover:border-blue-300'
                }`}
              >
                {method.icon}
                <span className="text-sm">{method.label}</span>
              </GlassButton>
            ))}
          </div>
        </div>

        {/* Amount Configuration */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-4">
            Amount Configuration
          </label>
          
          <div className="space-y-4">
            {/* Total Amount Display */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Amount:</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(finalAmount)}</span>
              </div>
            </div>

            {/* Amount Paid Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Paid
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={tempAmountPaid}
                  onChange={(e) => setTempAmountPaid(Number(e.target.value))}
                  className="w-full px-4 py-3 pl-12 border-2 border-gray-200 rounded-2xl bg-white/80 backdrop-blur-sm text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter amount paid"
                  min="0"
                  max={finalAmount}
                />
                <DollarSign className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Amount
              </label>
              <div className="flex gap-2">
                <GlassButton
                  onClick={() => handleQuickAmount(25)}
                  variant="outline"
                  className="flex-1 text-xs py-2"
                >
                  25%
                </GlassButton>
                <GlassButton
                  onClick={() => handleQuickAmount(50)}
                  variant="outline"
                  className="flex-1 text-xs py-2"
                >
                  50%
                </GlassButton>
                <GlassButton
                  onClick={() => handleQuickAmount(100)}
                  variant="outline"
                  className="flex-1 text-xs py-2"
                >
                  100%
                </GlassButton>
              </div>
            </div>

            {/* Amount Adjustment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Adjust Amount
              </label>
              <div className="flex gap-2">
                <GlassButton
                  onClick={() => handleAmountAdjustment('subtract', 1000)}
                  variant="outline"
                  className="flex-1 text-xs py-2"
                >
                  <Minus className="w-3 h-3 mr-1" />
                  -1K
                </GlassButton>
                <GlassButton
                  onClick={() => handleAmountAdjustment('add', 1000)}
                  variant="outline"
                  className="flex-1 text-xs py-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  +1K
                </GlassButton>
                <GlassButton
                  onClick={() => handleAmountAdjustment('subtract', 5000)}
                  variant="outline"
                  className="flex-1 text-xs py-2"
                >
                  <Minus className="w-3 h-3 mr-1" />
                  -5K
                </GlassButton>
                <GlassButton
                  onClick={() => handleAmountAdjustment('add', 5000)}
                  variant="outline"
                  className="flex-1 text-xs py-2"
                >
                  <Plus className="w-3 h-3 mr-1" />
                  +5K
                </GlassButton>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 rounded-xl">
          <h4 className="font-semibold text-gray-900 mb-3">Payment Summary</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-semibold text-gray-900">{formatCurrency(finalAmount)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">Amount Paid:</span>
              <span className="font-semibold text-green-600">{formatCurrency(tempAmountPaid)}</span>
            </div>
            
            <div className="border-t pt-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Balance Due:</span>
                <span className={`font-semibold ${finalAmount - tempAmountPaid > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(finalAmount - tempAmountPaid)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4">
          <GlassButton
            onClick={handleConfirm}
            className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirm Payment
          </GlassButton>
          
          <GlassButton
            variant="outline"
            onClick={handleCancel}
            className="border-2 border-gray-200 hover:border-gray-300"
          >
            Cancel
          </GlassButton>
        </div>
      </div>
    </Modal>
  );
};

export default PaymentModal; 