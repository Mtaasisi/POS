# WhatsApp Messages 400 Bad Request Error Fix

## Problem
The application was experiencing 400 Bad Request errors when querying the `whatsapp_messages` table. The errors occurred because the code was trying to query a `customer_id` column that doesn't exist in the current database schema.

## Root Cause
The `whatsapp_messages` table schema was defined in multiple conflicting migrations:

1. **20241201000071_create_whatsapp_enhanced_tables.sql** - Has `customer_id` column
2. **20241222000000_fix_whatsapp_messages_schema.sql** - Does NOT have `customer_id` column (this is the current schema)

The current database is using the schema from the second migration, which only has:
- `id` (TEXT PRIMARY KEY)
- `instance_id` (TEXT)
- `chat_id` (TEXT)
- `sender_id` (TEXT)
- `sender_name` (TEXT)
- `type` (TEXT)
- `content` (TEXT)
- `message` (TEXT)
- `direction` (TEXT)
- `status` (TEXT)
- `metadata` (JSONB)
- `timestamp` (TIMESTAMP)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Solution
Modified the code in `src/features/lats/pages/WhatsAppChatPage.tsx` to handle the missing `customer_id` column gracefully:

### 1. Updated `loadCustomers` function
- Added try-catch logic to first attempt querying with `customer_id`
- Falls back to querying with `sender_id` only if `customer_id` doesn't exist
- Maintains the same functionality for matching customers by phone number

### 2. Updated `loadCustomersWithChats` function
- Similar try-catch logic for the chat history query
- Falls back to querying without `customer_id` if the column doesn't exist

### 3. Updated `ChatDatabaseService.saveMessage` function
- Tries to insert with `customer_id` first
- Falls back to inserting without `customer_id` if the column doesn't exist

### 4. Updated `ChatDatabaseService.loadChatHistory` function
- Tries to query with `customer_id` first
- Falls back to matching by `sender_id` using customer phone number if `customer_id` doesn't exist

### 5. Updated `ChatDatabaseService.searchMessages` function
- Similar fallback logic for searching messages

## Migration Created
Created a new migration file `20250125000005_add_customer_id_to_whatsapp_messages.sql` that:
- Adds the missing `customer_id` column to the `whatsapp_messages` table
- Creates an index for better performance
- Updates RLS policies

## Testing
The fix ensures that:
1. The application works with the current database schema (without `customer_id`)
2. If the migration is applied later, the application will use the `customer_id` column for better performance
3. No 400 Bad Request errors occur when loading customers or chat history
4. Message saving and searching work correctly in both scenarios

## Files Modified
- `src/features/lats/pages/WhatsAppChatPage.tsx` - Updated all WhatsApp message queries
- `supabase/migrations/20250125000005_add_customer_id_to_whatsapp_messages.sql` - New migration (optional)

## Result
The 400 Bad Request errors should now be resolved, and the WhatsApp chat functionality should work correctly with the current database schema.
