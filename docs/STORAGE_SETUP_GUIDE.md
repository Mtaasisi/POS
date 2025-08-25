# Storage Setup Guide

## Issue: Shelves Not Fetching

### Problem
When using the AddProductPage, you may see "No storage rooms available" and "No shelves available" in the Storage Location section. This happens because the database doesn't have any storage infrastructure set up yet.

### Root Cause
The `StorageLocationForm` component tries to load:
1. Storage rooms from `lats_storage_rooms` table
2. Shelves from `lats_store_shelves` table

If these tables are empty, the dropdowns will show "No data available" messages.

### Solution

#### Option 1: Create Storage Data via UI (Recommended)

1. **Navigate to Storage Management**:
   - Go to `Settings → Storage Management`
   - Or navigate to `/lats/storage-room-management`

2. **Create Store Location** (if needed):
   - Click "Add Store Location"
   - Fill in the required information
   - Save the location

3. **Create Storage Room**:
   - Click "Add Storage Room"
   - Select the store location
   - Fill in room details (name, code, capacity, etc.)
   - Save the room

4. **Create Shelves**:
   - Click on the storage room to manage its shelves
   - Click "Add Shelf"
   - Configure shelf details (name, type, capacity, etc.)
   - Save the shelf

#### Option 2: Use Database Script (Advanced)

If you prefer to create sample data programmatically:

```bash
# Run the sample data creation script
node scripts/create-sample-storage-data.js
```

**Note**: This script may fail due to Row Level Security (RLS) policies. You may need to temporarily disable RLS or run it with proper authentication.

### Database Schema

The storage system uses these tables:

- **`lats_store_locations`**: Physical store locations
- **`lats_storage_rooms`**: Storage rooms within locations
- **`lats_store_shelves`**: Shelves within storage rooms

### Relationships

```
Store Location (1) → Storage Rooms (many)
Storage Room (1) → Shelves (many)
```

### Form Behavior

- **Storage rooms dropdown**: Shows all active storage rooms
- **Shelves dropdown**: Shows shelves for the selected storage room
- **Validation**: Both fields are now optional to allow product creation without storage data
- **Help message**: Shows guidance when no storage data exists

### Testing

After setting up storage data:

1. Go to AddProductPage
2. Scroll to "Storage Location" section
3. You should see storage rooms in the dropdown
4. Select a storage room to see its shelves
5. Select a shelf to complete the storage location

### Troubleshooting

If shelves still don't load:

1. **Check browser console** for API errors
2. **Verify database tables** have data
3. **Check RLS policies** allow reading the tables
4. **Ensure proper relationships** between tables

### API Endpoints

The form uses these API calls:

- `storageRoomApi.getAll()` - Get all storage rooms
- `storeShelfApi.getShelvesByStorageRoom(roomId)` - Get shelves for a room

### Future Improvements

- Add inline storage creation from AddProductPage
- Auto-create default storage structure for new stores
- Add storage capacity validation
- Implement storage location suggestions based on product type
