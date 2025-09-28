import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Tag, ChevronDown, ChevronRight, Folder, FolderOpen } from 'lucide-react';
import { Category } from '../../../lats/types/inventory';

interface CategoryInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
  categories: Category[];
  showSuggestions?: boolean;
  disabled?: boolean;
  error?: string;
}

const CategoryInput: React.FC<CategoryInputProps> = ({
  value,
  onChange,
  placeholder = "Enter category name",
  required = false,
  className = '',
  categories,
  showSuggestions = true,
  disabled = false,
  error
}) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Build hierarchical structure with memoization
  const categoryTree = useMemo(() => {
    const categoryMap = new Map<string, Category>();
    const rootCategories: Category[] = [];

    try {
      // First pass: create map of all categories
      categories.forEach(cat => {
        categoryMap.set(cat.id, { ...cat, children: [] });
      });

      // Second pass: build tree structure
      categories.forEach(cat => {
        const categoryWithChildren = categoryMap.get(cat.id)!;
        if (cat.parentId && categoryMap.has(cat.parentId)) {
          const parent = categoryMap.get(cat.parentId)!;
          parent.children = parent.children || [];
          parent.children.push(categoryWithChildren);
        } else {
          rootCategories.push(categoryWithChildren);
        }
      });

      // Only log when categories actually change
      console.log('🌳 CategoryInput: Built tree with', rootCategories.length, 'root categories');
    } catch (error) {
      console.error('❌ CategoryInput: Error building category tree:', error);
      console.error('❌ CategoryInput: Categories data:', categories);
    }

    return rootCategories;
  }, [categories]);

  // Handle input change and search
  const handleInputChange = (inputValue: string) => {
    setSearchQuery(inputValue);
    
    if (!showSuggestions || !inputValue.trim()) {
      setFilteredCategories([]);
      setShowDropdown(false);
      return;
    }

    // Filter categories based on input (flattened search)
    const filtered = categories.filter(category =>
      category.name.toLowerCase().includes(inputValue.toLowerCase())
    );
    
    setFilteredCategories(filtered);
    setShowDropdown(filtered.length > 0);
  };

  // Handle category selection
  const handleCategorySelect = (category: Category) => {
    onChange(category.id);
    setSearchQuery(category.name);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  // Handle category expansion
  const handleCategoryExpand = (categoryId: string) => {
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

  // Handle input focus
  const handleFocus = () => {
    if (!showSuggestions || disabled) return;
    
    if (categories.length > 0) {
      setFilteredCategories([]);
      setShowDropdown(true);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current && 
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update search query when value changes externally
  useEffect(() => {
    if (value) {
      const selectedCategory = categories.find(cat => cat.id === value);
      if (selectedCategory) {
        setSearchQuery(selectedCategory.name);
      }
    } else {
      setSearchQuery('');
    }
  }, [value, categories]);

  // Render category item with children
  const renderCategoryItem = (category: Category, level: number = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const isSelected = value === category.id;

    return (
      <div key={category.id}>
        <button
          type="button"
          onClick={() => {
            if (hasChildren) {
              handleCategoryExpand(category.id);
            } else {
              handleCategorySelect(category);
            }
          }}
          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-blue-50 ${
            isSelected ? 'bg-blue-50 border-blue-200' : ''
          }`}
          style={{ paddingLeft: `${16 + level * 20}px` }}
        >
          <div className="flex items-center gap-3">
            {hasChildren ? (
              <div className="flex items-center gap-2">
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                )}
                {isExpanded ? (
                  <FolderOpen className="w-4 h-4 text-blue-500" />
                ) : (
                  <Folder className="w-4 h-4 text-gray-500" />
                )}
              </div>
            ) : (
              <div 
                className="w-3 h-3 rounded-full border border-gray-300"
                style={{ backgroundColor: category.color || '#3B82F6' }}
              />
            )}
            <div className="flex-1">
              <div className={`font-medium ${isSelected ? 'text-blue-600' : 'text-gray-900'} flex items-center gap-2`}>
                {category.icon && (
                  <span className="text-lg" role="img" aria-label={category.name}>
                    {category.icon}
                  </span>
                )}
                {category.name}
              </div>
              {category.description && (
                <div className="text-sm text-gray-500 truncate">{category.description}</div>
              )}
            </div>
            {isSelected && (
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            )}
          </div>
        </button>
        
        {/* Render children if expanded */}
        {hasChildren && isExpanded && category.children && (
          <div className="border-l border-gray-200 ml-4">
            {category.children.map(child => renderCategoryItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => handleInputChange(e.target.value)}
          onFocus={handleFocus}
          className={`w-full py-3 pl-12 pr-12 bg-white/30 backdrop-blur-md border-2 rounded-lg focus:outline-none transition-colors ${
            error 
              ? 'border-red-500 focus:border-red-600' 
              : 'border-gray-300 focus:border-blue-500'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete="off"
        />
        <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        {showSuggestions && (
          <ChevronDown 
            className={`absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 transition-transform ${
              showDropdown ? 'rotate-180' : ''
            }`} 
            size={18} 
          />
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Dropdown */}
      {showDropdown && showSuggestions && !disabled && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {searchQuery.trim() ? (
            // Search results - flat list
            filteredCategories.length > 0 ? (
              filteredCategories.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategorySelect(category)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-blue-50 ${
                    value === category.id ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-3 h-3 rounded-full border border-gray-300"
                      style={{ backgroundColor: category.color || '#3B82F6' }}
                    />
                                       <div>
                     <div className={`font-medium ${value === category.id ? 'text-blue-600' : 'text-gray-900'} flex items-center gap-2`}>
                       {category.icon && (
                         <span className="text-lg" role="img" aria-label={category.name}>
                           {category.icon}
                         </span>
                       )}
                       {category.name}
                     </div>
                     {category.description && (
                       <div className="text-sm text-gray-500 truncate">{category.description}</div>
                     )}
                   </div>
                    {value === category.id && (
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-gray-500 text-center">
                No categories found
              </div>
            )
          ) : (
            // Hierarchical view - tree structure
            categoryTree.length > 0 ? (
              categoryTree.map(category => renderCategoryItem(category))
            ) : (
              <div className="px-4 py-3 text-gray-500 text-center">
                No categories available
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

export default CategoryInput;
