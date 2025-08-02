# 🔄 Automatic Supabase Backup to Hostinger

This system provides automatic daily backups of your Supabase database to Hostinger storage with monitoring and management capabilities.

## 🚀 Quick Setup

### 1. Run the Setup Script

```bash
chmod +x setup-automatic-backup.sh
./setup-automatic-backup.sh
```

### 2. Configure Environment Variables

Edit the `backup.env` file created by the setup script:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://jxhzveborezjhsmzsgbc.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Add your Supabase Service Role Key (recommended for full access)
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Hostinger Configuration
HOSTINGER_API_TOKEN=your_hostinger_api_token_here
HOSTINGER_API_URL=https://api.hostinger.com/v1
HOSTINGER_STORAGE_PATH=/backups/supabase

# Backup Configuration
BACKUP_RETENTION_DAYS=30
MAX_BACKUP_SIZE_MB=100
COMPRESS_BACKUPS=true
```

### 3. Get Required API Keys

#### Supabase Service Role Key
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `jxhzveborezjhsmzsgbc`
3. Go to Settings → API
4. Copy the "service_role" key (starts with `eyJ...`)

#### Hostinger API Token
1. Log into [Hostinger Control Panel](https://hpanel.hostinger.com)
2. Go to Advanced → API
3. Generate a new API token
4. Copy the token

### 4. Test the Setup

```bash
# Test backup functionality
./scripts/test-backup.sh

# Run a manual backup
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
├── backups/
│   ├── logs/                          # Backup logs
│   └── [timestamp]/                   # Backup files
└── src/components/
    └── BackupMonitoringDashboard.tsx  # Web monitoring interface
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

## 📊 Backup Contents

Each backup includes:

- **Complete backup file**: `complete_backup.json` - All data in one file
- **Backup summary**: `backup_summary.json` - Statistics and metadata
- **Individual table files**: `tables/[table_name].json` - Separate files for each table
- **Backup logs**: Detailed logs of the backup process

### Backup Summary Example
```json
{
  "timestamp": "2025-01-15T10-30-00-000Z",
  "totalTables": 17,
  "tablesWithData": 7,
  "totalRecords": 170,
  "tableDetails": {
    "customers": 14,
    "devices": 51,
    "customer_payments": 3,
    "device_remarks": 6,
    "device_transitions": 83,
    "customer_notes": 5,
    "auth_users": 8
  },
  "errors": []
}
```

## ⏰ Automatic Schedule

The system creates a cron job that runs daily at 2:00 AM:

```bash
0 2 * * * /path/to/your/project/scripts/run-backup.sh
```

### View Cron Jobs
```bash
crontab -l
```

### Edit Cron Jobs
```bash
crontab -e
```

## 📈 Monitoring

### Web Interface
Add the `BackupMonitoringDashboard` component to your React app:

```tsx
import { BackupMonitoringDashboard } from './components/BackupMonitoringDashboard';

// In your page component
<BackupMonitoringDashboard />
```

### Log Files
- **Cron logs**: `backups/logs/backup_cron.log`
- **Backup logs**: `backups/logs/backup_log.json`
- **Web interface logs**: Browser localStorage

### Check Backup Status
```bash
# View recent logs
tail -f backups/logs/backup_cron.log

# Check backup files
ls -la backups/

# View backup summary
cat backups/[timestamp]/backup_summary.json
```

## 🔄 Restore Process

### From Complete Backup
```bash
node scripts/restore-from-backup.mjs backups/2025-01-15T10-30-00-000Z/complete_backup.json
```

### From Individual Table
```bash
# Restore specific table
node -e "
const fs = require('fs');
const data = JSON.parse(fs.readFileSync('backups/2025-01-15T10-30-00-000Z/tables/customers.json'));
console.log('Table data:', data);
"
```

## 🛠️ Troubleshooting

### Common Issues

#### 1. Permission Denied
```bash
chmod +x scripts/*.sh
chmod +x backup-supabase-to-hostinger.mjs
```

#### 2. Missing Dependencies
```bash
npm install @supabase/supabase-js form-data node-fetch
```

#### 3. API Token Issues
- Verify Hostinger API token is correct
- Check API token permissions
- Ensure token hasn't expired

#### 4. Supabase Connection Issues
- Verify Supabase URL and keys
- Check if service role key is needed
- Ensure RLS policies allow backup access

#### 5. Storage Space
```bash
# Check available space
df -h

# Clean old backups
find backups/ -type d -name "2025-*" -mtime +30 -exec rm -rf {} \;
```

### Debug Mode
```bash
# Enable debug logging
DEBUG=* node backup-supabase-to-hostinger.mjs backup
```

## 🔒 Security Considerations

### Environment Variables
- Never commit API keys to version control
- Use `.env` files for local development
- Use secure environment variables in production

### API Keys
- Rotate API keys regularly
- Use service role key only when necessary
- Monitor API usage and limits

### Backup Storage
- Encrypt sensitive backup files
- Use secure storage locations
- Implement access controls

## 📋 Maintenance

### Regular Tasks
1. **Weekly**: Check backup logs for errors
2. **Monthly**: Verify backup integrity
3. **Quarterly**: Test restore process
4. **Annually**: Review and update API keys

### Cleanup
```bash
# Remove backups older than 30 days
find backups/ -type d -name "2025-*" -mtime +30 -exec rm -rf {} \;

# Clean log files
find backups/logs/ -name "*.log" -mtime +90 -delete
```

## 🆘 Support

### Getting Help
1. Check the logs in `backups/logs/`
2. Test with `./scripts/test-backup.sh`
3. Verify environment variables
4. Check API key permissions

### Emergency Restore
```bash
# Quick restore from latest backup
LATEST_BACKUP=$(ls -t backups/ | grep "2025-" | head -1)
node scripts/restore-from-backup.mjs "backups/$LATEST_BACKUP/complete_backup.json"
```

## 📚 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Hostinger API Documentation](https://developers.hostinger.com/)
- [Cron Job Tutorial](https://crontab.guru/)
- [Node.js File System](https://nodejs.org/api/fs.html)

---

**⚠️ Important**: Always test your backup and restore procedures before relying on them in production! 