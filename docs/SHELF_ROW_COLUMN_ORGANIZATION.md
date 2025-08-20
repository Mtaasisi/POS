# Shelf Row & Column Organization System

## 📋 **Current Shelf Structure**

### **Database Fields for Row/Column Organization:**

```sql
-- In lats_store_shelves table
row_number INTEGER,        -- Which row the shelf is in
column_number INTEGER,     -- Which column the shelf is in
aisle TEXT,               -- Which aisle the shelf belongs to
floor_level INTEGER,      -- Which floor level (default: 1)
zone TEXT,                -- Store zone: 'front', 'back', 'left', 'right', 'center'
coordinates JSONB,        -- 3D positioning: {x: number, y: number, z: number}
```

---

## 🏗️ **Shelf Organization Hierarchy**

### **1. Store Location** (Top Level)
```
Store Location: "Main Branch - Nairobi"
├── Floor 1
│   ├── Zone: Front
│   │   ├── Aisle: A
│   │   │   ├── Row 1, Column 1: SHELF001 (Electronics Display)
│   │   │   ├── Row 1, Column 2: SHELF002 (Accessories)
│   │   │   └── Row 1, Column 3: SHELF003 (Tools)
│   │   └── Aisle: B
│   │       ├── Row 2, Column 1: SHELF004 (Parts)
│   │       └── Row 2, Column 2: SHELF005 (Cables)
│   └── Zone: Back
│       └── Aisle: C
│           ├── Row 3, Column 1: SHELF006 (Storage)
│           └── Row 3, Column 2: SHELF007 (Refrigerated)
└── Floor 2
    └── Zone: Center
        └── Aisle: D
            └── Row 1, Column 1: SHELF008 (Specialty Items)
```

---

## 📊 **Row & Column System**

### **Row Organization:**
- **Row 1**: Display shelves (eye level)
- **Row 2**: Mid-level shelves (waist level)
- **Row 3**: Lower shelves (floor level)
- **Row 4+**: Additional levels as needed

### **Column Organization:**
- **Column 1**: Electronics section
- **Column 2**: Accessories section
- **Column 3**: Tools section
- **Column 4**: Parts section
- **Column 5**: Cables section
- **Column 6+**: Additional sections

### **Aisle Organization:**
- **Aisle A**: Main display area
- **Aisle B**: Secondary display
- **Aisle C**: Storage area
- **Aisle D**: Specialty items

---

## 🎯 **Example Shelf Layout**

### **Store Layout Example:**

```
Floor 1 - Front Zone
┌─────────────────────────────────────────────────────────┐
│                    AISLE A                              │
├─────────────┬─────────────┬─────────────┬─────────────┤
│ Row 1       │ Row 1       │ Row 1       │ Row 1       │
│ Col 1       │ Col 2       │ Col 3       │ Col 4       │
│ SHELF001    │ SHELF002    │ SHELF003    │ SHELF004    │
│ Electronics │ Accessories │ Tools       │ Parts       │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ Row 2       │ Row 2       │ Row 2       │ Row 2       │
│ Col 1       │ Col 2       │ Col 3       │ Col 4       │
│ SHELF005    │ SHELF006    │ SHELF007    │ SHELF008    │
│ Cables      │ Storage     │ Refrigerated│ Specialty   │
└─────────────┴─────────────┴─────────────┴─────────────┘

Floor 1 - Back Zone
┌─────────────────────────────────────────────────────────┐
│                    AISLE C                              │
├─────────────┬─────────────┬─────────────┬─────────────┤
│ Row 3       │ Row 3       │ Row 3       │ Row 3       │
│ Col 1       │ Col 2       │ Col 3       │ Col 4       │
│ SHELF009    │ SHELF010    │ SHELF011    │ SHELF012    │
│ Bulk Storage│ Bulk Storage│ Bulk Storage│ Bulk Storage│
└─────────────┴─────────────┴─────────────┴─────────────┘
```

---

## 🔧 **Database Schema Details**

### **Row & Column Fields:**

```sql
-- Physical positioning
row_number INTEGER,        -- Vertical position (1, 2, 3, ...)
column_number INTEGER,     -- Horizontal position (1, 2, 3, ...)
aisle TEXT,               -- Aisle identifier (A, B, C, ...)
floor_level INTEGER,      -- Floor number (1, 2, 3, ...)

-- 3D coordinates for precise positioning
coordinates JSONB,        -- {x: number, y: number, z: number}
```

### **Example Data:**

```sql
-- Shelf in Row 1, Column 2, Aisle A, Floor 1
INSERT INTO lats_store_shelves (
    name, code, row_number, column_number, aisle, floor_level, zone
) VALUES (
    'Accessories Display', 'SHELF002', 1, 2, 'A', 1, 'front'
);

-- Shelf in Row 3, Column 1, Aisle C, Floor 1
INSERT INTO lats_store_shelves (
    name, code, row_number, column_number, aisle, floor_level, zone
) VALUES (
    'Bulk Storage', 'SHELF009', 3, 1, 'C', 1, 'back'
);
```

---

## 📱 **User Interface Organization**

### **Shelf Management Display:**

```
Shelf Grid View:
┌─────────────────────────────────────────────────────────┐
│ Store: Main Branch - Nairobi                            │
│ Floor: 1 | Zone: Front | Aisle: A                       │
├─────────────┬─────────────┬─────────────┬─────────────┤
│ Row 1       │ Row 1       │ Row 1       │ Row 1       │
│ Col 1       │ Col 2       │ Col 3       │ Col 4       │
│ [SHELF001]  │ [SHELF002]  │ [SHELF003]  │ [SHELF004]  │
│ Electronics │ Accessories │ Tools       │ Parts       │
│ 15/50       │ 8/30        │ 12/40       │ 5/25        │
├─────────────┼─────────────┼─────────────┼─────────────┤
│ Row 2       │ Row 2       │ Row 2       │ Row 2       │
│ Col 1       │ Col 2       │ Col 3       │ Col 4       │
│ [SHELF005]  │ [SHELF006]  │ [SHELF007]  │ [SHELF008]  │
│ Cables      │ Storage     │ Refrigerated│ Specialty   │
│ 20/35       │ 45/100      │ 3/15        │ 2/10        │
└─────────────┴─────────────┴─────────────┴─────────────┘
```

---

## 🎯 **Product Location System**

### **How Products Are Located:**

1. **Store Location**: Which store branch
2. **Floor Level**: Which floor (1, 2, 3, ...)
3. **Zone**: Which area (front, back, left, right, center)
4. **Aisle**: Which aisle (A, B, C, ...)
5. **Row**: Which vertical level (1, 2, 3, ...)
6. **Column**: Which horizontal position (1, 2, 3, ...)
7. **Shelf Code**: Specific shelf identifier (SHELF001, SHELF002, ...)

### **Example Product Location:**
```
Product: "iPhone Charger Cable"
Location: Main Branch - Nairobi
Floor: 1
Zone: Front
Aisle: A
Row: 1
Column: 2
Shelf: SHELF002 (Accessories Display)
Full Path: Main Branch > Floor 1 > Front Zone > Aisle A > Row 1 > Column 2 > SHELF002
```

---

## 🔍 **Search & Filter Capabilities**

### **Filtering Options:**

```typescript
// Filter by location hierarchy
const filters = {
  store_location_id: 'location-uuid',
  floor_level: 1,
  zone: 'front',
  aisle: 'A',
  row_number: 1,
  column_number: 2
};

// Search by shelf code
const search = 'SHELF002';

// Get shelves in specific area
const shelves = await storeShelfApi.getShelvesByLocation({
  store_location_id: 'location-uuid',
  floor_level: 1,
  zone: 'front'
});
```

---

## 📊 **Capacity Management**

### **Row & Column Capacity:**

```sql
-- Each shelf has capacity limits
max_capacity INTEGER,     -- Maximum products per shelf
current_capacity INTEGER, -- Current products on shelf

-- Example: Row 1, Column 1 can hold 50 products
-- Example: Row 3, Column 1 can hold 100 products (bulk storage)
```

### **Capacity Visualization:**

```
Row 1 (Display Level):
┌─────────┬─────────┬─────────┬─────────┐
│ Col 1   │ Col 2   │ Col 3   │ Col 4   │
│ 15/50   │ 8/30    │ 12/40   │ 5/25    │
│ 30%     │ 27%     │ 30%     │ 20%     │
└─────────┴─────────┴─────────┴─────────┘

Row 2 (Mid Level):
┌─────────┬─────────┬─────────┬─────────┐
│ Col 1   │ Col 2   │ Col 3   │ Col 4   │
│ 20/35   │ 45/100  │ 3/15    │ 2/10    │
│ 57%     │ 45%     │ 20%     │ 20%     │
└─────────┴─────────┴─────────┴─────────┘
```

---

## 🚀 **Benefits of This Organization**

### **For Staff:**
- **Quick Location**: Find products using row/column coordinates
- **Logical Flow**: Natural walking path through store
- **Efficient Picking**: Optimized for order fulfillment
- **Visual Organization**: Easy to understand layout

### **For Customers:**
- **Clear Navigation**: Logical store layout
- **Easy Finding**: Products in expected locations
- **Better Experience**: Organized shopping environment

### **For Management:**
- **Space Optimization**: Efficient use of store space
- **Inventory Control**: Precise location tracking
- **Performance Analytics**: Track shelf utilization by area
- **Planning**: Optimize layout based on usage data

---

## 🎯 **Implementation Status**

### **✅ Currently Implemented:**
- Database fields for row/column organization
- API methods for filtering by location
- Basic shelf management interface
- Capacity tracking system

### **🔄 Future Enhancements:**
- Visual shelf layout grid
- Drag-and-drop shelf positioning
- 3D store layout visualization
- Mobile app with location-based navigation
- Barcode scanning for shelf identification

---

## 📞 **Usage Examples**

### **Creating a Shelf with Row/Column:**
```typescript
const newShelf = {
  store_location_id: 'location-uuid',
  name: 'Electronics Display',
  code: 'SHELF001',
  row_number: 1,
  column_number: 1,
  aisle: 'A',
  floor_level: 1,
  zone: 'front',
  section: 'electronics',
  max_capacity: 50
};
```

### **Finding Products by Location:**
```typescript
// Find all products in Row 1, Column 2
const products = await storeShelfApi.getShelfProducts('SHELF002');

// Find all shelves in Aisle A
const shelves = await storeShelfApi.getAll({
  aisle: 'A',
  floor_level: 1
});
```

**This row and column system provides precise organization for efficient inventory management and easy product location!** 🎯
