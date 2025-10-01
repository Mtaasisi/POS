# 📊 Complete Data Flow Validation Guide

## 🎯 Overview

This document explains how to verify that data is being saved and fetched correctly throughout the purchase order workflow.

---

## 🔄 Data Flow Path

```
Quality Check Completed
         ↓
User Sets Profit Margin & Location
         ↓
Click "Add to Inventory"
         ↓
RPC Function: add_quality_checked_items_to_inventory()
         ↓
┌─────────────────────────────────────────┐
│ 1. Create lats_inventory_adjustments    │
│ 2. Update lats_product_variants (price) │
│ 3. Update lats_product_variants (stock) │
│ 4. Update lats_purchase_orders (status) │
│ 5. Insert purchase_order_audit (log)    │
└─────────────────────────────────────────┘
         ↓
Frontend Refreshes Data
         ↓
┌─────────────────────────────────────────┐
│ 1. loadPurchaseOrder() - Get new status │
│ 2. getReceivedItems() - Get adjustments │
│ 3. Switch to "Received" tab             │
│ 4. Display items in UI                  │
└─────────────────────────────────────────┘
```

---

## ✅ Validation Checklist

### **Phase 1: Before Add to Inventory**

- [ ] Purchase order status is `'received'`
- [ ] Quality check completed (items marked pass/fail)
- [ ] Quality check overall result is `'pass'`
- [ ] "Add to Inventory" button is visible

**Console should show:**
```
✅ Quality check created successfully: [quality-check-id]
✅ Quality check items loaded: 30
✅ Quality check completed successfully: true
```

---

### **Phase 2: During Add to Inventory**

**Frontend logs:**
```
🔄 Adding items to inventory... {
  qualityCheckId: '...',
  purchaseOrderId: '...',
  profitMargin: 30,
  location: 'Warehouse A'
}
```

**Database function executes:**
1. Checks quality check result = 'pass'
2. For each PO item:
   - Calculates selling price
   - Updates received quantity
   - Creates inventory adjustment
   - Updates variant price and stock
3. Updates PO status to 'completed'
4. Creates audit log

**Expected database changes:**
- `lats_inventory_adjustments`: New records created
- `lats_product_variants`: Prices and quantities updated
- `lats_purchase_orders`: Status = 'completed'
- `purchase_order_audit`: New audit entry

---

### **Phase 3: After Add to Inventory**

**Frontend logs:**
```
📦 Add to inventory result: {
  success: true,
  message: 'Successfully added 5 items to inventory',
  items_added: 5
}
✅ Items added to inventory successfully
✅ Received items refreshed: 5
```

**UI should show:**
- ✅ Success toast: "Successfully added X items to inventory"
- ✅ Second toast: "Items are now in inventory! Check the Received tab."
- ✅ Automatically switches to "Received" tab
- ✅ Items appear in received items list
- ✅ PO status badge shows "Completed"

---

## 🔍 How to Verify Data

### **Method 1: Using Console Logs**

Open browser console and look for:

1. **Quality Check Creation:**
   ```
   ✅ Quality check created successfully: [uuid]
   ✅ Quality check items loaded: [number]
   ```

2. **Add to Inventory:**
   ```
   🔄 Adding items to inventory...
   📦 Add to inventory result: {success: true, ...}
   ✅ Items added to inventory successfully
   ✅ Received items refreshed: [number]
   ```

3. **No Errors:**
   - ❌ No 400 errors
   - ❌ No 401 errors
   - ❌ No "function does not exist" errors
   - ❌ No "constraint violation" errors

---

### **Method 2: Check Database Directly**

Use the queries in `VERIFICATION_QUERIES.sql`:

1. **Find your Purchase Order ID:**
   ```sql
   SELECT id, order_number FROM lats_purchase_orders 
   ORDER BY created_at DESC LIMIT 5;
   ```

2. **Replace `YOUR_PO_ID_HERE`** with the actual UUID

3. **Run each verification query** to check:
   - Quality checks created ✅
   - Inventory adjustments created ✅
   - Selling prices updated ✅
   - Stock quantities increased ✅
   - Audit logs recorded ✅

---

### **Method 3: Check UI State**

After adding to inventory:

1. **Received Tab:**
   - [ ] Shows inventory adjustment records
   - [ ] Each record has product name
   - [ ] Shows quantity received
   - [ ] Shows cost price

2. **Overview Tab:**
   - [ ] Status badge shows "Completed"
   - [ ] Total received count updated
   - [ ] No more action buttons (order is complete)

3. **Analytics Tab:**
   - [ ] Shows completion metrics
   - [ ] Quality check stats visible

---

## 🐛 Common Issues

### **Issue 1: Items Not Showing in Received Tab**

**Symptoms:**
- "Add to Inventory" succeeds
- But received tab is empty

**Check:**
1. Console for `getReceivedItems` response
2. Database: `SELECT * FROM lats_inventory_adjustments WHERE purchase_order_id = 'YOUR_ID'`

**Fix:**
- Ensure `adjustment_type = 'receive'`
- Check RLS policies on `lats_inventory_adjustments`

---

### **Issue 2: Stock Not Updated**

**Symptoms:**
- Items added but product stock unchanged

**Check:**
```sql
SELECT id, name, quantity, price, cost_price, updated_at 
FROM lats_product_variants 
WHERE id IN (
  SELECT variant_id FROM lats_purchase_order_items 
  WHERE purchase_order_id = 'YOUR_ID'
);
```

**Fix:**
- Check if variant_id exists in PO items
- Verify UPDATE statement in function

---

### **Issue 3: Selling Price Not Set**

**Symptoms:**
- Stock updated but price = 0 or unchanged

**Check:**
- Function calculated price correctly?
- Profit margin applied?

**Formula:**
```
Selling Price = Cost Price × (1 + Profit Margin / 100)

Example:
Cost: $100
Margin: 30%
Selling = $100 × 1.30 = $130
```

---

## 📈 Expected Data After Complete Workflow

For a PO with **2 items**, quantity **5 each**, cost **$10 each**, profit margin **30%**:

### **lats_inventory_adjustments:**
```
| id | purchase_order_id | product_id | variant_id | quantity | cost_price |
|----|-------------------|------------|------------|----------|------------|
| 1  | [PO-ID]          | [P-ID-1]   | [V-ID-1]   | 5        | 10.00      |
| 2  | [PO-ID]          | [P-ID-2]   | [V-ID-2]   | 5        | 10.00      |
```

### **lats_product_variants:**
```
| id       | name      | price | cost_price | quantity |
|----------|-----------|-------|------------|----------|
| [V-ID-1] | Variant 1 | 13.00 | 10.00      | 105      | (100 + 5)
| [V-ID-2] | Variant 2 | 13.00 | 10.00      | 55       | (50 + 5)
```

### **lats_purchase_orders:**
```
| id      | order_number | status    | payment_status |
|---------|--------------|-----------|----------------|
| [PO-ID] | PO-175...    | completed | paid           |
```

### **purchase_order_audit:**
```
| action               | details (JSONB)                          |
|---------------------|------------------------------------------|
| Added to inventory  | {"message": "Added 2 items...", ...}    |
| Status changed...   | {"message": "...", ...}                  |
```

---

## 🎯 Success Indicators

### **Frontend:**
- ✅ No console errors
- ✅ Success toasts appear
- ✅ Automatic tab switch to "Received"
- ✅ Items visible in received items list
- ✅ Status badge shows "Completed"

### **Database:**
- ✅ Inventory adjustments created (1 per unique product)
- ✅ Product variants updated (price & quantity)
- ✅ Purchase order status = 'completed'
- ✅ Audit log contains "Added to inventory"

### **Business Logic:**
- ✅ Selling price = Cost × (1 + Margin%)
- ✅ Stock quantity increased by received quantity
- ✅ Location stored (if provided)
- ✅ All data properly linked via foreign keys

---

## 🚀 Quick Test Script

Run this in Supabase SQL Editor to test a complete flow:

```sql
-- 1. Create a test PO (replace IDs with your actual IDs)
INSERT INTO lats_purchase_orders (
  order_number, supplier_id, status, payment_status, 
  total_amount, order_date, created_by
) VALUES (
  'TEST-PO-001', 
  '[YOUR-SUPPLIER-ID]', 
  'received', 
  'paid',
  100.00,
  NOW(),
  auth.uid()
) RETURNING id;

-- 2. Copy the returned ID and use it in VERIFICATION_QUERIES.sql

-- 3. After running the workflow, verify all queries return expected data
```

---

## 📞 Support

If data is not fetching correctly:

1. **Check Console Logs** - Look for errors or warnings
2. **Run Verification Queries** - See what's in the database
3. **Check RLS Policies** - Ensure user has permissions
4. **Verify Migrations** - All 6 migrations ran successfully?

---

**Remember:** `VERIFICATION_QUERIES.sql` is for manual testing only, not a migration to run!

