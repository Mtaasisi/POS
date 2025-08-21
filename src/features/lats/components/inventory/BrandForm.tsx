// BrandForm component for LATS module
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { LATS_CLASSES } from '../../tokens';
import { t } from '../../lib/i18n/t';
import { X, Save, Upload, Image } from 'lucide-react';

// Validation schema
const brandFormSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(100, 'Brand name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  logo_url: z.string().max(500, 'Logo URL must be less than 500 characters').optional(),
  website: z.string().url('Invalid website URL').optional().or(z.literal('')),
  contact_email: z.string().email('Invalid email address').optional().or(z.literal('')),
  contact_phone: z.string().max(20, 'Phone number must be less than 20 characters').optional(),
  category: z.string().optional(),
  is_active: z.boolean().default(true)
});

type BrandFormData = z.infer<typeof brandFormSchema>;

interface Brand {
  id: string;
  name: string;
  description?: string;
  logo_url?: string;
  website?: string;
  contact_email?: string;
  contact_phone?: string;
  category?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
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
  const [selectedCategories, setSelectedCategories] = useState<string[]>(brand?.category ? [brand.category] : []);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  // Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
    watch,
    reset,
    setValue
  } = useForm<BrandFormData>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: brand?.name || '',
      description: brand?.description || '',
      logo_url: brand?.logo_url || '',
      website: brand?.website || '',
      contact_email: brand?.contact_email || '',
      contact_phone: brand?.contact_phone || '',
      category: brand?.category || '',
      is_active: brand?.is_active ?? true
    }
  });

  // Watch form values
  const watchedValues = watch();
  const isActive = watchedValues.is_active;

  // Handle form submission
  const handleFormSubmit = async (data: BrandFormData) => {
    try {
      // Set the selected category
      if (selectedCategories.length > 0) {
        data.category = selectedCategories[0];
      }
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

  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategories([category]);
    setValue('category', category);
  };

  // Handle file upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Category options with emojis
  const categoryOptions = [
    { value: 'phone', label: 'Phone', emoji: '📱' },
    { value: 'laptop', label: 'Laptop', emoji: '💻' },
    { value: 'tablet', label: 'Tablet', emoji: '📱' },
    { value: 'desktop', label: 'Desktop', emoji: '🖥️' },
    { value: 'printer', label: 'Printer', emoji: '🖨️' },
    { value: 'smartwatch', label: 'Smartwatch', emoji: '⌚' },
    { value: 'headphones', label: 'Headphones', emoji: '🎧' },
    { value: 'speaker', label: 'Speaker', emoji: '🔊' },
    { value: 'camera', label: 'Camera', emoji: '📷' },
    { value: 'gaming', label: 'Gaming', emoji: '🎮' },
    { value: 'accessories', label: 'Accessories', emoji: '🔧' },
    { value: 'monitor', label: 'Monitor', emoji: '🖥️' },
    { value: 'keyboard', label: 'Keyboard', emoji: '⌨️' },
    { value: 'mouse', label: 'Mouse', emoji: '🖱️' },
    { value: 'router', label: 'Router', emoji: '📡' },
    { value: 'server', label: 'Server', emoji: '🖥️' },
    { value: 'storage', label: 'Storage', emoji: '💾' },
    { value: 'other', label: 'Other', emoji: '📦' }
  ];

  return (
    <div 
      className="
        backdrop-blur-xl rounded-xl 
        border shadow-lg 
        p-4 sm:p-6 transition-all duration-300 
        hover:shadow-xl
        
        w-full max-w-2xl max-h-[90vh] overflow-y-auto
      " 
      style={{
        backgroundColor: 'var(--card-bg, rgba(255, 255, 255, 0.7))', 
        borderColor: 'var(--card-border, rgba(255, 255, 255, 0.3))', 
        boxShadow: 'var(--card-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.1))'
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {brand ? 'Edit Brand' : 'Add New Brand'}
        </h2>
        <button 
          onClick={handleCancel}
          className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Brand Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand Name *
          </label>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter brand name"
                required
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter brand description"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
          {errors.description && (
            <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
          )}
        </div>

        {/* Brand Logo */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand Logo
          </label>
          <div className="border-2 border-dashed rounded-lg p-6 text-center transition-colors border-gray-300 hover:border-blue-400">
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo preview" className="w-12 h-12 object-cover rounded" />
                ) : (
                  <Image className="w-8 h-8 text-gray-400" />
                )}
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-2">
                  Drag and drop an image here, or click to select
                </p>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  id="logo-upload"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer transition-colors"
                >
                  <Upload size={16} />
                  Choose Image
                </label>
              </div>
              <p className="text-xs text-gray-500">
                Supported formats: JPG, PNG, GIF (max 5MB)
              </p>
            </div>
          </div>
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categories *
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {categoryOptions.map((category) => (
              <button
                key={category.value}
                type="button"
                onClick={() => handleCategorySelect(category.value)}
                className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                  selectedCategories.includes(category.value)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span className="text-lg">{category.emoji}</span>
                <span className="text-sm font-medium">{category.label}</span>
              </button>
            ))}
          </div>
          {errors.category && (
            <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
          )}
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-3">
          <Controller
            name="is_active"
            control={control}
            render={({ field }) => (
              <input
                type="checkbox"
                id="is_active"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={field.value}
                onChange={(e) => field.onChange(e.target.checked)}
              />
            )}
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Brand is active
          </label>
        </div>

        {/* Form Actions */}
        <div className="flex items-center gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="
              flex items-center justify-center gap-2 backdrop-blur-md rounded-lg border transition-all duration-300
              bg-gradient-to-r from-blue-500/80 to-indigo-500/80 hover:from-blue-600/90 hover:to-indigo-600/90 text-white border-white/20
              py-2 px-4 text-base
              hover:shadow-lg active:scale-[0.98] focus:ring-2 focus:ring-white/30 hover:border-white/40 backdrop-blur-xl
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            <Save size={16} />
            {loading ? 'Creating...' : 'Create Brand'}
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="
              flex items-center justify-center gap-2 backdrop-blur-md rounded-lg border transition-all duration-300
              bg-gradient-to-r from-purple-500/80 to-pink-500/80 hover:from-purple-600/90 hover:to-pink-600/90 text-white border-white/20
              py-2 px-4 text-base
              hover:shadow-lg active:scale-[0.98] focus:ring-2 focus:ring-white/30 hover:border-white/40 backdrop-blur-xl
            "
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default BrandForm;
