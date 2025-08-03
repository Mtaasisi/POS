import React, { useState, useEffect } from 'react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Plus, Edit, Trash2, X, Search, Filter, Store, Tag, RotateCcw, Save } from 'lucide-react';
import { BrandCategory } from '../lib/brandApi';
import { 
  getCategories, 
  getActiveCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory, 
  restoreCategory,
  Category,
  CreateCategoryData,
  UpdateCategoryData
} from '../lib/categoryApi';
import { 
  getBrands, 
  getActiveBrands, 
  createBrand, 
  updateBrand, 
  deleteBrand, 
  restoreBrand,
  Brand,
  CreateBrandData,
  UpdateBrandData
} from '../lib/brandApi';
import BrandSuggestionInput from '../components/ui/BrandSuggestionInput';
import Modal from '../components/ui/Modal';

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
}

interface BrandFormData {
  name: string;
  description: string;
  logo_url?: string;
  category: BrandCategory;
}

const CategoryManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeletedCategories, setShowDeletedCategories] = useState(false);

  // Brand-related state
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [brandLoading, setBrandLoading] = useState(true);
  const [brandError, setBrandError] = useState('');
  const [brandSuccess, setBrandSuccess] = useState('');
  const [brandSearchQuery, setBrandSearchQuery] = useState('');
  const [showAddBrandModal, setShowAddBrandModal] = useState(false);
  const [showEditBrandModal, setShowEditBrandModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isSubmittingBrand, setIsSubmittingBrand] = useState(false);
  const [showDeletedBrands, setShowDeletedBrands] = useState(false);
  const [activeTab, setActiveTab] = useState<'categories' | 'brands'>('categories');

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: '#3B82F6' // Default blue color
  });

  const [brandFormData, setBrandFormData] = useState<BrandFormData>({
    name: '',
    description: '',
    logo_url: '',
    category: 'phone'
  });

  // Color options for category selection
  const colorOptions = [
    { value: '#3B82F6', label: 'Blue' },
    { value: '#10B981', label: 'Green' },
    { value: '#8B5CF6', label: 'Purple' },
    { value: '#F59E0B', label: 'Orange' },
    { value: '#EF4444', label: 'Red' },
    { value: '#EC4899', label: 'Pink' },
    { value: '#6366F1', label: 'Indigo' },
    { value: '#EAB308', label: 'Yellow' },
    { value: '#14B8A6', label: 'Teal' },
    { value: '#06B6D4', label: 'Cyan' },
    { value: '#F97316', label: 'Amber' },
    { value: '#059669', label: 'Emerald' },
    { value: '#7C3AED', label: 'Violet' },
    { value: '#475569', label: 'Slate' },
    { value: '#E11D48', label: 'Rose' },
    { value: '#0EA5E9', label: 'Sky' },
    { value: '#84CC16', label: 'Lime' },
    { value: '#F43F5E', label: 'Rose' },
    { value: '#8B5CF6', label: 'Violet' },
    { value: '#06B6D4', label: 'Cyan' }
  ];

  // Category options for brand selection
  const categoryOptions = [
    { value: 'phone', label: 'Phone' },
    { value: 'laptop', label: 'Laptop' },
    { value: 'tablet', label: 'Tablet' },
    { value: 'desktop', label: 'Desktop' },
    { value: 'printer', label: 'Printer' },
    { value: 'smartwatch', label: 'Smartwatch' },
    { value: 'headphones', label: 'Headphones' },
    { value: 'speaker', label: 'Speaker' },
    { value: 'camera', label: 'Camera' },
    { value: 'gaming', label: 'Gaming' },
    { value: 'accessories', label: 'Accessories' },
    { value: 'monitor', label: 'Monitor' },
    { value: 'keyboard', label: 'Keyboard' },
    { value: 'mouse', label: 'Mouse' },
    { value: 'webcam', label: 'Webcam' },
    { value: 'microphone', label: 'Microphone' },
    { value: 'router', label: 'Router' },
    { value: 'modem', label: 'Modem' },
    { value: 'scanner', label: 'Scanner' },
    { value: 'projector', label: 'Projector' },
    { value: 'server', label: 'Server' },
    { value: 'network', label: 'Network' },
    { value: 'storage', label: 'Storage' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    fetchCategories();
  }, [showDeletedCategories]);

  // Brand fetching effect
  useEffect(() => {
    fetchBrands();
  }, [showDeletedBrands]);

  // Handle escape key to close edit modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showEditModal) {
        cancelEdit();
      }
      if (e.key === 'Escape' && showEditBrandModal) {
        cancelEditBrand();
      }
    };

    if (showEditModal || showEditBrandModal) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showEditModal, showEditBrandModal]);

  useEffect(() => {
    filterCategories();
  }, [categories, searchQuery]);

  useEffect(() => {
    filterBrands();
  }, [brands, brandSearchQuery]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError('');
      
      const fetchedCategories = showDeletedCategories 
        ? await getCategories()
        : await getActiveCategories();
      
      setCategories(fetchedCategories);
      setFilteredCategories(fetchedCategories);
    } catch (error) {
      setError('Failed to fetch categories');
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterCategories = () => {
    let filtered = categories;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(category =>
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredCategories(filtered);
  };

  const filterBrands = () => {
    let filtered = brands;

    // Filter by search query
    if (brandSearchQuery) {
      filtered = filtered.filter(brand =>
        brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase()) ||
        brand.description?.toLowerCase().includes(brandSearchQuery.toLowerCase())
      );
    }

    setFilteredBrands(filtered);
  };

  const fetchBrands = async () => {
    try {
      setBrandLoading(true);
      setBrandError('');
      
      const fetchedBrands = showDeletedBrands 
        ? await getBrands()
        : await getActiveBrands();
      
      setBrands(fetchedBrands);
      setFilteredBrands(fetchedBrands);
    } catch (error) {
      setBrandError('Failed to fetch brands');
      console.error('Error fetching brands:', error);
    } finally {
      setBrandLoading(false);
    }
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleBrandSearch = (query: string) => {
    setBrandSearchQuery(query);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      
      const categoryData: CreateCategoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color
      };

      const newCategory = await createCategory(categoryData);
      
      setCategories(prev => [newCategory, ...prev]);
      setFilteredCategories(prev => [newCategory, ...prev]);
      
      setSuccess('Category created successfully');
      setShowAddModal(false);
      resetForm();
    } catch (error: any) {
      setError(error.message || 'Failed to create category');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      setIsSubmitting(true);
      setError('');
      
      const categoryData: UpdateCategoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color
      };
      
      const updatedCategory = await updateCategory(editingCategory.id, categoryData);
      
      setCategories(prev => prev.map(cat => 
        cat.id === editingCategory.id ? updatedCategory : cat
      ));
      setFilteredCategories(prev => prev.map(cat => 
        cat.id === editingCategory.id ? updatedCategory : cat
      ));
      
      setSuccess('Category updated successfully');
      setEditingCategory(null);
      setShowEditModal(false);
      resetForm();
    } catch (error: any) {
      setError(error.message || 'Failed to update category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return;

    try {
      setError('');
      
      await deleteCategory(category.id);
      
      // Update local state
      setCategories(prev => prev.map(cat => 
        cat.id === category.id 
          ? { ...cat, is_active: false, updated_at: new Date().toISOString() }
          : cat
      ));
      setFilteredCategories(prev => prev.map(cat => 
        cat.id === category.id 
          ? { ...cat, is_active: false, updated_at: new Date().toISOString() }
          : cat
      ));
      
      setSuccess('Category deleted successfully');
    } catch (error: any) {
      setError(error.message || 'Failed to delete category');
    }
  };

  const handleRestoreCategory = async (category: Category) => {
    try {
      setError('');
      
      await restoreCategory(category.id);
      
      // Update local state
      setCategories(prev => prev.map(cat => 
        cat.id === category.id 
          ? { ...cat, is_active: true, updated_at: new Date().toISOString() }
          : cat
      ));
      setFilteredCategories(prev => prev.map(cat => 
        cat.id === category.id 
          ? { ...cat, is_active: true, updated_at: new Date().toISOString() }
          : cat
      ));
      
      setSuccess('Category restored successfully');
    } catch (error: any) {
      setError(error.message || 'Failed to restore category');
    }
  };

  // Brand management functions
  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setBrandError('');
      
      const brandData: CreateBrandData = {
        name: brandFormData.name.trim(),
        description: brandFormData.description.trim(),
        logo_url: brandFormData.logo_url || undefined,
        category: brandFormData.category
      };

      const newBrand = await createBrand(brandData);
      
      setBrands(prev => [newBrand, ...prev]);
      setFilteredBrands(prev => [newBrand, ...prev]);
      
      setBrandSuccess('Brand created successfully');
      setShowAddBrandModal(false);
      resetBrandForm();
    } catch (error: any) {
      setBrandError(error.message || 'Failed to create brand');
    }
  };

  const handleUpdateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;

    try {
      setIsSubmittingBrand(true);
      setBrandError('');
      
      const brandData: UpdateBrandData = {
        name: brandFormData.name.trim(),
        description: brandFormData.description.trim(),
        logo_url: brandFormData.logo_url || undefined,
        category: brandFormData.category
      };
      
      const updatedBrand = await updateBrand(editingBrand.id, brandData);
      
      setBrands(prev => prev.map(brand => 
        brand.id === editingBrand.id ? updatedBrand : brand
      ));
      setFilteredBrands(prev => prev.map(brand => 
        brand.id === editingBrand.id ? updatedBrand : brand
      ));
      
      setBrandSuccess('Brand updated successfully');
      setEditingBrand(null);
      setShowEditBrandModal(false);
      resetBrandForm();
    } catch (error: any) {
      setBrandError(error.message || 'Failed to update brand');
    } finally {
      setIsSubmittingBrand(false);
    }
  };

  const handleDeleteBrand = async (brand: Brand) => {
    if (!confirm(`Are you sure you want to delete "${brand.name}"?`)) return;

    try {
      setBrandError('');
      
      await deleteBrand(brand.id);
      
      // Update local state
      setBrands(prev => prev.map(b => 
        b.id === brand.id 
          ? { ...b, is_active: false, updated_at: new Date().toISOString() }
          : b
      ));
      setFilteredBrands(prev => prev.map(b => 
        b.id === brand.id 
          ? { ...b, is_active: false, updated_at: new Date().toISOString() }
          : b
      ));
      
      setBrandSuccess('Brand deleted successfully');
    } catch (error: any) {
      setBrandError(error.message || 'Failed to delete brand');
    }
  };

  const handleRestoreBrand = async (brand: Brand) => {
    try {
      setBrandError('');
      
      await restoreBrand(brand.id);
      
      // Update local state
      setBrands(prev => prev.map(b => 
        b.id === brand.id 
          ? { ...b, is_active: true, updated_at: new Date().toISOString() }
          : b
      ));
      setFilteredBrands(prev => prev.map(b => 
        b.id === brand.id 
          ? { ...b, is_active: true, updated_at: new Date().toISOString() }
          : b
      ));
      
      setBrandSuccess('Brand restored successfully');
    } catch (error: any) {
      setBrandError(error.message || 'Failed to restore brand');
    }
  };

  const startEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setBrandFormData({
      name: brand.name,
      description: brand.description || '',
      logo_url: brand.logo_url || '',
      category: brand.category?.[0] || 'phone'
    });
    setShowEditBrandModal(true);
  };

  const startEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3B82F6'
    });
    setShowEditModal(true);
  };

  const cancelEdit = () => {
    setEditingCategory(null);
    setShowEditModal(false);
    resetForm();
  };

  const cancelEditBrand = () => {
    setEditingBrand(null);
    setShowEditBrandModal(false);
    resetBrandForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6'
    });
  };

  const resetBrandForm = () => {
    setBrandFormData({
      name: '',
      description: '',
      logo_url: '',
      category: 'phone'
    });
  };

  const getCategoryColorClasses = (color: string) => {
    const colorMap: Record<string, string> = {
      '#3B82F6': 'bg-blue-100 text-blue-800',
      '#10B981': 'bg-green-100 text-green-800',
      '#8B5CF6': 'bg-purple-100 text-purple-800',
      '#F59E0B': 'bg-orange-100 text-orange-800',
      '#EF4444': 'bg-red-100 text-red-800',
      '#EC4899': 'bg-pink-100 text-pink-800',
      '#6366F1': 'bg-indigo-100 text-indigo-800',
      '#EAB308': 'bg-yellow-100 text-yellow-800',
      '#14B8A6': 'bg-teal-100 text-teal-800',
      '#06B6D4': 'bg-cyan-100 text-cyan-800',
      '#F97316': 'bg-amber-100 text-amber-800',
      '#059669': 'bg-emerald-100 text-emerald-800',
      '#7C3AED': 'bg-violet-100 text-violet-800',
      '#475569': 'bg-slate-100 text-slate-800',
      '#E11D48': 'bg-rose-100 text-rose-800',
      '#0284C7': 'bg-sky-100 text-sky-800',
      '#84CC16': 'bg-lime-100 text-lime-800',
      '#C026D3': 'bg-fuchsia-100 text-fuchsia-800',
      '#EA580C': 'bg-orange-100 text-orange-800',
      '#4F46E5': 'bg-indigo-100 text-indigo-800',
      '#6B7280': 'bg-gray-100 text-gray-800'
    };
    return colorMap[color] || colorMap['#6B7280'];
  };

  if (loading || brandLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.history.back()}
              className="p-2 rounded-lg bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Inventory Management</h1>
              <p className="text-gray-600">Manage device categories and brands used in the system</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={activeTab === 'categories' ? showDeletedCategories : showDeletedBrands}
                onChange={(e) => {
                  if (activeTab === 'categories') {
                    setShowDeletedCategories(e.target.checked);
                  } else {
                    setShowDeletedBrands(e.target.checked);
                  }
                }}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show deleted {activeTab === 'categories' ? 'categories' : 'brands'}</span>
            </label>
            <button
              onClick={() => {
                if (activeTab === 'categories') {
                  setShowAddModal(true);
                } else {
                  setShowAddBrandModal(true);
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Add {activeTab === 'categories' ? 'Category' : 'Brand'}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-1 mb-6">
          <div className="flex">
            <button
              onClick={() => setActiveTab('categories')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'categories'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              Categories ({filteredCategories.length})
            </button>
            <button
              onClick={() => setActiveTab('brands')}
              className={`flex-1 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
                activeTab === 'brands'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              Brands ({filteredBrands.length})
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg">
            {success}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search categories..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Add Form */}
                 {showAddModal && (
           <Modal
             isOpen={showAddModal}
             onClose={() => setShowAddModal(false)}
             title="Add New Category"
             actions={
               <div className="flex gap-2">
                 <button
                   type="button"
                   onClick={handleAddCategory}
                   disabled={isSubmitting}
                   className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                     isSubmitting 
                       ? 'bg-gray-400 text-white cursor-not-allowed' 
                       : 'bg-blue-600 text-white hover:bg-blue-700'
                   }`}
                 >
                   {isSubmitting ? (
                     <>
                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                       <span>Creating...</span>
                     </>
                   ) : (
                     <>
                       <Save size={20} />
                       <span>Add Category</span>
                     </>
                   )}
                 </button>
                 <button
                   type="button"
                   onClick={() => setShowAddModal(false)}
                   disabled={isSubmitting}
                   className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   Cancel
                 </button>
               </div>
             }
           >
             <form onSubmit={(e) => { e.preventDefault(); handleAddCategory(e); }} className="space-y-4">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                   <input
                     type="text"
                     value={formData.name}
                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                     className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                     placeholder="Enter category name"
                     required
                   />
                 </div>
                 <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                   <select
                     value={formData.color}
                     onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                     className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                   >
                     {colorOptions.map(color => (
                       <option key={color.value} value={color.value}>
                         {color.label}
                       </option>
                     ))}
                   </select>
                 </div>
               </div>
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                 <textarea
                   value={formData.description}
                   onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                   className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                   placeholder="Enter category description"
                   rows={3}
                 />
               </div>
             </form>
           </Modal>
         )}

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories.map((category) => (
            <GlassCard
              key={category.id}
              className={`p-6 shadow-sm hover:shadow-md transition-all duration-200 ${
                !category.is_active ? 'opacity-60 border-2 border-red-200' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-2">{category.name}</h3>
                  <div className="flex items-center gap-2 mb-2">
                    <span 
                      className={`inline-block px-3 py-1 text-sm rounded-full ${getCategoryColorClasses(category.color)}`}
                      style={{ backgroundColor: category.color + '20', color: category.color }}
                    >
                      {category.name}
                    </span>
                    {!category.is_active && (
                      <span className="inline-block px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                        Deleted
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
                  {category.is_active ? (
                    <>
                      <button
                        onClick={() => startEdit(category)}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                        title="Edit category"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Delete category"
                      >
                        <Trash2 size={16} />
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => handleRestoreCategory(category)}
                      className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                      title="Restore category"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                        <path d="M21 3v5h-5"/>
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                        <path d="M3 21v-5h5"/>
                      </svg>
                    </button>
                  )}
                </div>
              </div>
              {category.description && (
                <p className="text-sm text-gray-600 mb-3">{category.description}</p>
              )}
              <div className="text-xs text-gray-500">
                Created: {new Date(category.created_at).toLocaleDateString()}
              </div>
            </GlassCard>
          ))}
        </div>

        {filteredCategories.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No categories found</div>
            <p className="text-gray-400 mt-2">
              {searchQuery 
                ? 'Try adjusting your search'
                : 'Add your first category to get started'
              }
            </p>
          </div>
        )}

        {/* Brand Management Section */}
        {activeTab === 'brands' && (
          <>
            {/* Brand Filters */}
            <div className="bg-white/70 backdrop-blur-sm rounded-lg p-4 mb-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Search brands..."
                      value={brandSearchQuery}
                      onChange={(e) => handleBrandSearch(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Add Brand Form */}
            {showAddBrandModal && (
              <Modal
                isOpen={showAddBrandModal}
                onClose={() => setShowAddBrandModal(false)}
                title="Add New Brand"
                actions={
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAddBrand}
                      disabled={isSubmittingBrand}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        isSubmittingBrand 
                          ? 'bg-gray-400 text-white cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isSubmittingBrand ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          <Save size={20} />
                          <span>Add Brand</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddBrandModal(false)}
                      disabled={isSubmittingBrand}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                }
              >
                <form onSubmit={(e) => { e.preventDefault(); handleAddBrand(e); }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
                      <input
                        type="text"
                        value={brandFormData.name}
                        onChange={(e) => setBrandFormData({ ...brandFormData, name: e.target.value })}
                        className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter brand name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={brandFormData.category}
                        onChange={(e) => setBrandFormData({ ...brandFormData, category: e.target.value as BrandCategory })}
                        className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      >
                        {categoryOptions.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (optional)</label>
                    <input
                      type="url"
                      value={brandFormData.logo_url}
                      onChange={(e) => setBrandFormData({ ...brandFormData, logo_url: e.target.value })}
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter logo URL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={brandFormData.description}
                      onChange={(e) => setBrandFormData({ ...brandFormData, description: e.target.value })}
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter brand description"
                      rows={3}
                    />
                  </div>
                </form>
              </Modal>
            )}

            {/* Brands Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredBrands.map((brand) => (
                <GlassCard
                  key={brand.id}
                  className={`p-6 shadow-sm hover:shadow-md transition-all duration-200 ${
                    !brand.is_active ? 'opacity-60 border-2 border-red-200' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {brand.logo_url && (
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="w-8 h-8 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        )}
                        <h3 className="font-semibold text-gray-900">{brand.name}</h3>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">
                          {brand.category?.[0] || 'other'}
                        </span>
                        {!brand.is_active && (
                          <span className="inline-block px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                            Deleted
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {brand.is_active ? (
                        <>
                          <button
                            onClick={() => startEditBrand(brand)}
                            className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                            title="Edit brand"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            onClick={() => handleDeleteBrand(brand)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete brand"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleRestoreBrand(brand)}
                          className="p-1 text-green-600 hover:bg-green-50 rounded transition-colors"
                          title="Restore brand"
                        >
                          <RotateCcw size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  {brand.description && (
                    <p className="text-sm text-gray-600 mb-3">{brand.description}</p>
                  )}
                  <div className="text-xs text-gray-500">
                    Created: {new Date(brand.created_at).toLocaleDateString()}
                  </div>
                </GlassCard>
              ))}
            </div>

            {filteredBrands.length === 0 && !brandLoading && (
              <div className="text-center py-12">
                <div className="text-gray-500 text-lg">No brands found</div>
                <p className="text-gray-400 mt-2">
                  {brandSearchQuery 
                    ? 'Try adjusting your search'
                    : 'Add your first brand to get started'
                  }
                </p>
              </div>
            )}

            {/* Edit Brand Modal */}
            {showEditBrandModal && editingBrand && (
              <Modal
                isOpen={showEditBrandModal}
                onClose={cancelEditBrand}
                title={`Edit Brand: ${editingBrand.name}`}
                actions={
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleUpdateBrand}
                      disabled={isSubmittingBrand}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                        isSubmittingBrand 
                          ? 'bg-gray-400 text-white cursor-not-allowed' 
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {isSubmittingBrand ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                          <span>Updating...</span>
                        </>
                      ) : (
                        <>
                          <Save size={20} />
                          <span>Update Brand</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditBrand}
                      disabled={isSubmittingBrand}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                }
              >
                <form onSubmit={(e) => { e.preventDefault(); handleUpdateBrand(e); }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
                      <input
                        type="text"
                        value={brandFormData.name}
                        onChange={(e) => setBrandFormData({ ...brandFormData, name: e.target.value })}
                        className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        placeholder="Enter brand name"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select
                        value={brandFormData.category}
                        onChange={(e) => setBrandFormData({ ...brandFormData, category: e.target.value as BrandCategory })}
                        className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      >
                        {categoryOptions.map(category => (
                          <option key={category.value} value={category.value}>
                            {category.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (optional)</label>
                    <input
                      type="url"
                      value={brandFormData.logo_url}
                      onChange={(e) => setBrandFormData({ ...brandFormData, logo_url: e.target.value })}
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter logo URL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={brandFormData.description}
                      onChange={(e) => setBrandFormData({ ...brandFormData, description: e.target.value })}
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter brand description"
                      rows={3}
                    />
                  </div>
                </form>
              </Modal>
            )}
          </>
        )}

        {/* Edit Category Modal */}
        {showEditModal && editingCategory && (
                     <Modal
             isOpen={showEditModal}
             onClose={cancelEdit}
             title={`Edit Category: ${editingCategory.name || ''}`}
             actions={
               <div className="flex gap-2">
                 <button
                   type="button"
                   onClick={handleUpdateCategory}
                   disabled={isSubmitting}
                   className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                     isSubmitting 
                       ? 'bg-gray-400 text-white cursor-not-allowed' 
                       : 'bg-blue-600 text-white hover:bg-blue-700'
                   }`}
                 >
                   {isSubmitting ? (
                     <>
                       <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                       <span>Updating...</span>
                     </>
                   ) : (
                     <>
                       <Save size={20} />
                       <span>Update Category</span>
                     </>
                   )}
                 </button>
                 <button
                   type="button"
                   onClick={cancelEdit}
                   disabled={isSubmitting}
                   className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   Cancel
                 </button>
               </div>
             }
           >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter category name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                <select
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                >
                  {colorOptions.map(color => (
                    <option key={color.value} value={color.value}>
                      {color.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                placeholder="Enter category description"
                rows={3}
              />
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default CategoryManagementPage; 