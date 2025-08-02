import fs from 'fs';

// Read the backup file
const backupPath = '/Users/mtaasisi/Downloads/database-backup-2025-07-30T12-11-11-519Z.json';
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

console.log('📊 Creating referral sources breakdown...');

// Calculate referral source breakdown
const referralSources = {};
backupData.data.customers.forEach(customer => {
  if (customer.referral_source && customer.referral_source !== '') {
    referralSources[customer.referral_source] = (referralSources[customer.referral_source] || 0) + 1;
  }
});

// Create CSV content for referral sources
let referralCsv = 'Referral Source,Count,Percentage\n';

const totalCustomers = backupData.data.customers.length;
Object.entries(referralSources)
  .sort(([,a], [,b]) => b - a)
  .forEach(([source, count]) => {
    const percentage = ((count / totalCustomers) * 100).toFixed(1);
    referralCsv += `"${source}",${count},${percentage}%\n`;
  });

// Save referral sources CSV
const referralPath = './referral_sources_breakdown.csv';
fs.writeFileSync(referralPath, referralCsv);

console.log('✅ Referral sources breakdown created!');
console.log(`📁 File saved as: ${referralPath}`);

console.log('\n📊 Top Referral Sources:');
Object.entries(referralSources)
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10)
  .forEach(([source, count], index) => {
    const percentage = ((count / totalCustomers) * 100).toFixed(1);
    console.log(`${index + 1}. ${source}: ${count} customers (${percentage}%)`);
  }); 