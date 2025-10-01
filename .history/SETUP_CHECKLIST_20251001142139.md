# 🚀 Quick Setup Checklist

## Step 1: Run Database Migrations

Go to **Supabase Dashboard → SQL Editor** and run these **6 migrations** in order:

### ✅ Migration 1: Fix Audit Logging
**File:** `supabase/migrations/20251001_fix_purchase_order_audit.sql`
- Fixes 400/401 errors
- Creates `log_purchase_order_audit` function
- **Status:** ⬜ Not Run

### ✅ Migration 2: Quality Check System  
**File:** `supabase/migrations/20251001_create_quality_check_system.sql`
- Creates 4 tables
- Creates 4 RPC functions
- Adds 3 default templates with 18 criteria
- **Status:** ⬜ Not Run

### ✅ Migration 3: Fix Duplicates
**File:** `supabase/migrations/20251001_fix_duplicate_quality_criteria.sql`
- Removes duplicate criteria
- Adds unique constraint
- **Status:** ⬜ Not Run

### ✅ Migration 4: Add to Inventory
**File:** `supabase/migrations/20251001_update_complete_quality_check_status.sql`
- Creates `add_quality_checked_items_to_inventory` function
- **Status:** ⬜ Not Run

### ✅ Migration 5: Fix Status Constraint (IMPORTANT!)
**File:** `supabase/migrations/20251001_fix_purchase_order_status_constraint.sql`
- Updates status constraint to include all workflow statuses
- Allows "completed" status
- **Status:** ⬜ Not Run

### ✅ Migration 6: Fix Audit JSONB Format
**File:** `supabase/migrations/20251001_fix_audit_jsonb.sql`
- Updates audit logging to use JSONB instead of TEXT
- Fixes "column is of type jsonb but expression is of type text" error
- **Status:** ⬜ Not Run

---

## Step 2: Verify Code Changes

All code changes are already applied:

- ✅ `src/features/lats/types/inventory.ts` - Updated types
- ✅ `src/features/lats/components/quality-check/QualityCheckModal.tsx` - New inventory step
- ✅ `src/features/lats/pages/PurchaseOrderDetailPage.tsx` - Add to inventory button & modal

---

## Step 3: Test the Workflow

### Create Test Purchase Order:

1. **Create PO**
   - Add 2-3 test products
   - Set cost prices (e.g., $10, $20, $30)

2. **Mark as Shipped**
   - Should see payment button

3. **Make Payment**
   - Record payment
   - Should see receive button

4. **Receive Order**
   - Mark as received
   - Should see quality check button

5. **Quality Check**
   - Select "Standard Quality Check" template
   - Mark items as "Pass"
   - Complete check
   - **Should see inventory form**

6. **Add to Inventory**
   - Set profit margin: 30%
   - Set location: "Test Warehouse"
   - Click "Add to Inventory"
   - **Should see success message**
   - **Status should change to "completed"**

7. **Verify**
   - Check product variants - selling price updated?
   - Check stock - quantity increased?
   - Check PO status - shows "completed"?

---

## 📋 What to Check:

### In Supabase Dashboard:

```sql
-- Check templates created
SELECT * FROM quality_check_templates;
-- Should show 3 templates

-- Check criteria created
SELECT * FROM quality_check_criteria;
-- Should show 18 criteria (no duplicates)

-- Check RPC functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%quality%';
-- Should show 4 functions
```

### In Browser Console:

Look for:
- ✅ No 400 errors on audit logging
- ✅ No 401 errors on quality check
- ✅ Quality check items load correctly
- ✅ Inventory addition succeeds

---

## 🎯 Success Criteria:

- [ ] All 4 migrations run without errors
- [ ] Can create and complete quality check
- [ ] Can add items to inventory
- [ ] Selling prices calculated correctly
- [ ] Stock quantities updated
- [ ] PO status changes to "completed"
- [ ] No console errors

---

## 🆘 Need Help?

See full documentation: `PURCHASE_ORDER_WORKFLOW_COMPLETE.md`

### Common Issues:

**Error 400 on audit?** → Run Migration 1  
**Empty quality check?** → Run Migration 2  
**Duplicate items?** → Run Migration 3  
**No inventory button?** → Check payment status  

---

**Ready to start?** Begin with Migration 1! 🚀

---

## 📁 Important Files

### **Migrations (Run in Supabase):**
- `supabase/migrations/20251001_fix_purchase_order_audit.sql`
- `supabase/migrations/20251001_create_quality_check_system.sql`
- `supabase/migrations/20251001_fix_duplicate_quality_criteria.sql`
- `supabase/migrations/20251001_update_complete_quality_check_status.sql`
- `supabase/migrations/20251001_fix_purchase_order_status_constraint.sql`
- `supabase/migrations/20251001_fix_audit_jsonb.sql`

### **Documentation (Reference Only):**
- `PURCHASE_ORDER_WORKFLOW_COMPLETE.md` - Complete guide
- `SETUP_CHECKLIST.md` - This file
- `DATA_FLOW_VALIDATION.md` - How to verify data
- `VERIFICATION_QUERIES.sql` - Example queries (NOT a migration!)

**⚠️ IMPORTANT:** Only run files in `supabase/migrations/` folder as migrations!

