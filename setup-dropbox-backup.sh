#!/bin/bash

# Dropbox Backup Setup Script
# This script helps you set up Dropbox backup for your Supabase data

echo "🔧 Setting up Dropbox Backup System..."
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
chmod +x backup-to-dropbox.mjs
echo "✅ Made Dropbox backup script executable"

# Create a simple backup command
echo "📝 Creating Dropbox backup command..."
cat > backup-dropbox.sh << 'EOF'
#!/bin/bash
echo "🔄 Running Dropbox backup..."
node backup-to-dropbox.mjs
echo "✅ Dropbox backup complete!"
EOF

chmod +x backup-dropbox.sh
echo "✅ Created backup-dropbox.sh command"

# Create a list backups command
echo "📝 Creating list command..."
cat > list-dropbox-backups.sh << 'EOF'
#!/bin/bash
echo "📋 Listing Dropbox backups..."
node backup-to-dropbox.mjs list
EOF

chmod +x list-dropbox-backups.sh
echo "✅ Created list-dropbox-backups.sh command"

# Create setup instructions
echo "📝 Creating setup instructions..."
cat > DROPBOX_SETUP.md << 'EOF'
# 🎯 Dropbox Backup Setup Guide

## 📋 **Step-by-Step Setup:**

### 1. **Create Dropbox App**
1. Go to https://www.dropbox.com/developers
2. Click "Create app"
3. Choose "Dropbox API"
4. Choose "Full Dropbox" access
5. Name your app (e.g., "Supabase Backup")

### 2. **Generate Access Token**
1. In your app settings, go to "Permissions" tab
2. Enable "files.content.write" and "files.content.read"
3. Go to "Settings" tab
4. Click "Generate" under "OAuth 2"
5. Copy the access token

### 3. **Configure Backup**
Run this command with your token:
```bash
echo "DROPBOX_ACCESS_TOKEN=your_token_here" >> backup.env
```

### 4. **Test Backup**
```bash
./backup-dropbox.sh
```

## 🚀 **Available Commands:**
- `./backup-dropbox.sh` - Run backup to Dropbox
- `./list-dropbox-backups.sh` - List Dropbox backups
- `./backup.sh` - Run local backup only

## 💡 **Benefits:**
- ✅ Free 2GB storage
- ✅ No DNS issues
- ✅ Reliable service
- ✅ Easy setup
- ✅ Automatic sync

## 🔧 **Troubleshooting:**
- If backup fails, check your access token
- Make sure your app has "Full Dropbox" permissions
- Check that backup.env file exists with your token
EOF

echo "✅ Created DROPBOX_SETUP.md"

# Create a quick setup command
echo "📝 Creating quick setup command..."
cat > setup-dropbox-token.sh << 'EOF'
#!/bin/bash
echo "🔧 Quick Dropbox Token Setup"
echo ""
echo "Enter your Dropbox access token:"
read -s token
echo ""
echo "DROPBOX_ACCESS_TOKEN=$token" >> backup.env
echo "✅ Token saved to backup.env"
echo "🔄 Test your backup: ./backup-dropbox.sh"
EOF

chmod +x setup-dropbox-token.sh
echo "✅ Created setup-dropbox-token.sh"

echo ""
echo "🎉 Dropbox Backup System Setup Complete!"
echo ""
echo "📋 Available commands:"
echo "  ./backup-dropbox.sh        - Run backup to Dropbox"
echo "  ./list-dropbox-backups.sh  - List Dropbox backups"
echo "  ./setup-dropbox-token.sh   - Quick token setup"
echo ""
echo "📖 Setup instructions: DROPBOX_SETUP.md"
echo ""
echo "🚀 Next steps:"
echo "1. Follow the setup guide in DROPBOX_SETUP.md"
echo "2. Run ./setup-dropbox-token.sh to add your token"
echo "3. Test with ./backup-dropbox.sh"
echo ""
echo "💡 Dropbox gives you 2GB free storage - perfect for backups!" 