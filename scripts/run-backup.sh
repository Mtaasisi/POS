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
