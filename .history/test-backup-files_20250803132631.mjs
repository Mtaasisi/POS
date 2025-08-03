import fs from 'fs';
import path from 'path';

/**
 * Read backup files from the filesystem
 */
const readBackupFilesFromFS = () => {
  try {
    const backupsDir = path.join(process.cwd(), 'backups');
    console.log('📁 Checking backups directory:', backupsDir);
    
    if (!fs.existsSync(backupsDir)) {
      console.log('❌ Backups directory does not exist');
      return [];
    }

    const allFiles = fs.readdirSync(backupsDir);
    console.log('📋 All files in backups directory:', allFiles);

    const backupFiles = allFiles
      .filter(file => file.endsWith('.json') && file.startsWith('backup-'))
      .map(file => {
        const filePath = path.join(backupsDir, file);
        const stats = fs.statSync(filePath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        
        // Extract timestamp from filename
        const timestampMatch = file.match(/backup-(\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}-\d{3}Z)\.json/);
        let timestamp;
        if (timestampMatch) {
          const isoString = timestampMatch[1].replace(/T/, ' ').replace(/-\d{3}Z/, '');
          // Convert 2025-08-02 08:08:33 to 2025:08:02 08:08:33
          timestamp = isoString.replace(/(\d{4})-(\d{2})-(\d{2})/, '$1:$2:$3').replace(/(\d{2})-(\d{2})-(\d{2})/, '$1:$2:$3');
        } else {
          timestamp = new Date(stats.mtime).toISOString().replace('T', ' ').substring(0, 19);
        }

        return {
          name: file,
          size: `${sizeMB} MB`,
          timestamp,
          records: 1240,
          location: 'Local',
          path: filePath
        };
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return backupFiles;
  } catch (error) {
    console.error('❌ Error reading backup files:', error);
    return [];
  }
};

// Test the function
console.log('🔍 Testing backup file reading...\n');

const backupFiles = readBackupFilesFromFS();

console.log(`✅ Found ${backupFiles.length} backup files:\n`);

backupFiles.forEach((file, index) => {
  console.log(`${index + 1}. ${file.name}`);
  console.log(`   📅 Timestamp: ${file.timestamp}`);
  console.log(`   📏 Size: ${file.size}`);
  console.log(`   📍 Location: ${file.location}`);
  console.log(`   📊 Records: ${file.records}`);
  console.log('');
});

if (backupFiles.length > 0) {
  const latest = backupFiles[0];
  console.log(`🎯 Latest backup: ${latest.name} (${latest.timestamp})`);
} else {
  console.log('❌ No backup files found');
} 