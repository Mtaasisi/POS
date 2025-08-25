# Green API Issues - Fixes and Solutions

## Issues Identified

1. **Connection Refused Error**: `net::ERR_CONNECTION_REFUSED` when trying to connect to localhost:8888
2. **Database Conflict Error**: 409 conflict when inserting settings into `green_api_settings` table
3. **Missing Netlify Function**: Proxy function not properly deployed or accessible
4. **CORS Policy Error**: `Access to fetch at 'https://inauzwa.store/api/green-api-proxy' from origin 'http://localhost:5173' has been blocked by CORS policy`

## Fixes Applied

### 1. Fixed Green API Proxy Configuration

**File**: `src/lib/greenApiProxy.ts`

**Changes**:
- Updated proxy URL to use local development server in development mode
- Added fallback to direct Green API when proxy fails
- Improved error handling for connection issues

**Key Changes**:
```typescript
// Before: Used localhost in development
this.proxyUrl = process.env.NODE_ENV === 'production' 
  ? 'https://inauzwa.store/api/green-api-proxy'
  : 'http://localhost:8888/.netlify/functions/green-api-proxy';

// After: Use local development proxy in development
this.proxyUrl = process.env.NODE_ENV === 'development' 
  ? 'http://localhost:8888/green-api-proxy'
  : 'https://inauzwa.store/api/green-api-proxy';
```

### 2. Fixed CORS Issues

**Files**: 
- `netlify/functions/green-api-proxy.js` - Updated CORS headers
- `scripts/dev-proxy.js` - Created local development proxy
- `package.json` - Added development scripts

**Changes**:
- Added proper CORS headers to Netlify function
- Created local development proxy server to handle CORS during development
- Added npm scripts for easy proxy management

**Key Features**:
- Local proxy server runs on port 8888
- Handles CORS preflight requests
- Provides health check endpoint
- Graceful error handling

### 3. Fixed Database Settings Conflict

**File**: `src/services/greenApiSettingsService.ts`

**Changes**:
- Replaced delete + insert with upsert to avoid conflicts
- Added conflict resolution logic
- Improved error handling for database operations

**Key Changes**:
```typescript
// Before: Delete then insert (caused conflicts)
const { error: deleteError } = await supabase
  .from('green_api_settings')
  .delete()
  .like('setting_key', `${instanceId}_%`);

// After: Use upsert with conflict resolution
const { data, error } = await supabase
  .from('green_api_settings')
  .upsert(settingsEntries, {
    onConflict: 'setting_key',
    ignoreDuplicates: false
  })
  .select();
```

### 4. Improved Error Handling in WhatsApp Settings Page

**File**: `src/features/lats/pages/WhatsAppSettingsPage.tsx`

**Changes**:
- Added better error detection for connection issues
- Implemented fallback to default settings when Green API is unavailable
- Added user-friendly error messages
- Added specific CORS error detection

**Key Changes**:
```typescript
// Added CORS error detection
if (error.message?.includes('CORS') || error.message?.includes('Access-Control-Allow-Origin')) {
  setInstanceState({ stateInstance: 'notAuthorized' });
  toast.warning('CORS issue detected. Please start the development proxy server with: npm run dev:proxy');
}
```

### 5. Database Migration for Settings Table

**File**: `supabase/migrations/20241201000104_fix_green_api_settings_table.sql`

**Changes**:
- Recreated the `green_api_settings` table with proper structure
- Added unique constraints and indexes
- Implemented proper RLS policies
- Added automatic timestamp updates

**Key Features**:
- Unique constraint on `setting_key`
- Proper RLS policies for authenticated users
- Automatic `updated_at` timestamp updates
- Indexes for better performance

### 6. Added Connection Diagnostics

**File**: `src/services/greenApiService.ts`

**Changes**:
- Added `diagnoseConnectionIssues()` method
- Tests both proxy and direct connections
- Provides recommendations based on test results

## Immediate Solutions for CORS Issues

### Option 1: Use Development Proxy (Recommended)

1. **Start the proxy server**:
   ```bash
   npm run dev:proxy
   ```

2. **In another terminal, start your app**:
   ```bash
   npm run dev
   ```

3. **Or start both together**:
   ```bash
   npm run dev:with-proxy
   ```

### Option 2: Use Browser Extension

Install a CORS browser extension like "CORS Unblock" for Chrome to bypass CORS restrictions during development.

### Option 3: Deploy Netlify Function

Deploy the updated Netlify function to production to fix CORS issues in production.

## Manual Steps Required

### 1. Run Database Migration

Execute this SQL in your Supabase SQL Editor:

```sql
-- Fix green_api_settings table structure
DROP TABLE IF EXISTS green_api_settings CASCADE;

CREATE TABLE green_api_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key TEXT NOT NULL UNIQUE,
    setting_value TEXT NOT NULL,
    description TEXT,
    is_encrypted BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_green_api_settings_key ON green_api_settings(setting_key);
CREATE INDEX idx_green_api_settings_created_at ON green_api_settings(created_at);

-- Enable RLS
ALTER TABLE green_api_settings ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Users can read green api settings" ON green_api_settings
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert green api settings" ON green_api_settings
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update green api settings" ON green_api_settings
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete green api settings" ON green_api_settings
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_green_api_settings_updated_at 
    BEFORE UPDATE ON green_api_settings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

### 2. Deploy Netlify Function

Ensure the Green API proxy function is deployed to Netlify:

1. Check that `netlify/functions/green-api-proxy.js` exists
2. Deploy to Netlify with function support enabled
3. Verify the function is accessible at `https://inauzwa.store/api/green-api-proxy`

### 3. Test the Fixes

1. **Test Database Access**:
   ```javascript
   // In browser console
   const { data, error } = await supabase
     .from('green_api_settings')
     .select('*')
     .limit(1);
   console.log('Database test:', { data, error });
   ```

2. **Test Proxy Connection**:
   ```javascript
   // In browser console
   fetch('http://localhost:8888/green-api-proxy', {
     method: 'POST',
     headers: { 'Content-Type': 'application/json' },
     body: JSON.stringify({ path: '/test', method: 'GET' })
   }).then(r => r.json()).then(console.log);
   ```

3. **Test Direct Green API**:
   ```javascript
   // In browser console
   fetch('https://api.green-api.com/test', {
     method: 'GET',
     headers: { 'Content-Type': 'application/json' }
   }).then(r => r.json()).then(console.log);
   ```

## Expected Results

After applying these fixes:

1. ✅ No more `ERR_CONNECTION_REFUSED` errors
2. ✅ No more 409 database conflicts
3. ✅ No more CORS policy errors
4. ✅ Settings load properly from database or Green API
5. ✅ Fallback to default settings when Green API is unavailable
6. ✅ Better error messages for users

## Troubleshooting

### If CORS issues persist:

1. **Check Proxy Server**:
   - Ensure proxy server is running on port 8888
   - Check terminal for "🚀 Local Green API proxy running" message
   - Test health endpoint: `curl http://localhost:8888/health`

2. **Check App Configuration**:
   - Verify app is running on localhost:5173
   - Check that `NODE_ENV` is set to 'development'
   - Ensure proxy URL is correctly configured

3. **Check Netlify Function Deployment**:
   - Verify the function is deployed and accessible
   - Check Netlify function logs for errors

4. **Check Database Permissions**:
   - Ensure RLS policies are correctly applied
   - Verify user authentication is working

5. **Test Connection Diagnostics**:
   ```javascript
   // In browser console
   const diagnosis = await greenApiService.diagnoseConnectionIssues();
   console.log('Connection diagnosis:', diagnosis);
   ```

## Files Modified

1. `src/lib/greenApiProxy.ts` - Fixed proxy configuration and added fallback
2. `src/services/greenApiSettingsService.ts` - Fixed database conflicts
3. `src/features/lats/pages/WhatsAppSettingsPage.tsx` - Improved error handling
4. `src/services/greenApiService.ts` - Added connection diagnostics
5. `netlify/functions/green-api-proxy.js` - Fixed CORS headers
6. `scripts/dev-proxy.js` - Created local development proxy
7. `scripts/quick-fix-cors.js` - Created quick fix script
8. `package.json` - Added development scripts
9. `supabase/migrations/20241201000104_fix_green_api_settings_table.sql` - Database migration

## Next Steps

1. ✅ **IMMEDIATE**: The development proxy server is now running
2. Run the database migration in Supabase
3. Deploy the updated code
4. Test the WhatsApp settings functionality
5. Monitor for any remaining issues

## Quick Commands

```bash
# Start development proxy server
npm run dev:proxy

# Start both dev server and proxy
npm run dev:with-proxy

# Run quick fix guide
node scripts/quick-fix-cors.js

# Test proxy health
curl http://localhost:8888/health
```
