# Storage Room Management - User Guide

## Overview
The Storage Room Management system allows you to create and manage storage rooms with flexible shelf configurations. You can create storage rooms with custom row and column layouts, where each row can have a different number of columns.

## Features

### 🏢 **Storage Room Creation**
- Create storage rooms with custom names and codes
- Set room capacity, area, and security settings
- Configure floor levels and accessibility requirements
- Add color coding and notes for easy identification

### 📦 **Flexible Shelf Configuration**
- **Row-based Configuration**: Configure each row individually
- **Variable Columns**: Each row can have a different number of columns
- **Smart Naming**: Automatic shelf naming with row letters (A, B, C) and column numbers (1, 2, 3)
- **Bulk Generation**: Generate all shelves at once from row configuration

### 🏷️ **Shelf Management**
- Manual shelf creation with custom settings
- Automatic shelf code generation based on room code and position
- Shelf type configuration (standard, refrigerated, display, storage, specialty)
- Capacity and accessibility settings per shelf

## How to Use

### Step 1: Access Storage Room Management
1. Navigate to **Settings** → **Storage Rooms**
2. Click **"Add Storage Room"** button

### Step 2: Basic Room Information
Fill in the required fields:
- **Room Name**: Descriptive name for the storage room
- **Room Code**: Unique identifier (e.g., WH001, STORE-A)
- **Store Location**: Select the store location
- **Description**: Optional detailed description
- **Floor Level**: Which floor the room is on
- **Area (sqm)**: Room area in square meters
- **Max Capacity**: Maximum storage capacity

### Step 3: Row Configuration
This is the core feature for flexible shelf layout:

#### Adding Rows
1. Scroll to **"Row Configuration"** section
2. Click **"+ Add Row"** button
3. Set the number of columns for that row
4. Repeat for additional rows

#### Example Configuration
```
Row A: 3 columns  → Creates A1, A2, A3
Row B: 4 columns  → Creates B1, B2, B3, B4
Row C: 2 columns  → Creates C1, C2
```

#### Managing Rows
- **Add Row**: Click "+ Add Row" to add new rows
- **Remove Row**: Click "Remove" button on any row
- **Update Columns**: Change the number input to modify columns per row

### Step 4: Generate Shelves
1. Ensure you have entered a **Room Code**
2. Click **"Generate Shelves from Row Configuration"**
3. System automatically creates all shelves with proper naming

### Step 5: Manual Shelf Creation (Optional)
If you need custom shelves beyond the row configuration:

1. Click **"Add Shelf"** button
2. Fill in shelf details:
   - **Shelf Name**: Custom name for the shelf
   - **Shelf Code**: Auto-generated based on room code and position
   - **Row Number**: Which row this shelf belongs to
   - **Column Number**: Which column position
   - **Shelf Type**: Standard, refrigerated, display, storage, or specialty
   - **Max Capacity**: Maximum items the shelf can hold

### Step 6: Advanced Settings
Configure additional room settings:
- **Active Status**: Enable/disable the room
- **Security Settings**: Require access cards, secure access
- **Color Code**: Visual identification color
- **Notes**: Additional information

### Step 7: Save
Click **"Save Storage Room"** to create the room and all configured shelves.

## Naming Convention

### Room Codes
- Format: `{Location}-{Number}` or `{Custom Code}`
- Examples: `WH001`, `STORE-A`, `WAREHOUSE-1`

### Shelf Codes
- Format: `{RoomCode}-{RowLetter}{ColumnNumber}`
- Examples: 
  - `WH001-A1`, `WH001-A2`, `WH001-A3`
  - `WH001-B1`, `WH001-B2`, `WH001-B3`, `WH001-B4`
  - `WH001-C1`, `WH001-C2`

### Row Letters
- Automatic: A, B, C, D, E, F, G, H, I, J, K, L, M, N, O, P, Q, R, S, T, U, V, W, X, Y, Z
- Supports up to 26 rows per storage room

## Examples

### Example 1: Simple Warehouse Layout
**Room**: WH001 - Main Warehouse
**Configuration**:
- Row A: 5 columns
- Row B: 5 columns
- Row C: 5 columns

**Generated Shelves**: 15 shelves total
- A1, A2, A3, A4, A5
- B1, B2, B3, B4, B5
- C1, C2, C3, C4, C5

### Example 2: Irregular Store Layout
**Room**: STORE-A - Retail Storage
**Configuration**:
- Row A: 3 columns
- Row B: 6 columns
- Row C: 4 columns
- Row D: 2 columns

**Generated Shelves**: 15 shelves total
- A1, A2, A3
- B1, B2, B3, B4, B5, B6
- C1, C2, C3, C4
- D1, D2

### Example 3: Small Storage Room
**Room**: OFFICE-1 - Office Storage
**Configuration**:
- Row A: 2 columns
- Row B: 2 columns

**Generated Shelves**: 4 shelves total
- A1, A2
- B1, B2

## Tips and Best Practices

### ✅ **Recommended Practices**
1. **Use Descriptive Room Names**: "Main Warehouse", "Electronics Storage", "Cold Storage"
2. **Consistent Room Codes**: Use patterns like `WH001`, `WH002`, `STORE-A`, `STORE-B`
3. **Plan Your Layout**: Sketch your storage room layout before configuring rows
4. **Consider Access Patterns**: Place frequently accessed items in easily reachable positions
5. **Use Color Coding**: Assign colors to different types of storage areas

### ⚠️ **Important Notes**
- **Unique Codes**: Room codes must be unique within the same store location
- **Row Limits**: Maximum 26 rows per room (A-Z)
- **Column Limits**: Maximum 100 columns per row
- **Shelf Limits**: No practical limit on total shelves per room
- **Code Validation**: System checks for duplicate codes before saving

### 🔧 **Troubleshooting**

#### Common Issues
1. **"Code already exists" error**
   - Solution: Use a different room code
   - Check existing rooms in the same location

2. **"Generate Shelves" button not working**
   - Ensure you have entered a room code
   - Make sure you have configured at least one row

3. **Shelf codes not generating correctly**
   - Check that room code is entered
   - Verify row and column numbers are set

#### Error Messages
- **409 Conflict**: Room code already exists in this location
- **Validation Error**: Required fields are missing
- **Generation Error**: No rows configured or missing room code

## Technical Details

### Database Schema
- **Storage Rooms**: `lats_storage_rooms` table
- **Shelves**: `lats_store_shelves` table
- **Constraints**: Unique room codes per location, unique shelf positions per room

### API Endpoints
- **Create Room**: `POST /lats_storage_rooms`
- **Create Shelves**: `POST /lats_store_shelves`
- **Validation**: Pre-submission code availability checks

### Performance
- **Bulk Operations**: All shelves created in single transaction
- **Validation**: Client-side and server-side validation
- **Error Handling**: Comprehensive error messages and recovery

## Support

For technical support or questions about the Storage Room Management system:
- Check the error messages for specific guidance
- Verify all required fields are completed
- Ensure room codes are unique within your store location
- Contact system administrator for database-related issues

---

**Version**: 1.0  
**Last Updated**: January 2025  
**Compatibility**: LATS System v2.0+
