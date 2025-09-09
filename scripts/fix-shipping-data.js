// Script to fix shipping data structure with proper defaults
import { createClient } from '@supabase/supabase-js';

// Create supabase client
const supabase = createClient(
  'https://jxhzveborezjhsmzsgbc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
);

// Function to create complete shipping data structure
function createCompleteShippingData(partialData = {}) {
  const defaults = {
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

  // Merge with provided data, keeping existing values
  return { ...defaults, ...partialData };
}

// Function to fix shipping data in database
async function fixShippingData() {
  console.log('🔧 Fixing shipping data structure in database...\n');

  try {
    // Get all purchase orders with shipping_info
    const { data: purchaseOrders, error: fetchError } = await supabase
      .from('lats_purchase_orders')
      .select('id, shipping_info')
      .not('shipping_info', 'is', null);

    if (fetchError) {
      console.log('❌ Error fetching purchase orders:', fetchError.message);
      return;
    }

    console.log(`📋 Found ${purchaseOrders.length} purchase orders with shipping info`);

    let fixedCount = 0;
    let errorCount = 0;

    for (const po of purchaseOrders) {
      try {
        const currentShippingInfo = po.shipping_info || {};
        const fixedShippingInfo = createCompleteShippingData(currentShippingInfo);

        // Check if any fields were actually fixed
        const needsUpdate = Object.keys(fixedShippingInfo).some(key => 
          !currentShippingInfo.hasOwnProperty(key) || 
          currentShippingInfo[key] === undefined
        );

        if (needsUpdate) {
          const { error: updateError } = await supabase
            .from('lats_purchase_orders')
            .update({ shipping_info: fixedShippingInfo })
            .eq('id', po.id);

          if (updateError) {
            console.log(`❌ Error updating PO ${po.id}:`, updateError.message);
            errorCount++;
          } else {
            console.log(`✅ Fixed shipping data for PO ${po.id}`);
            fixedCount++;
          }
        } else {
          console.log(`⏭️  PO ${po.id} already has complete shipping data`);
        }
      } catch (error) {
        console.log(`❌ Error processing PO ${po.id}:`, error.message);
        errorCount++;
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`  ✅ Fixed: ${fixedCount} purchase orders`);
    console.log(`  ❌ Errors: ${errorCount} purchase orders`);
    console.log(`  📋 Total processed: ${purchaseOrders.length} purchase orders`);

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Function to show the fixed data structure
function showFixedDataStructure() {
  console.log('📝 Fixed shipping data structure:');
  
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

  const fixedData = createCompleteShippingData(originalData);
  
  console.log(JSON.stringify(fixedData, null, 2));

  console.log('\n🔍 Changes made:');
  const changes = [];
  
  Object.keys(fixedData).forEach(key => {
    if (!originalData.hasOwnProperty(key)) {
      changes.push(`➕ Added: ${key} = ${JSON.stringify(fixedData[key])}`);
    } else if (originalData[key] !== fixedData[key]) {
      changes.push(`🔄 Changed: ${key} = ${JSON.stringify(originalData[key])} → ${JSON.stringify(fixedData[key])}`);
    }
  });

  if (changes.length === 0) {
    console.log('  No changes needed - data structure is already complete');
  } else {
    changes.forEach(change => console.log(`  ${change}`));
  }
}

// Main function
async function main() {
  console.log('🚢 Shipping Data Fixer\n');
  
  // Show the fixed data structure
  showFixedDataStructure();
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Ask if user wants to fix the database
  console.log('Do you want to fix the shipping data in the database?');
  console.log('This will update all purchase orders with incomplete shipping data.');
  console.log('Type "yes" to proceed, or anything else to skip:');
  
  // For script usage, we'll just show the structure
  // In a real scenario, you'd want to add user input handling
  console.log('\n💡 To fix the database, run: node scripts/fix-shipping-data.js --fix');
  
  // Check if --fix flag is provided
  const args = process.argv.slice(2);
  if (args.includes('--fix')) {
    await fixShippingData();
  } else {
    console.log('\n⏭️  Skipping database update. Use --fix flag to update the database.');
  }
}

// Run the script
main();
