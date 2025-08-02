# 🔄 Automatic Supabase Backup to Hostinger

This system provides automatic daily backups of your Supabase database to Hostinger storage.

## 🚀 Quick Setup

### 1. Run Setup Script
```bash
chmod +x setup-automatic-backup.sh
./setup-automatic-backup.sh
```

### 2. Configure Environment Variables
Edit `backup.env`:
```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://jxhzveborezjhsmzsgbc.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Hostinger Configuration
HOSTINGER_API_TOKEN=your_hostinger_api_token_here
HOSTINGER_STORAGE_PATH=/backups/supabase

# Backup Configuration
BACKUP_RETENTION_DAYS=30
```

### 3. Get API Keys
- **Supabase Service Role Key**: Supabase Dashboard → Settings → API
- **Hostinger API Token**: Hostinger Control Panel → Advanced → API

### 4. Test Setup
```bash
./scripts/test-backup.sh
./scripts/run-backup.sh
```

## 📁 File Structure
```
├── backup-supabase-to-hostinger.mjs    # Main backup script
├── setup-automatic-backup.sh           # Setup script
├── backup.env                          # Environment variables
├── scripts/
│   ├── run-backup.sh                  # Backup runner
│   ├── test-backup.sh                 # Test script
│   └── restore-from-backup.mjs        # Restore script
└── backups/
    ├── logs/                          # Backup logs
    └── [timestamp]/                   # Backup files
```

## 🔧 Manual Commands

### Run Backup
```bash
node backup-supabase-to-hostinger.mjs backup
```

### Test Configuration
```bash
node backup-supabase-to-hostinger.mjs test
```

### Restore from Backup
```bash
node scripts/restore-from-backup.mjs backups/2025-01-15T10-30-00-000Z/complete_backup.json
```

## ⏰ Automatic Schedule
Cron job runs daily at 2:00 AM:
```bash
0 2 * * * /path/to/project/scripts/run-backup.sh
```

## 📊 Backup Contents
- Complete backup file: `complete_backup.json`
- Backup summary: `backup_summary.json`
- Individual table files: `tables/[table_name].json`
- Backup logs: Detailed process logs

## 🔄 Restore Process
```bash
node scripts/restore-from-backup.mjs backups/[timestamp]/complete_backup.json
```

## 🛠️ Troubleshooting

### Common Issues
1. **Permission Denied**: `chmod +x scripts/*.sh`
2. **Missing Dependencies**: `npm install @supabase/supabase-js form-data node-fetch`
3. **API Token Issues**: Verify Hostinger API token and permissions
4. **Supabase Connection**: Check URL and service role key

### Debug Mode
```bash
DEBUG=* node backup-supabase-to-hostinger.mjs backup
```

## 📈 Monitoring
- **Cron logs**: `backups/logs/backup_cron.log`
- **Backup logs**: `backups/logs/backup_log.json`
- **Web interface**: Add BackupMonitoringDashboard component

## 🔒 Security
- Never commit API keys to version control
- Use service role key only when necessary
- Encrypt sensitive backup files
- Monitor API usage and limits

## 📋 Maintenance
- **Weekly**: Check backup logs for errors
- **Monthly**: Verify backup integrity
- **Quarterly**: Test restore process
- **Annually**: Review and update API keys

## 🆘 Emergency Restore
```bash
LATEST_BACKUP=$(ls -t backups/ | grep "2025-" | head -1)
node scripts/restore-from-backup.mjs "backups/$LATEST_BACKUP/complete_backup.json"
```

---

**⚠️ Important**: Always test your backup and restore procedures before relying on them in production! 