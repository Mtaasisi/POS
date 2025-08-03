import React, { useState, useEffect } from 'react';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeft, Plus, Edit, Trash2, X, Search, Filter, Tag, RotateCcw, Save, Package } from 'lucide-react';
import { 
  getSparePartCategories, 
  getActiveSparePartCategories, 
  createSparePartCategory, 
  updateSparePartCategory, 
  deleteSparePartCategory, 
  restoreSparePartCategory,
  SparePartCategory,
  CreateSparePartCategoryData,
  UpdateSparePartCategoryData
} from '../lib/sparePartCategoryApi';

interface CategoryFormData {
  name: string;
  description: string;
  color: string;
  icon: string;
}

const SparePartCategoryManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<SparePartCategory[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<SparePartCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SparePartCategory | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDeletedCategories, setShowDeletedCategories] = useState(false);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    color: '#3B82F6',
    icon: 'package'
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
    { value: '#0284C7', label: 'Sky' },
    { value: '#84CC16', label: 'Lime' },
    { value: '#C026D3', label: 'Fuchsia' },
    { value: '#EA580C', label: 'Orange' },
    { value: '#4F46E5', label: 'Indigo' },
    { value: '#6B7280', label: 'Gray' }
  ];

  // Icon options for spare parts
  const iconOptions = [
    { value: 'smartphone', label: 'Smartphone' },
    { value: 'battery', label: 'Battery' },
    { value: 'camera', label: 'Camera' },
    { value: 'speaker', label: 'Speaker' },
    { value: 'mic', label: 'Microphone' },
    { value: 'zap', label: 'Charging Port' },
    { value: 'cpu', label: 'Motherboard' },
    { value: 'package', label: 'Package' },
    { value: 'wrench', label: 'Tools' },
    { value: 'settings', label: 'Settings' },
    { value: 'shield', label: 'Protection' },
    { value: 'wifi', label: 'Connectivity' }
  ];

  useEffect(() => {
    fetchCategories();
  }, [showDeletedCategories]);

  // Handle escape key to close edit modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowEditModal(false);
        setEditingCategory(null);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = showDeletedCategories 
        ? await getSparePartCategories()
        : await getActiveSparePartCategories();
      setCategories(data);
      setFilteredCategories(data);
    } catch (error: any) {
      setError(error.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const filterCategories = () => {
    if (!searchQuery.trim()) {
      setFilteredCategories(categories);
      return;
    }

    const filtered = categories.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      category.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCategories(filtered);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError('');
      
      const categoryData: CreateSparePartCategoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color,
        icon: formData.icon
      };

      const newCategory = await createSparePartCategory(categoryData);
      
      setCategories(prev => [newCategory, ...prev]);
      setFilteredCategories(prev => [newCategory, ...prev]);
      
      setSuccess('Spare part category created successfully');
      setShowAddForm(false);
      resetForm();
    } catch (error: any) {
      setError(error.message || 'Failed to create category');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;

    try {
      setIsUpdating(true);
      setError('');
      
      const categoryData: UpdateSparePartCategoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        color: formData.color,
        icon: formData.icon
      };
      
      const updatedCategory = await updateSparePartCategory(editingCategory.id, categoryData);
      
      setCategories(prev => prev.map(cat => 
        cat.id === editingCategory.id ? updatedCategory : cat
      ));
      setFilteredCategories(prev => prev.map(cat => 
        cat.id === editingCategory.id ? updatedCategory : cat
      ));
      
      setSuccess('Spare part category updated successfully');
      setEditingCategory(null);
      setShowEditModal(false);
      resetForm();
    } catch (error: any) {
      setError(error.message || 'Failed to update category');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteCategory = async (category: SparePartCategory) => {
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return;

    try {
      await deleteSparePartCategory(category.id);
      setCategories(prev => prev.filter(cat => cat.id !== category.id));
      setFilteredCategories(prev => prev.filter(cat => cat.id !== category.id));
      setSuccess('Category deleted successfully');
    } catch (error: any) {
      setError(error.message || 'Failed to delete category');
    }
  };

  const handleRestoreCategory = async (category: SparePartCategory) => {
    try {
      await restoreSparePartCategory(category.id);
      const updatedCategory = { ...category, is_active: true };
      setCategories(prev => prev.map(cat => 
        cat.id === category.id ? updatedCategory : cat
      ));
      setFilteredCategories(prev => prev.map(cat => 
        cat.id === category.id ? updatedCategory : cat
      ));
      setSuccess('Category restored successfully');
    } catch (error: any) {
      setError(error.message || 'Failed to restore category');
    }
  };

  const handleEditCategory = (category: SparePartCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color,
      icon: category.icon || 'package'
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
      icon: 'package'
    });
  };

  useEffect(() => {
    filterCategories();
  }, [searchQuery, categories]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 5000);
      return () => clearTimeout(timer);
    }
    if (error) {
      const timer = setTimeout(() => setError(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <GlassButton
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </GlassButton>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Spare Part Categories</h1>
              <p className="text-gray-600">Manage categories for spare parts inventory</p>
            </div>
          </div>
          <GlassButton
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Category
          </GlassButton>
        </div>

        {/* Messages */}
        {error && (
          <GlassCard className="mb-4 border-red-200 bg-red-50">
            <div className="flex items-center gap-2 text-red-700">
              <X className="w-4 h-4" />
              {error}
            </div>
          </GlassCard>
        )}

        {success && (
          <GlassCard className="mb-4 border-green-200 bg-green-50">
            <div className="flex items-center gap-2 text-green-700">
              <Save className="w-4 h-4" />
              {success}
            </div>
          </GlassCard>
        )}

        {/* Add Form */}
        {showAddForm && (
          <GlassCard className="mb-6">
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
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
                    value={formData.color}
                    onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {colorOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Icon
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {iconOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter description"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <GlassButton type="submit" className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Create Category
                </GlassButton>
                <GlassButton
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    resetForm();
                  }}
                  variant="outline"
                >
                  Cancel
                </GlassButton>
              </div>
            </form>
          </GlassCard>
        )}

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <GlassButton
            onClick={() => setShowDeletedCategories(!showDeletedCategories)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            {showDeletedCategories ? 'Show Active' : 'Show Deleted'}
          </GlassButton>
        </div>

        {/* Categories List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCategories.map((category) => (
            <GlassCard key={category.id} className="relative group">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: category.color }}
                  >
                    <Package className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-600">{category.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleEditCategory(category)}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  {category.is_active ? (
                    <button
                      onClick={() => handleDeleteCategory(category)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleRestoreCategory(category)}
                      className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
              {!category.is_active && (
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded-full">
                    Deleted
                  </span>
                </div>
              )}
            </GlassCard>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <GlassCard className="text-center py-12">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600">
              {searchQuery ? 'Try adjusting your search terms.' : 'Create your first spare part category to get started.'}
            </p>
          </GlassCard>
        )}

        {/* Edit Modal */}
        {showEditModal && editingCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <GlassCard className="w-full max-w-md">
              <form onSubmit={handleUpdateCategory} className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Edit Category
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category Name *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Color
                    </label>
                    <select
                      value={formData.color}
                      onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {colorOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Icon
                    </label>
                    <select
                      value={formData.icon}
                      onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      {iconOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <GlassButton type="submit" disabled={isUpdating} className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    {isUpdating ? 'Updating...' : 'Update Category'}
                  </GlassButton>
                  <GlassButton
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingCategory(null);
                      resetForm();
                    }}
                    variant="outline"
                  >
                    Cancel
                  </GlassButton>
                </div>
              </form>
            </GlassCard>
          </div>
        )}
      </div>
    </div>
  );
};

export default SparePartCategoryManagementPage; 