#!/bin/bash
echo "🕐 Setting up automatic daily backup..."

# Get current directory
CURRENT_DIR=$(pwd)

# Create cron job for daily backup at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * cd $CURRENT_DIR && ./backup.sh >> backup.log 2>&1") | crontab -

echo "✅ Automatic backup scheduled for 2 AM daily"
echo "📝 Backup logs will be saved to backup.log"
echo "🔄 To run backup now: ./backup.sh"
echo "📋 To list backups: ./list-backups.sh"
