import fs from 'fs';

// Read the backup file
const backupPath = '/Users/mtaasisi/Downloads/database-backup-2025-07-30T12-11-11-519Z.json';
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

console.log('📊 Creating birthday breakdown...');

// Calculate birthday breakdown
const birthMonths = {};
const birthDays = {};
const customersWithBirthdays = backupData.data.customers.filter(c => c.birth_month || c.birth_day);

customersWithBirthdays.forEach(customer => {
  if (customer.birth_month) {
    birthMonths[customer.birth_month] = (birthMonths[customer.birth_month] || 0) + 1;
  }
  if (customer.birth_day) {
    birthDays[customer.birth_day] = (birthDays[customer.birth_day] || 0) + 1;
  }
});

// Create CSV content for birth months
let birthMonthCsv = 'Month,Count,Percentage\n';

Object.entries(birthMonths)
  .sort(([,a], [,b]) => b - a)
  .forEach(([month, count]) => {
    const percentage = ((count / customersWithBirthdays.length) * 100).toFixed(1);
    birthMonthCsv += `"${month}",${count},${percentage}%\n`;
  });

// Save birth months CSV
const birthMonthPath = './birth_months_breakdown.csv';
fs.writeFileSync(birthMonthPath, birthMonthCsv);

// Create CSV content for birth days
let birthDayCsv = 'Day,Count,Percentage\n';

Object.entries(birthDays)
  .sort(([,a], [,b]) => b - a)
  .forEach(([day, count]) => {
    const percentage = ((count / customersWithBirthdays.length) * 100).toFixed(1);
    birthDayCsv += `"${day}",${count},${percentage}%\n`;
  });

// Save birth days CSV
const birthDayPath = './birth_days_breakdown.csv';
fs.writeFileSync(birthDayPath, birthDayCsv);

console.log('✅ Birthday breakdown created!');
console.log(`📁 Birth months file: ${birthMonthPath}`);
console.log(`📁 Birth days file: ${birthDayPath}`);

console.log('\n📊 Birthday Statistics:');
console.log(`🎂 Total customers with birthdays: ${customersWithBirthdays.length}`);
console.log(`📈 Percentage of total customers: ${((customersWithBirthdays.length / backupData.data.customers.length) * 100).toFixed(1)}%`);

console.log('\n📊 Top Birth Months:');
Object.entries(birthMonths)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5)
  .forEach(([month, count], index) => {
    const percentage = ((count / customersWithBirthdays.length) * 100).toFixed(1);
    console.log(`${index + 1}. ${month}: ${count} customers (${percentage}%)`);
  });

console.log('\n📊 Top Birth Days:');
Object.entries(birthDays)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 5)
  .forEach(([day, count], index) => {
    const percentage = ((count / customersWithBirthdays.length) * 100).toFixed(1);
    console.log(`${index + 1}. Day ${day}: ${count} customers (${percentage}%)`);
  }); 