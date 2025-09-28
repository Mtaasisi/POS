import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkRepairSystem() {
  console.log('🔍 Checking Repair System Status...\n');
  
  try {
    // Check devices table structure
    console.log('1️⃣ Checking devices table structure...');
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('*')
      .limit(1);
    
    if (devicesError) {
      console.error('❌ Devices table error:', devicesError.message);
    } else {
      console.log('✅ Devices table accessible');
      if (devices && devices.length > 0) {
        const device = devices[0];
        console.log('📋 Device columns found:', Object.keys(device));
        console.log('🔧 Has repair_checklist:', !!device.repair_checklist);
        console.log('🔧 Has diagnostic_checklist:', !!device.diagnostic_checklist);
      }
    }
    
    // Check customer_payments table
    console.log('\n2️⃣ Checking customer_payments table...');
    const { data: payments, error: paymentsError } = await supabase
      .from('customer_payments')
      .select('*')
      .limit(1);
    
    if (paymentsError) {
      console.error('❌ Customer payments table error:', paymentsError.message);
    } else {
      console.log('✅ Customer payments table accessible');
      if (payments && payments.length > 0) {
        console.log('📋 Payment columns found:', Object.keys(payments[0]));
      }
    }
    
    // Check repair devices count
    console.log('\n3️⃣ Checking repair devices...');
    const { data: repairDevices, error: repairError } = await supabase
      .from('devices')
      .select('id, status, brand, model, repair_checklist')
      .not('status', 'in', '(done,failed)');
    
    if (repairError) {
      console.error('❌ Repair devices query error:', repairError.message);
    } else {
      console.log(`✅ Found ${repairDevices?.length || 0} active repair devices`);
      if (repairDevices && repairDevices.length > 0) {
        console.log('📋 Repair device statuses:', [...new Set(repairDevices.map(d => d.status))]);
        const withChecklist = repairDevices.filter(d => d.repair_checklist);
        console.log(`🔧 Devices with repair checklist: ${withChecklist.length}`);
      }
    }
    
    // Check device status flow
    console.log('\n4️⃣ Checking device status flow...');
    const { data: allDevices, error: allDevicesError } = await supabase
      .from('devices')
      .select('id, status, brand, model')
      .limit(10);
    
    if (allDevicesError) {
      console.error('❌ All devices query error:', allDevicesError.message);
    } else {
      console.log(`✅ Found ${allDevices?.length || 0} total devices`);
      if (allDevices && allDevices.length > 0) {
        const statusCounts = allDevices.reduce((acc, device) => {
          acc[device.status] = (acc[device.status] || 0) + 1;
          return acc;
        }, {});
        console.log('📊 Device status distribution:', statusCounts);
      }
    }
    
    console.log('\n✅ Repair system check complete!');
    
  } catch (error) {
    console.error('❌ Error checking repair system:', error);
  }
}

checkRepairSystem();
