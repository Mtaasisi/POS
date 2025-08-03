#!/bin/bash

echo "🔍 Checking Database Tables Status"
echo "================================="
echo ""

echo "📋 Instructions:"
echo "1. Go to your Supabase Dashboard: https://supabase.com/dashboard"
echo "2. Select your project: jxhzveborezjhsmzsgbc"
echo "3. Go to SQL Editor"
echo "4. Copy and paste the contents of check_current_tables.sql"
echo "5. Click 'Run' to see what tables exist"
echo ""

echo "📊 What this will show you:"
echo "==========================="
echo "✅ All existing tables in your database"
echo "✅ Which specific tables are missing (user_daily_goals, etc.)"
echo "✅ Structure of existing tables"
echo "✅ RLS policies status"
echo "✅ Triggers status"
echo ""

echo "🎯 Expected Results:"
echo "==================="
echo "• If user_daily_goals shows '❌ MISSING' - that's why you get 406 errors"
echo "• If user_goals shows '❌ MISSING' - related functionality won't work"
echo "• If tables exist but have wrong structure - we'll need to fix them"
echo ""

echo "💡 After running the check:"
echo "=========================="
echo "• If tables are missing: Run fix_missing_user_goals_tables.sql"
echo "• If tables exist but have wrong structure: We'll create a fix script"
echo "• If everything looks good: Check authentication issues"
echo ""

echo "🚀 Ready to check! Run the SQL script above." 