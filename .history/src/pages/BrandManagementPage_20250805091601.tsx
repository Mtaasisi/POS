import React, { useState, useEffect } from 'react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Plus, Edit, Trash2, Search, Filter, X, Save, RotateCcw, Tag, Smartphone, Laptop, Monitor, Headphones, Camera, Gamepad2, Printer, Watch, Speaker, Keyboard, Mouse, Router, Server, HardDrive, Package, Eye, MessageCircle, Users, Star, UserPlus } from 'lucide-react';
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
import BrandForm from '../components/forms/BrandForm';

const BrandManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [showDeletedBrands, setShowDeletedBrands] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    filterBrands();
  }, [brands, searchQuery, selectedCategory]);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const data = showDeletedBrands ? await getBrands() : await getActiveBrands();
      setBrands(data);
    } catch (error: any) {
      toast.error('Failed to fetch brands');
      console.error('Error fetching brands:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterBrands = () => {
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
        brand.category?.includes(selectedCategory as BrandCategory)
      );
    }

    setFilteredBrands(filtered);
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 2) {
      try {
        const results = await searchBrands(query);
        setFilteredBrands(results);
      } catch (error) {
        console.error('Search error:', error);
      }
    }
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
      await fetchBrands();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save brand');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteBrand = async (brand: Brand) => {
    if (window.confirm(`Are you sure you want to delete ${brand.name}?`)) {
      try {
        await deleteBrand(brand.id);
        toast.success('Brand deleted successfully!');
        await fetchBrands();
      } catch (error: any) {
        toast.error('Failed to delete brand');
      }
    }
  };

  const handleRestoreBrand = async (brand: Brand) => {
    try {
      await restoreBrand(brand.id);
      toast.success('Brand restored successfully!');
      await fetchBrands();
    } catch (error: any) {
      toast.error('Failed to restore brand');
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
    return categoryMap[category] || 'bg-gray-100 text-gray-800';
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
    return iconMap[category] || <Tag size={14} />;
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <GlassButton
          onClick={() => navigate('/inventory')}
          className="flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          Back to Inventory
        </GlassButton>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brand Management</h1>
          <p className="text-gray-600">Manage product brands and their logos</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{brands.filter(b => b.is_active).length}</div>
          <div className="text-sm text-gray-600">Active Brands</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{brands.filter(b => !b.is_active).length}</div>
          <div className="text-sm text-gray-600">Deleted Brands</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{brands.filter(b => b.logo_url).length}</div>
          <div className="text-sm text-gray-600">With Logos</div>
        </GlassCard>
        <GlassCard className="p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{new Set(brands.flatMap(b => b.category || [])).size}</div>
          <div className="text-sm text-gray-600">Categories</div>
        </GlassCard>
      </div>

      {/* Controls */}
      <GlassCard className="mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 md:w-80">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search brands..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
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
              onClick={() => setShowDeletedBrands(!showDeletedBrands)}
              variant={showDeletedBrands ? "danger" : "secondary"}
              className="flex items-center gap-2"
            >
              {showDeletedBrands ? <RotateCcw size={16} /> : <Trash2 size={16} />}
              {showDeletedBrands ? 'Show Active' : 'Show Deleted'}
            </GlassButton>
            
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
                  <div className="flex items-center gap-1">
                    {brand.is_active ? (
                      <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    ) : (
                      <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </div>
                </div>

                {brand.description && (
                  <p className="text-sm text-gray-600 line-clamp-2">{brand.description}</p>
                )}

                {/* Categories */}
                <div className="flex flex-wrap gap-1">
                  {Array.isArray(brand.category) ? brand.category.map((cat, index) => (
                    <span
                      key={index}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(cat)}`}
                    >
                      {getCategoryIcon(cat)}
                      {cat}
                    </span>
                  )) : brand.category ? (
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(brand.category)}`}
                    >
                      {getCategoryIcon(brand.category)}
                      {brand.category}
                    </span>
                  ) : null}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <span>Created: {new Date(brand.created_at).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {brand.is_active ? (
                      <>
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
                      </>
                    ) : (
                      <button
                        onClick={() => handleRestoreBrand(brand)}
                        className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                        title="Restore Brand"
                      >
                        <RotateCcw size={14} />
                      </button>
                    )}
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