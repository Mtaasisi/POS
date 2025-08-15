# CategoryFormModal Component

A modal popup component for creating new product categories in the LATS inventory system.

## Overview

The `CategoryFormModal` component provides a user-friendly modal interface for creating new product categories. It wraps the existing `CategoryForm` component in a modal dialog with proper styling and functionality.

## Features

- **Modal Interface**: Clean, centered modal popup with backdrop
- **Form Validation**: Built-in validation using Zod schema
- **Parent Categories**: Support for hierarchical category structure
- **Color & Icon Selection**: Visual customization options
- **Advanced Settings**: Collapsible section for additional options
- **Loading States**: Proper loading indicators during submission
- **Responsive Design**: Works well on desktop and mobile devices

## Usage

### Basic Usage

```tsx
import React, { useState } from 'react';
import CategoryFormModal from './CategoryFormModal';
import { CategoryFormData, Category } from '../../types/inventory';

const MyComponent: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const handleSubmitCategory = async (categoryData: CategoryFormData) => {
    setLoading(true);
    try {
      // Your API call here
      const newCategory = await createCategory(categoryData);
      setCategories(prev => [...prev, newCategory]);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error creating category:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => setIsModalOpen(true)}>
        Add Category
      </button>

      <CategoryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmitCategory}
        parentCategories={categories}
        loading={loading}
      />
    </div>
  );
};
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `isOpen` | `boolean` | Yes | Controls modal visibility |
| `onClose` | `() => void` | Yes | Function called when modal is closed |
| `onSubmit` | `(data: CategoryFormData) => Promise<void>` | Yes | Function called when form is submitted |
| `parentCategories` | `Category[]` | No | Array of existing categories for parent selection |
| `loading` | `boolean` | No | Shows loading state during submission |

### CategoryFormData Interface

```typescript
interface CategoryFormData {
  name: string;                    // Required: Category name
  description?: string;            // Optional: Category description
  color?: string;                  // Optional: Hex color code
  icon?: string;                   // Optional: Icon identifier
  parentId?: string;               // Optional: Parent category ID
  isActive: boolean;               // Required: Active status
  sortOrder: number;               // Required: Display order
  metadata?: Record<string, any>;  // Optional: Additional data
}
```

## Form Fields

### Basic Information
- **Name**: Required text field (max 100 characters)
- **Description**: Optional textarea (max 500 characters)
- **Parent Category**: Optional dropdown for hierarchical structure

### Appearance
- **Color**: Dropdown with predefined color options
- **Icon**: Dropdown with icon selection

### Advanced Settings (Collapsible)
- **Sort Order**: Number input for display ordering
- **Active Status**: Toggle switch for category visibility

## Styling

The component uses the existing design system:
- Glass morphism styling with `GlassCard` and `GlassInput` components
- Consistent with LATS design tokens
- Responsive layout that adapts to different screen sizes

## Integration

### With Existing Pages

To integrate with existing inventory pages, replace inline category forms with the modal:

```tsx
// Before: Inline form
{showCategoryForm && (
  <CategoryForm
    onSubmit={handleSubmit}
    onCancel={() => setShowCategoryForm(false)}
  />
)}

// After: Modal form
<CategoryFormModal
  isOpen={showCategoryForm}
  onClose={() => setShowCategoryForm(false)}
  onSubmit={handleSubmit}
  parentCategories={categories}
  loading={loading}
/>
```

### With API Integration

The component works seamlessly with the existing LATS data providers:

```tsx
import { useInventoryStore } from '../../stores/useInventoryStore';

const MyComponent: React.FC = () => {
  const { createCategory, categories, isLoading } = useInventoryStore();

  const handleSubmitCategory = async (categoryData: CategoryFormData) => {
    const result = await createCategory(categoryData);
    if (result.ok) {
      toast.success('Category created successfully!');
      setIsModalOpen(false);
    } else {
      toast.error(result.message || 'Failed to create category');
    }
  };

  return (
    <CategoryFormModal
      isOpen={isModalOpen}
      onClose={() => setIsModalOpen(false)}
      onSubmit={handleSubmitCategory}
      parentCategories={categories}
      loading={isLoading}
    />
  );
};
```

## Examples

See `CategoryFormModalExample.tsx` for a complete working example that demonstrates:
- Modal state management
- Form submission handling
- Loading states
- Success/error feedback
- Category list display

## Dependencies

- React Hook Form for form management
- Zod for validation
- Lucide React for icons
- LATS design system components
- React Hot Toast for notifications (optional)

## Accessibility

- Proper ARIA labels and roles
- Keyboard navigation support
- Focus management
- Screen reader friendly
- Escape key to close modal
