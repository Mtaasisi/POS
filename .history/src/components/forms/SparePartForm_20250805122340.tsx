import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  createSparePart, 
  updateSparePart, 
  getSparePart,
  SparePart,
  getSparePartCategoriesWithDetails,
  getSuppliers,
  Supplier
} from '../../lib/inventoryApi';
import { SparePartCategory } from '../../lib/sparePartCategoryApi';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
import BrandSuggestionInput from '../ui/BrandSuggestionInput';
import { 
  ArrowLeft, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Package,
  Smartphone,
  Battery,
  Camera,
  Speaker,
  Mic,
  Zap,
  Cpu,
  Tag,
  Building,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Info,
  Hash,
  FileText,
  Key,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  ChevronDown,
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

interface SparePartFormData {
  name: string;
  description: string;
  category: 'screen' | 'battery' | 'camera' | 'speaker' | 'microphone' | 'charging_port' | 'motherboard' | 'other';
  category_id?: string;
  brand: string;
  model_compatibility: string[];
  price: number;
  cost: number;
  stock_quantity: number;
  min_stock_level: number;
  supplier: string;
  part_number: string;
  is_active: boolean;
  warranty_period?: number;
  condition: 'new' | 'refurbished' | 'used' | 'damaged';
  notesExpanded: boolean;
}

const SparePartForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [categories, setCategories] = useState<SparePartCategory[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [brands, setBrands] = useState<Array<{ name: string; logo: string }>>([]);

  const [formData, setFormData] = useState<SparePartFormData>({
    name: '',
    description: '',
    category: 'other',
    category_id: '',
    brand: '',
    model_compatibility: [],
    price: 0,
    cost: 0,
    stock_quantity: 0,
    min_stock_level: 5,
    supplier: '',
    part_number: '',
    is_active: true,
    warranty_period: 12,
    condition: 'new',
    notesExpanded: false
  });

  const [newModel, setNewModel] = useState('');
  const [errors, setErrors] = useState<Partial<SparePartFormData>>({});
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    loadCategories();
    loadSuppliers();
    loadBrands();
    if (id) {
      setIsEdit(true);
      loadSparePart();
    }
  }, [id]);

  const loadCategories = async () => {
    try {
      const categoriesData = await getSparePartCategoriesWithDetails();
      setCategories(categoriesData);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadSuppliers = async () => {
    try {
      const suppliersData = await getSuppliers();
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const loadBrands = async () => {
    try {
      const { getActiveBrands } = await import('../../lib/brandApi');
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

  const loadSparePart = async () => {
    if (!id) return;
    
    setLoading(true);
    try {
      const part = await getSparePart(id);
      if (part) {
        setFormData({
          name: part.name,
          description: part.description || '',
          category: part.category,
          category_id: part.category_id || '',
          brand: part.brand || '',
          model_compatibility: part.model_compatibility || [],
          price: part.price,
          cost: part.cost,
          stock_quantity: part.stock_quantity,
          min_stock_level: part.min_stock_level,
          supplier: part.supplier || '',
          part_number: part.part_number || '',
          is_active: part.is_active,
          warranty_period: part.warranty_period || 0,
          condition: part.condition || 'new',
          notesExpanded: false // Ensure notesExpanded is false on load
        });
      }
    } catch (error) {
      console.error('Error loading spare part:', error);
      toast.error('Failed to load spare part details');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<SparePartFormData> = {};
    const newFieldErrors: { [key: string]: boolean } = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
      newFieldErrors.name = true;
    }

    if (formData.price < 0) {
      newErrors.price = 'Price must be positive';
      newFieldErrors.price = true;
    }

    if (formData.cost < 0) {
      newErrors.cost = 'Cost must be positive';
      newFieldErrors.cost = true;
    }

    if (formData.stock_quantity < 0) {
      newErrors.stock_quantity = 'Stock quantity must be positive';
      newFieldErrors.stock_quantity = true;
    }

    if (formData.min_stock_level < 0) {
      newErrors.min_stock_level = 'Minimum stock level must be positive';
      newFieldErrors.min_stock_level = true;
    }

    setErrors(newErrors);
    setFieldErrors(newFieldErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors before saving');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && id) {
        await updateSparePart(id, formData);
        toast.success('Spare part updated successfully');
      } else {
        await createSparePart(formData);
        toast.success('Spare part created successfully');
      }
      navigate('/spare-parts');
    } catch (error) {
      console.error('Error saving spare part:', error);
      toast.error('Failed to save spare part');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof SparePartFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const addModelCompatibility = () => {
    if (newModel.trim() && !formData.model_compatibility.includes(newModel.trim())) {
      handleInputChange('model_compatibility', [...formData.model_compatibility, newModel.trim()]);
      setNewModel('');
    }
  };

  const removeModelCompatibility = (index: number) => {
    const updated = formData.model_compatibility.filter((_, i) => i !== index);
    handleInputChange('model_compatibility', updated);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'screen': return <Smartphone className="w-5 h-5" />;
      case 'battery': return <Battery className="w-5 h-5" />;
      case 'camera': return <Camera className="w-5 h-5" />;
      case 'speaker': return <Speaker className="w-5 h-5" />;
      case 'microphone': return <Mic className="w-5 h-5" />;
      case 'charging_port': return <Zap className="w-5 h-5" />;
      case 'motherboard': return <Cpu className="w-5 h-5" />;
      default: return <Package className="w-5 h-5" />;
    }
  };

  const categoryOptions = [
    { value: 'screen', label: 'Screen', icon: <Smartphone className="w-4 h-4" /> },
    { value: 'battery', label: 'Battery', icon: <Battery className="w-4 h-4" /> },
    { value: 'camera', label: 'Camera', icon: <Camera className="w-4 h-4" /> },
    { value: 'speaker', label: 'Speaker', icon: <Speaker className="w-4 h-4" /> },
    { value: 'microphone', label: 'Microphone', icon: <Mic className="w-4 h-4" /> },
    { value: 'charging_port', label: 'Charging Port', icon: <Zap className="w-4 h-4" /> },
    { value: 'motherboard', label: 'Motherboard', icon: <Cpu className="w-4 h-4" /> },
    { value: 'other', label: 'Other', icon: <Package className="w-4 h-4" /> }
  ];

  // Calculate form completion percentage
  const getFormCompletion = () => {
    const requiredFields = [
      formData.name ? 1 : 0,
      formData.category ? 1 : 0,
      formData.price > 0 ? 1 : 0,
      formData.cost > 0 ? 1 : 0,
      formData.stock_quantity >= 0 ? 1 : 0,
      formData.min_stock_level >= 0 ? 1 : 0
    ];
    return Math.round((requiredFields.reduce((a, b) => a + b, 0) / requiredFields.length) * 100);
  };

  const completionPercentage = getFormCompletion();

  // Helper function to format numbers with commas
  const formatNumber = (value: number): string => {
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Helper function to parse formatted number
  const parseFormattedNumber = (value: string): number => {
    return parseInt(value.replace(/,/g, '')) || 0;
  };

  // Helper function to handle field focus and clear
  const handleFieldFocus = (field: keyof SparePartFormData) => {
    if (formData[field] === 0) {
      handleInputChange(field, '');
    }
  };

  // Helper function to handle field blur and format
  const handleFieldBlur = (field: keyof SparePartFormData, value: string) => {
    const numValue = parseFormattedNumber(value);
    handleInputChange(field, numValue);
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 h-full overflow-y-auto pt-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading spare part details...</p>
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
                <h2 className="text-lg font-bold text-gray-900">Spare Part Form</h2>
                <p className="text-xs text-gray-600">
                  {isEdit ? 'Update existing part details' : 'Create a new spare part'}
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

        <GlassCard className="mb-6">
          {/* Unified Spare Part Form */}
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
              
              <div className="space-y-6">
                {/* Part Name and Supplier Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Name */}
                  <div>
                    <label className={`block mb-2 font-medium ${fieldErrors.name ? 'text-red-600' : 'text-gray-700'}`}>
                      Name *
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${fieldErrors.name ? 'border-red-500 focus:border-red-600' : !formData.name ? 'border-yellow-300 focus:border-yellow-500' : 'border-gray-300 focus:border-blue-500'}`}
                        placeholder="e.g., iPhone 15 Pro Screen"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                      <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    </div>
                    {fieldErrors.name && (
                      <div className="text-red-500 text-xs mt-1">Name is required</div>
                    )}
                  </div>

                  {/* Supplier */}
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Supplier</label>
                    <div className="relative">
                      <select
                        value={formData.supplier}
                        onChange={(e) => handleInputChange('supplier', e.target.value)}
                        className="w-full py-3 pl-12 pr-10 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none appearance-none"
                      >
                        <option value="">Select a supplier</option>
                        {suppliers.map((supplier) => (
                          <option key={supplier.id} value={supplier.name}>
                            {supplier.name}
                          </option>
                        ))}
                      </select>
                      <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    </div>
                  </div>
                </div>

                {/* Brand and Part Number Row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Brand */}
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Brand *</label>
                    <BrandSuggestionInput
                      value={formData.brand}
                      onChange={(value) => handleInputChange('brand', value)}
                      brands={brands}
                      placeholder="Select or enter brand"
                      className="w-full"
                    />
                  </div>

                  {/* Part/Model Number */}
                  <div>
                    <label className="block text-gray-700 mb-2 font-medium">Part/Model Number *</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formData.part_number}
                        onChange={(e) => handleInputChange('part_number', e.target.value)}
                        className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                        placeholder="e.g., IP15P-SCR-001 or A2179"
                        autoComplete="off"
                        autoCorrect="off"
                        spellCheck={false}
                      />
                      <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                    </div>
                  </div>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Category *</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => {
                          handleInputChange('category_id', category.id);
                          handleInputChange('category', category.name.toLowerCase().replace(' ', '_') as any);
                        }}
                        className={`flex items-center gap-2 p-3 border rounded-lg transition-all duration-200 focus:outline-none ${
                          formData.category_id === category.id
                            ? 'bg-gradient-to-br from-blue-100 to-blue-200 border-blue-500 ring-2 ring-blue-400 scale-105'
                            : 'bg-white border-gray-200 hover:shadow-lg'
                        }`}
                        style={{
                          borderColor: formData.category_id === category.id ? category.color : undefined
                        }}
                      >
                        <div 
                          className="w-6 h-6 rounded flex items-center justify-center"
                          style={{ backgroundColor: category.color }}
                        >
                          <Package className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-sm font-medium">{category.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-gray-700 mb-2 font-medium">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full py-3 pl-4 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                    placeholder="Detailed description of the spare part..."
                    rows={3}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>

            {/* Pricing and Stock Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <DollarSign size={20} className="text-green-600" />
                Pricing & Stock
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Cost Price */}
                <div>
                  <label className={`block mb-2 font-medium ${fieldErrors.cost ? 'text-red-600' : 'text-gray-700'}`}>
                    Cost Price (TZS) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumber(formData.cost)}
                      onChange={(e) => handleFieldBlur('cost', e.target.value)}
                      onFocus={() => handleFieldFocus('cost')}
                      className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${fieldErrors.cost ? 'border-red-500 focus:border-red-600' : !formData.cost ? 'border-yellow-300 focus:border-yellow-500' : 'border-gray-300 focus:border-blue-500'}`}
                      placeholder="0"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  </div>
                  {fieldErrors.cost && (
                    <div className="text-red-500 text-xs mt-1">Cost must be positive</div>
                  )}
                </div>

                {/* Selling Price */}
                <div>
                  <label className={`block mb-2 font-medium ${fieldErrors.price ? 'text-red-600' : 'text-gray-700'}`}>
                    Selling Price (TZS) *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumber(formData.price)}
                      onChange={(e) => handleFieldBlur('price', e.target.value)}
                      onFocus={() => handleFieldFocus('price')}
                      className={`w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none ${fieldErrors.price ? 'border-red-500 focus:border-red-600' : !formData.price ? 'border-yellow-300 focus:border-yellow-500' : 'border-gray-300 focus:border-blue-500'}`}
                      placeholder="0"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  </div>
                  {fieldErrors.price && (
                    <div className="text-red-500 text-xs mt-1">Price must be positive</div>
                  )}
                </div>

                {/* Stock Quantity */}
                <div>
                  <label className={`block mb-2 font-medium ${fieldErrors.stock_quantity ? 'text-red-600' : 'text-gray-700'}`}>
                    Stock Quantity *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumber(formData.stock_quantity)}
                      onChange={(e) => handleFieldBlur('stock_quantity', e.target.value)}
                      onFocus={() => handleFieldFocus('stock_quantity')}
                      className={`w-full py-3 px-12 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none text-center ${fieldErrors.stock_quantity ? 'border-red-500 focus:border-red-600' : formData.stock_quantity < 0 ? 'border-yellow-300 focus:border-yellow-500' : 'border-gray-300 focus:border-blue-500'}`}
                      placeholder="0"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2">
                      <button
                        type="button"
                        onClick={() => handleInputChange('stock_quantity', Math.max(0, (formData.stock_quantity || 0) - 1))}
                        className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={formData.stock_quantity <= 0}
                      >
                        <Minus size={18} />
                      </button>
                    </div>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <button
                        type="button"
                        onClick={() => handleInputChange('stock_quantity', (formData.stock_quantity || 0) + 1)}
                        className="w-10 h-10 flex items-center justify-center rounded-md bg-blue-100 hover:bg-blue-200 text-blue-600 transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                  {fieldErrors.stock_quantity && (
                    <div className="text-red-500 text-xs mt-1">Stock quantity must be positive</div>
                  )}
                </div>

                {/* Min Stock Level */}
                <div>
                  <label className={`block mb-2 font-medium ${fieldErrors.min_stock_level ? 'text-red-600' : 'text-gray-700'}`}>
                    Min Stock Level *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumber(formData.min_stock_level)}
                      onChange={(e) => handleFieldBlur('min_stock_level', e.target.value)}
                      onFocus={() => handleFieldFocus('min_stock_level')}
                      className={`w-full py-3 px-12 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none text-center ${fieldErrors.min_stock_level ? 'border-red-500 focus:border-red-600' : formData.min_stock_level < 0 ? 'border-yellow-300 focus:border-yellow-500' : 'border-gray-300 focus:border-blue-500'}`}
                      placeholder="5"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2">
                      <button
                        type="button"
                        onClick={() => handleInputChange('min_stock_level', Math.max(0, (formData.min_stock_level || 0) - 1))}
                        className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={(formData.min_stock_level || 0) <= 0}
                      >
                        <Minus size={18} />
                      </button>
                    </div>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <button
                        type="button"
                        onClick={() => handleInputChange('min_stock_level', (formData.min_stock_level || 0) + 1)}
                        className="w-10 h-10 flex items-center justify-center rounded-md bg-orange-100 hover:bg-orange-200 text-orange-600 transition-colors"
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                  {fieldErrors.min_stock_level && (
                    <div className="text-red-500 text-xs mt-1">Minimum stock level must be positive</div>
                  )}
                </div>
              </div>

              {/* Profit Calculator */}
              {(formData.price > 0 || formData.cost > 0) && (
                <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <DollarSign size={16} className="text-green-600" />
                    Profit Calculator
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-white rounded-lg border border-green-200">
                      <div className="text-2xl font-bold text-green-600">
                        {formatNumber((formData.price - formData.cost) || 0)} TZS
                      </div>
                      <div className="text-sm text-gray-600">Profit per Unit</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600">
                        {formData.cost > 0 ? Math.round(((formData.price - formData.cost) / formData.cost) * 100) : 0}%
                      </div>
                      <div className="text-sm text-gray-600">Markup %</div>
                    </div>
                    <div className="text-center p-3 bg-white rounded-lg border border-purple-200">
                      <div className="text-2xl font-bold text-purple-600">
                        {formData.price > 0 ? Math.round(((formData.price - formData.cost) / formData.price) * 100) : 0}%
                      </div>
                      <div className="text-sm text-gray-600">Profit Margin %</div>
                    </div>
                  </div>
                  {formData.stock_quantity > 0 && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-gray-200">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-gray-900">
                          Total Potential Profit: {formatNumber((((formData.price - formData.cost) || 0) * formData.stock_quantity))} TZS
                        </div>
                        <div className="text-sm text-gray-600">
                          Based on current stock ({formData.stock_quantity} units)
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Stock Status Indicator */}
              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex items-center gap-3">
                  {formData.stock_quantity === 0 ? (
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                  ) : formData.stock_quantity <= formData.min_stock_level ? (
                    <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  ) : (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      Stock Status: {
                        formData.stock_quantity === 0 ? 'Out of Stock' :
                        formData.stock_quantity <= formData.min_stock_level ? 'Low Stock' :
                        'In Stock'
                      }
                    </p>
                    <p className="text-sm text-gray-600">
                      {formData.stock_quantity} units available
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Model Compatibility Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Tag size={20} className="text-purple-600" />
                Model Compatibility
              </h3>
              
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={newModel}
                      onChange={(e) => setNewModel(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addModelCompatibility())}
                      className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="e.g., iPhone 15 Pro, Galaxy S24"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  </div>
                  <button
                    type="button"
                    onClick={addModelCompatibility}
                    disabled={!newModel.trim()}
                    className="px-4 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {formData.model_compatibility.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.model_compatibility.map((model, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-800 rounded-full"
                      >
                        <span className="text-sm">{model}</span>
                        <button
                          type="button"
                          onClick={() => removeModelCompatibility(index)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Additional Information Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Info size={20} className="text-blue-600" />
                Additional Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Warranty Period */}
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Warranty Period (Months)</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatNumber(formData.warranty_period || 0)}
                      onChange={(e) => handleFieldBlur('warranty_period', e.target.value)}
                      onFocus={() => handleFieldFocus('warranty_period')}
                      className="w-full py-3 px-12 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none text-center"
                      placeholder="12"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                    <div className="absolute left-2 top-1/2 -translate-y-1/2">
                      <button
                        type="button"
                        onClick={() => handleInputChange('warranty_period', Math.max(0, (formData.warranty_period || 0) - 1))}
                        className="w-10 h-10 flex items-center justify-center rounded-md bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={(formData.warranty_period || 0) <= 0}
                      >
                        <Minus size={18} />
                      </button>
                    </div>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                      <button
                        type="button"
                        onClick={() => handleInputChange('warranty_period', Math.min(60, (formData.warranty_period || 0) + 1))}
                        className="w-10 h-10 flex items-center justify-center rounded-md bg-green-100 hover:bg-green-200 text-green-600 transition-colors"
                        disabled={(formData.warranty_period || 0) >= 60}
                      >
                        <Plus size={18} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Location/Warehouse */}
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Storage Location</label>
                  <div className="relative">
                    <input
                      type="text"
                      className="w-full py-3 pl-12 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                      placeholder="e.g., Warehouse A, Shelf B3"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                    />
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                  </div>
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-gray-700 mb-2 font-medium">Condition</label>
                  <div className="flex gap-2">
                    {[
                      { value: 'new', label: 'New', color: '#10B981', bgColor: '#ECFDF5', borderColor: '#10B981' },
                      { value: 'refurbished', label: 'Refurbished', color: '#3B82F6', bgColor: '#EFF6FF', borderColor: '#3B82F6' },
                      { value: 'used', label: 'Used', color: '#F59E0B', bgColor: '#FFFBEB', borderColor: '#F59E0B' },
                      { value: 'damaged', label: 'Damaged', color: '#EF4444', bgColor: '#FEF2F2', borderColor: '#EF4444' }
                    ].map((condition) => (
                      <button
                        key={condition.value}
                        type="button"
                        onClick={() => handleInputChange('condition', condition.value)}
                        className={`flex items-center gap-2 px-4 py-2 border-2 rounded-lg transition-all duration-200 focus:outline-none ${
                          formData.condition === condition.value
                            ? 'shadow-lg scale-105 font-semibold'
                            : 'bg-white hover:shadow-md'
                        }`}
                        style={{
                          backgroundColor: formData.condition === condition.value ? condition.bgColor : 'white',
                          borderColor: formData.condition === condition.value ? condition.borderColor : '#E5E7EB',
                          color: formData.condition === condition.value ? condition.color : '#6B7280'
                        }}
                      >
                        <div 
                          className={`w-3 h-3 rounded-full ${
                            formData.condition === condition.value ? 'ring-2 ring-white' : ''
                          }`}
                          style={{ backgroundColor: condition.color }}
                        />
                        <span className="text-sm">{condition.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-gray-700 font-medium">Notes</label>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, notesExpanded: !prev.notesExpanded }))}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                  >
                    {formData.notesExpanded ? 'Minimize' : 'Add Notes'}
                    {formData.notesExpanded ? <ChevronDown size={16} /> : <Plus size={16} />}
                  </button>
                </div>
                {formData.notesExpanded && (
                  <textarea
                    className="w-full py-3 pl-4 pr-4 bg-white/30 backdrop-blur-md border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
                    placeholder="Additional notes, special instructions, or important details about this spare part..."
                    rows={3}
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                  />
                )}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 mt-6">
              <button
                type="button"
                className="px-6 py-3 rounded-lg bg-gray-200 text-gray-800 font-semibold hover:bg-gray-300 transition"
                onClick={() => navigate('/spare-parts')}
                disabled={saving}
              >
                Cancel
              </button>
              
              <button
                type="button"
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 ${
                  completionPercentage === 100 
                    ? 'bg-green-600 text-white hover:bg-green-700 shadow-lg' 
                    : completionPercentage >= 70
                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                    : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                }`}
                onClick={handleSubmit}
                disabled={saving || completionPercentage < 100}
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Saving...
                  </div>
                ) : completionPercentage === 100 ? (
                  <div className="flex items-center gap-2">
                    <Save size={16} />
                    {isEdit ? 'Update Part' : 'Create Part'}
                  </div>
                ) : completionPercentage >= 70 ? (
                  <div className="flex items-center gap-2">
                    <span>Almost Ready ({completionPercentage}%)</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span>Complete Form ({completionPercentage}%)</span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};

export default SparePartForm; 