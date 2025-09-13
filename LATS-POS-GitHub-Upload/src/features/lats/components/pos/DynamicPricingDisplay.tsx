// Dynamic Pricing Display Component for LATS POS
import React from 'react';
import { Zap, Settings, ChevronDown } from 'lucide-react';
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
  if (appliedDiscounts.length === 0 && totalDiscount === 0 && manualDiscount === 0) {
    return null;
  }

  const totalManualDiscount = manualDiscount > 0 
    ? (discountType === 'percentage' ? (basePrice * manualDiscount / 100) : manualDiscount)
    : 0;

  const totalSmartDiscount = totalDiscount;
  const totalCombinedDiscount = totalSmartDiscount + totalManualDiscount;
  const finalDiscountPercentage = basePrice > 0 ? (totalCombinedDiscount / basePrice) * 100 : 0;

  return (
    <div className="p-4 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-blue-200 cursor-pointer hover:shadow-lg transition-all duration-200">
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
            <ChevronDown className="w-5 h-5 text-blue-600" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DynamicPricingDisplay;
