import React, { useState } from 'react';
import { useAuth } from '../../../../context/AuthContext';
import GlassCard from '../../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../../features/shared/components/ui/GlassButton';
import { X, Minus, AlertCircle, Package } from 'lucide-react';
import { SparePart } from '../../types/spareParts';
import { format } from '../../lib/format';

interface SparePartUsageModalProps {
  sparePart: SparePart;
  onUse: (quantity: number, reason: string, notes?: string) => void;
  onCancel: () => void;
}

const SparePartUsageModal: React.FC<SparePartUsageModalProps> = ({
  sparePart,
  onUse,
  onCancel
}) => {
  const { currentUser } = useAuth();
  
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Predefined usage reasons
  const predefinedReasons = [
    'Device Repair',
    'Maintenance',
    'Customer Service',
    'Testing',
    'Training',
    'Warranty Claim',
    'Quality Control',
    'Other'
  ];

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (quantity <= 0) {
      newErrors.quantity = 'Quantity must be greater than 0';
    }

    if (quantity > sparePart.quantity) {
      newErrors.quantity = `Cannot use more than available quantity (${sparePart.quantity})`;
    }

    if (!reason.trim()) {
      newErrors.reason = 'Reason is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onUse(quantity, reason, notes);
    } catch (error) {
      console.error('Error recording usage:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
    switch (field) {
      case 'quantity':
        setQuantity(value);
        break;
      case 'reason':
        setReason(value);
        break;
      case 'notes':
        setNotes(value);
        break;
    }

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // Calculate remaining quantity after usage
  const remainingQuantity = sparePart.quantity - quantity;
  const isLowStock = remainingQuantity <= sparePart.min_quantity;
  const isOutOfStock = remainingQuantity === 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-50">
      <GlassCard className="w-full max-w-sm">
        <div className="p-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Minus className="w-5 h-5 text-red-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Use Part
              </h2>
            </div>
            <button
              onClick={onCancel}
              className="p-1.5 hover:bg-gray-100 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>

          {/* Spare Part Info */}
          <div className="bg-gray-50 rounded p-3 mb-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="w-4 h-4 text-blue-600" />
              <div>
                <h3 className="font-medium text-gray-900 text-sm">{sparePart.name}</h3>
                <p className="text-xs text-gray-500">{sparePart.part_number}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-gray-500">Available:</span>
                <span className="ml-1 font-medium text-gray-900">{sparePart.quantity}</span>
              </div>
              <div>
                <span className="text-gray-500">Min:</span>
                <span className="ml-1 font-medium text-gray-900">{sparePart.min_quantity}</span>
              </div>
              <div>
                <span className="text-gray-500">Cost:</span>
                <span className="ml-1 font-medium text-gray-900">{format.currency(sparePart.cost_price)}</span>
              </div>
              <div>
                <span className="text-gray-500">Price:</span>
                <span className="ml-1 font-medium text-gray-900">{format.currency(sparePart.selling_price)}</span>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Quantity */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Quantity to Use *
              </label>
              <input
                type="number"
                min="1"
                max={sparePart.quantity}
                value={quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 0)}
                className={`w-full px-2 py-1.5 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                  errors.quantity ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="1"
              />
              {errors.quantity && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.quantity}
                </p>
              )}
              {quantity > 0 && (
                <p className="mt-1 text-xs text-gray-500">
                  Remaining: <span className={`font-medium ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-green-600'}`}>
                    {remainingQuantity}
                  </span>
                  {isOutOfStock && ' (Out of stock)'}
                  {isLowStock && !isOutOfStock && ' (Low stock)'}
                </p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Reason for Use *
              </label>
              <select
                value={reason}
                onChange={(e) => handleInputChange('reason', e.target.value)}
                className={`w-full px-2 py-1.5 border rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm ${
                  errors.reason ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select a reason</option>
                {predefinedReasons.map(reasonOption => (
                  <option key={reasonOption} value={reasonOption}>
                    {reasonOption}
                  </option>
                ))}
              </select>
              {errors.reason && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.reason}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows={2}
                className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Optional notes about this usage..."
              />
            </div>

            {/* Usage Summary */}
            {quantity > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <h4 className="font-medium text-blue-900 mb-2 text-sm">Usage Summary</h4>
                <div className="space-y-1 text-xs text-blue-800">
                  <div className="flex justify-between">
                    <span>Quantity:</span>
                    <span className="font-medium">{quantity}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cost Value:</span>
                    <span className="font-medium">{format.currency(quantity * sparePart.cost_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Selling Value:</span>
                    <span className="font-medium">{format.currency(quantity * sparePart.selling_price)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Remaining:</span>
                    <span className={`font-medium ${isOutOfStock ? 'text-red-600' : isLowStock ? 'text-yellow-600' : 'text-green-600'}`}>
                      {remainingQuantity}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-3 border-t border-gray-200">
              <GlassButton
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
                className="text-sm px-3 py-1.5"
              >
                Cancel
              </GlassButton>
              <GlassButton
                type="submit"
                disabled={isSubmitting || quantity <= 0 || quantity > sparePart.quantity}
                className="flex items-center gap-2"
              >
                <Minus className="w-4 h-4" />
                {isSubmitting ? 'Recording...' : 'Record Usage'}
              </GlassButton>
            </div>
          </form>
        </div>
      </GlassCard>
    </div>
  );
};

export default SparePartUsageModal;
