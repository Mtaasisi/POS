# Database Migration Cleanup Plan

## 🚨 **CRITICAL: Backup Your Database First!**

Before running any cleanup, create a full database backup.

## 📋 **Migration Cleanup Strategy**

### **Phase 1: Identify Conflicting Migrations**

The following migration files have conflicts and should be removed after the consolidation migration runs successfully:

#### **Duplicate Table Creation Migrations:**
- `20241201000000_create_lats_schema.sql`
- `20250128000004_create_lats_tables.sql`
- `20250128000005_create_lats_tables_safe.sql`
- `20250131000037_fix_lats_tables_schema.sql`
- `20250131000038_clean_lats_tables_fix.sql`
- `20250201000002_consolidate_schema.sql`

#### **Conflicting Field Fix Migrations:**
- `20250125000001_fix_store_shelf_field_conflict.sql`
- `20241225000002_fix_database_migration_errors.sql`
- `20250131000024_clean_comprehensive_fix.sql`
- `20250131000023_comprehensive_fix.sql`
- `20250131000034_final_database_consolidation.sql`
- `20250131000035_clean_database_fix.sql`

#### **WhatsApp Table Conflicts:**
- `20241222000000_fix_whatsapp_messages_schema.sql`
- `20241221000000_create_whatsapp_tables.sql`
- `20241226000003_create_whatsapp_tables_final.sql`
- `20241226000004_create_whatsapp_tables_final.sql`
- `20250128000000_recreate_whatsapp_messages_table.sql`

### **Phase 2: Safe Cleanup Steps**

1. **Run the consolidation migration first:**
   ```bash
   # Apply the new consolidation migration
   supabase migration up
   ```

2. **Test your application thoroughly:**
   - Verify all inventory functions work
   - Check product creation/editing
   - Test supplier management
   - Verify stock movements

3. **Only after successful testing, remove conflicting files:**
   ```bash
   # Move conflicting migrations to backup folder
   mkdir -p supabase/migrations/backup/conflicting
   
   # Move the conflicting files (DO NOT DELETE YET!)
   mv supabase/migrations/20241201000000_create_lats_schema.sql supabase/migrations/backup/conflicting/
   mv supabase/migrations/20250128000004_create_lats_tables.sql supabase/migrations/backup/conflicting/
   mv supabase/migrations/20250128000005_create_lats_tables_safe.sql supabase/migrations/backup/conflicting/
   # ... (continue with other conflicting files)
   ```

4. **Verify database integrity:**
   ```sql
   -- Check that all tables exist and have correct structure
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name LIKE 'lats_%'
   ORDER BY table_name;
   ```

### **Phase 3: Final Cleanup**

After 1-2 weeks of successful operation:

1. **Delete the backup folder** (only if everything works perfectly)
2. **Update your database types** if needed
3. **Document the clean schema** for future reference

## 🎯 **Expected Results**

After cleanup, you should have:
- ✅ Single, clean schema definitions
- ✅ No conflicting migrations
- ✅ Proper foreign key relationships
- ✅ Consistent column types and constraints
- ✅ Reduced migration file count from 200+ to ~50

## ⚠️ **Important Notes**

1. **Never delete migration files** until you're 100% sure the consolidation works
2. **Test thoroughly** before removing any files
3. **Keep backups** of all removed files for at least 30 days
4. **Monitor your application** for any issues after cleanup

## 🔍 **Verification Queries**

Run these queries to verify the cleanup worked:

```sql
-- Check for duplicate table definitions
SELECT 
    schemaname,
    tablename,
    COUNT(*) as definition_count
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE 'lats_%'
GROUP BY schemaname, tablename
HAVING COUNT(*) > 1;

-- Check for conflicting columns
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'lats_products'
ORDER BY ordinal_position;

-- Verify foreign key relationships
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY' 
AND tc.table_name LIKE 'lats_%';
```
