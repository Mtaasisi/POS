#!/usr/bin/env node

/**
 * Check existing purchase orders in the database
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

async function checkPurchaseOrders() {
  console.log('🔍 Checking existing purchase orders...\n');
  
  try {
    // Get all purchase orders
    const { data: orders, error } = await supabase
      .from('lats_purchase_orders')
      .select('id, order_number, status, created_at, supplier_id')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.error('❌ Error fetching purchase orders:', error);
      return;
    }
    
    if (!orders || orders.length === 0) {
      console.log('📭 No purchase orders found in the database');
      return;
    }
    
    console.log(`📋 Found ${orders.length} purchase orders:`);
    orders.forEach((order, index) => {
      console.log(`${index + 1}. ID: ${order.id}`);
      console.log(`   Order Number: ${order.order_number}`);
      console.log(`   Status: ${order.status}`);
      console.log(`   Created: ${order.created_at}`);
      console.log(`   Supplier ID: ${order.supplier_id}`);
      console.log('');
    });
    
    // Check if the specific order ID exists
    const targetId = '286e5379-4508-4645-be6e-64a275d028ee';
    const targetOrder = orders.find(order => order.id === targetId);
    
    if (targetOrder) {
      console.log(`✅ Target order ${targetId} found:`, targetOrder);
    } else {
      console.log(`❌ Target order ${targetId} not found in the database`);
      console.log('Available order IDs:');
      orders.forEach(order => console.log(`  - ${order.id}`));
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkPurchaseOrders().catch(console.error);
