# Storage Room Management System

## Overview

The Storage Room Management System allows you to organize and track inventory across different storage locations within your business. Each storage room can have specific characteristics like capacity limits, security requirements, and physical details.

## Features

### ✅ **Core Functionality**
- **Storage Room Creation**: Create new storage rooms with detailed information
- **Capacity Management**: Track current and maximum capacity
- **Location Organization**: Associate storage rooms with store locations
- **Security Settings**: Configure secure rooms and access requirements
- **Visual Organization**: Use color codes for easy identification
- **Status Management**: Active/inactive room status

### ✅ **Database Structure**

#### **Table: `lats_storage_rooms`**

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Primary key |
| `store_location_id` | UUID | Reference to store location |
| `name` | TEXT | Storage room name |
| `code` | TEXT | Unique room code (e.g., "STOR001") |
| `description` | TEXT | Room description |
| `floor_level` | INTEGER | Floor level (default: 1) |
| `area_sqm` | DECIMAL(8,2) | Area in square meters |
| `max_capacity` | INTEGER | Maximum capacity |
| `current_capacity` | INTEGER | Current capacity (auto-updated) |
| `is_active` | BOOLEAN | Active status |
| `is_secure` | BOOLEAN | Security requirement |
| `requires_access_card` | BOOLEAN | Access card requirement |
| `color_code` | TEXT | Visual organization color |
| `notes` | TEXT | Additional notes |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

### ✅ **Product Integration**

Products can be assigned to storage rooms using the `storage_room_id` field in the `lats_products` table. The system automatically:

- **Tracks Capacity**: Updates current capacity when products are added/removed
- **Prevents Overflow**: Validates capacity limits before assignments
- **Maintains History**: Keeps track of product movements between rooms

### ✅ **API Functions**

#### **Storage Room API (`storageRoomApi`)**

```typescript
// Get all storage rooms
const rooms = await storageRoomApi.getAll();

// Get storage room by ID
const room = await storageRoomApi.getById(id);

// Get rooms by store location
const locationRooms = await storageRoomApi.getByStoreLocation(locationId);

// Create new storage room
const newRoom = await storageRoomApi.create(roomData);

// Update storage room
const updatedRoom = await storageRoomApi.update({ id, ...updateData });

// Delete storage room
await storageRoomApi.delete(id);

// Get statistics
const stats = await storageRoomApi.getStats();
```

#### **Database Functions**

```sql
-- Get storage room statistics
SELECT get_storage_room_stats('room-id-here');

-- Move products between storage rooms
SELECT move_products_to_storage_room(ARRAY['product-id-1', 'product-id-2'], 'new-room-id');

-- View storage room inventory
SELECT * FROM storage_room_inventory WHERE storage_room_id = 'room-id-here';
```

## Usage Guide

### **Creating a Storage Room**

1. Navigate to **Storage Room Management**
2. Click **"Add Storage Room"**
3. Fill in the required information:
   - **Name**: Descriptive room name
   - **Code**: Unique identifier (e.g., "STOR001")
   - **Store Location**: Select the associated store
   - **Floor Level**: Specify the floor
   - **Area**: Room size in square meters
   - **Max Capacity**: Maximum number of items
   - **Security Settings**: Configure access requirements
   - **Color Code**: Visual organization color
4. Click **"Create Storage Room"**

### **Managing Storage Rooms**

#### **Viewing Rooms**
- **List View**: See all storage rooms in a table format
- **Search**: Filter rooms by name, code, or description
- **Location Filter**: Filter by store location
- **Status Filter**: Filter by active/inactive/secure status

#### **Editing Rooms**
- Click the **Edit** button on any room
- Modify the required fields
- Click **"Update Storage Room"**

#### **Deleting Rooms**
- Click the **Delete** button on any room
- Confirm the deletion
- **Note**: Products in deleted rooms will be unassigned

### **Product Assignment**

#### **Assigning Products to Storage Rooms**
1. Edit a product
2. Select the appropriate storage room
3. The system will validate capacity limits
4. Save the product

#### **Moving Products Between Rooms**
```sql
-- Move multiple products to a new room
SELECT move_products_to_storage_room(
  ARRAY['product-id-1', 'product-id-2', 'product-id-3'], 
  'new-storage-room-id'
);
```

### **Capacity Management**

The system automatically tracks capacity:

- **Current Capacity**: Number of products currently in the room
- **Max Capacity**: Maximum allowed products
- **Capacity Percentage**: Visual indicator of room utilization
- **Overflow Prevention**: Prevents assignments that exceed capacity

#### **Capacity Indicators**
- 🟢 **Green**: < 75% capacity
- 🟡 **Yellow**: 75-90% capacity  
- 🔴 **Red**: > 90% capacity

## Security Features

### **Secure Rooms**
- **Access Control**: Require access cards for entry
- **Audit Trail**: Track all access and movements
- **Restricted Operations**: Limit who can modify secure rooms

### **Access Levels**
- **View**: All authenticated users can view rooms
- **Create/Edit**: Authorized users can manage rooms
- **Delete**: Admin users can delete rooms
- **Secure Access**: Special permissions for secure rooms

## Best Practices

### **Room Organization**
1. **Use Descriptive Names**: "Electronics Storage" vs "Room A"
2. **Consistent Coding**: Use patterns like "STOR001", "STOR002"
3. **Color Coding**: Use colors to group related rooms
4. **Capacity Planning**: Set realistic capacity limits

### **Security Considerations**
1. **Secure Rooms**: Use for valuable or sensitive items
2. **Access Cards**: Require for high-security areas
3. **Regular Audits**: Review access logs and capacity
4. **Backup Locations**: Plan for room maintenance or issues

### **Capacity Management**
1. **Monitor Usage**: Regularly check capacity percentages
2. **Plan Ahead**: Leave buffer space for growth
3. **Optimize Layout**: Use area efficiently
4. **Regular Cleanup**: Remove obsolete items

## Troubleshooting

### **Common Issues**

#### **Capacity Errors**
- **Problem**: Cannot assign products to room
- **Solution**: Check if room has available capacity
- **Prevention**: Monitor capacity regularly

#### **Room Not Found**
- **Problem**: Storage room doesn't appear in dropdown
- **Solution**: Verify room is active and accessible
- **Prevention**: Check room status and permissions

#### **Performance Issues**
- **Problem**: Slow loading of storage room data
- **Solution**: Check database indexes and queries
- **Prevention**: Regular database maintenance

### **Support**

For technical support or questions about the Storage Room Management System:

1. **Check Documentation**: Review this guide and related docs
2. **Database Logs**: Check for error messages
3. **API Testing**: Verify API endpoints are working
4. **Contact Support**: Reach out to the development team

## Future Enhancements

### **Planned Features**
- **Barcode Integration**: Scan products for room assignment
- **Mobile App**: Manage rooms from mobile devices
- **Advanced Analytics**: Detailed usage reports
- **Automated Alerts**: Capacity and security notifications
- **Integration**: Connect with external inventory systems

### **API Extensions**
- **Bulk Operations**: Move multiple products efficiently
- **Advanced Search**: Complex filtering and sorting
- **Real-time Updates**: WebSocket notifications
- **Export Functions**: Data export capabilities

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintainer**: LATS Development Team
