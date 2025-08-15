import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import GlassCard from '../../shared/components/ui/GlassCard';
import GlassButton from '../../shared/components/ui/GlassButton';
import { X, DollarSign, Calculator, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { format } from '../lib/format';

interface QuickCashPageProps {
  // Optional props for when used as a component
  onAmountEntered?: (amount: number) => void;
  onClose?: () => void;
  isOpen?: boolean;
  suggestedAmount?: number;
}



const QuickCashPage: React.FC<QuickCashPageProps> = ({ 
  onAmountEntered, 
  onClose,
  isOpen = false,
  suggestedAmount = 0
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Get suggested amount from props or URL params or default to 0
  const finalSuggestedAmount = suggestedAmount || parseFloat(new URLSearchParams(location.search).get('amount') || '0');

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
      const finalAmount = parseFloat(amount);
      
      if (onAmountEntered) {
        // If used as a modal component, call the callback
        onAmountEntered(finalAmount);
      } else {
        // If used as a page, navigate back with the amount
        navigate(-1, { 
          state: { 
            quickCashAmount: finalAmount,
            change: finalSuggestedAmount > 0 ? finalAmount - finalSuggestedAmount : 0
          } 
        });
      }
    } catch (error) {
      console.error('Error processing amount:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(-1);
    }
  };

  // If used as modal and not open, don't render
  if (!isOpen && onClose) {
    return null;
  }

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

  return (
    <div className={`${onClose ? 'fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4' : 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4'}`}>
      <div className={`${onClose ? 'w-full max-w-2xl' : 'max-w-2xl mx-auto'}`}>
        <GlassCard className="w-full">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                {!onClose && (
                  <button
                    onClick={handleCancel}
                    className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                )}
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <Calculator className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quick Cash</h1>
                    <p className="text-sm text-gray-600">Enter cash amount received</p>
                  </div>
                </div>
              </div>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              )}
            </div>

            {/* Amount Display */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 text-center border border-green-200">
                <div className="text-sm text-green-700 mb-2 font-medium">Amount Received</div>
                <div className="text-4xl font-bold text-green-900">
                  TZS {formatAmount(amount)}
                </div>
              </div>
            </div>

            {/* Suggested Amount */}
            {finalSuggestedAmount > 0 && (
              <div className="mb-6">
                <div className="text-sm text-gray-600 mb-3 font-medium">Suggested Amount:</div>
                <button
                  onClick={() => handleSuggestedAmount(finalSuggestedAmount)}
                  className="w-full p-4 bg-blue-50 border-2 border-blue-200 rounded-xl hover:bg-blue-100 transition-colors"
                >
                  <div className="text-xl font-bold text-blue-900">
                    TZS {finalSuggestedAmount.toLocaleString()}
                  </div>
                  <div className="text-sm text-blue-600">Use suggested amount</div>
                </button>
              </div>
            )}

            {/* Quick Amount Buttons */}
            <div className="mb-8">
              <div className="text-sm text-gray-600 mb-3 font-medium">Quick Amounts:</div>
              <div className="grid grid-cols-3 gap-3">
                {suggestedAmounts.map((suggested) => (
                  <button
                    key={suggested.value}
                    onClick={() => handleSuggestedAmount(suggested.value)}
                    className="p-3 text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors font-medium"
                  >
                    {suggested.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Number Keypad */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num.toString())}
                  className="p-6 text-2xl font-bold bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
                >
                  {num}
                </button>
              ))}
              <button
                onClick={() => handleNumberClick('.')}
                className="p-6 text-2xl font-bold bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                .
              </button>
              <button
                onClick={() => handleNumberClick('0')}
                className="p-6 text-2xl font-bold bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="p-6 text-2xl font-bold bg-white border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-colors"
              >
                <ArrowLeft className="w-6 h-6 mx-auto" />
              </button>
            </div>

            {/* Control Buttons */}
            <div className="flex gap-4 mb-6">
              <GlassButton
                onClick={handleClear}
                variant="secondary"
                className="flex-1 py-4 text-lg font-semibold"
              >
                Clear
              </GlassButton>
              <GlassButton
                onClick={handleSubmit}
                disabled={!amount || parseFloat(amount) <= 0 || isSubmitting}
                className="flex-1 py-4 text-lg font-semibold bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700"
              >
                {isSubmitting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Processing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Confirm Amount
                  </div>
                )}
              </GlassButton>
            </div>

            {/* Change Calculation */}
            {amount && parseFloat(amount) > 0 && finalSuggestedAmount > 0 && (
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
                <div className="text-sm text-green-800 font-medium mb-1">Change Due:</div>
                <div className="text-2xl font-bold text-green-900">
                  TZS {(parseFloat(amount) - finalSuggestedAmount).toFixed(2)}
                </div>
                <div className="text-xs text-green-600 mt-1">
                  Amount received: TZS {parseFloat(amount).toLocaleString()} | 
                  Total due: TZS {finalSuggestedAmount.toLocaleString()}
                </div>
              </div>
            )}




          </div>
        </GlassCard>
      </div>

    </div>
  );
};

export default QuickCashPage;
