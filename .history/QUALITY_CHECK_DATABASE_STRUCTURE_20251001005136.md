# Quality Check Database Structure

## 📊 **Quality Check Data is Stored in 4 Tables:**

### 1. **`quality_check_templates`** - Quality Check Templates
**Purpose:** Define reusable quality check templates (e.g., Electronics QC, Accessories QC)

**Key Columns:**
- `id` - UUID primary key
- `name` - Template name (e.g., "Electronics Quality Check")
- `description` - Template description
- `category` - Template category
- `is_active` - Whether template is active
- `created_at`, `updated_at`

**Example Query:**
```sql
SELECT * FROM quality_check_templates WHERE is_active = true;
```

---

### 2. **`quality_check_criteria`** - Check Criteria/Items
**Purpose:** Define specific check criteria for each template

**Key Columns:**
- `id` - UUID primary key
- `template_id` - References quality_check_templates
- `name` - Criterion name (e.g., "Physical Condition", "Functionality")
- `description` - Criterion description
- `is_required` - Whether criterion is required
- `sort_order` - Display order
- `created_at`

**Example Query:**
```sql
SELECT * FROM quality_check_criteria 
WHERE template_id = 'your-template-id'
ORDER BY sort_order;
```

---

### 3. **`purchase_order_quality_checks`** - PO Quality Checks
**Purpose:** Store quality check instances for purchase orders

**Key Columns:**
- `id` - UUID primary key (This is your Quality Check ID)
- `purchase_order_id` - References lats_purchase_orders
- `template_id` - References quality_check_templates
- `status` - Status: 'in_progress', 'passed', 'failed', 'partial'
- `overall_result` - Result: 'pass', 'fail', 'conditional'
- `checked_by` - User who performed the check
- `checked_at` - When check was completed
- `notes` - Additional notes
- `signature` - Digital signature
- `created_at`, `updated_at`

**Example Query (Get quality check for a PO):**
```sql
SELECT * FROM purchase_order_quality_checks 
WHERE purchase_order_id = '82561191-7a93-404d-997b-0b092567f88d';
```

**Your Current Quality Check:**
- Purchase Order: `82561191-7a93-404d-997b-0b092567f88d`
- Status: `in_progress`
- Has 7 items (5 passed, 2 pending)

---

### 4. **`purchase_order_quality_check_items`** - Individual Check Results
**Purpose:** Store results for each item being quality-checked

**Key Columns:**
- `id` - UUID primary key
- `quality_check_id` - References purchase_order_quality_checks
- `purchase_order_item_id` - References lats_purchase_order_items
- `criteria_id` - References quality_check_criteria
- `criteria_name` - Name of the criterion checked
- `result` - Result: 'pass', 'fail', 'na' (not applicable/pending)
- `quantity_checked` - How many units checked
- `quantity_passed` - How many passed
- `quantity_failed` - How many failed
- `defect_type` - Type of defect if failed
- `defect_description` - Description of defect
- `action_taken` - Action taken for failures
- `notes` - Additional notes
- `images` - Array of image URLs
- `created_at`, `updated_at`

**Example Query (Get items for a quality check):**
```sql
SELECT * FROM purchase_order_quality_check_items 
WHERE quality_check_id = 'your-quality-check-id';
```

**Get your current quality check items:**
```sql
-- First, get the quality check ID
SELECT id, status FROM purchase_order_quality_checks 
WHERE purchase_order_id = '82561191-7a93-404d-997b-0b092567f88d';

-- Then get the items (replace with actual QC ID from above)
SELECT 
    qci.*,
    poi.product_id,
    p.name as product_name
FROM purchase_order_quality_check_items qci
JOIN lats_purchase_order_items poi ON qci.purchase_order_item_id = poi.id
LEFT JOIN lats_products p ON poi.product_id = p.id
WHERE qci.quality_check_id = 'YOUR-QC-ID-HERE';
```

---

## 🔍 **To Find Your Quality Check Data:**

### Quick Query to See Everything:
```sql
SELECT 
    qc.id as quality_check_id,
    qc.status,
    qc.overall_result,
    qc.checked_at,
    COUNT(qci.id) as total_items,
    COUNT(CASE WHEN qci.result = 'pass' THEN 1 END) as passed,
    COUNT(CASE WHEN qci.result = 'fail' THEN 1 END) as failed,
    COUNT(CASE WHEN qci.result = 'na' THEN 1 END) as pending
FROM purchase_order_quality_checks qc
LEFT JOIN purchase_order_quality_check_items qci ON qc.id = qci.quality_check_id
WHERE qc.purchase_order_id = '82561191-7a93-404d-997b-0b092567f88d'
GROUP BY qc.id, qc.status, qc.overall_result, qc.checked_at;
```

### Get Detailed Item Breakdown:
```sql
SELECT 
    qci.criteria_name,
    qci.result,
    qci.quantity_checked,
    qci.quantity_passed,
    qci.quantity_failed,
    qci.notes,
    p.name as product_name
FROM purchase_order_quality_check_items qci
JOIN purchase_order_quality_checks qc ON qci.quality_check_id = qc.id
JOIN lats_purchase_order_items poi ON qci.purchase_order_item_id = poi.id
JOIN lats_products p ON poi.product_id = p.id
WHERE qc.purchase_order_id = '82561191-7a93-404d-997b-0b092567f88d'
ORDER BY qci.created_at;
```

---

## 📝 **Summary for Your PO:**

**Purchase Order:** `82561191-7a93-404d-997b-0b092567f88d`

**Quality Check Status:**
- ✅ 5 items passed
- ⏳ 2 items pending (result = 'na')
- Status: `in_progress`

**Location in Database:**
1. Quality check record → `purchase_order_quality_checks` table
2. Item results → `purchase_order_quality_check_items` table
3. Passed items need to be received → Will create records in `lats_inventory_adjustments` table

