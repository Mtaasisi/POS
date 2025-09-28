// Enhanced Stock Adjustment Modal for handling multiple variants
import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Package, TrendingUp, TrendingDown, Settings, Info, CheckCircle, AlertCircle, X } from 'lucide-react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassInput from '../../../shared/components/ui/GlassInput';
import GlassSelect from '../../../shared/components/ui/GlassSelect';
import GlassButton from '../../../shared/components/ui/GlassButton';
import GlassBadge from '../../../shared/components/ui/GlassBadge';
import PriceInput from '../../../../shared/components/ui/PriceInput';
import { format } from '../../lib/format';

// Enhanced validation schema
const enhancedStockAdjustmentSchema = z.object({
  selectedVariantId: z.string().min(1, 'Please select a variant'),
  adjustmentType: z.enum(['in', 'out', 'set']),
  quantity: z.number().min(0.01, 'Quantity must be greater than 0'),
  reason: z.string().min(1, 'Reason is required').max(200, 'Reason must be less than 200 characters'),
  reference: z.string().max(100, 'Reference must be less than 100 characters').optional(),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  cost: z.number().min(0, 'Cost must be 0 or greater').optional(),
  location: z.string().max(100, 'Location must be less than 100 characters').optional()
});

type EnhancedStockAdjustmentData = z.infer<typeof enhancedStockAdjustmentSchema>;

interface ProductVariant {
  id: string;
  sku: string;
  name: string;
  sellingPrice: number;
  costPrice: number;
  quantity: number;
  minQuantity: number;
  maxQuantity?: number;
  attributes?: Record<string, any>;
}

interface Product {
  id: string;
  name: string;
  variants: ProductVariant[];
}

interface EnhancedStockAdjustModalProps {
  product?: Product;
  isOpen: boolean;
  onClose?: () => void;
  onSubmit?: (data: EnhancedStockAdjustmentData & { variant: ProductVariant }) => Promise<void>;
  loading?: boolean;
}

const EnhancedStockAdjustModal: React.FC<EnhancedStockAdjustModalProps> = ({
  product,
  isOpen,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset,
    setValue
  } = useForm<EnhancedStockAdjustmentData>({
    resolver: zodResolver(enhancedStockAdjustmentSchema),
    defaultValues: {
      selectedVariantId: '',
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
  const selectedVariantId = watchedValues.selectedVariantId;
  const adjustmentType = watchedValues.adjustmentType;
  const quantity = watchedValues.quantity;

  // Update selected variant when variant ID changes
  useEffect(() => {
    if (selectedVariantId && product?.variants) {
      const variant = product.variants.find(v => v.id === selectedVariantId);
      setSelectedVariant(variant || null);
    } else {
      setSelectedVariant(null);
    }
  }, [selectedVariantId, product?.variants]);

  // Calculate new stock level
  const getNewStockLevel = () => {
    if (!selectedVariant) return 0;
    
    switch (adjustmentType) {
      case 'in':
        return selectedVariant.quantity + quantity;
      case 'out':
        return Math.max(0, selectedVariant.quantity - quantity);
      case 'set':
        return quantity;
      default:
        return selectedVariant.quantity;
    }
  };

  const newStockLevel = getNewStockLevel();

  // Get stock status
  const getStockStatus = (stock: number) => {
    if (!selectedVariant) return 'normal';
    if (stock <= selectedVariant.minQuantity) return 'low';
    if (selectedVariant.maxQuantity && stock >= selectedVariant.maxQuantity) return 'high';
    return 'normal';
  };

  const currentStatus = selectedVariant ? getStockStatus(selectedVariant.quantity) : 'normal';
  const newStatus = selectedVariant ? getStockStatus(newStockLevel) : 'normal';

  // Handle form submission
  const handleFormSubmit = async (data: EnhancedStockAdjustmentData) => {
    try {
      if (onSubmit && selectedVariant) {
        await onSubmit({ ...data, variant: selectedVariant });
        reset();
        setSelectedVariant(null);
        onClose?.();
      }
    } catch (error) {
      console.error('Stock adjustment submission error:', error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (isDirty) {
      if (confirm('Are you sure you want to discard your changes?')) {
        reset();
        setSelectedVariant(null);
        onClose?.();
      }
    } else {
      reset();
      setSelectedVariant(null);
      onClose?.();
    }
  };

  // Adjustment type options
  const adjustmentTypeOptions = [
    { value: 'in', label: 'Stock In', icon: '📥', description: 'Add to current stock' },
    { value: 'out', label: 'Stock Out', icon: '📤', description: 'Remove from current stock' },
    { value: 'set', label: 'Set Stock', icon: '⚙️', description: 'Set to specific quantity' }
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
        return <GlassBadge variant="error" className="flex items-center gap-1"><AlertCircle className="w-3 h-3" />Low Stock</GlassBadge>;
      case 'high':
        return <GlassBadge variant="warning" className="flex items-center gap-1"><TrendingUp className="w-3 h-3" />Overstocked</GlassBadge>;
      default:
        return <GlassBadge variant="success" className="flex items-center gap-1"><CheckCircle className="w-3 h-3" />Normal</GlassBadge>;
    }
  };

  // Get adjustment type badge
  const getAdjustmentTypeBadge = (type: string) => {
    const option = adjustmentTypeOptions.find(opt => opt.value === type);
    if (!option) return null;
    
    return (
      <GlassBadge variant={type === 'in' ? 'success' : type === 'out' ? 'error' : 'info'}>
        {option.icon} {option.label}
      </GlassBadge>
    );
  };

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <GlassCard className="w-full">
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-lats-glass-border">
              <div>
                <h2 className="text-xl font-semibold text-lats-text flex items-center gap-2">
                  <Package className="w-6 h-6 text-lats-primary" />
                  Adjust Stock Level
                </h2>
                <p className="text-sm text-lats-text-secondary mt-1">
                  {product.name} - Select variant to adjust
                </p>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-lats-surface-hover rounded-lg transition-colors"
                type="button"
              >
                <X className="w-5 h-5 text-lats-text-secondary" />
              </button>
            </div>

            {/* Product Overview */}
            <div className="p-4 bg-lats-surface/30 rounded-lats-radius-md border border-lats-glass-border">
              <h3 className="text-lg font-medium text-lats-text mb-3 flex items-center gap-2">
                <Info className="w-5 h-5 text-lats-primary" />
                Product Overview
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <div className="text-sm text-lats-text-secondary">Product Name</div>
                  <div className="font-medium text-lats-text">{product.name}</div>
                </div>
                <div>
                  <div className="text-sm text-lats-text-secondary">Total Variants</div>
                  <div className="font-medium text-lats-text">{product.variants?.length || 0}</div>
                </div>
                <div>
                  <div className="text-sm text-lats-text-secondary">Total Stock</div>
                  <div className="font-medium text-lats-text">
                    {product.variants?.reduce((sum, v) => sum + (v.quantity || 0), 0) || 0}
                  </div>
                </div>
              </div>
            </div>

            {/* Variant Selection */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-lats-text">Select Variant to Adjust</h3>
              
              <Controller
                name="selectedVariantId"
                control={control}
                render={({ field }) => (
                  <div className="space-y-3">
                    {product.variants?.map((variant) => (
                      <div
                        key={variant.id}
                        className={`p-4 rounded-lats-radius-md border-2 cursor-pointer transition-all ${
                          field.value === variant.id
                            ? 'border-lats-primary bg-lats-primary/10'
                            : 'border-lats-glass-border hover:border-lats-primary/50 hover:bg-lats-surface/50'
                        }`}
                        onClick={() => field.onChange(variant.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <input
                                type="radio"
                                checked={field.value === variant.id}
                                onChange={() => field.onChange(variant.id)}
                                className="w-4 h-4 text-lats-primary"
                              />
                              <div>
                                <div className="font-medium text-lats-text">{variant.name}</div>
                                <div className="text-sm text-lats-text-secondary">SKU: {variant.sku}</div>
                              </div>
                            </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="text-lats-text-secondary">Current Stock</div>
                              <div className="font-medium text-lats-text">{variant.quantity}</div>
                            </div>
                            <div>
                              <div className="text-lats-text-secondary">Min Level</div>
                              <div className="font-medium text-lats-text">{variant.minQuantity}</div>
                            </div>
                            <div>
                              <div className="text-lats-text-secondary">Max Level</div>
                              <div className="font-medium text-lats-text">{variant.maxQuantity || 'N/A'}</div>
                            </div>
                            <div>
                              <div className="text-lats-text-secondary">Price</div>
                              <div className="font-medium text-lats-text">{format.money(variant.sellingPrice)}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="ml-4">
                          {getStatusBadge(getStockStatus(variant.quantity))}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                    {errors.selectedVariantId && (
                      <p className="text-red-500 text-sm mt-2">{errors.selectedVariantId.message}</p>
                    )}
                </div>
              )}
            />
          </div>

            {/* Adjustment Details - Only show when variant is selected */}
            {selectedVariant && (
              <>
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
                        options={adjustmentTypeOptions.map(opt => ({
                          value: opt.value,
                          label: `${opt.icon} ${opt.label}`,
                          description: opt.description
                        }))}
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
                        <Settings className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
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
                      <div className="text-xl font-bold text-lats-text">{selectedVariant.quantity}</div>
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
              </>
            )}

            {/* Form Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-lats-glass-border">
              <GlassButton
                type="submit"
                variant="primary"
                loading={loading}
                disabled={!isDirty || !selectedVariant}
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
    </div>
  );
};

// Export with display name for debugging
EnhancedStockAdjustModal.displayName = 'EnhancedStockAdjustModal';

export default EnhancedStockAdjustModal;
