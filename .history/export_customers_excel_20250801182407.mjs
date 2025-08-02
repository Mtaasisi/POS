import fs from 'fs';

// Read the backup file
const backupPath = '/Users/mtaasisi/Downloads/database-backup-2025-07-30T12-11-11-519Z.json';
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

console.log('📊 Creating Excel file with customer data...');
console.log(`📈 Total customers: ${backupData.data.customers.length}`);

// Create CSV content (Excel can open CSV files)
let csvContent = 'ID,Name,Email,Phone,Gender,City,Joined Date,Loyalty Level,Color Tag,Total Spent,Points,Last Visit,Is Active,WhatsApp,Referral Source,Birth Month,Birth Day,Customer Tag,Notes,Total Returns,Initial Notes,Location Description,National ID,Created At,Updated At\n';

// Add data rows
backupData.data.customers.forEach((customer, index) => {
  const row = [
    customer.id,
    `"${(customer.name || '').replace(/"/g, '""')}"`,
    `"${(customer.email || '').replace(/"/g, '""')}"`,
    `"${(customer.phone || '').replace(/"/g, '""')}"`,
    `"${(customer.gender || '').replace(/"/g, '""')}"`,
    `"${(customer.city || '').replace(/"/g, '""')}"`,
    customer.joined_date ? new Date(customer.joined_date).toLocaleDateString() : '',
    `"${(customer.loyalty_level || '').replace(/"/g, '""')}"`,
    `"${(customer.color_tag || '').replace(/"/g, '""')}"`,
    customer.total_spent || 0,
    customer.points || 0,
    customer.last_visit ? new Date(customer.last_visit).toLocaleDateString() : '',
    customer.is_active ? 'Yes' : 'No',
    `"${(customer.whatsapp || '').replace(/"/g, '""')}"`,
    `"${(customer.referral_source || '').replace(/"/g, '""')}"`,
    `"${(customer.birth_month || '').replace(/"/g, '""')}"`,
    `"${(customer.birth_day || '').replace(/"/g, '""')}"`,
    `"${(customer.customer_tag || '').replace(/"/g, '""')}"`,
    `"${(customer.notes || '').replace(/"/g, '""')}"`,
    customer.total_returns || 0,
    `"${(customer.initial_notes || '').replace(/"/g, '""')}"`,
    `"${(customer.location_description || '').replace(/"/g, '""')}"`,
    `"${(customer.national_id || '').replace(/"/g, '""')}"`,
    customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '',
    customer.updated_at ? new Date(customer.updated_at).toLocaleDateString() : ''
  ];
  
  csvContent += row.join(',') + '\n';
  
  // Log progress every 100 customers
  if ((index + 1) % 100 === 0) {
    console.log(`✅ Processed ${index + 1} customers...`);
  }
});

// Save the CSV file
const csvPath = './customer_data_export.csv';
fs.writeFileSync(csvPath, csvContent);

console.log('✅ CSV file created successfully!');
console.log(`📁 File saved as: ${csvPath}`);

// Calculate and display statistics
const totalCustomers = backupData.data.customers.length;
const customersWithBirthdays = backupData.data.customers.filter(c => c.birth_month || c.birth_day).length;
const customersWithReferralSource = backupData.data.customers.filter(c => c.referral_source && c.referral_source !== '').length;
const customersWithWhatsApp = backupData.data.customers.filter(c => c.whatsapp && c.whatsapp !== '').length;
const customersWithHighPoints = backupData.data.customers.filter(c => c.points > 100).length;

console.log('\n📊 Summary:');
console.log(`📈 Total customers: ${totalCustomers}`);
console.log(`🎂 Customers with birthdays: ${customersWithBirthdays} (${((customersWithBirthdays / totalCustomers) * 100).toFixed(1)}%)`);
console.log(`📱 Customers with referral source: ${customersWithReferralSource} (${((customersWithReferralSource / totalCustomers) * 100).toFixed(1)}%)`);
console.log(`💬 Customers with WhatsApp: ${customersWithWhatsApp} (${((customersWithWhatsApp / totalCustomers) * 100).toFixed(1)}%)`);
console.log(`💰 Customers with 100+ points: ${customersWithHighPoints} (${((customersWithHighPoints / totalCustomers) * 100).toFixed(1)}%)`);

console.log('\n🎯 How to use this CSV file:');
console.log('1. Open the file in Excel or Google Sheets');
console.log('2. The file will automatically format as a table');
console.log('3. You can filter, sort, and edit the data');
console.log('4. Save as Excel (.xlsx) if needed');
console.log('5. Import the updated data back to your system'); 