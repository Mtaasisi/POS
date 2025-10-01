# Complete Purchase Order System Testing Guide

## 🎯 Overview

This guide covers end-to-end testing of the entire Purchase Order workflow, from creation to receiving items in inventory.

---

## 📋 Pre-Testing Checklist

### 1. Database Setup
- [ ] Run `COMPLETE_PO_SYSTEM_FIX.sql` to fix all known issues
- [ ] Verify all required functions exist (check Step 2 of the SQL script)
- [ ] Confirm RLS policies are in place (check Step 7 of the SQL script)

### 2. Application Setup
- [ ] Latest code deployed
- [ ] Database migrations applied
- [ ] No console errors on page load

---

## 🧪 Test Scenarios

### Scenario 1: Complete Purchase Order Flow (Happy Path)

#### Step 1: Create Purchase Order
1. Navigate to Purchase Orders list
2. Click "Create New Purchase Order"
3. Fill in details:
   - Supplier: Select any supplier
   - Add at least 2 products with quantities
   - Set expected delivery date
4. Click "Save"

**Expected Result:**
- ✅ PO created with status "draft"
- ✅ Order number generated
- ✅ Total amount calculated correctly
- ✅ No console errors

**SQL Verification:**
```sql
SELECT * FROM lats_purchase_orders 
WHERE order_number = 'YOUR_ORDER_NUMBER'
ORDER BY created_at DESC LIMIT 1;
```

---

#### Step 2: Confirm Purchase Order
1. Open the newly created PO
2. Click "Confirm" button
3. Confirm the action

**Expected Result:**
- ✅ Status changes to "confirmed"
- ✅ Confirmation toast appears
- ✅ Can no longer edit items

**SQL Verification:**
```sql
SELECT status, confirmed_at FROM lats_purchase_orders 
WHERE id = 'YOUR_PO_ID';
```

---

#### Step 3: Make Payment
1. In PO detail page, go to "Payments" section
2. Click "Add Payment"
3. Fill in:
   - Payment Account: Select account with sufficient balance
   - Amount: Enter full or partial amount
   - Payment Method: Select method
   - Add reference/notes (optional)
4. Click "Submit Payment"

**Expected Result:**
- ✅ Payment recorded successfully
- ✅ Account balance deducted
- ✅ Payment appears in payment history
- ✅ "Total Paid" updates
- ✅ If full payment: "Remaining" shows 0

**SQL Verification:**
```sql
-- Check payment record
SELECT * FROM lats_purchase_order_payments 
WHERE purchase_order_id = 'YOUR_PO_ID';

-- Check account balance was deducted
SELECT id, name, balance, currency FROM finance_accounts
WHERE id = 'YOUR_ACCOUNT_ID';

-- Check payment summary
SELECT * FROM get_purchase_order_payment_summary('YOUR_PO_ID');
```

---

#### Step 4: Receive Items (With Serial Numbers)
1. Go to "Overview" tab
2. Click "Receive Items" or "Receive with Serial Numbers"
3. For each item, enter:
   - Serial number
   - IMEI (if applicable)
   - Location
   - Notes (optional)
4. Click "Receive"

**Expected Result:**
- ✅ Items received successfully
- ✅ Status changes to "received" or "partial_received"
- ✅ Received quantities updated
- ✅ Inventory items created with correct metadata

**SQL Verification:**
```sql
-- Check PO items received quantities
SELECT 
    poi.id,
    p.name,
    poi.quantity,
    poi.received_quantity,
    poi.quantity - poi.received_quantity as pending
FROM lats_purchase_order_items poi
JOIN lats_products p ON poi.product_id = p.id
WHERE poi.purchase_order_id = 'YOUR_PO_ID';

-- Check inventory items created
SELECT * FROM get_received_items_for_po('YOUR_PO_ID');

-- Verify metadata
SELECT 
    id,
    serial_number,
    status,
    metadata->>'purchase_order_id' as po_id,
    metadata->>'received_by' as received_by
FROM inventory_items
WHERE metadata->>'purchase_order_id' = 'YOUR_PO_ID';
```

---

#### Step 5: Quality Check
1. Go to "Quality Check" tab
2. Click "Start Quality Check"
3. Select quality check template
4. For each item:
   - Set result (Pass/Fail/N/A)
   - Enter quantities checked/passed/failed
   - Add defect notes if failed
   - Upload photos (optional)
5. Click "Complete Quality Check"

**Expected Result:**
- ✅ Quality check created
- ✅ All items checked
- ✅ Overall status calculated (passed/failed/partial)
- ✅ Can view quality check details

**SQL Verification:**
```sql
-- Check quality check
SELECT * FROM purchase_order_quality_checks
WHERE purchase_order_id = 'YOUR_PO_ID';

-- Check quality check items
SELECT 
    qci.id,
    qci.criteria_name,
    qci.result,
    qci.quantity_checked,
    qci.quantity_passed,
    qci.quantity_failed
FROM purchase_order_quality_check_items qci
JOIN purchase_order_quality_checks qc ON qci.quality_check_id = qc.id
WHERE qc.purchase_order_id = 'YOUR_PO_ID';
```

---

#### Step 6: Receive Quality-Checked Items to Inventory
1. In "Received" tab, find "Quality Check Summary"
2. Click "Receive to Inventory" button
3. Confirm the action

**Expected Result:**
- ✅ All passed items added to inventory
- ✅ Inventory items created with PO metadata
- ✅ Items appear in "Received" tab table
- ✅ PO status updates to "received"

**SQL Verification:**
```sql
-- Check if quality-checked items are in inventory
SELECT 
    po.order_number,
    COUNT(DISTINCT ii.id) as items_in_inventory,
    SUM(qci.quantity_passed) as total_passed
FROM lats_purchase_orders po
LEFT JOIN purchase_order_quality_checks qc ON po.id = qc.purchase_order_id
LEFT JOIN purchase_order_quality_check_items qci ON qc.id = qci.quality_check_id
LEFT JOIN inventory_items ii ON ii.metadata->>'purchase_order_id' = po.id::TEXT
WHERE po.id = 'YOUR_PO_ID'
GROUP BY po.id, po.order_number;
```

---

#### Step 7: View Received Items
1. Go to "Received" tab
2. View the received items table
3. Test filters:
   - Search by product name
   - Filter by status
   - Filter by location
4. Test bulk actions:
   - Select multiple items
   - Update status
   - Assign location

**Expected Result:**
- ✅ All received items displayed
- ✅ Product details shown correctly
- ✅ Serial numbers visible
- ✅ Stats accurate (Available/Sold/Reserved/Damaged)
- ✅ Filters work correctly
- ✅ Bulk actions functional

---

### Scenario 2: Partial Receive Flow

#### Steps:
1. Create PO with 10 units of a product
2. Receive only 5 units
3. Check status is "partial_received"
4. Receive remaining 5 units
5. Check status changes to "received"

**Expected Result:**
- ✅ Can receive items in multiple batches
- ✅ Status updates correctly
- ✅ All items eventually in inventory

---

### Scenario 3: Failed Quality Check

#### Steps:
1. Create and confirm PO
2. Receive items
3. Perform quality check - mark some items as "failed"
4. Add defect descriptions
5. Select action taken (reject/return/replace)
6. Complete quality check

**Expected Result:**
- ✅ Failed items recorded
- ✅ Overall result is "failed" or "partial"
- ✅ Defect information saved
- ✅ Action recorded
- ✅ Only passed items can be received to inventory

---

### Scenario 4: Multiple Payments

#### Steps:
1. Create PO with total 1000 TZS
2. Make payment 1: 400 TZS
3. Make payment 2: 300 TZS
4. Make payment 3: 300 TZS
5. Verify total paid = 1000 TZS

**Expected Result:**
- ✅ All payments recorded
- ✅ Total paid shows 1000 TZS
- ✅ Remaining shows 0 TZS
- ✅ Payment history shows all 3 payments
- ✅ Account balances correct

---

### Scenario 5: Currency Conversion Payment

#### Steps:
1. Create PO in USD (100 USD)
2. Make payment from TZS account
3. System should convert automatically

**Expected Result:**
- ✅ Currency converted using exchange rate
- ✅ Correct amount deducted from TZS account
- ✅ Conversion note added to payment
- ✅ Payment recorded in account currency

---

## 🔍 Data Integrity Checks

### After Each Test Run:

```sql
-- 1. Check for orphaned records
SELECT 'Orphaned PO Items' as issue, COUNT(*)
FROM lats_purchase_order_items poi
LEFT JOIN lats_purchase_orders po ON poi.purchase_order_id = po.id
WHERE po.id IS NULL;

-- 2. Check for negative balances
SELECT 'Negative Account Balances' as issue, COUNT(*)
FROM finance_accounts
WHERE balance < 0;

-- 3. Check for quality checks without items
SELECT 'Quality Checks Without Items' as issue, COUNT(*)
FROM purchase_order_quality_checks qc
LEFT JOIN purchase_order_quality_check_items qci ON qc.id = qci.quality_check_id
WHERE qci.id IS NULL AND qc.status = 'completed';

-- 4. Check for inventory items without PO metadata
SELECT 'Inventory Items Missing PO Link' as issue, COUNT(*)
FROM inventory_items
WHERE created_at >= NOW() - INTERVAL '7 days'
AND (metadata->>'purchase_order_id' IS NULL OR metadata->>'purchase_order_id' = '');

-- 5. Check for payment mismatches
SELECT 
    'Payment Mismatches' as issue,
    po.order_number,
    po.total_amount,
    COALESCE(SUM(pop.amount), 0) as total_paid,
    po.total_amount - COALESCE(SUM(pop.amount), 0) as difference
FROM lats_purchase_orders po
LEFT JOIN lats_purchase_order_payments pop ON po.id = pop.purchase_order_id AND pop.status = 'completed'
WHERE po.status = 'received'
GROUP BY po.id, po.order_number, po.total_amount
HAVING po.total_amount - COALESCE(SUM(pop.amount), 0) != 0;
```

---

## 🐛 Common Issues & Solutions

### Issue 1: Items not appearing in Received tab
**Symptoms:** Quality check completed, but Received tab shows 0 items

**Solution:**
```sql
-- Check if items are in inventory with PO metadata
SELECT COUNT(*) FROM inventory_items 
WHERE metadata->>'purchase_order_id' = 'YOUR_PO_ID';

-- If 0, click "Receive to Inventory" button in Quality Check Summary
-- Or run manually:
SELECT receive_quality_checked_items(
    'QUALITY_CHECK_ID',
    'PO_ID',
    'USER_ID'
);
```

---

### Issue 2: Payment fails with "Insufficient balance"
**Symptoms:** Payment rejected even though account has balance

**Solution:**
1. Check account currency matches payment currency
2. If different, ensure exchange rate is configured
3. Verify account balance is sufficient after conversion

---

### Issue 3: Cannot complete PO
**Symptoms:** "Complete" button disabled or fails

**Solution:**
```sql
-- Check completion status
SELECT * FROM check_purchase_order_completion('YOUR_PO_ID');

-- Look for items with unmatched quantities
SELECT 
    p.name,
    poi.quantity as ordered,
    poi.received_quantity as received,
    poi.quantity - poi.received_quantity as pending
FROM lats_purchase_order_items poi
JOIN lats_products p ON poi.product_id = p.id
WHERE poi.purchase_order_id = 'YOUR_PO_ID'
AND poi.quantity != poi.received_quantity;
```

---

### Issue 4: Quality Check modal crashes
**Symptoms:** Error on line 147 about `.slice()` on undefined

**Solution:**
- Already fixed! Quality check ID validation added
- If still occurs, check browser console for specific error
- Ensure quality check ID is valid before opening modal

---

## ✅ Success Criteria

A complete, successful test run should have:

- [ ] PO created → confirmed → paid → received → completed
- [ ] All payments recorded and balance updated
- [ ] Quality check performed and recorded
- [ ] All items in inventory with correct metadata
- [ ] Received tab shows all items
- [ ] No console errors throughout workflow
- [ ] All data integrity checks pass
- [ ] Performance acceptable (<3s for most operations)

---

## 📊 Performance Benchmarks

| Operation | Target Time | Notes |
|-----------|------------|-------|
| Load PO detail page | < 2s | Including all tabs data |
| Create payment | < 1s | Single payment |
| Receive items | < 3s | Up to 10 items |
| Quality check | < 2s | Per item |
| Received tab load | < 2s | Up to 100 items |
| Filter/search | < 500ms | Client-side |

---

## 🔐 Security Checks

- [ ] RLS policies prevent unauthorized access
- [ ] Payment operations require authentication
- [ ] Cannot receive items for other users' POs without permission
- [ ] Quality check data cannot be modified after completion
- [ ] Financial data not exposed in API responses

---

## 📝 Test Report Template

```markdown
# Purchase Order Test Report

**Date:** [DATE]
**Tester:** [NAME]
**Environment:** [Production/Staging/Dev]

## Summary
- Total Tests: [X]
- Passed: [X]
- Failed: [X]
- Blocked: [X]

## Test Results

### Scenario 1: Complete PO Flow
- Status: ✅ PASS / ❌ FAIL
- Notes: [Any observations]
- Screenshots: [If applicable]

[Repeat for each scenario]

## Issues Found
1. [Issue description]
   - Severity: High/Medium/Low
   - Steps to reproduce
   - Expected vs Actual
   - Screenshots

## Performance Notes
- [Any slow operations noted]
- [Recommendations for improvement]

## Recommendations
- [Next steps]
- [Areas needing attention]
```

---

## 🚀 Automation Opportunities

Consider automating these tests:
1. Create PO with API
2. Process payment
3. Receive items
4. Verify inventory items created
5. Check data integrity queries

**Tools:** Playwright, Cypress, or custom scripts using Supabase client

---

## 📞 Support

If tests fail or issues persist:
1. Run `COMPLETE_PO_SYSTEM_FIX.sql`
2. Check database logs in Supabase dashboard
3. Review browser console errors
4. Check network tab for failed API calls
5. Verify RLS policies are correct

