#!/usr/bin/env node

console.log('🚀 Test script starting...');
console.log('📁 Current directory:', process.cwd());
console.log('📁 Script location:', import.meta.url);
console.log('📁 Process argv:', process.argv);

// Test file existence
import fs from 'fs';

const smsFilePath = '/Users/mtaasisi/Downloads/sms-20250919010749.xml';
const csvFilePath = '/Users/mtaasisi/Combined_Contacts_Merged_Names.csv';
const callLogFilePath = '/Users/mtaasisi/Downloads/Call_Log_With_Names.csv';

console.log(`📱 SMS file exists: ${fs.existsSync(smsFilePath)}`);
console.log(`📋 CSV file exists: ${fs.existsSync(csvFilePath)}`);
console.log(`📞 Call log file exists: ${fs.existsSync(callLogFilePath)}`);

console.log('✅ Test script completed!');
