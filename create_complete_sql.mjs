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

// Function to create table structure SQL
function createTableStructureSQL() {
  let sql = '-- =============================================\n';
  sql += '-- DATABASE STRUCTURE AND DATA RESTORATION SCRIPT\n';
  sql += '-- Generated from backup: database-backup-2025-07-30T12-05-22-247Z.json\n';
  sql += '-- =============================================\n\n';
  
  sql += '-- 1. SHOW TABLE STRUCTURES\n';
  sql += '-- =============================================\n\n';
  
  sql += '-- Customers table structure\n';
  sql += 'SELECT \n';
  sql += '    column_name,\n';
  sql += '    data_type,\n';
  sql += '    is_nullable,\n';
  sql += '    column_default,\n';
  sql += '    character_maximum_length\n';
  sql += 'FROM information_schema.columns \n';
  sql += 'WHERE table_name = \'customers\' \n';
  sql += 'ORDER BY ordinal_position;\n\n';
  
  sql += '-- Devices table structure\n';
  sql += 'SELECT \n';
  sql += '    column_name,\n';
  sql += '    data_type,\n';
  sql += '    is_nullable,\n';
  sql += '    column_default,\n';
  sql += '    character_maximum_length\n';
  sql += 'FROM information_schema.columns \n';
  sql += 'WHERE table_name = \'devices\' \n';
  sql += 'ORDER BY ordinal_position;\n\n';
  
  sql += '-- Customer notes table structure\n';
  sql += 'SELECT \n';
  sql += '    column_name,\n';
  sql += '    data_type,\n';
  sql += '    is_nullable,\n';
  sql += '    column_default,\n';
  sql += '    character_maximum_length\n';
  sql += 'FROM information_schema.columns \n';
  sql += 'WHERE table_name = \'customer_notes\' \n';
  sql += 'ORDER BY ordinal_position;\n\n';
  
  sql += '-- Customer payments table structure\n';
  sql += 'SELECT \n';
  sql += '    column_name,\n';
  sql += '    data_type,\n';
  sql += '    is_nullable,\n';
  sql += '    column_default,\n';
  sql += '    character_maximum_length\n';
  sql += 'FROM information_schema.columns \n';
  sql += 'WHERE table_name = \'customer_payments\' \n';
  sql += 'ORDER BY ordinal_position;\n\n';
  
  sql += '-- Promo messages table structure\n';
  sql += 'SELECT \n';
  sql += '    column_name,\n';
  sql += '    data_type,\n';
  sql += '    is_nullable,\n';
  sql += '    column_default,\n';
  sql += '    character_maximum_length\n';
  sql += 'FROM information_schema.columns \n';
  sql += 'WHERE table_name = \'promo_messages\' \n';
  sql += 'ORDER BY ordinal_position;\n\n';
  
  sql += '-- 2. COUNT RECORDS IN EACH TABLE\n';
  sql += '-- =============================================\n\n';
  
  sql += 'SELECT \'customers\' as table_name, COUNT(*) as record_count FROM customers\n';
  sql += 'UNION ALL\n';
  sql += 'SELECT \'devices\' as table_name, COUNT(*) as record_count FROM devices\n';
  sql += 'UNION ALL\n';
  sql += 'SELECT \'customer_notes\' as table_name, COUNT(*) as record_count FROM customer_notes\n';
  sql += 'UNION ALL\n';
  sql += 'SELECT \'customer_payments\' as table_name, COUNT(*) as record_count FROM customer_payments\n';
  sql += 'UNION ALL\n';
  sql += 'SELECT \'promo_messages\' as table_name, COUNT(*) as record_count FROM promo_messages;\n\n';
  
  return sql;
}

// Function to convert customers to SQL INSERT statements
function customersToSQL(customers) {
  if (customers.length === 0) {
    return '';
  }
  
  let sql = '-- 3. CUSTOMER DATA INSERT STATEMENTS\n';
  sql += '-- =============================================\n';
  sql += '-- Total customers: ' + customers.length + '\n\n';
  
  // Get all possible columns from the first customer
  const allColumns = Object.keys(customers[0]);
  
  sql += '-- Optional: Clear existing customer data\n';
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
  sql += '-- End of customer data\n\n';
  
  return sql;
}

// Function to convert devices to SQL INSERT statements
function devicesToSQL(devices) {
  if (devices.length === 0) {
    return '';
  }
  
  let sql = '-- 4. DEVICE DATA INSERT STATEMENTS\n';
  sql += '-- =============================================\n';
  sql += '-- Total devices: ' + devices.length + '\n\n';
  
  // Get all possible columns from the first device
  const allColumns = Object.keys(devices[0]);
  
  sql += '-- Optional: Clear existing device data\n';
  sql += '-- DELETE FROM devices;\n\n';
  
  sql += '-- Insert device data\n';
  sql += 'INSERT INTO devices (\n';
  sql += '  ' + allColumns.join(',\n  ') + '\n';
  sql += ') VALUES\n';
  
  // Add device data rows
  devices.forEach((device, index) => {
    const values = allColumns.map(column => {
      return escapeSQLValue(device[column]);
    });
    
    sql += '  (' + values.join(', ') + ')';
    
    if (index < devices.length - 1) {
      sql += ',';
    }
    
    sql += '\n';
  });
  
  sql += ';\n\n';
  sql += '-- End of device data\n\n';
  
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

// Function to normalize device data
function normalizeDeviceData(device) {
  return {
    id: device.id || '',
    customer_id: device.customer_id || '',
    brand: device.brand || '',
    model: device.model || '',
    serial_number: device.serial_number || '',
    issue_description: device.issue_description || '',
    status: device.status || 'pending',
    assigned_to: device.assigned_to || '',
    expected_return_date: device.expected_return_date || '',
    created_at: device.created_at || '',
    updated_at: device.updated_at || '',
    device_type: device.device_type || 'phone',
    repair_cost: device.repair_cost || '',
    deposit_amount: device.deposit_amount || '',
    device_cost: device.device_cost || '',
    diagnosis_required: device.diagnosis_required || false,
    device_notes: device.device_notes || '',
    device_condition: device.device_condition || '',
    imei: device.imei || '',
    is_internal: device.is_internal || false,
    department: device.department || '',
    location: device.location || '',
    created_by: device.created_by || '',
    condition: device.condition || '',
    power_status: device.power_status || '',
    notes: device.notes || '',
    purchase_type: device.purchase_type || 'repair',
    purchase_price: device.purchase_price || '',
    estimated_hours: device.estimated_hours || '',
    warranty_start: device.warranty_start || '',
    warranty_end: device.warranty_end || '',
    warranty_status: device.warranty_status || '',
    repair_count: device.repair_count || 0,
    priority_level: device.priority_level || '',
    issue_type: device.issue_type || '',
    labor_cost: device.labor_cost || '',
    parts_cost: device.parts_cost || '',
    payment_status: device.payment_status || '',
    symptoms: device.symptoms || '',
    possible_causes: device.possible_causes || '',
    additional_notes: device.additional_notes || ''
  };
}

// Main function
function createCompleteSQL() {
  try {
    console.log('🚀 Starting complete SQL file generation...');

    const customers = backupData.data.customers;
    const devices = backupData.data.devices;
    
    console.log(`📈 Found ${customers.length} customers and ${devices.length} devices in backup`);

    if (customers.length === 0 && devices.length === 0) {
      console.log('❌ No data found in backup file');
      return;
    }

    // Create complete SQL content
    let sqlContent = createTableStructureSQL();
    
    if (customers.length > 0) {
      const normalizedCustomers = customers.map(normalizeCustomerData);
      sqlContent += customersToSQL(normalizedCustomers);
    }
    
    if (devices.length > 0) {
      const normalizedDevices = devices.map(normalizeDeviceData);
      sqlContent += devicesToSQL(normalizedDevices);
    }
    
    // Add final verification queries
    sqlContent += '-- 5. VERIFICATION QUERIES\n';
    sqlContent += '-- =============================================\n\n';
    sqlContent += '-- Verify customer count\n';
    sqlContent += 'SELECT COUNT(*) as total_customers FROM customers;\n\n';
    sqlContent += '-- Verify device count\n';
    sqlContent += 'SELECT COUNT(*) as total_devices FROM devices;\n\n';
    sqlContent += '-- Show customer statistics\n';
    sqlContent += 'SELECT city, COUNT(*) as customer_count FROM customers GROUP BY city ORDER BY customer_count DESC LIMIT 10;\n\n';
    sqlContent += '-- Show device status breakdown\n';
    sqlContent += 'SELECT status, COUNT(*) as device_count FROM devices GROUP BY status ORDER BY device_count DESC;\n\n';
    sqlContent += '-- Show top device brands\n';
    sqlContent += 'SELECT brand, COUNT(*) as device_count FROM devices GROUP BY brand ORDER BY device_count DESC LIMIT 10;\n\n';
    sqlContent += '-- End of complete SQL script\n';
    
    // Write SQL file
    const sqlFilePath = '/Users/mtaasisi/Downloads/complete_database_restore.sql';
    fs.writeFileSync(sqlFilePath, sqlContent, 'utf8');
    
    console.log(`✅ Complete SQL file created successfully: ${sqlFilePath}`);
    console.log(`📊 SQL contains:`);
    console.log(`   - Table structure queries`);
    console.log(`   - ${customers.length} customer INSERT statements`);
    console.log(`   - ${devices.length} device INSERT statements`);
    console.log(`   - Verification queries`);
    
    // Show file size
    const stats = fs.statSync(sqlFilePath);
    console.log(`📁 File size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    console.log('\n🎉 Complete SQL file is ready for use!');
    console.log('💡 You can now:');
    console.log('   - Run this SQL in your Supabase SQL editor');
    console.log('   - Use it to restore your complete database');
    console.log('   - Modify the SQL before running');
    console.log('   - The script includes table structure queries for reference');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the conversion
createCompleteSQL(); 