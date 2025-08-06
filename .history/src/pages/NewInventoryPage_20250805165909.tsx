import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getInventoryCategories, getSuppliers, createProduct, createInventoryCategory, createSupplier } from '../lib/inventoryApi';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import BrandSuggestionInput from '../components/ui/BrandSuggestionInput';
import ModelSuggestionInput from '../components/ui/ModelSuggestionInput';
import { 
  ArrowLeft, 
  Package, 
  Plus, 
  Trash2, 
  Save, 
  Store,
  Layers,
  DollarSign, 
  Building,
  ChevronDown,
  ChevronUp,
  Info,
  X,
  Tag,
  Hash,
  ToggleLeft,
  ToggleRight,
  AlertTriangle,
  CheckCircle,
  FileText,
  Key,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  Wifi,
  Bluetooth,
  Plug,
  Volume2,
  Vibrate,
  HardDrive,
  Droplet,
  Shield,
  Wrench,
  Eye,
  Edit,
  MessageCircle,
  Users,
  Star,
  UserPlus,
  Minus
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface ProductFormData {
  name: string;
  description: string;
  brand: string;
  model: string;
  category_id: string;
  supplier_id: string;
  cost_price: number;
  selling_price: number;
  quantity_in_stock: number;
  weight_kg?: number;
  dimensions_cm: string;
  product_code: string;
  barcode: string;
  minimum_stock_level: number;
  reorder_point: number;
  maximum_stock_level: number;
  warranty_period_months: number;
  is_active: boolean;
  notesExpanded: boolean;
}

interface VariantFormData {
  id: string;
  variant_name: string;
  attributes: Record<string, string>;
  cost_price: number;
  selling_price: number;
  quantity_in_stock: number;
  weight_kg?: number;
  dimensions_cm?: string;
}

interface InventoryCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
}

interface Supplier {
  id: string;
  name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country: string;
  payment_terms?: string;
  lead_time_days: number;
  is_active: boolean;
}

const NewInventoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<InventoryCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [brands, setBrands] = useState<Array<{ name: string; logo: string }>>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [showNewSupplier, setShowNewSupplier] = useState(false);
  const [hasVariants, setHasVariants] = useState(false);

  // Form state
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    brand: '',
    model: '',
    category_id: '',
    supplier_id: '',
    cost_price: 0,
    selling_price: 0,
    quantity_in_stock: 0,
    weight_kg: undefined,
    dimensions_cm: '',
    product_code: '',
    barcode: '',
    minimum_stock_level: 5,
    reorder_point: 10,
    maximum_stock_level: 100,
    warranty_period_months: 12,
    is_active: true,
    notesExpanded: false
  });

  const [errors, setErrors] = useState<Partial<ProductFormData>>({});
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: boolean }>({});

  const [variants, setVariants] = useState<VariantFormData[]>([
    {
      id: '1',
      variant_name: 'Default',
      attributes: {},
      cost_price: 0,
      selling_price: 0,
      quantity_in_stock: 0,
    }
  ]);

  // New category form
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    color: '#3B82F6'
  });

  // New supplier form
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    payment_terms: '',
    lead_time_days: 7
  });

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      await Promise.all([
        loadCategories(),
        loadSuppliers(),
        loadBrands()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load form data');
    }
  };

  const loadCategories = async () => {
    try {
      // For now, use mock data to prevent errors
      // This will be replaced when database tables are created
      setCategories([
        { id: '1', name: 'Phone Parts', description: 'Mobile phone components', color: '#3B82F6', is_active: true },
        { id: '2', name: 'Laptop Parts', description: 'Laptop components', color: '#10B981', is_active: true },
        { id: '3', name: 'Accessories', description: 'Device accessories', color: '#8B5CF6', is_active: true }
      ]);
      
      /* Uncomment when database tables are ready:
      const categoriesData = await getInventoryCategories();
      setCategories(categoriesData);
      */
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      // For now, use mock data to prevent errors
      setSuppliers([
        { id: '1', name: 'TechParts Tanzania', contact_person: 'John Doe', email: 'john@techparts.co.tz', phone: '+255712345678', address: 'Dar es Salaam', city: 'Dar es Salaam', country: 'Tanzania', payment_terms: 'Net 30', lead_time_days: 7, is_active: true },
        { id: '2', name: 'Mobile Solutions Ltd', contact_person: 'Jane Smith', email: 'jane@mobile.co.tz', phone: '+255723456789', address: 'Arusha', city: 'Arusha', country: 'Tanzania', payment_terms: 'Net 15', lead_time_days: 5, is_active: true }
      ]);
      
      /* Uncomment when database tables are ready:
      const suppliersData = await getSuppliers();
      setSuppliers(suppliersData);
      */
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const loadBrands = async () => {
    try {
      const { getActiveBrands } = await import('../lib/brandApi');
      const brandsData = await getActiveBrands();
      const formattedBrands = brandsData.map(brand => ({
        name: brand.name,
        logo: brand.logo_url || '/logos/placeholder.svg'
      }));
      setBrands(formattedBrands);
    } catch (error) {
      console.error('Error loading brands:', error);
      // Fallback to default brands if API fails
      setBrands([
        { name: 'Apple', logo: '/logos/apple.svg' },
        { name: 'Samsung', logo: '/logos/samsung.svg' },
        { name: 'Google', logo: '/logos/google.svg' },
        { name: 'Microsoft', logo: '/logos/microsoft.svg' },
        { name: 'Lenovo', logo: '/logos/lenovo.svg' },
        { name: 'HP', logo: '/logos/hp.svg' },
        { name: 'Dell', logo: '/logos/dell.svg' },
        { name: 'Huawei', logo: '/logos/huawei.svg' },
        { name: 'Xiaomi', logo: '/logos/xiaomi.svg' },
        { name: 'OnePlus', logo: '/logos/oneplus.svg' },
        { name: 'Sony', logo: '/logos/sony.svg' },
        { name: 'LG', logo: '/logos/lg.svg' },
        { name: 'Motorola', logo: '/logos/motorola.svg' },
        { name: 'Nokia', logo: '/logos/nokia.svg' },
        { name: 'Tecno', logo: '/logos/tecno.svg' },
        { name: 'Infinix', logo: '/logos/infinix.svg' },
        { name: 'Itel', logo: '/logos/itel.svg' },
        { name: 'HTC', logo: '/logos/htc.svg' },
        { name: 'Asus', logo: '/logos/asus.svg' },
        { name: 'Acer', logo: '/logos/acer.svg' },
        { name: 'Canon', logo: '/logos/canon.svg' },
        { name: 'Epson', logo: '/logos/epson.svg' },
        { name: 'Brother', logo: '/logos/brother.svg' },
      ]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ProductFormData> = {};
    const newFieldErrors: { [key: string]: boolean } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      newFieldErrors.name = true;
    }

    if (formData.cost_price < 0) {
      newErrors.cost_price = 'Cost price must be positive';
      newFieldErrors.cost_price = true;
    }

    if (formData.selling_price < 0) {
      newErrors.selling_price = 'Selling price must be positive';
      newFieldErrors.selling_price = true;
    }

    if (formData.quantity_in_stock < 0) {
      newErrors.quantity_in_stock = 'Quantity must be positive';
      newFieldErrors.quantity_in_stock = true;
    }

    if (formData.minimum_stock_level < 0) {
      newErrors.minimum_stock_level = 'Minimum stock level must be positive';
      newFieldErrors.minimum_stock_level = true;
    }

    setErrors(newErrors);
    setFieldErrors(newFieldErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  // Helper function to format numbers with commas
  const formatNumber = (value: number): string => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Helper function to parse formatted number
  const parseFormattedNumber = (value: string): number => {
    return parseInt(value.replace(/,/g, '')) || 0;
  };

  // Helper function to handle field focus and clear
  const handleFieldFocus = (field: keyof ProductFormData) => {
    if (formData[field] === 0) {
      handleInputChange(field, '');
    }
  };

  // Helper function to handle field blur and format
  const handleFieldBlur = (field: keyof ProductFormData, value: string) => {
    const numValue = parseFormattedNumber(value);
    handleInputChange(field, numValue);
  };

  // Calculate form completion percentage
  const getFormCompletion = () => {
    const requiredFields = [
      formData.name ? 1 : 0,
      formData.category_id ? 1 : 0,
      formData.cost_price > 0 ? 1 : 0,
      formData.selling_price > 0 ? 1 : 0,
      formData.quantity_in_stock >= 0 ? 1 : 0,
      formData.minimum_stock_level >= 0 ? 1 : 0
    ];
    return Math.round((requiredFields.reduce((a, b) => a + b, 0) / requiredFields.length) * 100);
  };

  const completionPercentage = getFormCompletion();

  // Helper function to calculate profit metrics
  const calculateProfitMetrics = (costPrice: number, sellingPrice: number) => {
    if (costPrice <= 0 || sellingPrice <= 0) return null;
    
    const profit = sellingPrice - costPrice;
    const margin = (profit / sellingPrice) * 100;
    const markup = (profit / costPrice) * 100;
    
    return { profit, margin, markup };
  };

  // Helper function to validate non-variant product
  const validateSimpleProduct = () => {
    if (!formData.name.trim()) {
      toast.error('Product name is required');
      return false;
    }
    
    if (formData.cost_price < 0 || formData.selling_price < 0) {
      toast.error('Prices cannot be negative');
      return false;
    }
    
    if (formData.cost_price > formData.selling_price) {
      toast.error('Selling price should be higher than cost price');
      return false;
    }
    
    if (formData.quantity_in_stock < 0) {
      toast.error('Quantity cannot be negative');
      return false;
    }
    
    return true;
  };

  // Handle toggle between simple and variant products
  const handleVariantToggle = () => {
    if (hasVariants) {
      // Switching from variants to simple product
      if (variants.length > 1) {
        toast.error('Please remove extra variants before switching to simple product mode');
        return;
      }
      
      // Migrate data from first variant to form data
      const firstVariant = variants[0];
      setFormData(prev => ({
        ...prev,
        cost_price: firstVariant.cost_price,
        selling_price: firstVariant.selling_price,
        quantity_in_stock: firstVariant.quantity_in_stock,
        weight_kg: firstVariant.weight_kg,
        dimensions_cm: firstVariant.dimensions_cm || '',
      }));
    } else {
      // Switching from simple to variant product
      // Migrate form data to first variant
      setVariants([{
        id: '1',
        variant_name: 'Default',
        attributes: {},
        cost_price: formData.cost_price,
        selling_price: formData.selling_price,
        quantity_in_stock: formData.quantity_in_stock,
        weight_kg: formData.weight_kg,
        dimensions_cm: formData.dimensions_cm,
      }]);
    }
    
    setHasVariants(!hasVariants);
  };

  const addVariant = () => {
    const newVariant: VariantFormData = {
      id: Date.now().toString(),
      variant_name: `Variant ${variants.length + 1}`,
      attributes: {},
      cost_price: 0,
      selling_price: 0,
      quantity_in_stock: 0,
    };
    setVariants([...variants, newVariant]);
  };

  const removeVariant = (id: string) => {
    if (variants.length > 1) {
      setVariants(variants.filter(v => v.id !== id));
    }
  };

  const updateVariant = (id: string, field: keyof VariantFormData, value: any) => {
    setVariants(variants.map(v => 
      v.id === id ? { ...v, [field]: value } : v
    ));
  };

  const updateVariantAttribute = (variantId: string, attributeKey: string, attributeValue: string) => {
    setVariants(variants.map(v => 
      v.id === variantId 
        ? { 
            ...v, 
            attributes: { 
              ...v.attributes, 
              [attributeKey]: attributeValue 
            } 
          } 
        : v
    ));
  };

  const removeVariantAttribute = (variantId: string, attributeKey: string) => {
    setVariants(variants.map(v => 
      v.id === variantId 
        ? { 
            ...v, 
            attributes: Object.fromEntries(
              Object.entries(v.attributes).filter(([key]) => key !== attributeKey)
            )
          } 
        : v
    ));
  };

  const handleCreateCategory = async () => {
    try {
      const category = await createInventoryCategory({
        name: newCategory.name,
        description: newCategory.description,
        color: newCategory.color,
        is_active: true
      });
      setCategories([...categories, category]);
      setFormData(prev => ({ ...prev, category_id: category.id }));
      setNewCategory({ name: '', description: '', color: '#3B82F6' });
      setShowNewCategory(false);
      toast.success('Category created successfully');
    } catch (error) {
      toast.error('Failed to create category');
    }
  };

  const handleCreateSupplier = async () => {
    try {
      const supplier = await createSupplier({
        name: newSupplier.name,
        contact_person: newSupplier.contact_person,
        email: newSupplier.email,
        phone: newSupplier.phone,
        address: newSupplier.address,
        city: newSupplier.city,
        country: 'Tanzania',
        payment_terms: newSupplier.payment_terms,
        lead_time_days: newSupplier.lead_time_days,
        is_active: true
      });
      setSuppliers([...suppliers, supplier]);
      setFormData(prev => ({ ...prev, supplier_id: supplier.id }));
      setNewSupplier({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        payment_terms: '',
        lead_time_days: 7
      });
      setShowNewSupplier(false);
      toast.success('Supplier created successfully');
    } catch (error) {
      toast.error('Failed to create supplier');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    setSaving(true);
    try {
      let productData;
      
      if (hasVariants) {
        if (variants.some(v => !v.variant_name.trim())) {
          toast.error('All variants must have a name');
          return;
        }

        if (variants.some(v => v.cost_price < 0 || v.selling_price < 0)) {
          toast.error('Prices cannot be negative');
          return;
        }

        productData = {
          ...formData,
          variants: variants.map(({ id, ...variant }) => ({
            variant_name: variant.variant_name,
            attributes: variant.attributes,
            cost_price: variant.cost_price,
            selling_price: variant.selling_price,
            quantity_in_stock: variant.quantity_in_stock,
            weight_kg: variant.weight_kg,
            dimensions_cm: variant.dimensions_cm
          }))
        };
      } else {
        // For non-variant products, create a single default variant
        productData = {
          ...formData,
          variants: [{
            variant_name: 'Default',
            attributes: {},
            cost_price: formData.cost_price,
            selling_price: formData.selling_price,
            quantity_in_stock: formData.quantity_in_stock,
            weight_kg: formData.weight_kg,
            dimensions_cm: formData.dimensions_cm
          }]
        };
      }

      await createProduct(productData);
      toast.success('Product created successfully!');
      navigate('/inventory');
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast.error(error.message || 'Failed to create product');
    } finally {
      setSaving(false);
    }
  };

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

  if (loading) {
    return (
      <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading product form...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Progress Indicator */}
        <div className="bg-gradient-to-r from-blue-50 via-white to-purple-50 backdrop-blur-md rounded-xl p-4 border border-blue-100 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-sm">
                <Package className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Product Form</h2>
                <p className="text-xs text-gray-600">
                  Create a new inventory product
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">{completionPercentage}%</div>
                <div className="text-xs text-gray-500">Complete</div>
              </div>
              <div className="relative">
                <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-500 ease-out"
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
                {completionPercentage === 100 && (
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                    <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <GlassCard className="mb-6">
            {/* Unified Product Form */}
            <div className="space-y-6">
            {/* Basic Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Package size={20} className="text-blue-600" />
                  Basic Information
                </h3>
                
                {/* Active Toggle */}
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">Status</span>
                  <button
                    type="button"
                    onClick={() => handleInputChange('is_active', !formData.is_active)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      formData.is_active 
                        ? 'bg-blue-600' 
                        : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        formData.is_active ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className={`text-sm font-medium ${
                    formData.is_active ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {formData.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg pl-12 bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      placeholder="Enter product name"
                      required
                    />
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Brand
                  </label>
                  <BrandSuggestionInput
                    value={formData.brand}
                    onChange={(value) => handleInputChange('brand', value)}
                    placeholder="Select or enter brand"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Model
                  </label>
                  <ModelSuggestionInput
                    value={formData.model}
                    onChange={(value) => handleInputChange('model', value)}
                    placeholder="Select or enter model"
                    brand={formData.brand}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.category_id}
                      onChange={(e) => handleInputChange('category_id', e.target.value)}
                      className="flex-1 px-4 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    >
                      <option value="">Select category</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                    <GlassButton
                      type="button"
                      onClick={() => setShowNewCategory(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus size={16} />
                      New
                    </GlassButton>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={formData.supplier_id}
                      onChange={(e) => handleInputChange('supplier_id', e.target.value)}
                      className="flex-1 px-4 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    >
                      <option value="">Select supplier</option>
                      {suppliers.map(supplier => (
                        <option key={supplier.id} value={supplier.id}>
                          {supplier.name}
                        </option>
                      ))}
                    </select>
                    <GlassButton
                      type="button"
                      onClick={() => setShowNewSupplier(true)}
                      className="flex items-center gap-2"
                    >
                      <Plus size={16} />
                      New
                    </GlassButton>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 resize-none"
                    placeholder="Enter product description"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* Variant Toggle */}
            <div className="border-b border-gray-200 pb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Layers size={20} className="text-blue-600" />
                  Product Configuration
                </h3>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-600">Simple Product</span>
                  <button
                    type="button"
                    onClick={handleVariantToggle}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                      hasVariants ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        hasVariants ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                  <span className="text-sm text-gray-600">With Variants</span>
                </div>
              </div>
              

            </div>

            {/* Non-Variant Fields */}
            {!hasVariants && (
              <div className="border-b border-gray-200 pb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <DollarSign size={20} className="text-green-600" />
                  Product Details
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cost Price (TZS) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.cost_price}
                        onChange={(e) => handleInputChange('cost_price', parseFloat(e.target.value) || 0)}
                        className="w-full pl-10 pr-4 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                        placeholder="0.00"
                        required
                      />
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">The price you paid for this product</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Selling Price (TZS) *
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={formData.selling_price}
                        onChange={(e) => handleInputChange('selling_price', parseFloat(e.target.value) || 0)}
                        className="w-full pl-10 pr-4 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                        placeholder="0.00"
                        required
                      />
                      <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">The price you'll sell this product for</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Quantity in Stock *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.quantity_in_stock}
                      onChange={(e) => handleInputChange('quantity_in_stock', parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg bg-white/30 backdrop-blur-md focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      placeholder="0"
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1">Current stock level</p>
                  </div>


                </div>

                {/* Quick Price Calculator */}
                {formData.cost_price > 0 && (
                  <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-700 mb-2">
                      <Info size={16} />
                      <span className="font-medium text-sm">Quick Price Calculator</span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[10, 20, 30, 50].map(markup => (
                        <button
                          key={markup}
                          type="button"
                          onClick={() => {
                            const newPrice = formData.cost_price * (1 + markup / 100);
                            handleInputChange('selling_price', Math.round(newPrice));
                          }}
                          className="px-3 py-2 text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 rounded border border-blue-200 transition-colors"
                        >
                          {markup}% Markup
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Profit Margin Display for Non-Variant Products */}
                {(() => {
                  const metrics = calculateProfitMetrics(formData.cost_price, formData.selling_price);
                  return metrics && (
                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
                      <div className="flex items-center gap-2 text-blue-800 mb-3">
                        <Info size={16} />
                        <span className="font-medium">Profit Analysis</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-3 rounded-lg border border-blue-100">
                          <span className="text-blue-600 text-sm font-medium">Profit per Unit</span>
                          <p className="font-bold text-blue-900 text-lg">
                            {metrics.profit.toLocaleString('en-TZ', {
                              style: 'currency',
                              currency: 'TZS',
                              minimumFractionDigits: 0
                            })}
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-blue-100">
                          <span className="text-blue-600 text-sm font-medium">Profit Margin</span>
                          <p className="font-bold text-blue-900 text-lg">
                            {metrics.margin.toFixed(1)}%
                          </p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-blue-100">
                          <span className="text-blue-600 text-sm font-medium">Markup</span>
                          <p className="font-bold text-blue-900 text-lg">
                            {metrics.markup.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      {formData.quantity_in_stock > 0 && (
                        <div className="mt-3 pt-3 border-t border-blue-200">
                          <div className="flex items-center justify-between">
                            <span className="text-blue-700 font-medium">Total Stock Value:</span>
                            <span className="font-bold text-blue-900">
                              {(formData.selling_price * formData.quantity_in_stock).toLocaleString('en-TZ', {
                                style: 'currency',
                                currency: 'TZS',
                                minimumFractionDigits: 0
                              })}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-blue-700 font-medium">Total Profit Potential:</span>
                            <span className="font-bold text-green-700">
                              {(metrics.profit * formData.quantity_in_stock).toLocaleString('en-TZ', {
                                style: 'currency',
                                currency: 'TZS',
                                minimumFractionDigits: 0
                              })}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Product Summary for Simple Products */}
                {formData.name.trim() && (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                      <Package size={16} />
                      Product Summary
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Product Name:</span>
                        <p className="font-medium text-gray-900">{formData.name}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Brand:</span>
                        <p className="font-medium text-gray-900">{formData.brand || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Model:</span>
                        <p className="font-medium text-gray-900">{formData.model || 'Not specified'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Category:</span>
                        <p className="font-medium text-gray-900">
                          {categories.find(c => c.id === formData.category_id)?.name || 'Not selected'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Supplier:</span>
                        <p className="font-medium text-gray-900">
                          {suppliers.find(s => s.id === formData.supplier_id)?.name || 'Not selected'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-600">Stock Level:</span>
                        <p className="font-medium text-gray-900">{formData.quantity_in_stock} units</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Product Variants */}
            {hasVariants && (
              <div className="border-b border-gray-200 pb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Layers size={20} className="text-blue-600" />
                    Product Variants ({variants.length})
                  </h3>
                  <GlassButton
                    type="button"
                    onClick={addVariant}
                    className="flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add Variant
                  </GlassButton>
                </div>

              <div className="space-y-4">
                {variants.map((variant, index) => (
                  <div key={variant.id} className="border border-gray-200 rounded-lg p-4 bg-white/50">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-medium text-gray-900">Variant {index + 1}</h4>
                      {variants.length > 1 && (
                        <GlassButton
                          type="button"
                          onClick={() => removeVariant(variant.id)}
                          variant="danger"
                          className="flex items-center gap-2"
                        >
                          <Trash2 size={16} />
                          Remove
                        </GlassButton>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Variant Name *
                        </label>
                        <input
                          type="text"
                          value={variant.variant_name}
                          onChange={(e) => updateVariant(variant.id, 'variant_name', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="e.g., Red 128GB, Large, etc."
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Quantity in Stock *
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={variant.quantity_in_stock}
                          onChange={(e) => updateVariant(variant.id, 'quantity_in_stock', parseInt(e.target.value) || 0)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cost Price (TZS) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.cost_price}
                            onChange={(e) => updateVariant(variant.id, 'cost_price', parseFloat(e.target.value) || 0)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                            required
                          />
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Selling Price (TZS) *
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={variant.selling_price}
                            onChange={(e) => updateVariant(variant.id, 'selling_price', parseFloat(e.target.value) || 0)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.00"
                            required
                          />
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Weight (kg)
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.001"
                          value={variant.weight_kg || ''}
                          onChange={(e) => updateVariant(variant.id, 'weight_kg', parseFloat(e.target.value) || undefined)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="0.000"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Dimensions (cm)
                        </label>
                        <input
                          type="text"
                          value={variant.dimensions_cm}
                          onChange={(e) => updateVariant(variant.id, 'dimensions_cm', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="L x W x H (e.g., 10x5x2)"
                        />
                      </div>
                    </div>

                    {/* Variant Attributes */}
                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="block text-sm font-medium text-gray-700">
                          Attributes (Color, Size, Storage, etc.)
                        </label>
                        <GlassButton
                          type="button"
                          onClick={() => {
                            const key = prompt('Enter attribute name (e.g., Color, Size, Storage):');
                            if (key) {
                              updateVariantAttribute(variant.id, key, '');
                            }
                          }}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Plus size={14} />
                          Add Attribute
                        </GlassButton>
                      </div>
                      
                      <div className="space-y-2">
                        {Object.entries(variant.attributes).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={key}
                              readOnly
                              className="w-1/3 px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-sm"
                            />
                            <input
                              type="text"
                              value={value as string}
                              onChange={(e) => updateVariantAttribute(variant.id, key, e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                              placeholder={`Enter ${key.toLowerCase()}`}
                            />
                            <GlassButton
                              type="button"
                              onClick={() => removeVariantAttribute(variant.id, key)}
                              variant="danger"
                              className="flex items-center gap-2 text-sm"
                            >
                              <Trash2 size={14} />
                            </GlassButton>
                          </div>
                        ))}
                        
                        {Object.keys(variant.attributes).length === 0 && (
                          <div className="text-sm text-gray-500 italic">
                            No attributes added. Click "Add Attribute" to add variant properties.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Profit Margin Display */}
                    {variant.cost_price > 0 && variant.selling_price > 0 && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 text-blue-800">
                          <Info size={16} />
                          <span className="font-medium">Profit Analysis:</span>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-blue-600">Profit:</span>
                            <p className="font-semibold text-blue-900">
                              {(variant.selling_price - variant.cost_price).toLocaleString('en-TZ', {
                                style: 'currency',
                                currency: 'TZS',
                                minimumFractionDigits: 0
                              })}
                            </p>
                          </div>
                          <div>
                            <span className="text-blue-600">Margin:</span>
                            <p className="font-semibold text-blue-900">
                              {((variant.selling_price - variant.cost_price) / variant.selling_price * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <span className="text-blue-600">Markup:</span>
                            <p className="font-semibold text-blue-900">
                              {((variant.selling_price - variant.cost_price) / variant.cost_price * 100).toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            )}

            {/* Advanced Settings */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center justify-between w-full p-3 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors mb-4"
              >
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Tag size={20} className="text-blue-600" />
                  Advanced Settings
                </h3>
                {showAdvanced ? (
                  <ChevronUp size={20} className="text-gray-600" />
                ) : (
                  <ChevronDown size={20} className="text-gray-600" />
                )}
              </button>

              {showAdvanced && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Product Code
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.product_code}
                        onChange={(e) => handleInputChange('product_code', e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Auto-generated if empty"
                      />
                      <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Barcode
                    </label>
                    <input
                      type="text"
                      value={formData.barcode}
                      onChange={(e) => handleInputChange('barcode', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter barcode"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Stock Level
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.minimum_stock_level}
                      onChange={(e) => handleInputChange('minimum_stock_level', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reorder Point
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.reorder_point}
                      onChange={(e) => handleInputChange('reorder_point', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Maximum Stock Level
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.maximum_stock_level}
                      onChange={(e) => handleInputChange('maximum_stock_level', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Warranty Period (months)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={formData.warranty_period_months}
                      onChange={(e) => handleInputChange('warranty_period_months', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={formData.weight_kg || ''}
                      onChange={(e) => handleInputChange('weight_kg', parseFloat(e.target.value) || undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.000"
                    />
                    <p className="text-xs text-gray-500 mt-1">Product weight for shipping calculations</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Dimensions (cm)
                    </label>
                    <input
                      type="text"
                      value={formData.dimensions_cm}
                      onChange={(e) => handleInputChange('dimensions_cm', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="L x W x H (e.g., 10x5x2)"
                    />
                    <p className="text-xs text-gray-500 mt-1">Product dimensions for storage and shipping</p>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <GlassButton
                type="button"
                onClick={() => navigate('/inventory')}
                variant="secondary"
              >
                Cancel
              </GlassButton>
              <GlassButton
                type="submit"
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <Save size={20} />
                )}
                {loading ? 'Creating...' : 'Create Product'}
              </GlassButton>
            </div>
          </div>
        </GlassCard>
        </form>
      </div>

      {/* New Category Modal */}
      {showNewCategory && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard className="w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Category</h3>
              <GlassButton
                onClick={() => setShowNewCategory(false)}
                className="p-1"
              >
                ✕
              </GlassButton>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter category name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <select
                  value={newCategory.color}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {colorOptions.map(color => (
                    <option key={color.value} value={color.value}>
                      {color.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newCategory.description}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  placeholder="Enter category description"
                />
              </div>

              <div className="flex gap-3">
                <GlassButton
                  onClick={handleCreateCategory}
                  disabled={!newCategory.name.trim()}
                  className="flex-1"
                >
                  Create Category
                </GlassButton>
                <GlassButton
                  onClick={() => setShowNewCategory(false)}
                  variant="secondary"
                >
                  Cancel
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* New Supplier Modal */}
      {showNewSupplier && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <GlassCard className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Supplier</h3>
              <GlassButton
                onClick={() => setShowNewSupplier(false)}
                className="p-1"
              >
                ✕
              </GlassButton>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Supplier Name *
                  </label>
                  <input
                    type="text"
                    value={newSupplier.name}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter supplier name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    value={newSupplier.contact_person}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, contact_person: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Contact person name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={newSupplier.email}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="supplier@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+255..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={newSupplier.city}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Dar es Salaam"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Lead Time (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={newSupplier.lead_time_days}
                    onChange={(e) => setNewSupplier(prev => ({ ...prev, lead_time_days: parseInt(e.target.value) || 7 }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                  placeholder="Enter supplier address"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Terms
                </label>
                <input
                  type="text"
                  value={newSupplier.payment_terms}
                  onChange={(e) => setNewSupplier(prev => ({ ...prev, payment_terms: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., Net 30, COD"
                />
              </div>

              <div className="flex gap-3">
                <GlassButton
                  onClick={handleCreateSupplier}
                  disabled={!newSupplier.name.trim()}
                  className="flex-1"
                >
                  Create Supplier
                </GlassButton>
                <GlassButton
                  onClick={() => setShowNewSupplier(false)}
                  variant="secondary"
                >
                  Cancel
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default NewInventoryPage;