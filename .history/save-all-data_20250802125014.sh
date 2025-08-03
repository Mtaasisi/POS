#!/bin/bash

# Data Save Script
# Easy commands to save all your data

echo "💾 Data Save System"
echo "==================="

case "$1" in
  "save")
    echo "🚀 Starting comprehensive data save..."
    node save-all-data.mjs save
    ;;
  "list")
    echo "📁 Listing all data backups..."
    node save-all-data.mjs list
    ;;
  "clean")
    echo "🧹 Cleaning old backups..."
    node save-all-data.mjs clean
    ;;
  *)
    echo "📋 Available commands:"
    echo "  ./save-all-data.sh save   - Save all data"
    echo "  ./save-all-data.sh list   - List all backups"
    echo "  ./save-all-data.sh clean  - Clean old backups"
    echo ""
    echo "💡 Quick save: ./save-all-data.sh save"
    ;;
esac 