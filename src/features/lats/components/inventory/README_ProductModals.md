# LATS Product Modals

This document explains how to use the new Add and Edit Product modals in the LATS inventory system.

## Overview

The LATS system now includes two new modal components for managing products:

1. **AddProductModal** - For creating new products
2. **EditProductModal** - For editing existing products

Both modals use the same UI design pattern as the NewDevicePage.tsx, adapted for popup modal format.

## Components

### AddProductModal

**Location**: `src/features/lats/components/inventory/AddProductModal.tsx`

**Features**:
- Complete product creation form
- Progress indicator showing form completion
- Image upload functionality
- Advanced settings toggle
- Real-time validation
- Auto-save draft functionality

**Props**:
```typescript
interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated?: (product: any) => void;
}
```

### EditProductModal

**Location**: `src/features/lats/components/inventory/EditProductModal.tsx`

**Features**:
- Loads existing product data
- Form reset functionality
- Modified state tracking
- Image management
- Advanced settings

**Props**:
```typescript
interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  onProductUpdated?: (product: any) => void;
}
```

## Usage

### 1. Import the Components

```typescript
import AddProductModal from '../components/inventory/AddProductModal';
import EditProductModal from '../components/inventory/EditProductModal';
import { useProductModals } from '../hooks/useProductModals';
```

### 2. Use the Hook

```typescript
const productModals = useProductModals();
```

### 3. Add the Modals to Your Component

```typescript
return (
  <div>
    {/* Your existing content */}
    
    {/* Product Modals */}
    <AddProductModal
      isOpen={productModals.showAddModal}
      onClose={productModals.closeAddModal}
      onProductCreated={(product) => {
        toast.success('Product created successfully!');
        // Refresh your data
        loadProducts();
      }}
    />

    <EditProductModal
      isOpen={productModals.showEditModal}
      onClose={productModals.closeEditModal}
      productId={productModals.editingProductId || ''}
      onProductUpdated={(product) => {
        toast.success('Product updated successfully!');
        // Refresh your data
        loadProducts();
      }}
    />
  </div>
);
```

### 4. Add Buttons to Open Modals

```typescript
// Add Product Button
<GlassButton
  onClick={productModals.openAddModal}
  icon={<Plus size={18} />}
  className="bg-gradient-to-r from-green-500 to-green-600 text-white"
>
  Add Product
</GlassButton>

// Edit Product Button (in a product list)
<GlassButton
  onClick={() => productModals.openEditModal(product.id)}
  icon={<Edit size={16} />}
  variant="secondary"
>
  Edit
</GlassButton>
```

## Integration Examples

### Inventory Page

The Inventory page has been updated to use these modals. See `src/features/lats/pages/InventoryPage.tsx` for a complete example.

### Product Catalog Page

To integrate with the Product Catalog page:

```typescript
// In ProductCatalogPage.tsx
import { useProductModals } from '../hooks/useProductModals';

const ProductCatalogPage: React.FC = () => {
  const productModals = useProductModals();
  
  // Add the modals to your JSX
  return (
    <div>
      {/* Existing content */}
      
      {/* Add button in your actions */}
      <GlassButton onClick={productModals.openAddModal}>
        Add Product
      </GlassButton>
      
      {/* Edit button in product cards */}
      <GlassButton onClick={() => productModals.openEditModal(product.id)}>
        Edit
      </GlassButton>
      
      {/* Modals */}
      <AddProductModal
        isOpen={productModals.showAddModal}
        onClose={productModals.closeAddModal}
        onProductCreated={(product) => {
          toast.success('Product created successfully!');
          loadProducts();
        }}
      />
      
      <EditProductModal
        isOpen={productModals.showEditModal}
        onClose={productModals.closeEditModal}
        productId={productModals.editingProductId || ''}
        onProductUpdated={(product) => {
          toast.success('Product updated successfully!');
          loadProducts();
        }}
      />
    </div>
  );
};
```

## Features

### Form Validation

Both modals include comprehensive form validation using Zod schemas:

- Required fields validation
- Price and quantity validation
- SKU format validation
- Image upload validation

### Progress Tracking

The modals show a progress indicator that tracks form completion:

- Visual progress bar
- Percentage completion
- Required field highlighting
- Submit button state management

### Image Management

- Drag and drop image upload
- Multiple image support
- Image preview with delete functionality
- File type validation

### Advanced Settings

- Product status toggles (Active, Featured)
- Product type settings (Digital, Shipping)
- Category and brand selection
- Supplier assignment

### Data Integration

- Integrates with the LATS inventory store
- Real-time data loading
- Automatic form population for editing
- Draft saving functionality

## Styling

The modals use the same glass morphism design as the rest of the LATS system:

- Glass card backgrounds
- Consistent color scheme
- Responsive design
- Mobile-friendly layout

## Error Handling

- Form validation errors
- API error handling
- Loading states
- Toast notifications
- Graceful fallbacks

## Future Enhancements

Potential improvements for future versions:

1. **Bulk Operations** - Add/Edit multiple products at once
2. **Product Variants** - Support for product variations
3. **Import/Export** - CSV import/export functionality
4. **Advanced Search** - Product search within modals
5. **Templates** - Product templates for quick creation
6. **Workflow** - Multi-step product creation process

## Troubleshooting

### Common Issues

1. **Modal not opening**: Check that `isOpen` prop is correctly set
2. **Form not loading**: Verify that `productId` is valid for edit modal
3. **Validation errors**: Check that all required fields are filled
4. **Image upload issues**: Ensure file types are supported

### Debug Tips

- Check browser console for errors
- Verify that the inventory store is properly initialized
- Ensure all required dependencies are installed
- Test with different product data scenarios
