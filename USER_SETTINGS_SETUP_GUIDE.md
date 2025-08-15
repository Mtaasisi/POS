# User Settings Table Setup Guide

## Issue Summary
The application is trying to access a `user_settings` table that doesn't exist in the database, causing 406 errors.

## Solution
You need to manually create the `user_settings` table in your Supabase database.

## Steps to Fix

### 1. Open Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to the **SQL Editor** section

### 2. Run the SQL Script
Copy and paste the following SQL into the SQL editor and run it:

```sql
-- Add user_settings table to existing database
-- This file can be run directly in Supabase SQL editor

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL,
    settings JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policy for user settings
CREATE POLICY "Allow users to manage their own settings" 
ON user_settings FOR ALL 
USING (auth.uid() = user_id);

-- Create trigger for updated_at column
CREATE TRIGGER update_user_settings_updated_at 
BEFORE UPDATE ON user_settings 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3. Verify the Table was Created
After running the SQL:
1. Go to the **Table Editor** in Supabase
2. You should see a new `user_settings` table
3. The table should have RLS enabled and the policy created

## What This Fixes
- ✅ Resolves the 406 error when accessing user settings
- ✅ Allows users to save and load their preferences
- ✅ Enables proper user settings management in the application

## Backup API Issue
The backup API connection refused error is expected since there's no local backend server running. The application will gracefully handle this and provide helpful error messages.

## Testing
After applying the fix:
1. Refresh your application
2. Try accessing the Settings page
3. The user settings should now load without errors
4. You should be able to save settings successfully
