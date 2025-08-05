import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Tag, Building, Save, Loader2 } from 'lucide-react';
import { Brand, CreateBrandData, UpdateBrandData } from '../../lib/brandApi';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { toast } from 'react-hot-toast';

interface BrandFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateBrandData | UpdateBrandData) => Promise<void>;
  editingBrand?: Brand | null;
  isLoading?: boolean;
}

const BrandForm: React.FC<BrandFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingBrand,
  isLoading = false
}) => {
  const [formData, setFormData] = useState<CreateBrandData>({
    name: '',
    description: '',
    logo_url: '',
    category: [],
    is_active: true
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  const categoryOptions = [
    { value: 'phone', label: 'Phone', icon: '📱' },
    { value: 'laptop', label: 'Laptop', icon: '💻' },
    { value: 'tablet', label: 'Tablet', icon: '📱' },
    { value: 'desktop', label: 'Desktop', icon: '🖥️' },
    { value: 'printer', label: 'Printer', icon: '🖨️' },
    { value: 'smartwatch', label: 'Smartwatch', icon: '⌚' },
    { value: 'headphones', label: 'Headphones', icon: '🎧' },
    { value: 'speaker', label: 'Speaker', icon: '🔊' },
    { value: 'camera', label: 'Camera', icon: '📷' },
    { value: 'gaming', label: 'Gaming', icon: '🎮' },
    { value: 'accessories', label: 'Accessories', icon: '🔧' },
    { value: 'monitor', label: 'Monitor', icon: '🖥️' },
    { value: 'keyboard', label: 'Keyboard', icon: '⌨️' },
    { value: 'mouse', label: 'Mouse', icon: '🖱️' },
    { value: 'router', label: 'Router', icon: '📡' },
    { value: 'server', label: 'Server', icon: '🖥️' },
    { value: 'storage', label: 'Storage', icon: '💾' },
    { value: 'other', label: 'Other', icon: '📦' }
  ];

  useEffect(() => {
    if (editingBrand) {
      setFormData({
        name: editingBrand.name,
        description: editingBrand.description || '',
        logo_url: editingBrand.logo_url || '',
        category: Array.isArray(editingBrand.category) ? editingBrand.category :
                 Array.isArray(editingBrand.categories) ? editingBrand.categories :
                 editingBrand.category ? [editingBrand.category] :
                 editingBrand.categories ? [editingBrand.categories] : [],
        is_active: editingBrand.is_active
      });
      if (editingBrand.logo_url) {
        setLogoPreview(editingBrand.logo_url);
      }
    } else {
      setFormData({
        name: '',
        description: '',
        logo_url: '',
        category: [],
        is_active: true
      });
      setLogoPreview('');
      setLogoFile(null);
    }
  }, [editingBrand, isOpen]);

  const handleInputChange = (field: keyof CreateBrandData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Create a preview and save as base64 for immediate use
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Data = e.target?.result as string;
        setLogoPreview(base64Data);
        
        // Save the base64 data as the logo_url for immediate use
        setFormData(prev => ({ 
          ...prev, 
          logo_url: base64Data 
        }));
      };
      reader.readAsDataURL(file);
      
      setLogoFile(file);
      toast.success('Logo uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      handleLogoUpload(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Brand name is required');
      return;
    }

    if (formData.category.length === 0) {
      toast.error('Please select at least one category');
      return;
    }

    try {
      await onSubmit(formData);
      onClose();
    } catch (error) {
      // Error is handled by the parent component
    }
  };

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      category: prev.category.includes(category)
        ? prev.category.filter(c => c !== category)
        : [...prev.category, category]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingBrand ? 'Edit Brand' : 'Add New Brand'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Brand Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter brand name"
              required
            />
          </div>

          {/* Brand Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter brand description"
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Logo
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                logoPreview ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-blue-400'
              }`}
              onDrop={handleFileDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              {logoPreview ? (
                <div className="space-y-4">
                  <div className="relative inline-block">
                    <img
                      src={logoPreview}
                      alt="Brand logo preview"
                      className="max-w-full max-h-32 object-contain rounded"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview('');
                        setLogoFile(null);
                        setFormData(prev => ({ ...prev, logo_url: '' }));
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <p className="text-sm text-green-600">
                    ✅ Logo uploaded (will be saved locally for Hostinger upload)
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    {isUploading ? (
                      <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Drag and drop an image here, or click to select
                    </p>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                      id="logo-upload"
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
              )}
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categories *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {categoryOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => toggleCategory(option.value)}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-colors ${
                    formData.category.includes(option.value)
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span className="text-lg">{option.icon}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
            {formData.category.length > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Selected: {formData.category.join(', ')}
              </p>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="is_active"
              checked={formData.is_active}
              onChange={(e) => handleInputChange('is_active', e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
              Brand is active
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex items-center gap-3 pt-4">
            <GlassButton
              type="submit"
              disabled={isLoading || isUploading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Save size={16} />
              )}
              {editingBrand ? 'Update Brand' : 'Create Brand'}
            </GlassButton>
            <GlassButton
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default BrandForm; 