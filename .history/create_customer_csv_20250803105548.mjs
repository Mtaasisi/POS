import fs from 'fs';

// Read the SQL file
const sqlFilePath = '/Users/mtaasisi/Downloads/customers_rows-2.sql';
const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

console.log('📊 SQL file loaded successfully');

// Function to parse SQL INSERT statement and extract customer data
function parseSQLToCustomers(sqlContent) {
  const customers = [];
  
  // Extract the VALUES part from the SQL
  const valuesMatch = sqlContent.match(/VALUES\s*\((.*)\)/s);
  if (!valuesMatch) {
    console.error('❌ Could not find VALUES in SQL');
    return customers;
  }
  
  // Split by '), (' to get individual customer records
  const valuesString = valuesMatch[1];
  const customerStrings = valuesString.split(/\),\s*\(/);
  
  console.log(`📈 Found ${customerStrings.length} customer records to process`);
  
  customerStrings.forEach((customerString, index) => {
    try {
      // Clean up the string and split by comma
      const cleanString = customerString.replace(/^\(|\)$/g, ''); // Remove outer parentheses
      const values = parseCSVValues(cleanString);
      
      if (values.length >= 28) { // Ensure we have enough values
        const customer = {
          id: values[0].replace(/['"]/g, ''), // Remove quotes
          name: values[1].replace(/['"]/g, ''),
          email: values[2] === 'null' ? '' : values[2].replace(/['"]/g, ''),
          phone: values[3].replace(/['"]/g, ''),
          gender: values[4].replace(/['"]/g, ''),
          city: values[5].replace(/['"]/g, ''),
          location_description: values[6] === 'null' ? '' : values[6].replace(/['"]/g, ''),
          national_id: values[7] === 'null' ? '' : values[7].replace(/['"]/g, ''),
          joined_date: values[8].replace(/['"]/g, ''),
          loyalty_level: values[9].replace(/['"]/g, ''),
          color_tag: values[10].replace(/['"]/g, ''),
          referred_by: values[11] === 'null' ? '' : values[11].replace(/['"]/g, ''),
          total_spent: parseFloat(values[12].replace(/['"]/g, '')) || 0,
          points: parseInt(values[13].replace(/['"]/g, '')) || 0,
          last_visit: values[14].replace(/['"]/g, ''),
          is_active: values[15].replace(/['"]/g, '') === 'true',
          referrals: values[16] === 'null' ? '[]' : values[16].replace(/['"]/g, ''),
          whatsapp: values[17] === 'null' ? '' : values[17].replace(/['"]/g, ''),
          referral_source: values[18] === 'null' ? '' : values[18].replace(/['"]/g, ''),
          birth_month: values[19] === 'null' ? '' : values[19].replace(/['"]/g, ''),
          birth_day: values[20] === 'null' ? '' : values[20].replace(/['"]/g, ''),
          customer_tag: values[21].replace(/['"]/g, ''),
          notes: values[22] === 'null' ? '' : values[22].replace(/['"]/g, ''),
          total_returns: parseInt(values[23].replace(/['"]/g, '')) || 0,
          profile_image: values[24] === 'null' ? '' : values[24].replace(/['"]/g, ''),
          created_at: values[25].replace(/['"]/g, ''),
          updated_at: values[26].replace(/['"]/g, ''),
          initial_notes: values[27] === 'null' ? '' : values[27].replace(/['"]/g, '')
        };
        
        customers.push(customer);
      }
    } catch (error) {
      console.error(`❌ Error parsing customer ${index + 1}:`, error.message);
    }
  });
  
  return customers;
}

// Function to parse CSV-like values from SQL
function parseCSVValues(csvString) {
  const values = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < csvString.length) {
    const char = csvString[i];
    
    if (char === "'" && (i === 0 || csvString[i-1] !== '\\')) {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
    
    i++;
  }
  
  // Add the last value
  if (current.trim()) {
    values.push(current.trim());
  }
  
  return values;
}

// Function to convert customers to CSV format
function customersToCSV(customers) {
  if (customers.length === 0) {
    return '';
  }
  
  // Get headers from first customer
  const headers = Object.keys(customers[0]);
  
  // Create CSV header
  let csv = headers.join(',') + '\n';
  
  // Add customer data rows
  customers.forEach(customer => {
    const row = headers.map(header => {
      const value = customer[header];
      // Escape quotes and wrap in quotes if contains comma or quote
      const escapedValue = String(value).replace(/"/g, '""');
      if (escapedValue.includes(',') || escapedValue.includes('"') || escapedValue.includes('\n')) {
        return `"${escapedValue}"`;
      }
      return escapedValue;
    });
    csv += row.join(',') + '\n';
  });
  
  return csv;
}

// Main function
function createCustomerCSV() {
  try {
    console.log('🚀 Starting SQL to CSV conversion...');

    // Parse SQL to customer data
    const customers = parseSQLToCustomers(sqlContent);
    console.log(`✅ Parsed ${customers.length} customers from SQL`);

    if (customers.length === 0) {
      console.log('❌ No customers found in SQL file');
      return;
    }

    // Convert to CSV
    const csvContent = customersToCSV(customers);
    
    // Write CSV file
    const csvFilePath = '/Users/mtaasisi/Downloads/customers_update.csv';
    fs.writeFileSync(csvFilePath, csvContent, 'utf8');
    
    console.log(`✅ CSV file created successfully: ${csvFilePath}`);
    console.log(`📊 CSV contains ${customers.length} customer records`);
    console.log(`📋 CSV headers: ${Object.keys(customers[0]).join(', ')}`);
    
    // Show sample data
    console.log('\n📄 Sample CSV data (first 3 rows):');
    const lines = csvContent.split('\n');
    lines.slice(0, 4).forEach((line, index) => {
      console.log(`Row ${index}: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
    });

    console.log('\n🎉 CSV file is ready for use!');
    console.log('💡 You can now:');
    console.log('   - Open the CSV in Excel/Google Sheets');
    console.log('   - Modify customer data as needed');
    console.log('   - Use the CSV for bulk updates');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the conversion
createCustomerCSV(); 