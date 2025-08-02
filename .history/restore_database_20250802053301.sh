#!/bin/bash

# Database Restore Script - Online Supabase Only
# This script provides instructions for restoring data to online Supabase

set -e

echo "🔍 Checking environment variables..."
if [ -z "$VITE_SUPABASE_URL" ] || [ -z "$VITE_SUPABASE_ANON_KEY" ]; then
    echo "❌ Error: Supabase environment variables not found"
    echo "Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
    exit 1
fi

# Extract database URL from Supabase URL
DB_HOST=$(echo $VITE_SUPABASE_URL | sed 's|https://||' | sed 's|\.supabase\.co.*||')
DB_NAME="postgres"
DB_USER="postgres"

echo "📊 Database Host: $DB_HOST"
echo "🗄️  Database Name: $DB_NAME"
echo "👤 Database User: $DB_USER"

echo "📋 Database Restore Options:"
echo ""
echo "1. Using Supabase Dashboard (Recommended):"
echo "   - Go to https://supabase.com/dashboard"
echo "   - Select your project: jxhzveborezjhsmzsgbc"
echo "   - Go to SQL Editor"
echo "   - Copy and paste your SQL restore script"
echo "   - Click Run"
echo ""
echo "2. Using Supabase CLI (if you have access):"
echo "   supabase db push --project-ref jxhzveborezjhsmzsgbc"
echo ""
echo "3. Using direct database connection:"
echo "   - Get your database password from Supabase dashboard"
echo "   - Run: psql -h $DB_HOST -U $DB_USER -d $DB_NAME -f your_restore_script.sql"
echo ""

echo "🚀 Recommended approach:"
echo "========================"
echo "Since we're using online Supabase, I recommend using option 1:"
echo ""
echo "1. Open Supabase Dashboard: https://supabase.com/dashboard"
echo ""
echo "2. Select your project: jxhzveborezjhsmzsgbc"
echo ""
echo "3. Go to the SQL Editor tab"
echo ""
echo "4. Copy your restore SQL script and paste it into the editor"
echo ""
echo "5. Click 'Run' to execute the script"
echo ""

echo "💡 Note: This application now uses online Supabase only."
echo "   Local Supabase has been removed from the configuration."
echo "   Backup files should be uploaded to the online Supabase dashboard." 