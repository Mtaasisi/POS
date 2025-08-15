// QuickCashKeypad component for LATS module
import React, { useState } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { X, DollarSign, Calculator, CheckCircle, ArrowLeft } from 'lucide-react';

interface QuickCashKeypadProps {
  isOpen: boolean;
  onClose: () => void;
  onAmountEntered: (amount: number) => void;
  suggestedAmount?: number;
}

const QuickCashKeypad: React.FC<QuickCashKeypadProps> = ({
  isOpen,
  onClose,
  onAmountEntered,
  suggestedAmount = 0
}) => {
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNumberClick = (num: string) => {
    if (num === '.' && amount.includes('.')) return;
    if (num === '.' && amount === '') {
      setAmount('0.');
      return;
    }
    setAmount(prev => prev + num);
  };

  const handleClear = () => {
    setAmount('');
  };

  const handleBackspace = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  const handleSuggestedAmount = (suggested: number) => {
    setAmount(suggested.toString());
  };

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) return;
    
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      onAmountEntered(parseFloat(amount));
    } catch (error) {
      console.error('Error processing amount:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatAmount = (value: string) => {
    if (!value) return '0.00';
    const num = parseFloat(value);
    if (isNaN(num)) return '0.00';
    return num.toFixed(2);
  };

  const suggestedAmounts = [
    { label: 'TZS 100', value: 100 },
    { label: 'TZS 500', value: 500 },
    { label: 'TZS 1,000', value: 1000 },
    { label: 'TZS 2,000', value: 2000 },
    { label: 'TZS 5,000', value: 5000 },
    { label: 'TZS 10,000', value: 10000 }
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <GlassCard className="max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calculator className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Quick Cash</h2>
                <p className="text-sm text-gray-600">Enter cash amount received</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Amount Display */}
          <div className="mb-6">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Amount Received</div>
              <div className="text-3xl font-bold text-gray-900">
                TZS {formatAmount(amount)}
              </div>
            </div>
          </div>

          {/* Suggested Amounts */}
          {suggestedAmount > 0 && (
            <div className="mb-4">
              <div className="text-sm text-gray-600 mb-2">Suggested Amount:</div>
              <button
                onClick={() => handleSuggestedAmount(suggestedAmount)}
                className="w-full p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="text-lg font-semibold text-blue-900">
                  TZS {suggestedAmount.toLocaleString()}
                </div>
                <div className="text-sm text-blue-600">Use suggested amount</div>
              </button>
            </div>
          )}

          {/* Quick Amount Buttons */}
          <div className="mb-6">
            <div className="text-sm text-gray-600 mb-2">Quick Amounts:</div>
            <div className="grid grid-cols-3 gap-2">
              {suggestedAmounts.map((suggested) => (
                <button
                  key={suggested.value}
                  onClick={() => handleSuggestedAmount(suggested.value)}
                  className="p-2 text-sm bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  {suggested.label}
                </button>
              ))}
            </div>
          </div>

          {/* Number Keypad */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button
                key={num}
                onClick={() => handleNumberClick(num.toString())}
                className="p-4 text-xl font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => handleNumberClick('.')}
              className="p-4 text-xl font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              .
            </button>
            <button
              onClick={() => handleNumberClick('0')}
              className="p-4 text-xl font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              0
            </button>
            <button
              onClick={handleBackspace}
              className="p-4 text-xl font-semibold bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mx-auto" />
            </button>
          </div>

          {/* Control Buttons */}
          <div className="flex gap-3 mb-4">
            <GlassButton
              onClick={handleClear}
              variant="secondary"
              className="flex-1"
            >
              Clear
            </GlassButton>
            <GlassButton
              onClick={handleSubmit}
              disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
              className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white"
            >
              {isSubmitting ? 'Processing...' : 'Confirm Amount'}
            </GlassButton>
          </div>

          {/* Change Calculation */}
          {amount && parseFloat(amount) > 0 && suggestedAmount > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="text-sm text-green-800 font-medium">Change Due:</div>
              <div className="text-lg font-bold text-green-900">
                TZS {(parseFloat(amount) - suggestedAmount).toFixed(2)}
              </div>
            </div>
          )}
        </div>
      </GlassCard>
    </div>
  );
};

export default QuickCashKeypad;
