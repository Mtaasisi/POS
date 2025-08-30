# Rollback Guide: Subbrands Feature

## 🔄 **Rollback Instructions**

This guide will help you undo the subbrands feature and revert your brands table to its original state.

## 📋 **What Will Be Removed**

### **Database Changes:**
- `parent_id` column (for subbrands)
- `is_active` column
- `sort_order` column
- `color` column
- `icon` column
- `metadata` column
- All subbrand-related functions and triggers
- Unique constraint changes

### **Code Changes:**
- BrandTree component (deleted)
- Subbrands API functions (removed)
- Brand interface updates (reverted)

## 🔧 **Rollback Steps**

### **Step 1: Run the Rollback Migration**
1. Go to your **Supabase Dashboard**
2. Navigate to **SQL Editor**
3. Click **"New Query"**
4. Copy and paste the content from `supabase/migrations/20241201000005_rollback_subbrands.sql`
5. Click **"Run"** to execute the rollback

### **Step 2: Verify the Rollback**
After running the rollback, your `lats_brands` table should have:
- ✅ Original structure restored
- ✅ No `parent_id` column
- ✅ Original unique constraint on `name`
- ✅ No subbrand-related functions

### **Step 3: Check Your Application**
1. **Refresh** your LATS application
2. **Navigate** to Brand Management
3. **Verify** that brands work normally without subbrands

## ⚠️ **Important Notes**

### **Data Loss Warning**
- **Any subbrands you created will be lost**
- **Parent-child relationships will be removed**
- **All brands will become root-level brands**

### **Before Rolling Back**
- **Backup** your data if you have important subbrands
- **Export** any subbrand data you want to keep
- **Test** the rollback in a development environment first

### **After Rolling Back**
- **All brands will be at the root level**
- **No hierarchical structure**
- **Simple flat brand list**

## 🆘 **Troubleshooting**

### **Rollback Fails**
- **Check**: You have proper permissions in Supabase
- **Verify**: All tables exist and are accessible
- **Ensure**: No active connections are using subbrands

### **Application Errors**
- **Clear**: Browser cache and refresh
- **Check**: Console for any remaining subbrand references
- **Restart**: Your development server

### **Data Issues**
- **Verify**: All brands are still present
- **Check**: Brand names are unique
- **Test**: Brand creation and editing

## ✅ **Verification Checklist**

After rollback, verify:

- [ ] `lats_brands` table has original structure
- [ ] No `parent_id` column exists
- [ ] Brand names are unique
- [ ] Brand management works normally
- [ ] No subbrand-related errors in console
- [ ] All existing brands are accessible

## 📞 **Support**

If you encounter issues during rollback:

1. **Check**: The troubleshooting section above
2. **Review**: SQL execution logs in Supabase
3. **Contact**: Support with specific error messages

---

**Note**: This rollback will permanently remove the subbrands feature. Make sure this is what you want before proceeding.
