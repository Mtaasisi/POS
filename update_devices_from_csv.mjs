import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

// Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

// Function to parse CSV file
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];
  
  const headers = lines[0].split(',').map(h => h.trim());
  const devices = [];
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length === headers.length) {
      const device = {};
      headers.forEach((header, index) => {
        device[header] = values[index];
      });
      devices.push(device);
    }
  }
  
  return devices;
}

// Function to parse a single CSV line
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  let i = 0;
  
  while (i < line.length) {
    const char = line[i];
    
    if (char === '"' && (i === 0 || line[i-1] !== '\\')) {
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

// Function to update devices from CSV
async function updateDevicesFromCSV(devices) {
  const totalDevices = devices.length;
  let updatedCount = 0;
  let errorCount = 0;
  const errors = [];

  console.log(`🔄 Starting to update ${totalDevices} devices from CSV`);

  for (let i = 0; i < totalDevices; i++) {
    const device = devices[i];
    const deviceNumber = i + 1;

    if (deviceNumber % 10 === 0) {
      console.log(`📦 Processing device ${deviceNumber}/${totalDevices}`);
    }

    try {
      // Convert string values to appropriate types
      const processedDevice = {
        customer_id: device.customer_id || null,
        brand: device.brand || '',
        model: device.model || '',
        serial_number: device.serial_number || '',
        issue_description: device.issue_description || '',
        status: device.status || 'pending',
        assigned_to: device.assigned_to || null,
        expected_return_date: device.expected_return_date || null,
        device_type: device.device_type || 'phone',
        repair_cost: device.repair_cost ? parseFloat(device.repair_cost) : null,
        deposit_amount: device.deposit_amount ? parseFloat(device.deposit_amount) : null,
        device_cost: device.device_cost ? parseFloat(device.device_cost) : null,
        diagnosis_required: device.diagnosis_required === 'true' || device.diagnosis_required === true,
        device_notes: device.device_notes || null,
        device_condition: device.device_condition || null,
        imei: device.imei || null,
        is_internal: device.is_internal === 'true' || device.is_internal === true,
        department: device.department || null,
        location: device.location || null,
        created_by: device.created_by || null,
        condition: device.condition || null,
        power_status: device.power_status || null,
        notes: device.notes || null,
        purchase_type: device.purchase_type || 'repair',
        purchase_price: device.purchase_price ? parseFloat(device.purchase_price) : null,
        estimated_hours: device.estimated_hours ? parseFloat(device.estimated_hours) : null,
        warranty_start: device.warranty_start || null,
        warranty_end: device.warranty_end || null,
        warranty_status: device.warranty_status || null,
        repair_count: device.repair_count ? parseInt(device.repair_count) : 0,
        priority_level: device.priority_level || null,
        issue_type: device.issue_type || null,
        labor_cost: device.labor_cost ? parseFloat(device.labor_cost) : null,
        parts_cost: device.parts_cost ? parseFloat(device.parts_cost) : null,
        payment_status: device.payment_status || null,
        symptoms: device.symptoms || null,
        possible_causes: device.possible_causes || null,
        additional_notes: device.additional_notes || null,
        updated_at: new Date().toISOString()
      };

      // Update device
      const { data, error } = await supabase
        .from('devices')
        .update(processedDevice)
        .eq('id', device.id);

      if (error) {
        console.error(`❌ Error updating device ${deviceNumber}:`, error);
        errorCount++;
        errors.push({ device: deviceNumber, id: device.id, error: error.message });
      } else {
        updatedCount++;
      }

      // Add a small delay between operations
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error) {
      console.error(`❌ Exception updating device ${deviceNumber}:`, error);
      errorCount++;
      errors.push({ device: deviceNumber, id: device.id, error: error.message });
    }
  }

  return { updatedCount, errorCount, errors };
}

// Main function
async function updateDevicesFromCSVFile() {
  try {
    console.log('🚀 Starting device CSV to database update...');

    // Read CSV file
    const csvFilePath = '/Users/mtaasisi/Downloads/devices_update.csv';
    const csvContent = fs.readFileSync(csvFilePath, 'utf8');
    
    console.log('📊 Device CSV file loaded successfully');

    // Parse CSV
    const devices = parseCSV(csvContent);
    console.log(`✅ Parsed ${devices.length} devices from CSV`);

    if (devices.length === 0) {
      console.log('❌ No devices found in CSV file');
      return;
    }

    // Update devices from CSV
    const result = await updateDevicesFromCSV(devices);

    console.log('\n📊 Device Update Summary:');
    console.log(`✅ Successfully updated: ${result.updatedCount} devices`);
    console.log(`❌ Errors: ${result.errorCount} devices`);
    
    if (result.errors.length > 0) {
      console.log('\n❌ Error Details (first 10):');
      result.errors.slice(0, 10).forEach(error => {
        console.log(`  Device ${error.device} (ID: ${error.id}): ${error.error}`);
      });
      if (result.errors.length > 10) {
        console.log(`  ... and ${result.errors.length - 10} more errors`);
      }
    }

    // Verify the update
    console.log('\n🔍 Verifying device update...');
    const { count, error: countError } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting devices:', countError);
    } else {
      console.log(`📈 Total devices in database after update: ${count}`);
    }

    // Show device status breakdown
    console.log('\n📊 Device Status Breakdown:');
    const { data: deviceStatuses, error: statusError } = await supabase
      .from('devices')
      .select('status');

    if (!statusError && deviceStatuses) {
      const statusCounts = {};
      deviceStatuses.forEach(device => {
        statusCounts[device.status] = (statusCounts[device.status] || 0) + 1;
      });

      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count} devices`);
      });
    }

    console.log('\n🎉 Device CSV to database update completed!');

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the update
updateDevicesFromCSVFile(); 