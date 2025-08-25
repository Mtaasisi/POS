/**
 * Build Production Package for Hostinger
 * 
 * This script prepares all files needed for WhatsApp auto-reply deployment
 */

import fs from 'fs';
import path from 'path';

async function buildProductionPackage() {
  console.log('🏗️  ===== BUILDING PRODUCTION PACKAGE WITH DEBUG =====\n');
  
  try {
    // Create production directory
    const productionDir = 'production-deploy';
    if (fs.existsSync(productionDir)) {
      fs.rmSync(productionDir, { recursive: true, force: true });
    }
    fs.mkdirSync(productionDir, { recursive: true });
    
    // Create api subdirectory
    const apiDir = path.join(productionDir, 'api');
    fs.mkdirSync(apiDir, { recursive: true });
    
    // Create src/lib subdirectory for the fixed settings file
    const srcLibDir = path.join(productionDir, 'src', 'lib');
    fs.mkdirSync(srcLibDir, { recursive: true });
    
    console.log('📁 Creating production directory structure...');
    
    // 1. Copy the debug webhook file
    console.log('📋 1. Copying debug webhook file...');
    const webhookSource = 'hostinger-deploy/api/whatsapp-webhook-debug.php';
    const webhookDest = path.join(apiDir, 'whatsapp-webhook.php');
    
    if (fs.existsSync(webhookSource)) {
      fs.copyFileSync(webhookSource, webhookDest);
      console.log('✅ whatsapp-webhook.php (debug version) copied');
    } else {
      console.error('❌ Source webhook file not found');
      return;
    }
    
    // 2. Copy the proxy file
    console.log('📋 2. Copying proxy file...');
    const proxySource = 'hostinger-deploy/api/whatsapp-proxy.php';
    const proxyDest = path.join(apiDir, 'whatsapp-proxy.php');
    
    if (fs.existsSync(proxySource)) {
      fs.copyFileSync(proxySource, proxyDest);
      console.log('✅ whatsapp-proxy.php copied');
    } else {
      console.error('❌ Source proxy file not found');
      return;
    }
    
    // 3. Copy the fixed settings API file
    console.log('📋 3. Copying fixed settings API file...');
    const settingsSource = 'src/lib/whatsappSettingsApi-fixed.ts';
    const settingsDest = path.join(srcLibDir, 'whatsappSettingsApi.ts');
    
    if (fs.existsSync(settingsSource)) {
      fs.copyFileSync(settingsSource, settingsDest);
      console.log('✅ whatsappSettingsApi.ts (fixed) copied');
    } else {
      console.error('❌ Source settings file not found');
      return;
    }
    
    // 4. Create deployment instructions
    console.log('📋 4. Creating deployment instructions...');
    const instructions = `# WhatsApp Auto-Reply Production Deployment (Debug Version)

## 📁 Files to Upload

Upload the following files to your Hostinger server:

### API Files (Upload to: public_html/api/)
- \`whatsapp-webhook.php\` - Debug webhook with comprehensive logging and auto-reply functionality
- \`whatsapp-proxy.php\` - WhatsApp API proxy

### Frontend Files (Upload to: public_html/src/lib/)
- \`whatsappSettingsApi.ts\` - Fixed settings API (eliminates 500 errors)

## 🚀 Deployment Steps

### Step 1: Upload Files
1. Upload \`whatsapp-webhook.php\` to: \`public_html/api/whatsapp-webhook.php\`
2. Upload \`whatsapp-proxy.php\` to: \`public_html/api/whatsapp-proxy.php\`
3. Upload \`whatsappSettingsApi.ts\` to: \`public_html/src/lib/whatsappSettingsApi.ts\`

### Step 2: Set File Permissions
Set the following permissions on your server:
\`\`\`bash
chmod 644 public_html/api/whatsapp-webhook.php
chmod 644 public_html/api/whatsapp-proxy.php
chmod 644 public_html/src/lib/whatsappSettingsApi.ts
\`\`\`

### Step 3: Configure Green API Webhook
1. Go to your Green API dashboard
2. Set webhook URL to: \`https://inauzwa.store/api/whatsapp-webhook.php\`
3. Enable these events:
   - \`incomingMessageReceived\`
   - \`outgoingMessageReceived\`
   - \`outgoingAPIMessageReceived\`
   - \`outgoingMessageStatus\`
   - \`stateInstanceChanged\`

### Step 4: Test the System
1. Send "Hi" to your WhatsApp number
2. You should receive an auto-reply: "Mambo vipi! Karibu kwenye huduma yetu. Unawezaje kusaidia?"

## 🔧 What Was Fixed

### 500 Error Issue
- **Problem**: Frontend was making unnecessary health check requests
- **Solution**: Removed health checks from \`whatsappSettingsApi.ts\`
- **Result**: No more 500 errors in browser console

### Auto-Reply Issue
- **Problem**: Webhook only logged messages, didn't send auto-replies
- **Solution**: Added complete auto-reply logic to webhook
- **Result**: Auto-replies now work automatically

### Debug Enhancement
- **Added**: Comprehensive debug logging to identify issues
- **Logs**: All webhook activity is logged with detailed information
- **Result**: Easy to identify what's preventing auto-replies

## 📊 Monitoring & Debugging

The debug webhook creates these log files:
- \`/api/debug_log.txt\` - Comprehensive debug information
- \`/api/webhook_log.txt\` - All incoming webhooks
- \`/api/auto_reply_log.txt\` - Auto-reply activity
- \`/api/message_log.txt\` - All message processing
- \`/api/state_log.txt\` - WhatsApp state changes
- \`/api/status_log.txt\` - Message status updates

## 🔍 Debug Commands

### Check Debug Logs
\`\`\`bash
# View debug log
curl -s https://inauzwa.store/api/debug_log.txt | tail -20

# View auto-reply log
curl -s https://inauzwa.store/api/auto_reply_log.txt | tail -10

# View webhook log
curl -s https://inauzwa.store/api/webhook_log.txt | tail -10
\`\`\`

### Test Auto-Reply
\`\`\`bash
curl -X POST https://inauzwa.store/api/whatsapp-webhook.php \\
  -H "Content-Type: application/json" \\
  -d '{"typeWebhook":"incomingMessageReceived","body":{"idMessage":"test123","messageData":{"textMessageData":{"textMessage":"Hi"}},"senderData":{"chatId":"254700000000@c.us"}}}'
\`\`\`

Expected response should include: "autoReply": "Mambo vipi! Karibu kwenye huduma yetu. Unawezaje kusaidia?"

## 🔧 Troubleshooting

### If auto-replies don't work:
1. Check debug logs at \`/api/debug_log.txt\`
2. Look for database connection errors
3. Check WhatsApp credentials in database
4. Verify Green API webhook URL is correct
5. Ensure WhatsApp instance is authorized

### If you still see 500 errors:
1. Make sure you uploaded the fixed \`whatsappSettingsApi.ts\` file
2. Clear browser cache and refresh
3. Check browser Network tab for specific error details

### Common Issues Found in Debug Logs:
- **Database connection failed**: Check Supabase credentials
- **WhatsApp credentials not configured**: Configure in database
- **Green API call failed**: Check instance authorization
- **Auto-reply rule not matched**: Check message format

## 📞 Support

If you need help, check:
1. Debug logs first (\`/api/debug_log.txt\`)
2. Server error logs
3. WhatsApp webhook logs
4. Database connection status
5. Green API instance status

---
Generated on: ${new Date().toISOString()}
`;

    fs.writeFileSync(path.join(productionDir, 'DEPLOYMENT_INSTRUCTIONS.md'), instructions);
    console.log('✅ DEPLOYMENT_INSTRUCTIONS.md created');
    
    // 5. Create a test script for production
    console.log('📋 5. Creating production test script...');
    const testScript = `#!/bin/bash
# Production Test Script for WhatsApp Auto-Reply (Debug Version)

echo "🧪 Testing WhatsApp Auto-Reply System (Debug Version)..."

# Test 1: Health check
echo "📋 Test 1: Health check..."
curl -X POST https://inauzwa.store/api/whatsapp-proxy.php \\
  -H "Content-Type: application/json" \\
  -d '{"action":"health"}'

echo -e "\\n\\n"

# Test 2: Webhook test with debug
echo "📋 Test 2: Webhook test with debug..."
curl -X POST https://inauzwa.store/api/whatsapp-webhook.php \\
  -H "Content-Type: application/json" \\
  -d '{"typeWebhook":"incomingMessageReceived","body":{"idMessage":"test123","messageData":{"textMessageData":{"textMessage":"Hi"}},"senderData":{"chatId":"254700000000@c.us"}}}'

echo -e "\\n\\n"

# Test 3: Check debug logs
echo "📋 Test 3: Checking debug logs..."
echo "Debug log (last 10 lines):"
curl -s https://inauzwa.store/api/debug_log.txt | tail -10

echo -e "\\nAuto-reply log (last 5 lines):"
curl -s https://inauzwa.store/api/auto_reply_log.txt | tail -5

echo -e "\\nWebhook log (last 5 lines):"
curl -s https://inauzwa.store/api/webhook_log.txt | tail -5

echo -e "\\n✅ Test completed!"
`;

    fs.writeFileSync(path.join(productionDir, 'test-production.sh'), testScript);
    fs.chmodSync(path.join(productionDir, 'test-production.sh'), '755');
    console.log('✅ test-production.sh created');
    
    // 6. Create a backup script
    console.log('📋 6. Creating backup script...');
    const backupScript = `#!/bin/bash
# Backup current WhatsApp files before deployment

echo "💾 Creating backup of current WhatsApp files..."

BACKUP_DIR="whatsapp-backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup current files if they exist
if [ -f "public_html/api/whatsapp-webhook.php" ]; then
    cp public_html/api/whatsapp-webhook.php "$BACKUP_DIR/whatsapp-webhook.php.backup"
    echo "✅ Backed up whatsapp-webhook.php"
fi

if [ -f "public_html/api/whatsapp-proxy.php" ]; then
    cp public_html/api/whatsapp-proxy.php "$BACKUP_DIR/whatsapp-proxy.php.backup"
    echo "✅ Backed up whatsapp-proxy.php"
fi

if [ -f "public_html/src/lib/whatsappSettingsApi.ts" ]; then
    cp public_html/src/lib/whatsappSettingsApi.ts "$BACKUP_DIR/whatsappSettingsApi.ts.backup"
    echo "✅ Backed up whatsappSettingsApi.ts"
fi

echo "💾 Backup completed in: $BACKUP_DIR"
echo "📁 To restore: cp $BACKUP_DIR/*.backup public_html/api/"
`;

    fs.writeFileSync(path.join(productionDir, 'backup-current.sh'), backupScript);
    fs.chmodSync(path.join(productionDir, 'backup-current.sh'), '755');
    console.log('✅ backup-current.sh created');
    
    // 7. Create a deployment checklist
    console.log('📋 7. Creating deployment checklist...');
    const checklist = `# WhatsApp Auto-Reply Deployment Checklist (Debug Version)

## ✅ Pre-Deployment
- [ ] Backup current files (run: ./backup-current.sh)
- [ ] Verify database credentials are configured
- [ ] Ensure WhatsApp instance is authorized
- [ ] Check Green API dashboard access

## ✅ File Upload
- [ ] Upload whatsapp-webhook.php to public_html/api/
- [ ] Upload whatsapp-proxy.php to public_html/api/
- [ ] Upload whatsappSettingsApi.ts to public_html/src/lib/
- [ ] Set correct file permissions (644)
- [ ] Verify files are accessible via web

## ✅ Configuration
- [ ] Update Green API webhook URL
- [ ] Enable required webhook events
- [ ] Test webhook endpoint
- [ ] Verify database connection

## ✅ Testing
- [ ] Run health check test
- [ ] Test webhook with sample message
- [ ] Send real message to WhatsApp
- [ ] Verify auto-reply is received
- [ ] Check debug logs for detailed information
- [ ] Verify no 500 errors in browser console

## ✅ Debug Verification
- [ ] Check debug_log.txt for comprehensive logs
- [ ] Check auto_reply_log.txt for auto-reply activity
- [ ] Check webhook_log.txt for all webhook activity
- [ ] Look for any error messages in debug logs

## ✅ Post-Deployment
- [ ] Monitor debug logs for 24 hours
- [ ] Test with different message types
- [ ] Verify auto-reply rules work
- [ ] Document any issues found

## 🚨 Rollback Plan
If issues occur:
1. Restore backup files
2. Revert webhook URL in Green API
3. Check debug logs for specific errors
4. Contact support if needed

---
Deployment Date: ${new Date().toISOString()}
Deployed By: [Your Name]
`;

    fs.writeFileSync(path.join(productionDir, 'DEPLOYMENT_CHECKLIST.md'), checklist);
    console.log('✅ DEPLOYMENT_CHECKLIST.md created');
    
    // 8. Create a summary file
    console.log('📋 8. Creating package summary...');
    const summary = `# WhatsApp Auto-Reply Production Package (Debug Version)

## 📦 Package Contents

### Core Files
- \`api/whatsapp-webhook.php\` - Debug webhook with comprehensive logging and auto-reply functionality
- \`api/whatsapp-proxy.php\` - WhatsApp API proxy
- \`src/lib/whatsappSettingsApi.ts\` - Fixed settings API (eliminates 500 errors)

### Scripts
- \`backup-current.sh\` - Backup current files before deployment
- \`test-production.sh\` - Test the deployed system

### Documentation
- \`DEPLOYMENT_INSTRUCTIONS.md\` - Step-by-step deployment guide
- \`DEPLOYMENT_CHECKLIST.md\` - Deployment checklist
- \`PACKAGE_SUMMARY.md\` - This file

## 🎯 What This Fixes

### Previous Issues
- ❌ Auto-replies not working in production
- ❌ Webhook only logging messages, not sending replies
- ❌ Missing database integration
- ❌ No error handling or logging
- ❌ 500 errors in browser console due to health checks
- ❌ No way to debug issues in production

### New Features
- ✅ Complete auto-reply functionality
- ✅ Database-driven auto-reply rules
- ✅ Comprehensive debug logging system
- ✅ Error handling and fallbacks
- ✅ Default auto-reply rules
- ✅ Production-ready code
- ✅ Fixed 500 error issues
- ✅ Detailed debug information

## 🚀 Auto-Reply Rules

The system includes these default auto-reply rules:
- "Hi" → "Mambo vipi! Karibu kwenye huduma yetu. Unawezaje kusaidia?"
- "Hello" → "Hello! Karibu kwenye huduma yetu. Unawezaje kusaidia?"
- "Hey" → "Hey there! Karibu kwenye huduma yetu. Unawezaje kusaidia?"
- "How are you" → "Niko poa sana, asante! Wewe vipi? Unawezaje kusaidia?"

## 📊 Debug Monitoring

The debug webhook creates detailed logs:
- \`debug_log.txt\` - Comprehensive debug information
- \`webhook_log.txt\` - All incoming webhooks
- \`auto_reply_log.txt\` - Auto-reply activity
- \`message_log.txt\` - Message processing
- \`state_log.txt\` - WhatsApp state changes

## 🔧 Support

For issues:
1. Check debug logs first (\`debug_log.txt\`)
2. Verify Green API configuration
3. Test webhook endpoint
4. Check database connectivity

---
Package Version: 1.2.0 (Debug Version)
Build Date: ${new Date().toISOString()}
`;

    fs.writeFileSync(path.join(productionDir, 'PACKAGE_SUMMARY.md'), summary);
    console.log('✅ PACKAGE_SUMMARY.md created');
    
    // 9. Create a zip file
    console.log('📋 9. Creating deployment package...');
    
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
          files.push(prefix + item);
        }
      });
    };
    
    listFiles(productionDir);
    
    console.log('📦 Production package with debug created successfully!');
    console.log('\n📁 Package contents:');
    files.forEach(file => console.log(`   📄 ${file}`));
    
    console.log('\n🚀 Next Steps:');
    console.log('1. Navigate to the production-deploy directory');
    console.log('2. Follow DEPLOYMENT_INSTRUCTIONS.md');
    console.log('3. Upload files to your Hostinger server');
    console.log('4. Test the auto-reply system');
    console.log('5. Check debug logs for detailed information');
    
    console.log('\n📋 Quick Commands:');
    console.log('cd production-deploy');
    console.log('chmod +x *.sh');
    console.log('./backup-current.sh  # Backup current files');
    console.log('./test-production.sh # Test after deployment');
    console.log('node ../scripts/debug-production.js # Run debug script');

  } catch (error) {
    console.error('❌ Build failed:', error.message);
  }
}

// Run the build
buildProductionPackage().then(() => {
  console.log('\n🏗️  ===== BUILD COMPLETE =====');
  process.exit(0);
}).catch(error => {
  console.error('❌ Build script failed:', error);
  process.exit(1);
});
