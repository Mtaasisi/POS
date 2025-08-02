import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  createSparePart, 
  updateSparePart, 
  getSparePart,
  SparePart 
} from '../../lib/inventoryApi';
import GlassCard from '../ui/GlassCard';
import GlassButton from '../ui/GlassButton';
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
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SparePartFormData {
  name: string;
  description: string;
  category: 'screen' | 'battery' | 'camera' | 'speaker' | 'microphone' | 'charging_port' | 'motherboard' | 'other';
  brand: string;
  model_compatibility: string[];
  price: number;
  cost: number;
  stock_quantity: number;
  min_stock_level: number;
  supplier: string;
  part_number: string;
  is_active: boolean;
}

const SparePartForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const [formData, setFormData] = useState<SparePartFormData>({
    name: '',
    description: '',
    category: 'other',
    brand: '',
    model_compatibility: [],
    price: 0,
    cost: 0,
    stock_quantity: 0,
    min_stock_level: 5,
    supplier: '',
    part_number: '',
    is_active: true
  });

  const [newModel, setNewModel] = useState('');
  const [errors, setErrors] = useState<Partial<SparePartFormData>>({});

  useEffect(() => {
    if (id) {
      setIsEdit(true);
      loadSparePart();
    }
  }, [id]);

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
          brand: part.brand || '',
          model_compatibility: part.model_compatibility || [],
          price: part.price,
          cost: part.cost,
          stock_quantity: part.stock_quantity,
          min_stock_level: part.min_stock_level,
          supplier: part.supplier || '',
          part_number: part.part_number || '',
          is_active: part.is_active
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

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (formData.price < 0) {
      newErrors.price = 'Price must be positive';
    }

    if (formData.cost < 0) {
      newErrors.cost = 'Cost must be positive';
    }

    if (formData.stock_quantity < 0) {
      newErrors.stock_quantity = 'Stock quantity must be positive';
    }

    if (formData.min_stock_level < 0) {
      newErrors.min_stock_level = 'Minimum stock level must be positive';
    }

    setErrors(newErrors);
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

  const categories = [
    { value: 'screen', label: 'Screen', icon: <Smartphone className="w-4 h-4" /> },
    { value: 'battery', label: 'Battery', icon: <Battery className="w-4 h-4" /> },
    { value: 'camera', label: 'Camera', icon: <Camera className="w-4 h-4" /> },
    { value: 'speaker', label: 'Speaker', icon: <Speaker className="w-4 h-4" /> },
    { value: 'microphone', label: 'Microphone', icon: <Mic className="w-4 h-4" /> },
    { value: 'charging_port', label: 'Charging Port', icon: <Zap className="w-4 h-4" /> },
    { value: 'motherboard', label: 'Motherboard', icon: <Cpu className="w-4 h-4" /> },
    { value: 'other', label: 'Other', icon: <Package className="w-4 h-4" /> }
  ];

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading spare part details...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <GlassButton
            variant="outline"
            onClick={() => navigate('/spare-parts')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </GlassButton>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {isEdit ? 'Edit Spare Part' : 'Add New Spare Part'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {isEdit ? 'Update spare part information' : 'Create a new spare part for your inventory'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Basic Information</h2>
              <p className="text-gray-600 dark:text-gray-400">Essential details about the spare part</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Part Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="e.g., iPhone 15 Pro Screen"
              />
              {errors.name && (
                <p className="text-red-500 text-sm mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <label
                    key={category.value}
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                      formData.category === category.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="radio"
                      name="category"
                      value={category.value}
                      checked={formData.category === category.value}
                      onChange={(e) => handleInputChange('category', e.target.value)}
                      className="sr-only"
                    />
                    {category.icon}
                    <span className="text-sm font-medium">{category.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Brand
              </label>
              <input
                type="text"
                value={formData.brand}
                onChange={(e) => handleInputChange('brand', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Apple, Samsung"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Part Number
              </label>
              <input
                type="text"
                value={formData.part_number}
                onChange={(e) => handleInputChange('part_number', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., IP15P-SCR-001"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Detailed description of the spare part..."
              />
            </div>
          </div>
        </GlassCard>

        {/* Pricing and Stock */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Pricing & Stock</h2>
              <p className="text-gray-600 dark:text-gray-400">Cost, pricing, and inventory management</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selling Price *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  className={`w-full pl-8 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.price ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.price && (
                <p className="text-red-500 text-sm mt-1">{errors.price}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Cost Price *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-gray-500">$</span>
                <input
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => handleInputChange('cost', parseFloat(e.target.value) || 0)}
                  className={`w-full pl-8 pr-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.cost ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="0.00"
                />
              </div>
              {errors.cost && (
                <p className="text-red-500 text-sm mt-1">{errors.cost}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Stock Quantity *
              </label>
              <input
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => handleInputChange('stock_quantity', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.stock_quantity ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="0"
              />
              {errors.stock_quantity && (
                <p className="text-red-500 text-sm mt-1">{errors.stock_quantity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Min Stock Level *
              </label>
              <input
                type="number"
                value={formData.min_stock_level}
                onChange={(e) => handleInputChange('min_stock_level', parseInt(e.target.value) || 0)}
                className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.min_stock_level ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="5"
              />
              {errors.min_stock_level && (
                <p className="text-red-500 text-sm mt-1">{errors.min_stock_level}</p>
              )}
            </div>
          </div>

          {/* Stock Status Indicator */}
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3">
              {formData.stock_quantity === 0 ? (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              ) : formData.stock_quantity <= formData.min_stock_level ? (
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-500" />
              )}
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Stock Status: {
                    formData.stock_quantity === 0 ? 'Out of Stock' :
                    formData.stock_quantity <= formData.min_stock_level ? 'Low Stock' :
                    'In Stock'
                  }
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {formData.stock_quantity} units available
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Model Compatibility */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Tag className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Model Compatibility</h2>
              <p className="text-gray-600 dark:text-gray-400">Which device models this part is compatible with</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addModelCompatibility())}
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., iPhone 15 Pro, Galaxy S24"
              />
              <GlassButton
                type="button"
                onClick={addModelCompatibility}
                disabled={!newModel.trim()}
              >
                <Plus className="w-4 h-4" />
              </GlassButton>
            </div>

            {formData.model_compatibility.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.model_compatibility.map((model, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full"
                  >
                    <span className="text-sm">{model}</span>
                    <button
                      type="button"
                      onClick={() => removeModelCompatibility(index)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </GlassCard>

        {/* Supplier Information */}
        <GlassCard className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Building className="w-6 h-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Supplier Information</h2>
              <p className="text-gray-600 dark:text-gray-400">Where to source this part from</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Supplier
            </label>
            <input
              type="text"
              value={formData.supplier}
              onChange={(e) => handleInputChange('supplier', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., TechParts Inc, MobileParts Co"
            />
          </div>
        </GlassCard>

        {/* Form Actions */}
        <div className="flex items-center justify-between">
          <GlassButton
            type="button"
            variant="outline"
            onClick={() => navigate('/spare-parts')}
          >
            Cancel
          </GlassButton>
          
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Active</span>
            </label>
            
            <GlassButton
              type="submit"
              disabled={saving}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? 'Saving...' : (isEdit ? 'Update Part' : 'Create Part')}
            </GlassButton>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SparePartForm; 