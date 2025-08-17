// POS Pricing Settings Component
import React, { useState, useEffect } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { Zap, Star, Gift, Clock, Settings, Calculator, Crown, Percent, DollarSign, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { dynamicPricingService } from '../../lib/dynamicPricing';

interface PricingRule {
  id: string;
  name: string;
  type: 'loyalty' | 'bulk' | 'time' | 'custom';
  description: string;
  enabled: boolean;
  value: number;
  maxValue?: number;
  conditions?: string[];
}

interface POSPricingSettingsProps {
  selectedCustomer?: any;
  currentDiscounts?: any[];
  manualDiscount?: number;
  discountType?: 'percentage' | 'fixed';
  onSettingsSave?: (settings: {
    manualDiscount?: number;
    manualDiscountType?: 'percentage' | 'fixed';
    enabledRules?: string[];
  }) => void;
}

const POSPricingSettings: React.FC<POSPricingSettingsProps> = ({
  selectedCustomer,
  currentDiscounts = [],
  manualDiscount = 0,
  discountType = 'percentage',
  onSettingsSave
}) => {
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  const [manualDiscountValue, setManualDiscountValue] = useState('');
  const [manualDiscountInputType, setManualDiscountInputType] = useState<'percentage' | 'fixed'>('percentage');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load pricing rules from dynamic pricing service
  useEffect(() => {
    const loadRules = async () => {
      try {
        const rules = await dynamicPricingService.getPricingRules();
        setPricingRules(rules);
        
        // Set selected rules based on current discounts
        const activeRuleIds = currentDiscounts.map(discount => discount.ruleId).filter(Boolean);
        setSelectedRules(activeRuleIds);
      } catch (error) {
        console.error('Error loading pricing rules:', error);
      }
    };
    
    loadRules();
  }, [currentDiscounts]);

  // Update manual discount from props
  useEffect(() => {
    setManualDiscountValue(manualDiscount.toString());
    setManualDiscountInputType(discountType);
  }, [manualDiscount, discountType]);

  const handleRuleToggle = (ruleId: string) => {
    setSelectedRules(prev => 
      prev.includes(ruleId) 
        ? prev.filter(id => id !== ruleId)
        : [...prev, ruleId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const settings = {
        manualDiscount: parseFloat(manualDiscountValue) || 0,
        manualDiscountType: manualDiscountInputType,
        enabledRules: selectedRules
      };
      
      if (onSettingsSave) {
        onSettingsSave(settings);
      }
    } catch (error) {
      console.error('Error saving pricing settings:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRuleIcon = (type: string) => {
    switch (type) {
      case 'loyalty': return <Crown className="w-4 h-4" />;
      case 'bulk': return <Gift className="w-4 h-4" />;
      case 'time': return <Clock className="w-4 h-4" />;
      case 'custom': return <Zap className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getRuleColor = (type: string) => {
    switch (type) {
      case 'loyalty': return 'from-yellow-50 to-orange-50 border-yellow-200 text-yellow-700';
      case 'bulk': return 'from-green-50 to-emerald-50 border-green-200 text-green-700';
      case 'time': return 'from-blue-50 to-indigo-50 border-blue-200 text-blue-700';
      case 'custom': return 'from-purple-50 to-violet-50 border-purple-200 text-purple-700';
      default: return 'from-gray-50 to-slate-50 border-gray-200 text-gray-700';
    }
  };

  const calculatePreview = () => {
    const baseAmount = 10000; // Sample amount for preview
    const smartDiscount = selectedRules.length > 0 ? baseAmount * 0.05 : 0; // 5% sample discount
    const manualDiscountAmount = parseFloat(manualDiscountValue) || 0;
    const manualDiscountCalculated = manualDiscountInputType === 'percentage' 
      ? (baseAmount * manualDiscountAmount / 100) 
      : manualDiscountAmount;
    const finalAmount = baseAmount - smartDiscount - manualDiscountCalculated;
    
    return {
      baseAmount,
      smartDiscount,
      manualDiscount: manualDiscountCalculated,
      finalAmount,
      totalDiscount: smartDiscount + manualDiscountCalculated
    };
  };

  const preview = calculatePreview();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
          <Calculator className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-800">Dynamic Pricing & Discounts</h3>
          <p className="text-sm text-gray-600">Configure automatic pricing rules and manual discounts</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        {selectedCustomer && (
          <GlassCard className="p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Crown className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">{selectedCustomer.name}</h4>
                <p className="text-sm text-gray-600">
                  {selectedCustomer.loyaltyLevel ? `${selectedCustomer.loyaltyLevel.charAt(0).toUpperCase() + selectedCustomer.loyaltyLevel.slice(1)} Member` : 'Standard Customer'}
                  {selectedCustomer.points && ` • ${selectedCustomer.points} points`}
                </p>
              </div>
            </div>
          </GlassCard>
        )}

        {/* Smart Pricing Rules */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <h4 className="text-lg font-semibold text-gray-800">Automatic Pricing Rules</h4>
            <Info className="w-4 h-4 text-gray-400" title="These rules are applied automatically based on conditions" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pricingRules.map((rule) => (
              <div
                key={rule.id}
                className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                  getRuleColor(rule.type)
                } ${selectedRules.includes(rule.id) ? 'ring-2 ring-blue-500' : ''}`}
                onClick={() => handleRuleToggle(rule.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getRuleIcon(rule.type)}
                    <span className="font-medium">{rule.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedRules.includes(rule.id) ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : (
                      <div className="w-4 h-4 border-2 border-gray-300 rounded-full" />
                    )}
                  </div>
                </div>
                <p className="text-sm opacity-80 mb-2">{rule.description}</p>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-medium">
                    {rule.value}% off
                    {rule.maxValue && ` (max TZS ${rule.maxValue.toLocaleString()})`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Manual Discount */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Percent className="w-5 h-5 text-green-600" />
            <h4 className="text-lg font-semibold text-gray-800">Manual Discount</h4>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Amount
              </label>
              <input
                type="number"
                value={manualDiscountValue}
                onChange={(e) => setManualDiscountValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter discount amount"
                min="0"
                step="0.01"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Discount Type
              </label>
              <select
                value={manualDiscountInputType}
                onChange={(e) => setManualDiscountInputType(e.target.value as 'percentage' | 'fixed')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (TZS)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Pricing Preview */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-purple-600" />
            <h4 className="text-lg font-semibold text-gray-800">Pricing Preview</h4>
          </div>
          
          <GlassCard className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Base Amount:</span>
                <span className="font-semibold">TZS {preview.baseAmount.toLocaleString()}</span>
              </div>
              
              {preview.smartDiscount > 0 && (
                <div className="flex justify-between items-center text-green-600">
                  <span>Smart Discounts:</span>
                  <span className="font-semibold">-TZS {preview.smartDiscount.toLocaleString()}</span>
                </div>
              )}
              
              {preview.manualDiscount > 0 && (
                <div className="flex justify-between items-center text-blue-600">
                  <span>Manual Discount:</span>
                  <span className="font-semibold">-TZS {preview.manualDiscount.toLocaleString()}</span>
                </div>
              )}
              
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between items-center text-lg font-bold text-gray-800">
                  <span>Final Amount:</span>
                  <span>TZS {preview.finalAmount.toLocaleString()}</span>
                </div>
                {preview.totalDiscount > 0 && (
                  <div className="text-sm text-green-600 text-right">
                    Total Savings: TZS {preview.totalDiscount.toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <GlassButton 
            type="submit" 
            disabled={isSubmitting} 
            className="flex-1 bg-gradient-to-r from-blue-500 to-indigo-600 text-white"
          >
            {isSubmitting ? 'Saving Settings...' : 'Save Settings'}
          </GlassButton>
        </div>
      </form>
    </div>
  );
};

export default POSPricingSettings;
