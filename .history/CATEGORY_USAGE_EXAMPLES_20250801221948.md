# Category API Usage Examples

This document shows how to fetch and use categories from the categories management system in different scenarios.

## Basic Usage

### 1. Using the Hook in a Component

```tsx
import React from 'react';
import { useCategories } from '../hooks/useCategories';

const MyComponent = () => {
  const { categories, loading, error, refetch } = useCategories({
    activeOnly: true, // Only get active categories
    autoFetch: true   // Automatically fetch on mount
  });

  if (loading) return <div>Loading categories...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>Categories ({categories.length})</h2>
      <ul>
        {categories.map(category => (
          <li key={category.id}>
            {category.name} - {category.description}
          </li>
        ))}
      </ul>
    </div>
  );
};
```

### 2. Using the API Functions Directly

```tsx
import React, { useState, useEffect } from 'react';
import { getActiveCategories, searchCategories } from '../lib/categoryApi';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const data = await getActiveCategories();
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (query: string) => {
    if (query.trim()) {
      setLoading(true);
      try {
        const results = await searchCategories(query);
        setCategories(results);
      } catch (error) {
        console.error('Error searching categories:', error);
      } finally {
        setLoading(false);
      }
    } else {
      fetchCategories();
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div>
      {/* Your component JSX */}
    </div>
  );
};
```

### 3. Using the CategorySelector Component

```tsx
import React, { useState } from 'react';
import CategorySelector from '../components/CategorySelector';
import { Category } from '../lib/categoryApi';

const DeviceForm = () => {
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  const handleCategorySelect = (category: Category | null) => {
    setSelectedCategory(category);
    // Update your form state or make API call
  };

  return (
    <form>
      <div>
        <label>Device Category</label>
        <CategorySelector
          selectedCategoryId={selectedCategory?.id}
          onCategorySelect={handleCategorySelect}
          placeholder="Select a device category..."
          showAll={false} // Only show active categories
        />
      </div>
      
      {selectedCategory && (
        <div>
          Selected: {selectedCategory.name}
          {selectedCategory.description && (
            <p>Description: {selectedCategory.description}</p>
          )}
        </div>
      )}
    </form>
  );
};
```

## Advanced Usage

### 4. Creating Categories Programmatically

```tsx
import { createCategory } from '../lib/categoryApi';

const createNewCategory = async () => {
  try {
    const newCategory = await createCategory({
      name: 'New Category',
      description: 'This is a new category',
      color: '#ff0000',
      is_active: true
    });
    
    console.log('Created category:', newCategory);
    // Refresh your categories list
    refetch();
  } catch (error) {
    console.error('Error creating category:', error);
  }
};
```

### 5. Updating Categories

```tsx
import { updateCategory } from '../lib/categoryApi';

const updateExistingCategory = async (categoryId: string) => {
  try {
    const updatedCategory = await updateCategory(categoryId, {
      name: 'Updated Category Name',
      description: 'Updated description',
      color: '#00ff00'
    });
    
    console.log('Updated category:', updatedCategory);
  } catch (error) {
    console.error('Error updating category:', error);
  }
};
```

### 6. Searching Categories

```tsx
import { searchCategories } from '../lib/categoryApi';

const searchForCategories = async (searchTerm: string) => {
  try {
    const results = await searchCategories(searchTerm);
    console.log('Search results:', results);
  } catch (error) {
    console.error('Error searching categories:', error);
  }
};
```

### 7. Using Categories in Forms

```tsx
import React, { useState } from 'react';
import { useCategories } from '../hooks/useCategories';

const ProductForm = () => {
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const { categories, loading } = useCategories({ activeOnly: true });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Submit form with selectedCategoryId
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Product Category</label>
        <select 
          value={selectedCategoryId} 
          onChange={(e) => setSelectedCategoryId(e.target.value)}
          disabled={loading}
        >
          <option value="">Select a category</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>
      
      <button type="submit">Create Product</button>
    </form>
  );
};
```

### 8. Categories with Device Count

```tsx
import { getCategoriesWithDeviceCount } from '../lib/categoryApi';

const CategoryStats = () => {
  const [categoriesWithCount, setCategoriesWithCount] = useState([]);

  useEffect(() => {
    const fetchCategoriesWithCount = async () => {
      try {
        const data = await getCategoriesWithDeviceCount();
        setCategoriesWithCount(data);
      } catch (error) {
        console.error('Error fetching categories with count:', error);
      }
    };

    fetchCategoriesWithCount();
  }, []);

  return (
    <div>
      <h2>Categories with Device Count</h2>
      {categoriesWithCount.map(category => (
        <div key={category.id}>
          <h3>{category.name}</h3>
          <p>Devices: {category.device_count}</p>
        </div>
      ))}
    </div>
  );
};
```

## API Reference

### Hook Options

```tsx
const { categories, loading, error, refetch, search } = useCategories({
  activeOnly: true,    // Only fetch active categories
  searchQuery: '',     // Initial search query
  autoFetch: true      // Automatically fetch on mount
});
```

### Category Interface

```tsx
interface Category {
  id: string;
  name: string;
  description?: string;
  color?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### Available API Functions

- `getCategories()` - Get all categories
- `getActiveCategories()` - Get only active categories
- `searchCategories(query)` - Search categories by name/description
- `getCategoryById(id)` - Get single category by ID
- `createCategory(data)` - Create new category
- `updateCategory(id, data)` - Update existing category
- `deleteCategory(id)` - Soft delete category
- `restoreCategory(id)` - Restore deleted category
- `getCategoriesWithDeviceCount()` - Get categories with device counts

## Error Handling

```tsx
const { categories, loading, error, refetch } = useCategories();

if (error) {
  return (
    <div className="error-message">
      <p>Failed to load categories: {error}</p>
      <button onClick={refetch}>Try Again</button>
    </div>
  );
}
```

## Best Practices

1. **Always handle loading states** - Show loading indicators while fetching
2. **Handle errors gracefully** - Display error messages and retry options
3. **Use activeOnly when appropriate** - Only show active categories in forms
4. **Cache results** - The hook automatically caches results
5. **Search efficiently** - Use the search function for large category lists
6. **Validate selections** - Ensure selected categories exist before using them 