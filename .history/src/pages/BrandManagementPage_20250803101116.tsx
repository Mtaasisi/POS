import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, X, Save, ArrowLeft, RotateCcw } from 'lucide-react';
import { 
  InventoryBrand, 
  getActiveInventoryBrands, 
  getInventoryBrands, 
  createInventoryBrand, 
  updateInventoryBrand, 
  deleteInventoryBrand, 
  restoreInventoryBrand, 
  searchInventoryBrands 
} from '../lib/inventoryApi';
import { useAuth } from '../context/AuthContext';

interface BrandFormData {
  name: string;
  logo_url: string;
  description: string;
  category: string;
  categories: string[]; // For UI compatibility
}

const BrandManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [brands, setBrands] = useState<InventoryBrand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<InventoryBrand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBrand, setEditingBrand] = useState<InventoryBrand | null>(null);
  const [showDeletedBrands, setShowDeletedBrands] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState<BrandFormData>({
    name: '',
    logo_url: '',
    description: '',
    category: 'phone',
    categories: ['phone']
  });
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  const categories = [
    { value: 'all', label: 'All Categories' },
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
      const data = showDeletedBrands ? await getInventoryBrands() : await getActiveInventoryBrands();
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
        return categoryArray.includes(selectedCategory) || 
               (brand.categories && brand.categories.includes(selectedCategory));
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
      setShowAddForm(false);
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
      setIsUpdating(true);
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
      setIsUpdating(false);
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
      category: brand.category?.[0] || 'phone' as BrandCategory,
      categories: brand.category || brand.categories || ['phone' as BrandCategory]
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
      category: 'phone' as BrandCategory,
      categories: ['phone' as BrandCategory]
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
      webcam: 'bg-rose-100 text-rose-800',
      microphone: 'bg-sky-100 text-sky-800',
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
              <h1 className="text-3xl font-bold text-gray-900">Brand Management</h1>
              <p className="text-gray-600">Manage device brands used in the system</p>
              <div className="mt-2">
                <a 
                  href="/category-management" 
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Manage Categories →
                </a>
              </div>
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
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} />
              Add Brand
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
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Add New Brand</h2>
              <button
                onClick={() => setShowAddForm(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
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
                  onClick={() => setShowAddForm(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Brands Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredBrands.map(brand => (
            <div
              key={brand.id}
              className={`bg-white/90 backdrop-blur-sm rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow ${
                !brand.is_active ? 'opacity-60 border-2 border-red-200' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {brand.logo_url ? (
                    <img
                      src={brand.logo_url}
                      alt={brand.name}
                      className="w-12 h-12 object-contain"
                      onError={(e) => {
                        e.currentTarget.src = '/logos/placeholder.svg';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <span className="text-gray-500 font-semibold text-lg">
                        {brand.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-gray-900">{brand.name}</h3>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {brand.category && Array.isArray(brand.category) && brand.category.length > 0 ? (
                        brand.category.map((category, index) => (
                          <span key={index} className={`inline-block px-2 py-1 text-xs rounded-full ${getCategoryColor(category)}`}>
                            {category}
                          </span>
                        ))
                      ) : brand.categories && brand.categories.length > 0 ? (
                        brand.categories.map((category, index) => (
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
              {brand.description && (
                <p className="text-sm text-gray-600 mb-3">{brand.description}</p>
              )}
              <div className="text-xs text-gray-500">
                Created: {new Date(brand.created_at).toLocaleDateString()}
              </div>
            </div>
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
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                cancelEdit();
              }
            }}
          >
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">Edit Brand: {editingBrand.name}</h2>
                <button
                  onClick={cancelEdit}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              
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
                    disabled={isUpdating}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                      isUpdating 
                        ? 'bg-gray-400 text-white cursor-not-allowed' 
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {isUpdating ? (
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
                    disabled={isUpdating}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BrandManagementPage; 