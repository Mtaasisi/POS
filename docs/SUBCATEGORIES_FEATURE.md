# Subcategories Feature

This document describes the subcategories feature that has been added to the LATS inventory management system.

## Overview

The subcategories feature allows you to organize products into a hierarchical category structure. Categories can have parent categories, creating a tree-like organization system.

## Features

### 1. Hierarchical Category Structure
- Categories can have parent categories
- Unlimited nesting levels (with safety limits)
- Tree view for easy navigation
- Grid view for traditional display

### 2. Database Schema Changes
- Added `parent_id` column to `lats_categories` table
- Added `is_active` column for category status
- Added `sort_order` column for custom ordering
- Added `icon` column for category icons
- Added `metadata` column for additional data
- Updated unique constraints to allow same names under different parents
- Added circular reference prevention

### 3. UI Components
- **CategoryTree**: Hierarchical tree view with expand/collapse
- **CategoryForm**: Enhanced form with parent category selection
- **View Toggle**: Switch between tree and grid views
- **Quick Actions**: Add subcategories directly from tree view

## Database Migration

### Running the Migration

1. **Using Supabase CLI (Recommended)**:
   ```bash
   ./scripts/run-subcategories-migration.sh
   ```

2. **Manual Migration**:
   ```bash
   supabase db push
   ```

### Migration Details

The migration (`20241201000003_add_subcategories.sql`) includes:

- `parent_id` column with foreign key reference
- Index on `parent_id` for performance
- Updated unique constraint for name + parent_id
- Circular reference prevention trigger
- Additional columns for enhanced functionality

## API Changes

### New Functions

```typescript
// Get root categories (no parent)
getRootCategories(): Promise<Category[]>

// Get subcategories of a parent
getSubcategories(parentId: string): Promise<Category[]>

// Get full category hierarchy
getCategoryHierarchy(): Promise<Category[]>
```

### Updated Interfaces

```typescript
interface Category {
  id: string;
  name: string;
  description?: string;
  parent_id?: string;
  color?: string;
  icon?: string;
  is_active: boolean;
  sort_order: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
  children?: Category[]; // For hierarchical data
}
```

## Usage

### Creating Categories

1. **Root Category**: Create without selecting a parent
2. **Subcategory**: Select a parent category when creating

### Managing Categories

- **Tree View**: See hierarchical structure, expand/collapse nodes
- **Grid View**: Traditional card-based layout
- **Quick Actions**: Edit, delete, or add subcategories directly

### Best Practices

1. **Naming**: Use descriptive names that work in context
2. **Depth**: Keep nesting to 3-4 levels maximum
3. **Organization**: Group related products logically
4. **Active Status**: Use inactive status instead of deletion

## Safety Features

### Circular Reference Prevention
- Database trigger prevents circular parent-child relationships
- Maximum nesting depth limit (10 levels)
- Automatic validation on category updates

### Data Integrity
- Foreign key constraints ensure valid parent references
- Cascade rules handle parent deletion gracefully
- Unique constraints prevent duplicate names within same parent

## UI Components

### CategoryTree
- Expandable/collapsible tree structure
- Visual indicators for hierarchy levels
- Quick action buttons for each category
- Selection highlighting

### CategoryForm
- Parent category dropdown
- Enhanced validation
- Color and icon selection
- Advanced settings (sort order, metadata)

### View Controls
- Toggle between tree and grid views
- Search functionality
- Filter options

## Migration Notes

### Existing Data
- Existing categories will become root categories
- No data loss during migration
- Backward compatibility maintained

### Performance
- Indexes added for optimal query performance
- Efficient tree building algorithms
- Lazy loading for large hierarchies

## Troubleshooting

### Common Issues

1. **Migration Fails**: Check Supabase CLI installation and permissions
2. **Circular Reference Error**: Review category parent assignments
3. **Performance Issues**: Consider limiting nesting depth

### Support
- Check migration logs for detailed error messages
- Verify database connection and permissions
- Ensure all required environment variables are set

## Future Enhancements

- Bulk category operations
- Category templates
- Advanced filtering and search
- Category analytics and reporting
- Import/export functionality
