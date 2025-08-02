#!/bin/bash

# Automatic Backup Setup Script
# This script sets up daily automatic backups of Supabase data to Hostinger

set -e

echo "🚀 Setting up automatic Supabase backup to Hostinger..."
echo ""

# Check if running on macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "🍎 Detected macOS"
    CRON_CMD="crontab"
else
    echo "🐧 Detected Linux/Unix"
    CRON_CMD="crontab"
fi

# Create backup directory
echo "📁 Creating backup directories..."
mkdir -p backups/logs
mkdir -p scripts

# Install required dependencies
echo "📦 Installing required dependencies..."
npm install --save-dev @supabase/supabase-js form-data node-fetch

# Create environment file for backup
echo "🔧 Creating backup environment file..."
cat > backup.env << EOF
# Supabase Configuration
VITE_SUPABASE_URL=https://jxhzveborezjhsmzsgbc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw

# Add your Supabase Service Role Key here (get from Supabase Dashboard > Settings > API)
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Hostinger Configuration
# Get your API token from Hostinger Control Panel > Advanced > API
HOSTINGER_API_TOKEN=your_hostinger_api_token_here
HOSTINGER_API_URL=https://api.hostinger.com/v1
HOSTINGER_STORAGE_PATH=/backups/supabase

# Backup Configuration
BACKUP_RETENTION_DAYS=30
MAX_BACKUP_SIZE_MB=100
COMPRESS_BACKUPS=true
EOF

# Create backup wrapper script
echo "📝 Creating backup wrapper script..."
cat > scripts/run-backup.sh << 'EOF'
#!/bin/bash

# Backup wrapper script
# This script runs the backup with proper environment variables

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load environment variables
if [ -f "$PROJECT_DIR/backup.env" ]; then
    export $(cat "$PROJECT_DIR/backup.env" | grep -v '^#' | xargs)
fi

# Run backup
cd "$PROJECT_DIR"
node backup-supabase-to-hostinger.mjs backup

# Log completion
echo "$(date): Backup completed" >> "$PROJECT_DIR/backups/logs/backup_cron.log"
EOF

chmod +x scripts/run-backup.sh

# Create test script
echo "🧪 Creating test script..."
cat > scripts/test-backup.sh << 'EOF'
#!/bin/bash

# Test backup functionality
# This script tests the backup configuration

set -e

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load environment variables
if [ -f "$PROJECT_DIR/backup.env" ]; then
    export $(cat "$PROJECT_DIR/backup.env" | grep -v '^#' | xargs)
fi

# Run test
cd "$PROJECT_DIR"
node backup-supabase-to-hostinger.mjs test
EOF

chmod +x scripts/test-backup.sh

# Create restore script
echo "🔄 Creating restore script..."
cat > scripts/restore-from-backup.mjs << 'EOF'
#!/usr/bin/env node

/**
 * Restore Supabase data from backup
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.join(__dirname, '..', 'backup.env');
const envContent = await fs.readFile(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  if (line && !line.startsWith('#')) {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  }
});

const supabase = createClient(
  envVars.VITE_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.VITE_SUPABASE_ANON_KEY
);

async function restoreFromBackup(backupPath) {
  try {
    console.log(`🔄 Restoring from backup: ${backupPath}`);
    
    const backupData = JSON.parse(await fs.readFile(backupPath, 'utf-8'));
    
    if (!backupData.data || !Array.isArray(backupData.data)) {
      throw new Error('Invalid backup format');
    }
    
    console.log(`📊 Found ${backupData.data.length} tables to restore`);
    
    for (const tableData of backupData.data) {
      if (tableData.error) {
        console.log(`⚠️  Skipping ${tableData.tableName} due to error: ${tableData.error}`);
        continue;
      }
      
      if (tableData.data.length === 0) {
        console.log(`📭 Skipping empty table: ${tableData.tableName}`);
        continue;
      }
      
      console.log(`🔄 Restoring ${tableData.tableName} (${tableData.data.length} records)...`);
      
      // Clear existing data
      const { error: deleteError } = await supabase
        .from(tableData.tableName)
        .delete()
        .neq('id', 0); // Delete all records
      
      if (deleteError) {
        console.log(`⚠️  Could not clear ${tableData.tableName}: ${deleteError.message}`);
      }
      
      // Insert backup data
      const { error: insertError } = await supabase
        .from(tableData.tableName)
        .insert(tableData.data);
      
      if (insertError) {
        console.error(`❌ Error restoring ${tableData.tableName}: ${insertError.message}`);
      } else {
        console.log(`✅ Restored ${tableData.tableName}`);
      }
    }
    
    console.log('✅ Restore completed successfully');
    
  } catch (error) {
    console.error('❌ Restore failed:', error);
  }
}

// Main execution
if (import.meta.url === `file://${process.argv[1]}`) {
  const backupPath = process.argv[2];
  
  if (!backupPath) {
    console.log('Usage: node restore-from-backup.mjs <backup-file-path>');
    console.log('');
    console.log('Example:');
    console.log('  node restore-from-backup.mjs backups/2025-01-15T10-30-00-000Z/complete_backup.json');
    exit(1);
  }
  
  restoreFromBackup(backupPath);
}
EOF

chmod +x scripts/restore-from-backup.mjs

# Setup cron job
echo "⏰ Setting up daily cron job..."

# Create temporary cron file
TEMP_CRON=$(mktemp)

# Get current crontab
$CRON_CMD -l 2>/dev/null > "$TEMP_CRON" || true

# Add backup job (run daily at 2 AM)
BACKUP_SCRIPT="$(pwd)/scripts/run-backup.sh"
echo "# Supabase daily backup to Hostinger" >> "$TEMP_CRON"
echo "0 2 * * * $BACKUP_SCRIPT" >> "$TEMP_CRON"

# Install new crontab
$CRON_CMD "$TEMP_CRON"

# Clean up
rm "$TEMP_CRON"

echo ""
echo "✅ Automatic backup setup completed!"
echo ""
echo "📋 Next steps:"
echo "1. Edit backup.env and add your Hostinger API token"
echo "2. Add your Supabase service role key (recommended)"
echo "3. Test the backup: ./scripts/test-backup.sh"
echo "4. Run a manual backup: ./scripts/run-backup.sh"
echo ""
echo "📅 Cron job installed: Daily at 2:00 AM"
echo "📁 Backup files will be stored in: ./backups/"
echo "📊 Logs will be stored in: ./backups/logs/"
echo ""
echo "🔧 Configuration files:"
echo "  - backup.env (environment variables)"
echo "  - scripts/run-backup.sh (backup runner)"
echo "  - scripts/test-backup.sh (test script)"
echo "  - scripts/restore-from-backup.mjs (restore script)"
echo ""
echo "⚠️  Important:"
echo "  - Get your Hostinger API token from Hostinger Control Panel"
echo "  - Get your Supabase service role key from Supabase Dashboard"
echo "  - Test the backup before relying on it"
echo "  - Monitor the logs in ./backups/logs/backup_cron.log" 