#!/bin/bash

# 400 Error Fix Deployment Script
# This script helps deploy all the fixes for the 400 errors

echo "🚀 Deploying 400 Error Fixes"
echo "=============================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo "📋 Step 1: Testing current status..."
node scripts/apply-final-fix.js

echo ""
echo "📋 Step 2: Database Migration Instructions"
echo "=========================================="
echo "1. Go to your Supabase dashboard"
echo "2. Navigate to SQL Editor"
echo "3. Run the SQL commands shown above"
echo "4. Verify the migration was successful"

echo ""
echo "📋 Step 3: WhatsApp Proxy Deployment"
echo "===================================="
echo "To deploy the enhanced WhatsApp proxy:"
echo "1. Copy the enhanced proxy to replace the current one:"
echo "   cp hosting-ready/api/whatsapp-proxy-fixed-v3.php hosting-ready/api/whatsapp-proxy.php"
echo ""
echo "2. Or manually replace the content of hosting-ready/api/whatsapp-proxy.php"
echo "   with the content from hosting-ready/api/whatsapp-proxy-fixed-v3.php"

echo ""
echo "📋 Step 4: WhatsApp Credentials Setup"
echo "====================================="
echo "Configure your WhatsApp credentials in Supabase:"
echo "1. Go to Supabase dashboard > SQL Editor"
echo "2. Run the following SQL:"
echo ""
echo "INSERT INTO settings (key, value) VALUES"
echo "('whatsapp.instanceId', 'your_actual_instance_id'),"
echo "('whatsapp.apiToken', 'your_actual_api_token'),"
echo "('whatsapp.apiUrl', 'https://api.greenapi.com')"
echo "ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;"

echo ""
echo "📋 Step 5: Verification"
echo "======================="
echo "After completing the above steps, run:"
echo "node scripts/apply-final-fix.js"
echo ""
echo "This will verify that all fixes are working correctly."

echo ""
echo "🎯 Summary of Actions Required:"
echo "==============================="
echo "✅ 1. Run SQL migration in Supabase dashboard"
echo "✅ 2. Deploy enhanced WhatsApp proxy"
echo "✅ 3. Configure WhatsApp credentials"
echo "✅ 4. Test the fixes"
echo ""
echo "📞 Need help? Check the documentation in docs/400_ERROR_FIX_SUMMARY.md"
