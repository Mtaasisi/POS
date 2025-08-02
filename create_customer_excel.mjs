import fs from 'fs';
import ExcelJS from 'exceljs';

// Read the backup file
const backupPath = '/Users/mtaasisi/Downloads/database-backup-2025-07-30T12-11-11-519Z.json';
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

console.log('📊 Creating Excel file with customer data...');
console.log(`📈 Total customers: ${backupData.data.customers.length}`);

// Create a new workbook and worksheet
const workbook = new ExcelJS.Workbook();
const worksheet = workbook.addWorksheet('Customers');

// Define the columns
worksheet.columns = [
  { header: 'ID', key: 'id', width: 40 },
  { header: 'Name', key: 'name', width: 20 },
  { header: 'Email', key: 'email', width: 25 },
  { header: 'Phone', key: 'phone', width: 15 },
  { header: 'Gender', key: 'gender', width: 10 },
  { header: 'City', key: 'city', width: 15 },
  { header: 'Joined Date', key: 'joined_date', width: 15 },
  { header: 'Loyalty Level', key: 'loyalty_level', width: 12 },
  { header: 'Color Tag', key: 'color_tag', width: 12 },
  { header: 'Total Spent', key: 'total_spent', width: 12 },
  { header: 'Points', key: 'points', width: 10 },
  { header: 'Last Visit', key: 'last_visit', width: 15 },
  { header: 'Is Active', key: 'is_active', width: 10 },
  { header: 'WhatsApp', key: 'whatsapp', width: 15 },
  { header: 'Referral Source', key: 'referral_source', width: 15 },
  { header: 'Birth Month', key: 'birth_month', width: 12 },
  { header: 'Birth Day', key: 'birth_day', width: 10 },
  { header: 'Customer Tag', key: 'customer_tag', width: 12 },
  { header: 'Notes', key: 'notes', width: 30 },
  { header: 'Total Returns', key: 'total_returns', width: 12 },
  { header: 'Initial Notes', key: 'initial_notes', width: 30 },
  { header: 'Location Description', key: 'location_description', width: 25 },
  { header: 'National ID', key: 'national_id', width: 15 },
  { header: 'Created At', key: 'created_at', width: 15 },
  { header: 'Updated At', key: 'updated_at', width: 15 }
];

// Style the header row
worksheet.getRow(1).font = { bold: true };
worksheet.getRow(1).fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE0E0E0' }
};

// Add data rows
backupData.data.customers.forEach((customer, index) => {
  const row = worksheet.addRow({
    id: customer.id,
    name: customer.name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    gender: customer.gender || '',
    city: customer.city || '',
    joined_date: customer.joined_date ? new Date(customer.joined_date).toLocaleDateString() : '',
    loyalty_level: customer.loyalty_level || '',
    color_tag: customer.color_tag || '',
    total_spent: customer.total_spent || 0,
    points: customer.points || 0,
    last_visit: customer.last_visit ? new Date(customer.last_visit).toLocaleDateString() : '',
    is_active: customer.is_active ? 'Yes' : 'No',
    whatsapp: customer.whatsapp || '',
    referral_source: customer.referral_source || '',
    birth_month: customer.birth_month || '',
    birth_day: customer.birth_day || '',
    customer_tag: customer.customer_tag || '',
    notes: customer.notes || '',
    total_returns: customer.total_returns || 0,
    initial_notes: customer.initial_notes || '',
    location_description: customer.location_description || '',
    national_id: customer.national_id || '',
    created_at: customer.created_at ? new Date(customer.created_at).toLocaleDateString() : '',
    updated_at: customer.updated_at ? new Date(customer.updated_at).toLocaleDateString() : ''
  });

  // Add conditional formatting for important fields
  if (customer.whatsapp) {
    row.getCell('whatsapp').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE8F5E8' } // Light green
    };
  }

  if (customer.referral_source) {
    row.getCell('referral_source').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF0E8FF' } // Light purple
    };
  }

  if (customer.birth_month || customer.birth_day) {
    row.getCell('birth_month').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFE8F0' } // Light pink
    };
    row.getCell('birth_day').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFE8F0' } // Light pink
    };
  }

  // Highlight customers with high points
  if (customer.points > 100) {
    row.getCell('points').fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFFF2CC' } // Light yellow
    };
  }
});

// Add a summary worksheet
const summarySheet = workbook.addWorksheet('Summary');
summarySheet.columns = [
  { header: 'Metric', key: 'metric', width: 25 },
  { header: 'Count', key: 'count', width: 15 },
  { header: 'Percentage', key: 'percentage', width: 15 }
];

// Calculate statistics
const totalCustomers = backupData.data.customers.length;
const customersWithBirthdays = backupData.data.customers.filter(c => c.birth_month || c.birth_day).length;
const customersWithReferralSource = backupData.data.customers.filter(c => c.referral_source && c.referral_source !== '').length;
const customersWithWhatsApp = backupData.data.customers.filter(c => c.whatsapp && c.whatsapp !== '').length;
const customersWithHighPoints = backupData.data.customers.filter(c => c.points > 100).length;

// Add summary data
summarySheet.addRow({ metric: 'Total Customers', count: totalCustomers, percentage: '100%' });
summarySheet.addRow({ metric: 'Customers with Birthdays', count: customersWithBirthdays, percentage: `${((customersWithBirthdays / totalCustomers) * 100).toFixed(1)}%` });
summarySheet.addRow({ metric: 'Customers with Referral Source', count: customersWithReferralSource, percentage: `${((customersWithReferralSource / totalCustomers) * 100).toFixed(1)}%` });
summarySheet.addRow({ metric: 'Customers with WhatsApp', count: customersWithWhatsApp, percentage: `${((customersWithWhatsApp / totalCustomers) * 100).toFixed(1)}%` });
summarySheet.addRow({ metric: 'Customers with 100+ Points', count: customersWithHighPoints, percentage: `${((customersWithHighPoints / totalCustomers) * 100).toFixed(1)}%` });

// Style summary sheet
summarySheet.getRow(1).font = { bold: true };
summarySheet.getRow(1).fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE0E0E0' }
};

// Add referral source breakdown
const referralSheet = workbook.addWorksheet('Referral Sources');
referralSheet.columns = [
  { header: 'Referral Source', key: 'source', width: 20 },
  { header: 'Count', key: 'count', width: 15 },
  { header: 'Percentage', key: 'percentage', width: 15 }
];

// Calculate referral source breakdown
const referralSources = {};
backupData.data.customers.forEach(customer => {
  if (customer.referral_source && customer.referral_source !== '') {
    referralSources[customer.referral_source] = (referralSources[customer.referral_source] || 0) + 1;
  }
});

Object.entries(referralSources)
  .sort(([,a], [,b]) => b - a)
  .forEach(([source, count]) => {
    referralSheet.addRow({
      source,
      count,
      percentage: `${((count / totalCustomers) * 100).toFixed(1)}%`
    });
  });

// Style referral sheet
referralSheet.getRow(1).font = { bold: true };
referralSheet.getRow(1).fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE0E0E0' }
};

// Add birthday breakdown
const birthdaySheet = workbook.addWorksheet('Birthdays');
birthdaySheet.columns = [
  { header: 'Month', key: 'month', width: 15 },
  { header: 'Count', key: 'count', width: 15 },
  { header: 'Percentage', key: 'percentage', width: 15 }
];

// Calculate birthday breakdown
const birthMonths = {};
backupData.data.customers.forEach(customer => {
  if (customer.birth_month) {
    birthMonths[customer.birth_month] = (birthMonths[customer.birth_month] || 0) + 1;
  }
});

Object.entries(birthMonths)
  .sort(([,a], [,b]) => b - a)
  .forEach(([month, count]) => {
    birthdaySheet.addRow({
      month,
      count,
      percentage: `${((count / customersWithBirthdays) * 100).toFixed(1)}%`
    });
  });

// Style birthday sheet
birthdaySheet.getRow(1).font = { bold: true };
birthdaySheet.getRow(1).fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFE0E0E0' }
};

// Save the workbook
const excelPath = './customer_data_export.xlsx';
await workbook.xlsx.writeFile(excelPath);

console.log('✅ Excel file created successfully!');
console.log(`📁 File saved as: ${excelPath}`);
console.log('\n📊 Summary:');
console.log(`📈 Total customers: ${totalCustomers}`);
console.log(`🎂 Customers with birthdays: ${customersWithBirthdays}`);
console.log(`📱 Customers with referral source: ${customersWithReferralSource}`);
console.log(`💬 Customers with WhatsApp: ${customersWithWhatsApp}`);
console.log(`💰 Customers with 100+ points: ${customersWithHighPoints}`);

console.log('\n📋 Excel file contains:');
console.log('1. Customers - Main data with all customer information');
console.log('2. Summary - Key statistics and percentages');
console.log('3. Referral Sources - Breakdown by referral source');
console.log('4. Birthdays - Breakdown by birth month');

console.log('\n🎯 How to use this Excel file:');
console.log('1. Open the file in Excel or Google Sheets');
console.log('2. Review the data in the "Customers" sheet');
console.log('3. Use the "Summary" sheet for quick statistics');
console.log('4. Use the "Referral Sources" and "Birthdays" sheets for marketing insights');
console.log('5. Update any missing or incorrect data directly in Excel');
console.log('6. Import the updated data back to your system'); 