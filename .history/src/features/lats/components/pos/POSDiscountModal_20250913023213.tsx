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
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Apply Discount</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preview */}
        {discountValue && (
          <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
            <div className="text-sm text-blue-800 mb-2">Preview:</div>
            <div className="flex justify-between text-sm">
              <span>Subtotal: {formatMoney(currentTotal)}</span>
              <span className="text-red-600">-{formatMoney(discountAmount)}</span>
            </div>
            <div className="text-center mt-2 text-lg font-semibold text-green-600">
              Total: {formatMoney(finalTotal)}
            </div>
          </div>
        )}

        {/* Simple Layout */}
        <div className="space-y-4">
          {/* Discount Type Selection */}
          <div className="flex gap-2">
            <button
              onClick={() => setDiscountType('fixed')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium ${
                discountType === 'fixed'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Fixed
            </button>
            <button
              onClick={() => setDiscountType('percentage')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium ${
                discountType === 'percentage'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              %
            </button>
          </div>

          {/* Amount Input */}
          <div>
            <div className="relative">
              <input
                type="text"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === 'percentage' ? '10' : '5000'}
                className="w-full p-3 text-xl font-semibold text-center border border-gray-300 rounded focus:border-blue-500 focus:outline-none"
                readOnly
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                {discountType === 'percentage' ? '%' : 'TZS'}
              </div>
            </div>
          </div>

          {/* Quick Buttons */}
          {discountType === 'percentage' && (
            <div className="flex gap-2">
              {[5, 10, 15, 20].map((percent) => (
                <button
                  key={percent}
                  onClick={() => setDiscountValue(percent.toString())}
                  className="flex-1 py-2 px-3 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
                >
                  {percent}%
                </button>
              ))}
            </div>
          )}

          {/* Keyboard */}
          <div className="bg-gray-50 rounded p-3">
            <VirtualNumberKeyboard
              onKeyPress={handleKeyPress}
              onBackspace={handleBackspace}
              onClear={handleClear}
              className="w-full"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleClose}
            className="flex-1 py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-sm font-medium"
          >
            Cancel
          </button>
          {hasExistingDiscount && (
            <button
              onClick={() => {
                onClearDiscount();
                handleClose();
              }}
              className="flex-1 py-2 px-4 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-medium"
            >
              Clear
            </button>
          )}
          <button
            onClick={handleApplyDiscount}
            disabled={!discountValue || parseFloat(discountValue) <= 0}
            className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default POSDiscountModal;
