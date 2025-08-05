import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getInventoryCategories, 
  getSuppliers, 
  createInventoryCategory, 
  createSupplier,
  updateInventoryCategory,
  updateSupplier,
  deleteInventoryCategory,
  deleteSupplier,
  InventoryCategory,
  Supplier
} from '../lib/inventoryApi';
import { 
  getActiveBrands, 
  createBrand, 
  updateBrand, 
  deleteBrand, 
  Brand 
} from '../lib/brandApi';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import SearchBar from '../components/ui/SearchBar';
import BrandForm from '../components/forms/BrandForm';
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X,
  Tag,
  Building,
  Package,
  Settings,
  Users,
  DollarSign,
  AlertTriangle,
  Clock,
  MapPin,
  Phone,
  Mail,
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
  HardDrive
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const InventoryManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'categories' | 'brands' | 'suppliers' | 'settings'>('categories');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Categories state
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState<InventoryCategory | null>(null);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  // Suppliers state
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Tanzania',
    payment_terms: '',
    lead_time_days: 7,
    notes: ''
  });

  // Brands state
  const [brands, setBrands] = useState<Brand[]>([]);
  const [showBrandForm, setShowBrandForm] = useState(false);
  const [editingBrand, setEditingBrand] = useState<Brand | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    { value: '#6B7280', label: 'Gray' }
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [categoriesData, suppliersData, brandsData] = await Promise.all([
        getInventoryCategories(),
        getSuppliers(),
        getActiveBrands()
      ]);
      
      setCategories(categoriesData);
      setSuppliers(suppliersData);
      setBrands(brandsData);
    } catch (error) {
      console.error('Error loading management data:', error);
      toast.error('Failed to load management data');
    } finally {
      setLoading(false);
    }
  };

  // Category management
  const handleCreateCategory = async () => {
    if (!newCategory.name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      const category = await createInventoryCategory(newCategory);
      setCategories([...categories, category]);
      setNewCategory({ name: '', description: '', color: '#3B82F6' });
      setShowNewCategory(false);
      toast.success('Category created successfully');
    } catch (error) {
      toast.error('Failed to create category');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    try {
      const updatedCategory = await updateInventoryCategory(editingCategory.id, {
        name: editingCategory.name,
        description: editingCategory.description,
        color: editingCategory.color
      });
      
      setCategories(categories.map(c => c.id === updatedCategory.id ? updatedCategory : c));
      setEditingCategory(null);
      toast.success('Category updated successfully');
    } catch (error) {
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;

    try {
      await deleteInventoryCategory(id);
      setCategories(categories.filter(c => c.id !== id));
      toast.success('Category deleted successfully');
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  // Supplier management
  const handleCreateSupplier = async () => {
    if (!newSupplier.name.trim()) {
      toast.error('Supplier name is required');
      return;
    }

    try {
      const supplier = await createSupplier(newSupplier);
      setSuppliers([...suppliers, supplier]);
      setNewSupplier({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: 'Tanzania',
        payment_terms: '',
        lead_time_days: 7,
        notes: ''
      });
      setShowNewSupplier(false);
      toast.success('Supplier created successfully');
    } catch (error) {
      toast.error('Failed to create supplier');
    }
  };

  const handleUpdateSupplier = async () => {
    if (!editingSupplier) return;

    try {
      const updatedSupplier = await updateSupplier(editingSupplier.id, {
        name: editingSupplier.name,
        contact_person: editingSupplier.contact_person,
        email: editingSupplier.email,
        phone: editingSupplier.phone,
        address: editingSupplier.address,
        city: editingSupplier.city,
        country: editingSupplier.country,
        payment_terms: editingSupplier.payment_terms,
        lead_time_days: editingSupplier.lead_time_days,
        notes: editingSupplier.notes
      });
      
      setSuppliers(suppliers.map(s => s.id === updatedSupplier.id ? updatedSupplier : s));
      setEditingSupplier(null);
      toast.success('Supplier updated successfully');
    } catch (error) {
      toast.error('Failed to update supplier');
    }
  };

  const handleDeleteSupplier = async (id: string) => {
    if (!confirm('Are you sure you want to delete this supplier?')) return;

    try {
      await deleteSupplier(id);
      setSuppliers(suppliers.filter(s => s.id !== id));
      toast.success('Supplier deleted successfully');
    } catch (error) {
      toast.error('Failed to delete supplier');
    }
  };

  // Brand management
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
      await loadData(); // Reload all data
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
        await loadData(); // Reload all data
      } catch (error: any) {
        toast.error('Failed to delete brand');
      }
    }
  };

  const startEditBrand = (brand: Brand) => {
    setEditingBrand(brand);
    setShowBrandForm(true);
  };

  const handleCloseBrandForm = () => {
    setShowBrandForm(false);
    setEditingBrand(null);
  };

  // Helper functions for brand categories
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

  // Filter data based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    supplier.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBrands = brands.filter(brand =>
    brand.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    brand.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading inventory management...</p>
          </div>
        </div>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600">Manage categories, brands, suppliers, and settings</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder={`Search ${activeTab}...`}
        />
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'categories' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Tag size={16} />
          Categories ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab('brands')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'brands' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Package size={16} />
          Brands ({brands.length})
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'suppliers' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Building size={16} />
          Suppliers ({suppliers.length})
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
            activeTab === 'settings' 
              ? 'bg-white text-blue-600 shadow-sm' 
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <Settings size={16} />
          Settings
        </button>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Categories Tab */}
        {activeTab === 'categories' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Product Categories</h2>
              <GlassButton
                onClick={() => setShowNewCategory(true)}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Add Category
              </GlassButton>
            </div>

            {/* Categories List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map(category => (
                <GlassCard key={category.id} className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: category.color }}
                      />
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingCategory(category)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  {category.description && (
                    <p className="text-sm text-gray-600 mb-3">{category.description}</p>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className={`px-2 py-1 rounded-full ${
                      category.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {category.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Brands Tab */}
        {activeTab === 'brands' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Product Brands</h2>
              <GlassButton
                onClick={() => setShowBrandForm(true)}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Add Brand
              </GlassButton>
            </div>

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
                        {brand.is_active ? (
                          <>
                            <button
                              onClick={() => startEditBrand(brand)}
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
                            onClick={() => handleDeleteBrand(brand)}
                            className="p-1 text-gray-500 hover:text-green-600 transition-colors"
                            title="Restore Brand"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Suppliers Tab */}
        {activeTab === 'suppliers' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Suppliers</h2>
              <GlassButton
                onClick={() => setShowNewSupplier(true)}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Add Supplier
              </GlassButton>
            </div>

            {/* Suppliers List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSuppliers.map(supplier => (
                <GlassCard key={supplier.id} className="relative">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{supplier.name}</h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingSupplier(supplier)}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteSupplier(supplier.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    {supplier.contact_person && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Users size={14} />
                        <span>{supplier.contact_person}</span>
                      </div>
                    )}
                    
                    {supplier.email && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Mail size={14} />
                        <span>{supplier.email}</span>
                      </div>
                    )}
                    
                    {supplier.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone size={14} />
                        <span>{supplier.phone}</span>
                      </div>
                    )}
                    
                    {supplier.city && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <MapPin size={14} />
                        <span>{supplier.city}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock size={14} />
                      <span>{supplier.lead_time_days} days lead time</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3 text-xs">
                    <span className={`px-2 py-1 rounded-full ${
                      supplier.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {supplier.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Inventory Settings</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <GlassCard>
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="text-orange-600" size={20} />
                  <h3 className="font-semibold text-gray-900">Low Stock Alerts</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Configure automatic alerts for products running low on stock.
                </p>
                <GlassButton variant="secondary" onClick={() => toast('Low stock settings coming soon!')}>
                  Configure Alerts
                </GlassButton>
              </GlassCard>

              <GlassCard>
                <div className="flex items-center gap-3 mb-4">
                  <DollarSign className="text-green-600" size={20} />
                  <h3 className="font-semibold text-gray-900">Pricing Rules</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Set up automatic pricing rules and markup percentages.
                </p>
                <GlassButton variant="secondary" onClick={() => toast('Pricing rules coming soon!')}>
                  Configure Rules
                </GlassButton>
              </GlassCard>
            </div>
          </div>
        )}
      </div>

      {/* Brand Form Modal */}
      <BrandForm
        isOpen={showBrandForm}
        onClose={handleCloseBrandForm}
        onSubmit={handleSubmitBrand}
        editingBrand={editingBrand}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default InventoryManagementPage;
