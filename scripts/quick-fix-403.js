#!/usr/bin/env node

/**
 * Quick Fix for 403 Errors
 * This script provides immediate solutions for 403 Forbidden errors
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function quickFix403() {
  console.log('🔧 Quick Fix for 403 Forbidden Errors');
  console.log('=====================================\n');

  console.log('📋 Current Issue:');
  console.log('   - Instance ID: 7105306911');
  console.log('   - Error: 403 Forbidden');
  console.log('   - All Green API requests failing');
  console.log('');

  console.log('🔍 Root Cause Analysis:');
  console.log('   The instance ID "7105306911" either:');
  console.log('   1. Does not exist in your Green API account');
  console.log('   2. Has an incorrect API token');
  console.log('   3. Is not properly authorized');
  console.log('   4. Belongs to a different Green API account');
  console.log('');

  console.log('🚀 Immediate Solutions:\n');

  console.log('Option 1: Create New Instance (Recommended)');
  console.log('   Run this command:');
  console.log('   node scripts/create-new-whatsapp-instance.js');
  console.log('');

  console.log('Option 2: Manual Fix');
  console.log('   1. Go to https://console.green-api.com/');
  console.log('   2. Check if instance 7105306911 exists');
  console.log('   3. If it exists, copy the correct API token');
  console.log('   4. If it doesn\'t exist, create a new instance');
  console.log('   5. Update your database with correct credentials');
  console.log('');

  console.log('Option 3: Test Current Instance');
  console.log('   Run this command (replace YOUR_API_TOKEN):');
  console.log('   curl -X GET "https://api.green-api.com/waInstance7105306911/getStateInstance" \\');
  console.log('        -H "Authorization: Bearer YOUR_API_TOKEN"');
  console.log('');

  console.log('🔧 Step-by-Step Fix:\n');

  console.log('1. Verify Green API Account');
  console.log('   - Go to https://console.green-api.com/');
  console.log('   - Log in with your credentials');
  console.log('   - Check if instance 7105306911 exists');
  console.log('');

  console.log('2. If Instance Exists:');
  console.log('   - Copy the correct API token');
  console.log('   - Update your database record');
  console.log('   - Test the connection');
  console.log('');

  console.log('3. If Instance Does Not Exist:');
  console.log('   - Create a new WhatsApp instance');
  console.log('   - Copy the new instance ID and API token');
  console.log('   - Update your database');
  console.log('   - Authorize the new instance');
  console.log('');

  console.log('4. Test the Fix:');
  console.log('   - Refresh your app');
  console.log('   - Navigate to WhatsApp settings');
  console.log('   - Check if 403 errors are gone');
  console.log('');

  console.log('📝 Database Update SQL (if needed):');
  console.log('   UPDATE whatsapp_instances');
  console.log('   SET');
  console.log('     instance_id = \'NEW_INSTANCE_ID\',');
  console.log('     api_token = \'NEW_API_TOKEN\',');
  console.log('     status = \'disconnected\'');
  console.log('   WHERE instance_id = \'7105306911\';');
  console.log('');

  console.log('🛠️ Available Commands:');
  console.log('   node scripts/create-new-whatsapp-instance.js  # Create new instance');
  console.log('   node scripts/test-green-api-direct.js         # Test current instance');
  console.log('   node scripts/debug-green-api.js               # Debug connection issues');
  console.log('');

  console.log('📚 Additional Resources:');
  console.log('   - Complete guide: docs/FIX_403_ERRORS.md');
  console.log('   - Green API docs: https://green-api.com/docs/');
  console.log('   - Green API console: https://console.green-api.com/');
  console.log('');

  console.log('🎯 Expected Result:');
  console.log('   After fixing the 403 errors:');
  console.log('   ✅ No more "403 Forbidden" errors');
  console.log('   ✅ Instance state shows correctly');
  console.log('   ✅ QR code can be generated');
  console.log('   ✅ Settings can be retrieved');
  console.log('   ✅ Reboot and other operations work');
  console.log('');

  console.log('💡 Pro Tip:');
  console.log('   Always test your Green API credentials with curl first');
  console.log('   before using them in your application.');
}

// Run the quick fix
quickFix403()
  .then(() => {
    console.log('\n🎉 Quick fix guide completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
