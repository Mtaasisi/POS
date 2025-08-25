/**
 * Upload Fix Script
 * 
 * This script helps you upload the fixed files to resolve the auto-reply issue
 */

import fs from 'fs';
import path from 'path';

async function uploadFix() {
  console.log('🚀 ===== UPLOADING WHATSAPP AUTO-REPLY FIX =====\n');
  
  try {
    // Check if production package exists
    const productionDir = 'production-deploy';
    if (!fs.existsSync(productionDir)) {
      console.error('❌ Production package not found. Please run the build script first:');
      console.error('   node scripts/build-production-package.js');
      return;
    }

    console.log('📁 Production package found. Here are the files you need to upload:\n');

    // List all files in the package
    const files = [];
    const listFiles = (dir, prefix = '') => {
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          listFiles(fullPath, prefix + item + '/');
        } else {
          files.push({ path: prefix + item, fullPath });
        }
      });
    };
    
    listFiles(productionDir);

    console.log('📋 Files to upload:');
    files.forEach(file => {
      console.log(`   📄 ${file.path}`);
    });

    console.log('\n🚀 UPLOAD INSTRUCTIONS:');
    console.log('1. Upload these files to your Hostinger server:');
    console.log('');
    console.log('   API Files:');
    console.log('   - production-deploy/api/whatsapp-webhook.php → public_html/api/whatsapp-webhook.php');
    console.log('   - production-deploy/api/whatsapp-proxy.php → public_html/api/whatsapp-proxy.php');
    console.log('');
    console.log('   Frontend Files:');
    console.log('   - production-deploy/src/lib/whatsappSettingsApi.ts → public_html/src/lib/whatsappSettingsApi.ts');
    console.log('');
    console.log('2. Set file permissions:');
    console.log('   chmod 644 public_html/api/whatsapp-webhook.php');
    console.log('   chmod 644 public_html/api/whatsapp-proxy.php');
    console.log('   chmod 644 public_html/src/lib/whatsappSettingsApi.ts');
    console.log('');
    console.log('3. Clear browser cache and refresh the page');
    console.log('');
    console.log('4. Test the auto-reply system');

    // Create a simple upload checklist
    const checklist = `# WhatsApp Auto-Reply Upload Checklist

## 📁 Files to Upload

### API Files (Upload to: public_html/api/)
- [ ] whatsapp-webhook.php (REPLACE existing file)
- [ ] whatsapp-proxy.php (REPLACE existing file)

### Frontend Files (Upload to: public_html/src/lib/)
- [ ] whatsappSettingsApi.ts (REPLACE existing file)

## 🔧 After Upload

### Set Permissions
\`\`\`bash
chmod 644 public_html/api/whatsapp-webhook.php
chmod 644 public_html/api/whatsapp-proxy.php
chmod 644 public_html/src/lib/whatsappSettingsApi.ts
\`\`\`

### Clear Browser Cache
1. Open browser developer tools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"

## 🧪 Test After Upload

### Test 1: Check Webhook
\`\`\`bash
curl -X POST https://inauzwa.store/api/whatsapp-webhook.php \\
  -H "Content-Type: application/json" \\
  -d '{"typeWebhook":"incomingMessageReceived","body":{"idMessage":"test123","messageData":{"textMessageData":{"textMessage":"Hi"}},"senderData":{"chatId":"254700000000@c.us"}}}'
\`\`\`

Expected response should include: "autoReply": "Mambo vipi! Karibu kwenye huduma yetu. Unawezaje kusaidia?"

### Test 2: Send Real Message
Send "Hi" to your WhatsApp number and check for auto-reply.

## 📊 Monitor Logs

After uploading, these log files should be created:
- /api/webhook_log.txt
- /api/auto_reply_log.txt
- /api/message_log.txt

---
Upload Date: ${new Date().toISOString()}
`;

    fs.writeFileSync(path.join(productionDir, 'UPLOAD_CHECKLIST.md'), checklist);
    console.log('✅ UPLOAD_CHECKLIST.md created in production-deploy directory');

    console.log('\n💡 Quick Upload Method:');
    console.log('1. Use your Hostinger File Manager');
    console.log('2. Navigate to public_html/api/');
    console.log('3. Upload the new whatsapp-webhook.php (replace the old one)');
    console.log('4. Navigate to public_html/src/lib/');
    console.log('5. Upload the new whatsappSettingsApi.ts (replace the old one)');
    console.log('6. Clear browser cache and test');

    console.log('\n🔍 Current Status:');
    console.log('❌ Auto-replies not working (using old webhook)');
    console.log('✅ Webhook receiving messages (working)');
    console.log('✅ Database connection (working)');
    console.log('❌ Auto-reply logic (missing - needs new webhook)');

  } catch (error) {
    console.error('❌ Upload script failed:', error.message);
  }
}

// Run the upload script
uploadFix().then(() => {
  console.log('\n🚀 ===== UPLOAD INSTRUCTIONS READY =====');
  process.exit(0);
}).catch(error => {
  console.error('❌ Upload script failed:', error);
  process.exit(1);
});
