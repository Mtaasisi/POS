#!/usr/bin/env node

/**
 * Green API New Credentials Guide
 * Step-by-step guide to get fresh, valid credentials
 */

console.log('🔑 Green API - Get NEW Credentials Guide');
console.log('========================================\n');

console.log('❌ Your current credentials are INVALID:');
console.log('   Instance ID: 7105306911');
console.log('   API Token: baa5bd7cb4d7468a91ffc6df4afb0ad2b8de4db7b1f3424cbf');
console.log('   Status: 403 Forbidden (Invalid)\n');

console.log('🚀 STEP-BY-STEP GUIDE TO GET NEW CREDENTIALS:\n');

console.log('1. 🌐 OPEN GREEN API CONSOLE');
console.log('   • Go to: https://console.green-api.com/');
console.log('   • Log in to your account\n');

console.log('2. 📱 CHECK YOUR INSTANCES');
console.log('   • Look for existing WhatsApp instances');
console.log('   • Check if any are active/working');
console.log('   • Note: Your current instance (7105306911) is NOT working\n');

console.log('3. 🔄 CREATE NEW INSTANCE (if needed)');
console.log('   • Click "Create Instance" or "Add Instance"');
console.log('   • Choose "WhatsApp" as type');
console.log('   • Give it a name (e.g., "LATS CHANCE WhatsApp")');
console.log('   • Wait for it to be created\n');

console.log('4. 📋 COPY NEW CREDENTIALS');
console.log('   • Find a WORKING instance (not 7105306911)');
console.log('   • Copy the NEW Instance ID');
console.log('   • Copy the NEW API Token');
console.log('   • Make sure they are different from the old ones!\n');

console.log('5. 🧪 TEST NEW CREDENTIALS');
console.log('   • Use this command to test:');
console.log('   • node scripts/quick-test-credentials.js NEW_INSTANCE_ID NEW_API_TOKEN\n');

console.log('6. 💾 UPDATE DATABASE');
console.log('   • If test is successful, update database:');
console.log('   • npm run whatsapp:update NEW_INSTANCE_ID NEW_API_TOKEN\n');

console.log('⚠️  IMPORTANT NOTES:');
console.log('   • DO NOT use the old credentials (7105306911)');
console.log('   • Make sure you copy the credentials correctly');
console.log('   • Test before updating the database');
console.log('   • Keep your API tokens secure\n');

console.log('🎯 EXPECTED RESULT:');
console.log('   • New credentials should return 200 OK');
console.log('   • Instance state should be shown');
console.log('   • No more 403 Forbidden errors\n');

console.log('📞 NEED HELP?');
console.log('   • Green API Documentation: https://green-api.com/docs/');
console.log('   • Green API Support: Check their website for support\n');

console.log('🎉 Once you have NEW, working credentials, come back here!');
console.log('   We\'ll test them and update your database together.\n');
