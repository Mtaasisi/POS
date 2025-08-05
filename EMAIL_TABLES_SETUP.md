# Email Tables Setup

## Issue
The app is showing 404 errors for missing email tables:
- `email_templates` table (404 Not Found)
- `email_campaigns` table (404 Not Found)

## Solution

### Step 1: Create the Email Tables
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Navigate to your project: `jxhzveborezjhsmzsgbc`
3. Go to the **SQL Editor** tab
4. Copy and paste the entire contents of `email_tables_sql.sql` into the SQL editor
5. Click **Run** to execute the SQL

### Step 2: Verify Tables Created
After running the SQL, you should see:
- ✅ `email_templates` table created with 3 default templates
- ✅ `email_campaigns` table created
- ✅ `email_logs` table created
- ✅ RLS policies configured
- ✅ Default email templates inserted

### Step 3: Test the App
1. Refresh your app at `http://localhost:5181/`
2. The 404 errors should be gone
3. Email functionality should work properly

## What This Fixes
- ✅ Removes 404 errors for missing email tables
- ✅ Enables email template management
- ✅ Enables email campaign functionality
- ✅ Provides default email templates
- ✅ Sets up proper database structure with RLS policies

## Default Email Templates
The SQL creates 3 default email templates:
1. **Welcome Email** - For new customers
2. **Service Reminder** - For device pickup notifications
3. **Birthday Greeting** - For customer birthdays

## Error Handling
The app now gracefully handles missing tables and will show helpful console messages instead of 404 errors.

## Files Modified
- `src/components/CommunicationHub.tsx` - Added error handling
- `src/services/emailService.ts` - Added error handling
- `email_tables_sql.sql` - SQL to create tables
- `EMAIL_TABLES_SETUP.md` - This instruction file 