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
