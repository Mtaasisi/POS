# Categories and Subcategories User Guide

## Overview

The LATS inventory management system now supports hierarchical categories, allowing you to organize products into main categories and subcategories. This provides better organization and makes it easier to find and manage products.

## Features

### ✅ **Hierarchical Structure**
- Create main categories (root categories)
- Create subcategories under any category
- Unlimited nesting levels (with safety limits)
- Tree view for easy navigation

### ✅ **Multiple View Modes**
- **Tree View**: Hierarchical display with expand/collapse
- **Grid View**: Traditional card-based layout
- Easy toggle between views

### ✅ **Quick Actions**
- Add subcategories directly from the tree view
- Edit categories inline
- Delete categories with confirmation
- Search and filter categories

## How to Use

### Creating Categories

#### 1. **Create a Main Category**
1. Go to **Inventory Management** → **Categories**
2. Click **"Add Category"** button
3. Fill in the category details:
   - **Name**: Enter category name (e.g., "Electronics")
   - **Description**: Optional description
   - **Parent Category**: Leave empty (this creates a root category)
   - **Color**: Choose a color for visual identification
   - **Icon**: Select an icon (optional)
4. Click **"Create Category"**

#### 2. **Create a Subcategory**
1. In the **Tree View**, find the parent category
2. Click the **"+"** button next to the category name
3. Fill in the subcategory details:
   - **Name**: Enter subcategory name (e.g., "Smartphones")
   - **Description**: Optional description
   - **Parent Category**: Should be pre-filled with the selected parent
   - **Color**: Choose a color
   - **Icon**: Select an icon (optional)
4. Click **"Create Category"**

#### 3. **Alternative Method**
1. Click **"Add Category"** button
2. In the form, select a **Parent Category** from the dropdown
3. Fill in other details
4. Click **"Create Category"**

### Managing Categories

#### **Tree View Features**
- **Expand/Collapse**: Click the arrow icon to expand/collapse categories
- **Quick Actions**: Hover over a category to see action buttons
  - **+** Add subcategory
  - **✏️** Edit category
  - **🗑️** Delete category
- **Selection**: Click on a category to select it

#### **Grid View Features**
- **Card Layout**: Each category displayed as a card
- **Parent Information**: Shows parent category if applicable
- **Status Indicators**: Active/inactive status
- **Action Buttons**: Edit and delete buttons on each card

### Best Practices

#### **Naming Conventions**
- Use clear, descriptive names
- Keep names short but meaningful
- Use consistent naming patterns

#### **Organization Tips**
- **Main Categories**: Broad product types (Electronics, Clothing, etc.)
- **Subcategories**: Specific product types (Smartphones, Laptops, etc.)
- **Depth**: Keep nesting to 2-3 levels maximum for better usability

#### **Examples**
```
Electronics (Main Category)
├── Smartphones (Subcategory)
│   ├── Android Phones (Sub-subcategory)
│   └── iPhones (Sub-subcategory)
├── Laptops (Subcategory)
│   ├── Gaming Laptops (Sub-subcategory)
│   └── Business Laptops (Sub-subcategory)
└── Accessories (Subcategory)
    ├── Phone Cases (Sub-subcategory)
    └── Chargers (Sub-subcategory)
```

### Advanced Features

#### **Category Properties**
- **Active Status**: Inactive categories won't appear in product selection
- **Sort Order**: Control the display order of categories
- **Color Coding**: Use colors for visual organization
- **Icons**: Add icons for better visual identification

#### **Search and Filter**
- **Search**: Find categories by name or description
- **View Toggle**: Switch between tree and grid views
- **Status Filter**: Filter by active/inactive status

### Safety Features

#### **Data Protection**
- **Circular Reference Prevention**: System prevents creating circular parent-child relationships
- **Confirmation Dialogs**: Delete operations require confirmation
- **Data Integrity**: Foreign key constraints ensure valid relationships

#### **Recovery Options**
- **Soft Delete**: Categories can be marked as inactive instead of deleted
- **Restore**: Inactive categories can be reactivated
- **Backup**: Database backups protect against data loss

## Troubleshooting

### Common Issues

#### **"Category not found" Error**
- Check if the category exists and is active
- Verify the category name spelling
- Ensure the category hasn't been deleted

#### **"Circular reference" Error**
- This occurs when trying to set a category as its own parent
- Choose a different parent category
- Create a new category if needed

#### **"Permission denied" Error**
- Check your user permissions
- Contact your system administrator
- Ensure you're logged in with the correct account

### Performance Tips

#### **Large Category Trees**
- Use search to find specific categories quickly
- Collapse unused branches in tree view
- Consider organizing categories more efficiently

#### **Loading Issues**
- Refresh the page if categories don't load
- Check your internet connection
- Clear browser cache if needed

## Support

If you encounter any issues or need help with categories and subcategories:

1. **Check this guide** for common solutions
2. **Contact support** with specific error messages
3. **Provide screenshots** of any error dialogs
4. **Include steps** to reproduce the issue

---

**Note**: This feature is fully integrated with the product management system. Categories created here will be available when adding or editing products.
