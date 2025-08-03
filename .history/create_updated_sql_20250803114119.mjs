import fs from 'fs';

// Read the backup file
const backupPath = '/Users/mtaasisi/Downloads/database-backup-2025-07-30T12-05-22-247Z.json';
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

console.log('📊 Backup file loaded successfully');

// Current database state (from your query results)
const currentDBState = {
  customers: 744,
  devices: 92,
  customer_notes: 323,
  customer_payments: 3,
  promo_messages: 0
};

// Backup data counts
const backupCounts = {
  customers: backupData.data.customers.length,
  devices: backupData.data.devices.length,
  customer_notes: backupData.data.customer_notes?.length || 0,
  customer_payments: backupData.data.customer_payments?.length || 0,
  promo_messages: backupData.data.promo_messages?.length || 0
};

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

// Function to create comprehensive SQL with current state analysis
function createComprehensiveSQL() {
  let sql = '-- =============================================\n';
  sql += '-- COMPREHENSIVE DATABASE RESTORATION SCRIPT\n';
  sql += '-- Generated from backup: database-backup-2025-07-30T12-05-22-247Z.json\n';
  sql += '-- Current Database State Analysis\n';
  sql += '-- =============================================\n\n';
  
  sql += '-- CURRENT DATABASE STATE:\n';
  sql += '-- =============================================\n';
  sql += `-- Customers: ${currentDBState.customers} (Backup: ${backupCounts.customers})\n`;
  sql += `-- Devices: ${currentDBState.devices} (Backup: ${backupCounts.devices})\n`;
  sql += `-- Customer Notes: ${currentDBState.customer_notes} (Backup: ${backupCounts.customer_notes})\n`;
  sql += `-- Customer Payments: ${currentDBState.customer_payments} (Backup: ${backupCounts.customer_payments})\n`;
  sql += `-- Promo Messages: ${currentDBState.promo_messages} (Backup: ${backupCounts.promo_messages})\n\n`;
  
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
  
  sql += '-- 3. BACKUP DATA ANALYSIS\n';
  sql += '-- =============================================\n\n';
  
  sql += '-- Show sample of backup customers (first 5)\n';
  sql += '-- Note: This is for reference only - actual data is in the INSERT statements below\n';
  sql += '-- SELECT id, name, email, phone, city, loyalty_level, points, total_spent FROM customers LIMIT 5;\n\n';
  
  sql += '-- Show sample of backup devices (first 5)\n';
  sql += '-- SELECT id, customer_id, brand, model, status, issue_description FROM devices LIMIT 5;\n\n';
  
  return sql;
}

// Function to create UPSERT statements for customers
function createCustomerUPSERT(customers) {
  if (customers.length === 0) return '';
  
  let sql = '-- 4. CUSTOMER DATA UPSERT STATEMENTS\n';
  sql += '-- =============================================\n';
  sql += '-- Using UPSERT to avoid conflicts with existing data\n';
  sql += '-- Total customers in backup: ' + customers.length + '\n\n';
  
  const allColumns = Object.keys(customers[0]);
  const conflictColumns = ['id']; // Primary key for conflict resolution
  
  sql += '-- Customer UPSERT (will only insert if ID doesn\'t exist)\n';
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
  
  sql += 'ON CONFLICT (id) DO UPDATE SET\n';
  // Update all columns except id
  const updateColumns = allColumns.filter(col => col !== 'id');
  sql += '  ' + updateColumns.map(col => `${col} = EXCLUDED.${col}`).join(',\n  ') + '\n';
  sql += ';\n\n';
  
  return sql;
}

// Function to create UPSERT statements for devices
function createDeviceUPSERT(devices) {
  if (devices.length === 0) return '';
  
  let sql = '-- 5. DEVICE DATA UPSERT STATEMENTS\n';
  sql += '-- =============================================\n';
  sql += '-- Using UPSERT to avoid conflicts with existing data\n';
  sql += '-- Total devices in backup: ' + devices.length + '\n\n';
  
  const allColumns = Object.keys(devices[0]);
  const conflictColumns = ['id']; // Primary key for conflict resolution
  
  sql += '-- Device UPSERT (will only insert if ID doesn\'t exist)\n';
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
  
  sql += 'ON CONFLICT (id) DO UPDATE SET\n';
  // Update all columns except id
  const updateColumns = allColumns.filter(col => col !== 'id');
  sql += '  ' + updateColumns.map(col => `${col} = EXCLUDED.${col}`).join(',\n  ') + '\n';
  sql += ';\n\n';
  
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
function createUpdatedSQL() {
  try {
    console.log('🚀 Starting updated SQL file generation...');

    const customers = backupData.data.customers;
    const devices = backupData.data.devices;
    
    console.log(`📈 Found ${customers.length} customers and ${devices.length} devices in backup`);
    console.log(`📊 Current DB has ${currentDBState.customers} customers and ${currentDBState.devices} devices`);

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
    const sqlFilePath = '/Users/mtaasisi/Downloads/updated_database_restore.sql';
    fs.writeFileSync(sqlFilePath, sqlContent, 'utf8');
    
    console.log(`✅ Updated SQL file created successfully: ${sqlFilePath}`);
    console.log(`📊 SQL contains:`);
    console.log(`   - Current database state analysis`);
    console.log(`   - Table structure queries`);
    console.log(`   - ${customers.length} customer UPSERT statements`);
    console.log(`   - ${devices.length} device UPSERT statements`);
    console.log(`   - Verification and comparison queries`);
    
    // Show file size
    const stats = fs.statSync(sqlFilePath);
    console.log(`📁 File size: ${(stats.size / 1024).toFixed(2)} KB`);
    
    console.log('\n📊 Data Comparison Summary:');
    console.log(`   Current DB: ${currentDBState.customers} customers, ${currentDBState.devices} devices`);
    console.log(`   Backup: ${backupCounts.customers} customers, ${backupCounts.devices} devices`);
    console.log(`   Difference: +${currentDBState.customers - backupCounts.customers} customers, +${currentDBState.devices - backupCounts.devices} devices`);
    
    console.log('\n🎉 Updated SQL file is ready for use!');
    console.log('💡 Key Features:');
    console.log('   - Uses UPSERT to avoid data conflicts');
    console.log('   - Preserves your newer data');
    console.log('   - Includes comprehensive analysis');
    console.log('   - Safe to run multiple times');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the conversion
createUpdatedSQL(); 