# Complete Purchase Order Workflow Integration Guide

## 📋 Overview

This document explains the complete purchase order workflow from creation to inventory, including all database changes, service updates, and UI modifications.

---

## 🔄 Complete Workflow

```
1. CREATE PURCHASE ORDER
   ├─> Status: "draft"
   └─> Add items with cost prices

2. SUBMIT FOR APPROVAL (optional)
   ├─> Status: "pending_approval"
   └─> Awaits approval

3. SEND TO SUPPLIER
   ├─> Status: "sent"
   └─> Order confirmed

4. MARK AS SHIPPED
   ├─> Status: "shipped"
   └─> Goods in transit

5. MAKE PAYMENT
   ├─> Payment status: "paid"
   └─> Required before receiving

6. RECEIVE ORDER
   ├─> Status: "received"
   └─> Items physically received

7. QUALITY CHECK
   ├─> Inspect each item (pass/fail)
   └─> Record quality check results

8. ADD TO INVENTORY
   ├─> Set selling prices (profit margin)
   ├─> Set locations
   ├─> Update stock quantities
   └─> Status: "completed" ✅
```

---

## 🗄️ Database Changes

### Required Migrations (Run in Order):

#### 1. **Fix Audit Logging** (CRITICAL)
**File:** `supabase/migrations/20251001_fix_purchase_order_audit.sql`

**What it does:**
- Fixes 400/401 errors on audit logging
- Makes RLS policies permissive for authenticated users
- Creates `log_purchase_order_audit` RPC function

**SQL to run in Supabase Dashboard:**
```sql
-- See file: 20251001_fix_purchase_order_audit.sql
```

---

#### 2. **Quality Check System** (REQUIRED)
**File:** `supabase/migrations/20251001_create_quality_check_system.sql`

**What it creates:**
- `quality_check_templates` table (3 default templates)
- `quality_check_criteria` table (18 criteria)
- `purchase_order_quality_checks` table
- `purchase_order_quality_check_items` table
- 4 RPC functions:
  - `create_quality_check_from_template()`
  - `complete_quality_check()`
  - `get_quality_check_summary()`
  - `receive_quality_checked_items()`

**Templates included:**
1. Standard Quality Check (4 criteria)
2. Electronics Quality Check (5 criteria)
3. Phone Quality Check (9 criteria)

---

#### 3. **Fix Duplicate Criteria** (CLEANUP)
**File:** `supabase/migrations/20251001_fix_duplicate_quality_criteria.sql`

**What it does:**
- Removes duplicate quality check criteria
- Adds unique constraint
- Updates existing quality check items to reference correct criteria

---

#### 4. **Add to Inventory Function** (FINAL STEP)
**File:** `supabase/migrations/20251001_update_complete_quality_check_status.sql`

**What it creates:**
- `add_quality_checked_items_to_inventory()` RPC function
- Automatically calculates selling prices based on profit margin
- Updates stock quantities
- Changes PO status to "completed"
- Creates audit logs

**Function signature:**
```sql
add_quality_checked_items_to_inventory(
  p_quality_check_id UUID,
  p_purchase_order_id UUID,
  p_user_id UUID,
  p_profit_margin_percentage DECIMAL DEFAULT 30.0,
  p_default_location VARCHAR DEFAULT NULL
)
RETURNS JSONB
```

---

## 💻 Code Changes

### Updated Files:

#### 1. **TypeScript Types**
**File:** `src/features/lats/types/inventory.ts`

**Changes:**
```typescript
// Updated PurchaseOrder interface
export interface PurchaseOrder {
  status: 'draft' | 'pending_approval' | 'approved' | 'sent' | 
          'confirmed' | 'shipped' | 'partial_received' | 
          'received' | 'completed' | 'cancelled';
  paymentStatus?: 'unpaid' | 'partial' | 'paid' | 'overpaid';
  totalPaid?: number;
  // ... other fields
}

// Updated PurchaseOrderItem interface
export interface PurchaseOrderItem {
  status?: 'pending' | 'processing' | 'shipped' | 
           'received' | 'cancelled';
  // ... other fields
}
```

---

#### 2. **Quality Check Modal**
**File:** `src/features/lats/components/quality-check/QualityCheckModal.tsx`

**New Features:**
- 4-step workflow: Template → Inspect → Complete → **Add to Inventory**
- Profit margin input (default 30%)
- Location input (optional)
- Preview of items to be added
- Automatic selling price calculation

**New State:**
```typescript
const [step, setStep] = useState<'template' | 'inspect' | 'complete' | 'inventory'>('template');
const [profitMargin, setProfitMargin] = useState(30);
const [defaultLocation, setDefaultLocation] = useState('');
```

**New Function:**
```typescript
const handleAddToInventory = async () => {
  const { data, error } = await supabase.rpc('add_quality_checked_items_to_inventory', {
    p_quality_check_id: qualityCheckId,
    p_purchase_order_id: purchaseOrderId,
    p_user_id: currentUser.id,
    p_profit_margin_percentage: profitMargin,
    p_default_location: defaultLocation || null
  });
  // Handle result...
};
```

---

#### 3. **Purchase Order Detail Page**
**File:** `src/features/lats/pages/PurchaseOrderDetailPage.tsx`

**New Features:**
- "Add to Inventory" button (shows after quality check completion)
- Inventory modal with same features as quality check modal
- Profit margin and location inputs
- Integration with RPC function

**New State:**
```typescript
const [showAddToInventoryModal, setShowAddToInventoryModal] = useState(false);
const [profitMargin, setProfitMargin] = useState(30);
const [inventoryLocation, setInventoryLocation] = useState('');
```

**New UI:**
```tsx
{/* Show after quality check */}
{qualityCheckItems.length > 0 && (
  <button onClick={() => setShowAddToInventoryModal(true)}>
    Add to Inventory
  </button>
)}

{/* Modal for adding to inventory */}
{showAddToInventoryModal && (
  <AddToInventoryModal 
    profitMargin={profitMargin}
    location={inventoryLocation}
    onAdd={handleAddToInventory}
  />
)}
```

---

#### 4. **Purchase Order Service**
**File:** `src/features/lats/services/purchaseOrderService.ts`

**Updated Functions:**
- `updateOrderStatus()` - Now handles all statuses including "shipped"
- `addAuditEntry()` - Uses new RPC function with fallback
- All functions include retry logic and error handling

---

## 🎨 UI Flow

### Step-by-Step User Experience:

#### **Step 1: Create Purchase Order**
- User adds items with cost prices
- Status: "draft"

#### **Step 2: Send to Supplier**
- User clicks "Send to Supplier"
- Status: "sent"

#### **Step 3: Mark as Shipped**
- Supplier ships goods
- User clicks "Mark as Shipped"
- Status: "shipped"
- Shows payment button if not paid

#### **Step 4: Make Payment**
- User records payment
- Payment status: "paid"
- "Receive Order" button appears

#### **Step 5: Receive Order**
- User clicks "Receive Order"
- Status: "received"
- "Quality Check" button appears

#### **Step 6: Quality Check**
- User clicks "Quality Check"
- Selects template (Standard/Electronics/Phone)
- Checks each item (Pass/Fail/N/A)
- Records quantity passed, failed
- Adds notes and defect descriptions
- Clicks "Complete Check"

#### **Step 7: Add to Inventory** (NEW!)
- After quality check passes:
  - **In Modal:** Automatically shows inventory form
  - **In Detail Page:** Shows "Add to Inventory" button
- User sets:
  - Profit Margin % (default 30%)
  - Location (optional)
- Preview shows:
  - Number of items
  - Calculated selling prices
  - Location
- User clicks "Add to Inventory"

#### **Step 8: Completed**
- Items added to inventory
- Stock quantities updated
- Selling prices set
- Status: "completed" ✅

---

## 🔐 Security & Permissions

### RLS Policies Created:

All tables have permissive policies for authenticated users:

```sql
-- Templates & Criteria (Read-only for most users)
CREATE POLICY "Authenticated users can view quality check templates"
  ON quality_check_templates FOR SELECT TO authenticated USING (true);

-- Quality Checks (Read & Write)
CREATE POLICY "Authenticated users can view quality checks"
  ON purchase_order_quality_checks FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create quality checks"
  ON purchase_order_quality_checks FOR INSERT TO authenticated WITH CHECK (true);

-- Audit Logs (Write-only)
CREATE POLICY "Authenticated users can insert audit records"
  ON purchase_order_audit FOR INSERT TO authenticated WITH CHECK (true);
```

### SECURITY DEFINER Functions:

All RPC functions use `SECURITY DEFINER` to bypass RLS:
- `log_purchase_order_audit()`
- `create_quality_check_from_template()`
- `complete_quality_check()`
- `add_quality_checked_items_to_inventory()`

---

## 📊 Data Flow

### What Happens When Adding to Inventory:

```
1. USER INPUTS:
   - Profit Margin: 35%
   - Location: "Warehouse A"

2. FUNCTION PROCESSES:
   For each passed item:
   ├─> Calculate: Selling Price = Cost × (1 + 0.35)
   ├─> Update: lats_product_variants.price = Selling Price
   ├─> Update: lats_product_variants.quantity += Passed Qty
   ├─> Create: lats_inventory_adjustments record
   └─> Log: purchase_order_audit entry

3. UPDATE PO:
   ├─> Status: "completed"
   └─> Updated timestamp

4. RETURN:
   {
     "success": true,
     "message": "Successfully added 5 items to inventory",
     "items_added": 5
   }
```

---

## ✅ Testing Checklist

### Test Complete Workflow:

- [ ] **Create PO**
  - [ ] Add items with cost prices
  - [ ] Status shows "draft"

- [ ] **Ship Order**
  - [ ] Mark as "shipped"
  - [ ] Payment button appears

- [ ] **Record Payment**
  - [ ] Add payment record
  - [ ] Receive button appears

- [ ] **Receive Order**
  - [ ] Mark as "received"
  - [ ] Quality check button appears

- [ ] **Quality Check**
  - [ ] Select template
  - [ ] Check items (some pass, some fail)
  - [ ] Complete check
  - [ ] Inventory form appears (if all passed)

- [ ] **Add to Inventory**
  - [ ] Set profit margin (e.g., 40%)
  - [ ] Set location (e.g., "Store Front")
  - [ ] Preview shows correct calculation
  - [ ] Click "Add to Inventory"
  - [ ] Success message appears
  - [ ] PO status changes to "completed"

- [ ] **Verify Database**
  - [ ] Check `lats_product_variants` - selling price updated
  - [ ] Check `lats_product_variants` - quantity increased
  - [ ] Check `lats_inventory_adjustments` - record created
  - [ ] Check `purchase_order_audit` - audit log created
  - [ ] Check `lats_purchase_orders` - status is "completed"

---

## 🐛 Troubleshooting

### Common Issues:

#### **1. Audit Logging Errors (400/401)**
**Symptoms:** 
- Console shows: `POST .../log_purchase_order_audit 400 (Bad Request)`
- Console shows: `POST .../purchase_order_audit 401 (Unauthorized)`

**Fix:**
Run migration: `20251001_fix_purchase_order_audit.sql`

---

#### **2. Quality Check Empty (Item 1 of 0)**
**Symptoms:**
- Quality check modal shows no items
- "Item 1 of 0" in header

**Causes:**
- Wrong table name (`quality_check_items` vs `purchase_order_quality_check_items`)
- RPC function not created

**Fix:**
Run migration: `20251001_create_quality_check_system.sql`

---

#### **3. Duplicate Check Items**
**Symptoms:**
- Double the expected number of quality check items
- Same criteria appearing multiple times

**Fix:**
Run migration: `20251001_fix_duplicate_quality_criteria.sql`

---

#### **4. TypeScript Errors on Status**
**Symptoms:**
- Type errors: `'shipped' is not assignable to type '"sent" | "received"'`

**Fix:**
Already fixed in `src/features/lats/types/inventory.ts`

---

#### **5. Add to Inventory Button Not Showing**
**Symptoms:**
- Quality check completes but no inventory button

**Causes:**
- Payment status not "paid"
- Quality check didn't pass

**Check:**
- Ensure payment is recorded
- Check quality check results (must have passing items)

---

## 📚 API Reference

### RPC Functions:

#### `log_purchase_order_audit(p_purchase_order_id, p_action, p_details, p_user_id)`
Logs audit entries for purchase orders.

#### `create_quality_check_from_template(p_purchase_order_id, p_template_id, p_checked_by)`
Creates quality check with items based on template.

#### `complete_quality_check(p_quality_check_id, p_notes, p_signature)`
Completes quality check and calculates overall result.

#### `add_quality_checked_items_to_inventory(p_quality_check_id, p_purchase_order_id, p_user_id, p_profit_margin_percentage, p_default_location)`
Adds quality-checked items to inventory with selling prices.

---

## 🎯 Summary

### What Was Built:

✅ Complete purchase order workflow from creation to inventory
✅ Quality check system with templates and criteria
✅ Automatic selling price calculation based on profit margin
✅ Audit logging for all actions
✅ Inventory integration with stock updates
✅ Comprehensive UI for all steps
✅ Error handling and retry logic
✅ RLS policies for security

### Files Modified:

**Database:**
- 4 new migrations

**Types:**
- `src/features/lats/types/inventory.ts`

**Services:**
- `src/features/lats/services/purchaseOrderService.ts`
- `src/features/lats/services/qualityCheckService.ts`

**Components:**
- `src/features/lats/components/quality-check/QualityCheckModal.tsx`
- `src/features/lats/pages/PurchaseOrderDetailPage.tsx`

### Next Steps:

1. Run all 4 database migrations
2. Test the complete workflow
3. Adjust profit margins and templates as needed
4. Train users on new workflow

---

**Last Updated:** October 1, 2025
**Version:** 1.0

