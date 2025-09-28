# Diagnostic Multiple Relationships Fix

## Issue
Error: "Could not embed because more than one relationship was found for 'diagnostic_requests' and 'auth_users'"

## Root Cause
The `diagnostic_requests` table has **two foreign key relationships** to the `auth_users` table:
1. `created_by` → `auth_users(id)` (constraint: `diagnostic_requests_created_by_fkey`)
2. `assigned_to` → `auth_users(id)` (constraint: `diagnostic_requests_assigned_to_fkey`)

When Supabase tries to join `auth_users` without specifying which relationship to use, it gets confused because there are multiple paths.

## Solution
Specify the exact foreign key constraint names in the query using the `!constraint_name` syntax.

## Fixed Queries

### Before (Ambiguous)
```sql
created_by_user:auth_users(id, name, username),
assigned_to_user:auth_users(id, name, username),
```

### After (Specific)
```sql
created_by_user:auth_users!diagnostic_requests_created_by_fkey(id, name, username),
assigned_to_user:auth_users!diagnostic_requests_assigned_to_fkey(id, name, username),
```

## Files Updated
- ✅ `src/lib/diagnosticsApi.ts`
  - `getDiagnosticRequests()` function
  - `getDiagnosticRequest()` function

## How It Works
The `!constraint_name` syntax tells Supabase exactly which foreign key relationship to use:
- `!diagnostic_requests_created_by_fkey` → Uses the `created_by` relationship
- `!diagnostic_requests_assigned_to_fkey` → Uses the `assigned_to` relationship

## Result
- ✅ No more "multiple relationships" error
- ✅ Proper user data loading for both created_by and assigned_to users
- ✅ Complex joins work correctly
- ✅ All diagnostic functionality should work properly

## Testing
After this fix, the diagnostic requests should load with:
- Creator user information (name, username)
- Assigned user information (name, username)
- All related devices and checks
- No relationship ambiguity errors

