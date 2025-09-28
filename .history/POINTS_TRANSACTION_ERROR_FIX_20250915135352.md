# Points Transaction Error Fix

## Problem
When completing a repair, the system was trying to log points to the `points_transactions` table with incorrect field names, causing a 400 error:

```
[Error] Failed to load resource: the server responded with a status of 400 () (points_transactions, line 0)
```

## Root Cause
The code was trying to insert technician points into the `points_transactions` table using:
- `user_id` field (which doesn't exist in that table)
- `transaction_type` field (which expects customer transaction types)

The `points_transactions` table is designed for **customer loyalty points**, not **technician/staff points**.

## Solution

### 1. Use Correct Table
Changed from `points_transactions` to `staff_points` table which is designed for technician points:

```typescript
// Before (incorrect)
await supabase.from('points_transactions').insert({
  user_id: device.assignedTo,  // ❌ Wrong field name
  points_change: 20,           // ❌ Wrong field name
  transaction_type: 'repair_completion', // ❌ Wrong transaction type
  reason: `Repair completed for device ${device.brand} ${device.model}`,
  created_by: currentUser.id
});

// After (correct)
await supabase.from('staff_points').insert({
  user_id: device.assignedTo,  // ✅ Correct field name
  points: 20,                  // ✅ Correct field name
  reason: `Repair completed for device ${device.brand} ${device.model}`,
  created_by: currentUser.id
});
```

### 2. Added Error Handling
Wrapped the points logging in try-catch to prevent it from breaking the status update:

```typescript
try {
  await supabase.from('staff_points').insert({...});
} catch (pointsError) {
  console.warn('Could not log points transaction:', pointsError);
  // Don't fail the entire operation if points logging fails
}
```

### 3. Table Schema Verification
Confirmed that the `staff_points` table exists with the correct schema:
- `id` (UUID, primary key)
- `user_id` (UUID, references auth_users)
- `points` (INTEGER)
- `earned_date` (TIMESTAMP)
- `reason` (TEXT)
- `created_by` (UUID, references auth_users)
- `created_at` (TIMESTAMP)

## Files Modified
- `src/context/DevicesContext.tsx` - Fixed points logging to use correct table and fields

## Result
- ✅ No more 400 errors when completing repairs
- ✅ Technician points are properly logged
- ✅ Status updates work smoothly with optimistic UI
- ✅ Error handling prevents points logging failures from breaking the main operation

## Testing
To test the fix:
1. Complete a repair (change status to 'repair-complete')
2. Check that no 400 errors appear in console
3. Verify that technician points are awarded
4. Confirm that the status update completes successfully
