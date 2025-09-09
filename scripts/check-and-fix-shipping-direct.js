// Script to check and fix shipping-related database tables and fields
import { createClient } from '@supabase/supabase-js';

// Create supabase client without types for script usage
const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

async function checkAndFixShipping() {
  console.log('🚢 Checking and fixing shipping database structure...\n');

  try {
    // Step 1: Check if purchase_orders table exists and has shipping_info column
    console.log('📋 Checking purchase_orders table...');
    
    try {
      const { data: poData, error: poError } = await supabase
        .from('lats_purchase_orders')
        .select('id, shipping_info')
        .limit(1);
      
      if (poError) {
        console.log('❌ Error accessing purchase_orders:', poError.message);
        return;
      }
      
      console.log('✅ purchase_orders table accessible');
      
      // Check if shipping_info column exists by trying to select it
      if (poData && poData.length > 0) {
        console.log('✅ shipping_info column exists');
        
        // Check for sample shipping data
        const { data: sampleData, error: sampleError } = await supabase
          .from('lats_purchase_orders')
          .select('shipping_info')
          .not('shipping_info', 'is', null)
          .not('shipping_info', 'eq', '{}')
          .limit(1);
        
        if (sampleError) {
          console.log('❌ Error checking sample shipping data:', sampleError.message);
        } else if (sampleData && sampleData.length > 0) {
          console.log('\n📋 Sample shipping data found:');
          console.log(JSON.stringify(sampleData[0].shipping_info, null, 2));
          
          // Validate the structure
          const shippingData = sampleData[0].shipping_info;
          const requiredFields = [
            'carrier', 'trackingNumber', 'method', 'cost', 'notes',
            'agentId', 'agent', 'managerId', 'estimatedDelivery',
            'shippedDate', 'deliveredDate', 'portOfLoading', 'portOfDischarge',
            'pricePerCBM', 'enableInsurance', 'requireSignature', 'cargoBoxes'
          ];

          console.log('\n🔍 Validating shipping data structure:');
          requiredFields.forEach(field => {
            const hasField = shippingData.hasOwnProperty(field);
            const value = shippingData[field];
            const isEmpty = value === null || value === undefined || value === '' || 
                           (Array.isArray(value) && value.length === 0) ||
                           (typeof value === 'object' && value !== null && Object.keys(value).length === 0);
            
            console.log(`  ${hasField ? '✅' : '❌'} ${field}: ${hasField ? (isEmpty ? 'empty' : 'has value') : 'missing'}`);
          });
        } else {
          console.log('📋 No sample shipping data found');
        }
      }
    } catch (error) {
      console.log('❌ Error checking purchase_orders:', error.message);
    }

    // Step 2: Check if shipping tables exist
    console.log('\n📋 Checking shipping tables...');
    
    try {
      const { data: agentsData, error: agentsError } = await supabase
        .from('lats_shipping_agents')
        .select('id')
        .limit(1);
      
      if (agentsError) {
        console.log('❌ lats_shipping_agents table not accessible:', agentsError.message);
      } else {
        console.log('✅ lats_shipping_agents table exists');
      }
    } catch (error) {
      console.log('❌ lats_shipping_agents table not found');
    }

    try {
      const { data: managersData, error: managersError } = await supabase
        .from('lats_shipping_managers')
        .select('id')
        .limit(1);
      
      if (managersError) {
        console.log('❌ lats_shipping_managers table not accessible:', managersError.message);
      } else {
        console.log('✅ lats_shipping_managers table exists');
      }
    } catch (error) {
      console.log('❌ lats_shipping_managers table not found');
    }

    try {
      const { data: carriersData, error: carriersError } = await supabase
        .from('lats_shipping_carriers')
        .select('id')
        .limit(1);
      
      if (carriersError) {
        console.log('❌ lats_shipping_carriers table not accessible:', carriersError.message);
      } else {
        console.log('✅ lats_shipping_carriers table exists');
      }
    } catch (error) {
      console.log('❌ lats_shipping_carriers table not found');
    }

    try {
      const { data: infoData, error: infoError } = await supabase
        .from('lats_shipping_info')
        .select('id')
        .limit(1);
      
      if (infoError) {
        console.log('❌ lats_shipping_info table not accessible:', infoError.message);
      } else {
        console.log('✅ lats_shipping_info table exists');
      }
    } catch (error) {
      console.log('❌ lats_shipping_info table not found');
    }

    // Step 3: Create a complete shipping data structure
    console.log('\n📝 Complete shipping data structure:');
    const completeShippingData = {
      carrier: "Unknown Carrier",
      carrierId: null,
      trackingNumber: "TRK4495130640ZD",
      method: "Standard",
      shippingMethod: "Standard",
      cost: 0,
      shippingCost: 0,
      notes: "",
      agentId: "",
      agent: null,
      managerId: "",
      manager: null,
      estimatedDelivery: "",
      actualDelivery: "",
      shippedDate: "",
      deliveredDate: "",
      portOfLoading: "",
      portOfDischarge: "",
      pricePerCBM: 0,
      enableInsurance: false,
      requireSignature: false,
      insuranceValue: 0,
      cargoBoxes: [],
      status: "pending",
      trackingEvents: []
    };

    console.log(JSON.stringify(completeShippingData, null, 2));

    // Step 4: Fix the provided shipping data
    console.log('\n🔧 Fixed shipping data structure:');
    const fixedShippingData = {
      carrier: "Unknown Carrier",
      carrierId: null,
      trackingNumber: "TRK4495130640ZD",
      method: "Standard",
      shippingMethod: "Standard",
      cost: 0,
      shippingCost: 0,
      notes: "",
      agentId: "",
      agent: null,
      managerId: "",
      manager: null,
      estimatedDelivery: "",
      actualDelivery: "",
      shippedDate: "",
      deliveredDate: "",
      portOfLoading: "",
      portOfDischarge: "",
      pricePerCBM: 0,
      enableInsurance: false,
      requireSignature: false,
      insuranceValue: 0,
      cargoBoxes: [],
      status: "pending",
      trackingEvents: []
    };

    console.log(JSON.stringify(fixedShippingData, null, 2));

    // Step 5: Show what fields were missing and added
    console.log('\n🔍 Analysis of your shipping data:');
    const originalData = {
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

    const missingFields = [];
    const emptyFields = [];

    Object.keys(completeShippingData).forEach(key => {
      if (!originalData.hasOwnProperty(key)) {
        missingFields.push(key);
      } else if (originalData[key] === null || originalData[key] === '' || 
                 (Array.isArray(originalData[key]) && originalData[key].length === 0)) {
        emptyFields.push(key);
      }
    });

    console.log(`\n📊 Missing fields (${missingFields.length}):`);
    missingFields.forEach(field => {
      console.log(`  ❌ ${field}: ${completeShippingData[field]}`);
    });

    console.log(`\n📊 Empty fields (${emptyFields.length}):`);
    emptyFields.forEach(field => {
      console.log(`  ⚠️  ${field}: "${originalData[field]}"`);
    });

    console.log('\n✅ Shipping database check completed!');
    console.log('\n💡 Recommendations:');
    console.log('1. Add missing fields to your shipping data structure');
    console.log('2. Populate empty fields with appropriate default values');
    console.log('3. Consider adding agent and manager information');
    console.log('4. Set proper estimated delivery dates');
    console.log('5. Add port information for international shipments');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkAndFixShipping();
