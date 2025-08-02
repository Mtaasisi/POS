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
