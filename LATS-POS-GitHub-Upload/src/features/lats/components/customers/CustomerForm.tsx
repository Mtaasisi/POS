// CustomerForm component for LATS module
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LATS_CLASSES } from '../../tokens';
import GlassCard from '../ui/GlassCard';
import GlassInput from '../ui/GlassInput';
import GlassButton from '../ui/GlassButton';
import GlassBadge from '../ui/GlassBadge';
import GlassSelect from '../ui/GlassSelect';
import { t } from '../../lib/i18n/t';

// Validation schema
const customerFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name must be less than 50 characters'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name must be less than 50 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(1, 'Phone number is required').max(20, 'Phone number must be less than 20 characters'),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
  
  // Address information
  address: z.string().max(200, 'Address must be less than 200 characters').optional(),
  city: z.string().max(50, 'City must be less than 50 characters').optional(),
  state: z.string().max(50, 'State must be less than 50 characters').optional(),
  postalCode: z.string().max(20, 'Postal code must be less than 20 characters').optional(),
  country: z.string().max(50, 'Country must be less than 50 characters').optional(),
  
  // Business information
  company: z.string().max(100, 'Company name must be less than 100 characters').optional(),
  jobTitle: z.string().max(100, 'Job title must be less than 100 characters').optional(),
  
  // Preferences
  preferredContactMethod: z.enum(['email', 'phone', 'sms', 'whatsapp']).default('phone'),
  marketingConsent: z.boolean().default(false),
  loyaltyProgram: z.boolean().default(true),
  
  // Notes
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
  
  // Tags
  tags: z.array(z.string()).default([])
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

interface CustomerFormProps {
  initialData?: Partial<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => Promise<void>;
  onCancel?: () => void;
  loading?: boolean;
  mode?: 'create' | 'edit';
  className?: string;
}

const CustomerForm: React.FC<CustomerFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  loading = false,
  mode = 'create',
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [customTag, setCustomTag] = useState('');

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    setValue,
    reset
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: 'prefer_not_to_say',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: '',
      company: '',
      jobTitle: '',
      preferredContactMethod: 'phone',
      marketingConsent: false,
      loyaltyProgram: true,
      notes: '',
      tags: [],
      ...initialData
    }
  });

  // Watch form values
  const watchedValues = watch();
  const currentTags = watchedValues.tags || [];

  // Handle form submission
  const handleFormSubmit = async (data: CustomerFormData) => {
    try {
      await onSubmit(data);
      if (mode === 'create') {
        reset();
      }
    } catch (error) {
      console.error('Customer form submission error:', error);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (isDirty) {
      if (confirm(t('common.confirmDiscard'))) {
        reset();
        onCancel?.();
      }
    } else {
      onCancel?.();
    }
  };

  // Handle tag addition
  const handleAddTag = () => {
    if (customTag.trim() && !currentTags.includes(customTag.trim())) {
      setValue('tags', [...currentTags, customTag.trim()]);
      setCustomTag('');
    }
  };

  // Handle tag removal
  const handleRemoveTag = (tagToRemove: string) => {
    setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  // Handle key press for tag input
  const handleTagKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <GlassCard className={className}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-lats-text">
              {mode === 'create' ? 'Add New Customer' : 'Edit Customer'}
            </h2>
            <p className="text-sm text-lats-text-secondary mt-1">
              {mode === 'create' ? 'Create a new customer profile' : 'Update customer information'}
            </p>
          </div>
          <GlassBadge variant={mode === 'create' ? 'primary' : 'secondary'} size="sm">
            {mode === 'create' ? 'New Customer' : 'Edit Mode'}
          </GlassBadge>
        </div>

        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-lats-text">Basic Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="firstName"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="First Name"
                  placeholder="Enter first name"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.firstName?.message}
                  required
                  maxLength={50}
                />
              )}
            />

            <Controller
              name="lastName"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Last Name"
                  placeholder="Enter last name"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.lastName?.message}
                  required
                  maxLength={50}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="email"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Email Address"
                  placeholder="Enter email address"
                  type="email"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.email?.message}
                  maxLength={100}
                />
              )}
            />

            <Controller
              name="phone"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Phone Number"
                  placeholder="Enter phone number"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.phone?.message}
                  required
                  maxLength={20}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Controller
              name="dateOfBirth"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Date of Birth"
                  placeholder="Select date of birth"
                  type="date"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.dateOfBirth?.message}
                />
              )}
            />

            <Controller
              name="gender"
              control={control}
              render={({ field }) => (
                <GlassSelect
                  label="Gender"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.gender?.message}
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                    { value: 'prefer_not_to_say', label: 'Prefer not to say' }
                  ]}
                />
              )}
            />
          </div>
        </div>

        {/* Address Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-lats-text">Address Information</h3>
          
          <Controller
            name="address"
            control={control}
            render={({ field }) => (
              <GlassInput
                label="Address"
                placeholder="Enter street address"
                value={field.value}
                onChange={field.onChange}
                error={errors.address?.message}
                maxLength={200}
              />
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <Controller
              name="state"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="State/Province"
                  placeholder="Enter state or province"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.state?.message}
                  maxLength={50}
                />
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <GlassInput
                  label="Country"
                  placeholder="Enter country"
                  value={field.value}
                  onChange={field.onChange}
                  error={errors.country?.message}
                  maxLength={50}
                />
              )}
            />
          </div>
        </div>

        {/* Advanced Information */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-lats-text">Additional Information</h3>
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
              {/* Business Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  name="company"
                  control={control}
                  render={({ field }) => (
                    <GlassInput
                      label="Company"
                      placeholder="Enter company name"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.company?.message}
                      maxLength={100}
                    />
                  )}
                />

                <Controller
                  name="jobTitle"
                  control={control}
                  render={({ field }) => (
                    <GlassInput
                      label="Job Title"
                      placeholder="Enter job title"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.jobTitle?.message}
                      maxLength={100}
                    />
                  )}
                />
              </div>

              {/* Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Controller
                  name="preferredContactMethod"
                  control={control}
                  render={({ field }) => (
                    <GlassSelect
                      label="Preferred Contact Method"
                      value={field.value}
                      onChange={field.onChange}
                      error={errors.preferredContactMethod?.message}
                      options={[
                        { value: 'email', label: 'Email' },
                        { value: 'phone', label: 'Phone' },
                        { value: 'sms', label: 'SMS' },
                        { value: 'whatsapp', label: 'WhatsApp' }
                      ]}
                    />
                  )}
                />
              </div>

              {/* Consent and Preferences */}
              <div className="space-y-3">
                <Controller
                  name="marketingConsent"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-4 h-4 text-lats-primary bg-lats-surface border-lats-glass-border rounded focus:ring-lats-primary/50"
                      />
                      <span className="text-sm text-lats-text">
                        I consent to receive marketing communications
                      </span>
                    </label>
                  )}
                />

                <Controller
                  name="loyaltyProgram"
                  control={control}
                  render={({ field }) => (
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={field.value}
                        onChange={field.onChange}
                        className="w-4 h-4 text-lats-primary bg-lats-surface border-lats-glass-border rounded focus:ring-lats-primary/50"
                      />
                      <span className="text-sm text-lats-text">
                        Enroll in loyalty program
                      </span>
                    </label>
                  )}
                />
              </div>

              {/* Tags */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-lats-text">Tags</label>
                <div className="flex items-center gap-2">
                  <GlassInput
                    placeholder="Add a tag"
                    value={customTag}
                    onChange={(e) => setCustomTag(e.target.value)}
                    onKeyPress={handleTagKeyPress}
                    className="flex-1"
                  />
                  <GlassButton
                    type="button"
                    variant="secondary"
                    onClick={handleAddTag}
                    disabled={!customTag.trim()}
                    size="sm"
                  >
                    Add
                  </GlassButton>
                </div>
                
                {currentTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {currentTags.map((tag) => (
                      <GlassBadge
                        key={tag}
                        variant="primary"
                        size="sm"
                        onRemove={() => handleRemoveTag(tag)}
                      >
                        {tag}
                      </GlassBadge>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <Controller
                name="notes"
                control={control}
                render={({ field }) => (
                  <GlassInput
                    label="Notes"
                    placeholder="Additional notes about this customer"
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
          )}
        </div>

        {/* Form Actions */}
        <div className="flex items-center gap-3 pt-6 border-t border-lats-glass-border">
          <GlassButton
            type="submit"
            variant="primary"
            loading={loading}
            disabled={!isDirty}
            className="flex-1 sm:flex-none"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            }
          >
            {loading ? 'Saving...' : mode === 'create' ? 'Create Customer' : 'Update Customer'}
          </GlassButton>
          
          {onCancel && (
            <GlassButton
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </GlassButton>
          )}
        </div>
      </form>
    </GlassCard>
  );
};

// Export with display name for debugging
CustomerForm.displayName = 'CustomerForm';

export default CustomerForm;
