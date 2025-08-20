# Shelf Management System

## 📋 **Overview**

The Shelf Management System allows you to organize products within store locations by creating and managing shelves. Users can see exactly where products are located, making inventory management more efficient.

## 🏗️ **Database Structure**

### **Table: `lats_store_shelves`**

#### **Basic Information**
- `id` (UUID, Primary Key) - Auto-generated unique identifier
- `store_location_id` (UUID, Required) - Reference to store location
- `name` (TEXT, Required) - Shelf name
- `code` (TEXT, Required) - Unique shelf code within store location
- `description` (TEXT) - Shelf description

#### **Shelf Details**
- `shelf_type` (TEXT, Default: 'standard') - Type of shelf
  - `standard` - Regular shelf
  - `refrigerated` - Refrigerated shelf
  - `display` - Display shelf
  - `storage` - Storage shelf
  - `specialty` - Specialty shelf
- `section` (TEXT) - Product section (electronics, accessories, parts, etc.)
- `aisle` (TEXT) - Aisle identifier
- `row_number` (INTEGER) - Row number
- `column_number` (INTEGER) - Column number

#### **Physical Details**
- `width_cm` (INTEGER) - Shelf width in centimeters
- `height_cm` (INTEGER) - Shelf height in centimeters
- `depth_cm` (INTEGER) - Shelf depth in centimeters
- `max_weight_kg` (DECIMAL) - Maximum weight capacity
- `max_capacity` (INTEGER) - Maximum number of products
- `current_capacity` (INTEGER, Default: 0) - Current number of products

#### **Location Details**
- `floor_level` (INTEGER, Default: 1) - Floor level
- `zone` (TEXT) - Store zone (front, back, left, right, center)
- `coordinates` (JSONB) - 3D positioning {x, y, z}

#### **Status & Settings**
- `is_active` (BOOLEAN, Default: true) - Active status
- `is_accessible` (BOOLEAN, Default: true) - Accessibility status
- `requires_ladder` (BOOLEAN, Default: false) - Requires ladder access
- `is_refrigerated` (BOOLEAN, Default: false) - Refrigerated shelf
- `temperature_range` (JSONB) - Temperature range for refrigerated shelves

#### **Organization**
- `priority_order` (INTEGER, Default: 0) - Display priority
- `color_code` (TEXT) - Visual organization color
- `barcode` (TEXT) - Barcode for scanning

#### **Additional Information**
- `notes` (TEXT) - Additional notes
- `images` (TEXT[]) - Array of image URLs

#### **Audit Fields**
- `created_by` (UUID) - User who created the record
- `updated_by` (UUID) - User who last updated the record
- `created_at` (TIMESTAMP) - Creation timestamp
- `updated_at` (TIMESTAMP) - Last update timestamp

## 🔗 **Integration with Products**

### **Product-Shelf Relationship**
- Products have a `store_shelf` field that references the shelf code
- When products are added/removed from shelves, capacity is automatically updated
- Products can be moved between shelves or removed from shelves

### **Automatic Capacity Management**
- Database triggers automatically update shelf capacity when products change
- Prevents overloading shelves beyond their capacity
- Maintains accurate inventory counts

## 📊 **Shelf Types**

### **1. Standard Shelf**
- **Purpose**: General product storage
- **Features**: Basic storage, no special requirements
- **Best for**: Most products, accessories, tools

### **2. Display Shelf**
- **Purpose**: Product showcase and customer viewing
- **Features**: Eye-level positioning, good lighting
- **Best for**: High-value items, new products, featured items

### **3. Storage Shelf**
- **Purpose**: Bulk storage and inventory
- **Features**: High capacity, efficient space usage
- **Best for**: Bulk items, spare parts, backup inventory

### **4. Refrigerated Shelf**
- **Purpose**: Temperature-sensitive products
- **Features**: Temperature control, humidity management
- **Best for**: Electronics that require specific temperature conditions

### **5. Specialty Shelf**
- **Purpose**: Special requirements or configurations
- **Features**: Custom setup, specific dimensions
- **Best for**: Large items, fragile products, special equipment

## 🗂️ **Product Sections**

### **Available Sections**
- **Electronics** - Phones, tablets, laptops
- **Accessories** - Cases, chargers, cables
- **Parts** - Repair parts, components
- **Tools** - Repair tools, equipment
- **Cables** - Various cable types
- **Batteries** - Different battery types
- **Screens** - Phone screens, displays
- **Keyboards** - Phone keyboards, input devices
- **Other** - Miscellaneous items

## 🗺️ **Store Zones**

### **Zone Organization**
- **Front** - Customer-facing, high visibility
- **Back** - Storage, less accessible
- **Left** - Left side of store
- **Right** - Right side of store
- **Center** - Central area

## ⚡ **Performance Features**

### **Indexes**
- `idx_lats_store_shelves_location` - Store location queries
- `idx_lats_store_shelves_code` - Code lookups
- `idx_lats_store_shelves_type` - Type filtering
- `idx_lats_store_shelves_section` - Section filtering
- `idx_lats_store_shelves_zone` - Zone filtering
- `idx_lats_store_shelves_active` - Active status filtering
- `idx_lats_store_shelves_priority` - Priority ordering

### **Triggers**
- `update_lats_store_shelves_updated_at` - Automatic timestamp updates
- `update_shelf_capacity_trigger` - Automatic capacity management

## 🔒 **Security**

### **Row Level Security (RLS)**
- **Enabled**: ✅ Yes
- **Policies**:
  - View access for authenticated users
  - Insert/Update/Delete for authenticated users
- **Access Control**: Admin role required for web interface

## 📈 **Statistics & Analytics**

### **Shelf Statistics**
- Total shelves count
- Active shelves count
- Capacity utilization rate
- Available space
- Shelves by type distribution
- Shelves by section distribution
- Shelves by zone distribution

### **Capacity Management**
- Real-time capacity tracking
- Utilization percentage calculation
- Capacity warnings for full shelves
- Available space monitoring

## 🚀 **Usage Workflow**

### **1. Create Store Location**
1. Go to Store Locations management
2. Create or select a store location
3. Access the shelf management tab

### **2. Create Shelves**
1. Click "Add Shelf"
2. Fill in required information:
   - **Name**: Descriptive shelf name
   - **Code**: Unique code (e.g., "SHELF001")
   - **Type**: Select appropriate shelf type
   - **Section**: Choose product section
   - **Zone**: Select store zone
   - **Capacity**: Set maximum capacity
3. Save the shelf

### **3. Assign Products to Shelves**
1. Go to Product Management
2. Edit a product
3. Set the "Store Shelf" field to the shelf code
4. Save the product

### **4. View Product Locations**
1. Products show their shelf location in inventory
2. Search and filter by shelf
3. View shelf details with product lists
4. Track capacity and utilization

## 📱 **User Interface Features**

### **Shelf Management Tab**
- **Shelf Grid**: Visual display of all shelves
- **Statistics Dashboard**: Key metrics and utilization
- **Search & Filter**: Find shelves quickly
- **Create/Edit**: Full CRUD operations
- **Capacity Indicators**: Visual capacity status
- **Status Management**: Active/inactive toggles

### **Product Integration**
- **Shelf Assignment**: Easy product-to-shelf assignment
- **Location Display**: Clear product location information
- **Capacity Warnings**: Alerts for full shelves
- **Move Products**: Transfer products between shelves

## 🔧 **API Endpoints**

### **Shelf Management**
- `GET /shelves` - List all shelves with filters
- `GET /shelves/:id` - Get shelf details
- `POST /shelves` - Create new shelf
- `PUT /shelves/:id` - Update shelf
- `DELETE /shelves/:id` - Delete shelf

### **Product Management**
- `GET /shelves/:id/products` - Get products on shelf
- `PUT /products/:id/shelf` - Move product to shelf
- `DELETE /products/:id/shelf` - Remove product from shelf

### **Statistics**
- `GET /shelves/stats` - Get shelf statistics
- `GET /shelves/:location/stats` - Get location-specific stats

## 📋 **Best Practices**

### **Shelf Organization**
1. **Use Clear Naming**: Descriptive shelf names
2. **Logical Coding**: Sequential or meaningful codes
3. **Zone Planning**: Organize by store zones
4. **Section Grouping**: Group similar products
5. **Capacity Planning**: Set realistic capacities

### **Product Assignment**
1. **Logical Placement**: Place products in appropriate sections
2. **Accessibility**: Consider ease of access
3. **Capacity Management**: Don't overload shelves
4. **Regular Review**: Periodically review and optimize

### **Maintenance**
1. **Regular Updates**: Keep shelf information current
2. **Capacity Monitoring**: Watch utilization rates
3. **Product Movement**: Track product movements
4. **Performance Review**: Monitor shelf efficiency

## 🎯 **Benefits**

### **For Staff**
- **Quick Location**: Find products instantly
- **Efficient Organization**: Logical product placement
- **Capacity Management**: Prevent overloading
- **Inventory Accuracy**: Real-time tracking

### **For Customers**
- **Easy Navigation**: Clear product locations
- **Better Organization**: Logical store layout
- **Faster Service**: Staff can locate items quickly
- **Improved Experience**: Well-organized store

### **For Management**
- **Inventory Control**: Better stock management
- **Space Optimization**: Efficient use of space
- **Performance Tracking**: Utilization analytics
- **Operational Efficiency**: Streamlined processes

## 🔮 **Future Enhancements**

### **Planned Features**
- **3D Store Layout**: Visual store mapping
- **Barcode Integration**: Scan-based shelf management
- **Mobile App**: Shelf management on mobile devices
- **Advanced Analytics**: Detailed utilization reports
- **Automated Alerts**: Capacity and movement notifications
- **Integration**: Connect with POS and inventory systems

---

## 📞 **Support**

For questions or issues with the Shelf Management System:
1. Check the documentation
2. Review the database structure
3. Test with sample data
4. Contact the development team

**Status**: ✅ **READY FOR IMPLEMENTATION**
