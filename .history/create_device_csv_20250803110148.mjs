import fs from 'fs';

// Read the backup file
const backupPath = '/Users/mtaasisi/Downloads/database-backup-2025-07-30T12-05-22-247Z.json';
const backupData = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

console.log('📊 Backup file loaded successfully');

// Function to convert devices to CSV format
function devicesToCSV(devices) {
  if (devices.length === 0) {
    return '';
  }
  
  // Get headers from first device
  const headers = Object.keys(devices[0]);
  
  // Create CSV header
  let csv = headers.join(',') + '\n';
  
  // Add device data rows
  devices.forEach(device => {
    const row = headers.map(header => {
      const value = device[header];
      // Handle null/undefined values
      if (value === null || value === undefined) {
        return '';
      }
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
function createDeviceCSV() {
  try {
    console.log('🚀 Starting device data to CSV conversion...');

    const devices = backupData.data.devices;
    console.log(`📈 Found ${devices.length} devices in backup`);

    if (devices.length === 0) {
      console.log('❌ No devices found in backup file');
      return;
    }

    // Normalize device data (only include fields that exist in current schema)
    const normalizedDevices = devices.map(normalizeDeviceData);
    console.log(`✅ Normalized ${normalizedDevices.length} devices`);

    // Convert to CSV
    const csvContent = devicesToCSV(normalizedDevices);
    
    // Write CSV file
    const csvFilePath = '/Users/mtaasisi/Downloads/devices_update.csv';
    fs.writeFileSync(csvFilePath, csvContent, 'utf8');
    
    console.log(`✅ Device CSV file created successfully: ${csvFilePath}`);
    console.log(`📊 CSV contains ${normalizedDevices.length} device records`);
    console.log(`📋 CSV headers: ${Object.keys(normalizedDevices[0]).join(', ')}`);
    
    // Show sample data
    console.log('\n📄 Sample device CSV data (first 3 rows):');
    const lines = csvContent.split('\n');
    lines.slice(0, 4).forEach((line, index) => {
      console.log(`Row ${index}: ${line.substring(0, 100)}${line.length > 100 ? '...' : ''}`);
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

    console.log('\n🎉 Device CSV file is ready for use!');
    console.log('💡 You can now:');
    console.log('   - Open the CSV in Excel/Google Sheets');
    console.log('   - Modify device data as needed');
    console.log('   - Use the CSV for bulk device updates');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the conversion
createDeviceCSV(); 