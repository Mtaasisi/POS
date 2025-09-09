// Script to validate shipment data against database requirements
import { createClient } from '@supabase/supabase-js';

// Create Supabase client directly
const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

// The shipment data you provided
const shipmentData = {
  "carrier": "Unknown Carrier",
  "trackingNumber": "TRK4495130640ZD",
  "method": "Standard",
  "cost": 0,
  "notes": "",
  "agentId": "",
  "agent": null,
  "managerId": "",
  "estimatedDelivery": "",
  "shippedDate": "",
  "deliveredDate": "",
  "portOfLoading": "",
  "portOfDischarge": "",
  "pricePerCBM": 0,
  "enableInsurance": false,
  "requireSignature": false,
  "cargoBoxes": []
};

async function validateShipmentData() {
  console.log('🔍 Validating shipment data...\n');

  const validationResults = {
    isValid: true,
    errors: [],
    warnings: [],
    suggestions: []
  };

  // Check required fields from your shipment data
  console.log('📋 Checking required fields:');
  
  // Check tracking number (required)
  if (!shipmentData.trackingNumber || shipmentData.trackingNumber.trim() === '') {
    validationResults.errors.push('Missing required field: trackingNumber');
    validationResults.isValid = false;
    console.log('❌ Missing: trackingNumber');
  } else {
    console.log('✅ Present: trackingNumber');
  }
  
  // Check carrier (required but can be fixed)
  if (!shipmentData.carrier || shipmentData.carrier === 'Unknown Carrier') {
    validationResults.warnings.push('Carrier needs to be specified (currently "Unknown Carrier")');
    console.log('⚠️ Warning: Carrier is unknown');
  } else {
    console.log('✅ Present: carrier');
  }


  // Check agent assignment
  if (!shipmentData.agentId && !shipmentData.agent) {
    validationResults.warnings.push('No agent assigned - shipment will need an agent');
    console.log('⚠️ Warning: No agent assigned');
  } else {
    console.log('✅ Agent information present');
  }

  // Check carrier information
  if (shipmentData.carrier === 'Unknown Carrier') {
    validationResults.warnings.push('Carrier is set to "Unknown Carrier" - should be a specific carrier');
    console.log('⚠️ Warning: Carrier is unknown');
  } else {
    console.log('✅ Carrier specified');
  }

  // Check database availability
  console.log('\n🔍 Checking database resources...');

  try {
    // Check carriers
    const { data: carriers, error: carriersError } = await supabase
      .from('lats_shipping_carriers')
      .select('id, name, is_active')
      .eq('is_active', true);

    if (carriersError) {
      validationResults.errors.push(`Error checking carriers: ${carriersError.message}`);
      validationResults.isValid = false;
      console.log('❌ Error checking carriers:', carriersError.message);
    } else if (!carriers || carriers.length === 0) {
      validationResults.errors.push('No active carriers found in database');
      validationResults.isValid = false;
      console.log('❌ No active carriers found');
    } else {
      console.log(`✅ Found ${carriers.length} active carriers`);
      validationResults.suggestions.push(`Available carriers: ${carriers.map(c => c.name).join(', ')}`);
    }

    // Check agents
    const { data: agents, error: agentsError } = await supabase
      .from('lats_shipping_agents')
      .select('id, name, company, is_active')
      .eq('is_active', true);

    if (agentsError) {
      validationResults.errors.push(`Error checking agents: ${agentsError.message}`);
      validationResults.isValid = false;
      console.log('❌ Error checking agents:', agentsError.message);
    } else if (!agents || agents.length === 0) {
      validationResults.warnings.push('No active agents found in database');
      console.log('⚠️ No active agents found');
    } else {
      console.log(`✅ Found ${agents.length} active agents`);
      validationResults.suggestions.push(`Available agents: ${agents.map(a => a.name).join(', ')}`);
    }

    // Check purchase orders
    const { data: purchaseOrders, error: poError } = await supabase
      .from('lats_purchase_orders')
      .select('id, order_number, status')
      .eq('status', 'pending')
      .limit(5);

    if (poError) {
      validationResults.errors.push(`Error checking purchase orders: ${poError.message}`);
      validationResults.isValid = false;
      console.log('❌ Error checking purchase orders:', poError.message);
    } else if (!purchaseOrders || purchaseOrders.length === 0) {
      validationResults.warnings.push('No pending purchase orders found to link shipment');
      console.log('⚠️ No pending purchase orders found');
    } else {
      console.log(`✅ Found ${purchaseOrders.length} pending purchase orders`);
      validationResults.suggestions.push(`Available purchase orders: ${purchaseOrders.map(po => po.order_number).join(', ')}`);
    }

  } catch (error) {
    validationResults.errors.push(`Database connection error: ${error.message}`);
    validationResults.isValid = false;
    console.log('❌ Database connection error:', error.message);
  }

  // Summary
  console.log('\n📊 Validation Summary:');
  console.log(`Overall Status: ${validationResults.isValid ? '✅ VALID' : '❌ INVALID'}`);
  
  if (validationResults.errors.length > 0) {
    console.log('\n❌ Errors:');
    validationResults.errors.forEach(error => console.log(`  - ${error}`));
  }

  if (validationResults.warnings.length > 0) {
    console.log('\n⚠️ Warnings:');
    validationResults.warnings.forEach(warning => console.log(`  - ${warning}`));
  }

  if (validationResults.suggestions.length > 0) {
    console.log('\n💡 Suggestions:');
    validationResults.suggestions.forEach(suggestion => console.log(`  - ${suggestion}`));
  }

  // Recommendations
  console.log('\n🔧 Recommendations:');
  if (!validationResults.isValid) {
    console.log('1. Run the fix-shipment-data.js script to automatically fix the data');
    console.log('2. Ensure you have at least one active carrier and agent in the database');
    console.log('3. Create a purchase order if none exist');
  } else {
    console.log('✅ Data is valid and ready to be saved');
  }

  return validationResults;
}

// Run the validation
validateShipmentData();
