import React from 'react';
import { X } from 'lucide-react';
import CategoryForm from './CategoryForm';
import { CategoryFormData, Category } from '../../types/inventory';

interface CategoryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CategoryFormData) => Promise<void>;
  parentCategories?: Category[];
  loading?: boolean;
  editingCategory?: Category | null;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  parentCategories = [],
  loading = false,
  editingCategory = null
}) => {
  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CategoryForm
          category={editingCategory}
          parentCategories={parentCategories}
          onSubmit={onSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default CategoryFormModal;
