import React, { useState, useEffect } from 'react';
import { Percent, DollarSign, X, Plus, Minus, Calculator } from 'lucide-react';
import { toast } from 'react-hot-toast';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';

export interface Discount {
  id: string;
  type: 'percentage' | 'fixed' | 'loyalty' | 'bulk' | 'promo';
  value: number;
  description: string;
  applied: boolean;
  priority: number; // Higher number = higher priority
}

export interface DiscountResult {
  subtotal: number;
  discountAmount: number;
  discountPercentage: number;
  finalTotal: number;
  appliedDiscounts: Discount[];
}

interface DiscountManagerProps {
  subtotal: number;
  onDiscountChange: (result: DiscountResult) => void;
  customerLoyaltyLevel?: string;
  customerPoints?: number;
  itemCount?: number;
  className?: string;
}

const DiscountManager: React.FC<DiscountManagerProps> = ({
  subtotal,
  onDiscountChange,
  customerLoyaltyLevel,
  customerPoints = 0,
  itemCount = 0,
  className = ''
}) => {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [newDiscountType, setNewDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [newDiscountValue, setNewDiscountValue] = useState('');
  const [newDiscountDescription, setNewDiscountDescription] = useState('');

  // Calculate discount results
  const calculateDiscounts = (): DiscountResult => {
    if (subtotal <= 0) {
      return {
        subtotal,
        discountAmount: 0,
        discountPercentage: 0,
        finalTotal: subtotal,
        appliedDiscounts: []
      };
    }

    // Sort discounts by priority (highest first)
    const sortedDiscounts = [...discounts]
      .filter(d => d.applied)
      .sort((a, b) => b.priority - a.priority);

    let currentTotal = subtotal;
    let totalDiscountAmount = 0;
    const appliedDiscounts: Discount[] = [];

    // Apply discounts in order
    for (const discount of sortedDiscounts) {
      let discountAmount = 0;

      switch (discount.type) {
        case 'percentage':
          discountAmount = (currentTotal * discount.value) / 100;
          break;
        case 'fixed':
          discountAmount = Math.min(discount.value, currentTotal);
          break;
        case 'loyalty':
          // Loyalty discount based on customer level
          const loyaltyDiscount = getLoyaltyDiscount(customerLoyaltyLevel);
          discountAmount = (currentTotal * loyaltyDiscount) / 100;
          break;
        case 'bulk':
          // Bulk discount based on item count
          const bulkDiscount = getBulkDiscount(itemCount);
          discountAmount = (currentTotal * bulkDiscount) / 100;
          break;
        case 'promo':
          discountAmount = (currentTotal * discount.value) / 100;
          break;
      }

      if (discountAmount > 0) {
        currentTotal -= discountAmount;
        totalDiscountAmount += discountAmount;
        appliedDiscounts.push({
          ...discount,
          value: discount.type === 'percentage' || discount.type === 'promo' 
            ? discount.value 
            : (discountAmount / subtotal) * 100
        });
      }
    }

    return {
      subtotal,
      discountAmount: totalDiscountAmount,
      discountPercentage: subtotal > 0 ? (totalDiscountAmount / subtotal) * 100 : 0,
      finalTotal: currentTotal,
      appliedDiscounts
    };
  };

  // Get loyalty discount based on customer level
  const getLoyaltyDiscount = (level?: string): number => {
    switch (level?.toLowerCase()) {
      case 'platinum':
        return 20;
      case 'gold':
        return 15;
      case 'silver':
        return 10;
      case 'bronze':
        return 5;
      default:
        return 0;
    }
  };

  // Get bulk discount based on item count
  const getBulkDiscount = (count: number): number => {
    if (count >= 20) return 15;
    if (count >= 10) return 10;
    if (count >= 5) return 5;
    return 0;
  };

  // Update discount calculations when dependencies change
  useEffect(() => {
    const result = calculateDiscounts();
    onDiscountChange(result);
  }, [discounts, subtotal, customerLoyaltyLevel, customerPoints, itemCount]);

  // Add new discount
  const handleAddDiscount = () => {
    const value = parseFloat(newDiscountValue);
    if (isNaN(value) || value <= 0) {
      toast.error('Please enter a valid discount value');
      return;
    }

    if (newDiscountType === 'percentage' && value > 100) {
      toast.error('Percentage discount cannot exceed 100%');
      return;
    }

    if (newDiscountType === 'fixed' && value > subtotal) {
      toast.error('Fixed discount cannot exceed subtotal');
      return;
    }

    const newDiscount: Discount = {
      id: `discount_${Date.now()}`,
      type: newDiscountType,
      value: newDiscountType === 'percentage' ? value : value,
      description: newDiscountDescription || `${newDiscountType === 'percentage' ? value + '%' : formatMoney(value)} discount`,
      applied: true,
      priority: newDiscountType === 'percentage' ? 2 : 1
    };

    setDiscounts(prev => [...prev, newDiscount]);
    setNewDiscountValue('');
    setNewDiscountDescription('');
    setShowDiscountModal(false);
    toast.success('Discount added successfully');
  };

  // Toggle discount application
  const toggleDiscount = (discountId: string) => {
    setDiscounts(prev => prev.map(d => 
      d.id === discountId ? { ...d, applied: !d.applied } : d
    ));
  };

  // Remove discount
  const removeDiscount = (discountId: string) => {
    setDiscounts(prev => prev.filter(d => d.id !== discountId));
    toast.success('Discount removed');
  };

  // Clear all discounts
  const clearAllDiscounts = () => {
    setDiscounts([]);
    toast.success('All discounts cleared');
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'TZS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const result = calculateDiscounts();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Discount Summary */}
      <GlassCard className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Percent className="w-5 h-5 text-green-600" />
            Discounts
          </h3>
          <div className="flex gap-2">
            <GlassButton
              onClick={() => setShowDiscountModal(true)}
              size="sm"
              className="inline-flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Discount
            </GlassButton>
            {discounts.length > 0 && (
              <GlassButton
                onClick={clearAllDiscounts}
                variant="outline"
                size="sm"
                className="inline-flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Clear All
              </GlassButton>
            )}
          </div>
        </div>

        {/* Discount Summary */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-gray-900">
              {formatMoney(result.subtotal)}
            </div>
            <div className="text-sm text-gray-600">Subtotal</div>
          </div>
          <div className="bg-red-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-red-600">
              -{formatMoney(result.discountAmount)}
            </div>
            <div className="text-sm text-gray-600">
              Discount ({result.discountPercentage.toFixed(1)}%)
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <div className="text-2xl font-bold text-green-600">
              {formatMoney(result.finalTotal)}
            </div>
            <div className="text-sm text-gray-600">Final Total</div>
          </div>
        </div>

        {/* Applied Discounts */}
        {result.appliedDiscounts.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Applied Discounts:</h4>
            <div className="space-y-2">
              {result.appliedDiscounts.map((discount) => (
                <div
                  key={discount.id}
                  className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">{discount.description}</span>
                    <span className="text-xs text-gray-500">
                      ({discount.value.toFixed(1)}%)
                    </span>
                  </div>
                  <button
                    onClick={() => removeDiscount(discount.id)}
                    className="p-1 hover:bg-red-100 rounded transition-colors"
                  >
                    <X className="w-3 h-3 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Available Discounts */}
        {discounts.filter(d => !d.applied).length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Available Discounts:</h4>
            <div className="space-y-2">
              {discounts
                .filter(d => !d.applied)
                .map((discount) => (
                  <div
                    key={discount.id}
                    className="flex items-center justify-between p-2 bg-gray-50 border border-gray-200 rounded-lg"
                  >
                    <div className="flex items-center gap-2">
                      <Percent className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{discount.description}</span>
                      <span className="text-xs text-gray-500">
                        ({discount.value.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <GlassButton
                        onClick={() => toggleDiscount(discount.id)}
                        size="sm"
                        variant="outline"
                      >
                        Apply
                      </GlassButton>
                      <button
                        onClick={() => removeDiscount(discount.id)}
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                      >
                        <X className="w-3 h-3 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Auto Discounts */}
        {(customerLoyaltyLevel || itemCount > 0) && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Available Auto-Discounts:</h4>
            <div className="space-y-2">
              {customerLoyaltyLevel && (
                <div className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-blue-600" />
                    <span className="text-sm">Loyalty Discount ({customerLoyaltyLevel})</span>
                    <span className="text-xs text-gray-500">
                      ({getLoyaltyDiscount(customerLoyaltyLevel)}%)
                    </span>
                  </div>
                  <GlassButton
                    onClick={() => {
                      const loyaltyDiscount: Discount = {
                        id: 'loyalty_discount',
                        type: 'loyalty',
                        value: getLoyaltyDiscount(customerLoyaltyLevel),
                        description: `${customerLoyaltyLevel} Loyalty Discount`,
                        applied: true,
                        priority: 3
                      };
                      setDiscounts(prev => [...prev.filter(d => d.id !== 'loyalty_discount'), loyaltyDiscount]);
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Apply
                  </GlassButton>
                </div>
              )}
              
              {itemCount >= 5 && (
                <div className="flex items-center justify-between p-2 bg-purple-50 border border-purple-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Percent className="w-4 h-4 text-purple-600" />
                    <span className="text-sm">Bulk Purchase Discount</span>
                    <span className="text-xs text-gray-500">
                      ({getBulkDiscount(itemCount)}% for {itemCount} items)
                    </span>
                  </div>
                  <GlassButton
                    onClick={() => {
                      const bulkDiscount: Discount = {
                        id: 'bulk_discount',
                        type: 'bulk',
                        value: getBulkDiscount(itemCount),
                        description: `Bulk Purchase Discount (${itemCount} items)`,
                        applied: true,
                        priority: 2
                      };
                      setDiscounts(prev => [...prev.filter(d => d.id !== 'bulk_discount'), bulkDiscount]);
                    }}
                    size="sm"
                    variant="outline"
                  >
                    Apply
                  </GlassButton>
                </div>
              )}
            </div>
          </div>
        )}
      </GlassCard>

      {/* Add Discount Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassCard className="w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Discount</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Discount Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setNewDiscountType('percentage')}
                      className={`p-3 border rounded-lg transition-colors ${
                        newDiscountType === 'percentage'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <Percent className="w-4 h-4 mx-auto mb-1" />
                      <span className="text-sm font-medium">Percentage</span>
                    </button>
                    <button
                      onClick={() => setNewDiscountType('fixed')}
                      className={`p-3 border rounded-lg transition-colors ${
                        newDiscountType === 'fixed'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      <DollarSign className="w-4 h-4 mx-auto mb-1" />
                      <span className="text-sm font-medium">Fixed Amount</span>
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {newDiscountType === 'percentage' ? 'Percentage (%)' : 'Amount (TZS)'}
                  </label>
                  <input
                    type="number"
                    value={newDiscountValue}
                    onChange={(e) => setNewDiscountValue(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={newDiscountType === 'percentage' ? 'Enter percentage' : 'Enter amount'}
                    min="0"
                    max={newDiscountType === 'percentage' ? '100' : undefined}
                    step={newDiscountType === 'percentage' ? '0.1' : '1'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Optional)
                  </label>
                  <input
                    type="text"
                    value={newDiscountDescription}
                    onChange={(e) => setNewDiscountDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Promo code, Special offer"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <GlassButton
                  onClick={handleAddDiscount}
                  className="flex-1"
                >
                  Add Discount
                </GlassButton>
                <GlassButton
                  onClick={() => setShowDiscountModal(false)}
                  variant="outline"
                >
                  Cancel
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default DiscountManager;
