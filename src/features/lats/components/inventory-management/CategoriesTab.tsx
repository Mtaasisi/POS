import React, { useState, useEffect } from 'react';
import GlassCard from '../../../shared/components/ui/GlassCard';
import GlassButton from '../../../shared/components/ui/GlassButton';
import SearchBar from '../../../shared/components/ui/SearchBar';
import { 
  Tag, Plus, Edit, Trash2, Search, Package, 
  CheckCircle, XCircle, FolderOpen
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCategories } from '../../../../hooks/useCategories';

interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  color?: string;
  icon?: string;
  is_active: boolean;
  product_count?: number;
  created_at: string;
  updated_at: string;
}

interface CategoryFormData {
  name: string;
  description: string;
  parent_id: string;
  color: string;
  icon: string;
}

const CategoriesTab: React.FC = () => {
  const { categories, loading, refreshCategories } = useCategories();
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    description: '',
    parent_id: '',
    color: '#3B82F6',
    icon: 'Package'
  });

  const colorOptions = [
    { value: '#3B82F6', label: 'Blue', class: 'bg-blue-500' },
    { value: '#10B981', label: 'Green', class: 'bg-green-500' },
    { value: '#F59E0B', label: 'Yellow', class: 'bg-yellow-500' },
    { value: '#EF4444', label: 'Red', class: 'bg-red-500' },
    { value: '#8B5CF6', label: 'Purple', class: 'bg-purple-500' },
    { value: '#06B6D4', label: 'Cyan', class: 'bg-cyan-500' },
    { value: '#F97316', label: 'Orange', class: 'bg-orange-500' },
    { value: '#EC4899', label: 'Pink', class: 'bg-pink-500' },
    { value: '#6B7280', label: 'Gray', class: 'bg-gray-500' },
    { value: '#84CC16', label: 'Lime', class: 'bg-lime-500' }
  ];

  const iconOptions = [
    { value: 'Package', label: 'Package' },
    { value: 'Smartphone', label: 'Smartphone' },
    { value: 'Laptop', label: 'Laptop' },
    { value: 'Monitor', label: 'Monitor' },
    { value: 'Printer', label: 'Printer' },
    { value: 'Watch', label: 'Watch' },
    { value: 'Headphones', label: 'Headphones' },
    { value: 'Speaker', label: 'Speaker' },
    { value: 'Camera', label: 'Camera' },
    { value: 'Gamepad2', label: 'Gaming' },
    { value: 'Keyboard', label: 'Keyboard' },
    { value: 'Mouse', label: 'Mouse' },
    { value: 'Router', label: 'Router' },
    { value: 'Server', label: 'Server' },
    { value: 'HardDrive', label: 'Storage' },
    { value: 'Tag', label: 'Tag' }
  ];

  // Filter categories based on search
  useEffect(() => {
    let filtered = categories || [];
    
    if (searchQuery) {
      filtered = filtered.filter(category => 
        category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        category.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredCategories(filtered);
  }, [categories, searchQuery]);

  const handleAddCategory = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      parent_id: '',
      color: '#3B82F6',
      icon: 'Package'
    });
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      parent_id: category.parent_id || '',
      color: category.color || '#3B82F6',
      icon: category.icon || 'Package'
    });
    setShowCategoryForm(true);
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      // TODO: Implement delete category API call
      toast.success('Category deleted successfully');
      refreshCategories();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingCategory) {
        // TODO: Implement update category API call
        toast.success('Category updated successfully');
      } else {
        // TODO: Implement create category API call
        toast.success('Category created successfully');
      }
      
      setShowCategoryForm(false);
      refreshCategories();
    } catch (error) {
      toast.error(editingCategory ? 'Failed to update category' : 'Failed to create category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CategoryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getParentCategories = () => {
    return categories?.filter(cat => !cat.parent_id) || [];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Tag className="w-6 h-6 text-green-600" />
            Category Management
          </h2>
          <p className="text-gray-600 mt-1">
            Organize products into categories ({filteredCategories.length} categories)
          </p>
        </div>
        <GlassButton
          onClick={handleAddCategory}
          icon={<Plus size={18} />}
          className="bg-gradient-to-r from-green-500 to-green-600 text-white"
        >
          Add Category
        </GlassButton>
      </div>

      {/* Filters */}
      <GlassCard className="p-4">
        <SearchBar
          placeholder="Search categories..."
          value={searchQuery}
          onChange={setSearchQuery}
          icon={<Search size={18} />}
        />
      </GlassCard>

      {/* Categories List */}
      <GlassCard className="p-6">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600 mb-4">
              {searchQuery 
                ? 'Try adjusting your search'
                : 'Get started by adding your first category'
              }
            </p>
            {!searchQuery && (
              <GlassButton
                onClick={handleAddCategory}
                icon={<Plus size={18} />}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white"
              >
                Add First Category
              </GlassButton>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((category) => (
              <div
                key={category.id}
                className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: category.color || '#3B82F6' }}
                    >
                      <Tag className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    {category.is_active ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleEditCategory(category)}
                      className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                      title="Edit category"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(category.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete category"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                {category.description && (
                  <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                )}
                
                <div className="space-y-1 text-xs text-gray-500">
                  {category.product_count !== undefined && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Products:</span>
                      <span className="bg-gray-100 px-2 py-1 rounded">{category.product_count}</span>
                    </div>
                  )}
                  {category.parent_id && (
                    <div className="flex items-center gap-1">
                      <span className="font-medium">Parent:</span>
                      <span className="bg-gray-100 px-2 py-1 rounded">
                        {categories?.find(cat => cat.id === category.parent_id)?.name || 'Unknown'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* Category Form Modal */}
      {showCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Parent Category
                  </label>
                  <select
                    value={formData.parent_id}
                    onChange={(e) => handleInputChange('parent_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="">No parent (top-level)</option>
                    {getParentCategories().map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Color
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {colorOptions.map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => handleInputChange('color', color.value)}
                        className={`w-8 h-8 rounded-lg border-2 transition-all ${
                          formData.color === color.value 
                            ? 'border-gray-900 scale-110' 
                            : 'border-gray-300 hover:border-gray-500'
                        } ${color.class}`}
                        title={color.label}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Icon
                  </label>
                  <select
                    value={formData.icon}
                    onChange={(e) => handleInputChange('icon', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    {iconOptions.map(icon => (
                      <option key={icon.value} value={icon.value}>
                        {icon.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <GlassButton
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white"
                  >
                    {isSubmitting ? 'Saving...' : (editingCategory ? 'Update Category' : 'Add Category')}
                  </GlassButton>
                  <GlassButton
                    type="button"
                    onClick={() => setShowCategoryForm(false)}
                    variant="secondary"
                    className="flex-1"
                  >
                    Cancel
                  </GlassButton>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoriesTab;
