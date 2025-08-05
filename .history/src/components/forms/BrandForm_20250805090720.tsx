import React, { useState, useRef } from 'react';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import { toast } from 'react-hot-toast';
import { 
  Save, 
  X, 
  Upload, 
  Image, 
  Tag, 
  Smartphone, 
  Laptop, 
  Monitor, 
  Headphones, 
  Camera, 
  Gamepad2, 
  Printer, 
  Watch, 
  Speaker, 
  Keyboard, 
  Mouse, 
  Router, 
  Server, 
  HardDrive, 
  Package,
  Plus,
  Trash2
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { Brand, BrandCategory, CreateBrandData, UpdateBrandData } from '../../lib/brandApi';

interface BrandFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (brandData: CreateBrandData | UpdateBrandData) => Promise<void>;
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
    logo_url: '',
    description: '',
    category: 'phone',
    categories: ['phone']
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = [
    { value: 'phone', label: 'Phone', icon: <Smartphone size={16} />, color: 'text-blue-500' },
    { value: 'laptop', label: 'Laptop', icon: <Laptop size={16} />, color: 'text-green-500' },
    { value: 'tablet', label: 'Tablet', icon: <Smartphone size={16} />, color: 'text-purple-500' },
    { value: 'desktop', label: 'Desktop', icon: <Monitor size={16} />, color: 'text-orange-500' },
    { value: 'printer', label: 'Printer', icon: <Printer size={16} />, color: 'text-red-500' },
    { value: 'smartwatch', label: 'Smartwatch', icon: <Watch size={16} />, color: 'text-indigo-500' },
    { value: 'headphones', label: 'Headphones', icon: <Headphones size={16} />, color: 'text-pink-500' },
    { value: 'speaker', label: 'Speaker', icon: <Speaker size={16} />, color: 'text-yellow-500' },
    { value: 'camera', label: 'Camera', icon: <Camera size={16} />, color: 'text-teal-500' },
    { value: 'gaming', label: 'Gaming', icon: <Gamepad2 size={16} />, color: 'text-rose-500' },
    { value: 'accessories', label: 'Accessories', icon: <Tag size={16} />, color: 'text-gray-500' },
    { value: 'monitor', label: 'Monitor', icon: <Monitor size={16} />, color: 'text-cyan-500' },
    { value: 'keyboard', label: 'Keyboard', icon: <Keyboard size={16} />, color: 'text-emerald-500' },
    { value: 'mouse', label: 'Mouse', icon: <Mouse size={16} />, color: 'text-violet-500' },
    { value: 'router', label: 'Router', icon: <Router size={16} />, color: 'text-amber-500' },
    { value: 'server', label: 'Server', icon: <Server size={16} />, color: 'text-slate-500' },
    { value: 'storage', label: 'Storage', icon: <HardDrive size={16} />, color: 'text-stone-500' },
    { value: 'other', label: 'Other', icon: <Package size={16} />, color: 'text-neutral-500' }
  ];

  // Initialize form when editing
  React.useEffect(() => {
    if (editingBrand) {
      setFormData({
        name: editingBrand.name,
        logo_url: editingBrand.logo_url || '',
        description: editingBrand.description || '',
        category: editingBrand.category?.[0] || 'phone',
        categories: editingBrand.category || ['phone']
      });
      if (editingBrand.logo_url) {
        setLogoPreview(editingBrand.logo_url);
      }
    } else {
      resetForm();
    }
  }, [editingBrand]);

  const resetForm = () => {
    setFormData({
      name: '',
      logo_url: '',
      description: '',
      category: 'phone',
      categories: ['phone']
    });
    setLogoFile(null);
    setLogoPreview('');
  };

  const handleInputChange = (field: keyof CreateBrandData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, SVG, or WebP)');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo file size must be less than 2MB');
      return;
    }

    setIsUploading(true);
    try {
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to Supabase Storage
      const fileName = `brand-logos/${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('brand-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('brand-assets')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      setLogoFile(file);
      toast.success('Logo uploaded successfully!');
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      toast.error('Failed to upload logo. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleLogoUpload(file);
    }
  };

  const removeLogo = () => {
    setLogoFile(null);
    setLogoPreview('');
    setFormData(prev => ({ ...prev, logo_url: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Brand name is required');
      return;
    }

    try {
      await onSubmit(formData);
      resetForm();
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save brand');
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingBrand ? 'Edit Brand' : 'Create New Brand'}
          </h2>
          <button
            onClick={handleClose}
            className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
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
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              placeholder="Enter brand name"
              required
            />
          </div>

          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Brand Logo
            </label>
            
            <div className="space-y-4">
              {/* Logo Preview */}
              {logoPreview && (
                <div className="relative inline-block">
                  <img
                    src={logoPreview}
                    alt="Brand logo preview"
                    className="w-24 h-24 object-contain border-2 border-gray-200 rounded-lg bg-white"
                  />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              )}

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                
                <div className="space-y-3">
                  <div className="flex justify-center">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      {isUploading ? (
                        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <Upload className="w-8 h-8 text-blue-500" />
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {isUploading ? 'Uploading...' : 'Upload Logo'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG, SVG, or WebP (max 2MB)
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Choose File
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Primary Category *
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((category) => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => handleInputChange('category', category.value)}
                  className={`flex items-center gap-3 p-4 rounded-lg border-2 transition-all duration-200 ${
                    formData.category === category.value
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                >
                  <div className={category.color}>
                    {category.icon}
                  </div>
                  <span className="text-sm font-medium text-gray-900">
                    {category.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none"
              placeholder="Enter brand description (optional)"
              rows={3}
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <GlassButton
              type="button"
              onClick={handleClose}
              variant="secondary"
            >
              Cancel
            </GlassButton>
            <GlassButton
              type="submit"
              disabled={isLoading || isUploading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Save size={20} />
              )}
              {isLoading ? 'Saving...' : (editingBrand ? 'Update Brand' : 'Create Brand')}
            </GlassButton>
          </div>
        </form>
      </GlassCard>
    </div>
  );
};

export default BrandForm; 