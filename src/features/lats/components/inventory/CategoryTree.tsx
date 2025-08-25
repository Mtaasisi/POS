import React, { useState } from 'react';
import { ChevronRight, ChevronDown, Folder, FolderOpen, Edit, Trash2, Plus } from 'lucide-react';
import { Category } from '../../../types/inventory';

interface CategoryTreeProps {
  categories: Category[];
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddSubcategory: (parentId: string) => void;
  selectedCategoryId?: string;
  onSelectCategory?: (category: Category) => void;
}

interface CategoryTreeNodeProps {
  category: Category;
  level: number;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (categoryId: string) => void;
  onAddSubcategory: (parentId: string) => void;
  selectedCategoryId?: string;
  onSelectCategory?: (category: Category) => void;
}

const CategoryTreeNode: React.FC<CategoryTreeNodeProps> = ({
  category,
  level,
  onEditCategory,
  onDeleteCategory,
  onAddSubcategory,
  selectedCategoryId,
  onSelectCategory
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = category.children && category.children.length > 0;
  const isSelected = selectedCategoryId === category.id;

  const handleToggle = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = () => {
    onSelectCategory?.(category);
  };

  return (
    <div className="w-full">
      {/* Category Row */}
      <div 
        className={`
          flex items-center gap-2 p-2 rounded-md transition-colors cursor-pointer
          ${isSelected 
            ? 'bg-blue-50 border border-blue-200' 
            : 'hover:bg-gray-50 border border-transparent'
          }
        `}
        style={{ paddingLeft: `${level * 20 + 12}px` }}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            onClick={handleToggle}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown size={16} className="text-gray-600" />
            ) : (
              <ChevronRight size={16} className="text-gray-600" />
            )}
          </button>
        ) : (
          <div className="w-6" />
        )}

        {/* Category Icon */}
        <div 
          className="w-6 h-6 rounded flex items-center justify-center"
          style={{ backgroundColor: category.color || '#3B82F6' }}
        >
          {isExpanded ? (
            <FolderOpen size={14} className="text-white" />
          ) : (
            <Folder size={14} className="text-white" />
          )}
        </div>

        {/* Category Info */}
        <div 
          className="flex-1 min-w-0"
          onClick={handleSelect}
        >
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-900 truncate">
              {category.name}
            </span>
            {!category.is_active && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                Inactive
              </span>
            )}
          </div>
          {category.description && (
            <p className="text-sm text-gray-600 truncate">
              {category.description}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onAddSubcategory(category.id)}
            className="p-1 text-gray-400 hover:text-green-600 transition-colors"
            title="Add subcategory"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={() => onEditCategory(category)}
            className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit category"
          >
            <Edit size={14} />
          </button>
          <button
            onClick={() => onDeleteCategory(category.id)}
            className="p-1 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete category"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="w-full">
          {category.children!.map((child) => (
            <CategoryTreeNode
              key={child.id}
              category={child}
              level={level + 1}
              onEditCategory={onEditCategory}
              onDeleteCategory={onDeleteCategory}
              onAddSubcategory={onAddSubcategory}
              selectedCategoryId={selectedCategoryId}
              onSelectCategory={onSelectCategory}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const CategoryTree: React.FC<CategoryTreeProps> = ({
  categories,
  onEditCategory,
  onDeleteCategory,
  onAddSubcategory,
  selectedCategoryId,
  onSelectCategory
}) => {
  // Build hierarchy from flat list
  const buildHierarchy = (flatCategories: Category[]): Category[] => {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    // Create a map of all categories
    flatCategories.forEach(category => {
      categoryMap.set(category.id, { ...category, children: [] });
    });

    // Build the tree structure
    flatCategories.forEach(category => {
      if (category.parent_id) {
        const parent = categoryMap.get(category.parent_id);
        if (parent) {
          parent.children = parent.children || [];
          parent.children.push(categoryMap.get(category.id)!);
        }
      } else {
        rootCategories.push(categoryMap.get(category.id)!);
      }
    });

    return rootCategories;
  };

  const hierarchicalCategories = buildHierarchy(categories);

  if (hierarchicalCategories.length === 0) {
    return (
      <div className="text-center py-8">
        <Folder className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No categories found</h3>
        <p className="text-gray-600">
          Get started by adding your first category
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-1">
      {hierarchicalCategories.map((category) => (
        <CategoryTreeNode
          key={category.id}
          category={category}
          level={0}
          onEditCategory={onEditCategory}
          onDeleteCategory={onDeleteCategory}
          onAddSubcategory={onAddSubcategory}
          selectedCategoryId={selectedCategoryId}
          onSelectCategory={onSelectCategory}
        />
      ))}
    </div>
  );
};

export default CategoryTree;
