#!/bin/bash

# Complete Supabase Database Backup Script
# This script provides multiple ways to backup your Supabase database

echo "🚀 Starting Supabase Database Backup Process"
echo "=============================================="
echo ""

# Create backup directory with timestamp
BACKUP_DIR="database_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cd "$BACKUP_DIR"

echo "📁 Created backup directory: $BACKUP_DIR"
echo ""

# Function to run Node.js backup
run_node_backup() {
    echo "🟢 Running Node.js backup script..."
    echo "-----------------------------------"
    
    # Check if Node.js is available
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js to use this backup method."
        return 1
    fi
    
    # Check if the backup script exists
    if [ ! -f "../backup-database-simple.js" ]; then
        echo "❌ backup-database-simple.js not found in parent directory."
        return 1
    fi
    
    # Run the Node.js backup script
    cd ..
    node backup-database-simple.js
    cd "$BACKUP_DIR"
    
    echo "✅ Node.js backup completed!"
    echo ""
}

# Function to run SQL backup
run_sql_backup() {
    echo "🟢 Running SQL backup script..."
    echo "--------------------------------"
    
    # Check if psql is available
    if ! command -v psql &> /dev/null; then
        echo "❌ PostgreSQL client (psql) is not installed. Please install PostgreSQL client to use this backup method."
        return 1
    fi
    
    # Check if the SQL script exists
    if [ ! -f "../export-all-data.sql" ]; then
        echo "❌ export-all-data.sql not found in parent directory."
        return 1
    fi
    
    # Get database connection details
    echo "Please provide your Supabase database connection details:"
    read -p "Database Host (e.g., db.xxxxx.supabase.co): " DB_HOST
    read -p "Database Port (default: 5432): " DB_PORT
    DB_PORT=${DB_PORT:-5432}
    read -p "Database Name (default: postgres): " DB_NAME
    DB_NAME=${DB_NAME:-postgres}
    read -p "Username (default: postgres): " DB_USER
    DB_USER=${DB_USER:-postgres}
    read -s -p "Password: " DB_PASSWORD
    echo ""
    
    # Run the SQL backup script
    cd ..
    PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f export-all-data.sql
    cd "$BACKUP_DIR"
    
    echo "✅ SQL backup completed!"
    echo ""
}

# Function to create manual backup instructions
create_manual_instructions() {
    echo "📋 Creating manual backup instructions..."
    echo "=========================================="
    
    cat > "MANUAL_BACKUP_INSTRUCTIONS.md" << 'EOF'
# Manual Database Backup Instructions

## Method 1: Using Supabase Dashboard

1. **Go to your Supabase project dashboard**
   - Visit https://supabase.com/dashboard
   - Select your project

2. **Navigate to Database section**
   - Click on "Database" in the left sidebar
   - Go to "Tables" tab

3. **Export each table individually**
   - Click on each table name
   - Click the "Export" button
   - Choose CSV or JSON format
   - Download the file

## Method 2: Using Supabase CLI

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**
   ```bash
   supabase login
   ```

3. **Link your project**
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

4. **Export database**
   ```bash
   supabase db dump --data-only > database_backup.sql
   ```

## Method 3: Using pg_dump (PostgreSQL)

1. **Get connection details from Supabase**
   - Go to Settings > Database
   - Copy the connection string

2. **Run pg_dump**
   ```bash
   pg_dump "postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres" > database_backup.sql
   ```

## Method 4: Using Node.js Script

1. **Set environment variables**
   ```bash
   export VITE_SUPABASE_URL="https://your-project.supabase.co"
   export VITE_SUPABASE_ANON_KEY="your-anon-key"
   ```

2. **Run the backup script**
   ```bash
   node backup-database-simple.js
   ```

## Tables to Backup

The following tables should be backed up:

- auth_users
- customers
- devices
- device_price_history
- device_checklists
- device_attachments
- device_remarks
- device_transitions
- device_ratings
- customer_notes
- promo_messages
- customer_payments
- finance_accounts
- sms_campaigns
- sms_triggers
- sms_trigger_logs
- sms_templates
- sms_logs
- communication_templates
- diagnostic_requests
- diagnostic_devices
- diagnostic_checks
- diagnostic_templates
- diagnostic-images
- returns
- return_remarks
- audit_logs
- points_transactions
- redemption_rewards
- redemption_transactions
- spare_parts
- spare_parts_usage
- inventory_categories
- inventory_products
- inventory_transactions
- lats_sales
- lats_sale_items
- lats_products
- lats_product_variants
- lats_receipts
- lats_stock_movements

## Verification

After backup, verify that:
1. All expected tables were exported
2. Record counts match between source and backup
3. Data integrity is maintained
4. Files are not corrupted

## Storage

Store backups in a secure location:
- Cloud storage (AWS S3, Google Cloud, etc.)
- External hard drive
- Network-attached storage (NAS)
- Multiple locations for redundancy

## Schedule

Set up regular automated backups:
- Daily for critical data
- Weekly for less critical data
- Before major updates or changes
- Before database migrations
EOF

    echo "✅ Manual instructions created: MANUAL_BACKUP_INSTRUCTIONS.md"
    echo ""
}

# Main menu
echo "Please choose a backup method:"
echo "1) Node.js Script (Recommended)"
echo "2) SQL Script (Direct PostgreSQL)"
echo "3) Manual Instructions Only"
echo "4) All Methods"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        run_node_backup
        ;;
    2)
        run_sql_backup
        ;;
    3)
        create_manual_instructions
        ;;
    4)
        run_node_backup
        run_sql_backup
        create_manual_instructions
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again and choose 1-4."
        exit 1
        ;;
esac

# Create final summary
echo "📊 Creating backup summary..."
echo "============================="

cat > "BACKUP_SUMMARY.md" << EOF
# Database Backup Summary

**Backup Date:** $(date)
**Backup Directory:** $BACKUP_DIR
**Backup Methods Used:** $choice

## Files Generated

$(ls -la)

## Next Steps

1. **Verify Backup**: Check that all expected files were created
2. **Test Restoration**: Import a few tables to verify the backup works
3. **Store Securely**: Move backup to secure location
4. **Schedule Regular Backups**: Set up automated backup schedule

## Backup Location

\`\`\`
$(pwd)
\`\`\`

## File Sizes

\`\`\`
$(du -sh *)
\`\`\`

---
*Backup completed at $(date)*
EOF

echo "✅ Backup summary created: BACKUP_SUMMARY.md"
echo ""
echo "🎉 Database backup process completed!"
echo "📁 Backup location: $(pwd)"
echo ""
echo "📋 Summary of files created:"
ls -la
echo ""
echo "💾 Total backup size:"
du -sh .
echo ""
echo "🔒 Remember to store this backup in a secure location!"
