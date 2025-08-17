import React, { useState, useEffect, useRef, useCallback } from 'react';
import GlassCard from '../../../features/shared/components/ui/GlassCard';
import GlassButton from '../../../features/shared/components/ui/GlassButton';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Plus, Edit, Trash2, Search, Filter, X, Save, RotateCcw, Tag, Smartphone, Laptop, Monitor, Headphones, Camera, Gamepad2, Printer, Watch, Speaker, Keyboard, Mouse, Router, Server, HardDrive, Package, Eye, MessageCircle, Users, Star, UserPlus, Store, Upload, Image as ImageIcon, Building, Loader2, BarChart3, TrendingUp, Activity, Zap } from 'lucide-react';
import { 
  Brand, 
  BrandCategory,
  createBrand, 
  updateBrand, 
  hardDeleteBrand
} from '../../../lib/brandApi';
import { useAuth } from '../../../context/AuthContext';
import { useBrands } from '../../../context/BrandsContext';
import { fileUploadService } from '../../../lib/fileUploadService';
import { localBrandStorage } from '../../../lib/localBrandStorage';
import BrandInput from '../../../features/shared/components/ui/BrandInput';

// Brand Form Component (Integrated)
interface BrandFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => Promise<void>;
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
  const [formData, setFormData] = useState<any>({
    name: '',
    description: '',
    logo_url: '',
    category: [],
    is_active: true
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [originalLogoUrl, setOriginalLogoUrl] = useState<string>('');

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
        setOriginalLogoUrl(editingBrand.logo_url);
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
      setOriginalLogoUrl('');
    }
  }, [editingBrand, isOpen]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      if (localBrandStorage.isDevelopment()) {
        const base64Data = await localBrandStorage.fileToBase64(file);
        setLogoPreview(base64Data);
        setFormData(prev => ({ ...prev, logo_url: base64Data }));
        toast.success('Logo uploaded successfully! (Development mode)');
      } else {
        const brandName = editingBrand?.name || formData.name || 'new-brand';
        const brandId = editingBrand?.id || `temp-${Date.now()}`;
        
        const uploadResult = await localBrandStorage.uploadBrandLogo(file, brandName, brandId);
        
        if (uploadResult.success && uploadResult.url) {
          setLogoPreview(uploadResult.url);
          setFormData(prev => ({ ...prev, logo_url: uploadResult.url }));
          toast.success('Logo uploaded successfully! (Hosted locally)');
        } else {
          throw new Error(uploadResult.error || 'Upload failed');
        }
      }
      
      setLogoFile(file);
    } catch (error: any) {
      toast.error(`Failed to upload logo: ${error.message}`);
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
      if (!localBrandStorage.isDevelopment() && editingBrand && originalLogoUrl && formData.logo_url !== originalLogoUrl) {
        const urlParts = originalLogoUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) {
          const oldPath = `brand-logos/${fileName}`;
          await localBrandStorage.deleteBrandLogo(oldPath);
        }
      }

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
                      title="Remove logo"
                    >
                      <X size={12} />
                    </button>
                  </div>
                  <p className="text-sm text-green-600">
                    ✅ Logo uploaded successfully
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



const BrandManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { brands, loading, refreshBrands } = useBrands();
  const navigate = useNavigate();
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [demoBrandValue, setDemoBrandValue] = useState<string>('');

  const categories = [
    { value: 'all', label: 'All Categories', icon: <Tag size={16} /> },
    { value: 'phone', label: 'Phone', icon: <Smartphone size={16} /> },
    { value: 'laptop', label: 'Laptop', icon: <Laptop size={16} /> },
    { value: 'tablet', label: 'Tablet', icon: <Smartphone size={16} /> },
    { value: 'desktop', label: 'Desktop', icon: <Monitor size={16} /> },
    { value: 'printer', label: 'Printer', icon: <Printer size={16} /> },
    { value: 'smartwatch', label: 'Smartwatch', icon: <Watch size={16} /> },
    { value: 'headphones', label: 'Headphones', icon: <Headphones size={16} /> },
    { value: 'speaker', label: 'Speaker', icon: <Speaker size={16} /> },
    { value: 'camera', label: 'Camera', icon: <Camera size={16} /> },
    { value: 'gaming', label: 'Gaming', icon: <Gamepad2 size={16} /> },
    { value: 'accessories', label: 'Accessories', icon: <Tag size={16} /> },
    { value: 'monitor', label: 'Monitor', icon: <Monitor size={16} /> },
    { value: 'keyboard', label: 'Keyboard', icon: <Keyboard size={16} /> },
    { value: 'mouse', label: 'Mouse', icon: <Mouse size={16} /> },
    { value: 'router', label: 'Router', icon: <Router size={16} /> },
    { value: 'server', label: 'Server', icon: <Server size={16} /> },
    { value: 'storage', label: 'Storage', icon: <HardDrive size={16} /> },
    { value: 'other', label: 'Other', icon: <Package size={16} /> }
  ];

  useEffect(() => {
    console.log('BrandManagementPage: Environment info', {
      isDev: import.meta.env.DEV,
      hostname: window.location.hostname,
      url: window.location.href
    });
    
    // Refresh brands when component loads
    refreshBrands();
  }, [refreshBrands]);

  const filterBrands = useCallback(() => {
    let filtered = brands;

    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(brand =>
        brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(brand =>
        brand.category?.includes(selectedCategory)
      );
    }

    setFilteredBrands(filtered);
  }, [brands, searchQuery, selectedCategory]);

  useEffect(() => {
    filterBrands();
  }, [filterBrands]);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    // Filtering is now handled by the filterBrands function
  };

  const handleSubmitBrand = async (brandData: any) => {
    setIsSubmitting(true);
    try {
      if (editingBrand) {
        await updateBrand(editingBrand.id, brandData);
        toast.success('Brand updated successfully!');
      } else {
        await createBrand(brandData);
        toast.success('Brand created successfully!');
      }
      await refreshBrands();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save brand');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBrand = async (brand: Brand) => {
    if (window.confirm(`Are you sure you want to permanently delete ${brand.name}? This action cannot be undone.`)) {
      try {
        await hardDeleteBrand(brand.id);
        toast.success('Brand permanently deleted!');
        await refreshBrands();
      } catch (error: any) {
        toast.error('Failed to delete brand');
      }
    }
  };

  

  const startEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setShowBrandForm(true);
  };

  const handleCloseForm = () => {
    setShowBrandForm(false);
    setEditingBrand(null);
  };

  // Bulk Operations

  const handleBulkDeactivate = async () => {
    if (window.confirm('Are you sure you want to permanently delete all brands? This action cannot be undone.')) {
      try {
        for (const brand of brands) {
          await hardDeleteBrand(brand.id);
        }
        toast.success(`${brands.length} brands permanently deleted!`);
        await refreshBrands();
      } catch (error: any) {
        toast.error('Failed to delete brands: ' + error.message);
      }
    }
  };

  const handleExportBrands = () => {
    try {
      const exportData = brands.map(brand => ({
        name: brand.name,
        description: brand.description,
        category: brand.category,
        is_active: brand.is_active,
        created_at: brand.created_at,
        updated_at: brand.updated_at
      }));

      const csvContent = [
        'Name,Description,Category,Active,Created,Updated',
        ...exportData.map(brand => 
          `"${brand.name}","${brand.description || ''}","${Array.isArray(brand.category) ? brand.category.join(';') : brand.category || ''}","${brand.is_active}","${brand.created_at}","${brand.updated_at}"`
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `brands-export-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Brands exported successfully!');
    } catch (error: any) {
      toast.error('Failed to export brands: ' + error.message);
    }
  };

  const getCategoryColor = (category: string) => {
    const categoryMap: Record<string, string> = {
      phone: 'bg-blue-100 text-blue-800',
      laptop: 'bg-green-100 text-green-800',
      tablet: 'bg-purple-100 text-purple-800',
      desktop: 'bg-orange-100 text-orange-800',
      printer: 'bg-red-100 text-red-800',
      smartwatch: 'bg-indigo-100 text-indigo-800',
      headphones: 'bg-pink-100 text-pink-800',
      speaker: 'bg-yellow-100 text-yellow-800',
      camera: 'bg-teal-100 text-teal-800',
      gaming: 'bg-rose-100 text-rose-800',
      accessories: 'bg-gray-100 text-gray-800',
      monitor: 'bg-cyan-100 text-cyan-800',
      keyboard: 'bg-emerald-100 text-emerald-800',
      mouse: 'bg-violet-100 text-violet-800',
      router: 'bg-amber-100 text-amber-800',
      server: 'bg-slate-100 text-slate-800',
      storage: 'bg-stone-100 text-stone-800',
      other: 'bg-neutral-100 text-neutral-800'
    };
    return categoryMap[category?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getCategoryIcon = (category: string) => {
    const iconMap: Record<string, any> = {
      phone: <Smartphone size={14} />,
      laptop: <Laptop size={14} />,
      tablet: <Smartphone size={14} />,
      desktop: <Monitor size={14} />,
      printer: <Printer size={14} />,
      smartwatch: <Watch size={14} />,
      headphones: <Headphones size={14} />,
      speaker: <Speaker size={14} />,
      camera: <Camera size={14} />,
      gaming: <Gamepad2 size={14} />,
      accessories: <Tag size={14} />,
      monitor: <Monitor size={14} />,
      keyboard: <Keyboard size={14} />,
      mouse: <Mouse size={14} />,
      router: <Router size={14} />,
      server: <Server size={14} />,
      storage: <HardDrive size={14} />,
      other: <Package size={14} />
    };
    return iconMap[category?.toLowerCase()] || <Tag size={14} />;
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <GlassButton
                        onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={20} />
                      Back to Dashboard
        </GlassButton>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brand Management</h1>
          <p className="text-gray-600">Manage product brands and their logos</p>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <GlassCard className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-blue-600" />
            <div className="text-2xl font-bold text-blue-600">{brands.filter(b => b.is_active).length}</div>
          </div>
          <div className="text-sm text-gray-600">Active Brands</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Trash2 className="w-5 h-5 text-orange-600" />
            <div className="text-2xl font-bold text-orange-600">{brands.filter(b => !b.is_active).length}</div>
          </div>
          <div className="text-sm text-gray-600">Deleted Brands</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <ImageIcon className="w-5 h-5 text-green-600" />
            <div className="text-2xl font-bold text-green-600">{brands.filter(b => b.logo_url).length}</div>
          </div>
          <div className="text-sm text-gray-600">With Logos</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Tag className="w-5 h-5 text-purple-600" />
            <div className="text-2xl font-bold text-purple-600">{new Set(brands.flatMap(b => b.category || [])).size}</div>
          </div>
          <div className="text-sm text-gray-600">Categories</div>
        </GlassCard>
      </div>

      {/* Brand Analytics Section */}
      <GlassCard className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Brand Analytics</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">
              {brands.filter(b => b.category?.includes('phone')).length}
            </div>
            <div className="text-sm text-gray-600">Phone Brands</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">
              {brands.filter(b => b.category?.includes('laptop')).length}
            </div>
            <div className="text-sm text-gray-600">Laptop Brands</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">
              {brands.filter(b => b.category?.includes('accessories')).length}
            </div>
            <div className="text-sm text-gray-600">Accessory Brands</div>
          </div>
        </div>
      </GlassCard>



      {/* Controls */}
      <GlassCard className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search brands by name or description..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <GlassButton
              onClick={() => setShowBrandForm(true)}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Add Brand
            </GlassButton>
          </div>
        </div>
      </GlassCard>

      {/* Bulk Operations */}
      <GlassCard className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-orange-600" />
          <h3 className="text-lg font-semibold text-gray-900">Bulk Operations</h3>
        </div>
        <div className="flex flex-wrap gap-3">
          <GlassButton
            onClick={() => handleBulkDeactivate()}
            variant="danger"
            className="flex items-center gap-2"
          >
            <Trash2 size={16} />
            Delete All
          </GlassButton>
          <GlassButton
            onClick={() => handleExportBrands()}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <TrendingUp size={16} />
            Export Brands
          </GlassButton>
        </div>
      </GlassCard>

      {/* Brand Input Demo */}
      <GlassCard className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Store className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Brand Input Demo</h3>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Try the new grid-style brand input:
            </label>
            <BrandInput
              value={demoBrandValue}
              onChange={setDemoBrandValue}
              placeholder="Click to see brands in grid layout..."
              className="max-w-md"
            />
          </div>
          {demoBrandValue && (
            <div className="text-sm text-gray-600">
              Selected brand: <span className="font-medium">{demoBrandValue}</span>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Brands Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredBrands.length === 0 ? (
        <GlassCard className="text-center py-12">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No brands found</h3>
          <p className="text-gray-600 mb-4">
            {searchQuery || selectedCategory !== 'all' 
              ? 'Try adjusting your search or filters' 
              : 'Get started by creating your first brand'
            }
          </p>
          {!searchQuery && selectedCategory === 'all' && (
            <GlassButton
              onClick={() => setShowBrandForm(true)}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Create First Brand
            </GlassButton>
          )}
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredBrands.map(brand => (
            <GlassCard key={brand.id} className="relative group">
              {/* Brand Logo */}
              <div className="flex items-center justify-center h-32 mb-4 bg-gray-50 rounded-lg">
                {brand.logo_url ? (
                  <img
                    src={brand.logo_url}
                    alt={`${brand.name} logo`}
                    className="max-w-full max-h-full object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      target.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                ) : null}
                <div className={`text-4xl font-bold text-gray-400 ${brand.logo_url ? 'hidden' : ''}`}>
                  {brand.name.charAt(0)}
                </div>
              </div>

              {/* Brand Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900 text-lg">{brand.name}</h3>

                </div>

                {brand.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{brand.description}</p>
                )}

                {/* Categories */}
                <div className="flex flex-wrap gap-1">
                  {(() => {
                    // Handle both category and categories fields for backward compatibility
                    const categories = Array.isArray(brand.category) ? brand.category : 
                                    Array.isArray(brand.categories) ? brand.categories :
                                    brand.category ? [brand.category] :
                                    brand.categories ? [brand.categories] : [];
                    
                    return categories.map((cat, index) => (
                      <span
                        key={index}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(cat)}`}
                      >
                        {getCategoryIcon(cat)}
                        {cat}
                      </span>
                    ));
                  })()}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span>Created: {new Date(brand.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(brand)}
                      className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Edit Brand"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteBrand(brand)}
                      className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete Brand"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      )}

      {/* Brand Form Modal */}
      <BrandForm
        isOpen={showBrandForm}
        onClose={handleCloseForm}
        onSubmit={handleSubmitBrand}
        editingBrand={editingBrand}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default BrandManagementPage; 