import React, { useState, useEffect } from 'react';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import { DollarSign, Percent, X, Keyboard } from 'lucide-react';
import { toast } from 'react-hot-toast';
import VirtualNumberKeyboard from './VirtualNumberKeyboard';

interface POSDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyDiscount: (type: string, value: string) => void;
  onClearDiscount: () => void;
  currentTotal: number;
  hasExistingDiscount?: boolean;
}

const POSDiscountModal: React.FC<POSDiscountModalProps> = ({
  isOpen,
  onClose,
  onApplyDiscount,
  onClearDiscount,
  currentTotal,
  hasExistingDiscount = false
}) => {
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('fixed');
  const [discountValue, setDiscountValue] = useState('');

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-TZ', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const calculateDiscountAmount = () => {
    if (!discountValue) return 0;
    const value = parseFloat(discountValue);
    if (isNaN(value)) return 0;
    
    if (discountType === 'percentage') {
      return (currentTotal * value) / 100;
    } else {
      return value;
    }
  };

  const discountAmount = calculateDiscountAmount();
  const finalTotal = currentTotal - discountAmount;

  const handleApplyDiscount = () => {
    if (!discountValue || parseFloat(discountValue) <= 0) {
      toast.error('Please enter a valid discount value');
      return;
    }

    const value = parseFloat(discountValue);
    if (discountType === 'percentage' && value > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }

    if (discountType === 'fixed' && value > currentTotal) {
      toast.error('Fixed discount cannot exceed total amount');
      return;
    }

    onApplyDiscount(discountType, discountValue);
    setDiscountValue('');
  };

  const handleClose = () => {
    setDiscountValue('');
    onClose();
  };

  // Keyboard input handlers
  const handleKeyPress = (key: string) => {
    if (key === '.') {
      // Only allow one decimal point
      if (!discountValue.includes('.')) {
        setDiscountValue(prev => prev + key);
      }
    } else if (key === '00') {
      setDiscountValue(prev => prev + '00');
    } else if (key === '000') {
      setDiscountValue(prev => prev + '000');
    } else {
      setDiscountValue(prev => prev + key);
    }
  };

  const handleBackspace = () => {
    setDiscountValue(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    setDiscountValue('');
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      // Handle number keys
      if (event.key >= '0' && event.key <= '9') {
        event.preventDefault();
        handleKeyPress(event.key);
      }
      
      // Handle decimal point
      if (event.key === '.') {
        event.preventDefault();
        handleKeyPress('.');
      }
      
      // Handle backspace
      if (event.key === 'Backspace') {
        event.preventDefault();
        handleBackspace();
      }
      
      // Handle Enter to apply discount
      if (event.key === 'Enter') {
        event.preventDefault();
        handleApplyDiscount();
      }
      
      // Handle Escape to close
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, discountValue, discountType]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="max-w-5xl w-full p-6 max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Percent className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-800">Apply Discount</h2>
              <p className="text-sm text-gray-600">Add a discount to the transaction</p>
              <p className="text-xs text-gray-500 mt-1">💡 Tip: Use keyboard shortcuts (0-9, Enter, Escape)</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main Layout - Keyboard Focused */}
        <div className="space-y-4">
          {/* Discount Type Selection */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">Discount Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setDiscountType('fixed')}
                className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                  discountType === 'fixed'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold">Fixed Amount</div>
                  <div className="text-sm">TZS off total</div>
                </div>
              </button>
              <button
                onClick={() => setDiscountType('percentage')}
                className={`p-4 border-2 rounded-xl transition-all duration-200 ${
                  discountType === 'percentage'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-lg font-semibold">Percentage</div>
                  <div className="text-sm">% off total</div>
                </div>
              </button>
            </div>
          </div>

          {/* Amount Input - Above Keyboard */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              {discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount (TZS)'}
            </label>
            <div className="relative">
              <input
                type="text"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percentage' ? 'Enter percentage (e.g., 10)' : 'Enter amount (e.g., 5000)'}
                className="w-full p-6 text-3xl font-bold text-center border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none bg-white shadow-lg"
                readOnly
              />
              <div className="absolute right-6 top-1/2 transform -translate-y-1/2 text-gray-400 text-xl">
                {discountType === 'percentage' ? '%' : 'TZS'}
              </div>
            </div>
          </div>

          {/* Quick Percentage Buttons */}
          {discountType === 'percentage' && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-3">Quick Select</label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((percent) => (
                  <button
                    key={percent}
                    onClick={() => setDiscountValue(percent.toString())}
                    className="p-3 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors duration-200"
                  >
                    {percent}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Main Keyboard Section */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
            <label className="block text-lg font-semibold text-gray-700 mb-4 text-center">Number Keyboard</label>
            <div className="flex justify-center">
              <VirtualNumberKeyboard
                onKeyPress={handleKeyPress}
                onBackspace={handleBackspace}
                onClear={handleClear}
                className="w-full max-w-md"
              />
            </div>
          </div>
        </div>

        {/* Preview - Full Width */}
        {discountValue && (
          <div className="mt-6 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200">
            <div className="text-lg font-semibold text-purple-800 mb-3">Discount Preview:</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
                <div className="text-xs text-gray-600 mb-1">Subtotal</div>
                <div className="text-lg font-bold text-gray-900">{formatMoney(currentTotal)}</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
                <div className="text-xs text-purple-600 mb-1">Discount</div>
                <div className="text-lg font-bold text-purple-700">-{formatMoney(discountAmount)}</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                <div className="text-xs text-green-600 mb-1">Final Total</div>
                <div className="text-xl font-bold text-green-600">{formatMoney(finalTotal)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons - Full Width */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 mt-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="flex-1 py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition-colors duration-200"
          >
            Cancel
          </button>
          {hasExistingDiscount && (
            <button
              onClick={() => {
                onClearDiscount();
                handleClose();
              }}
              className="flex-1 py-3 px-6 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors duration-200"
            >
              Clear Discount
            </button>
          )}
          <button
            onClick={handleApplyDiscount}
            disabled={!discountValue || parseFloat(discountValue) <= 0}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply Discount
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

export default POSDiscountModal;
