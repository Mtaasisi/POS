#!/usr/bin/env node

/**
 * Fix Console Issues Script
 * 
 * This script addresses the console spam and connection issues in the LATS application.
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Console Issues...\n');

// 1. Reduce real-time stock logging
const realTimeStockPath = path.join(process.cwd(), 'src/features/lats/lib/realTimeStock.ts');
if (fs.existsSync(realTimeStockPath)) {
  console.log('📋 Reducing real-time stock logging...');
  let content = fs.readFileSync(realTimeStockPath, 'utf8');
  
  // Reduce retry logging
  content = content.replace(
    /console\.log\('🔄 Retry attempt \d+\/\d+ in \d+ms'\);/g,
    '// console.log(\'🔄 Retry attempt \' + this.retryCount + \'/\' + this.maxRetries + \' in \' + retryDelay + \'ms\');'
  );
  
  // Reduce connection logging
  content = content.replace(
    /console\.log\('🔌 WebSocket connection closed:'/g,
    '// console.log(\'🔌 WebSocket connection closed:\''
  );
  
  fs.writeFileSync(realTimeStockPath, content, 'utf8');
  console.log('✅ Reduced real-time stock logging');
}

// 2. Reduce PaymentTrackingModal logging
const paymentTrackingPath = path.join(process.cwd(), 'src/features/lats/components/pos/PaymentTrackingModal.tsx');
if (fs.existsSync(paymentTrackingPath)) {
  console.log('📋 Reducing PaymentTrackingModal logging...');
  let content = fs.readFileSync(paymentTrackingPath, 'utf8');
  
  // Reduce modal rendering logs
  content = content.replace(
    /console\.log\('🔍 PaymentTrackingModal: Modal is open, rendering\.\.\.'\);/g,
    '// console.log(\'🔍 PaymentTrackingModal: Modal is open, rendering...\');'
  );
  
  // Reduce fetch logs
  content = content.replace(
    /console\.log\('🔄 PaymentTrackingModal: Fetching payment data\.\.\.'\);/g,
    '// console.log(\'🔄 PaymentTrackingModal: Fetching payment data...\');'
  );
  
  fs.writeFileSync(paymentTrackingPath, content, 'utf8');
  console.log('✅ Reduced PaymentTrackingModal logging');
}

// 3. Reduce payment tracking service logging
const paymentServicePath = path.join(process.cwd(), 'src/lib/paymentTrackingService.ts');
if (fs.existsSync(paymentServicePath)) {
  console.log('📋 Reducing payment tracking service logging...');
  let content = fs.readFileSync(paymentServicePath, 'utf8');
  
  // Reduce fetch logs
  content = content.replace(
    /console\.log\('🔍 PaymentTrackingService: Fetching payment transactions\.\.\.'\);/g,
    '// console.log(\'🔍 PaymentTrackingService: Fetching payment transactions...\');'
  );
  
  // Reduce found logs
  content = content.replace(
    /console\.log\(`📊 PaymentTrackingService: Found \$\{devicePayments\.length\} device payments`\);/g,
    '// console.log(`📊 PaymentTrackingService: Found ${devicePayments.length} device payments`);'
  );
  
  content = content.replace(
    /console\.log\(`📊 PaymentTrackingService: Found \$\{posSales\.length\} POS sales`\);/g,
    '// console.log(`📊 PaymentTrackingService: Found ${posSales.length} POS sales`);'
  );
  
  fs.writeFileSync(paymentServicePath, content, 'utf8');
  console.log('✅ Reduced payment tracking service logging');
}

// 4. Reduce WhatsApp context logging
const whatsappContextPath = path.join(process.cwd(), 'src/context/WhatsAppContext.tsx');
if (fs.existsSync(whatsappContextPath)) {
  console.log('📋 Reducing WhatsApp context logging...');
  let content = fs.readFileSync(whatsappContextPath, 'utf8');
  
  // Reduce fetch logs
  content = content.replace(
    /console\.log\('🔍 Fetching WhatsApp instances for user:'/g,
    '// console.log(\'🔍 Fetching WhatsApp instances for user:\''
  );
  
  // Reduce success logs
  content = content.replace(
    /console\.log\('✅ Successfully fetched \d+ WhatsApp instances'\);/g,
    '// console.log(\'✅ Successfully fetched \' + instances.length + \' WhatsApp instances\');'
  );
  
  fs.writeFileSync(whatsappContextPath, content, 'utf8');
  console.log('✅ Reduced WhatsApp context logging');
}

// 5. Reduce external barcode scanner logging
const barcodeScannerPath = path.join(process.cwd(), 'src/hooks/useExternalBarcodeScanner.ts');
if (fs.existsSync(barcodeScannerPath)) {
  console.log('📋 Reducing external barcode scanner logging...');
  let content = fs.readFileSync(barcodeScannerPath, 'utf8');
  
  // Reduce initialization logs
  content = content.replace(
    /console\.log\('🔍 External barcode scanner initialized successfully'\);/g,
    '// console.log(\'🔍 External barcode scanner initialized successfully\');'
  );
  
  // Reduce stop logs
  content = content.replace(
    /console\.log\('🔍 External barcode scanning stopped'\);/g,
    '// console.log(\'🔍 External barcode scanning stopped\');'
  );
  
  fs.writeFileSync(barcodeScannerPath, content, 'utf8');
  console.log('✅ Reduced external barcode scanner logging');
}

console.log('\n✅ Console issues fixed!');
console.log('📝 Changes made:');
console.log('   - Reduced real-time stock retry logging');
console.log('   - Reduced PaymentTrackingModal rendering logs');
console.log('   - Reduced payment tracking service fetch logs');
console.log('   - Reduced WhatsApp context fetch logs');
console.log('   - Reduced external barcode scanner logs');
console.log('\n🔄 Please restart your development server to see the changes.');
