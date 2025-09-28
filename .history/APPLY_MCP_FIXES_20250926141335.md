# 🚀 MCP Database Fix Application Guide

## Overview
This guide will help you apply the comprehensive database fixes using the MCP (Model Context Protocol) tools to resolve all authentication and permission issues.

## 🔧 Step 1: Apply Database Fix

### Option A: Using Supabase SQL Editor (Recommended)
1. Open your Supabase project dashboard
2. Go to SQL Editor
3. Copy and paste the contents of `APPLY_DATABASE_FIX_MCP.sql`
4. Click "Run" to execute the script
5. Verify the output shows "MCP Database Fix Applied Successfully!"

### Option B: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db reset
# Then apply the SQL file
psql -h your-db-host -U postgres -d postgres -f APPLY_DATABASE_FIX_MCP.sql
```

## 🔧 Step 2: Environment Configuration

### Create Environment File
1. Copy `env.template` to `.env` in your project root
2. Fill in your actual Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_actual_anon_key_here
   ```

### Get Your Supabase Credentials
1. Go to your Supabase project dashboard
2. Navigate to Settings > API
3. Copy the Project URL and anon/public key
4. Paste them into your `.env` file

## 🔧 Step 3: Test the Fixes

### Test Database Connection
```javascript
// Run this in your browser console or create a test file
import { supabase } from './src/lib/supabaseClient';

async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('lats_sales')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Connection failed:', error);
    } else {
      console.log('✅ Connection successful:', data);
    }
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testConnection();
```

### Test Sales Operations
```javascript
// Test creating a new sale
async function testSalesCreation() {
  try {
    const { data, error } = await supabase
      .from('lats_sales')
      .insert({
        sale_number: 'TEST-' + Date.now(),
        total_amount: 1000,
        payment_method: 'cash',
        status: 'completed',
        customer_name: 'Test Customer',
        customer_phone: '+255123456789'
      })
      .select();
    
    if (error) {
      console.error('❌ Sales creation failed:', error);
    } else {
      console.log('✅ Sales creation successful:', data);
    }
  } catch (err) {
    console.error('❌ Test failed:', err);
  }
}

testSalesCreation();
```

## 🔧 Step 4: Verify Application Functionality

### Test Critical Functions
1. **Sales Page**: Navigate to `/pos` and try creating a sale
2. **Customer Management**: Go to `/customers` and verify customer data loads
3. **Payment Tracking**: Check `/lats/payments` for payment data
4. **Reports**: Verify `/lats/sales-reports` shows data

### Check Browser Console
- Look for any 401, 400, or 406 errors
- Verify no authentication errors
- Check for successful API calls

## 🔧 Step 5: Monitor System Health

### Database Health Check
```sql
-- Run this in Supabase SQL Editor to check system health
SELECT 
    'Database Health Check' as check_type,
    COUNT(*) as total_sales,
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') as recent_sales,
    MAX(created_at) as latest_sale
FROM lats_sales;
```

### Application Health Check
- Check browser console for errors
- Verify all pages load correctly
- Test critical user workflows
- Monitor performance

## 🚨 Troubleshooting

### If Database Fix Fails
1. Check Supabase project permissions
2. Ensure you're using the correct database
3. Verify RLS policies are properly applied
4. Check for conflicting policies

### If Environment Issues Persist
1. Verify `.env` file is in project root
2. Check environment variable names match exactly
3. Restart your development server
4. Clear browser cache

### If Application Still Shows Errors
1. Check browser console for specific error messages
2. Verify Supabase client configuration
3. Test database connection directly
4. Check network requests in browser dev tools

## ✅ Success Indicators

After applying these fixes, you should see:
- ✅ No 401 Unauthorized errors
- ✅ No 400 Bad Request errors  
- ✅ No 406 Not Acceptable errors
- ✅ Sales operations working correctly
- ✅ Customer data loading properly
- ✅ Payment tracking functional
- ✅ Reports showing data

## 📞 Support

If you encounter issues:
1. Check the browser console for specific error messages
2. Verify your Supabase project is active and accessible
3. Ensure all environment variables are correctly set
4. Test database connection independently

## 🎯 Next Steps

Once fixes are applied and verified:
1. Monitor system performance
2. Test all critical user workflows
3. Set up proper monitoring
4. Consider implementing backup strategies
5. Document any custom configurations
