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

// Function to convert devices to SQL INSERT statements
function devicesToSQL(devices) {
  if (devices.length === 0) {
    return '';
  }
  
  let sql = '-- Device Data INSERT Statements\n';
  sql += '-- Generated from backup: database-backup-2025-07-30T12-05-22-247Z.json\n';
  sql += '-- Total devices: ' + devices.length + '\n\n';
  
  // Get all possible columns from the first device
  const allColumns = Object.keys(devices[0]);
  
  sql += '-- First, clear existing device data (optional)\n';
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
  sql += '-- End of device data\n';
  
  return sql;
}

// Function to normalize device data (only include basic fields that exist in current schema)
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
function createDevicesSQL() {
  try {
    console.log('🚀 Starting device data to SQL conversion...');

    const devices = backupData.data.devices;
    console.log(`📈 Found ${devices.length} devices in backup`);

    if (devices.length === 0) {
      console.log('❌ No devices found in backup file');
      return;
    }

    // Normalize device data (only include fields that exist in current schema)
    const normalizedDevices = devices.map(normalizeDeviceData);
    console.log(`✅ Normalized ${normalizedDevices.length} devices`);

    // Convert to SQL
    const sqlContent = devicesToSQL(normalizedDevices);
    
    // Write SQL file
    const sqlFilePath = '/Users/mtaasisi/Downloads/devices_insert.sql';
    fs.writeFileSync(sqlFilePath, sqlContent, 'utf8');
    
    console.log(`✅ Device SQL file created successfully: ${sqlFilePath}`);
    console.log(`📊 SQL contains ${normalizedDevices.length} device INSERT statements`);
    
    // Show sample SQL
    console.log('\n📄 Sample SQL (first 3 devices):');
    const lines = sqlContent.split('\n');
    lines.slice(0, 20).forEach((line, index) => {
      console.log(`Line ${index + 1}: ${line}`);
    });

    // Show device statistics
    console.log('\n📊 Device Statistics:');
    const statusCounts = {};
    const brandCounts = {};
    const customerCounts = {};
    
    normalizedDevices.forEach(device => {
      statusCounts[device.status] = (statusCounts[device.status] || 0) + 1;
      brandCounts[device.brand] = (brandCounts[device.brand] || 0) + 1;
      customerCounts[device.customer_id] = (customerCounts[device.customer_id] || 0) + 1;
    });

    console.log(`📱 Device Status Breakdown:`);
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`   ${status}: ${count} devices`);
    });

    console.log(`🏷️  Top Brands:`);
    Object.entries(brandCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .forEach(([brand, count]) => {
        console.log(`   ${brand}: ${count} devices`);
      });

    console.log(`👥 Unique Customers with Devices: ${Object.keys(customerCounts).length}`);

    console.log('\n🎉 Device SQL file is ready for use!');
    console.log('💡 You can now:');
    console.log('   - Run this SQL in your Supabase SQL editor');
    console.log('   - Use it to restore device data');
    console.log('   - Modify the SQL before running');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the conversion
createDevicesSQL(); 