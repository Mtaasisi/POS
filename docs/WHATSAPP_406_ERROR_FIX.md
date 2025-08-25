# WhatsApp 406 Not Acceptable Error Fix

## Problem Description

The 406 (Not Acceptable) error occurs when trying to query the `whatsapp_instances` table from Supabase. This error typically indicates a mismatch between the expected table structure and the actual query being made, often due to Row Level Security (RLS) policy issues.

## Error Symptoms

- Console error: `GET https://jxhzveborezjhsmzsgbc.supabase.co/rest/v1/whatsapp_instances?select=*&instance_id=eq.aa8e52c6-b7b3-4eac-b9ab-a4ada6044664 406 (Not Acceptable)`
- WhatsApp instances not loading in the UI
- Green API service failing to fetch instance data

## Root Cause

The issue is typically caused by:
1. **RLS Policy Conflicts**: Multiple or conflicting Row Level Security policies on the `whatsapp_instances` table
2. **Table Structure Mismatch**: The table structure doesn't match what the application expects
3. **Authentication Issues**: The current user doesn't have proper permissions to access the table

## Solution

### Method 1: Run the SQL Fix Script (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Fix Script**
   - Copy and paste the contents of `scripts/fix-whatsapp-instances-406-error.sql`
   - Execute the script

3. **Verify the Fix**
   - The script will show the current policies
   - Drop all existing policies
   - Create new, permissive policies
   - Test the table access

### Method 2: Use the Node.js Script

1. **Set up Environment Variables**
   ```bash
   export VITE_SUPABASE_URL="your-supabase-url"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ```

2. **Run the Script**
   ```bash
   node scripts/run-rls-fix.js
   ```

3. **Alternative Method**
   ```bash
   node scripts/run-rls-fix.js --alternative
   ```

### Method 3: Manual Fix

If the automated scripts don't work, you can manually fix the issue:

1. **Drop All Existing Policies**
   ```sql
   DROP POLICY IF EXISTS "Users can view their own WhatsApp instances" ON whatsapp_instances;
   DROP POLICY IF EXISTS "Users can insert their own WhatsApp instances" ON whatsapp_instances;
   DROP POLICY IF EXISTS "Users can update their own WhatsApp instances" ON whatsapp_instances;
   DROP POLICY IF EXISTS "Users can delete their own WhatsApp instances" ON whatsapp_instances;
   -- Add all other policy names here
   ```

2. **Create New Policies**
   ```sql
   CREATE POLICY "Allow authenticated users to view whatsapp_instances" 
   ON whatsapp_instances FOR SELECT TO authenticated USING (true);

   CREATE POLICY "Allow authenticated users to create whatsapp_instances" 
   ON whatsapp_instances FOR INSERT TO authenticated WITH CHECK (true);

   CREATE POLICY "Allow authenticated users to update whatsapp_instances" 
   ON whatsapp_instances FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

   CREATE POLICY "Allow authenticated users to delete whatsapp_instances" 
   ON whatsapp_instances FOR DELETE TO authenticated USING (true);
   ```

## Code Changes Made

### 1. Enhanced Error Handling in `greenApiService.ts`

- Updated `getInstance()` method to use `maybeSingle()` instead of `single()`
- Added retry mechanism with backoff
- Added specific handling for 406 errors
- Improved error messages and logging

### 2. Added RLS Diagnosis Method

- New `diagnoseRLSIssues()` method to help identify RLS problems
- Tests basic table access and specific queries
- Provides recommendations for fixing issues

### 3. Better Error Messages

- User-friendly error messages for different error types
- Specific handling for 406 errors with clear instructions
- Network error detection and handling

## Verification

After applying the fix, verify that:

1. **Console Errors are Gone**: No more 406 errors in the browser console
2. **WhatsApp Instances Load**: The instances should load properly in the UI
3. **Green API Service Works**: All WhatsApp-related functionality should work

## Testing

You can test the fix by:

1. **Using the Diagnosis Method**:
   ```javascript
   const diagnosis = await greenApiService.diagnoseRLSIssues();
   console.log(diagnosis);
   ```

2. **Testing Instance Fetching**:
   ```javascript
   const instances = await greenApiService.getInstances();
   console.log('Instances loaded:', instances.length);
   ```

3. **Testing Specific Instance**:
   ```javascript
   const instance = await greenApiService.getInstance('your-instance-id');
   console.log('Instance found:', !!instance);
   ```

## Prevention

To prevent this issue in the future:

1. **Use Migration Scripts**: Always use proper migration scripts for database changes
2. **Test RLS Policies**: Test RLS policies thoroughly before deploying
3. **Monitor Errors**: Set up error monitoring for 406 errors
4. **Document Changes**: Keep documentation of RLS policy changes

## Support

If the issue persists after trying these solutions:

1. Check the Supabase logs for more detailed error information
2. Verify that the table structure matches the expected schema
3. Ensure the user has proper authentication and permissions
4. Contact the development team with the error logs and diagnosis results
