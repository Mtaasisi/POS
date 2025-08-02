import fs from 'fs';

// Read the backup file
const backupPath = '/Users/mtaasisi/Downloads/database-backup-2025-07-30T12-11-11-519Z.json';
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

console.log('📊 Creating high-value customers list...');

// Filter high-value customers (100+ points or high spenders)
const highValueCustomers = backupData.data.customers.filter(customer => 
  customer.points > 100 || customer.total_spent > 0
).sort((a, b) => (b.points || 0) - (a.points || 0));

// Create CSV content for high-value customers
let highValueCsv = 'ID,Name,Email,Phone,Points,Total Spent,WhatsApp,Referral Source,Birth Month,Birth Day,City,Last Visit\n';

highValueCustomers.forEach(customer => {
  const row = [
    customer.id,
    `"${(customer.name || '').replace(/"/g, '""')}"`,
    `"${(customer.email || '').replace(/"/g, '""')}"`,
    `"${(customer.phone || '').replace(/"/g, '""')}"`,
    customer.points || 0,
    customer.total_spent || 0,
    `"${(customer.whatsapp || '').replace(/"/g, '""')}"`,
    `"${(customer.referral_source || '').replace(/"/g, '""')}"`,
    `"${(customer.birth_month || '').replace(/"/g, '""')}"`,
    `"${(customer.birth_day || '').replace(/"/g, '""')}"`,
    `"${(customer.city || '').replace(/"/g, '""')}"`,
    customer.last_visit ? new Date(customer.last_visit).toLocaleDateString() : ''
  ];
  
  highValueCsv += row.join(',') + '\n';
});

// Save high-value customers CSV
const highValuePath = './high_value_customers.csv';
fs.writeFileSync(highValuePath, highValueCsv);

console.log('✅ High-value customers list created!');
console.log(`📁 File saved as: ${highValuePath}`);

console.log('\n📊 High-Value Customer Statistics:');
console.log(`💰 Total high-value customers: ${highValueCustomers.length}`);
console.log(`📈 Percentage of total customers: ${((highValueCustomers.length / backupData.data.customers.length) * 100).toFixed(1)}%`);

// Show top 10 customers by points
console.log('\n🏆 Top 10 Customers by Points:');
highValueCustomers.slice(0, 10).forEach((customer, index) => {
  console.log(`${index + 1}. ${customer.name}: ${customer.points} points (${customer.city})`);
});

// Show customers with birthdays
const highValueWithBirthdays = highValueCustomers.filter(c => c.birth_month || c.birth_day);
console.log(`\n🎂 High-value customers with birthdays: ${highValueWithBirthdays.length}`);

// Show customers with WhatsApp
const highValueWithWhatsApp = highValueCustomers.filter(c => c.whatsapp && c.whatsapp !== '');
console.log(`💬 High-value customers with WhatsApp: ${highValueWithWhatsApp.length}`); 