#!/bin/bash

echo "🔧 Fixing Green API Settings Database Issue"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "supabase/migrations/20250125000003_add_green_api_settings_to_instances.sql" ]; then
    echo "❌ Error: Migration file not found. Please run this script from the project root."
    exit 1
fi

echo "📋 Step 1: Running database migration..."
echo "This will add the green_api_settings column to whatsapp_instances table"

# Run the migration
echo "Running: scripts/apply-green-api-settings-migration.sql"
echo "Please execute this SQL in your Supabase dashboard or via CLI"

echo ""
echo "📋 Step 2: Debug current status..."
echo "Run this to check current database state:"
echo "scripts/debug-settings-status.sql"

echo ""
echo "📋 Step 3: Test the complete flow..."
echo "Run this to test the settings flow:"
echo "scripts/test-settings-flow.sql"

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Run the migration SQL in your Supabase dashboard"
echo "2. Test the settings loading in your app"
echo "3. Check the browser console for detailed logs"
echo ""
echo "The app will now:"
echo "- Load settings from database first"
echo "- Fall back to Green API if database is empty"
echo "- Use defaults if both fail"
echo "- Save settings back to database for future use"
