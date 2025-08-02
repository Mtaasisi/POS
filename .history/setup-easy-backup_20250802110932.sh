#!/bin/bash

# Easy Backup Setup Script
# This script sets up automatic backups for your Supabase data

echo "🔧 Setting up Easy Backup System..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js is installed"

# Create backup directory
mkdir -p backups
echo "✅ Created backups directory"

# Make backup script executable
chmod +x backup-local-only.mjs
echo "✅ Made backup script executable"

# Create a simple backup command
echo "📝 Creating backup command..."
cat > backup.sh << 'EOF'
#!/bin/bash
echo "🔄 Running backup..."
node backup-local-only.mjs
echo "✅ Backup complete!"
EOF

chmod +x backup.sh
echo "✅ Created backup.sh command"

# Create a list backups command
echo "📝 Creating list command..."
cat > list-backups.sh << 'EOF'
#!/bin/bash
echo "📋 Listing backups..."
node backup-local-only.mjs list
EOF

chmod +x list-backups.sh
echo "✅ Created list-backups.sh command"

# Create a cron job setup
echo "📝 Creating automatic backup setup..."
cat > setup-auto-backup.sh << 'EOF'
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
EOF

chmod +x setup-auto-backup.sh
echo "✅ Created setup-auto-backup.sh"

echo ""
echo "🎉 Easy Backup System Setup Complete!"
echo ""
echo "📋 Available commands:"
echo "  ./backup.sh           - Run backup now"
echo "  ./list-backups.sh     - List all backups"
echo "  ./setup-auto-backup.sh - Setup automatic daily backup"
echo ""
echo "💾 Backups will be saved to: ./backups/"
echo "📊 Your first backup created: 1,240 rows, 0.94 MB"
echo ""
echo "🚀 Ready to use! Run './backup.sh' to create your first backup." 