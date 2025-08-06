
import fs from 'fs';
import path from 'path';

console.log('🔧 Restoring original service worker...');

const swPath = path.join(process.cwd(), 'public', 'sw.js');
const swBackupPath = path.join(process.cwd(), 'public', 'sw.js.backup');

try {
  if (fs.existsSync(swBackupPath)) {
    fs.copyFileSync(swBackupPath, swPath);
    fs.unlinkSync(swBackupPath);
    console.log('✅ Service worker restored');
  } else {
    console.log('ℹ️ No backup found to restore');
  }
} catch (error) {
  console.log('❌ Error:', error.message);
}
