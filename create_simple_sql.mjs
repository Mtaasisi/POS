import fs from 'fs';

// Read the backup file
const backupPath = '/Users/mtaasisi/Downloads/database-backup-2025-07-30T12-05-22-247Z.json';
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

console.log('📊 Backup file loaded successfully');

// Function to escape SQL values with proper timestamp handling
function escapeSQLValue(value, columnName) {
  // Handle timestamp fields specifically
  const timestampFields = ['created_at', 'updated_at', 'joined_date', 'last_visit', 'expected_return_date', 'warranty_start', 'warranty_end'];
  
  if (timestampFields.includes(columnName)) {
    if (value === null || value === undefined || value === '' || value === '') {
      return 'NULL';
    }
    // Ensure proper timestamp format
    const escaped = String(value).replace(/'/g, "''");
    return `'${escaped}'`;
  }
  
  if (value === null || value === undefined || value === '') {
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

// Function to create simple UPSERT for customers
function createSimpleCustomerUPSERT(customers) {
  if (customers.length === 0) return '';
  
  let sql = '-- CUSTOMER DATA UPSERT\n';
  sql += '-- =============================================\n\n';
  
  // Use only essential columns to avoid timestamp issues
  const essentialColumns = [
    'id', 'name', 'email', 'phone', 'gender', 'city', 
    'loyalty_level', 'color_tag', 'total_spent', 'points', 
    'is_active', 'whatsapp', 'birth_month', 'birth_day', 
    'referral_source', 'initial_notes', 'total_returns', 
    'profile_image', 'customer_tag', 'referrals'
  ];
  
  sql += 'INSERT INTO customers (\n';
  sql += '  ' + essentialColumns.join(',\n  ') + '\n';
  sql += ') VALUES\n';
  
  // Add customer data rows
  customers.forEach((customer, index) => {
    const values = essentialColumns.map(column => {
      return escapeSQLValue(customer[column], column);
    });
    
    sql += '  (' + values.join(', ') + ')';
    
    if (index < customers.length - 1) {
      sql += ',';
    }
    
    sql += '\n';
  });
  
  sql += 'ON CONFLICT (id) DO UPDATE SET\n';
  const updateColumns = essentialColumns.filter(col => col !== 'id');
  sql += '  ' + updateColumns.map(col => `${col} = EXCLUDED.${col}`).join(',\n  ') + '\n';
  sql += ';\n\n';
  
  return sql;
}

// Function to create simple UPSERT for devices
function createSimpleDeviceUPSERT(devices) {
  if (devices.length === 0) return '';
  
  let sql = '-- DEVICE DATA UPSERT\n';
  sql += '-- =============================================\n\n';
  
  // Use only essential columns to avoid timestamp issues
  const essentialColumns = [
    'id', 'customer_id', 'brand', 'model', 'serial_number', 
    'issue_description', 'status', 'assigned_to', 'device_type', 
    'repair_cost', 'deposit_amount', 'device_cost', 'diagnosis_required', 
    'device_notes', 'device_condition', 'imei', 'is_internal', 
    'department', 'location', 'condition', 'power_status', 'notes', 
    'purchase_type', 'purchase_price', 'estimated_hours', 'warranty_status', 
    'repair_count', 'priority_level', 'issue_type', 'labor_cost', 
    'parts_cost', 'payment_status', 'symptoms', 'possible_causes', 
    'additional_notes'
  ];
  
  sql += 'INSERT INTO devices (\n';
  sql += '  ' + essentialColumns.join(',\n  ') + '\n';
  sql += ') VALUES\n';
  
  // Add device data rows
  devices.forEach((device, index) => {
    const values = essentialColumns.map(column => {
      return escapeSQLValue(device[column], column);
    });
    
    sql += '  (' + values.join(', ') + ')';
    
    if (index < devices.length - 1) {
      sql += ',';
    }
    
    sql += '\n';
  });
  
  sql += 'ON CONFLICT (id) DO UPDATE SET\n';
  const updateColumns = essentialColumns.filter(col => col !== 'id');
  sql += '  ' + updateColumns.map(col => `${col} = EXCLUDED.${col}`).join(',\n  ') + '\n';
  sql += ';\n\n';
  
  return sql;
}

// Main function
function createSimpleSQL() {
  try {
    console.log('🚀 Starting simple SQL file generation...');

    const customers = backupData.data.customers;
    const devices = backupData.data.devices;
    
    console.log(`📈 Found ${customers.length} customers and ${devices.length} devices in backup`);

    let sqlContent = '-- =============================================\n';
    sqlContent += '-- SIMPLE DATABASE RESTORATION SCRIPT\n';
    sqlContent += '-- Generated from backup: database-backup-2025-07-30T12-05-22-247Z.json\n';
    sqlContent += '-- =============================================\n\n';
    
    sqlContent += '-- Current record counts\n';
    sqlContent += 'SELECT \'customers\' as table_name, COUNT(*) as record_count FROM customers\n';
    sqlContent += 'UNION ALL\n';
    sqlContent += 'SELECT \'devices\' as table_name, COUNT(*) as record_count FROM devices;\n\n';
    
    if (customers.length > 0) {
      sqlContent += createSimpleCustomerUPSERT(customers);
    }
    
    if (devices.length > 0) {
      sqlContent += createSimpleDeviceUPSERT(devices);
    }
    
    sqlContent += '-- Verification queries\n';
    sqlContent += 'SELECT \'customers\' as table_name, COUNT(*) as final_count FROM customers\n';
    sqlContent += 'UNION ALL\n';
    sqlContent += 'SELECT \'devices\' as table_name, COUNT(*) as final_count FROM devices;\n\n';
    
    sqlContent += '-- Show sample data\n';
    sqlContent += 'SELECT id, name, city, loyalty_level, points FROM customers LIMIT 5;\n\n';
    sqlContent += 'SELECT id, customer_id, brand, model, status FROM devices LIMIT 5;\n\n';
    
    // Write SQL file
    const sqlFilePath = '/Users/mtaasisi/Downloads/simple_database_restore.sql';
    fs.writeFileSync(sqlFilePath, sqlContent, 'utf8');
    
    console.log(`✅ Simple SQL file created successfully: ${sqlFilePath}`);
    console.log(`📊 SQL contains:`);
    console.log(`   - ${customers.length} customer UPSERT statements (essential fields only)`);
    console.log(`   - ${devices.length} device UPSERT statements (essential fields only)`);
    console.log(`   - No timestamp fields to avoid conflicts`);
    
    // Show file size
    const stats = fs.statSync(sqlFilePath);
    console.log(`📁 File size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    console.log('\n🎉 Simple SQL file is ready for use!');
    console.log('💡 Key Features:');
    console.log('   - Uses only essential fields (no timestamp conflicts)');
    console.log('   - Safe UPSERT operations');
    console.log('   - Minimal and focused');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the conversion
createSimpleSQL(); 