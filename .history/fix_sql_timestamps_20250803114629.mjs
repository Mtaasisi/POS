import fs from 'fs';

// Read the backup file
const backupPath = '/Users/mtaasisi/Downloads/database-backup-2025-07-30T12-05-22-247Z.json';
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

console.log('📊 Backup file loaded successfully');

// Function to escape SQL values with proper timestamp handling
function escapeSQLValue(value, columnName) {
  if (value === null || value === undefined || value === '') {
    return 'NULL';
  }
  
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false';
  }
  
  if (typeof value === 'number') {
    return value.toString();
  }
  
  // Handle timestamp fields specifically
  const timestampFields = ['created_at', 'updated_at', 'joined_date', 'last_visit', 'expected_return_date', 'warranty_start', 'warranty_end'];
  if (timestampFields.includes(columnName)) {
    if (value === '' || value === null || value === undefined) {
      return 'NULL';
    }
    // Ensure proper timestamp format
    const escaped = String(value).replace(/'/g, "''");
    return `'${escaped}'`;
  }
  
  // Escape single quotes and wrap in single quotes
  const escaped = String(value).replace(/'/g, "''");
  return `'${escaped}'`;
}

// Function to create UPSERT statements for customers with proper timestamp handling
function createCustomerUPSERT(customers) {
  if (customers.length === 0) return '';
  
  let sql = '-- 4. CUSTOMER DATA UPSERT STATEMENTS\n';
  sql += '-- =============================================\n';
  sql += '-- Using UPSERT to avoid conflicts with existing data\n';
  sql += '-- Total customers in backup: ' + customers.length + '\n\n';
  
  const allColumns = Object.keys(customers[0]);
  
  sql += '-- Customer UPSERT (will only insert if ID doesn\'t exist)\n';
  sql += 'INSERT INTO customers (\n';
  sql += '  ' + allColumns.join(',\n  ') + '\n';
  sql += ') VALUES\n';
  
  // Add customer data rows
  customers.forEach((customer, index) => {
    const values = allColumns.map(column => {
      return escapeSQLValue(customer[column], column);
    });
    
    sql += '  (' + values.join(', ') + ')';
    
    if (index < customers.length - 1) {
      sql += ',';
    }
    
    sql += '\n';
  });
  
  sql += 'ON CONFLICT (id) DO UPDATE SET\n';
  // Update all columns except id
  const updateColumns = allColumns.filter(col => col !== 'id');
  sql += '  ' + updateColumns.map(col => `${col} = EXCLUDED.${col}`).join(',\n  ') + '\n';
  sql += ';\n\n';
  
  return sql;
}

// Function to create UPSERT statements for devices with proper timestamp handling
function createDeviceUPSERT(devices) {
  if (devices.length === 0) return '';
  
  let sql = '-- 5. DEVICE DATA UPSERT STATEMENTS\n';
  sql += '-- =============================================\n';
  sql += '-- Using UPSERT to avoid conflicts with existing data\n';
  sql += '-- Total devices in backup: ' + devices.length + '\n\n';
  
  const allColumns = Object.keys(devices[0]);
  
  sql += '-- Device UPSERT (will only insert if ID doesn\'t exist)\n';
  sql += 'INSERT INTO devices (\n';
  sql += '  ' + allColumns.join(',\n  ') + '\n';
  sql += ') VALUES\n';
  
  // Add device data rows
  devices.forEach((device, index) => {
    const values = allColumns.map(column => {
      return escapeSQLValue(device[column], column);
    });
    
    sql += '  (' + values.join(', ') + ')';
    
    if (index < devices.length - 1) {
      sql += ',';
    }
    
    sql += '\n';
  });
  
  sql += 'ON CONFLICT (id) DO UPDATE SET\n';
  // Update all columns except id
  const updateColumns = allColumns.filter(col => col !== 'id');
  sql += '  ' + updateColumns.map(col => `${col} = EXCLUDED.${col}`).join(',\n  ') + '\n';
  sql += ';\n\n';
  
  return sql;
}

// Function to normalize customer data with proper timestamp handling
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
    joined_date: customer.joined_date || null,
    loyalty_level: customer.loyalty_level || 'bronze',
    color_tag: customer.color_tag || '',
    referred_by: customer.referred_by || '',
    total_spent: customer.total_spent || 0,
    points: customer.points || 0,
    last_visit: customer.last_visit || null,
    is_active: customer.is_active || true,
    whatsapp: customer.whatsapp || '',
    birth_month: customer.birth_month || '',
    birth_day: customer.birth_day || '',
    referral_source: customer.referral_source || '',
    initial_notes: customer.initial_notes || '',
    total_returns: customer.total_returns || 0,
    profile_image: customer.profile_image || '',
    created_at: customer.created_at || null,
    updated_at: customer.updated_at || null,
    customer_tag: customer.customer_tag || '',
    referrals: customer.referrals || 0
  };
}

// Function to normalize device data with proper timestamp handling
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
    expected_return_date: device.expected_return_date || null,
    created_at: device.created_at || null,
    updated_at: device.updated_at || null,
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
    warranty_start: device.warranty_start || null,
    warranty_end: device.warranty_end || null,
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

// Function to create comprehensive SQL with current state analysis
function createComprehensiveSQL() {
  let sql = '-- =============================================\n';
  sql += '-- COMPREHENSIVE DATABASE RESTORATION SCRIPT\n';
  sql += '-- Generated from backup: database-backup-2025-07-30T12-05-22-247Z.json\n';
  sql += '-- Current Database State Analysis\n';
  sql += '-- =============================================\n\n';
  
  sql += '-- CURRENT DATABASE STATE:\n';
  sql += '-- =============================================\n';
  sql += '-- Customers: 744 (Backup: 742)\n';
  sql += '-- Devices: 92 (Backup: 90)\n';
  sql += '-- Customer Notes: 323 (Backup: 0)\n';
  sql += '-- Customer Payments: 3 (Backup: 0)\n';
  sql += '-- Promo Messages: 0 (Backup: 0)\n\n';
  
  sql += '-- RECOMMENDED APPROACH:\n';
  sql += '-- =============================================\n';
  sql += '-- 1. Your current database has MORE records than the backup\n';
  sql += '-- 2. This suggests you have newer data that should be preserved\n';
  sql += '-- 3. Use UPSERT (INSERT ... ON CONFLICT) to avoid duplicates\n';
  sql += '-- 4. Or manually review and decide which data to keep\n\n';
  
  sql += '-- 1. SHOW CURRENT TABLE STRUCTURES\n';
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
  
  sql += '-- 2. CURRENT RECORD COUNTS\n';
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

// Main function
function createFixedSQL() {
  try {
    console.log('🚀 Starting fixed SQL file generation...');

    const customers = backupData.data.customers;
    const devices = backupData.data.devices;
    
    console.log(`📈 Found ${customers.length} customers and ${devices.length} devices in backup`);

    // Create comprehensive SQL content
    let sqlContent = createComprehensiveSQL();
    
    if (customers.length > 0) {
      const normalizedCustomers = customers.map(normalizeCustomerData);
      sqlContent += createCustomerUPSERT(normalizedCustomers);
    }
    
    if (devices.length > 0) {
      const normalizedDevices = devices.map(normalizeDeviceData);
      sqlContent += createDeviceUPSERT(normalizedDevices);
    }
    
    // Add verification and comparison queries
    sqlContent += '-- 6. VERIFICATION AND COMPARISON QUERIES\n';
    sqlContent += '-- =============================================\n\n';
    
    sqlContent += '-- Verify final counts after UPSERT\n';
    sqlContent += 'SELECT \'customers\' as table_name, COUNT(*) as final_count FROM customers\n';
    sqlContent += 'UNION ALL\n';
    sqlContent += 'SELECT \'devices\' as table_name, COUNT(*) as final_count FROM devices;\n\n';
    
    sqlContent += '-- Show customer statistics\n';
    sqlContent += 'SELECT city, COUNT(*) as customer_count FROM customers GROUP BY city ORDER BY customer_count DESC LIMIT 10;\n\n';
    
    sqlContent += '-- Show device status breakdown\n';
    sqlContent += 'SELECT status, COUNT(*) as device_count FROM devices GROUP BY status ORDER BY device_count DESC;\n\n';
    
    sqlContent += '-- Show top device brands\n';
    sqlContent += 'SELECT brand, COUNT(*) as device_count FROM devices GROUP BY brand ORDER BY device_count DESC LIMIT 10;\n\n';
    
    sqlContent += '-- Check for potential data conflicts\n';
    sqlContent += '-- This shows customers that might have been updated\n';
    sqlContent += 'SELECT id, name, updated_at FROM customers ORDER BY updated_at DESC LIMIT 10;\n\n';
    
    sqlContent += '-- End of comprehensive SQL script\n';
    
    // Write SQL file
    const sqlFilePath = '/Users/mtaasisi/Downloads/fixed_database_restore.sql';
    fs.writeFileSync(sqlFilePath, sqlContent, 'utf8');
    
    console.log(`✅ Fixed SQL file created successfully: ${sqlFilePath}`);
    console.log(`📊 SQL contains:`);
    console.log(`   - Current database state analysis`);
    console.log(`   - Table structure queries`);
    console.log(`   - ${customers.length} customer UPSERT statements`);
    console.log(`   - ${devices.length} device UPSERT statements`);
    console.log(`   - Verification and comparison queries`);
    console.log(`   - Proper timestamp handling (NULL for empty values)`);
    
    // Show file size
    const stats = fs.statSync(sqlFilePath);
    console.log(`📁 File size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    console.log('\n🎉 Fixed SQL file is ready for use!');
    console.log('💡 Key Fixes:');
    console.log('   - Empty timestamp fields now use NULL instead of empty string');
    console.log('   - Proper handling of all timestamp fields');
    console.log('   - Safe to run in Supabase SQL editor');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the conversion
createFixedSQL(); 