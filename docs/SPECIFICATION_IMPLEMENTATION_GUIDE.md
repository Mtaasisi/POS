# Specification Implementation Guide

## Overview

This guide explains how product specifications should be structured, stored, and displayed throughout the LATS application.

## Data Structure

### 1. Product-Level Specifications
- **Field**: `specification` (TEXT in database)
- **Format**: JSON string
- **Purpose**: General product specifications that apply to all variants

### 2. Variant-Level Specifications  
- **Field**: `attributes` (JSONB in database)
- **Format**: JSON object
- **Purpose**: Specific specifications for individual variants

## Standardized Specification Format

### JSON Structure
```json
{
  "storage": "256GB",
  "ram": "8GB",
  "processor": "A16 Bionic",
  "screen_size": "6.7\"",
  "battery": "4323mAh",
  "camera": "48MP + 12MP + 12MP",
  "color": "Space Black",
  "weight": "240g",
  "dimensions": "160.7 x 77.6 x 7.85mm"
}
```

### Common Specification Keys
Use these standardized keys for consistency:

#### Performance
- `processor` / `cpu` - Processor type and speed
- `gpu` - Graphics processing unit
- `ram` / `memory` - Random access memory

#### Storage
- `storage` / `capacity` - Storage capacity

#### Display
- `screen_size` / `display` - Screen size
- `resolution` - Display resolution

#### Battery
- `battery` / `battery_capacity` - Battery capacity

#### Camera
- `camera` - Main camera specifications
- `front_camera` - Front camera specifications
- `rear_camera` - Rear camera specifications

#### Physical
- `color` - Product color
- `weight` - Product weight
- `dimensions` - Product dimensions
- `size` - Product size

#### Connectivity
- `wifi` - WiFi specifications
- `bluetooth` - Bluetooth specifications
- `network` - Network specifications

#### Software
- `os` / `operating_system` - Operating system

#### Warranty
- `warranty` - Warranty information
- `warranty_period` - Warranty period

## Implementation Across Application

### 1. Add Product Page (`AddProductPage.tsx`)

#### Current Implementation
- ✅ Product-level specifications via modal
- ✅ Variant-level specifications via modal
- ✅ JSON validation
- ✅ Auto-formatting of values

#### Usage
```typescript
// Product specifications
const productSpecs = {
  "storage": "256GB",
  "ram": "8GB",
  "processor": "A16 Bionic"
};

// Variant specifications  
const variantSpecs = {
  "color": "Space Black",
  "storage": "256GB"
};
```

### 2. Product Details Page (`ProductDetailPage.tsx`)

#### Implementation
```typescript
import SpecificationDisplay from '../components/shared/SpecificationDisplay';

// Product-level specifications
<SpecificationDisplay
  specification={product.specification}
  variant="detailed"
  showCategories={true}
  title="Product Specifications"
/>

// Variant specifications
{variants.map(variant => (
  <SpecificationDisplay
    key={variant.id}
    specification={variant.attributes}
    variant="compact"
    title={`${variant.name} Specifications`}
  />
))}
```

### 3. POS (Point of Sale)

#### Product Cards
```typescript
// In VariantProductCard.tsx
<SpecificationDisplay
  specification={variant.attributes}
  variant="card"
  maxDisplay={3}
  title="Specifications"
/>
```

#### Cart Items
```typescript
// In VariantCartItem.tsx
<SpecificationDisplay
  specification={variant.attributes}
  variant="compact"
  maxDisplay={2}
  title="Specs"
/>
```

### 4. Inventory Management

#### Product Cards
```typescript
// In VariantProductCard.tsx (inventory)
<SpecificationDisplay
  specification={product.attributes}
  variant="compact"
  maxDisplay={4}
  title="Specifications"
/>
```

#### Product Lists
```typescript
// In product list components
<SpecificationDisplay
  specification={product.specification}
  variant="list"
  maxDisplay={3}
  title="Key Specs"
/>
```

## Specification Display Variants

### 1. Compact Variant
- **Use Case**: Product cards, lists, compact spaces
- **Features**: 
  - Grid layout (2 columns)
  - Color-coded specifications
  - Truncated text
  - "More" indicator

### 2. Detailed Variant
- **Use Case**: Product details, modals, full specifications
- **Features**:
  - Categorized specifications
  - Full text display
  - Grid layout (responsive)
  - Specification count

### 3. Card Variant
- **Use Case**: Product cards, POS display
- **Features**:
  - Horizontal layout
  - Color-coded badges
  - Compact display

### 4. List Variant
- **Use Case**: Simple lists, sidebars
- **Features**:
  - Vertical layout
  - Key-value pairs
  - Clean formatting

## Color Coding System

Specifications are automatically color-coded based on their type:

- **Performance** (RAM, CPU, GPU): Green
- **Storage**: Blue  
- **Display**: Orange
- **Camera**: Pink
- **Battery**: Teal
- **Physical** (Color, Weight): Red/Gray
- **Connectivity**: Indigo
- **Software**: Yellow

## Value Formatting

The system automatically formats values with appropriate units:

- **Storage**: "256GB", "1TB"
- **RAM**: "8GB", "16GB"
- **Screen Size**: "6.7\"", "15.6\""
- **Weight**: "240g", "1.5kg"
- **Battery**: "4323mAh", "50Wh"
- **Processor**: "3.2GHz", "A16 Bionic"

## Database Schema

### lats_products Table
```sql
specification TEXT, -- Product-level specifications (JSON string)
attributes JSONB DEFAULT '{}', -- Product-level attributes
```

### lats_product_variants Table
```sql
attributes JSONB DEFAULT '{}', -- Variant-level specifications
```

## Validation Rules

### JSON Validation
- Must be valid JSON format
- Maximum 1000 characters
- All values must be strings or numbers

### Content Validation
- Keys should use snake_case
- Values should be descriptive and accurate
- Avoid duplicate keys

## Best Practices

### 1. Naming Conventions
- Use snake_case for keys: `screen_size`, `battery_capacity`
- Use descriptive names: `storage` not `mem`
- Be consistent across products

### 2. Value Standards
- Include units when applicable: "256GB" not "256"
- Use standard abbreviations: "GB", "GHz", "mAh"
- Be specific: "A16 Bionic" not "Apple processor"

### 3. Organization
- Group related specifications together
- Use categories when displaying detailed specs
- Prioritize most important specs for compact displays

### 4. Performance
- Limit displayed specifications in compact views
- Use lazy loading for large specification sets
- Cache parsed specifications when possible

## Migration Guide

### For Existing Products
1. Parse existing specification strings
2. Convert to standardized JSON format
3. Update database records
4. Test display components

### For New Products
1. Use the specification modals in AddProductPage
2. Follow the standardized key naming
3. Validate JSON format before saving
4. Test across all display variants

## Troubleshooting

### Common Issues
1. **Invalid JSON**: Use JSON.parse() validation
2. **Missing specifications**: Check both product and variant levels
3. **Display issues**: Verify specification format and component props
4. **Performance**: Limit displayed specifications in lists

### Debug Tools
- Use browser dev tools to inspect specification objects
- Check database directly for JSON format
- Test specification utilities in console

## Future Enhancements

### Planned Features
1. **Specification Templates**: Pre-defined templates for common product types
2. **Bulk Import**: Import specifications from CSV/Excel
3. **Search Integration**: Search products by specification values
4. **Comparison Tool**: Compare products by specifications
5. **Export Options**: Export specifications in various formats

### API Integration
1. **External APIs**: Fetch specifications from manufacturer APIs
2. **Barcode Lookup**: Auto-populate specifications from barcode scans
3. **Image Recognition**: Extract specifications from product images

## Conclusion

This specification system provides a consistent, scalable way to manage product specifications across the entire LATS application. By following these guidelines, you ensure a uniform user experience and maintainable codebase.
