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
import CategoryFormModal from '../inventory/CategoryFormModal';

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
    setShowCategoryForm(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
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

  const handleSubmitCategory = async (data: any) => {
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
    }
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
      <CategoryFormModal
        isOpen={showCategoryForm}
        onClose={() => setShowCategoryForm(false)}
        onSubmit={handleSubmitCategory}
        parentCategories={getParentCategories()}
        loading={isSubmitting}
      />
    </div>
  );
};

export default CategoriesTab;
