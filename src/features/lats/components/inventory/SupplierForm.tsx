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
import { t } from '../../lib/i18n/t';
import { AlertTriangle } from 'lucide-react';

// Validation schema - simplified
const supplierFormSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(100, 'Supplier name must be less than 100 characters'),
  company_name: z.string().max(100, 'Company name must be less than 100 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  phone: z.string().max(20, 'Phone number must be less than 20 characters').optional(),
  phone2: z.string().max(20, 'Phone number must be less than 20 characters').optional(),
  whatsapp: z.string().max(20, 'WhatsApp number must be less than 20 characters').optional(),
  instagram: z.string().max(50, 'Instagram handle must be less than 50 characters').optional(),
  wechat_id: z.string().max(50, 'WeChat ID must be less than 50 characters').optional(),
  city: z.string().max(50, 'City must be less than 50 characters').optional(),
  country: z.string().max(50, 'Country must be less than 50 characters').optional(),
  payment_account_type: z.enum(['mobile_money', 'bank_account', 'other']).optional(),
  mobile_money_account: z.string().max(50, 'Mobile money account must be less than 50 characters').optional(),
  bank_account_number: z.string().max(50, 'Bank account number must be less than 50 characters').optional(),
  bank_name: z.string().max(100, 'Bank name must be less than 100 characters').optional()
});

type SupplierFormData = z.infer<typeof supplierFormSchema>;

interface Supplier {
  id: string;
  name: string;
  company_name?: string;
  description?: string;
  phone?: string;
  phone2?: string;
  whatsapp?: string;
  instagram?: string;
  wechat_id?: string;
  city?: string;
  country?: string;
  payment_account_type?: 'mobile_money' | 'bank_account' | 'other';
  mobile_money_account?: string;
  bank_account_number?: string;
  bank_name?: string;
  created_at: string;
  updated_at: string;
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
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  
  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset,
    setValue
  } = useForm<SupplierFormData>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: supplier?.name || '',
      company_name: supplier?.company_name || '',
      description: supplier?.description || '',
      phone: supplier?.phone || '',
      phone2: supplier?.phone2 || '',
      whatsapp: supplier?.whatsapp || '',
      instagram: supplier?.instagram || '',
      wechat_id: supplier?.wechat_id || '',
      city: supplier?.city || '',
      country: supplier?.country || '',
      payment_account_type: supplier?.payment_account_type || '',
      mobile_money_account: supplier?.mobile_money_account || '',
      bank_account_number: supplier?.bank_account_number || '',
      bank_name: supplier?.bank_name || '',
    }
  });

  // Watch form values
  const watchedValues = watch();
  const selectedCountry = watchedValues.country;
  const showWeChatField = selectedCountry === 'CN';

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

  // Payment account type options
  const paymentAccountTypeOptions = [
    { value: 'mobile_money', label: 'Mobile Money' },
    { value: 'bank_account', label: 'Bank Account' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <GlassCard className={`max-w-2xl mx-auto ${className}`}>
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

            {/* Company Name */}
            <Controller
              name="company_name"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Company Name"
                  placeholder="Enter company name (optional)"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.company_name?.message}
                  maxLength={100}
                  helperText="The company that this supplier represents"
                />
              )}
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <button
                type="button"
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="text-blue-600 hover:text-blue-700 text-xs font-medium flex items-center gap-1"
              >
                {isDescriptionExpanded ? 'Minimize' : 'Add Description'}
                <svg 
                  className={`w-3 h-3 transition-transform ${isDescriptionExpanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
            
            {isDescriptionExpanded && (
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <GlassInput
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
            )}
            
            {!isDescriptionExpanded && watch('description') && (
              <div className="text-sm text-gray-600 bg-gray-50 p-2 rounded border">
                {watch('description').length > 100 
                  ? `${watch('description').substring(0, 100)}...` 
                  : watch('description')
                }
              </div>
            )}
          </div>
        </div>

        {/* Contact Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-lats-text">Contact Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  helperText="Primary phone number"
                />
              )}
            />

            {/* Phone 2 */}
            <Controller
              name="phone2"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Phone 2"
                  placeholder="+1 (555) 123-4568"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.phone2?.message}
                  maxLength={20}
                  helperText="Secondary phone number (optional)"
                />
              )}
            />

            {/* WhatsApp */}
            <Controller
              name="whatsapp"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="WhatsApp"
                  placeholder="+1 (555) 123-4569"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.whatsapp?.message}
                  maxLength={20}
                  helperText="WhatsApp number"
                />
              )}
            />

            {/* Instagram */}
            <Controller
              name="instagram"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Instagram"
                  placeholder="@example"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.instagram?.message}
                  maxLength={50}
                  helperText="Instagram handle (optional)"
                />
              )}
            />

            {/* WeChat ID - Only show when China is selected */}
            {showWeChatField && (
              <Controller
                name="wechat_id"
                control={control}
                render={({ field }) => (
                  <GlassInput
                    label="WeChat ID"
                    placeholder="Enter WeChat ID"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.wechat_id?.message}
                    maxLength={50}
                    helperText="WeChat business account"
                  />
                )}
              />
            )}
          </div>
        </div>

        {/* Location Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-lats-text">Location Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>
        </div>

        {/* Business Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-lats-text">Business Information</h3>
          
          {/* Payment Account Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Payment Account Type</label>
            <div className="flex flex-wrap gap-3">
              {paymentAccountTypeOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setValue('payment_account_type', option.value)}
                  className={`px-4 py-2 rounded-lg border-2 transition-all duration-200 font-medium text-sm ${
                    watchedValues.payment_account_type === option.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            {errors.payment_account_type && (
              <div className="text-red-500 text-xs mt-1 flex items-center gap-1">
                <AlertTriangle size={12} />
                {errors.payment_account_type.message}
              </div>
            )}
          </div>

          {/* Mobile Money Account - Only show when mobile_money is selected */}
          {watchedValues.payment_account_type === 'mobile_money' && (
            <Controller
              name="mobile_money_account"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Mobile Money Account"
                  placeholder="Enter mobile money number (e.g., 0712345678)"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.mobile_money_account?.message}
                  maxLength={50}
                  helperText="Enter the mobile money phone number"
                />
              )}
            />
          )}

          {/* Bank Account Details - Only show when bank_account is selected */}
          {watchedValues.payment_account_type === 'bank_account' && (
            <div className="space-y-4">
              <Controller
                name="bank_name"
                control={control}
                render={({ field }) => (
                  <GlassInput
                    label="Bank Name"
                    placeholder="Enter bank name"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.bank_name?.message}
                    maxLength={100}
                    helperText="Enter the name of the bank"
                  />
                )}
              />

              <Controller
                name="bank_account_number"
                control={control}
                render={({ field }) => (
                  <GlassInput
                    label="Bank Account Number"
                    placeholder="Enter bank account number"
                    value={field.value}
                    onChange={field.onChange}
                    error={errors.bank_account_number?.message}
                    maxLength={50}
                    helperText="Enter the bank account number"
                  />
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
