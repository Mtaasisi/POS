import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronRight, Tag, Folder, FolderOpen } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  parent_id?: string;
  children?: Category[];
  color?: string;
  product_count?: number;
}

interface ExpandableCategoriesProps {
  categories: Category[];
  selectedCategory: string;
  onCategorySelect: (categoryId: string) => void;
  className?: string;
}

const ExpandableCategories: React.FC<ExpandableCategoriesProps> = ({
  categories,
  selectedCategory,
  onCategorySelect,
  className = ''
}) => {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [showAllCategories, setShowAllCategories] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Build hierarchical structure
  const buildCategoryTree = (flatCategories: Category[]): Category[] => {
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

  const categoryTree = buildCategoryTree(categories);
  const visibleCategories = showAllCategories ? categoryTree : categoryTree.slice(0, 5);

  const toggleExpanded = (categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  const handleCategoryClick = (categoryId: string) => {
    onCategorySelect(categoryId);
  };

  const CategoryNode: React.FC<{
    category: Category;
    level: number;
    isExpanded: boolean;
  }> = ({ category, level, isExpanded }) => {
    const hasChildren = category.children && category.children.length > 0;
    const isSelected = selectedCategory === category.id;
    const indentLevel = level * 16;

    return (
      <div className="w-full">
        {/* Category Button */}
        <div
          className={`
            flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 cursor-pointer group
            ${isSelected 
              ? 'bg-green-100 border border-green-200 shadow-sm' 
              : 'hover:bg-gray-50 border border-transparent'
            }
          `}
          style={{ paddingLeft: `${12 + indentLevel}px` }}
        >
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleExpanded(category.id);
              }}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown size={14} className="text-gray-600" />
              ) : (
                <ChevronRight size={14} className="text-gray-600" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}

          {/* Category Icon */}
          <div 
            className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: category.color || '#6B7280' }}
          >
            {hasChildren ? (
              isExpanded ? (
                <FolderOpen size={12} className="text-white" />
              ) : (
                <Folder size={12} className="text-white" />
              )
            ) : (
              <Tag size={12} className="text-white" />
            )}
          </div>

          {/* Category Name */}
          <div 
            className="flex-1 min-w-0"
            onClick={() => handleCategoryClick(category.id)}
          >
            <div className="flex items-center gap-2">
              <span className={`text-sm font-medium truncate ${
                isSelected ? 'text-green-800' : 'text-gray-700'
              }`}>
                {category.name}
              </span>
              {category.product_count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isSelected 
                    ? 'bg-green-200 text-green-700' 
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {category.product_count}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div className="mt-1 space-y-1">
            {category.children!.map((child) => (
              <CategoryNode
                key={child.id}
                category={child}
                level={level + 1}
                isExpanded={expandedCategories.has(child.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white border border-gray-200 rounded-xl shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <h3 className="text-sm font-semibold text-gray-800">Categories</h3>
        {categoryTree.length > 5 && (
          <button
            onClick={() => setShowAllCategories(!showAllCategories)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            {showAllCategories ? 'Show Less' : `Show All (${categoryTree.length})`}
          </button>
        )}
      </div>

      {/* Categories List */}
      <div className="p-2 max-h-80 overflow-y-auto">
        {/* All Categories Button */}
        <button
          onClick={() => handleCategoryClick('')}
          className={`
            w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 mb-2
            ${selectedCategory === '' 
              ? 'bg-blue-100 border border-blue-200 shadow-sm' 
              : 'hover:bg-gray-50 border border-transparent'
            }
          `}
        >
          <div className="w-5 h-5 rounded bg-blue-500 flex items-center justify-center">
            <Tag size={12} className="text-white" />
          </div>
          <span className={`text-sm font-medium ${
            selectedCategory === '' ? 'text-blue-800' : 'text-gray-700'
          }`}>
            All Categories
          </span>
        </button>

        {/* Category Tree */}
        {visibleCategories.length > 0 ? (
          <div className="space-y-1">
            {visibleCategories.map((category) => (
              <CategoryNode
                key={category.id}
                category={category}
                level={0}
                isExpanded={expandedCategories.has(category.id)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-4">
            <Tag className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No categories found</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExpandableCategories;
