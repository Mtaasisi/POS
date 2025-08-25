#!/bin/bash

# WhatsApp 400 Error Fix Deployment Script
# This script helps deploy the WhatsApp fix to your server

echo "🚀 ===== WHATSAPP 400 ERROR FIX DEPLOYMENT =====\n"

# Check if .env files exist
echo "📋 Checking .env files..."
if [ ! -f "hosting-ready/.env" ]; then
    echo "❌ hosting-ready/.env not found. Run the fix script first:"
    echo "   node fix-whatsapp-400-credentials-complete.cjs"
    exit 1
fi

if [ ! -f "public/.env" ]; then
    echo "❌ public/.env not found. Run the fix script first:"
    echo "   node fix-whatsapp-400-credentials-complete.cjs"
    exit 1
fi

if [ ! -f "public/api/.env" ]; then
    echo "❌ public/api/.env not found. Run the fix script first:"
    echo "   node fix-whatsapp-400-credentials-complete.cjs"
    exit 1
fi

echo "✅ All .env files found"

# Check if credentials are configured
echo "\n📋 Checking credential configuration..."
if grep -q "your_instance_id_here" hosting-ready/.env; then
    echo "⚠️  WARNING: Credentials not configured yet!"
    echo "   Please edit the .env files with your actual credentials before deploying"
    echo "   - GREENAPI_INSTANCE_ID"
    echo "   - GREENAPI_API_TOKEN"
    echo "   - VITE_SUPABASE_URL"
    echo "   - VITE_SUPABASE_ANON_KEY"
    echo "   - SUPABASE_SERVICE_ROLE_KEY"
    echo "\n   Continue anyway? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        echo "❌ Deployment cancelled"
        exit 1
    fi
else
    echo "✅ Credentials appear to be configured"
fi

# Display deployment instructions
echo "\n📤 ===== DEPLOYMENT INSTRUCTIONS =====\n"

echo "To deploy the WhatsApp fix to your server:\n"

echo "1. 📁 Upload these files to your server:"
echo "   - hosting-ready/.env → /public_html/.env"
echo "   - public/.env → /public_html/.env"
echo "   - public/api/.env → /public_html/api/.env"
echo "   - public/api/whatsapp-proxy.php → /public_html/api/whatsapp-proxy.php"

echo "\n2. 🔧 Set proper file permissions:"
echo "   chmod 644 /public_html/.env"
echo "   chmod 644 /public_html/api/.env"
echo "   chmod 644 /public_html/api/whatsapp-proxy.php"

echo "\n3. 🧪 Test the deployment:"
echo "   node test-whatsapp-400-diagnostic.js"

echo "\n📋 Deployment Methods:\n"

echo "A) Via Hostinger File Manager:"
echo "   1. Log into your Hostinger control panel"
echo "   2. Go to File Manager"
echo "   3. Navigate to public_html"
echo "   4. Upload the .env files"
echo "   5. Set permissions to 644"

echo "\nB) Via FTP:"
echo "   1. Use an FTP client (FileZilla, etc.)"
echo "   2. Connect to your server"
echo "   3. Navigate to public_html"
echo "   4. Upload the files"
echo "   5. Set permissions"

echo "\nC) Via SSH (if available):"
echo "   scp hosting-ready/.env user@your-server:/path/to/public_html/.env"
echo "   scp public/.env user@your-server:/path/to/public_html/.env"
echo "   scp public/api/.env user@your-server:/path/to/public_html/api/.env"

echo "\n⚠️  IMPORTANT REMINDERS:"
echo "   - Never commit .env files to version control"
echo "   - Keep your API credentials secure"
echo "   - Test the configuration after uploading"
echo "   - Check server logs if issues persist"

echo "\n🚀 ===== DEPLOYMENT READY =====\n"

echo "After uploading, run this command to test:"
echo "node test-whatsapp-400-diagnostic.js"
