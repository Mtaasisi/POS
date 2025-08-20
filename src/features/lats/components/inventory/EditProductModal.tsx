import React, { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Save, Package, AlertTriangle, Upload, Trash2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassInput from '../../../shared/components/ui/GlassInput';
import GlassSelect from '../../../shared/components/ui/GlassSelect';
import GlassButton from '../../../shared/components/ui/GlassButton';
import GlassBadge from '../../../shared/components/ui/GlassBadge';
import PriceInput from '../../../../shared/components/ui/PriceInput';
import { LATS_CLASSES } from '../../tokens';
import { t } from '../../lib/i18n/t';
import { format } from '../../lib/format';
import { Product, Category, Brand, Supplier, ProductImage } from '../../types/inventory';

// Validation schema for product editing
const editProductSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(200, 'Name must be less than 200 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  sku: z.string().min(1, 'SKU is required').max(100, 'SKU must be less than 100 characters'),
  barcode: z.string().max(100, 'Barcode must be less than 100 characters').optional(),
  categoryId: z.string().min(1, 'Category is required'),
  brandId: z.string().optional(),
  supplierId: z.string().optional(),
  condition: z.string().min(1, 'Condition is required'),
  storeShelf: z.string().max(100, 'Store shelf must be less than 100 characters').optional(),
  price: z.number().min(0, 'Price must be 0 or greater'),
  costPrice: z.number().min(0, 'Cost price must be 0 or greater'),
  stockQuantity: z.number().min(0, 'Stock quantity must be 0 or greater'),
  minStockLevel: z.number().min(0, 'Minimum stock level must be 0 or greater'),
  weight: z.number().min(0, 'Weight must be 0 or greater').optional(),
  tags: z.array(z.string()).default([])
});

type EditProductFormData = z.infer<typeof editProductSchema>;

interface EditProductModalProps {
  product: Product | null;
  categories: Category[];
  brands: Brand[];
  suppliers: Supplier[];
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EditProductFormData) => Promise<void>;
  loading?: boolean;
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  product,
  categories,
  brands,
  suppliers,
  isOpen,
  onClose,
  onSubmit,
  loading = false
}) => {
  const [tagInput, setTagInput] = useState('');
  const [currentTags, setCurrentTags] = useState<string[]>([]);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
    setValue
  } = useForm<EditProductFormData>({
    resolver: zodResolver(editProductSchema),
    defaultValues: {
      name: '',
      description: '',
      sku: '',
      barcode: '',
      categoryId: '',
      brandId: '',
      supplierId: '',
      condition: 'new',
      storeShelf: '',
      price: 0,
      costPrice: 0,
      stockQuantity: 0,
      minStockLevel: 0,
      weight: 0,
      tags: []
    }
  });

  // Load product data when product changes
  useEffect(() => {
    if (product && isOpen) {
      reset({
        name: product.name,
        description: product.description || '',
        sku: product.sku,
        barcode: product.barcode || '',
        categoryId: product.categoryId,
        brandId: product.brandId || '',
        supplierId: product.supplierId || '',
        condition: product.condition,
        storeShelf: product.storeShelf || '',
        price: product.price,
        costPrice: product.costPrice,
        stockQuantity: product.stockQuantity,
        minStockLevel: product.minStockLevel,
        weight: product.weight || 0,
        tags: product.tags
      });
      setCurrentTags(product.tags || []);
    }
  }, [product, isOpen, reset]);

  // Handle form submission
  const handleFormSubmit = async (data: EditProductFormData) => {
    try {
      await onSubmit({
        ...data,
        tags: currentTags
      });
      toast.success(t('Product updated successfully'));
      onClose();
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error(t('Failed to update product'));
    }
  };

  // Handle tag operations
  const addTag = () => {
    if (tagInput.trim() && !currentTags.includes(tagInput.trim())) {
      const newTags = [...currentTags, tagInput.trim()];
      setCurrentTags(newTags);
      setValue('tags', newTags);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = currentTags.filter(tag => tag !== tagToRemove);
    setCurrentTags(newTags);
    setValue('tags', newTags);
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleClose = () => {
    reset();
    setCurrentTags([]);
    setTagInput('');
    onClose();
  };

  if (!isOpen || !product) return null;

  const conditionOptions = [
    { value: 'new', label: t('New') },
    { value: 'used', label: t('Used') },
    { value: 'refurbished', label: t('Refurbished') },
    { value: 'damaged', label: t('Damaged') }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <GlassCard className={`${LATS_CLASSES.card} p-6`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Package className="w-6 h-6 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-800">
                {t('Edit Product')}
              </h2>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting || loading}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <GlassInput
                    {...field}
                    label={t('Product Name')}
                    placeholder={t('Enter product name')}
                    error={errors.name?.message}
                    required
                  />
                )}
              />

              <Controller
                name="sku"
                control={control}
                render={({ field }) => (
                  <GlassInput
                    {...field}
                    label={t('SKU')}
                    placeholder={t('Enter SKU')}
                    error={errors.sku?.message}
                    required
                  />
                )}
              />

              <Controller
                name="barcode"
                control={control}
                render={({ field }) => (
                  <GlassInput
                    {...field}
                    label={t('Barcode')}
                    placeholder={t('Enter barcode')}
                    error={errors.barcode?.message}
                  />
                )}
              />

              <Controller
                name="condition"
                control={control}
                render={({ field }) => (
                  <GlassSelect
                    {...field}
                    label={t('Condition')}
                    options={conditionOptions}
                    error={errors.condition?.message}
                    required
                  />
                )}
              />
            </div>

            {/* Description */}
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('Description')}
                  </label>
                  <textarea
                    {...field}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder={t('Enter product description')}
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>
              )}
            />

            {/* Categories and Relationships */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <GlassSelect
                    {...field}
                    label={t('Category')}
                    options={[
                      { value: '', label: t('Select Category') },
                      ...categories.map(cat => ({ value: cat.id, label: cat.name }))
                    ]}
                    error={errors.categoryId?.message}
                    required
                  />
                )}
              />

              <Controller
                name="brandId"
                control={control}
                render={({ field }) => (
                  <GlassSelect
                    {...field}
                    label={t('Brand')}
                    options={[
                      { value: '', label: t('Select Brand') },
                      ...brands.map(brand => ({ value: brand.id, label: brand.name }))
                    ]}
                    error={errors.brandId?.message}
                  />
                )}
              />

              <Controller
                name="supplierId"
                control={control}
                render={({ field }) => (
                  <GlassSelect
                    {...field}
                    label={t('Supplier')}
                    options={[
                      { value: '', label: t('Select Supplier') },
                      ...suppliers.map(supplier => ({ value: supplier.id, label: supplier.name }))
                    ]}
                    error={errors.supplierId?.message}
                  />
                )}
              />
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Controller
                name="costPrice"
                control={control}
                render={({ field }) => (
                  <PriceInput
                    {...field}
                    label={t('Cost Price')}
                    error={errors.costPrice?.message}
                  />
                )}
              />

              <Controller
                name="price"
                control={control}
                render={({ field }) => (
                  <PriceInput
                    {...field}
                    label={t('Selling Price')}
                    error={errors.price?.message}
                  />
                )}
              />
            </div>

            {/* Stock Management */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Controller
                name="stockQuantity"
                control={control}
                render={({ field }) => (
                  <GlassInput
                    {...field}
                    type="number"
                    min="0"
                    step="1"
                    label={t('Current Stock')}
                    placeholder="0"
                    error={errors.stockQuantity?.message}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />

              <Controller
                name="minStockLevel"
                control={control}
                render={({ field }) => (
                  <GlassInput
                    {...field}
                    type="number"
                    min="0"
                    step="1"
                    label={t('Min Stock Level')}
                    placeholder="0"
                    error={errors.minStockLevel?.message}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                )}
              />

              <Controller
                name="weight"
                control={control}
                render={({ field }) => (
                  <GlassInput
                    {...field}
                    type="number"
                    min="0"
                    step="0.01"
                    label={t('Weight (kg)')}
                    placeholder="0"
                    error={errors.weight?.message}
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                )}
              />
            </div>

            {/* Store Location */}
            <Controller
              name="storeShelf"
              control={control}
              render={({ field }) => (
                <GlassInput
                  {...field}
                  label={t('Store Shelf/Location')}
                  placeholder={t('e.g., Aisle A, Shelf B1')}
                  error={errors.storeShelf?.message}
                />
              )}
            />

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('Tags')}
              </label>
              <div className="space-y-3">
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagInputKeyPress}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('Add a tag')}
                  />
                  <GlassButton
                    type="button"
                    onClick={addTag}
                    variant="secondary"
                    disabled={!tagInput.trim()}
                  >
                    {t('Add')}
                  </GlassButton>
                </div>
                {currentTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentTags.map((tag, index) => (
                      <GlassBadge
                        key={index}
                        variant="info"
                        className="flex items-center space-x-1"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-600"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </GlassBadge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <GlassButton
                type="button"
                onClick={handleClose}
                variant="secondary"
                disabled={isSubmitting || loading}
              >
                {t('Cancel')}
              </GlassButton>
              <GlassButton
                type="submit"
                disabled={isSubmitting || loading}
                className="flex items-center space-x-2"
              >
                {isSubmitting || loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('Saving...')}</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>{t('Save Changes')}</span>
                  </>
                )}
              </GlassButton>
            </div>
          </form>
        </GlassCard>
      </div>
    </div>
  );
};

export default EditProductModal;
