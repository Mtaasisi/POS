#!/bin/bash

# Apply Enhanced Supabase Client Configuration
# This script replaces the current Supabase client with the enhanced version

echo "🔧 Applying Enhanced Supabase Client Configuration..."

# Backup the current client
echo "📦 Creating backup of current Supabase client..."
cp src/lib/supabaseClient.ts src/lib/supabaseClient.ts.backup

# Replace with enhanced version
echo "🔄 Replacing with enhanced Supabase client..."
cp src/lib/supabaseClient-enhanced.ts src/lib/supabaseClient.ts

echo "✅ Enhanced Supabase client applied successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Clear your browser cache (Ctrl+Shift+R or Cmd+Shift+R)"
echo "2. Restart your development server"
echo "3. Test your application for 400/406 errors"
echo ""
echo "🔍 The enhanced client includes:"
echo "- Enhanced headers for all requests"
echo "- Better error handling and retry mechanisms"
echo "- Improved query interception"
echo "- Comprehensive logging"
echo ""
echo "If you need to revert, run:"
echo "cp src/lib/supabaseClient.ts.backup src/lib/supabaseClient.ts"
