#!/bin/bash

# Automatic Backup with Cloud Sync
# This script runs local backup and automatically syncs to Dropbox

echo "🔄 Running backup with automatic cloud sync..."
echo "📁 Creating local backup..."
node backup-local-only.mjs

echo "☁️  Syncing to Dropbox..."
node backup-dropbox.sh

echo "✅ Backup complete with cloud sync!"
echo "📊 Backup saved locally and in Dropbox"
