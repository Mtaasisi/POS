import fs from 'fs';

// Read the backup file
const backupPath = '/Users/mtaasisi/Downloads/database-backup-2025-07-30T12-05-22-247Z.json';
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

console.log('📊 Backup file loaded successfully');

// Function to escape SQL values
function escapeSQLValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  // Escape single quotes and wrap in single quotes
  const escaped = String(value).replace(/'/g, "''");
  return `'${escaped}'`;
}

// Function to convert customers to SQL INSERT statements
function customersToSQL(customers) {
  if (customers.length === 0) {
    return '';
  }
  
  let sql = '-- Customer Data INSERT Statements\n';
  sql += '-- Generated from backup: database-backup-2025-07-30T12-05-22-247Z.json\n';
  sql += '-- Total customers: ' + customers.length + '\n\n';
  
  // Get all possible columns from the first customer
  const allColumns = Object.keys(customers[0]);
  
  sql += '-- First, clear existing customer data (optional)\n';
  sql += '-- DELETE FROM customers;\n\n';
  
  sql += '-- Insert customer data\n';
  sql += 'INSERT INTO customers (\n';
  sql += '  ' + allColumns.join(',\n  ') + '\n';
  sql += ') VALUES\n';
  
  // Add customer data rows
  customers.forEach((customer, index) => {
    const values = allColumns.map(column => {
      return escapeSQLValue(customer[column]);
    });
    
    sql += '  (' + values.join(', ') + ')';
    
    if (index < customers.length - 1) {
      sql += ',';
    }
    
    sql += '\n';
  });
  
  sql += ';\n\n';
  sql += '-- End of customer data\n';
  
  return sql;
}

// Function to normalize customer data
function normalizeCustomerData(customer) {
  return {
    id: customer.id || '',
    name: customer.name || '',
    email: customer.email || '',
    phone: customer.phone || '',
    gender: customer.gender || '',
    city: customer.city || '',
    location_description: customer.location_description || '',
    national_id: customer.national_id || '',
    joined_date: customer.joined_date || '',
    loyalty_level: customer.loyalty_level || 'bronze',
    color_tag: customer.color_tag || '',
    referred_by: customer.referred_by || '',
    total_spent: customer.total_spent || 0,
    points: customer.points || 0,
    last_visit: customer.last_visit || '',
    is_active: customer.is_active || true,
    whatsapp: customer.whatsapp || '',
    birth_month: customer.birth_month || '',
    birth_day: customer.birth_day || '',
    referral_source: customer.referral_source || '',
    initial_notes: customer.initial_notes || '',
    total_returns: customer.total_returns || 0,
    profile_image: customer.profile_image || '',
    created_at: customer.created_at || '',
    updated_at: customer.updated_at || '',
    customer_tag: customer.customer_tag || '',
    referrals: customer.referrals || 0
  };
}

// Main function
function createCustomersSQL() {
  try {
    console.log('🚀 Starting customer data to SQL conversion...');

    const customers = backupData.data.customers;
    console.log(`📈 Found ${customers.length} customers in backup`);

    if (customers.length === 0) {
      console.log('❌ No customers found in backup file');
      return;
    }

    // Normalize customer data
    const normalizedCustomers = customers.map(normalizeCustomerData);
    console.log(`✅ Normalized ${normalizedCustomers.length} customers`);

    // Convert to SQL
    const sqlContent = customersToSQL(normalizedCustomers);
    
    // Write SQL file
    const sqlFilePath = '/Users/mtaasisi/Downloads/customers_insert.sql';
    fs.writeFileSync(sqlFilePath, sqlContent, 'utf8');
    
    console.log(`✅ Customer SQL file created successfully: ${sqlFilePath}`);
    console.log(`📊 SQL contains ${normalizedCustomers.length} customer INSERT statements`);
    
    // Show sample SQL
    console.log('\n📄 Sample SQL (first 3 customers):');
    const lines = sqlContent.split('\n');
    lines.slice(0, 20).forEach((line, index) => {
      console.log(`Line ${index + 1}: ${line}`);
    });

    // Show customer statistics
    console.log('\n📊 Customer Statistics:');
    const cityCounts = {};
    const loyaltyCounts = {};
    const genderCounts = {};
    
    normalizedCustomers.forEach(customer => {
      cityCounts[customer.city] = (cityCounts[customer.city] || 0) + 1;
      loyaltyCounts[customer.loyalty_level] = (loyaltyCounts[customer.loyalty_level] || 0) + 1;
      genderCounts[customer.gender] = (genderCounts[customer.gender] || 0) + 1;
    });

    console.log(`🏙️  Top Cities:`);
    Object.entries(cityCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([city, count]) => {
        console.log(`   ${city}: ${count} customers`);
      });

    console.log(`🏆 Loyalty Levels:`);
    Object.entries(loyaltyCounts).forEach(([level, count]) => {
      console.log(`   ${level}: ${count} customers`);
    });

    console.log(`👥 Gender Breakdown:`);
    Object.entries(genderCounts).forEach(([gender, count]) => {
      console.log(`   ${gender}: ${count} customers`);
    });

    console.log('\n🎉 Customer SQL file is ready for use!');
    console.log('💡 You can now:');
    console.log('   - Run this SQL in your Supabase SQL editor');
    console.log('   - Use it to restore customer data');
    console.log('   - Modify the SQL before running');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the conversion
createCustomersSQL(); 