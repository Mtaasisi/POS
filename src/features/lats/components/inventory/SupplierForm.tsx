// SupplierForm component for LATS module
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
import PriceInput from '../../../../shared/components/ui/PriceInput';
import { t } from '../../lib/i18n/t';

// Validation schema
const supplierFormSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(100, 'Supplier name must be less than 100 characters'),
  code: z.string().min(1, 'Supplier code is required').max(20, 'Supplier code must be less than 20 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  contactPerson: z.string().max(100, 'Contact person must be less than 100 characters').optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().max(20, 'Phone number must be less than 20 characters').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  address: z.string().max(200, 'Address must be less than 200 characters').optional(),
  city: z.string().max(50, 'City must be less than 50 characters').optional(),
  state: z.string().max(50, 'State must be less than 50 characters').optional(),
  country: z.string().max(50, 'Country must be less than 50 characters').optional(),
  postalCode: z.string().max(20, 'Postal code must be less than 20 characters').optional(),
  taxId: z.string().max(50, 'Tax ID must be less than 50 characters').optional(),
  paymentTerms: z.string().max(100, 'Payment terms must be less than 100 characters').optional(),
  creditLimit: z.number().min(0, 'Credit limit must be 0 or greater').optional(),
  isActive: z.boolean().default(true),
  sortOrder: z.number().min(0, 'Sort order must be 0 or greater').default(0),
  metadata: z.record(z.string()).optional()
});

type SupplierFormData = z.infer<typeof supplierFormSchema>;

interface Supplier {
  id: string;
  name: string;
  code: string;
  description?: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  taxId?: string;
  paymentTerms?: string;
  creditLimit?: number;
  isActive: boolean;
  sortOrder: number;
  metadata?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

interface SupplierFormProps {
  supplier?: Supplier;
  onSubmit: (data: SupplierFormData) => Promise<void>;
  onCancel?: () => void;
  onClose?: () => void;
  loading?: boolean;
  className?: string;
}

const SupplierForm: React.FC<SupplierFormProps> = ({
  supplier,
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
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: supplier?.name || '',
      code: supplier?.code || '',
      description: supplier?.description || '',
      contactPerson: supplier?.contactPerson || '',
      email: supplier?.email || '',
      phone: supplier?.phone || '',
      website: supplier?.website || '',
      address: supplier?.address || '',
      city: supplier?.city || '',
      state: supplier?.state || '',
      country: supplier?.country || '',
      postalCode: supplier?.postalCode || '',
      taxId: supplier?.taxId || '',
      paymentTerms: supplier?.paymentTerms || '',
      creditLimit: supplier?.creditLimit || 0,
      isActive: supplier?.isActive ?? true,
      sortOrder: supplier?.sortOrder || 0,
      metadata: supplier?.metadata || {}
    }
  });

  // Watch form values
  const watchedValues = watch();
  const isActive = watchedValues.isActive;

  // Handle form submission
  const handleFormSubmit = async (data: SupplierFormData) => {
    try {
      await onSubmit(data);
      reset(data); // Reset form with new values
    } catch (error) {
      console.error('Supplier form submission error:', error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    const cancelHandler = onCancel || onClose;
    if (!cancelHandler) {
      console.warn('SupplierForm: No cancel handler provided');
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

  // Payment terms options
  const paymentTermsOptions = [
    { value: 'Net 30', label: 'Net 30 days' },
    { value: 'Net 60', label: 'Net 60 days' },
    { value: 'Net 90', label: 'Net 90 days' },
    { value: 'Due on receipt', label: 'Due on receipt' },
    { value: 'Cash on delivery', label: 'Cash on delivery' },
    { value: 'Advance payment', label: 'Advance payment' }
  ];

  // Country options
  const countryOptions = [
    { value: 'US', label: 'United States' },
    { value: 'CA', label: 'Canada' },
    { value: 'UK', label: 'United Kingdom' },
    { value: 'DE', label: 'Germany' },
    { value: 'FR', label: 'France' },
    { value: 'JP', label: 'Japan' },
    { value: 'CN', label: 'China' },
    { value: 'IN', label: 'India' },
    { value: 'BR', label: 'Brazil' },
    { value: 'AU', label: 'Australia' }
  ];

  return (
    <GlassCard className={`max-w-3xl mx-auto ${className}`}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-lats-text">
              {supplier ? t('common.edit') : t('common.add')} {t('common.supplier')}
            </h2>
            <p className="text-sm text-lats-text-secondary mt-1">
              {supplier ? 'Update supplier information' : 'Create a new supplier'}
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
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <Controller
              name="name"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label={t('common.name')}
                  placeholder="Enter supplier name"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.name?.message}
                  required
                  maxLength={100}
                />
              )}
            />

            {/* Code */}
            <Controller
              name="code"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Supplier Code"
                  placeholder="SUP001"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.code?.message}
                  required
                  maxLength={20}
                  helperText="Unique identifier for the supplier"
                />
              )}
            />
          </div>

          {/* Description */}
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <GlassInput
                label={t('common.description')}
                placeholder="Enter supplier description (optional)"
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
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-lats-text">Contact Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Contact Person */}
            <Controller
              name="contactPerson"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Contact Person"
                  placeholder="John Doe"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.contactPerson?.message}
                  maxLength={100}
                />
              )}
            />

            {/* Email */}
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Email"
                  placeholder="contact@supplier.com"
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

            {/* Website */}
            <Controller
              name="website"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Website"
                  placeholder="https://supplier.com"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.website?.message}
                  type="url"
                />
              )}
            />
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-lats-text">Address Information</h3>
          
          {/* Address */}
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <GlassInput
                label="Address"
                placeholder="Enter supplier address"
                value={field.value}
                onChange={field.onChange}
                error={errors.address?.message}
                multiline
                rows={2}
                maxLength={200}
              />
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* City */}
            <Controller
              name="city"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="City"
                  placeholder="Enter city"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.city?.message}
                  maxLength={50}
                />
              )}
            />

            {/* State */}
            <Controller
              name="state"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="State/Province"
                  placeholder="Enter state"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.state?.message}
                  maxLength={50}
                />
              )}
            />

            {/* Postal Code */}
            <Controller
              name="postalCode"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Postal Code"
                  placeholder="Enter postal code"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.postalCode?.message}
                  maxLength={20}
                />
              )}
            />
          </div>

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

        {/* Business Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-lats-text">Business Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tax ID */}
            <Controller
              name="taxId"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Tax ID"
                  placeholder="Enter tax identification number"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.taxId?.message}
                  maxLength={50}
                />
              )}
            />

            {/* Payment Terms */}
            <Controller
              name="paymentTerms"
              control={control}
              render={({ field }) => (
                <GlassSelect
                  label="Payment Terms"
                  placeholder="Select payment terms"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.paymentTerms?.message}
                  options={paymentTermsOptions}
                  clearable
                />
              )}
            />
          </div>

          {/* Credit Limit */}
          <Controller
            name="creditLimit"
            control={control}
            render={({ field }) => (
                              <PriceInput
                  label="Credit Limit"
                  placeholder="0"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.creditLimit?.message}
                  helperText="Maximum credit amount allowed"
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
                        Inactive suppliers won't appear in selection lists
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
            {loading ? 'Saving...' : supplier ? 'Update Supplier' : 'Create Supplier'}
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
SupplierForm.displayName = 'SupplierForm';

export default SupplierForm;
