# Quality Check System Documentation

## Overview

A comprehensive quality check system for purchase orders with customizable templates, automated status tracking, and detailed item-level inspection.

## Features

✅ **Customizable Templates** - Create quality check templates for different product categories  
✅ **Multiple Criteria** - Define multiple check criteria per template  
✅ **Item-Level Inspection** - Check each item against multiple criteria  
✅ **Automated Status Updates** - Auto-update status based on check results  
✅ **Defect Tracking** - Track defects, quantities, and actions taken  
✅ **Image Attachments** - Attach images to quality check items  
✅ **Digital Signatures** - Support for digital signatures  
✅ **Comprehensive Reporting** - Detailed summaries and reports  

## Database Schema

### Tables

#### 1. `quality_check_templates`
Stores reusable quality check templates

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | TEXT | Template name |
| description | TEXT | Template description |
| category | TEXT | Template category (electronics, accessories, general, custom) |
| is_active | BOOLEAN | Whether template is active |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

#### 2. `quality_check_criteria`
Stores criteria for each template

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| template_id | UUID | Reference to template |
| name | TEXT | Criteria name |
| description | TEXT | Criteria description |
| is_required | BOOLEAN | Whether criteria is required |
| sort_order | INTEGER | Display order |
| created_at | TIMESTAMPTZ | Creation timestamp |

#### 3. `purchase_order_quality_checks`
Main quality check records for purchase orders

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| purchase_order_id | UUID | Reference to purchase order |
| template_id | UUID | Reference to template used |
| status | TEXT | Check status (pending, in_progress, passed, failed, partial) |
| overall_result | TEXT | Overall result (pass, fail, conditional) |
| checked_by | UUID | User who performed check |
| checked_at | TIMESTAMPTZ | Check completion timestamp |
| notes | TEXT | General notes |
| signature | TEXT | Digital signature |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

#### 4. `purchase_order_quality_check_items`
Individual item check results

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| quality_check_id | UUID | Reference to quality check |
| purchase_order_item_id | UUID | Reference to PO item |
| criteria_id | UUID | Reference to criteria |
| criteria_name | TEXT | Criteria name |
| result | TEXT | Check result (pass, fail, na) |
| quantity_checked | INTEGER | Quantity checked |
| quantity_passed | INTEGER | Quantity passed |
| quantity_failed | INTEGER | Quantity failed |
| defect_type | TEXT | Type of defect if failed |
| defect_description | TEXT | Defect description |
| action_taken | TEXT | Action taken (accept, reject, return, replace, repair) |
| notes | TEXT | Item-specific notes |
| images | JSONB | Array of image URLs |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

## Helper Functions

### 1. `create_quality_check_from_template()`
Creates a quality check from a template

**Parameters:**
- `p_purchase_order_id` UUID - Purchase order ID
- `p_template_id` UUID - Template to use
- `p_checked_by` UUID - User performing the check

**Returns:** UUID - Quality check ID

**Example:**
```sql
SELECT create_quality_check_from_template(
    'c6292820-c3aa-4a33-bbfb-5abcc5b0b038',
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'a7c9adb7-f525-4850-bd42-79a769f12953'
);
```

### 2. `complete_quality_check()`
Completes a quality check and updates status

**Parameters:**
- `p_quality_check_id` UUID - Quality check ID
- `p_notes` TEXT - Optional notes
- `p_signature` TEXT - Optional signature

**Returns:** BOOLEAN - Success status

**Example:**
```sql
SELECT complete_quality_check(
    'quality-check-id',
    'All items passed quality check',
    'digital-signature-data'
);
```

### 3. `get_quality_check_summary()`
Gets a summary of quality checks for a purchase order

**Parameters:**
- `p_purchase_order_id` UUID - Purchase order ID

**Returns:** Table with summary data

**Example:**
```sql
SELECT * FROM get_quality_check_summary('c6292820-c3aa-4a33-bbfb-5abcc5b0b038');
```

## Default Templates

### Electronics Quality Check
For electronic devices like phones, tablets, laptops

**Criteria:**
1. ✅ Physical Inspection - Check for physical damage, scratches, dents
2. ✅ Power Test - Device powers on correctly
3. ✅ Functionality Test - All features work as expected
4. ✅ Accessories Check - All accessories included and functional
5. ✅ Serial/IMEI Verification - Serial number or IMEI matches documentation
6. ⭕ Packaging Condition - Original packaging intact and undamaged
7. ⭕ Documentation - Manual and warranty documents included

### General Quality Check
For general items and accessories

**Criteria:**
1. ✅ Visual Inspection - Check for visible defects or damage
2. ✅ Quantity Verification - Verify quantity matches order
3. ✅ Packaging Integrity - Check packaging is intact
4. ✅ Label/SKU Match - Labels and SKU match order specifications

✅ = Required  
⭕ = Optional

## Usage Workflow

### Step 1: Create Quality Check
```sql
-- Create quality check from template
SELECT create_quality_check_from_template(
    'purchase-order-id',
    'template-id',
    'user-id'
);
```

### Step 2: Perform Inspections
```sql
-- Update quality check items with results
UPDATE purchase_order_quality_check_items
SET 
    result = 'pass',
    quantity_checked = 10,
    quantity_passed = 10,
    quantity_failed = 0,
    notes = 'All items passed inspection'
WHERE id = 'check-item-id';
```

### Step 3: Handle Failed Items
```sql
-- Update failed items with defect information
UPDATE purchase_order_quality_check_items
SET 
    result = 'fail',
    quantity_checked = 10,
    quantity_passed = 8,
    quantity_failed = 2,
    defect_type = 'physical_damage',
    defect_description = 'Screen scratches on 2 units',
    action_taken = 'return',
    notes = 'Returning 2 defective units to supplier'
WHERE id = 'check-item-id';
```

### Step 4: Complete Quality Check
```sql
-- Complete the quality check
SELECT complete_quality_check(
    'quality-check-id',
    'Quality check completed successfully. 2 units rejected and returned.',
    'digital-signature-data'
);
```

### Step 5: View Summary
```sql
-- Get quality check summary
SELECT * FROM get_quality_check_summary('purchase-order-id');
```

## API Integration Examples

### JavaScript/TypeScript

#### Create Quality Check
```typescript
const { data, error } = await supabase
  .rpc('create_quality_check_from_template', {
    p_purchase_order_id: 'po-id',
    p_template_id: 'template-id',
    p_checked_by: 'user-id'
  });
```

#### Update Check Item
```typescript
const { data, error } = await supabase
  .from('purchase_order_quality_check_items')
  .update({
    result: 'pass',
    quantity_checked: 10,
    quantity_passed: 10,
    quantity_failed: 0,
    notes: 'All items passed'
  })
  .eq('id', 'check-item-id')
  .select()
  .single();
```

#### Complete Quality Check
```typescript
const { data, error } = await supabase
  .rpc('complete_quality_check', {
    p_quality_check_id: 'qc-id',
    p_notes: 'Quality check completed',
    p_signature: 'signature-data'
  });
```

#### Get Summary
```typescript
const { data, error } = await supabase
  .rpc('get_quality_check_summary', {
    p_purchase_order_id: 'po-id'
  });
```

## Status Flow

```
pending → in_progress → passed/failed/partial
```

### Status Definitions
- **pending**: Quality check created but not started
- **in_progress**: Quality check in progress
- **passed**: All items passed
- **failed**: All items failed
- **partial**: Some items passed, some failed

### Result Definitions
- **pass**: Item passed all criteria
- **fail**: Item failed one or more criteria
- **na**: Not applicable / Not checked

### Action Definitions
- **accept**: Accept the item as is
- **reject**: Reject the item completely
- **return**: Return to supplier
- **replace**: Request replacement
- **repair**: Send for repair

## Automated Features

### Auto Status Updates
The system automatically updates quality check status based on item results:
- All items **pass** → Status: **passed**, Result: **pass**
- All items **fail** → Status: **failed**, Result: **fail**
- Mixed results → Status: **partial**, Result: **conditional**

### Purchase Order Integration
Quality check results automatically update the purchase order:
- Updates `quality_check_status`
- Updates `quality_check_date`
- Updates `quality_check_passed` flag
- Updates `quality_check_by` user
- Updates `quality_check_signature`

## Best Practices

1. **Use Templates**: Create templates for common product categories
2. **Required Criteria**: Mark critical checks as required
3. **Document Defects**: Always describe defects in detail
4. **Take Actions**: Specify what action was taken for failed items
5. **Attach Images**: Use images to document defects
6. **Complete Checks**: Always complete checks with notes and signature
7. **Review Summaries**: Use summary function for reporting

## Troubleshooting

### Quality Check Not Creating
- Verify purchase order exists
- Verify template exists and is active
- Check user has permissions

### Status Not Updating
- Verify triggers are enabled
- Check if all required criteria are checked
- Ensure item results are set correctly

### Summary Not Showing Data
- Verify quality check exists for the purchase order
- Check RLS policies are configured correctly
- Ensure user has read permissions

## Installation

Run the `RECREATE_QUALITY_CHECK_COMPLETE.sql` script in your Supabase SQL Editor:

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Paste and run the script
4. Verify success messages

The script will:
✅ Create all required tables  
✅ Set up indexes for performance  
✅ Create RLS policies  
✅ Add helper functions  
✅ Create default templates  
✅ Set up automated triggers  

## Support

For issues or questions:
1. Check the success messages after running the script
2. Verify all tables were created
3. Test with sample data
4. Review database logs for errors
