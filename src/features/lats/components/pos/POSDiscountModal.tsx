import React from 'react';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import { DollarSign } from 'lucide-react';

interface POSDiscountModalProps {
  isOpen: boolean;
  onClose: () => void;
  discountType: 'percentage' | 'fixed';
  discountValue: string;
  setDiscountType: (type: 'percentage' | 'fixed') => void;
  setDiscountValue: (value: string) => void;
  subtotal: number;
  formatMoney: (amount: number) => string;
  onApplyDiscount: () => void;
}

const POSDiscountModal: React.FC<POSDiscountModalProps> = ({
  isOpen,
  onClose,
  discountType,
  discountValue,
  setDiscountType,
  setDiscountValue,
  subtotal,
  formatMoney,
  onApplyDiscount
}) => {
  if (!isOpen) return null;

  const calculateDiscountAmount = () => {
    if (!discountValue) return 0;
    const value = parseFloat(discountValue);
    if (isNaN(value)) return 0;
    
    if (discountType === 'percentage') {
      return (subtotal * value) / 100;
    } else {
      return value;
    }
  };

  const discountAmount = calculateDiscountAmount();
  const finalTotal = subtotal - discountAmount;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="max-w-2xl w-full p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-purple-50 rounded-lg">
            <DollarSign className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Apply Discount</h2>
            <p className="text-sm text-gray-600">Add a manual discount to the transaction</p>
          </div>
        </div>

        <div className="space-y-8">
          {/* Discount Type Selection */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-4">Discount Type</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setDiscountType('percentage')}
                className={`p-6 border-2 rounded-xl transition-all duration-200 ${
                  discountType === 'percentage'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-xl font-semibold">Percentage</div>
                  <div className="text-base">% off total</div>
                </div>
              </button>
              <button
                onClick={() => setDiscountType('fixed')}
                className={`p-6 border-2 rounded-xl transition-all duration-200 ${
                  discountType === 'fixed'
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <div className="text-xl font-semibold">Fixed Amount</div>
                  <div className="text-base">TZS off total</div>
                </div>
              </button>
            </div>
          </div>

          {/* Discount Value Input */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-4">
              {discountType === 'percentage' ? 'Discount Percentage' : 'Discount Amount (TZS)'}
            </label>
            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === 'percentage' ? 'Enter percentage (e.g., 10)' : 'Enter amount (e.g., 5000)'}
              className="w-full px-6 py-4 border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-4 focus:ring-purple-500/30 focus:border-purple-500 text-xl font-medium"
              min="0"
              max={discountType === 'percentage' ? '100' : undefined}
              step={discountType === 'percentage' ? '0.1' : '100'}
            />
          </div>

          {/* Quick Discount Buttons */}
          {discountType === 'percentage' && (
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-4">Quick Discount</label>
              <div className="grid grid-cols-4 gap-3">
                {[5, 10, 15, 20].map((percentage) => (
                  <button
                    key={percentage}
                    onClick={() => setDiscountValue(percentage.toString())}
                    className="p-4 border-2 border-gray-200 rounded-xl hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 text-lg font-semibold"
                  >
                    {percentage}%
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Preview */}
          {discountValue && (
            <div className="p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border-2 border-purple-200">
              <div className="text-lg font-semibold text-purple-800 mb-4">Discount Preview:</div>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-2">
                  <span className="text-lg font-medium text-gray-700">Subtotal:</span>
                  <span className="text-xl font-bold text-gray-900">{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-lg font-medium text-purple-700">Discount:</span>
                  <span className="text-xl font-bold text-purple-700">-{formatMoney(discountAmount)}</span>
                </div>
                <div className="border-t border-purple-200 pt-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xl font-semibold text-gray-800">Final Total:</span>
                    <span className="text-2xl font-bold text-green-600">{formatMoney(finalTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4">
            <button
              onClick={onClose}
              className="flex-1 py-4 px-6 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                onApplyDiscount();
                onClose();
              }}
              disabled={!discountValue || parseFloat(discountValue) <= 0}
              className="flex-1 py-4 px-6 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Apply Discount
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default POSDiscountModal;
