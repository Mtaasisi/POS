

# 🚀 Complete Purchase Order Workflow - End-to-End Testing Guide

## Overview
This guide will walk you through testing the entire purchase order workflow from creation to completion.

---

## 📋 Pre-Testing Checklist

### Database Setup
- [ ] Run `FIX_ALL_METADATA.sql` to fix any existing inventory items
- [ ] Run `COMPLETE_WORKFLOW_VALIDATION.sql` Section 1-4 to verify database is ready
- [ ] Run `PAYMENT_VALIDATION.sql` Section 1-2 to verify payment system
- [ ] Ensure `get_received_items_for_po` function exists
- [ ] Verify all RLS policies are active

### Application Setup
- [ ] Clear browser cache
- [ ] Open browser dev tools (F12)
- [ ] Have Console tab visible to see logs
- [ ] Login with valid user account
- [ ] Navigate to Purchase Orders page

---

## 🎯 Test Scenario 1: Complete Simple Workflow

### Step 1: Create Purchase Order

**Action:**
1. Click "New Purchase Order" button
2. Fill in:
   - Supplier: Select existing supplier
   - Currency: USD (or your default)
   - Add 2-3 products with quantities
3. Click "Create Purchase Order"

**Expected Result:**
- ✅ Success toast appears
- ✅ Redirected to PO detail page
- ✅ Status shows "Draft"
- ✅ Items tab shows all added items
- ✅ Financial overview shows correct totals

**Console Logs to Check:**
```
✅ [PurchaseOrderService] Purchase order created successfully
```

**SQL Validation:**
```sql
-- Verify PO was created
SELECT * FROM lats_purchase_orders 
WHERE order_number = 'YOUR_PO_NUMBER'
ORDER BY created_at DESC LIMIT 1;

-- Verify items were created
SELECT * FROM lats_purchase_order_items 
WHERE purchase_order_id = 'YOUR_PO_ID';
```

---

### Step 2: Confirm Purchase Order

**Action:**
1. On PO detail page, click "Confirm Order" button
2. Confirm the action in modal

**Expected Result:**
- ✅ Status changes to "Confirmed"
- ✅ Success toast appears
- ✅ Overview tab updates

**SQL Validation:**
```sql
SELECT id, status FROM lats_purchase_orders 
WHERE id = 'YOUR_PO_ID';
-- Should show status = 'confirmed'
```

---

### Step 3: Add Payment

**Action:**
1. Click "Add Payment" button
2. Select payment account
3. Enter amount (try full or partial)
4. Select payment method
5. Click "Submit Payment"

**Expected Result:**
- ✅ Payment success toast
- ✅ Payment appears in Payments tab
- ✅ Financial overview updates with paid amount
- ✅ Remaining amount calculated correctly

**Console Logs to Check:**
```
💰 Processing purchase order payment...
✅ Payment processed successfully
```

**SQL Validation:**
```sql
-- Check payment was recorded
SELECT * FROM purchase_order_payments 
WHERE purchase_order_id = 'YOUR_PO_ID';

-- Check PO paid_amount updated
SELECT paid_amount, total_amount 
FROM lats_purchase_orders 
WHERE id = 'YOUR_PO_ID';

-- Check account balance was deducted
SELECT balance FROM finance_accounts 
WHERE id = 'YOUR_ACCOUNT_ID';
```

---

### Step 4: Perform Quality Check

**Action:**
1. Click "Received" tab
2. Click "Start Quality Check" button
3. Select a quality check template
4. For each item:
   - Enter quantity checked
   - Enter quantity passed/failed
   - Select result (pass/fail/na)
   - Add notes if needed
5. Click "Complete Quality Check"

**Expected Result:**
- ✅ Quality Check Summary appears in Received tab
- ✅ Shows correct pass/fail statistics
- ✅ Quality checked items listed
- ✅ "Receive to Inventory" button appears

**Console Logs to Check:**
```
✅ [PurchaseOrderService] Quality check created
✅ Quality check completed successfully
```

**SQL Validation:**
```sql
-- Check quality check was created
SELECT * FROM purchase_order_quality_checks 
WHERE purchase_order_id = 'YOUR_PO_ID';

-- Check quality check items
SELECT 
    qci.*,
    poi.product_id,
    p.name as product_name
FROM purchase_order_quality_check_items qci
JOIN lats_purchase_order_items poi ON qci.purchase_order_item_id = poi.id
JOIN lats_products p ON poi.product_id = p.id
WHERE qci.quality_check_id = 'YOUR_QC_ID';
```

---

### Step 5: Receive to Inventory

**Action:**
1. In Received tab, Quality Check Summary section
2. Click "Receive to Inventory" button
3. Confirm the action

**Expected Result:**
- ✅ Success toast
- ✅ PO status changes to "Received"
- ✅ Items appear in Received Items table
- ✅ Inventory stats show items
- ✅ Received quantities updated on items

**Console Logs to Check:**
```
✅ [PurchaseOrderService] Received items fetched via RPC
✅ [PurchaseOrderService] Items received to inventory
```

**SQL Validation:**
```sql
-- Check inventory items were created
SELECT * FROM inventory_items 
WHERE metadata->>'purchase_order_id' = 'YOUR_PO_ID';

-- Check received quantities updated
SELECT 
    poi.id,
    poi.quantity as ordered,
    poi.received_quantity,
    p.name
FROM lats_purchase_order_items poi
JOIN lats_products p ON poi.product_id = p.id
WHERE poi.purchase_order_id = 'YOUR_PO_ID';

-- Test the function
SELECT * FROM get_received_items_for_po('YOUR_PO_ID'::UUID);
```

---

### Step 6: Verify Received Tab

**Action:**
1. Stay in Received tab
2. Use search box to search for product
3. Use status filter
4. Select an item checkbox
5. Try bulk actions

**Expected Result:**
- ✅ All items visible in table
- ✅ Product names and details correct
- ✅ Serial numbers shown (if any)
- ✅ Status badges colored correctly
- ✅ Search filters work
- ✅ Inventory stats show correct counts
- ✅ Can select items
- ✅ Bulk actions menu appears

**Test Interactions:**
```javascript
// In browser console, test the function call
const result = await supabase.rpc('get_received_items_for_po', {
  po_id: 'YOUR_PO_ID'
});
console.log('Received items:', result);
```

---

### Step 7: Complete Purchase Order

**Action:**
1. Navigate back to Overview tab
2. Verify all items received
3. Verify all payments made (or acceptable partial)
4. Click "Complete Order" button
5. Confirm completion

**Expected Result:**
- ✅ Status changes to "Completed"
- ✅ Success toast
- ✅ Order locked (no more edits)
- ✅ All tabs show final state

**SQL Validation:**
```sql
-- Verify completion
SELECT 
    po.status,
    po.total_amount,
    po.paid_amount,
    COUNT(DISTINCT ii.id) as items_in_inventory,
    COUNT(DISTINCT pop.id) as payment_count
FROM lats_purchase_orders po
LEFT JOIN inventory_items ii ON ii.metadata->>'purchase_order_id' = po.id::TEXT
LEFT JOIN purchase_order_payments pop ON pop.purchase_order_id = po.id
WHERE po.id = 'YOUR_PO_ID'
GROUP BY po.id, po.status, po.total_amount, po.paid_amount;
```

---

## 🎯 Test Scenario 2: Partial Receive Workflow

### Step 1-3: Same as Scenario 1

### Step 4: Partial Receive

**Action:**
1. Click "Items" tab
2. Click "Partial Receive" button
3. For each item, enter quantity less than ordered
4. Click "Receive Items"

**Expected Result:**
- ✅ Status changes to "Partial Received"
- ✅ Received quantities updated
- ✅ Some items in Received tab
- ✅ Can still receive more

**SQL Validation:**
```sql
SELECT 
    quantity,
    received_quantity,
    quantity - received_quantity as remaining
FROM lats_purchase_order_items
WHERE purchase_order_id = 'YOUR_PO_ID';
```

### Step 5: Complete Remaining

**Action:**
1. Repeat partial receive for remaining quantities
2. Or use "Receive All" button

**Expected Result:**
- ✅ All items received
- ✅ Status changes to "Received"
- ✅ Can complete order

---

## 🎯 Test Scenario 3: Serial Number Tracking

### Step 1-3: Same as Scenario 1

### Step 4: Receive with Serial Numbers

**Action:**
1. Click "Receive with Serial Numbers" button
2. For each item:
   - Enter serial number
   - Enter IMEI (optional)
   - Enter location
3. Click "Receive Items"

**Expected Result:**
- ✅ Items created in inventory with serial numbers
- ✅ Each serial number is unique
- ✅ Items appear in Received tab with serials
- ✅ Can search by serial number

**SQL Validation:**
```sql
-- Check serial numbers recorded
SELECT 
    ii.serial_number,
    ii.imei,
    ii.location,
    p.name as product_name
FROM inventory_items ii
JOIN lats_products p ON ii.product_id = p.id
WHERE ii.metadata->>'purchase_order_id' = 'YOUR_PO_ID'
AND ii.serial_number IS NOT NULL;
```

---

## 🎯 Test Scenario 4: Payment Variations

### Test 4a: Multiple Payments

**Action:**
1. Make multiple partial payments
2. Use different payment methods
3. Use different accounts

**Expected Result:**
- ✅ All payments recorded
- ✅ Running total updated
- ✅ Payment history shows all
- ✅ Remaining amount correct

### Test 4b: Overpayment Prevention

**Action:**
1. Try to pay more than total amount

**Expected Result:**
- ❌ Should show error or warning
- ⚠️ Or allow but show overpayment status

### Test 4c: Currency Conversion (if applicable)

**Action:**
1. Create PO in USD
2. Pay from TZS account

**Expected Result:**
- ✅ Currency converted
- ✅ Notes show conversion rate
- ✅ Correct amount deducted

---

## 🎯 Test Scenario 5: Error Handling

### Test 5a: Network Errors

**Action:**
1. Open dev tools
2. Set Network to "Offline"
3. Try to receive items

**Expected Result:**
- ❌ Error toast appears
- ❌ Clear error message shown
- ℹ️ Data not corrupted

### Test 5b: Invalid Data

**Action:**
1. Try to receive more than ordered
2. Try to pay with insufficient balance
3. Try to complete without receiving

**Expected Result:**
- ❌ Appropriate error messages
- ❌ Actions prevented
- ℹ️ User guided to fix

---

## 📊 Post-Test Validation

### Run All Validation Scripts

```sql
-- 1. Check metadata is correct
\i FIX_ALL_METADATA.sql

-- 2. Validate complete workflow
\i COMPLETE_WORKFLOW_VALIDATION.sql

-- 3. Validate payments
\i PAYMENT_VALIDATION.sql

-- 4. Check received items
\i RECEIVED_TAB_DATA_CHECK.sql
```

### Expected Results:
- ✅ No orphaned records
- ✅ All metadata correct
- ✅ All relationships valid
- ✅ Balances reconciled
- ✅ All statuses consistent

---

## 🐛 Common Issues & Solutions

### Issue 1: Items Not Showing in Received Tab

**Symptoms:**
- Received tab shows "No items found"
- But items should be there

**Solution:**
```sql
-- Check if items exist but missing metadata
SELECT COUNT(*) FROM inventory_items ii
JOIN lats_purchase_order_items poi ON ii.product_id = poi.product_id
WHERE poi.purchase_order_id = 'YOUR_PO_ID'
AND (ii.metadata->>'purchase_order_id' IS NULL);

-- If count > 0, run FIX_ALL_METADATA.sql
```

### Issue 2: Quality Check Not Working

**Symptoms:**
- Can't complete quality check
- Error when clicking "Complete"

**Solution:**
- Check console for errors
- Verify quality check template exists
- Ensure all required fields filled

### Issue 3: Payment Fails

**Symptoms:**
- Payment modal closes without success
- Balance not deducted

**Solution:**
```sql
-- Check if payment functions exist
SELECT routine_name FROM information_schema.routines
WHERE routine_name LIKE '%payment%';

-- Check account balance
SELECT id, account_name, balance, currency
FROM finance_accounts;
```

### Issue 4: Can't Complete Order

**Symptoms:**
- "Complete Order" button disabled or errors

**Solution:**
```sql
-- Check completion status
SELECT * FROM get_purchase_order_completion_status('YOUR_PO_ID'::UUID);

-- Should show can_complete = true
-- If not, check what's missing
```

---

## 📈 Performance Benchmarks

### Expected Response Times:
- Create PO: < 1 second
- Load PO detail: < 2 seconds
- Process payment: < 1 second
- Quality check: < 2 seconds
- Receive to inventory: < 3 seconds (depends on item count)
- Load received tab: < 2 seconds

### If Slower:
- Check database indexes
- Review query plans
- Check network latency
- Review RLS policies

---

## ✅ Sign-Off Checklist

After completing all tests:

- [ ] Can create purchase orders
- [ ] Can confirm orders
- [ ] Can add payments (single and multiple)
- [ ] Can perform quality checks
- [ ] Can receive items to inventory
- [ ] Received tab shows all items correctly
- [ ] Can search and filter items
- [ ] Can use bulk actions
- [ ] Can track serial numbers
- [ ] Can complete orders
- [ ] All database validations pass
- [ ] No console errors
- [ ] No orphaned data
- [ ] All metadata correct
- [ ] Performance acceptable

---

## 🎓 Additional Testing

### Load Testing
```sql
-- Create 10 test purchase orders
DO $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 1..10 LOOP
        -- Create test PO
        -- (Add your test data creation logic)
    END LOOP;
END $$;
```

### Stress Testing
- Create PO with 100+ items
- Add 50+ payments
- Receive 1000+ inventory items
- Test pagination
- Test bulk operations

---

## 📝 Test Log Template

```markdown
## Test Session: [DATE]
**Tester:** [NAME]
**Environment:** [Development/Staging/Production]

### Scenario 1: Complete Simple Workflow
- [ ] Create PO - Result: ___
- [ ] Confirm PO - Result: ___
- [ ] Add Payment - Result: ___
- [ ] Quality Check - Result: ___
- [ ] Receive to Inventory - Result: ___
- [ ] Verify Received Tab - Result: ___
- [ ] Complete Order - Result: ___

**Issues Found:** ___

### Overall Result: PASS / FAIL
**Notes:** ___
```

---

## 🆘 Support

If you encounter issues:

1. Check console logs
2. Run validation queries
3. Review this guide
4. Check database logs
5. Review recent code changes

**Happy Testing! 🚀**

