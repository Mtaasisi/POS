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

// Validation schema - updated to match API interface
const supplierFormSchema = z.object({
  name: z.string().min(1, 'Supplier name is required').max(100, 'Supplier name must be less than 100 characters'),
  company_name: z.string().max(100, 'Company name must be less than 100 characters').optional(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  contact_person: z.string().max(100, 'Contact person must be less than 100 characters').optional(),
  email: z.string().email('Invalid email format').max(100, 'Email must be less than 100 characters').optional().or(z.literal('')),
  website: z.string().max(200, 'Website must be less than 200 characters').optional(),
  address: z.string().max(200, 'Address must be less than 200 characters').optional(),
  phone: z.string().max(20, 'Phone number must be less than 20 characters').optional(),
  phone2: z.string().max(20, 'Phone number must be less than 20 characters').optional(),
  whatsapp: z.string().max(20, 'WhatsApp number must be less than 20 characters').optional(),
  instagram: z.string().max(50, 'Instagram handle must be less than 50 characters').optional(),
  wechat_id: z.string().max(50, 'WeChat ID must be less than 50 characters').optional(),
  city: z.string().max(50, 'City must be less than 50 characters').optional(),
  country: z.string().max(50, 'Country must be less than 50 characters').optional(),
  notes: z.string().max(1000, 'Notes must be less than 1000 characters').optional(),
  currency: z.string().max(10, 'Currency code must be less than 10 characters').optional(),
  is_active: z.boolean().optional()
});

type SupplierFormData = z.infer<typeof supplierFormSchema>;

interface Supplier {
  id: string;
  name: string;
  company_name?: string;
  description?: string;
  contact_person?: string;
  email?: string;
  website?: string;
  address?: string;
  phone?: string;
  phone2?: string;
  whatsapp?: string;
  instagram?: string;
  wechat_id?: string;
  city?: string;
  country?: string;
  notes?: string;
  currency?: string;
  is_active?: boolean;
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
      contact_person: supplier?.contact_person || '',
      email: supplier?.email || '',
      website: supplier?.website || '',
      address: supplier?.address || '',
      phone: supplier?.phone || '',
      phone2: supplier?.phone2 || '',
      whatsapp: supplier?.whatsapp || '',
      instagram: supplier?.instagram || '',
      wechat_id: supplier?.wechat_id || '',
      city: supplier?.city || '',
      country: supplier?.country || '',
      notes: supplier?.notes || '',
      currency: supplier?.currency || '',
      is_active: supplier?.is_active ?? true, // Default to true for new suppliers
    }
  });

  // Watch form values
  const watchedValues = watch();
  const selectedCountry = watchedValues.country;
  const showWeChatField = selectedCountry === 'CN';

  // Handle form submission
  const handleFormSubmit = async (data: SupplierFormData) => {
    try {
      // Ensure new suppliers are always active by default
      const submissionData = {
        ...data,
        is_active: data.is_active ?? true // Default to true if not set
      };
      
      await onSubmit(submissionData);
      reset(submissionData); // Reset form with new values
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

  // Country options with flags
  const countryOptions = [
    { value: 'TZ', label: 'Tanzania', flag: '🇹🇿' },
    { value: 'AE', label: 'UAE', flag: '🇦🇪' },
    { value: 'CN', label: 'China', flag: '🇨🇳' },
    { value: 'US', label: 'United States', flag: '🇺🇸' },
    { value: 'CA', label: 'Canada', flag: '🇨🇦' },
    { value: 'UK', label: 'United Kingdom', flag: '🇬🇧' },
    { value: 'DE', label: 'Germany', flag: '🇩🇪' },
    { value: 'FR', label: 'France', flag: '🇫🇷' },
    { value: 'JP', label: 'Japan', flag: '🇯🇵' },
    { value: 'IN', label: 'India', flag: '🇮🇳' },
    { value: 'BR', label: 'Brazil', flag: '🇧🇷' },
    { value: 'AU', label: 'Australia', flag: '🇦🇺' },
    { value: 'KE', label: 'Kenya', flag: '🇰🇪' },
    { value: 'UG', label: 'Uganda', flag: '🇺🇬' },
    { value: 'RW', label: 'Rwanda', flag: '🇷🇼' },
    { value: 'ET', label: 'Ethiopia', flag: '🇪🇹' },
    { value: 'NG', label: 'Nigeria', flag: '🇳🇬' },
    { value: 'ZA', label: 'South Africa', flag: '🇿🇦' },
    { value: 'EG', label: 'Egypt', flag: '🇪🇬' },
    { value: 'SA', label: 'Saudi Arabia', flag: '🇸🇦' },
    { value: 'TR', label: 'Turkey', flag: '🇹🇷' },
    { value: 'RU', label: 'Russia', flag: '🇷🇺' },
    { value: 'KR', label: 'South Korea', flag: '🇰🇷' },
    { value: 'SG', label: 'Singapore', flag: '🇸🇬' },
    { value: 'MY', label: 'Malaysia', flag: '🇲🇾' },
    { value: 'TH', label: 'Thailand', flag: '🇹🇭' },
    { value: 'VN', label: 'Vietnam', flag: '🇻🇳' },
    { value: 'ID', label: 'Indonesia', flag: '🇮🇩' },
    { value: 'PH', label: 'Philippines', flag: '🇵🇭' }
  ];



  // Currency options with flags
  const currencyOptions = [
    { value: 'TZS', label: 'Tanzanian Shilling (TZS)', flag: '🇹🇿' },
    { value: 'AED', label: 'UAE Dirham (AED)', flag: '🇦🇪' },
    { value: 'CNY', label: 'Chinese Yuan (CNY)', flag: '🇨🇳' },
    { value: 'USD', label: 'US Dollar (USD)', flag: '🇺🇸' },
    { value: 'CAD', label: 'Canadian Dollar (CAD)', flag: '🇨🇦' },
    { value: 'GBP', label: 'British Pound (GBP)', flag: '🇬🇧' },
    { value: 'EUR', label: 'Euro (EUR)', flag: '🇪🇺' },
    { value: 'JPY', label: 'Japanese Yen (JPY)', flag: '🇯🇵' },
    { value: 'INR', label: 'Indian Rupee (INR)', flag: '🇮🇳' },
    { value: 'BRL', label: 'Brazilian Real (BRL)', flag: '🇧🇷' },
    { value: 'AUD', label: 'Australian Dollar (AUD)', flag: '🇦🇺' },
    { value: 'KES', label: 'Kenyan Shilling (KES)', flag: '🇰🇪' },
    { value: 'UGX', label: 'Ugandan Shilling (UGX)', flag: '🇺🇬' },
    { value: 'RWF', label: 'Rwandan Franc (RWF)', flag: '🇷🇼' },
    { value: 'ETB', label: 'Ethiopian Birr (ETB)', flag: '🇪🇹' },
    { value: 'NGN', label: 'Nigerian Naira (NGN)', flag: '🇳🇬' },
    { value: 'ZAR', label: 'South African Rand (ZAR)', flag: '🇿🇦' },
    { value: 'EGP', label: 'Egyptian Pound (EGP)', flag: '🇪🇬' },
    { value: 'SAR', label: 'Saudi Riyal (SAR)', flag: '🇸🇦' },
    { value: 'TRY', label: 'Turkish Lira (TRY)', flag: '🇹🇷' },
    { value: 'RUB', label: 'Russian Ruble (RUB)', flag: '🇷🇺' },
    { value: 'KRW', label: 'South Korean Won (KRW)', flag: '🇰🇷' },
    { value: 'SGD', label: 'Singapore Dollar (SGD)', flag: '🇸🇬' },
    { value: 'MYR', label: 'Malaysian Ringgit (MYR)', flag: '🇲🇾' },
    { value: 'THB', label: 'Thai Baht (THB)', flag: '🇹🇭' },
    { value: 'VND', label: 'Vietnamese Dong (VND)', flag: '🇻🇳' },
    { value: 'IDR', label: 'Indonesian Rupiah (IDR)', flag: '🇮🇩' },
    { value: 'PHP', label: 'Philippine Peso (PHP)', flag: '🇵🇭' }
  ];

  // Map of countries to their default currencies
  const countryCurrencyMap: { [key: string]: string } = {
    TZ: 'TZS', // Tanzania
    AE: 'AED', // UAE
    CN: 'CNY', // China
    US: 'USD', // United States
    CA: 'CAD', // Canada
    UK: 'GBP', // United Kingdom
    DE: 'EUR', // Germany
    FR: 'EUR', // France
    JP: 'JPY', // Japan
    IN: 'INR', // India
    BR: 'BRL', // Brazil
    AU: 'AUD', // Australia
    KE: 'KES', // Kenya
    UG: 'UGX', // Uganda
    RW: 'RWF', // Rwanda
    ET: 'ETB', // Ethiopia
    NG: 'NGN', // Nigeria
    ZA: 'ZAR', // South Africa
    EG: 'EGP', // Egypt
    SA: 'SAR', // Saudi Arabia
    TR: 'TRY', // Turkey
    RU: 'RUB', // Russia
    KR: 'KRW', // South Korea
    SG: 'SGD', // Singapore
    MY: 'MYR', // Malaysia
    TH: 'THB', // Thailand
    VN: 'VND', // Vietnam
    ID: 'IDR', // Indonesia
    PH: 'PHP'  // Philippines
  };

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
                  onChange={(value) => {
                    field.onChange(value);
                    // Auto-set currency based on country
                    if (value && countryCurrencyMap[value]) {
                      setValue('currency', countryCurrencyMap[value]);
                    }
                  }}
                  options={countryOptions.map(country => ({
                    value: country.value,
                    label: `${country.flag} ${country.label}`
                  }))}
                  error={errors.country?.message}
                  helperText="Select the supplier's country (currency will be auto-selected)"
                />
              )}
            />

            {/* Currency */}
            <Controller
              name="currency"
              control={control}
              render={({ field }) => (
                <GlassSelect
                  label="Currency"
                  placeholder="Select currency"
                  value={field.value}
                  onChange={field.onChange}
                  options={currencyOptions.map(currency => ({
                    value: currency.value,
                    label: `${currency.flag} ${currency.label}`
                  }))}
                  error={errors.currency?.message}
                  helperText="Currency for transactions (auto-selected based on country)"
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

        {/* Currency Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-lats-text">Currency Information</h3>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Currency Auto-Selection</p>
                <p>
                  The currency is automatically selected based on the supplier's country. 
                  You can manually change it if needed for specific business requirements.
                </p>
              </div>
            </div>
          </div>

          {/* Currency Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg border">
              <label className="block text-sm font-medium text-gray-700 mb-2">Selected Currency</label>
              <div className="flex items-center gap-2">
                {watch('currency') && (
                  <span className="text-2xl">
                    {currencyOptions.find(c => c.value === watch('currency'))?.flag || '💱'}
                  </span>
                )}
                <span className="text-lg font-semibold text-gray-900">
                  {watch('currency') || 'Not selected'}
                </span>
                {watch('currency') && (
                  <span className="text-sm text-gray-500">
                    ({currencyOptions.find(c => c.value === watch('currency'))?.label.split('(')[1]?.replace(')', '')})
                  </span>
                )}
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border">
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <div className="flex items-center gap-2">
                {watch('country') && (
                  <span className="text-2xl">
                    {countryOptions.find(c => c.value === watch('country'))?.flag || '🌍'}
                  </span>
                )}
                <span className="text-lg font-semibold text-gray-900">
                  {watch('country') ? countryOptions.find(c => c.value === watch('country'))?.label : 'Not selected'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-lats-text">Additional Information</h3>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <Controller
              name="notes"
              control={control}
              render={({ field }) => (
                <GlassInput
                  placeholder="Enter additional notes about this supplier"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.notes?.message}
                  multiline
                  rows={2}
                  maxLength={1000}
                  helperText={`${field.value?.length || 0}/1000 characters`}
                />
              )}
            />
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-lats-text">Status</h3>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <svg className="w-5 h-5 text-green-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-sm text-green-700">
                <p className="font-medium mb-1">New suppliers are automatically active</p>
                <p>
                  All new suppliers are set to active by default. You can change this status if needed.
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Controller
              name="is_active"
              control={control}
              render={({ field }) => (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
                    Active Supplier
                  </label>
                </div>
              )}
            />
            <span className="text-sm text-gray-500">
              {watch('is_active') ? 'This supplier is currently active' : 'This supplier is currently inactive'}
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
