import React, { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { Category } from '../../../lib/categoryApi';
import GlassCard from '../../shared/components/ui/GlassCard';

interface CategorySelectorProps {
  selectedCategoryId?: string;
  onCategorySelect: (category: Category | null) => void;
  placeholder?: string;
  disabled?: boolean;
  showAll?: boolean;
  className?: string;
}

const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategoryId,
  onCategorySelect,
  placeholder = 'Select a category...',
  disabled = false,
  showAll = false,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { categories, loading, error, search } = useCategories({
    activeOnly: !showAll,
    autoFetch: true
  });

  const selectedCategory = categories.find(cat => cat.id === selectedCategoryId);

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await search(query);
    }
  };

  const handleCategorySelect = (category: Category) => {
    onCategorySelect(category);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    onCategorySelect(null);
    setIsOpen(false);
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`}>
      <GlassCard className="cursor-pointer hover:bg-white/10 transition-colors" onClick={() => !disabled && setIsOpen(!isOpen)}>
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center space-x-3">
            {selectedCategory ? (
              <>
                {selectedCategory.color && (
                  <div 
                    className="w-4 h-4 rounded-full border-2 border-white/30"
                    style={{ backgroundColor: selectedCategory.color }}
                  />
                )}
                <span className="text-white font-medium">{selectedCategory.name}</span>
                {selectedCategory.description && (
                  <span className="text-white/60 text-sm">({selectedCategory.description})</span>
                )}
              </>
            ) : (
              <span className="text-white/60">{placeholder}</span>
            )}
          </div>
          <ChevronDown className={`w-4 h-4 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </GlassCard>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 z-50">
          <GlassCard className="max-h-60 overflow-y-auto">
            {/* Search Input */}
            <div className="p-3 border-b border-white/20">
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Categories List */}
            <div className="p-2">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-white/60 text-sm mt-2">Loading categories...</p>
                </div>
              ) : error ? (
                <div className="text-center py-4">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              ) : categories.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-white/60 text-sm">No categories found</p>
                </div>
              ) : (
                <>
                  {/* Clear option */}
                  <button
                    onClick={handleClear}
                    className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg transition-colors text-white/80 hover:text-white"
                  >
                    Clear Selection
                  </button>
                  
                  {/* Categories */}
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => handleCategorySelect(category)}
                      className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-lg transition-colors flex items-center space-x-3"
                    >
                      {category.color && (
                        <div 
                          className="w-4 h-4 rounded-full border-2 border-white/30 flex-shrink-0"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      <div className="flex-1">
                        <div className="text-white font-medium">{category.name}</div>
                        {category.description && (
                          <div className="text-white/60 text-sm">{category.description}</div>
                        )}
                      </div>
                      {selectedCategoryId === category.id && (
                        <Check className="w-4 h-4 text-blue-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </>
              )}
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default CategorySelector; 