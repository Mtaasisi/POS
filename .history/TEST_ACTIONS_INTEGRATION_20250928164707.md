# Purchase Order Actions Database Integration Test

## Overview
This document outlines how to test the new database-integrated purchase order actions functionality.

## Prerequisites
1. Run the `CREATE_ACTION_TABLES.sql` script in your Supabase SQL Editor
2. Ensure your Supabase client is properly configured
3. Have at least one purchase order in draft status for testing

## Database Tables Created
The following tables were created for the actions functionality:

- `purchase_order_quality_checks` - Stores quality check results
- `purchase_order_returns` - Stores return order information
- `purchase_order_return_items` - Stores items being returned
- `purchase_order_messages` - Stores notes and messages
- `purchase_order_audit` - Stores audit trail for all actions

## Testing Steps

### 1. Test Delete Order Action
```typescript
// This should only work for draft orders
const result = await PurchaseOrderActionsService.deleteOrder('order-id');
console.log(result); // Should return { success: true, message: 'Order deleted successfully' }
```

### 2. Test Cancel Order Action
```typescript
// This should only work for sent/confirmed orders
const result = await PurchaseOrderActionsService.cancelOrder('order-id');
console.log(result); // Should return { success: true, message: 'Order cancelled successfully' }
```

### 3. Test Quality Check Actions
```typescript
// Update individual item quality check
const result = await PurchaseOrderActionsService.updateItemQualityCheck('item-id', 'passed', 'Item looks good');
console.log(result); // Should return { success: true, message: 'Quality check updated' }

// Complete quality check process
const result2 = await PurchaseOrderActionsService.completeQualityCheck('order-id');
console.log(result2); // Should return { success: true, message: 'Quality check completed' }
```

### 4. Test Notes System
```typescript
// Add a note
const result = await PurchaseOrderActionsService.addNote('order-id', 'Test note content', 'Test User');
console.log(result); // Should return { success: true, message: 'Note added successfully' }

// Get notes
const result2 = await PurchaseOrderActionsService.getNotes('order-id');
console.log(result2); // Should return { success: true, message: 'Notes retrieved', data: [...] }
```

### 5. Test Bulk Actions
```typescript
// Bulk update status
const result = await PurchaseOrderActionsService.bulkUpdateStatus(['item-id-1', 'item-id-2'], 'processing');
console.log(result); // Should return { success: true, message: 'Updated 2 items' }

// Bulk assign location
const result2 = await PurchaseOrderActionsService.bulkAssignLocation(['item-id-1', 'item-id-2'], 'Warehouse A');
console.log(result2); // Should return { success: true, message: 'Assigned 2 items to Warehouse A' }
```

### 6. Test Return Order
```typescript
const returnData = {
  reason: 'Defective items',
  returnType: 'defective',
  items: [{ itemId: 'item-id-1', quantity: 2 }],
  notes: 'Items were damaged during shipping'
};

const result = await PurchaseOrderActionsService.createReturnOrder('order-id', returnData);
console.log(result); // Should return { success: true, message: 'Return order created successfully' }
```

### 7. Test SMS Integration
```typescript
const result = await PurchaseOrderActionsService.sendSMS('+255123456789', 'Test SMS message', 'order-id');
console.log(result); // Should return { success: true, message: 'SMS sent successfully' }
```

### 8. Test Duplicate Order
```typescript
const result = await PurchaseOrderActionsService.duplicateOrder('order-id');
console.log(result); // Should return { success: true, message: 'Order duplicated successfully' }
```

## Verification Queries

### Check Quality Checks
```sql
SELECT * FROM purchase_order_quality_checks 
WHERE purchase_order_id = 'your-order-id';
```

### Check Notes/Messages
```sql
SELECT * FROM purchase_order_messages 
WHERE purchase_order_id = 'your-order-id' 
AND type = 'note';
```

### Check Return Orders
```sql
SELECT * FROM purchase_order_returns 
WHERE purchase_order_id = 'your-order-id';
```

### Check Audit Trail
```sql
SELECT * FROM purchase_order_audit 
WHERE purchase_order_id = 'your-order-id' 
ORDER BY timestamp DESC;
```

## Expected Results

All actions should:
1. Return `{ success: true, message: '...' }` on success
2. Return `{ success: false, message: '...' }` on failure
3. Log the action in the audit trail
4. Update the UI with appropriate success/error messages
5. Respect Row Level Security policies

## Troubleshooting

### Common Issues:
1. **Permission Denied**: Check RLS policies are correctly set up
2. **Table Not Found**: Ensure you ran the CREATE_ACTION_TABLES.sql script
3. **Foreign Key Errors**: Ensure referenced purchase orders and items exist
4. **Auth Context**: Make sure user is authenticated and has proper permissions

### Debug Steps:
1. Check Supabase logs for detailed error messages
2. Verify table schemas match the service expectations
3. Test individual database operations in Supabase SQL Editor
4. Check browser console for JavaScript errors

## Success Criteria

✅ All action buttons work without errors
✅ Database records are created/updated correctly
✅ Audit trail captures all actions
✅ UI updates reflect database changes
✅ Error handling works properly
✅ RLS policies prevent unauthorized access
