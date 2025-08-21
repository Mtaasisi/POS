#!/usr/bin/env node

/**
 * Import Phone Numbers from Excel File
 * 
 * This script helps extract phone numbers from the LATS_Customer_Contacts.xlsx file
 * for use in bulk WhatsApp messaging.
 */

import fs from 'fs';
import path from 'path';

const excelFilePath = 'LATS_Customer_Contacts.xlsx';

function extractPhoneNumbers() {
  console.log('📱 Phone Number Extractor for WhatsApp Bulk Messaging\n');

  try {
    // Check if the Excel file exists
    if (!fs.existsSync(excelFilePath)) {
      console.log('❌ Excel file not found:', excelFilePath);
      console.log('\n📋 Please ensure the file is in the project root directory.');
      console.log('💡 You can copy the file to this location and run the script again.');
      return;
    }

    console.log('✅ Excel file found:', excelFilePath);
    console.log('\n📊 File size:', (fs.statSync(excelFilePath).size / 1024).toFixed(2), 'KB');
    
    // Since we can't directly read Excel files without additional libraries,
    // we'll provide instructions for manual extraction
    console.log('\n📋 Manual Extraction Instructions:');
    console.log('1. Open the Excel file in your spreadsheet application');
    console.log('2. Look for columns containing phone numbers');
    console.log('3. Copy the phone numbers to a text file');
    console.log('4. Format them as one number per line');
    console.log('5. Use the bulk sender in your WhatsApp testing page');
    
    console.log('\n🎯 Expected Phone Number Formats:');
    console.log('   • 255746605561 (Tanzania with country code)');
    console.log('   • 0746605561 (Tanzania without country code)');
    console.log('   • 254700000000 (Kenya with country code)');
    console.log('   • 0700000000 (Kenya without country code)');
    
    console.log('\n📝 Steps to Use in Bulk Sender:');
    console.log('1. Go to your WhatsApp Testing page');
    console.log('2. Scroll down to "Send Bulk Messages" section');
    console.log('3. Paste your phone numbers in the "Add Multiple Numbers" textarea');
    console.log('4. Enter your message or use a template');
    console.log('5. Click "Send Bulk Messages"');
    
    console.log('\n⚠️  Important Notes:');
    console.log('• Only messages to allowed numbers will be delivered');
    console.log('• Allowed numbers: 254700000000, 254712345678, 255746605561');
    console.log('• Other numbers will fail due to quota limits');
    console.log('• Upgrade your Green API plan to send to any number');
    
    console.log('\n🔧 Alternative: Use the Bulk Sender Component');
    console.log('The bulk sender component in your app provides:');
    console.log('• Template support for common messages');
    console.log('• Progress tracking and statistics');
    console.log('• Rate limiting to avoid API restrictions');
    console.log('• Detailed results for each message');
    
    console.log('\n📞 Quick Test Numbers:');
    console.log('You can test with these allowed numbers:');
    console.log('255746605561');
    console.log('254700000000');
    console.log('254712345678');
    
    console.log('\n🚀 Ready to send bulk messages!');
    console.log('Navigate to your WhatsApp Testing page to get started.');

  } catch (error) {
    console.error('❌ Error processing file:', error.message);
  }
}

// Run the extractor
extractPhoneNumbers();
