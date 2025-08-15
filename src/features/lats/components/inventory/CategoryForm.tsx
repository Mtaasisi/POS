// CategoryForm component for LATS module
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LATS_CLASSES } from '../../../tokens';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassInput from '../../../shared/components/ui/GlassInput';
import GlassSelect from '../../../shared/components/ui/GlassSelect';
import GlassButton from '../../../shared/components/ui/GlassButton';
import GlassBadge from '../../../shared/components/ui/GlassBadge';
import { t } from '../../lib/i18n/t';
import { format } from '../../lib/format';

// Validation schema
const categoryFormSchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100, 'Category name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  parentId: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  icon: z.string().max(50, 'Icon name must be less than 50 characters').optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().min(0, 'Sort order must be 0 or greater').default(0),
  metadata: z.record(z.string()).optional()
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

interface Category {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  color?: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface CategoryFormProps {
  category?: Category;
  parentCategories?: Category[];
  onSubmit: (data: CategoryFormData) => Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;
  loading?: boolean;
  className?: string;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  parentCategories = [],
  onSubmit,
  onCancel,
  onClose,
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
  } = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: category?.name || '',
      description: category?.description || '',
      parentId: category?.parentId || '',
      color: category?.color || '#3B82F6',
      icon: category?.icon || '',
      isActive: category?.isActive ?? true,
      sortOrder: category?.sortOrder || 0,
      metadata: category?.metadata || {}
    }
  });

  // Watch form values
  const watchedValues = watch();
  const isActive = watchedValues.isActive;

  // Handle form submission
  const handleFormSubmit = async (data: CategoryFormData) => {
    try {
      await onSubmit(data);
      reset(data); // Reset form with new values
    } catch (error) {
      console.error('Category form submission error:', error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    const cancelHandler = onCancel || onClose;
    if (!cancelHandler) {
      console.warn('CategoryForm: No cancel handler provided');
      return;
    }

    if (isDirty) {
      if (confirm(t('common.confirmDiscard'))) {
        reset();
        cancelHandler();
      }
    } else {
      cancelHandler();
    }
  };

  // Color options
  const colorOptions = [
    { value: '#3B82F6', label: 'Blue', color: '#3B82F6' },
    { value: '#10B981', label: 'Green', color: '#10B981' },
    { value: '#F59E0B', label: 'Yellow', color: '#F59E0B' },
    { value: '#EF4444', label: 'Red', color: '#EF4444' },
    { value: '#8B5CF6', label: 'Purple', color: '#8B5CF6' },
    { value: '#EC4899', label: 'Pink', color: '#EC4899' },
    { value: '#6B7280', label: 'Gray', color: '#6B7280' },
    { value: '#000000', label: 'Black', color: '#000000' }
  ];

  // Icon options
  const iconOptions = [
    { value: 'box', label: 'Box' },
    { value: 'package', label: 'Package' },
    { value: 'cube', label: 'Cube' },
    { value: 'tag', label: 'Tag' },
    { value: 'folder', label: 'Folder' },
    { value: 'star', label: 'Star' },
    { value: 'heart', label: 'Heart' },
    { value: 'bookmark', label: 'Bookmark' }
  ];

  return (
    <GlassCard className={`max-w-2xl mx-auto ${className}`}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-lats-text">
              {category ? t('common.edit') : t('common.add')} {t('common.category')}
            </h2>
            <p className="text-sm text-lats-text-secondary mt-1">
              {category ? 'Update category information' : 'Create a new product category'}
            </p>
          </div>
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
        </div>

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-lats-text">Basic Information</h3>
          
          {/* Name */}
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <GlassInput
                label={t('common.name')}
                placeholder="Enter category name"
                value={field.value}
                onChange={field.onChange}
                error={errors.name?.message}
                required
                maxLength={100}
              />
            )}
          />

          {/* Description */}
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <GlassInput
                label={t('common.description')}
                placeholder="Enter category description (optional)"
                value={field.value}
                onChange={field.onChange}
                error={errors.description?.message}
                multiline
                rows={3}
                maxLength={500}
                helperText={`${field.value?.length || 0}/500 characters`}
              />
            )}
          />

          {/* Parent Category */}
          {parentCategories.length > 0 && (
            <Controller
              name="parentId"
              control={control}
              render={({ field }) => (
                <GlassSelect
                  label="Parent Category"
                  placeholder="Select parent category (optional)"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.parentId?.message}
                  options={[
                    { value: '', label: 'No parent (root category)' },
                    ...parentCategories.map(cat => ({
                      value: cat.id,
                      label: cat.name
                    }))
                  ]}
                  clearable
                />
              )}
            />
          )}
        </div>

        {/* Appearance */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-lats-text">Appearance</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Color */}
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <GlassSelect
                  label="Category Color"
                  placeholder="Select color"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.color?.message}
                  options={colorOptions}

                />
              )}
            />

            {/* Icon */}
            <Controller
              name="icon"
              control={control}
              render={({ field }) => (
                <GlassSelect
                  label="Category Icon"
                  placeholder="Select icon"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.icon?.message}
                  options={iconOptions}
                  clearable
                />
              )}
            />
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
              {/* Sort Order */}
              <Controller
                name="sortOrder"
                control={control}
                render={({ field }) => (
                  <GlassInput
                    label="Sort Order"
                    placeholder="0"
                    type="number"
                    value={field.value}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    error={errors.sortOrder?.message}
                    min={0}
                    helperText="Lower numbers appear first"
                  />
                )}
              />

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
                        Inactive categories won't appear in product selection
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
            {loading ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
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
CategoryForm.displayName = 'CategoryForm';

export default CategoryForm;
