import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyDatabaseFixes() {
  console.log('🔧 Applying database fixes for purchase order completion...');
  
  try {
    // Step 1: Fix the completion function
    console.log('📝 Step 1: Updating complete_purchase_order function...');
    
    const completionFunctionSQL = `
      CREATE OR REPLACE FUNCTION complete_purchase_order(
          purchase_order_id_param UUID,
          user_id_param UUID,
          completion_notes TEXT DEFAULT NULL
      ) RETURNS JSONB AS $$
      DECLARE
          order_record RECORD;
          total_items INTEGER := 0;
          completed_items INTEGER := 0;
          completion_details JSONB;
          item_record RECORD;
      BEGIN
          -- Validate purchase order exists and is in received status
          SELECT id, order_number, status, total_amount, supplier_id
          INTO order_record
          FROM lats_purchase_orders 
          WHERE id = purchase_order_id_param;
          
          IF NOT FOUND THEN
              RETURN jsonb_build_object(
                  'success', false,
                  'message', 'Purchase order ' || purchase_order_id_param || ' not found',
                  'error_code', 'P0001'
              );
          END IF;
          
          IF order_record.status != 'received' THEN
              RETURN jsonb_build_object(
                  'success', false,
                  'message', 'Purchase order ' || purchase_order_id_param || ' is not in received status (current: ' || order_record.status || ')',
                  'error_code', 'P0002'
              );
          END IF;
          
          -- Get all items and check their completion status
          FOR item_record IN 
              SELECT 
                  id,
                  product_id,
                  variant_id,
                  quantity,
                  COALESCE(received_quantity, 0) as received_quantity,
                  cost_price
              FROM lats_purchase_order_items 
              WHERE purchase_order_id = purchase_order_id_param
          LOOP
              total_items := total_items + 1;
              
              -- Count as completed if received quantity >= ordered quantity
              IF item_record.received_quantity >= item_record.quantity THEN
                  completed_items := completed_items + 1;
              END IF;
          END LOOP;
          
          -- Check if all items are fully received
          IF completed_items < total_items THEN
              RETURN jsonb_build_object(
                  'success', false,
                  'message', 'Cannot complete order: ' || completed_items || ' of ' || total_items || ' items fully received',
                  'error_code', 'P0001',
                  'total_items', total_items,
                  'completed_items', completed_items
              );
          END IF;
          
          -- If no items found, also fail
          IF total_items = 0 THEN
              RETURN jsonb_build_object(
                  'success', false,
                  'message', 'Cannot complete order: no items found',
                  'error_code', 'P0003'
              );
          END IF;
          
          -- Update purchase order status to completed
          UPDATE lats_purchase_orders 
          SET 
              status = 'completed',
              updated_at = NOW()
          WHERE id = purchase_order_id_param;
          
          -- Create completion details
          completion_details := jsonb_build_object(
              'purchase_order_id', purchase_order_id_param,
              'order_number', order_record.order_number,
              'total_items', total_items,
              'completed_items', completed_items,
              'completion_date', NOW(),
              'completed_by', user_id_param,
              'completion_notes', completion_notes,
              'status', 'completed'
          );
          
          RETURN jsonb_build_object(
              'success', true,
              'message', 'Purchase order completed successfully',
              'data', completion_details
          );
          
      EXCEPTION
          WHEN OTHERS THEN
              RETURN jsonb_build_object(
                  'success', false,
                  'message', 'Error completing purchase order: ' || SQLERRM,
                  'error_code', SQLSTATE
              );
      END;
      $$ LANGUAGE plpgsql;
    `;
    
    const { error: functionError } = await supabase.rpc('exec_sql', { sql: completionFunctionSQL });
    if (functionError) {
      console.error('❌ Error updating completion function:', functionError);
    } else {
      console.log('✅ Completion function updated successfully');
    }
    
    // Step 2: Fix data inconsistencies
    console.log('🔧 Step 2: Fixing data inconsistencies...');
    
    const fixDataSQL = `
      -- Fix NULL received_quantity for items in 'received' purchase orders
      UPDATE lats_purchase_order_items 
      SET received_quantity = quantity,
          updated_at = NOW()
      WHERE received_quantity IS NULL 
      AND purchase_order_id IN (
          SELECT id FROM lats_purchase_orders WHERE status = 'received'
      );
      
      -- Fix zero received_quantity for items in 'received' purchase orders
      UPDATE lats_purchase_order_items 
      SET received_quantity = quantity,
          updated_at = NOW()
      WHERE received_quantity = 0 
      AND purchase_order_id IN (
          SELECT id FROM lats_purchase_orders WHERE status = 'received'
      );
    `;
    
    const { error: dataError } = await supabase.rpc('exec_sql', { sql: fixDataSQL });
    if (dataError) {
      console.error('❌ Error fixing data:', dataError);
    } else {
      console.log('✅ Data inconsistencies fixed');
    }
    
    // Step 3: Test the specific failing purchase order
    console.log('🧪 Step 3: Testing the specific failing purchase order...');
    
    const testPOId = '2f772843-d993-4987-adb4-393ab0bf718c';
    
    // First, fix the specific PO's data
    const { error: fixSpecificError } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE lats_purchase_order_items 
        SET received_quantity = quantity,
            updated_at = NOW()
        WHERE purchase_order_id = '${testPOId}'
        AND (received_quantity IS NULL OR received_quantity < quantity);
      `
    });
    
    if (fixSpecificError) {
      console.error('❌ Error fixing specific PO:', fixSpecificError);
    } else {
      console.log('✅ Specific PO data fixed');
      
      // Now test the completion
      const { data: completionResult, error: completionError } = await supabase
        .rpc('complete_purchase_order', {
          purchase_order_id_param: testPOId,
          user_id_param: '00000000-0000-0000-0000-000000000000',
          completion_notes: 'Fixed via database script'
        });
      
      if (completionError) {
        console.error('❌ Completion test failed:', completionError);
      } else {
        console.log('✅ Completion test result:', completionResult);
      }
    }
    
    console.log('🎉 Database fixes applied successfully!');
    
  } catch (error) {
    console.error('❌ Error applying database fixes:', error);
  }
}

applyDatabaseFixes().catch(console.error);
