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
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import SearchBar from '../components/ui/SearchBar';
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
  Mail
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface Brand {
  id: string;
  name: string;
  description?: string;
  category?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

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

  // Brands state (mock data for now)
  const [brands, setBrands] = useState<Brand[]>([
    {
      id: '1',
      name: 'Apple',
      description: 'Apple Inc. - Premium electronics manufacturer',
      category: 'Electronics',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '2',
      name: 'Samsung',
      description: 'Samsung Electronics - Global technology leader',
      category: 'Electronics',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: '3',
      name: 'Generic',
      description: 'Generic/Third-party replacement parts',
      category: 'Parts',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ]);

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
          const [categoriesData, suppliersData] = await Promise.all([
      getInventoryCategories(),
      getSuppliers()
    ]);
      
      setCategories(categoriesData);
      setSuppliers(suppliersData);
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
      const supplier = await inventoryApi.createSupplier(newSupplier);
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
      const updatedSupplier = await inventoryApi.updateSupplier(editingSupplier.id, {
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
      await inventoryApi.deleteSupplier(id);
      setSuppliers(suppliers.filter(s => s.id !== id));
      toast.success('Supplier deleted successfully');
    } catch (error) {
      toast.error('Failed to delete supplier');
    }
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
      {/* Test Message */}
      <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
        <strong>Inventory Management Page Loaded!</strong> You should see tabs below.
      </div>

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
                onClick={() => toast.info('Brand management coming soon!')}
                className="flex items-center gap-2"
              >
                <Plus size={16} />
                Add Brand
              </GlassButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredBrands.map(brand => (
                <GlassCard key={brand.id}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900">{brand.name}</h3>
                    <div className="flex gap-1">
                      <button
                        onClick={() => toast.info('Edit brand coming soon!')}
                        className="p-1 text-gray-400 hover:text-blue-600"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        onClick={() => toast.info('Delete brand coming soon!')}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  
                  {brand.description && (
                    <p className="text-sm text-gray-600 mb-3">{brand.description}</p>
                  )}
                  
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                      {brand.category}
                    </span>
                    <span className={`px-2 py-1 rounded-full ${
                      brand.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {brand.is_active ? 'Active' : 'Inactive'}
                    </span>
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
                <GlassButton variant="secondary" onClick={() => toast.info('Low stock settings coming soon!')}>
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
                <GlassButton variant="secondary" onClick={() => toast.info('Pricing rules coming soon!')}>
                  Configure Rules
                </GlassButton>
              </GlassCard>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryManagementPage;
