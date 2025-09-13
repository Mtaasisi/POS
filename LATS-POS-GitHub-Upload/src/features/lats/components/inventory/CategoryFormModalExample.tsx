import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import GlassButton from '../../../shared/components/ui/GlassButton';
import CategoryFormModal from './CategoryFormModal';
import { CategoryFormData, Category } from '../../types/inventory';
import { toast } from 'react-hot-toast';

const CategoryFormModalExample: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleSubmitCategory = async (categoryData: CategoryFormData) => {
    setLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a mock category with the submitted data
      const newCategory: Category = {
        id: `cat_${Date.now()}`,
        name: categoryData.name,
        description: categoryData.description,
        color: categoryData.color,
        icon: categoryData.icon,
        parentId: categoryData.parentId,
        isActive: categoryData.isActive,
        sortOrder: categoryData.sortOrder,
        metadata: categoryData.metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to local state
      setCategories(prev => [...prev, newCategory]);
      
      // Show success message
      toast.success('Category created successfully!');
      
      // Close modal
      handleCloseModal();
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Failed to create category');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Category Management</h1>
          <p className="text-gray-600">Manage your product categories</p>
        </div>
        <GlassButton
          onClick={handleOpenModal}
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
        >
          Add Category
        </GlassButton>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Existing Categories</h2>
        {categories.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No categories yet. Click "Add Category" to create your first one.</p>
        ) : (
          <div className="space-y-3">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {category.color && (
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    />
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">{category.name}</h3>
                    {category.description && (
                      <p className="text-sm text-gray-600">{category.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    category.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Form Modal */}
      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={handleSubmitCategory}
        parentCategories={categories}
        loading={loading}
      />
    </div>
  );
};

export default CategoryFormModalExample;
