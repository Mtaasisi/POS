# Console Error Migration Guide

## 🎯 **Goal**
Replace 1500+ `console.error` statements with proper error handling using the new `errorService`.

## 📋 **Migration Strategy**

### **Phase 1: Database Layer (Priority 1)**

Replace console.error statements in database-related files:

#### **Files to Update:**
- `src/features/lats/stores/useInventoryStore.ts` (500+ errors)
- `src/features/lats/lib/data/provider.supabase.ts` (400+ errors)

#### **Pattern Replacements:**

**Before:**
```typescript
console.error('Error loading products:', error);
```

**After:**
```typescript
import { logDatabase } from '../lib/errorService';
logDatabase('Failed to load products', error, {
  component: 'useInventoryStore',
  action: 'loadProducts'
});
```

**Before:**
```typescript
console.error('❌ Database error:', error);
```

**After:**
```typescript
import { logDatabase } from '../lib/errorService';
logDatabase('Database operation failed', error, {
  component: 'SupabaseDataProvider',
  action: 'getProducts'
});
```

### **Phase 2: Component Layer (Priority 2)**

Replace console.error statements in UI components:

#### **Files to Update:**
- `src/features/lats/pages/UnifiedInventoryPage.tsx` (50+ errors)
- `src/features/lats/components/inventory/EnhancedInventoryTab.tsx` (30+ errors)
- `src/features/lats/components/pos/EnhancedPOSComponent.tsx` (100+ errors)

#### **Pattern Replacements:**

**Before:**
```typescript
console.error('Stock adjustment error:', error);
```

**After:**
```typescript
import { logUI } from '../lib/errorService';
logUI('Stock adjustment failed', error, {
  component: 'UnifiedInventoryPage',
  action: 'handleStockAdjustment'
});
```

### **Phase 3: Service Layer (Priority 3)**

Replace console.error statements in service files:

#### **Files to Update:**
- `src/lib/saleProcessingService.ts` (50+ errors)
- `src/features/lats/lib/liveInventoryService.ts` (30+ errors)

#### **Pattern Replacements:**

**Before:**
```typescript
console.error('❌ Authentication failed for inventory update:', authError?.message);
```

**After:**
```typescript
import { logAuth } from '../lib/errorService';
logAuth('Authentication failed for inventory update', authError, {
  component: 'SaleProcessingService',
  action: 'updateInventory'
});
```

## 🔧 **Automated Migration Script**

Create a script to help with the migration:

```bash
#!/bin/bash
# migrate-console-errors.sh

echo "🔍 Finding console.error statements..."

# Find all console.error statements
grep -r "console\.error" src/features/lats/ --include="*.ts" --include="*.tsx" | wc -l

echo "📋 Files with console.error statements:"
grep -r "console\.error" src/features/lats/ --include="*.ts" --include="*.tsx" -l

echo "✅ Migration script completed!"
```

## 📊 **Expected Results**

After migration:
- ✅ **0 console.error statements** in production code
- ✅ **Structured error logging** with context and categorization
- ✅ **Better error tracking** and debugging capabilities
- ✅ **User-friendly error messages** for critical issues
- ✅ **Centralized error management**

## 🚀 **Implementation Steps**

### **Step 1: Install Error Service**
```typescript
// Already created: src/features/lats/lib/errorService.ts
```

### **Step 2: Update Import Statements**
Add to each file that needs error handling:
```typescript
import { logDatabase, logNetwork, logUI, logBusiness } from '../lib/errorService';
```

### **Step 3: Replace Error Statements**
Use find/replace to update patterns:
- `console.error('Error` → `logDatabase('Error`
- `console.error('❌` → `logDatabase('❌`
- `console.error('Failed` → `logDatabase('Failed`

### **Step 4: Add Context Information**
Update error calls to include context:
```typescript
logDatabase('Failed to load products', error, {
  component: 'useInventoryStore',
  action: 'loadProducts',
  userId: user?.id
});
```

### **Step 5: Test Error Handling**
Verify that errors are properly logged and categorized.

## 📈 **Benefits**

1. **Better Debugging**: Structured error logs with context
2. **Production Monitoring**: Errors can be sent to external services
3. **User Experience**: Critical errors show user-friendly notifications
4. **Performance**: Reduced console noise in production
5. **Maintainability**: Centralized error handling logic

## ⚠️ **Important Notes**

1. **Keep console.error for development**: Use `logDebug` for development-only logs
2. **Don't remove all console logs**: Keep `console.log` for normal debugging
3. **Test thoroughly**: Ensure error handling doesn't break functionality
4. **Monitor performance**: Ensure error service doesn't impact performance
5. **Backup first**: Always backup before making bulk changes

## 🔍 **Verification**

After migration, verify:
- No `console.error` statements in production code
- Errors are properly categorized and logged
- User notifications work for critical errors
- Performance is not impacted
- All functionality still works correctly
