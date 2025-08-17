// BrandForm component for LATS module
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

// Validation schema
const brandFormSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(100, 'Brand name must be less than 100 characters'),
  companyName: z.string().max(100, 'Company name must be less than 100 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  website: z.string().url('Invalid website URL').optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().max(20, 'Phone number must be less than 20 characters').optional(),
  address: z.string().max(200, 'Address must be less than 200 characters').optional(),
  country: z.string().max(50, 'Country must be less than 50 characters').optional(),
  logo: z.string().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Invalid color format').optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().min(0, 'Sort order must be 0 or greater').default(0),
  metadata: z.record(z.string()).optional()
});

type BrandFormData = z.infer<typeof brandFormSchema>;

interface Brand {
  id: string;
  name: string;
  companyName?: string;
  description?: string;
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  country?: string;
  logo?: string;
  color?: string;
  isActive: boolean;
  sortOrder: number;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface BrandFormProps {
  brand?: Brand;
  onSubmit: (data: BrandFormData) => Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;
  loading?: boolean;
  className?: string;
}

const BrandForm: React.FC<BrandFormProps> = ({
  brand,
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
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: brand?.name || '',
      companyName: brand?.companyName || '',
      description: brand?.description || '',
      website: brand?.website || '',
      email: brand?.email || '',
      phone: brand?.phone || '',
      address: brand?.address || '',
      country: brand?.country || '',
      logo: brand?.logo || '',
      color: brand?.color || '#3B82F6',
      isActive: brand?.isActive ?? true,
      sortOrder: brand?.sortOrder || 0,
      metadata: brand?.metadata || {}
    }
  });

  // Watch form values
  const watchedValues = watch();
  const isActive = watchedValues.isActive;

  // Handle form submission
  const handleFormSubmit = async (data: BrandFormData) => {
    try {
      await onSubmit(data);
      reset(data); // Reset form with new values
    } catch (error) {
      console.error('Brand form submission error:', error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    const cancelHandler = onCancel || onClose;
    if (!cancelHandler) {
      console.warn('BrandForm: No cancel handler provided');
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

  // Country options
  const countryOptions = [
    { value: 'TZ', label: 'Tanzania' },
    { value: 'AE', label: 'Dubai (UAE)' },
    { value: 'CN', label: 'China' },
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'JP', label: 'Japan' },
    { value: 'IN', label: 'India' },
    { value: 'BR', label: 'Brazil' },
    { value: 'AU', label: 'Australia' }
  ];

  return (
    <GlassCard className={`max-w-2xl mx-auto ${className}`}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-lats-text">
              {brand ? t('common.edit') : t('common.add')} {t('common.brand')}
            </h2>
            <p className="text-sm text-lats-text-secondary mt-1">
              {brand ? 'Update brand information' : 'Create a new product brand'}
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
                placeholder="Enter brand name"
                value={field.value}
                onChange={field.onChange}
                error={errors.name?.message}
                required
                maxLength={100}
              />
            )}
          />

          {/* Company Name */}
          <Controller
            name="companyName"
            control={control}
            render={({ field }) => (
              <GlassInput
                label="Company Name"
                placeholder="Enter company name (optional)"
                value={field.value}
                onChange={field.onChange}
                error={errors.companyName?.message}
                maxLength={100}
                helperText="The company that owns this brand"
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
                placeholder="Enter brand description (optional)"
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

          {/* Website */}
          <Controller
            name="website"
            control={control}
            render={({ field }) => (
              <GlassInput
                label="Website"
                placeholder="https://example.com"
                value={field.value}
                onChange={field.onChange}
                error={errors.website?.message}
                type="url"
                helperText="Enter the brand's official website"
              />
            )}
          />
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-lats-text">Contact Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Email */}
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Email"
                  placeholder="contact@brand.com"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.email?.message}
                  type="email"
                />
              )}
            />

            {/* Phone */}
            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Phone"
                  placeholder="+1 (555) 123-4567"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.phone?.message}
                  maxLength={20}
                />
              )}
            />
          </div>

          {/* Address */}
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <GlassInput
                label="Address"
                placeholder="Enter brand address"
                value={field.value}
                onChange={field.onChange}
                error={errors.address?.message}
                multiline
                rows={2}
                maxLength={200}
              />
            )}
          />

          {/* Country */}
          <Controller
            name="country"
            control={control}
            render={({ field }) => (
              <GlassSelect
                label="Country"
                placeholder="Select country"
                value={field.value}
                onChange={field.onChange}
                error={errors.country?.message}
                options={countryOptions}
                clearable
              />
            )}
          />
        </div>

        {/* Brand Identity */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-lats-text">Brand Identity</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Logo URL */}
            <Controller
              name="logo"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Logo URL"
                  placeholder="https://example.com/logo.png"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.logo?.message}
                  type="url"
                  helperText="URL to the brand logo image"
                />
              )}
            />

            {/* Brand Color */}
            <Controller
              name="color"
              control={control}
              render={({ field }) => (
                <GlassSelect
                  label="Brand Color"
                  placeholder="Select color"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.color?.message}
                  options={colorOptions}

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
                        Inactive brands won't appear in product selection
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
            {loading ? 'Saving...' : brand ? 'Update Brand' : 'Create Brand'}
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
BrandForm.displayName = 'BrandForm';

export default BrandForm;
