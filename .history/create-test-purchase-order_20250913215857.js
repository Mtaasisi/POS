#!/usr/bin/env node

/**
 * Create a test purchase order for debugging
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createTestPurchaseOrder() {
  console.log('🔧 Creating test purchase order...\n');
  
  try {
    // First, check if we have any suppliers
    const { data: suppliers, error: supplierError } = await supabase
      .from('lats_suppliers')
      .select('id, name')
      .limit(1);
    
    if (supplierError) {
      console.error('❌ Error fetching suppliers:', supplierError);
      return;
    }
    
    if (!suppliers || suppliers.length === 0) {
      console.log('📭 No suppliers found. Creating a test supplier first...');
      
      const { data: newSupplier, error: createSupplierError } = await supabase
        .from('lats_suppliers')
        .insert({
          name: 'Test Supplier',
          contact_person: 'Test Contact',
          email: 'test@supplier.com',
          phone: '+255123456789',
          address: 'Test Address, Dar es Salaam'
        })
        .select()
        .single();
      
      if (createSupplierError) {
        console.error('❌ Error creating test supplier:', createSupplierError);
        return;
      }
      
      console.log('✅ Test supplier created:', newSupplier);
      suppliers.push(newSupplier);
    }
    
    const supplierId = suppliers[0].id;
    console.log(`📦 Using supplier: ${suppliers[0].name} (${supplierId})`);
    
    // Create a test purchase order
    const { data: purchaseOrder, error: createError } = await supabase
      .from('lats_purchase_orders')
      .insert({
        supplier_id: supplierId,
        status: 'draft',
        total_amount: 100000,
        expected_delivery: '2024-02-15',
        notes: 'Test purchase order for debugging',
        created_by: null // We'll set this to null for now to avoid auth issues
      })
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating purchase order:', createError);
      return;
    }
    
    console.log('✅ Test purchase order created:', {
      id: purchaseOrder.id,
      order_number: purchaseOrder.order_number,
      status: purchaseOrder.status,
      supplier_id: purchaseOrder.supplier_id
    });
    
    // Now test updating it
    console.log('\n🧪 Testing update functionality...');
    const { data: updatedOrder, error: updateError } = await supabase
      .from('lats_purchase_orders')
      .update({
        status: 'sent',
        shipping_status: 'preparing',
        tracking_number: 'TEST123',
        updated_at: new Date().toISOString()
      })
      .eq('id', purchaseOrder.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Update test failed:', updateError);
    } else {
      console.log('✅ Update test successful:', {
        id: updatedOrder.id,
        status: updatedOrder.status,
        shipping_status: updatedOrder.shipping_status,
        tracking_number: updatedOrder.tracking_number
      });
    }
    
    console.log('\n📋 Next steps:');
    console.log(`1. Use this purchase order ID in your application: ${purchaseOrder.id}`);
    console.log('2. Test the update functionality with this ID');
    console.log('3. If updates work, the issue was with the missing purchase order');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createTestPurchaseOrder().catch(console.error);
