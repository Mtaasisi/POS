#!/bin/bash

# Export New Data Only Script
# This script exports only the new data from local database

set -e

echo "📤 Exporting new data from local database..."

# Create backup directory
mkdir -p data_exports
cd data_exports

echo "📋 Step 1: Export new tables data..."

# Export data from new tables only
echo "Exporting device_checklists..."
npx supabase db dump --table device_checklists --data-only > device_checklists_data.sql 2>/dev/null || echo "Table device_checklists not found or empty"

echo "Exporting device_remarks..."
npx supabase db dump --table device_remarks --data-only > device_remarks_data.sql 2>/dev/null || echo "Table device_remarks not found or empty"

echo "Exporting device_transitions..."
npx supabase db dump --table device_transitions --data-only > device_transitions_data.sql 2>/dev/null || echo "Table device_transitions not found or empty"

echo "Exporting device_ratings..."
npx supabase db dump --table device_ratings --data-only > device_ratings_data.sql 2>/dev/null || echo "Table device_ratings not found or empty"

echo "Exporting device_attachments..."
npx supabase db dump --table device_attachments --data-only > device_attachments_data.sql 2>/dev/null || echo "Table device_attachments not found or empty"

echo "Exporting return_remarks..."
npx supabase db dump --table return_remarks --data-only > return_remarks_data.sql 2>/dev/null || echo "Table return_remarks not found or empty"

echo "Exporting audit_logs..."
npx supabase db dump --table audit_logs --data-only > audit_logs_data.sql 2>/dev/null || echo "Table audit_logs not found or empty"

echo "Exporting points_transactions..."
npx supabase db dump --table points_transactions --data-only > points_transactions_data.sql 2>/dev/null || echo "Table points_transactions not found or empty"

echo "Exporting redemption_rewards..."
npx supabase db dump --table redemption_rewards --data-only > redemption_rewards_data.sql 2>/dev/null || echo "Table redemption_rewards not found or empty"

echo "Exporting redemption_transactions..."
npx supabase db dump --table redemption_transactions --data-only > redemption_transactions_data.sql 2>/dev/null || echo "Table redemption_transactions not found or empty"

echo "Exporting spare_parts..."
npx supabase db dump --table spare_parts --data-only > spare_parts_data.sql 2>/dev/null || echo "Table spare_parts not found or empty"

echo "Exporting spare_parts_usage..."
npx supabase db dump --table spare_parts_usage --data-only > spare_parts_usage_data.sql 2>/dev/null || echo "Table spare_parts_usage not found or empty"

echo "Exporting sms_triggers..."
npx supabase db dump --table sms_triggers --data-only > sms_triggers_data.sql 2>/dev/null || echo "Table sms_triggers not found or empty"

echo "Exporting scheduled_sms..."
npx supabase db dump --table scheduled_sms --data-only > scheduled_sms_data.sql 2>/dev/null || echo "Table scheduled_sms not found or empty"

echo "Exporting sms_trigger_logs..."
npx supabase db dump --table sms_trigger_logs --data-only > sms_trigger_logs_data.sql 2>/dev/null || echo "Table sms_trigger_logs not found or empty"

echo "Exporting communication_templates..."
npx supabase db dump --table communication_templates --data-only > communication_templates_data.sql 2>/dev/null || echo "Table communication_templates not found or empty"

echo "Exporting sms_logs..."
npx supabase db dump --table sms_logs --data-only > sms_logs_data.sql 2>/dev/null || echo "Table sms_logs not found or empty"

echo "📋 Step 2: Create combined data file..."
# Combine all data files into one
cat *_data.sql > all_new_data.sql 2>/dev/null || echo "No data files found"

echo "📋 Step 3: Clean up empty files..."
# Remove empty files
find . -name "*_data.sql" -size 0 -delete

echo ""
echo "✅ Export completed!"
echo "📁 Files created in data_exports/ directory:"
ls -la *.sql 2>/dev/null || echo "No data files created (tables might be empty)"

echo ""
echo "📋 Next steps:"
echo "1. Copy merge_new_only.sql to Supabase SQL Editor and run it"
echo "2. Copy all_new_data.sql content to Supabase SQL Editor and run it"
echo "3. Test your application"

cd .. 