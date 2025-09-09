// Script to check and fix shipping-related database tables and fields
import { supabase } from '../src/lib/supabaseClient.ts';

async function checkAndFixShipping() {
  console.log('🚢 Checking and fixing shipping database structure...\n');

  try {
    // Step 1: Check if shipping tables exist
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name LIKE 'lats_shipping%'
        ORDER BY table_name;
      `
    });

    if (tablesError) {
      console.log('❌ Error checking tables:', tablesError.message);
      return;
    }

    console.log('📋 Found shipping tables:', tables.map(t => t.table_name));

    // Step 2: Check lats_shipping_info table structure
    const { data: shippingInfoColumns, error: shippingInfoError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'lats_shipping_info' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    });

    if (shippingInfoError) {
      console.log('❌ Error checking lats_shipping_info columns:', shippingInfoError.message);
    } else {
      console.log('\n📊 Current lats_shipping_info columns:');
      shippingInfoColumns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'}) ${col.column_default ? `default: ${col.column_default}` : ''}`);
      });
    }

    // Step 3: Check lats_purchase_orders shipping_info column
    const { data: poColumns, error: poError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'lats_purchase_orders' 
        AND table_schema = 'public'
        AND column_name LIKE '%shipping%'
        ORDER BY ordinal_position;
      `
    });

    if (poError) {
      console.log('❌ Error checking purchase_orders shipping columns:', poError.message);
    } else {
      console.log('\n📦 Purchase orders shipping columns:');
      if (poColumns.length === 0) {
        console.log('  - No shipping columns found in purchase_orders table');
      } else {
        poColumns.forEach(col => {
          console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
        });
      }
    }

    // Step 4: Add missing shipping_info column to purchase_orders if needed
    if (poColumns.length === 0 || !poColumns.some(col => col.column_name === 'shipping_info')) {
      console.log('\n🔧 Adding shipping_info column to purchase_orders...');
      
      const { error: addColumnError } = await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE lats_purchase_orders 
          ADD COLUMN IF NOT EXISTS shipping_info JSONB DEFAULT '{}';
        `
      });

      if (addColumnError) {
        console.log('❌ Error adding shipping_info column:', addColumnError.message);
      } else {
        console.log('✅ Added shipping_info column to purchase_orders');
      }

      // Add GIN index for JSONB queries
      const { error: indexError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE INDEX IF NOT EXISTS idx_purchase_orders_shipping_info_gin 
          ON lats_purchase_orders USING GIN (shipping_info);
        `
      });

      if (indexError) {
        console.log('❌ Error creating index:', indexError.message);
      } else {
        console.log('✅ Created GIN index for shipping_info');
      }
    }

    // Step 5: Check and add missing fields to shipping_info table
    const requiredShippingFields = [
      { name: 'shipping_method', type: 'TEXT', default: "'Standard'" },
      { name: 'port_of_loading', type: 'TEXT', default: 'NULL' },
      { name: 'port_of_discharge', type: 'TEXT', default: 'NULL' },
      { name: 'price_per_cbm', type: 'DECIMAL(10,2)', default: '0' },
      { name: 'cargo_boxes', type: 'JSONB', default: "'[]'" },
      { name: 'shipping_date', type: 'DATE', default: 'NULL' },
      { name: 'delivery_date', type: 'DATE', default: 'NULL' }
    ];

    const existingShippingFields = shippingInfoColumns.map(col => col.column_name);
    const missingShippingFields = requiredShippingFields.filter(field => 
      !existingShippingFields.includes(field.name)
    );

    if (missingShippingFields.length > 0) {
      console.log('\n🔧 Adding missing fields to lats_shipping_info...');
      
      for (const field of missingShippingFields) {
        const { error: alterError } = await supabase.rpc('exec_sql', {
          sql: `ALTER TABLE lats_shipping_info ADD COLUMN IF NOT EXISTS ${field.name} ${field.type} DEFAULT ${field.default};`
        });
        
        if (alterError) {
          console.log(`❌ Error adding column ${field.name}:`, alterError.message);
        } else {
          console.log(`✅ Added column: ${field.name}`);
        }
      }
    } else {
      console.log('✅ All required shipping fields exist');
    }

    // Step 6: Check for sample shipping data and validate structure
    const { data: sampleShipping, error: sampleError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT shipping_info 
        FROM lats_purchase_orders 
        WHERE shipping_info IS NOT NULL 
        AND shipping_info != '{}'::jsonb
        LIMIT 1;
      `
    });

    if (sampleError) {
      console.log('❌ Error checking sample shipping data:', sampleError.message);
    } else if (sampleShipping && sampleShipping.length > 0) {
      console.log('\n📋 Sample shipping data structure:');
      console.log(JSON.stringify(sampleShipping[0].shipping_info, null, 2));
      
      // Validate the structure
      const shippingData = sampleShipping[0].shipping_info;
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
                       (typeof value === 'object' && Object.keys(value).length === 0);
        
        console.log(`  ${hasField ? '✅' : '❌'} ${field}: ${hasField ? (isEmpty ? 'empty' : 'has value') : 'missing'}`);
      });
    } else {
      console.log('\n📋 No sample shipping data found');
    }

    // Step 7: Create a sample shipping data structure with all required fields
    console.log('\n📝 Sample complete shipping data structure:');
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

    console.log('\n✅ Shipping database check and fix completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the check
checkAndFixShipping();
