import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🧪 Testing form submission process...');

async function testFormSubmission() {
  try {
    // Get a valid customer first
    const { data: customers, error: customerError } = await supabase
      .from('customers')
      .select('id, name, phone')
      .limit(1);

    if (customerError || !customers || customers.length === 0) {
      console.error('❌ No customers found:', customerError);
      return;
    }

    const testCustomer = customers[0];
    console.log('👤 Using customer:', testCustomer.name, testCustomer.id);

    // Simulate the exact form data that would be created
    const formData = {
      brand: 'Apple',
      model: 'iPhone 15',
      serialNumber: 'TEST123456789',
      issueDescription: 'Screen cracked and not responding to touch',
      repairCost: '',
      depositAmount: '',
      diagnosisRequired: false,
      expectedReturnDate: new Date().toISOString().split('T')[0],
      unlockCode: '',
      deviceNotes: '',
      deviceCost: '',
      assignedTo: '', // This might be the issue
    };

    const imeiOrSerial = 'TEST123456789';
    const selectedCustomer = testCustomer;
    const selectedConditions = ['screenCracked'];
    const otherConditionText = '';

    // Simulate the exact newDevice object creation from the form
    const extractedBrand = formData.brand || 'Apple';
    
    const newDevice = {
      brand: extractedBrand,
      model: formData.model,
      serialNumber: imeiOrSerial,
      unlockCode: formData.unlockCode,
      customerId: selectedCustomer?.id,
      customerName: selectedCustomer?.name || '',
      phoneNumber: selectedCustomer?.phone || '',
      expectedReturnDate: formData.expectedReturnDate,
      status: 'assigned',
      issueDescription: formData.issueDescription,
      conditions: selectedConditions,
      otherText: otherConditionText,
      depositAmount: undefined, // showDepositField && !formData.diagnosisRequired ? formData.depositAmount : undefined,
      repairCost: formData.repairCost,
      assignedTo: formData.assignedTo, // This might be empty string
      createdBy: 'test-user-id', // This might be the issue
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    console.log('📋 Form data:', formData);
    console.log('📱 New device object:', newDevice);

    // Test validation
    console.log('\n🔍 Validation checks:');
    console.log('  - Customer selected:', !!selectedCustomer);
    console.log('  - Brand:', !!newDevice.brand);
    console.log('  - Model:', !!newDevice.model);
    console.log('  - Serial:', !!newDevice.serialNumber);
    console.log('  - Issue description:', !!newDevice.issueDescription);
    console.log('  - Assigned to:', !!newDevice.assignedTo);
    console.log('  - Expected return date:', !!newDevice.expectedReturnDate);
    console.log('  - Conditions:', selectedConditions.length > 0);

    // Check for potential issues
    if (!newDevice.assignedTo) {
      console.log('⚠️  WARNING: assignedTo is empty - this might cause issues');
    }

    if (!newDevice.createdBy) {
      console.log('⚠️  WARNING: createdBy is missing - this might cause issues');
    }

    // Try to create the device using the same logic as addDeviceToDb
    const dbDevice = {
      id: crypto.randomUUID(),
      customer_id: newDevice.customerId,
      brand: newDevice.brand,
      model: newDevice.model,
      serial_number: newDevice.serialNumber,
      issue_description: newDevice.issueDescription,
      status: newDevice.status,
      assigned_to: newDevice.assignedTo || null,
      expected_return_date: newDevice.expectedReturnDate === '' ? null : newDevice.expectedReturnDate,
      created_at: newDevice.createdAt,
      updated_at: newDevice.updatedAt,
      unlock_code: newDevice.unlockCode || null,
      repair_cost: newDevice.repairCost || null,
      deposit_amount: newDevice.depositAmount || null,
      diagnosis_required: false,
      device_notes: null,
      device_cost: null,
      estimated_hours: null,
      device_condition: null,
    };

    console.log('\n🗄️  Database device object:', dbDevice);

    // Try to insert
    const { data: deviceData, error: deviceError } = await supabase
      .from('devices')
      .insert([dbDevice])
      .select();

    if (deviceError) {
      console.error('❌ Error creating device:', deviceError);
      console.error('Error details:', {
        message: deviceError.message,
        details: deviceError.details,
        hint: deviceError.hint,
        code: deviceError.code
      });
    } else {
      console.log('✅ Device created successfully!');
      console.log('📱 Device ID:', deviceData[0].id);
      
      // Clean up
      await supabase.from('devices').delete().eq('id', deviceData[0].id);
      console.log('🧹 Test device cleaned up');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testFormSubmission();
