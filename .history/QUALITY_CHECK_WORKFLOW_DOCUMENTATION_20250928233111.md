# Quality Check Workflow for Purchase Orders

## 🎯 Overview

This document describes the complete quality check workflow implemented for purchase orders after receiving products. The system ensures that all received items undergo proper quality verification before the purchase order can be marked as completed.

## 📋 Workflow Status Flow

```
draft → sent → received → quality_check → completed
                                    ↓
                               failed/partial_received
```

### Status Definitions

- **`received`**: Products have been received from supplier, inventory updated
- **`quality_check`**: Products are undergoing quality verification ⭐ **NEW**
- **`completed`**: All items passed quality check, order fully processed
- **`failed`**: Quality check failed, order returns to `received` for re-processing
- **`partial_received`**: Some items failed quality check, partial completion

## 🔧 Database Implementation

### 1. Status Constraint Update

The purchase order status constraint has been updated to include the new `quality_check` status:

```sql
CHECK (status IN (
    'draft', 'sent', 'confirmed', 'shipped', 
    'partial_received', 'received', 
    'quality_check',    -- NEW
    'completed', 'cancelled'
))
```

### 2. Quality Checks Table

```sql
CREATE TABLE purchase_order_quality_checks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    purchase_order_id UUID NOT NULL REFERENCES lats_purchase_orders(id),
    item_id UUID NOT NULL REFERENCES lats_purchase_order_items(id),
    passed BOOLEAN NOT NULL,
    notes TEXT,
    checked_by TEXT NOT NULL,
    checked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🚀 Available Functions

### 1. Move PO to Quality Check

```sql
SELECT move_po_to_quality_check(
    purchase_order_id_param UUID,
    user_id_param UUID DEFAULT NULL,
    quality_notes TEXT DEFAULT NULL
) RETURNS BOOLEAN;
```

**Purpose**: Moves a purchase order from `received` to `quality_check` status

**Parameters**:
- `purchase_order_id_param`: The UUID of the purchase order
- `user_id_param`: User performing the action (optional)
- `quality_notes`: Initial notes about the quality check (optional)

**Returns**: `true` if successful, `false` if failed

### 2. Complete Quality Check

```sql
SELECT complete_quality_check(
    purchase_order_id_param UUID,
    quality_result TEXT, -- 'passed', 'failed', 'partial'
    quality_notes TEXT DEFAULT NULL,
    user_id_param UUID DEFAULT NULL
) RETURNS BOOLEAN;
```

**Purpose**: Completes the quality check and moves the PO to appropriate status

**Parameters**:
- `purchase_order_id_param`: The UUID of the purchase order
- `quality_result`: Result of quality check (`'passed'`, `'failed'`, `'partial'`)
- `quality_notes`: Notes about the quality check result (optional)
- `user_id_param`: User completing the check (optional)

**Status Transitions**:
- `'passed'` → `'completed'`
- `'failed'` → `'received'` (for re-processing)
- `'partial'` → `'partial_received'`

### 3. Add Item Quality Check

```sql
SELECT add_item_quality_check(
    purchase_order_id_param UUID,
    item_id_param UUID,
    passed BOOLEAN,
    notes TEXT DEFAULT NULL,
    checked_by_param TEXT DEFAULT NULL
) RETURNS BOOLEAN;
```

**Purpose**: Records quality check result for individual items

**Parameters**:
- `purchase_order_id_param`: The UUID of the purchase order
- `item_id_param`: The UUID of the specific item
- `passed`: Whether the item passed quality check (`true`/`false`)
- `notes`: Quality check notes (optional)
- `checked_by_param`: Person who performed the check (optional)

### 4. Get Quality Check Summary

```sql
SELECT * FROM get_quality_check_summary(
    purchase_order_id_param UUID
);
```

**Purpose**: Returns a summary of quality check status for a purchase order

**Returns**:
- `total_items`: Total number of items in the PO
- `checked_items`: Number of items that have been quality checked
- `passed_items`: Number of items that passed quality check
- `failed_items`: Number of items that failed quality check
- `pending_items`: Number of items pending quality check
- `overall_status`: Overall quality status (`'not_started'`, `'passed'`, `'failed'`, `'partial'`)

## 📊 Available Views

### Quality Check Details View

```sql
SELECT * FROM purchase_order_quality_details;
```

**Purpose**: Provides detailed view of all purchase orders and their quality check status

**Returns**:
- Purchase order information
- Item details
- Quality check status for each item
- Quality check results and notes
- Inspector information and timestamps

## 🔄 Usage Workflow

### Step 1: Receive Products
1. Products arrive from supplier
2. Use existing receive function to update inventory
3. Purchase order status becomes `'received'`

### Step 2: Start Quality Check
```sql
SELECT move_po_to_quality_check(
    'your-po-uuid'::UUID,
    'user-id'::UUID,
    'Starting quality inspection process'
);
```

### Step 3: Perform Item Quality Checks
```sql
-- Check individual items
SELECT add_item_quality_check(
    'your-po-uuid'::UUID,
    'item-uuid'::UUID,
    true,  -- or false if failed
    'Item in good condition, no defects found',
    'quality-inspector-name'
);
```

### Step 4: Review Quality Summary
```sql
SELECT * FROM get_quality_check_summary('your-po-uuid'::UUID);
```

### Step 5: Complete Quality Check
```sql
-- If all items passed
SELECT complete_quality_check(
    'your-po-uuid'::UUID,
    'passed',
    'All items passed quality check successfully',
    'quality-manager'::UUID
);

-- If some items failed
SELECT complete_quality_check(
    'your-po-uuid'::UUID,
    'partial',
    'Some items failed quality check, see individual item notes',
    'quality-manager'::UUID
);

-- If all items failed
SELECT complete_quality_check(
    'your-po-uuid'::UUID,
    'failed',
    'All items failed quality check, returning to supplier',
    'quality-manager'::UUID
);
```

## 📝 Audit Trail

All quality check actions are automatically logged in the `purchase_order_audit` table:

- **Action**: `'Quality Check Started'`, `'Quality Check Completed: passed/failed/partial'`
- **User**: User who performed the action
- **Details**: JSON object containing action details, previous/new status, notes, etc.
- **Timestamp**: When the action occurred

## 🧪 Testing

Run the test script to validate the quality check workflow:

```sql
-- Run this in Supabase SQL Editor
\i TEST_QUALITY_CHECK_WORKFLOW.sql
```

The test script will:
1. Check current purchase order statuses
2. Test moving a PO to quality check
3. Test adding item quality checks
4. Test completing quality checks
5. Verify audit trail
6. Show quality check summaries

## 🎯 Benefits

### For Users
- **Clear Process**: Know exactly when quality checks are needed
- **Detailed Tracking**: Track quality status of individual items
- **Audit Trail**: Complete history of quality check actions
- **Flexible Results**: Handle passed, failed, and partial results

### For Business
- **Quality Assurance**: Ensure all received products meet standards
- **Process Control**: Prevent incomplete orders from being marked complete
- **Compliance**: Maintain detailed quality check records
- **Analytics**: Track quality metrics and trends

### For System
- **Data Integrity**: Proper status transitions and validation
- **Performance**: Optimized queries with proper indexing
- **Scalability**: Functions designed for high-volume operations
- **Maintainability**: Clear separation of concerns and documentation

## 🔧 Integration Points

### Frontend Integration
- Add "Start Quality Check" button when PO status is `'received'`
- Add quality check form for individual items
- Add quality check summary display
- Add "Complete Quality Check" button with result selection

### API Integration
- Create endpoints for all quality check functions
- Add quality check status to purchase order responses
- Include quality check data in purchase order details

### Reporting Integration
- Add quality check metrics to dashboards
- Include quality check data in purchase order reports
- Create quality check trend analysis

## ⚠️ Important Notes

1. **Status Validation**: Functions validate current status before allowing transitions
2. **Error Handling**: All functions include proper error handling and logging
3. **Transaction Safety**: Database changes are wrapped in transactions
4. **Performance**: Proper indexing ensures fast queries even with large datasets
5. **Backwards Compatibility**: Existing purchase orders continue to work normally

## 🚀 Next Steps

1. **Run Implementation**: Execute `IMPLEMENT_QUALITY_CHECK_WORKFLOW.sql`
2. **Test System**: Run `TEST_QUALITY_CHECK_WORKFLOW.sql`
3. **Frontend Integration**: Add UI components for quality check workflow
4. **API Development**: Create REST endpoints for quality check functions
5. **User Training**: Train staff on new quality check process
6. **Monitoring**: Set up monitoring for quality check metrics

---

**Quality Check System Ready for Production! 🎉**
