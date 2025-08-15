// VariantForm component for LATS module
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

// Validation schema
const variantFormSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU must be less than 50 characters'),
  name: z.string().min(1, 'Variant name is required').max(100, 'Variant name must be less than 100 characters'),
  barcode: z.string().optional(),
  price: z.number().min(0, 'Price must be 0 or greater'),
  costPrice: z.number().min(0, 'Cost price must be 0 or greater'),
  stockQuantity: z.number().min(0, 'Stock quantity must be 0 or greater'),
  minStockLevel: z.number().min(0, 'Minimum stock level must be 0 or greater'),
  maxStockLevel: z.number().min(0, 'Maximum stock level must be 0 or greater'),
  weight: z.number().min(0, 'Weight must be 0 or greater').optional(),
  dimensions: z.object({
    length: z.number().min(0, 'Length must be 0 or greater').optional(),
    width: z.number().min(0, 'Width must be 0 or greater').optional(),
    height: z.number().min(0, 'Height must be 0 or greater').optional()
  }).optional(),
  attributes: z.record(z.string()).optional(),
  isActive: z.boolean().default(true)
});

type VariantFormData = z.infer<typeof variantFormSchema>;

interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  barcode?: string;
  price: number;
  costPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  maxStockLevel: number;
  weight?: number;
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
  };
  attributes?: Record<string, string>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface VariantFormProps {
  variant?: ProductVariant;
  onSubmit: (data: VariantFormData) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
}

const VariantForm: React.FC<VariantFormProps> = ({
  variant,
  onSubmit,
  onCancel,
  loading = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset
  } = useForm<VariantFormData>({
    resolver: zodResolver(variantFormSchema),
    defaultValues: {
      sku: variant?.sku || '',
      name: variant?.name || '',
      barcode: variant?.barcode || '',
      price: variant?.price || 0,
      costPrice: variant?.costPrice || 0,
      stockQuantity: variant?.stockQuantity || 0,
      minStockLevel: variant?.minStockLevel || 0,
      maxStockLevel: variant?.maxStockLevel || 100,
      weight: variant?.weight || 0,
      dimensions: variant?.dimensions || { length: 0, width: 0, height: 0 },
      attributes: variant?.attributes || {},
      isActive: variant?.isActive ?? true
    }
  });

  // Watch form values
  const watchedValues = watch();
  const isActive = watchedValues.isActive;
  const price = watchedValues.price;
  const costPrice = watchedValues.costPrice;
  const stockQuantity = watchedValues.stockQuantity;
  const minStockLevel = watchedValues.minStockLevel;
  const maxStockLevel = watchedValues.maxStockLevel;

  // Calculate profit margin
  const profitMargin = price > 0 ? ((price - costPrice) / price) * 100 : 0;
  const stockStatus = stockQuantity <= minStockLevel ? 'low' : stockQuantity >= maxStockLevel ? 'high' : 'normal';

  // Handle form submission
  const handleFormSubmit = async (data: VariantFormData) => {
    try {
      await onSubmit(data);
      reset(data); // Reset form with new values
    } catch (error) {
      console.error('Variant form submission error:', error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (isDirty) {
      if (confirm(t('common.confirmDiscard'))) {
        reset();
        onCancel();
      }
    } else {
      onCancel();
    }
  };

  // Stock status badge
  const getStockStatusBadge = () => {
    switch (stockStatus) {
      case 'low':
        return <GlassBadge variant="error">Low Stock</GlassBadge>;
      case 'high':
        return <GlassBadge variant="warning">Overstocked</GlassBadge>;
      default:
        return <GlassBadge variant="success">In Stock</GlassBadge>;
    }
  };

  return (
    <GlassCard className={`max-w-4xl mx-auto ${className}`}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-lats-text">
              {variant ? t('common.edit') : t('common.add')} Variant
            </h2>
            <p className="text-sm text-lats-text-secondary mt-1">
              {variant ? 'Update variant information' : 'Create a new product variant'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <GlassBadge
              variant={isActive ? 'success' : 'error'}
              icon={
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d={isActive ? "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" : "M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"} />
                </svg>
              }
            >
              {isActive ? t('common.active') : t('common.inactive')}
            </GlassBadge>
            {getStockStatusBadge()}
          </div>
        </div>

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-lats-text">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Variant Name"
                  placeholder="e.g., Red, Large, Premium"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.name?.message}
                  required
                  maxLength={100}
                />
              )}
            />

            {/* SKU */}
            <Controller
              name="sku"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="SKU"
                  placeholder="SKU001"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.sku?.message}
                  required
                  maxLength={50}
                  helperText="Unique variant identifier"
                />
              )}
            />

            {/* Barcode */}
            <Controller
              name="barcode"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Barcode"
                  placeholder="Enter barcode"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.barcode?.message}
                  maxLength={50}
                />
              )}
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-lats-text">Pricing</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Price */}
            <Controller
              name="price"
              control={control}
              render={({ field }) => (
                <PriceInput
                  label="Selling Price"
                  placeholder="0"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.price?.message}
                  required
                  helperText="Price customers will pay"
                />
              )}
            />

            {/* Cost Price */}
            <Controller
              name="costPrice"
              control={control}
              render={({ field }) => (
                <PriceInput
                  label="Cost Price"
                  placeholder="0"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.costPrice?.message}
                  required
                  helperText="Your cost for this item"
                />
              )}
            />

            {/* Profit Margin Display */}
            <div className="flex flex-col justify-end">
              <label className="text-sm font-medium text-lats-text mb-2">Profit Margin</label>
              <div className="p-3 bg-lats-surface/50 rounded-lats-radius-md border border-lats-glass-border">
                <div className="text-lg font-semibold text-lats-text">
                  {profitMargin.toFixed(1)}%
                </div>
                <div className="text-xs text-lats-text-secondary">
                  {t('common.profitPerUnit', { price: price - costPrice })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stock Management */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-lats-text">Stock Management</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Current Stock */}
            <Controller
              name="stockQuantity"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Current Stock"
                  placeholder="0"
                  type="number"
                  value={field.value}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  error={errors.stockQuantity?.message}
                  min={0}
                  required
                  helperText="Available quantity"
                />
              )}
            />

            {/* Minimum Stock Level */}
            <Controller
              name="minStockLevel"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Minimum Stock Level"
                  placeholder="0"
                  type="number"
                  value={field.value}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  error={errors.minStockLevel?.message}
                  min={0}
                  required
                  helperText="Reorder point"
                />
              )}
            />

            {/* Maximum Stock Level */}
            <Controller
              name="maxStockLevel"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Maximum Stock Level"
                  placeholder="100"
                  type="number"
                  value={field.value}
                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  error={errors.maxStockLevel?.message}
                  min={0}
                  required
                  helperText="Overstock warning level"
                />
              )}
            />
          </div>

          {/* Stock Status Summary */}
          <div className="p-4 bg-lats-surface/30 rounded-lats-radius-md border border-lats-glass-border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-lats-text">{stockQuantity}</div>
                <div className="text-xs text-lats-text-secondary">Current Stock</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-lats-text">{minStockLevel}</div>
                <div className="text-xs text-lats-text-secondary">Min Level</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-lats-text">{maxStockLevel}</div>
                <div className="text-xs text-lats-text-secondary">Max Level</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-lats-text">
                  {stockQuantity > 0 ? Math.floor((stockQuantity / maxStockLevel) * 100) : 0}%
                </div>
                <div className="text-xs text-lats-text-secondary">Stock Level</div>
              </div>
            </div>
          </div>
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
              {/* Weight */}
              <Controller
                name="weight"
                control={control}
                render={({ field }) => (
                  <GlassInput
                    label="Weight (kg)"
                    placeholder="0.00"
                    type="number"
                    value={field.value}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    error={errors.weight?.message}
                    min={0}
                    step={0.01}
                    helperText="Product weight in kilograms"
                  />
                )}
              />

              {/* Dimensions */}
              <div className="space-y-4">
                <label className="text-sm font-medium text-lats-text">Dimensions (cm)</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Controller
                    name="dimensions.length"
                    control={control}
                    render={({ field }) => (
                      <GlassInput
                        label="Length"
                        placeholder="0.00"
                        type="number"
                        value={field.value}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        error={errors.dimensions?.length?.message}
                        min={0}
                        step={0.01}
                      />
                    )}
                  />

                  <Controller
                    name="dimensions.width"
                    control={control}
                    render={({ field }) => (
                      <GlassInput
                        label="Width"
                        placeholder="0.00"
                        type="number"
                        value={field.value}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        error={errors.dimensions?.width?.message}
                        min={0}
                        step={0.01}
                      />
                    )}
                  />

                  <Controller
                    name="dimensions.height"
                    control={control}
                    render={({ field }) => (
                      <GlassInput
                        label="Height"
                        placeholder="0.00"
                        type="number"
                        value={field.value}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        error={errors.dimensions?.height?.message}
                        min={0}
                        step={0.01}
                      />
                    )}
                  />
                </div>
              </div>

              {/* Active Status */}
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <div className="flex items-center justify-between p-3 bg-lats-surface/50 rounded-lats-radius-md">
                    <div>
                      <label className="text-sm font-medium text-lats-text">
                        Active Status
                      </label>
                      <p className="text-xs text-lats-text-secondary">
                        Inactive variants won't appear in product selection
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={field.value}
                        onChange={field.onChange}
                      />
                      <div className={`w-11 h-6 rounded-full transition-colors ${
                        field.value ? 'bg-lats-primary' : 'bg-lats-surface/50'
                      }`}>
                        <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${
                          field.value ? 'translate-x-5' : 'translate-x-0'
                        }`} />
                      </div>
                    </label>
                  </div>
                )}
              />
            </div>
          )}
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
            {loading ? 'Saving...' : variant ? 'Update Variant' : 'Create Variant'}
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
  );
};

// Export with display name for debugging
VariantForm.displayName = 'VariantForm';

export default VariantForm;
