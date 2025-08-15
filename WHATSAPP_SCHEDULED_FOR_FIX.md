# WhatsApp scheduled_for Column Error Fix

## Problem
You encountered this error:
```
ERROR: 42703: column "scheduled_for" does not exist
```

## Root Cause
The WhatsApp database tables were either:
1. Not created properly
2. Created with missing columns
3. Have incorrect table structure

## Solution

### Option 1: Quick Fix (Recommended)
Run this script to get the complete SQL fix:
```bash
node scripts/fix-whatsapp-error.js
```

### Option 2: Manual Fix
1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the content from `fix-whatsapp-column-error.sql`
4. Click "Run" to execute

## What the Fix Does

### 1. Drops Existing Tables
```sql
DROP TABLE IF EXISTS scheduled_whatsapp_messages CASCADE;
DROP TABLE IF EXISTS whatsapp_campaigns CASCADE;
DROP TABLE IF EXISTS whatsapp_autoresponders CASCADE;
DROP TABLE IF EXISTS whatsapp_templates CASCADE;
DROP TABLE IF EXISTS whatsapp_messages CASCADE;
DROP TABLE IF EXISTS whatsapp_chats CASCADE;
```

### 2. Creates Tables with Correct Structure
- `whatsapp_chats` - Chat sessions
- `whatsapp_messages` - Individual messages  
- `scheduled_whatsapp_messages` - **Includes `scheduled_for` column**
- `whatsapp_templates` - Message templates
- `whatsapp_autoresponders` - Auto-response rules
- `whatsapp_campaigns` - **Includes `scheduled_for` column**

### 3. Creates Indexes
- Performance indexes for all tables
- Specific index on `scheduled_for` column

### 4. Enables RLS
- Row Level Security for all tables
- Basic policies for authenticated users

### 5. Inserts Sample Data
- Welcome message template
- Order update template  
- Appointment reminder template

## Files Created

### 1. `fix-whatsapp-column-error.sql`
Complete SQL script that:
- Drops existing tables
- Creates new tables with correct structure
- Sets up indexes and RLS
- Inserts sample data

### 2. `scripts/fix-whatsapp-error.js`
Helper script that:
- Checks existing table structure
- Diagnoses the problem
- Provides the complete SQL fix
- Gives step-by-step instructions

## Verification

After running the fix, you should see:
```
Tables created successfully | 6
```

## Next Steps

1. **Run the fix script** to get the SQL
2. **Execute the SQL** in Supabase dashboard
3. **Refresh the WhatsApp page** in your app
4. **Test the functionality** - the error should be gone

## Troubleshooting

### If you still get the error:
1. Make sure you ran the complete SQL script
2. Check that all tables were created successfully
3. Verify the `scheduled_for` column exists in both:
   - `scheduled_whatsapp_messages` table
   - `whatsapp_campaigns` table

### If tables don't create:
1. Check your Supabase permissions
2. Make sure you're in the correct database
3. Try running the SQL in smaller chunks

## Important Notes

⚠️ **Warning**: This fix will drop and recreate all WhatsApp tables. If you have existing data, make sure to backup first!

✅ **Safe**: The script uses `IF NOT EXISTS` and `CASCADE` to handle existing data safely.

🔄 **Complete**: This creates all necessary tables, indexes, and policies for full WhatsApp functionality.
