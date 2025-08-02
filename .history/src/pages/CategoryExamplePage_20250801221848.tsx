import React, { useState } from 'react';
import { useCategories } from '../hooks/useCategories';
import { Category } from '../lib/categoryApi';
import CategorySelector from '../components/CategorySelector';
import GlassCard from '../components/ui/GlassCard';
import GlassButton from '../components/ui/GlassButton';
import { RefreshCw, Search, Plus, Trash2, Edit } from 'lucide-react';

const CategoryExamplePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

  const { 
    categories, 
    loading, 
    error, 
    refetch, 
    search 
  } = useCategories({
    activeOnly: !showAll,
    autoFetch: true
  });

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim()) {
      await search(query);
    } else {
      await refetch();
    }
  };

  const handleCategorySelect = (category: Category | null) => {
    setSelectedCategory(category);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Category Management Example</h1>
          <p className="text-gray-600 mt-1">Demonstrating how to fetch and use categories</p>
        </div>
        <GlassButton
          onClick={refetch}
          icon={<RefreshCw size={18} />}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh'}
        </GlassButton>
      </div>

      {/* Search and Filters */}
      <GlassCard className="p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Categories
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories by name or description..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="flex items-end">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showAll}
                onChange={(e) => setShowAll(e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Show all categories (including inactive)</span>
            </label>
          </div>
        </div>
      </GlassCard>

      {/* Category Selector Example */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Category Selector Component</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select a Category
            </label>
            <CategorySelector
              selectedCategoryId={selectedCategory?.id}
              onCategorySelect={handleCategorySelect}
              placeholder="Choose a category..."
              showAll={showAll}
            />
          </div>
          {selectedCategory && (
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900">Selected Category:</h3>
              <div className="mt-2 space-y-1">
                <p><strong>Name:</strong> {selectedCategory.name}</p>
                {selectedCategory.description && (
                  <p><strong>Description:</strong> {selectedCategory.description}</p>
                )}
                {selectedCategory.color && (
                  <p><strong>Color:</strong> 
                    <span 
                      className="inline-block w-4 h-4 rounded-full ml-2 border"
                      style={{ backgroundColor: selectedCategory.color }}
                    />
                  </p>
                )}
                <p><strong>Status:</strong> {selectedCategory.is_active ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Categories List */}
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            All Categories ({categories.length})
          </h2>
          {error && (
            <div className="text-red-600 text-sm">
              Error: {error}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading categories...</p>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">No categories found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  selectedCategory?.id === category.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      {category.color && (
                        <div 
                          className="w-4 h-4 rounded-full border"
                          style={{ backgroundColor: category.color }}
                        />
                      )}
                      <h3 className="font-medium text-gray-900">{category.name}</h3>
                      {!category.is_active && (
                        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    {category.description && (
                      <p className="text-gray-600 text-sm mb-2">{category.description}</p>
                    )}
                    <div className="text-xs text-gray-500">
                      Created: {new Date(category.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex space-x-1">
                    <button
                      onClick={() => setSelectedCategory(category)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Select"
                    >
                      <Edit size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* API Information */}
      <GlassCard className="p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">API Functions Available</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>• <code className="bg-gray-100 px-1 rounded">getCategories()</code> - Get all categories</p>
          <p>• <code className="bg-gray-100 px-1 rounded">getActiveCategories()</code> - Get only active categories</p>
          <p>• <code className="bg-gray-100 px-1 rounded">searchCategories(query)</code> - Search categories</p>
          <p>• <code className="bg-gray-100 px-1 rounded">getCategoryById(id)</code> - Get single category</p>
          <p>• <code className="bg-gray-100 px-1 rounded">createCategory(data)</code> - Create new category</p>
          <p>• <code className="bg-gray-100 px-1 rounded">updateCategory(id, data)</code> - Update category</p>
          <p>• <code className="bg-gray-100 px-1 rounded">deleteCategory(id)</code> - Soft delete category</p>
          <p>• <code className="bg-gray-100 px-1 rounded">useCategories()</code> - React hook for categories</p>
        </div>
      </GlassCard>
    </div>
  );
};

export default CategoryExamplePage; 