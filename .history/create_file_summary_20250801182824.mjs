import fs from 'fs';

console.log('📊 Customer Data Export Summary');
console.log('================================');

// Check which files exist
const files = [
  { name: 'customer_data_export.csv', description: 'Complete customer data (742 customers)' },
  { name: 'referral_sources_breakdown.csv', description: 'Referral sources analysis' },
  { name: 'birth_months_breakdown.csv', description: 'Birth month distribution' },
  { name: 'birth_days_breakdown.csv', description: 'Birth day distribution' },
  { name: 'high_value_customers.csv', description: 'High-value customers (100+ points)' }
];

console.log('\n📁 Generated Files:');
files.forEach(file => {
  const exists = fs.existsSync(`./${file.name}`);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${file.name} - ${file.description}`);
});

console.log('\n🎯 How to Use These Files:');
console.log('1. customer_data_export.csv - Main file with all customer data');
console.log('   • Open in Excel or Google Sheets');
console.log('   • Edit any missing or incorrect information');
console.log('   • Use for bulk updates to your database');
console.log('');
console.log('2. referral_sources_breakdown.csv - Marketing insights');
console.log('   • Shows which marketing channels are most effective');
console.log('   • Use for targeted marketing campaigns');
console.log('');
console.log('3. birth_months_breakdown.csv & birth_days_breakdown.csv - Birthday campaigns');
console.log('   • Plan birthday marketing campaigns');
console.log('   • Focus on months with most customers');
console.log('');
console.log('4. high_value_customers.csv - VIP customer management');
console.log('   • Focus on your most valuable customers');
console.log('   • Plan special promotions and loyalty programs');
console.log('');

console.log('📊 Key Statistics:');
console.log('• Total Customers: 742');
console.log('• Customers with Birthdays: 271 (36.5%)');
console.log('• Customers with Referral Source: 671 (90.4%)');
console.log('• Customers with WhatsApp: 737 (99.3%)');
console.log('• High-Value Customers (100+ points): 20 (2.7%)');
console.log('');

console.log('🏆 Top Marketing Channels:');
console.log('1. Instagram: 233 customers (31.4%)');
console.log('2. Social Media: 99 customers (13.3%)');
console.log('3. Walk-in: 88 customers (11.9%)');
console.log('4. Friend: 69 customers (9.3%)');
console.log('5. Online: 49 customers (6.6%)');
console.log('');

console.log('🎂 Top Birth Months:');
console.log('1. June: 39 customers (14.4%)');
console.log('2. July: 31 customers (11.4%)');
console.log('3. February: 30 customers (11.1%)');
console.log('4. December: 26 customers (9.6%)');
console.log('5. March: 26 customers (9.6%)');
console.log('');

console.log('💰 Top Customers by Points:');
console.log('1. inauzwa: 2,985 points');
console.log('2. Samuel masika: 1,200 points');
console.log('3. PETER: 120 points');
console.log('4. erick: 115 points');
console.log('5. Imani rwemanyira: 115 points');
console.log('');

console.log('🚀 Next Steps:');
console.log('1. Open customer_data_export.csv in Excel');
console.log('2. Review and update any missing information');
console.log('3. Use the breakdown files for targeted marketing');
console.log('4. Import updated data back to your system');
console.log('5. Use the insights for customer engagement campaigns'); 