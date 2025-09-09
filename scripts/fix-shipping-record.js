/**
 * Fix Incomplete Shipping Record Script
 * 
 * This script fixes the incomplete shipping record with tracking number TRK32501039OYAV
 * by populating missing fields with appropriate default values and available data.
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixShippingRecord() {
  console.log('🔧 Starting shipping record fix for TRK32501039OYAV...\n');

  try {
    // 1. Find the shipping record
    console.log('📋 Step 1: Finding shipping record...');
    const { data: shippingRecord, error: findError } = await supabase
      .from('lats_shipping_info')
      .select('*')
      .eq('tracking_number', 'TRK32501039OYAV')
      .single();

    if (findError) {
      console.error('❌ Error finding shipping record:', findError);
      return;
    }

    if (!shippingRecord) {
      console.error('❌ Shipping record not found with tracking number TRK32501039OYAV');
      return;
    }

    console.log('✅ Found shipping record:', {
      id: shippingRecord.id,
      status: shippingRecord.status,
      carrier_id: shippingRecord.carrier_id,
      agent_id: shippingRecord.agent_id,
      manager_id: shippingRecord.manager_id
    });

    // 2. Get available carriers
    console.log('\n📋 Step 2: Finding available carriers...');
    const { data: carriers, error: carriersError } = await supabase
      .from('lats_shipping_carriers')
      .select('*')
      .eq('is_active', true)
      .limit(1);

    if (carriersError) {
      console.error('❌ Error fetching carriers:', carriersError);
      return;
    }

    const defaultCarrier = carriers && carriers.length > 0 ? carriers[0] : null;
    console.log('✅ Available carriers:', carriers?.length || 0);
    if (defaultCarrier) {
      console.log('   - Using carrier:', defaultCarrier.name);
    }

    // 3. Get available agents
    console.log('\n📋 Step 3: Finding available agents...');
    const { data: agents, error: agentsError } = await supabase
      .from('lats_shipping_agents')
      .select('*')
      .eq('is_active', true)
      .limit(1);

    if (agentsError) {
      console.error('❌ Error fetching agents:', agentsError);
      return;
    }

    const defaultAgent = agents && agents.length > 0 ? agents[0] : null;
    console.log('✅ Available agents:', agents?.length || 0);
    if (defaultAgent) {
      console.log('   - Using agent:', defaultAgent.name);
    }

    // 4. Get available managers
    console.log('\n📋 Step 4: Finding available managers...');
    const { data: managers, error: managersError } = await supabase
      .from('lats_shipping_managers')
      .select('*')
      .eq('is_active', true)
      .limit(1);

    if (managersError) {
      console.error('❌ Error fetching managers:', managersError);
      return;
    }

    const defaultManager = managers && managers.length > 0 ? managers[0] : null;
    console.log('✅ Available managers:', managers?.length || 0);
    if (defaultManager) {
      console.log('   - Using manager:', defaultManager.name);
    }

    // 5. Prepare update data
    console.log('\n📋 Step 5: Preparing update data...');
    const updateData = {
      // Fix carrier if missing
      carrier_id: shippingRecord.carrier_id || defaultCarrier?.id || null,
      
      // Fix agent if missing
      agent_id: shippingRecord.agent_id || defaultAgent?.id || null,
      
      // Fix manager if missing
      manager_id: shippingRecord.manager_id || defaultManager?.id || null,
      
      // Set appropriate status
      status: shippingRecord.status === 'shipped' ? 'in_transit' : shippingRecord.status,
      
      // Set shipping dates if missing
      estimated_delivery: shippingRecord.estimated_delivery || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
      
      // Set cost if zero
      cost: shippingRecord.cost || 0,
      
      // Set shipping method
      shipping_method: shippingRecord.shipping_method || 'standard',
      
      // Set origin and destination based on user preferences
      shipping_origin: shippingRecord.shipping_origin || 'Supplier Location',
      shipping_destination: shippingRecord.shipping_destination || 'Dar es Salaam, Tanzania',
      
      // Add notes
      notes: shippingRecord.notes || 'Shipping record updated and completed',
      
      // Update timestamp
      updated_at: new Date().toISOString()
    };

    console.log('✅ Update data prepared:', {
      carrier_id: updateData.carrier_id,
      agent_id: updateData.agent_id,
      manager_id: updateData.manager_id,
      status: updateData.status,
      estimated_delivery: updateData.estimated_delivery,
      shipping_origin: updateData.shipping_origin,
      shipping_destination: updateData.shipping_destination
    });

    // 6. Update the shipping record
    console.log('\n📋 Step 6: Updating shipping record...');
    const { data: updatedRecord, error: updateError } = await supabase
      .from('lats_shipping_info')
      .update(updateData)
      .eq('id', shippingRecord.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating shipping record:', updateError);
      return;
    }

    console.log('✅ Shipping record updated successfully!');
    console.log('📊 Updated record details:', {
      id: updatedRecord.id,
      tracking_number: updatedRecord.tracking_number,
      status: updatedRecord.status,
      carrier_id: updatedRecord.carrier_id,
      agent_id: updatedRecord.agent_id,
      manager_id: updatedRecord.manager_id,
      estimated_delivery: updatedRecord.estimated_delivery,
      cost: updatedRecord.cost,
      shipping_origin: updatedRecord.shipping_origin,
      shipping_destination: updatedRecord.shipping_destination
    });

    // 7. Create initial tracking event
    console.log('\n📋 Step 7: Creating initial tracking event...');
    const trackingEvent = {
      shipping_id: updatedRecord.id,
      status: updatedRecord.status,
      description: `Shipment ${updatedRecord.status.replace('_', ' ')} - Record updated and completed`,
      location: updatedRecord.shipping_origin || 'Origin',
      timestamp: new Date().toISOString(),
      notes: 'Initial tracking event created during record fix',
      is_automated: true
    };

    const { data: eventData, error: eventError } = await supabase
      .from('lats_shipping_events')
      .insert(trackingEvent)
      .select()
      .single();

    if (eventError) {
      console.warn('⚠️ Warning: Could not create tracking event:', eventError);
    } else {
      console.log('✅ Initial tracking event created:', eventData.id);
    }

    console.log('\n🎉 Shipping record fix completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   - Tracking Number: ${updatedRecord.tracking_number}`);
    console.log(`   - Status: ${updatedRecord.status}`);
    console.log(`   - Carrier: ${defaultCarrier?.name || 'Not assigned'}`);
    console.log(`   - Agent: ${defaultAgent?.name || 'Not assigned'}`);
    console.log(`   - Manager: ${defaultManager?.name || 'Not assigned'}`);
    console.log(`   - Estimated Delivery: ${updatedRecord.estimated_delivery}`);
    console.log(`   - Origin: ${updatedRecord.shipping_origin}`);
    console.log(`   - Destination: ${updatedRecord.shipping_destination}`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
fixShippingRecord()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
