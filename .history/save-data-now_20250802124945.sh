#!/bin/bash

echo "💾 Saving All Data Now..."
echo "=========================="

# Run the complete backup
node backup-complete.mjs

echo ""
echo "✅ Data Save Complete!"
echo "📁 Check ./backups/ for your saved data"
echo "☁️  Data also saved to Dropbox cloud storage" 