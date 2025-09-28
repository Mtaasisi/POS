import React, { useState, useEffect } from 'react';
import { 
  Layers, Plus, Edit, Trash2, Save, X, Eye, EyeOff, 
  Monitor, PhoneCall, Cable, Settings, Check, AlertCircle,
  FileText, HardDrive, Zap, Cpu, Palette, Battery, Camera
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import { 
  specificationService,
  SpecificationCategory,
  Specification,
  CreateCategoryData,
  CreateSpecificationData,
  UpdateCategoryData,
  UpdateSpecificationData
} from '../../../../lib/specificationService';

interface SpecificationsTabProps {}

const SpecificationsTab: React.FC<SpecificationsTabProps> = () => {
  const [activeCategory, setActiveCategory] = useState<string>('laptop');
  const [editingSpec, setEditingSpec] = useState<Specification | null>(null);
  const [categories, setCategories] = useState<SpecificationCategory[]>([]);
  const [specifications, setSpecifications] = useState<Specification[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showEditCategoryModal, setShowEditCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SpecificationCategory | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Form state for adding/editing specifications
  const [formData, setFormData] = useState({
    spec_key: '',
    name: '',
    type: 'text' as 'text' | 'number' | 'boolean' | 'select',
    options: [] as string[],
    unit: '',
    placeholder: '',
    icon: 'Settings'
  });

  const [newOption, setNewOption] = useState('');

  // Load data from database
  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    if (activeCategory) {
      loadSpecifications(activeCategory);
    }
  }, [activeCategory]);

  const loadCategories = async () => {
    try {
      const data = await specificationService.getCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Failed to load categories');
    }
  };

  const loadSpecifications = async (categoryId: string) => {
    try {
      const category = categories.find(cat => cat.category_id === categoryId);
      if (category) {
        const data = await specificationService.getSpecificationsByCategory(category.id);
        setSpecifications(data);
      }
    } catch (error) {
      console.error('Error loading specifications:', error);
      toast.error('Failed to load specifications');
    }
  };

  // Form state for adding/editing categories
  const [categoryFormData, setCategoryFormData] = useState({
    category_id: '',
    name: '',
    color: 'blue',
    icon: 'Monitor',
    description: ''
  });

  const handleAddSpecification = () => {
    setFormData({
      spec_key: '',
      name: '',
      type: 'text',
      options: [],
      unit: '',
      placeholder: '',
      icon: 'Settings'
    });
    setShowAddModal(true);
  };

  const handleEditSpecification = (spec: Specification) => {
    setFormData({
      spec_key: spec.spec_key,
      name: spec.name,
      type: spec.type,
      options: spec.options || [],
      unit: spec.unit || '',
      placeholder: spec.placeholder || '',
      icon: spec.icon
    });
    setEditingSpec(spec);
    setShowEditModal(true);
  };

  const handleSaveSpecification = async () => {
    if (!formData.spec_key || !formData.name) {
      toast.error('Key and name are required');
      return;
    }

    setIsLoading(true);
    try {
      const activeCategoryData = categories.find(cat => cat.category_id === activeCategory);
      if (!activeCategoryData) {
        toast.error('Active category not found');
        return;
      }

      const specData: CreateSpecificationData = {
        category_id: activeCategoryData.id,
        spec_key: formData.spec_key,
        name: formData.name,
        type: formData.type,
        icon: formData.icon,
        options: formData.options,
        unit: formData.unit || undefined,
        placeholder: formData.placeholder || undefined
      };

      if (editingSpec) {
        await specificationService.updateSpecification(editingSpec.id, specData);
      } else {
        await specificationService.createSpecification(specData);
      }

      setShowAddModal(false);
      setShowEditModal(false);
      setEditingSpec(null);
      loadSpecifications(activeCategory);
    } catch (error) {
      console.error('Error saving specification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSpecification = async (specId: string) => {
    if (!confirm('Are you sure you want to delete this specification?')) {
      return;
    }

    setIsLoading(true);
    try {
      await specificationService.deleteSpecification(specId);
      loadSpecifications(activeCategory);
    } catch (error) {
      console.error('Error deleting specification:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addOption = () => {
    if (newOption.trim() && !formData.options.includes(newOption.trim())) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, newOption.trim()]
      }));
      setNewOption('');
    }
  };

  const removeOption = (option: string) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter(opt => opt !== option)
    }));
  };

  // Category management functions
  const handleAddCategory = () => {
    setCategoryFormData({
      category_id: '',
      name: '',
      color: 'blue',
      icon: 'Monitor',
      description: ''
    });
    setShowCategoryModal(true);
  };

  const handleEditCategory = (category: SpecificationCategory) => {
    setCategoryFormData({
      category_id: category.category_id,
      name: category.name,
      color: category.color,
      icon: category.icon,
      description: category.description || ''
    });
    setEditingCategory(category);
    setShowEditCategoryModal(true);
  };

  const handleSaveCategory = async () => {
    if (!categoryFormData.category_id || !categoryFormData.name) {
      toast.error('Category ID and name are required');
      return;
    }

    setIsLoading(true);
    try {
      const categoryData: CreateCategoryData = {
        category_id: categoryFormData.category_id,
        name: categoryFormData.name,
        icon: categoryFormData.icon,
        color: categoryFormData.color,
        description: categoryFormData.description || undefined
      };

      if (editingCategory) {
        await specificationService.updateCategory(editingCategory.id, categoryData);
      } else {
        await specificationService.createCategory(categoryData);
      }

      setShowCategoryModal(false);
      setShowEditCategoryModal(false);
      setEditingCategory(null);
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? This will also delete all specifications in this category.')) {
      return;
    }

    setIsLoading(true);
    try {
      const category = categories.find(cat => cat.category_id === categoryId);
      if (category) {
        await specificationService.deleteCategory(category.id);
        loadCategories();
        // Switch to first available category if current one was deleted
        if (activeCategory === categoryId) {
          const remainingCategories = categories.filter(cat => cat.category_id !== categoryId);
          if (remainingCategories.length > 0) {
            setActiveCategory(remainingCategories[0].category_id);
          }
        }
      }
    } catch (error) {
      console.error('Error deleting category:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case 'text': return FileText;
      case 'number': return Zap;
      case 'boolean': return Check;
      case 'select': return Settings;
      default: return FileText;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'text': return 'blue';
      case 'number': return 'green';
      case 'boolean': return 'purple';
      case 'select': return 'orange';
      default: return 'gray';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <Layers className="w-8 h-8 text-blue-600" />
            Specification Management
          </h2>
          <p className="text-gray-600 mt-1">
            Manage product specifications and attributes
          </p>
        </div>
        <div className="flex gap-3">
          <GlassButton
            onClick={handleAddCategory}
            icon={<Plus size={16} />}
            className="bg-green-600 text-white hover:bg-green-700"
          >
            Add Category
          </GlassButton>
          <GlassButton
            onClick={handleAddSpecification}
            icon={<Plus size={16} />}
            className="bg-blue-600 text-white hover:bg-blue-700"
          >
            Add Specification
          </GlassButton>
        </div>
      </div>

      {/* Category Tabs */}
      <GlassCard className="p-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => {
            // Get icon component dynamically
            const getIconComponent = (iconName: string) => {
              const iconMap: Record<string, any> = {
                'Monitor': Monitor,
                'PhoneCall': PhoneCall,
                'Cable': Cable,
                'Settings': Settings,
                'HardDrive': HardDrive,
                'Camera': Camera,
                'Speaker': Speaker,
                'Headphones': Headphones,
                'Battery': Battery,
                'Wifi': Wifi,
                'Cpu': Cpu,
                'Palette': Palette,
                'Zap': Zap,
                'FileText': FileText,
                'Check': Check,
                'Hand': Hand,
                'Lightbulb': Lightbulb,
                'Fingerprint': Fingerprint,
                'ScanFace': ScanFace,
                'RotateCcw': RotateCcw,
                'PenTool': PenTool,
                'FastForward': FastForward,
                'BatteryCharging': BatteryCharging,
                'Droplets': Droplets,
                'Wind': Wind,
                'Shield': Shield,
                'Usb': Usb,
                'Bluetooth': Bluetooth,
                'Expand': Expand,
                'Radio': Radio,
                'Mic': Mic,
                'Eye': Eye,
                'Sun': Sun,
                'Power': Power,
                'Ruler': Ruler,
                'Unplug': Unplug,
                'Navigation': Navigation
              };
              return iconMap[iconName] || Monitor;
            };
            
            const IconComponent = getIconComponent(category.icon);
            const isSelected = activeCategory === category.category_id;
            const specs = specifications;
            
            return (
              <div key={category.id} className="relative group">
                <button
                  onClick={() => setActiveCategory(category.category_id)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                    isSelected
                      ? `bg-${category.color}-100 text-${category.color}-700 border-2 border-${category.color}-300`
                      : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent size={16} />
                  {category.name}
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                    {specs.length}
                  </span>
                </button>
                
                {/* Category management buttons */}
                <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditCategory(category);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors bg-white rounded shadow-sm"
                      title="Edit category"
                    >
                      <Edit size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCategory(category.category_id);
                      }}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors bg-white rounded shadow-sm"
                      title="Delete category"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      {/* Specifications by Type */}
      <div className="space-y-6">
        {Object.entries(
          specifications.reduce((acc, spec) => {
            if (!acc[spec.type]) acc[spec.type] = [];
            acc[spec.type].push(spec);
            return acc;
          }, {} as Record<string, Specification[]>)
        ).map(([type, specs]) => {
          if (specs.length === 0) return null;
          
          const TypeIcon = getIconForType(type);
          const typeColor = getTypeColor(type);
          
          return (
            <GlassCard key={type} className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <TypeIcon className={`w-5 h-5 text-${typeColor}-600`} />
                  {type === 'text' ? 'Text Fields' : 
                   type === 'number' ? 'Number Fields' : 
                   type === 'select' ? 'Dropdown Selections' : 
                   type === 'boolean' ? 'Yes/No Features' : type}
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    {specs.length} fields
                  </span>
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {specs.map((spec) => {
                  // Get icon component dynamically
                  const getSpecIconComponent = (iconName: string) => {
                    const iconMap: Record<string, any> = {
                      'Monitor': Monitor,
                      'PhoneCall': PhoneCall,
                      'Cable': Cable,
                      'Settings': Settings,
                      'HardDrive': HardDrive,
                      'Camera': Camera,
                      'Speaker': Speaker,
                      'Headphones': Headphones,
                      'Battery': Battery,
                      'Wifi': Wifi,
                      'Cpu': Cpu,
                      'Palette': Palette,
                      'Zap': Zap,
                      'FileText': FileText,
                      'Check': Check,
                      'Hand': Hand,
                      'Lightbulb': Lightbulb,
                      'Fingerprint': Fingerprint,
                      'ScanFace': ScanFace,
                      'RotateCcw': RotateCcw,
                      'PenTool': PenTool,
                      'FastForward': FastForward,
                      'BatteryCharging': BatteryCharging,
                      'Droplets': Droplets,
                      'Wind': Wind,
                      'Shield': Shield,
                      'Usb': Usb,
                      'Bluetooth': Bluetooth,
                      'Expand': Expand,
                      'Radio': Radio,
                      'Mic': Mic,
                      'Eye': Eye,
                      'Sun': Sun,
                      'Power': Power,
                      'Ruler': Ruler,
                      'Unplug': Unplug,
                      'Navigation': Navigation
                    };
                    return iconMap[iconName] || Settings;
                  };
                  
                  const SpecIcon = getSpecIconComponent(spec.icon);
                  
                  return (
                    <div key={spec.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <SpecIcon size={16} className="text-gray-500" />
                          <h4 className="font-medium text-gray-900">{spec.name}</h4>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleEditSpecification(spec)}
                            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                            title="Edit specification"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            onClick={() => handleDeleteSpecification(spec.id)}
                            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                            title="Delete specification"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Key:</span>
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">{spec.spec_key}</code>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Type:</span>
                          <span className={`px-2 py-1 rounded text-xs bg-${typeColor}-100 text-${typeColor}-700`}>
                            {spec.type}
                          </span>
                        </div>
                        
                        {spec.unit && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Unit:</span>
                            <span className="text-gray-500">{spec.unit}</span>
                          </div>
                        )}
                        
                        {spec.placeholder && (
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Placeholder:</span>
                            <span className="text-gray-500 italic">"{spec.placeholder}"</span>
                          </div>
                        )}
                        
                        {spec.options && spec.options.length > 0 && (
                          <div>
                            <span className="font-medium">Options:</span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {spec.options.slice(0, 3).map((option) => (
                                <span key={option} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                  {option}
                                </span>
                              ))}
                              {spec.options.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                                  +{spec.options.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Add/Edit Specification Modal */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {showAddModal ? 'Add New Specification' : 'Edit Specification'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setEditingSpec(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Key *
                    </label>
                    <input
                      type="text"
                      value={formData.spec_key}
                      onChange={(e) => setFormData(prev => ({ ...prev, spec_key: e.target.value }))}
                      placeholder="e.g., screen_size"
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., Screen Size"
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as any }))}
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="boolean">Boolean (Yes/No)</option>
                      <option value="select">Select (Dropdown)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icon
                    </label>
                    <select
                      value={formData.icon}
                      onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="Settings">Settings</option>
                      <option value="Monitor">Monitor</option>
                      <option value="PhoneCall">Phone</option>
                      <option value="Cable">Cable</option>
                      <option value="HardDrive">Hard Drive</option>
                      <option value="Camera">Camera</option>
                      <option value="Speaker">Speaker</option>
                      <option value="Headphones">Headphones</option>
                      <option value="Battery">Battery</option>
                      <option value="Wifi">WiFi</option>
                      <option value="Cpu">CPU</option>
                      <option value="Palette">Palette</option>
                      <option value="Zap">Zap</option>
                      <option value="FileText">File Text</option>
                      <option value="Check">Check</option>
                      <option value="Hand">Hand</option>
                      <option value="Lightbulb">Lightbulb</option>
                      <option value="Fingerprint">Fingerprint</option>
                      <option value="ScanFace">Face Scan</option>
                      <option value="RotateCcw">Rotate</option>
                      <option value="PenTool">Pen Tool</option>
                      <option value="FastForward">Fast Forward</option>
                      <option value="BatteryCharging">Battery Charging</option>
                      <option value="Droplets">Droplets</option>
                      <option value="Wind">Wind</option>
                      <option value="Shield">Shield</option>
                      <option value="Usb">USB</option>
                      <option value="Bluetooth">Bluetooth</option>
                      <option value="Expand">Expand</option>
                      <option value="Radio">Radio</option>
                      <option value="Mic">Microphone</option>
                      <option value="Eye">Eye</option>
                      <option value="Sun">Sun</option>
                      <option value="Power">Power</option>
                      <option value="Ruler">Ruler</option>
                      <option value="Unplug">Unplug</option>
                      <option value="Navigation">Navigation</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Unit
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
                      placeholder="e.g., inch, kg, GB"
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Placeholder
                  </label>
                  <input
                    type="text"
                    value={formData.placeholder}
                    onChange={(e) => setFormData(prev => ({ ...prev, placeholder: e.target.value }))}
                    placeholder="e.g., Enter screen size"
                    className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>

                {formData.type === 'select' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options
                    </label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newOption}
                          onChange={(e) => setNewOption(e.target.value)}
                          placeholder="Add option"
                          className="flex-1 py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addOption();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={addOption}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {formData.options.map((option) => (
                          <span
                            key={option}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                          >
                            {option}
                            <button
                              type="button"
                              onClick={() => removeOption(option)}
                              className="text-blue-500 hover:text-blue-700"
                            >
                              <X size={14} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setShowEditModal(false);
                    setEditingSpec(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSpecification}
                  disabled={isLoading}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Category Modal */}
      {(showCategoryModal || showEditCategoryModal) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-hidden">
            <div className="border-b border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-900">
                  {showCategoryModal ? 'Add New Category' : 'Edit Category'}
                </h3>
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setShowEditCategoryModal(false);
                    setEditingCategory(null);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category ID *
                  </label>
                    <input
                      type="text"
                      value={categoryFormData.category_id}
                      onChange={(e) => setCategoryFormData(prev => ({ ...prev, category_id: e.target.value }))}
                      placeholder="e.g., desktop, printer"
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={categoryFormData.name}
                    onChange={(e) => setCategoryFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Desktop Computer"
                    className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={categoryFormData.description}
                    onChange={(e) => setCategoryFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="e.g., Desktop computers and workstations"
                    className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <select
                      value={categoryFormData.color}
                      onChange={(e) => setCategoryFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="blue">Blue</option>
                      <option value="green">Green</option>
                      <option value="purple">Purple</option>
                      <option value="orange">Orange</option>
                      <option value="red">Red</option>
                      <option value="yellow">Yellow</option>
                      <option value="indigo">Indigo</option>
                      <option value="pink">Pink</option>
                      <option value="gray">Gray</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icon
                    </label>
                    <select
                      value={categoryFormData.icon}
                      onChange={(e) => setCategoryFormData(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
                    >
                      <option value="Monitor">Monitor</option>
                      <option value="PhoneCall">Phone</option>
                      <option value="Cable">Cable</option>
                      <option value="Settings">Settings</option>
                      <option value="HardDrive">Hard Drive</option>
                      <option value="Camera">Camera</option>
                      <option value="Speaker">Speaker</option>
                      <option value="Headphones">Headphones</option>
                      <option value="Battery">Battery</option>
                      <option value="Wifi">WiFi</option>
                      <option value="Cpu">CPU</option>
                      <option value="Palette">Palette</option>
                      <option value="Zap">Zap</option>
                      <option value="FileText">File Text</option>
                      <option value="Check">Check</option>
                      <option value="Hand">Hand</option>
                      <option value="Lightbulb">Lightbulb</option>
                      <option value="Fingerprint">Fingerprint</option>
                      <option value="ScanFace">Face Scan</option>
                      <option value="RotateCcw">Rotate</option>
                      <option value="PenTool">Pen Tool</option>
                      <option value="FastForward">Fast Forward</option>
                      <option value="BatteryCharging">Battery Charging</option>
                      <option value="Droplets">Droplets</option>
                      <option value="Wind">Wind</option>
                      <option value="Shield">Shield</option>
                      <option value="Usb">USB</option>
                      <option value="Bluetooth">Bluetooth</option>
                      <option value="Expand">Expand</option>
                      <option value="Radio">Radio</option>
                      <option value="Mic">Microphone</option>
                      <option value="Eye">Eye</option>
                      <option value="Sun">Sun</option>
                      <option value="Power">Power</option>
                      <option value="Ruler">Ruler</option>
                      <option value="Unplug">Unplug</option>
                      <option value="Navigation">Navigation</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowCategoryModal(false);
                    setShowEditCategoryModal(false);
                    setEditingCategory(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveCategory}
                  disabled={isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SpecificationsTab;
