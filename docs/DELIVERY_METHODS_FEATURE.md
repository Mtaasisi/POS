# Delivery Methods Feature

## Overview

The Delivery Methods feature allows businesses to create, edit, and manage multiple delivery options for their customers. This feature provides a flexible way to offer different delivery speeds and pricing options.

## Features

### Core Functionality
- **Create Delivery Methods**: Add new delivery options with custom names, descriptions, and pricing
- **Edit Delivery Methods**: Modify existing delivery method details
- **Delete Delivery Methods**: Remove delivery methods (with protection for default method)
- **Set Default Method**: Designate one delivery method as the default option
- **Enable/Disable Methods**: Toggle availability of delivery methods

### User Interface
- **Responsive Grid Layout**: Methods displayed in a clean 3-column grid
- **Visual Indicators**: Default method highlighted with blue border and checkmark icon
- **Form Validation**: Required field validation with user feedback
- **Toast Notifications**: Success and error messages for user actions
- **Edit/Delete Actions**: Inline action buttons for each delivery method

## Technical Implementation

### Database Schema
```sql
-- Added to lats_pos_delivery_settings table
delivery_methods JSONB DEFAULT '[...]'
```

### Data Structure
```typescript
interface DeliveryMethod {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedTime: string;
  isDefault: boolean;
  enabled: boolean;
}
```

### Components
- `DeliveryMethodsManager.tsx`: Main component for managing delivery methods
- `DeliverySettingsTab.tsx`: Updated to include delivery methods section
- `DeliverySettings.tsx`: Legacy component updated with delivery methods

### Default Methods
The system comes with three default delivery methods:
1. **Standard Delivery**: 2-3 business days, TZS 500
2. **Express Delivery**: 1-2 business days, TZS 1000
3. **Same Day Delivery**: Same day, TZS 2000

## Usage

### In POS Settings
1. Navigate to POS Settings
2. Go to the "Delivery" tab
3. Find the "Delivery Methods" section
4. Use the "Add Method" button to create new delivery options
5. Edit or delete existing methods as needed

### In Code
```typescript
import DeliveryMethodsManager from './DeliveryMethodsManager';

const [methods, setMethods] = useState<DeliveryMethod[]>([]);

<DeliveryMethodsManager
  methods={methods}
  onMethodsChange={setMethods}
/>
```

## Migration

The feature includes a database migration (`20241201000020_add_delivery_methods.sql`) that:
- Adds the `delivery_methods` column to the delivery settings table
- Sets up default delivery methods for existing records
- Creates an index for better query performance

## Demo Page

A demo page is available at `DeliveryMethodsDemoPage.tsx` that showcases all the functionality and provides a live preview of the delivery methods management interface.

## Future Enhancements

Potential improvements for the delivery methods feature:
- **Bulk Operations**: Import/export delivery methods
- **Conditional Pricing**: Dynamic pricing based on order value or location
- **Time-based Availability**: Schedule delivery methods for specific times
- **Integration**: Connect with external delivery services
- **Analytics**: Track usage and performance of different delivery methods
