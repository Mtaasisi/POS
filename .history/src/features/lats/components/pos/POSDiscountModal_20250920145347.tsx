import React, { useState, useEffect } from 'react';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import { DollarSign, Percent, X, Keyboard } from 'lucide-react';
import { toast } from 'react-hot-toast';
import VirtualNumberKeyboard from './VirtualNumberKeyboard';
import { useBodyScrollLock } from '../../../../hooks/useBodyScrollLock';

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

  // Prevent body scroll when modal is open
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg border border-gray-200 max-w-4xl w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Apply Discount</h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 hover:text-gray-700 transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Horizontal Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Controls */}
          <div className="space-y-4">
            {/* Discount Type Selection */}
            <div>
              <label className="block text-lg font-bold text-gray-700 mb-3">Discount Type</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setDiscountType('fixed')}
                  className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                    discountType === 'fixed'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-base font-bold">Fixed Amount</div>
                    <div className="text-sm text-gray-500 mt-1">TZS off total</div>
                  </div>
                </button>
                <button
                  onClick={() => setDiscountType('percentage')}
                  className={`relative p-4 rounded-lg border-2 transition-all duration-200 ${
                    discountType === 'percentage'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <div className="text-center">
                    <div className="text-base font-bold">Percentage</div>
                    <div className="text-sm text-gray-500 mt-1">% off total</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Amount Input */}
            <div>
              <label className="block text-lg font-bold text-gray-700 mb-3">
                {discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={discountValue}
                  onChange={(e) => setDiscountValue(e.target.value)}
                  placeholder={discountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                  className="w-full p-4 text-2xl font-bold text-center border-2 border-gray-200 rounded-lg focus:border-blue-500 focus:outline-none bg-gray-50 transition-all duration-200"
                  readOnly
                />
                <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-bold">
                  {discountType === 'percentage' ? '%' : 'TZS'}
                </div>
              </div>
            </div>


            {/* Quick Buttons */}
            {discountType === 'percentage' && (
              <div>
                <label className="block text-lg font-bold text-gray-700 mb-2">Quick Select</label>
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map((percent) => (
                    <button
                      key={percent}
                      onClick={() => setDiscountValue(percent.toString())}
                      className="py-3 px-4 text-base font-bold bg-gray-100 hover:bg-blue-100 text-gray-700 hover:text-blue-700 rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200"
                    >
                      {percent}%
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Keyboard */}
          <div>
            <label className="block text-lg font-bold text-gray-700 mb-3">Number Keyboard</label>
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-3 border border-gray-200/50">
              <VirtualNumberKeyboard
                onKeyPress={handleKeyPress}
                onBackspace={handleBackspace}
                onClear={handleClear}
                className="w-full"
              />
            </div>
            
            {/* Preview */}
            {discountValue && (
              <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-lg font-bold text-gray-800 mb-2">Preview</div>
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-gray-700">Subtotal</span>
                    <span className="text-base font-bold text-gray-900">{formatMoney(currentTotal)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-base font-bold text-red-600">Discount</span>
                    <span className="text-base font-bold text-red-600">-{formatMoney(discountAmount)}</span>
                  </div>
                  <div className="border-t border-gray-300 pt-1">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">Total</span>
                      <span className="text-xl font-bold text-green-600">{formatMoney(finalTotal)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="flex-1 py-3 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-md"
          >
            Cancel
          </button>
          {hasExistingDiscount && (
            <button
              onClick={() => {
                onClearDiscount();
                handleClose();
              }}
              className="flex-1 py-3 px-6 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-lg shadow-red-500/25"
            >
              Clear
            </button>
          )}
          <button
            onClick={handleApplyDiscount}
            disabled={!discountValue || parseFloat(discountValue) <= 0}
            className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-xl text-sm font-semibold transition-all duration-200 hover:shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none"
          >
            Apply Discount
          </button>
        </div>
      </div>
    </div>
  );
};

export default POSDiscountModal;
