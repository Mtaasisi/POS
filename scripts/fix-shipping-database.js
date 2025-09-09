// Script to fix shipping database issues
import { supabase } from '../src/lib/supabaseClient.ts';

async function fixShippingDatabase() {
  console.log('🔧 Fixing shipping database issues...\n');

  try {
    // Step 1: Check current table structure
    console.log('1. Checking current table structure...');
    
    const { data: tables, error: tablesError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('lats_shipping_agents', 'lats_shipping_carriers', 'lats_purchase_orders')
        ORDER BY table_name;
      `
    });

    if (tablesError) {
      console.log('❌ Error checking tables:', tablesError.message);
      return;
    }

    console.log('✅ Found tables:', tables.map(t => t.table_name).join(', '));

    // Step 2: Check purchase orders shipping columns
    console.log('\n2. Checking purchase orders shipping columns...');
    
    const { data: poColumns, error: poColumnsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'lats_purchase_orders' 
        AND table_schema = 'public'
        AND column_name IN ('shipping_info', 'shipping_date', 'tracking_number', 'shipping_status')
        ORDER BY column_name;
      `
    });

    if (poColumnsError) {
      console.log('❌ Error checking purchase orders columns:', poColumnsError.message);
      return;
    }

    console.log('✅ Purchase orders shipping columns:');
    poColumns.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // Step 3: Add missing columns to purchase orders
    console.log('\n3. Adding missing columns to purchase orders...');
    
    const missingColumns = ['shipping_info', 'shipping_date'];
    const existingColumns = poColumns.map(col => col.column_name);
    
    for (const column of missingColumns) {
      if (!existingColumns.includes(column)) {
        console.log(`   Adding column: ${column}`);
        
        let alterSQL = '';
        if (column === 'shipping_info') {
          alterSQL = `ALTER TABLE lats_purchase_orders ADD COLUMN ${column} JSONB DEFAULT '{}';`;
        } else if (column === 'shipping_date') {
          alterSQL = `ALTER TABLE lats_purchase_orders ADD COLUMN ${column} TIMESTAMP WITH TIME ZONE;`;
        }
        
        const { error: alterError } = await supabase.rpc('exec_sql', { sql: alterSQL });
        
        if (alterError) {
          console.log(`   ❌ Error adding column ${column}:`, alterError.message);
        } else {
          console.log(`   ✅ Added column: ${column}`);
        }
      } else {
        console.log(`   ✅ Column ${column} already exists`);
      }
    }

    // Step 4: Check shipping agents table
    console.log('\n4. Checking shipping agents table...');
    
    const { data: agentsColumns, error: agentsColumnsError } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'lats_shipping_agents' 
        AND table_schema = 'public'
        ORDER BY column_name;
      `
    });

    if (agentsColumnsError) {
      console.log('❌ Error checking shipping agents columns:', agentsColumnsError.message);
      console.log('   This might mean the table doesn\'t exist yet');
    } else {
      console.log('✅ Shipping agents columns:');
      agentsColumns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }

    // Step 5: Test shipping assignment
    console.log('\n5. Testing shipping assignment...');
    
    // Get a sample purchase order
    const { data: orders, error: ordersError } = await supabase
      .from('lats_purchase_orders')
      .select('id, order_number, status')
      .limit(1);

    if (ordersError) {
      console.log('❌ Error fetching purchase orders:', ordersError.message);
      return;
    }

    if (orders.length === 0) {
      console.log('⚠️  No purchase orders found to test with');
      return;
    }

    const testOrder = orders[0];
    console.log(`   Testing with order: ${testOrder.order_number} (${testOrder.id})`);

    // Test shipping info update
    const testShippingInfo = {
      agentId: 'test-agent-id',
      trackingNumber: 'TEST-' + Date.now(),
      estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      cost: 150.00,
      notes: 'Test shipping assignment',
      carrier: 'Test Carrier'
    };

    const { data: updateResult, error: updateError } = await supabase
      .from('lats_purchase_orders')
      .update({
        status: 'shipped',
        shipping_info: testShippingInfo,
        shipping_date: new Date().toISOString(),
        tracking_number: testShippingInfo.trackingNumber,
        shipping_status: 'shipped',
        estimated_delivery: testShippingInfo.estimatedDelivery,
        shipping_notes: testShippingInfo.notes
      })
      .eq('id', testOrder.id)
      .select()
      .single();

    if (updateError) {
      console.log('❌ Error updating shipping info:', updateError.message);
      console.log('   Error details:', updateError);
      return;
    }

    console.log('✅ Shipping assignment test successful!');
    console.log('   Updated order status:', updateResult.status);
    console.log('   Tracking number:', updateResult.tracking_number);
    console.log('   Shipping info present:', !!updateResult.shipping_info);

    console.log('\n🎉 Shipping database fix completed successfully!');

  } catch (error) {
    console.error('❌ Unexpected error during fix:', error);
  }
}

// Run the fix
fixShippingDatabase();
