// StockAdjustModal component for LATS module
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LATS_CLASSES } from '../../tokens';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassInput from '../../../shared/components/ui/GlassInput';
import GlassSelect from '../../../shared/components/ui/GlassSelect';
import GlassButton from '../../../shared/components/ui/GlassButton';
import GlassBadge from '../../../shared/components/ui/GlassBadge';
import PriceInput from '../../../../shared/components/ui/PriceInput';
import { t } from '../../lib/i18n/t';
import { format } from '../../lib/format';

// Validation schema
const stockAdjustmentSchema = z.object({
  adjustmentType: z.enum(['in', 'out', 'set']),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  reason: z.string().min(1, 'Reason is required').max(200, 'Reason must be less than 200 characters'),
  reference: z.string().max(100, 'Reference must be less than 100 characters').optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  cost: z.number().min(0, 'Cost must be 0 or greater').optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').optional()
});

type StockAdjustmentData = z.infer<typeof stockAdjustmentSchema>;

interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  minQuantity: number;
  maxQuantity?: number;
}

interface StockAdjustModalProps {
  variant?: ProductVariant;
  isOpen: boolean;
  onClose?: () => void;
  onSubmit?: (data: StockAdjustmentData) => Promise<void>;
  loading?: boolean;
}

const StockAdjustModal: React.FC<StockAdjustModalProps> = ({
  variant,
  isOpen,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset,
    setValue
  } = useForm<StockAdjustmentData>({
    resolver: zodResolver(stockAdjustmentSchema),
    defaultValues: {
      adjustmentType: 'in',
      quantity: 0,
      reason: '',
      reference: '',
      notes: '',
      cost: 0,
      location: ''
    }
  });

  // Watch form values
  const watchedValues = watch();
  const adjustmentType = watchedValues.adjustmentType;
  const quantity = watchedValues.quantity;
  const currentStock = variant?.quantity || 0;

  // Calculate new stock level
  const getNewStockLevel = () => {
    switch (adjustmentType) {
      case 'in':
        return currentStock + quantity;
      case 'out':
        return currentStock - quantity;
      case 'set':
        return quantity;
      default:
        return currentStock;
    }
  };

  const newStockLevel = getNewStockLevel();

  // Get stock status
  const getStockStatus = (stock: number) => {
    if (!variant) return 'normal';
    if (stock <= variant.minQuantity) return 'low';
    if (variant.maxQuantity && stock >= variant.maxQuantity) return 'high';
    return 'normal';
  };

  const currentStatus = getStockStatus(currentStock);
  const newStatus = getStockStatus(newStockLevel);

  // Handle form submission
  const handleFormSubmit = async (data: StockAdjustmentData) => {
    try {
      if (onSubmit) {
        await onSubmit(data);
        reset();
        onClose?.();
      }
    } catch (error) {
      console.error('Stock adjustment submission error:', error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (isDirty) {
      if (confirm(t('common.confirmDiscard'))) {
        reset();
        onClose?.();
      }
    } else {
      onClose?.();
    }
  };

  // Adjustment type options
  const adjustmentTypeOptions = [
    { value: 'in', label: 'Stock In', icon: '📥' },
    { value: 'out', label: 'Stock Out', icon: '📤' },
    { value: 'set', label: 'Set Stock', icon: '⚙️' }
  ];

  // Reason options
  const reasonOptions = [
    { value: 'purchase', label: 'Purchase Order' },
    { value: 'sale', label: 'Sale' },
    { value: 'return', label: 'Customer Return' },
    { value: 'damage', label: 'Damaged Goods' },
    { value: 'expiry', label: 'Expired Goods' },
    { value: 'theft', label: 'Theft/Loss' },
    { value: 'adjustment', label: 'Manual Adjustment' },
    { value: 'transfer', label: 'Location Transfer' },
    { value: 'audit', label: 'Stock Audit' },
    { value: 'other', label: 'Other' }
  ];

  // Location options
  const locationOptions = [
    { value: 'main', label: 'Main Warehouse' },
    { value: 'secondary', label: 'Secondary Warehouse' },
    { value: 'store', label: 'Store Front' },
    { value: 'transit', label: 'In Transit' },
    { value: 'supplier', label: 'At Supplier' }
  ];

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'low':
        return <GlassBadge variant="error">Low Stock</GlassBadge>;
      case 'high':
        return <GlassBadge variant="warning">Overstocked</GlassBadge>;
      default:
        return <GlassBadge variant="success">Normal</GlassBadge>;
    }
  };

  // Get adjustment type badge
  const getAdjustmentTypeBadge = (type: string) => {
    switch (type) {
      case 'in':
        return <GlassBadge variant="success">Stock In</GlassBadge>;
      case 'out':
        return <GlassBadge variant="error">Stock Out</GlassBadge>;
      case 'set':
        return <GlassBadge variant="info">Set Stock</GlassBadge>;
      default:
        return null;
    }
  };

  if (!isOpen || !variant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <GlassCard className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-lats-text">
                Adjust Stock Level
              </h2>
              <p className="text-sm text-lats-text-secondary mt-1">
                {variant.name} ({variant.sku})
              </p>
            </div>
            <GlassButton
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              icon={
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              }
            />
          </div>

          {/* Current Stock Summary */}
          <div className="p-4 bg-lats-surface/30 rounded-lats-radius-md border border-lats-glass-border">
            <h3 className="text-lg font-medium text-lats-text mb-3">Current Stock</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-lats-text">{currentStock}</div>
                <div className="text-xs text-lats-text-secondary">Current Stock</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-lats-text">{variant.minQuantity}</div>
                <div className="text-xs text-lats-text-secondary">Min Level</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-lats-text">{variant.maxQuantity || 'N/A'}</div>
                <div className="text-xs text-lats-text-secondary">Max Level</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-lats-text">
                  {format.money(variant.sellingPrice)}
                </div>
                <div className="text-xs text-lats-text-secondary">Unit Price</div>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mt-3">
              {getStatusBadge(currentStatus)}
            </div>
          </div>

          {/* Adjustment Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-lats-text">Adjustment Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Adjustment Type */}
              <Controller
                name="adjustmentType"
                control={control}
                render={({ field }) => (
                  <GlassSelect
                    label="Adjustment Type"
                    placeholder="Select type"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.adjustmentType?.message}
                    options={adjustmentTypeOptions}

                    required
                  />
                )}
              />

              {/* Quantity */}
              <Controller
                name="quantity"
                control={control}
                render={({ field }) => (
                  <GlassInput
                    label="Quantity"
                    placeholder="0"
                    type="number"
                    value={field.value}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    error={errors.quantity?.message}
                    min={0.01}
                    step={0.01}
                    required
                    helperText={
                      adjustmentType === 'set' 
                        ? 'Set stock to this quantity'
                        : adjustmentType === 'in'
                        ? 'Add to current stock'
                        : 'Remove from current stock'
                    }
                  />
                )}
              />
            </div>

            {/* Reason */}
            <Controller
              name="reason"
              control={control}
              render={({ field }) => (
                <GlassSelect
                  label="Reason"
                  placeholder="Select reason"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.reason?.message}
                  options={reasonOptions}
                  required
                />
              )}
            />

            {/* Reference */}
            <Controller
              name="reference"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Reference"
                  placeholder="e.g., PO-001, Invoice #123"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.reference?.message}
                  maxLength={100}
                  helperText="Optional reference number or document"
                />
              )}
            />

            {/* Notes */}
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Notes"
                  placeholder="Additional notes about this adjustment"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.notes?.message}
                  multiline
                  rows={3}
                  maxLength={500}
                  helperText={`${field.value?.length || 0}/500 characters`}
                />
              )}
            />
          </div>

          {/* Advanced Settings */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-lats-text">Advanced Settings</h3>
              <GlassButton
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                icon={
                  <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                }
              >
                {isExpanded ? 'Hide' : 'Show'} Advanced
              </GlassButton>
            </div>

            {isExpanded && (
              <div className="space-y-4 p-4 bg-lats-surface/30 rounded-lats-radius-md border border-lats-glass-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cost */}
                  <Controller
                    name="cost"
                    control={control}
                    render={({ field }) => (
                      <PriceInput
                        label="Unit Cost"
                        placeholder="0"
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.cost?.message}
                        helperText="Cost per unit for this adjustment"
                      />
                    )}
                  />

                  {/* Location */}
                  <Controller
                    name="location"
                    control={control}
                    render={({ field }) => (
                      <GlassSelect
                        label="Location"
                        placeholder="Select location"
                        value={field.value}
                        onChange={field.onChange}
                        error={errors.location?.message}
                        options={locationOptions}
                        clearable
                      />
                    )}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Preview */}
          <div className="p-4 bg-lats-surface/30 rounded-lats-radius-md border border-lats-glass-border">
            <h3 className="text-lg font-medium text-lats-text mb-3">Preview</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-sm text-lats-text-secondary mb-1">Current Stock</div>
                <div className="text-xl font-bold text-lats-text">{currentStock}</div>
                {getStatusBadge(currentStatus)}
              </div>
              <div className="text-center">
                <div className="text-sm text-lats-text-secondary mb-1">New Stock</div>
                <div className="text-xl font-bold text-lats-text">{newStockLevel}</div>
                {getStatusBadge(newStatus)}
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 mt-3">
              {getAdjustmentTypeBadge(adjustmentType)}
              <span className="text-sm text-lats-text-secondary">
                {adjustmentType === 'in' && `+${quantity} units`}
                {adjustmentType === 'out' && `-${quantity} units`}
                {adjustmentType === 'set' && `Set to ${quantity} units`}
              </span>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-lats-glass-border">
            <GlassButton
              type="submit"
              variant="primary"
              loading={loading}
              disabled={!isDirty}
              className="flex-1 sm:flex-none"
            >
              {loading ? 'Processing...' : 'Apply Adjustment'}
            </GlassButton>
            
            <GlassButton
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

// Export with display name for debugging
StockAdjustModal.displayName = 'StockAdjustModal';

export default StockAdjustModal;
