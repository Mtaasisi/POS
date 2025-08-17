// Dynamic Pricing Display Component for LATS POS
import React, { useState } from 'react';
import { Zap, Star, Gift, Clock as ClockIcon, Tag, Percent, ChevronDown, ChevronUp, User, Calculator, Crown, Settings } from 'lucide-react';
import { AppliedDiscount } from '../../lib/dynamicPricing';

interface DynamicPricingDisplayProps {
  appliedDiscounts: AppliedDiscount[];
  totalDiscount: number;
  discountPercentage: number;
  basePrice: number;
  finalPrice: number;
  loyaltyPoints?: number;
  manualDiscount?: number;
  discountType?: 'percentage' | 'fixed';
  selectedCustomer?: any;
  onClearManualDiscount?: () => void;
  onApplyManualDiscount?: (amount: number, type: 'percentage' | 'fixed') => void;
  onOpenSettings?: () => void;
}

const DynamicPricingDisplay: React.FC<DynamicPricingDisplayProps> = ({
  appliedDiscounts,
  totalDiscount,
  discountPercentage,
  basePrice,
  finalPrice,
  loyaltyPoints,
  manualDiscount = 0,
  discountType = 'percentage',
  selectedCustomer,
  onClearManualDiscount,
  onApplyManualDiscount,
  onOpenSettings
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showManualDiscountInput, setShowManualDiscountInput] = useState(false);
  const [manualDiscountValue, setManualDiscountValue] = useState('');
  const [manualDiscountInputType, setManualDiscountInputType] = useState<'percentage' | 'fixed'>('percentage');

  if (appliedDiscounts.length === 0 && totalDiscount === 0 && manualDiscount === 0) {
    return null;
  }

  const getDiscountIcon = (ruleName: string) => {
    if (ruleName.toLowerCase().includes('vip') || ruleName.toLowerCase().includes('loyalty')) {
      return <Star className="w-4 h-4 text-yellow-500" />;
    }
    if (ruleName.toLowerCase().includes('bulk')) {
      return <Gift className="w-4 h-4 text-green-500" />;
    }
    if (ruleName.toLowerCase().includes('weekend') || ruleName.toLowerCase().includes('morning')) {
      return <ClockIcon className="w-4 h-4 text-blue-500" />;
    }
    return <Tag className="w-4 h-4 text-purple-500" />;
  };

  const getDiscountColor = (ruleName: string) => {
    if (ruleName.toLowerCase().includes('vip') || ruleName.toLowerCase().includes('loyalty')) {
      return 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200';
    }
    if (ruleName.toLowerCase().includes('bulk')) {
      return 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200';
    }
    if (ruleName.toLowerCase().includes('weekend') || ruleName.toLowerCase().includes('morning')) {
      return 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200';
    }
    return 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200';
  };

  const handleManualDiscountSubmit = () => {
    const value = parseFloat(manualDiscountValue);
    if (!isNaN(value) && value > 0) {
      onApplyManualDiscount?.(value, manualDiscountInputType);
      setManualDiscountValue('');
      setShowManualDiscountInput(false);
    }
  };

  const totalManualDiscount = manualDiscount > 0 
    ? (discountType === 'percentage' ? (basePrice * manualDiscount / 100) : manualDiscount)
    : 0;

  const totalSmartDiscount = totalDiscount;
  const totalCombinedDiscount = totalSmartDiscount + totalManualDiscount;
  const finalDiscountPercentage = basePrice > 0 ? (totalCombinedDiscount / basePrice) * 100 : 0;

  return (
    <div className="space-y-3">
      {/* Unified Smart Pricing Card */}
      <div 
        className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-200 cursor-pointer hover:shadow-lg transition-all duration-200"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Header Section - Always Visible */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Zap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <div className="font-bold text-blue-900 text-lg">Smart Pricing & Discounts</div>
              <div className="text-sm text-blue-700">
                {appliedDiscounts.length} auto-discount{appliedDiscounts.length !== 1 ? 's' : ''} • {finalDiscountPercentage.toFixed(1)}% total off
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-xl font-bold text-blue-900">
                TZS {finalPrice.toLocaleString()}
              </div>
              <div className="text-sm text-blue-600 line-through">
                TZS {basePrice.toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
                             {onOpenSettings && (
                 <button
                   onClick={(e) => {
                     e.stopPropagation();
                     onOpenSettings();
                   }}
                   className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-all duration-200"
                   title="Open POS Settings"
                 >
                   <Settings className="w-4 h-4" />
                 </button>
               )}
              {isExpanded ? (
                <ChevronUp className="w-5 h-5 text-blue-600" />
              ) : (
                <ChevronDown className="w-5 h-5 text-blue-600" />
              )}
            </div>
          </div>
        </div>

        {/* Expanded Details */}
        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-blue-200 space-y-3">
            {/* Customer Loyalty Info */}
            {selectedCustomer && (
              <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-100 rounded-lg">
                      <Crown className="w-4 h-4 text-yellow-600" />
                    </div>
                    <div>
                      <div className="font-semibold text-yellow-900">{selectedCustomer.name}</div>
                      <div className="text-sm text-yellow-700">
                        {selectedCustomer.loyaltyLevel || 'Standard'} Member • {selectedCustomer.points || 0} points
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-yellow-600">Loyalty Level</div>
                    <div className="font-semibold text-yellow-900 capitalize">
                      {selectedCustomer.loyaltyLevel || 'Standard'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Applied Discounts Details */}
            {appliedDiscounts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 mb-2">
                  <Gift className="w-4 h-4 text-green-600" />
                  <span className="font-semibold text-green-900">Auto-Applied Discounts</span>
                </div>
                <div className="space-y-2 pl-4">
                  {appliedDiscounts.map((discount, index) => (
                    <div
                      key={index}
                      className={`p-3 rounded-lg border ${getDiscountColor(discount.ruleName)}`}
                    >
                      <div className="flex items-center gap-3">
                        {getDiscountIcon(discount.ruleName)}
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{discount.ruleName}</div>
                          <div className="text-sm text-gray-600">
                            {discount.discountType === 'percentage' ? `${discount.originalValue}% off` : 
                             `TZS ${discount.originalValue.toLocaleString()} off`}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">
                            -TZS {discount.discountAmount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Discount Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-purple-600" />
                  <span className="font-semibold text-purple-900">Manual Discount</span>
                </div>
                {!showManualDiscountInput && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowManualDiscountInput(true);
                    }}
                    className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors"
                  >
                    Add Discount
                  </button>
                )}
              </div>

              {showManualDiscountInput && (
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="number"
                      value={manualDiscountValue}
                      onChange={(e) => setManualDiscountValue(e.target.value)}
                      placeholder="Enter discount amount"
                      className="flex-1 px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                    <select
                      value={manualDiscountInputType}
                      onChange={(e) => setManualDiscountInputType(e.target.value as 'percentage' | 'fixed')}
                      className="px-3 py-2 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                      <option value="percentage">%</option>
                      <option value="fixed">TZS</option>
                    </select>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleManualDiscountSubmit();
                      }}
                      className="px-3 py-1 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
                    >
                      Apply
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowManualDiscountInput(false);
                        setManualDiscountValue('');
                      }}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {manualDiscount > 0 && (
                <div className="p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Calculator className="w-4 h-4 text-purple-600" />
                      <div>
                        <div className="font-medium text-purple-900">Manual Discount</div>
                        <div className="text-sm text-purple-700">
                          {discountType === 'percentage' ? `${manualDiscount}% off` : `TZS ${manualDiscount.toLocaleString()} off`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <div className="font-semibold text-purple-600">
                          -TZS {totalManualDiscount.toLocaleString()}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearManualDiscount?.();
                        }}
                        className="p-1 text-purple-500 hover:text-purple-700 hover:bg-purple-100 rounded transition-colors"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Total Savings Summary */}
            <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-green-600" />
                  <span className="font-semibold text-green-900">Total Savings</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-green-600">
                    TZS {totalCombinedDiscount.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700">
                    {finalDiscountPercentage.toFixed(1)}% off
                  </div>
                </div>
              </div>
              <div className="mt-2 text-xs text-green-600">
                Smart: TZS {totalSmartDiscount.toLocaleString()} • Manual: TZS {totalManualDiscount.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Loyalty Points - Separate Card */}
      {loyaltyPoints && loyaltyPoints > 0 && (
        <div className="p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-600" />
              <span className="font-semibold text-yellow-900">Loyalty Points Earned</span>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-yellow-600">
                +{loyaltyPoints} points
              </div>
              <div className="text-sm text-yellow-700">
                {Math.floor(loyaltyPoints / 10)} TZS value
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicPricingDisplay;
