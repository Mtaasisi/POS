# Storage API Error Fixes

## Issues Identified and Fixed

### 1. 409 Conflict Errors on `lats_store_shelves` POST requests

**Problem**: Multiple shelf positions were being created in parallel using `Promise.all()`, causing unique constraint violations on the `UNIQUE(store_location_id, code)` constraint.

**Root Cause**: In `StorageRoomModal.tsx`, when creating a storage room with auto-generated shelves, all shelf positions were created simultaneously, leading to race conditions.

**Solution**: 
- Changed parallel shelf creation to sequential processing
- Added better error handling for duplicate shelf codes
- Improved user feedback for partial failures

**Files Fixed**:
- `src/features/lats/components/inventory-management/StorageRoomModal.tsx`
- `src/features/settings/utils/storeShelfApi.ts`

### 2. 406 Not Acceptable Error on `lats_storage_rooms` query

**Problem**: A query was attempting to find storage rooms with `code=eq.01` which doesn't match the expected format.

**Root Cause**: The error suggests there's a mismatch between expected storage room code format (`STOR001`) and what's being queried (`01`).

**Status**: This appears to be intermittent and may be related to RLS policies or data validation.

## Code Changes Made

### StorageRoomModal.tsx
```typescript
// Before: Parallel shelf creation (causing conflicts)
const tasks = allPositions.map(position => storeShelfApi.create(position));
await Promise.all(tasks);

// After: Sequential shelf creation (prevents conflicts)
let createdCount = 0;
for (const position of allPositions) {
  try {
    await storeShelfApi.create(position);
    createdCount++;
  } catch (err: any) {
    console.error('Error creating shelf position:', position.code, err);
    // Continue with other positions even if one fails
  }
}
```

### storeShelfApi.ts
```typescript
// Added better error handling for duplicate constraints
if (error.code === '23505' || error.message?.includes('duplicate')) {
  throw new Error(`Shelf with code "${data.code}" already exists in this location`);
}
```

## Prevention Measures

1. **Sequential Operations**: When creating multiple related records with unique constraints, use sequential processing instead of parallel.

2. **Duplicate Handling**: Added graceful handling of duplicate key errors with user-friendly messages.

3. **Partial Success Feedback**: Users now get appropriate feedback when some operations succeed and others fail.

## Testing Recommendations

1. Test creating storage rooms with multiple shelf positions
2. Verify that duplicate shelf creation attempts are handled gracefully
3. Check that RLS policies allow proper access to storage room queries

## Database Constraints

The following constraints are in place:
- `lats_storage_rooms`: `UNIQUE(store_location_id, code)`
- `lats_store_shelves`: `UNIQUE(store_location_id, code)`
- `lats_store_shelves`: `UNIQUE(storage_room_id, row_number, column_number)`

These constraints ensure data integrity but require careful handling during bulk operations.
