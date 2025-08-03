import React, { useState, useEffect } from 'react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Plus, Edit, Trash2, Search, Filter, X, Save, RotateCcw, Tag, Smartphone, Laptop, Monitor, Headphones, Camera, Gamepad2, Printer, Watch, Speaker, Keyboard, Mouse, Router, Server, HardDrive, Package } from 'lucide-react';
import { 
  Brand, 
  BrandCategory,
  getActiveBrands, 
  getBrands, 
  createBrand, 
  updateBrand, 
  deleteBrand, 
  restoreBrand, 
  searchBrands 
} from '../lib/brandApi';
import { useAuth } from '../context/AuthContext';
import Modal from '../components/ui/Modal';

interface BrandFormData {
  name: string;
  logo_url: string;
  description: string;
  category: BrandCategory;
  categories: BrandCategory[];
}

const BrandManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [showDeletedBrands, setShowDeletedBrands] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<BrandFormData>({
    name: '',
    logo_url: '',
    description: '',
    category: 'phone' as BrandCategory,
    categories: ['phone' as BrandCategory]
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

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
    fetchBrands();
  }, [showDeletedBrands]);

  // Handle escape key to close edit modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showEditModal) {
        cancelEdit();
      }
    };

    if (showEditModal) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showEditModal]);

  useEffect(() => {
    filterBrands();
  }, [brands, searchQuery, selectedCategory]);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const data = showDeletedBrands ? await getBrands() : await getActiveBrands();
      setBrands(data);
    } catch (error) {
      setError('Failed to fetch brands');
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBrands = () => {
    let filtered = brands;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(brand =>
        brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        brand.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(brand => {
        // Check if brand.category (JSONB array) contains the selected category
        const categoryArray = Array.isArray(brand.category) ? brand.category : (brand.category ? [brand.category] : []);
        return categoryArray.includes(selectedCategory as BrandCategory) || 
               (brand.categories && brand.categories.includes(selectedCategory as BrandCategory));
      });
    }

    // Sort by popularity (most popular first)
    const popularBrands = [
      'Apple', 'Samsung', 'Google', 'Microsoft', 'Lenovo', 'HP', 'Dell',
      'Huawei', 'Xiaomi', 'OnePlus', 'Sony', 'LG', 'Motorola', 'Nokia',
      'Tecno', 'Infinix', 'Itel', 'HTC', 'Asus', 'Acer', 'Canon', 'Epson', 'Brother'
    ];

    filtered.sort((a, b) => {
      const indexA = popularBrands.indexOf(a.name);
      const indexB = popularBrands.indexOf(b.name);
      
      // If both brands are in the popularity list, sort by their position
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // If only one is in the list, prioritize it
      if (indexA !== -1 && indexB === -1) return -1;
      if (indexA === -1 && indexB !== -1) return 1;
      
      // If neither is in the list, sort alphabetically
      return a.name.localeCompare(b.name);
    });

    setFilteredBrands(filtered);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length > 2) {
      try {
        const results = await searchBrands(query);
        setFilteredBrands(results);
      } catch (error) {
        console.error('Error searching brands:', error);
      }
    }
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      await createBrand(formData);
      setSuccess('Brand created successfully');
      setShowAddModal(false);
      resetForm();
      fetchBrands();
    } catch (error: any) {
      setError(error.message || 'Failed to create brand');
    }
  };

  const handleUpdateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBrand) return;

    try {
      setIsSubmitting(true);
      setError('');
      await updateBrand(editingBrand.id, formData);
      setSuccess('Brand updated successfully');
      setEditingBrand(null);
      setShowEditModal(false);
      resetForm();
      fetchBrands();
    } catch (error: any) {
      setError(error.message || 'Failed to update brand');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBrand = async (brand: Brand) => {
    if (!confirm(`Are you sure you want to delete "${brand.name}"?`)) return;

    try {
      setError('');
      await deleteBrand(brand.id);
      setSuccess('Brand deleted successfully');
      fetchBrands();
    } catch (error: any) {
      setError(error.message || 'Failed to delete brand');
    }
  };

  const handleRestoreBrand = async (brand: Brand) => {
    if (!confirm(`Are you sure you want to restore "${brand.name}"?`)) return;

    try {
      setError('');
      await restoreBrand(brand.id);
      setSuccess('Brand restored successfully');
      fetchBrands();
    } catch (error: any) {
      setError(error.message || 'Failed to restore brand');
    }
  };

  const startEdit = (brand: Brand) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      logo_url: brand.logo_url || '',
      description: brand.description || '',
      category: brand.category?.[0] || 'phone',
      categories: brand.category || brand.categories || ['phone']
    });
    setShowEditModal(true);
  };

  const cancelEdit = () => {
    setEditingBrand(null);
    setShowEditModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      logo_url: '',
      description: '',
      category: 'phone',
      categories: ['phone']
    });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      phone: 'bg-blue-100 text-blue-800',
      laptop: 'bg-green-100 text-green-800',
      tablet: 'bg-purple-100 text-purple-800',
      desktop: 'bg-orange-100 text-orange-800',
      printer: 'bg-red-100 text-red-800',
      smartwatch: 'bg-pink-100 text-pink-800',
      headphones: 'bg-indigo-100 text-indigo-800',
      speaker: 'bg-yellow-100 text-yellow-800',
      camera: 'bg-teal-100 text-teal-800',
      gaming: 'bg-cyan-100 text-cyan-800',
      accessories: 'bg-amber-100 text-amber-800',
      monitor: 'bg-emerald-100 text-emerald-800',
      keyboard: 'bg-violet-100 text-violet-800',
      mouse: 'bg-slate-100 text-slate-800',
      router: 'bg-lime-100 text-lime-800',
      modem: 'bg-fuchsia-100 text-fuchsia-800',
      scanner: 'bg-orange-100 text-orange-800',
      projector: 'bg-indigo-100 text-indigo-800',
      server: 'bg-gray-100 text-gray-800',
      network: 'bg-blue-100 text-blue-800',
      storage: 'bg-green-100 text-green-800',
      other: 'bg-gray-100 text-gray-800'
    };
    return colors[category] || colors.other;
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 rounded-lg bg-white/50 backdrop-blur-sm hover:bg-white/70 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Brand Management</h1>
              <p className="text-gray-600">Manage device brands used in the system</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDeletedBrands}
                onChange={(e) => setShowDeletedBrands(e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show deleted brands</span>
            </label>
            <GlassButton
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2"
            >
              <Plus size={20} />
              Add Brand
            </GlassButton>
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
        <GlassCard className="mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search brands..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter size={20} className="text-gray-500" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              >
                {categories.map(category => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </GlassCard>

        {/* Add Form */}
        {showAddModal && (
          <Modal
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            title="Add New Brand"
          >
            <form onSubmit={handleAddBrand} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Enter brand name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
                  <div className="space-y-2">
                    {categories.slice(1).map(category => (
                      <label key={category.value} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(category.value as BrandCategory)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                categories: [...formData.categories, category.value as BrandCategory]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                categories: formData.categories.filter(c => c !== category.value)
                              });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{category.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="https://example.com/logo.svg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter brand description"
                  rows={4}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Save size={20} />
                  Create Brand
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </Modal>
        )}

        {/* Brands Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBrands.map(brand => (
            <GlassCard
              key={brand.id}
              className={`p-4 hover:shadow-lg transition-all duration-200 ${
                !brand.is_active ? 'opacity-60 border-2 border-red-200' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {brand.logo_url ? (
                    <img
                      src={brand.logo_url}
                      alt={brand.name}
                      className="w-10 h-10 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/logos/placeholder.svg';
                      }}
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                      {brand.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">{brand.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {brand.category && Array.isArray(brand.category) && brand.category.length > 0 ? (
                        brand.category.slice(0, 2).map((category, index) => (
                          <span key={index} className={`inline-block px-2 py-1 text-xs rounded-full ${getCategoryColor(category)}`}>
                            {category}
                          </span>
                        ))
                      ) : brand.categories && brand.categories.length > 0 ? (
                        brand.categories.slice(0, 2).map((category, index) => (
                          <span key={index} className={`inline-block px-2 py-1 text-xs rounded-full ${getCategoryColor(category)}`}>
                            {category}
                          </span>
                        ))
                      ) : (
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
                          other
                        </span>
                      )}
                      {!brand.is_active && (
                        <span className="inline-block px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
                          Deleted
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {brand.is_active ? (
                    <>
                      <button
                        onClick={() => startEdit(brand)}
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
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">{brand.description}</p>
              )}
              <div className="text-xs text-gray-500">
                Created: {new Date(brand.created_at).toLocaleDateString()}
              </div>
            </GlassCard>
          ))}
        </div>

        {filteredBrands.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="text-gray-500 text-lg">No brands found</div>
            <p className="text-gray-400 mt-2">
              {searchQuery || selectedCategory !== 'all' 
                ? 'Try adjusting your search or filters'
                : 'Add your first brand to get started'
              }
            </p>
          </div>
        )}

        {/* Edit Brand Modal */}
        {showEditModal && editingBrand && (
          <Modal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            title={`Edit Brand: ${editingBrand.name}`}
          >
            <form onSubmit={handleUpdateBrand} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Brand Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Enter brand name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Categories</label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {categories.slice(1).map(category => (
                      <label key={category.value} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={formData.categories.includes(category.value as BrandCategory)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({
                                ...formData,
                                categories: [...formData.categories, category.value as BrandCategory]
                              });
                            } else {
                              setFormData({
                                ...formData,
                                categories: formData.categories.filter(c => c !== category.value)
                              });
                            }
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{category.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL</label>
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="https://example.com/logo.svg"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  placeholder="Enter brand description"
                  rows={4}
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
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
                      <span>Update Brand</span>
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
            </form>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default BrandManagementPage; 