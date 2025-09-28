# 🧪 Manual Testing Guide for Purchase Order Actions

## Prerequisites
1. ✅ Run `CREATE_ACTION_TABLES.sql` in your Supabase SQL Editor
2. ✅ Ensure you have at least one purchase order in your system
3. ✅ Make sure you're logged in to your application

## Step-by-Step Testing Process

### 🔍 **Step 1: Verify Database Tables Created**

Run this query in your Supabase SQL Editor to verify all tables exist:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'purchase_order%'
ORDER BY table_name;
```

**Expected Result:** You should see these tables:
- `purchase_order_audit`
- `purchase_order_messages`
- `purchase_order_quality_checks`
- `purchase_order_return_items`
- `purchase_order_returns`

### 🎯 **Step 2: Test Delete Order Action**

1. **Navigate to a draft purchase order**
2. **Look for the red "Delete Order" button**
3. **Click the button**
4. **Confirm the deletion**

**Expected Result:**
- ✅ Confirmation dialog appears
- ✅ Order is deleted after confirmation
- ✅ Redirected to purchase orders list
- ✅ Success toast message appears

**Database Check:**
```sql
-- This should return 0 results (order deleted)
SELECT * FROM lats_purchase_orders WHERE status = 'draft' AND order_number = 'your-test-order';
```

### ❌ **Step 3: Test Cancel Order Action**

1. **Navigate to an approved/sent purchase order**
2. **Look for the red "Cancel Order" button**
3. **Click the button**
4. **Confirm the cancellation**

**Expected Result:**
- ✅ Confirmation dialog appears
- ✅ Order status changes to 'cancelled'
- ✅ Success toast message appears

**Database Check:**
```sql
-- This should show status = 'cancelled'
SELECT id, order_number, status FROM lats_purchase_orders WHERE id = 'your-order-id';
```

### 🛡️ **Step 4: Test Quality Check Action**

1. **Navigate to a received purchase order**
2. **Look for the purple "Quality Check" button**
3. **Click to open the quality check modal**
4. **Test each quality check option:**
   - Click "Pass" on an item
   - Click "Fail" on another item
   - Click "Review" on a third item
5. **Click "Complete Quality Check"**

**Expected Result:**
- ✅ Modal opens with all order items
- ✅ Quality check buttons work for each item
- ✅ Success messages appear for each check
- ✅ Modal closes after completion

**Database Check:**
```sql
-- This should show quality check records
SELECT * FROM purchase_order_quality_checks WHERE purchase_order_id = 'your-order-id';
```

### 💬 **Step 5: Test WhatsApp/SMS Actions**

1. **Navigate to any purchase order**
2. **Look for the green "WhatsApp" and orange "SMS" buttons in the bottom action bar**
3. **Click WhatsApp button**
4. **Click SMS button**

**Expected Result:**
- ✅ WhatsApp opens in new tab with pre-filled message
- ✅ SMS sends successfully (check console for log)
- ✅ Success toast messages appear

**Database Check:**
```sql
-- This should show SMS message in messages table
SELECT * FROM purchase_order_messages WHERE purchase_order_id = 'your-order-id' AND type = 'system';
```

### 📝 **Step 6: Test Notes System**

1. **Look for the yellow "Notes" button in secondary actions**
2. **Click to open notes modal**
3. **Add a test note:**
   - Type: "This is a test note"
   - Click "Add Note"
4. **Verify the note appears in the list**

**Expected Result:**
- ✅ Modal opens with note input field
- ✅ Note is added successfully
- ✅ Note appears in the list with timestamp
- ✅ Success toast message appears

**Database Check:**
```sql
-- This should show your note
SELECT * FROM purchase_order_messages WHERE purchase_order_id = 'your-order-id' AND type = 'user';
```

### 📦 **Step 7: Test Bulk Actions**

1. **Look for the indigo "Bulk Actions" button**
2. **Click to open bulk actions modal**
3. **Select one or more items using checkboxes**
4. **Test each bulk action:**
   - Click "Update Status"
   - Click "Assign Location"
   - Click "Export Selected"

**Expected Result:**
- ✅ Modal opens with item selection
- ✅ Checkboxes work for item selection
- ✅ Bulk actions complete successfully
- ✅ Success messages appear

**Database Check:**
```sql
-- Check if items were updated
SELECT id, status, location FROM lats_purchase_order_items WHERE id IN ('your-item-ids');
```

### 🔄 **Step 8: Test Return Order**

1. **Navigate to a received purchase order**
2. **Look for the red "Return Order" button**
3. **Click to open return order modal**
4. **Fill out the return form:**
   - Select return type: "Defective Items"
   - Select items to return
   - Enter return reason: "Test return"
   - Add notes: "Testing return functionality"
5. **Click "Create Return Order"**

**Expected Result:**
- ✅ Modal opens with return form
- ✅ Form fields work correctly
- ✅ Return order is created successfully
- ✅ Success toast message appears

**Database Check:**
```sql
-- This should show return order records
SELECT * FROM purchase_order_returns WHERE purchase_order_id = 'your-order-id';
SELECT * FROM purchase_order_return_items WHERE return_order_id IN (
  SELECT id FROM purchase_order_returns WHERE purchase_order_id = 'your-order-id'
);
```

### 📋 **Step 9: Test Duplicate Order**

1. **Look for the purple "Duplicate" button in secondary actions**
2. **Click the button**

**Expected Result:**
- ✅ New order is created with "-COPY" suffix
- ✅ Redirected to the new duplicate order
- ✅ Success toast message appears

**Database Check:**
```sql
-- This should show the duplicated order
SELECT * FROM lats_purchase_orders WHERE order_number LIKE '%COPY%';
SELECT * FROM lats_purchase_order_items WHERE purchase_order_id = 'new-duplicate-order-id';
```

### 📊 **Step 10: Test Audit Trail**

**Database Check:**
```sql
-- This should show all actions performed
SELECT action, details, timestamp 
FROM purchase_order_audit 
WHERE purchase_order_id = 'your-order-id' 
ORDER BY timestamp DESC;
```

**Expected Result:**
- ✅ All actions are logged with timestamps
- ✅ Action details are stored correctly
- ✅ Audit trail is complete

## 🎯 **Testing Checklist**

- [ ] Database tables created successfully
- [ ] Delete Order button works (draft orders only)
- [ ] Cancel Order button works (approved orders only)
- [ ] Quality Check modal and actions work
- [ ] WhatsApp button opens with pre-filled message
- [ ] SMS button sends message successfully
- [ ] Notes system adds and displays notes
- [ ] Bulk Actions modal and selections work
- [ ] Return Order form and creation works
- [ ] Duplicate Order creates copy successfully
- [ ] All actions are logged in audit trail
- [ ] Success/error messages appear correctly
- [ ] UI updates reflect database changes

## 🚨 **Common Issues & Solutions**

### Issue: "Table doesn't exist"
**Solution:** Run the `CREATE_ACTION_TABLES.sql` script again

### Issue: "Permission denied"
**Solution:** Check RLS policies are correctly set up

### Issue: "Button not visible"
**Solution:** Check order status - some buttons only appear for specific statuses

### Issue: "Action not working"
**Solution:** Check browser console for errors and verify database connection

## ✅ **Success Criteria**

All tests pass when:
1. ✅ All action buttons are visible and functional
2. ✅ Database records are created/updated correctly
3. ✅ UI updates reflect changes immediately
4. ✅ Success/error messages appear appropriately
5. ✅ Audit trail captures all actions
6. ✅ No JavaScript errors in console
7. ✅ No database permission errors

## 📞 **Need Help?**

If any test fails:
1. Check browser console for errors
2. Verify database tables exist
3. Check Supabase logs
4. Ensure user authentication is working
5. Verify RLS policies are correctly configured

**Your purchase order actions system is working correctly when all tests pass! 🎉**
