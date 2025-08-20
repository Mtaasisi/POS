const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugTechnicianDeviceAccess() {
  console.log('🔍 Debugging technician device access...');
  
  try {
    // Step 1: Check if the technician user exists
    console.log('\n📝 Step 1: Checking technician user...');
    const technicianId = '9838a65b-e373-4d0a-bdfe-790304e9e3ea';
    
    const { data: user, error: userError } = await supabase
      .from('auth_users')
      .select('*')
      .eq('id', technicianId)
      .single();
    
    if (userError) {
      console.error('❌ User not found:', userError);
      return;
    }
    
    console.log('✅ Technician user found:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    });

    // Step 2: Check devices assigned to this technician
    console.log('\n📝 Step 2: Checking devices assigned to technician...');
    const { data: assignedDevices, error: devicesError } = await supabase
      .from('devices')
      .select(`
        id,
        customer_id,
        brand,
        model,
        serial_number,
        issue_description,
        status,
        assigned_to,
        created_at,
        customers(id, name, phone)
      `)
      .eq('assigned_to', technicianId);
    
    if (devicesError) {
      console.error('❌ Error fetching assigned devices:', devicesError);
      return;
    }
    
    console.log(`✅ Found ${assignedDevices.length} devices assigned to technician:`);
    assignedDevices.forEach((device, index) => {
      console.log(`  ${index + 1}. ${device.brand} ${device.model} (${device.id})`);
      console.log(`     Status: ${device.status}`);
      console.log(`     Customer: ${device.customers?.name || 'Unknown'}`);
      console.log(`     Created: ${device.created_at}`);
    });

    // Step 3: Check if technician can access any device details
    if (assignedDevices.length > 0) {
      console.log('\n📝 Step 3: Testing device detail access...');
      const testDeviceId = assignedDevices[0].id;
      
      const { data: deviceDetail, error: detailError } = await supabase
        .from('devices')
        .select(`
          *,
          customers(*),
          device_remarks(*),
          device_transitions(*),
          device_ratings(*)
        `)
        .eq('id', testDeviceId)
        .single();
      
      if (detailError) {
        console.error('❌ Error accessing device details:', detailError);
      } else {
        console.log('✅ Device details accessible:', {
          id: deviceDetail.id,
          brand: deviceDetail.brand,
          model: deviceDetail.model,
          status: deviceDetail.status,
          customer: deviceDetail.customers?.name,
          remarks_count: deviceDetail.device_remarks?.length || 0,
          transitions_count: deviceDetail.device_transitions?.length || 0
        });
      }
    }

    // Step 4: Check RLS policies on devices table
    console.log('\n📝 Step 4: Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          schemaname,
          tablename,
          policyname,
          permissive,
          roles,
          cmd,
          qual,
          with_check
        FROM pg_policies 
        WHERE tablename = 'devices'
        ORDER BY policyname;
      `
    });
    
    if (policiesError) {
      console.log('⚠️ Could not check RLS policies:', policiesError.message);
    } else {
      console.log('📋 RLS Policies on devices table:');
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.cmd} (${policy.roles})`);
      });
    }

    // Step 5: Test direct device access without RLS
    console.log('\n📝 Step 5: Testing direct device access...');
    if (assignedDevices.length > 0) {
      const testDeviceId = assignedDevices[0].id;
      
      // Try to access device with service role (bypasses RLS)
      const { data: directDevice, error: directError } = await supabase
        .from('devices')
        .select('*')
        .eq('id', testDeviceId)
        .single();
      
      if (directError) {
        console.error('❌ Direct access failed:', directError);
      } else {
        console.log('✅ Direct access successful:', {
          id: directDevice.id,
          brand: directDevice.brand,
          model: directDevice.model,
          assigned_to: directDevice.assigned_to
        });
      }
    }

    // Step 6: Check if there are any devices in the system
    console.log('\n📝 Step 6: Checking total devices in system...');
    const { count: totalDevices, error: countError } = await supabase
      .from('devices')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.error('❌ Error counting devices:', countError);
    } else {
      console.log(`📊 Total devices in system: ${totalDevices}`);
      console.log(`📊 Devices assigned to technician: ${assignedDevices.length}`);
      console.log(`📊 Unassigned devices: ${totalDevices - assignedDevices.length}`);
    }

    console.log('\n🎉 Diagnostic complete!');
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
  }
}

// Run the diagnostic
debugTechnicianDeviceAccess();
