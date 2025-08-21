# Store Location Management

## Overview

The Store Location Management feature provides comprehensive functionality to manage multiple store locations and branches within the LATS system. This feature allows administrators to create, edit, and manage store locations with detailed information including contact details, operating hours, features, and financial data.

## Features

### Core Functionality
- **Create Store Locations**: Add new store locations with comprehensive details
- **Edit Locations**: Update existing location information
- **Delete Locations**: Remove locations (with safety checks)
- **View Details**: Detailed view of location information
- **Toggle Active Status**: Activate/deactivate locations
- **Set Main Branch**: Designate primary locations
- **Search & Filter**: Find locations by various criteria

### Location Information Fields

#### Basic Information
- **Name**: Store location name
- **Code**: Unique identifier (2-10 characters, uppercase)
- **Description**: Detailed description
- **Status**: Active/Inactive toggle
- **Main Branch**: Designate as primary location

#### Location Details
- **Address**: Full street address
- **City**: City name
- **Region**: Regional information
- **Country**: Country (default: Tanzania)
- **Postal Code**: Postal/ZIP code
- **Coordinates**: GPS coordinates (lat/lng)

#### Contact Information
- **Phone**: Contact phone number
- **Email**: Contact email address
- **WhatsApp**: WhatsApp number

#### Manager Information
- **Manager Name**: Location manager
- **Manager Phone**: Manager's phone number
- **Manager Email**: Manager's email address

#### Operating Hours
- **24 Hours**: Toggle for 24-hour operation
- **Daily Hours**: Individual hours for each day of the week
- **Time Slots**: Configurable opening/closing times

#### Store Features
- **Parking**: Has parking facility
- **WiFi**: Has WiFi access
- **Repair Service**: Offers repair services
- **Sales Service**: Offers sales services
- **Delivery Service**: Offers delivery services

#### Capacity & Financial
- **Store Size**: Size in square meters
- **Max Capacity**: Maximum customer capacity
- **Staff Count**: Current number of staff
- **Priority Order**: Display priority
- **Monthly Rent**: Monthly rental cost
- **Utilities Cost**: Monthly utilities expense
- **Monthly Target**: Monthly sales target

#### Additional Information
- **Notes**: Additional notes and comments
- **Images**: Location photos (array of URLs)

## Database Schema

### Table: `lats_store_locations`

```sql
CREATE TABLE lats_store_locations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    description TEXT,
    
    -- Location Details
    address TEXT NOT NULL,
    city TEXT NOT NULL,
    region TEXT,
    country TEXT DEFAULT 'Tanzania',
    postal_code TEXT,
    coordinates JSONB,
    
    -- Contact Information
    phone TEXT,
    email TEXT,
    whatsapp TEXT,
    
    -- Business Details
    manager_name TEXT,
    manager_phone TEXT,
    manager_email TEXT,
    
    -- Operating Hours
    opening_hours JSONB DEFAULT '{"monday": {"open": "08:00", "close": "18:00"}, ...}',
    is_24_hours BOOLEAN DEFAULT false,
    
    -- Store Features
    has_parking BOOLEAN DEFAULT false,
    has_wifi BOOLEAN DEFAULT false,
    has_repair_service BOOLEAN DEFAULT true,
    has_sales_service BOOLEAN DEFAULT true,
    has_delivery_service BOOLEAN DEFAULT false,
    
    -- Capacity & Size
    store_size_sqm INTEGER,
    max_capacity INTEGER,
    current_staff_count INTEGER DEFAULT 0,
    
    -- Status & Settings
    is_active BOOLEAN DEFAULT true,
    is_main_branch BOOLEAN DEFAULT false,
    priority_order INTEGER DEFAULT 0,
    
    -- Financial Information
    monthly_rent DECIMAL(12,2),
    utilities_cost DECIMAL(12,2),
    monthly_target DECIMAL(12,2),
    
    -- Additional Information
    notes TEXT,
    images TEXT[] DEFAULT '{}',
    
    -- Audit Fields
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## API Endpoints

### Store Location API (`storeLocationApi`)

#### Methods
- `getAll(filters?)`: Get all locations with optional filtering
- `getById(id)`: Get location by ID
- `getByCode(code)`: Get location by code
- `create(data)`: Create new location
- `update(id, data)`: Update existing location
- `delete(id)`: Delete location
- `getStats()`: Get location statistics
- `getCities()`: Get list of cities
- `getRegions()`: Get list of regions
- `toggleActive(id)`: Toggle active status
- `setMainBranch(id)`: Set as main branch

## Usage

### Accessing the Feature

1. **Navigation**: Go to Admin Management → Store Locations
2. **Direct URL**: `/store-locations`
3. **Permissions**: Admin role required

### Creating a New Location

1. Click "Add Location" button
2. Fill in required fields (Name, Code, Address, City)
3. Configure operating hours and features
4. Add contact and manager information
5. Set financial details if applicable
6. Click "Create Location"

### Editing a Location

1. Click the edit icon on any location card
2. Modify the desired fields
3. Click "Update Location"

### Managing Locations

- **View Details**: Click the eye icon to see full information
- **Toggle Active**: Use the Activate/Deactivate button
- **Set Main Branch**: Use "Set as Main" button (only one main branch allowed)
- **Delete**: Click delete icon (with confirmation)

### Search and Filter

- **Search**: Use the search bar to find locations by name, code, or city
- **Filters**: 
  - City filter
  - Region filter
  - Status filter (Active/Inactive)
- **Clear**: Reset all filters

## Statistics Dashboard

The feature includes a statistics dashboard showing:
- Total locations
- Active locations
- Total staff count
- Monthly targets
- Average store size

## Integration Points

### Product Management
- Store locations can be linked to products for inventory management
- Products can be assigned to specific locations

### Customer Management
- Customers can be associated with preferred locations
- Location-specific customer data

### Employee Management
- Staff can be assigned to specific locations
- Location-based attendance tracking

### Sales and POS
- Location-specific sales tracking
- POS system can be configured per location

## Security

### Row Level Security (RLS)
- All authenticated users can view locations
- Admin users can create, update, and delete locations
- Location-specific permissions can be implemented

### Data Validation
- Required field validation
- Code uniqueness validation
- Email format validation
- Business logic validation (e.g., only one main branch)

## Migration

### Database Migration
The feature includes a complete database migration:
- File: `supabase/migrations/20241201000050_create_store_locations_table.sql`
- Script: `scripts/apply-store-locations-migration.cjs`

### Running Migration
```bash
# Apply migration
node scripts/apply-store-locations-migration.cjs

# Or manually in Supabase dashboard
# Copy content from migration file
```

## Components

### Main Components
- `StoreLocationManagementPage`: Main management page
- `StoreLocationForm`: Create/edit form
- `StoreLocationCard`: Location display card

### Supporting Files
- `storeLocationApi.ts`: API service
- `storeLocation.ts`: TypeScript types
- Migration files and scripts

## Future Enhancements

### Planned Features
- **Map Integration**: Visual map display of locations
- **Analytics**: Location-specific performance metrics
- **Inventory Transfer**: Between location inventory management
- **Staff Scheduling**: Location-based staff scheduling
- **Customer Routing**: Route customers to nearest location
- **Multi-language**: Support for multiple languages
- **Mobile App**: Mobile-specific location features

### Integration Opportunities
- **GPS Tracking**: Real-time location tracking
- **Weather Integration**: Location-specific weather data
- **Local Events**: Location-specific event management
- **Social Media**: Location-specific social media integration

## Troubleshooting

### Common Issues

1. **Table Not Found**
   - Run the migration script
   - Check Supabase dashboard for table existence

2. **Permission Errors**
   - Verify user has admin role
   - Check RLS policies

3. **Validation Errors**
   - Ensure required fields are filled
   - Check code uniqueness
   - Verify email format

4. **Main Branch Issues**
   - Only one location can be main branch
   - Set another location as main before deleting current main

### Support
For issues or questions:
1. Check this documentation
2. Review migration logs
3. Contact system administrator
4. Check Supabase dashboard for errors

## Changelog

### Version 1.0.0 (Initial Release)
- Complete store location management system
- CRUD operations for locations
- Search and filter functionality
- Statistics dashboard
- Form validation and error handling
- Responsive design
- Admin role protection
