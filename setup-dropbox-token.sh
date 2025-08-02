#!/bin/bash
echo "🔧 Quick Dropbox Token Setup"
echo ""
echo "Enter your Dropbox access token:"
read -s token
echo ""
echo "DROPBOX_ACCESS_TOKEN=$token" >> backup.env
echo "✅ Token saved to backup.env"
echo "🔄 Test your backup: ./backup-dropbox.sh"
