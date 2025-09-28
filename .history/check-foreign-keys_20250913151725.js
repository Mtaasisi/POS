#!/usr/bin/env node

/**
 * Check Foreign Keys
 * 
 * This script checks if the foreign key constraints exist for the shipping tables
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkForeignKeys() {
  try {
    console.log('🔍 Checking foreign key constraints...');
    
    // Test the exact query that's failing
    console.log('📋 Testing the exact query from the error...');
    
    const purchaseOrderId = '82b41a32-9c95-4aed-a4f8-351a93028e4e';
    
    const { data, error } = await supabase
      .from('lats_shipping_info')
      .select(`
        *,
        carrier:lats_shipping_carriers(id, name, tracking_url),
        agent:lats_shipping_agents!lats_shipping_info_agent_id_fkey(id, name, company, phone, email, is_active),
        manager:lats_shipping_managers!lats_shipping_info_manager_id_fkey(id, name, department, phone, email)
      `)
      .eq('purchase_order_id', purchaseOrderId)
      .single();
    
    if (error) {
      console.error('❌ Query failed:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Error details:', error.details);
      console.error('Error hint:', error.hint);
    } else {
      console.log('✅ Query succeeded:', data);
    }
    
    // Try a simpler query without foreign key references
    console.log('\n📋 Testing simpler query without foreign key references...');
    
    const { data: simpleData, error: simpleError } = await supabase
      .from('lats_shipping_info')
      .select('*')
      .eq('purchase_order_id', purchaseOrderId)
      .single();
    
    if (simpleError) {
      console.error('❌ Simple query failed:', simpleError);
    } else {
      console.log('✅ Simple query succeeded:', simpleData);
    }
    
    // Try query with just carrier reference
    console.log('\n📋 Testing query with just carrier reference...');
    
    const { data: carrierData, error: carrierError } = await supabase
      .from('lats_shipping_info')
      .select(`
        *,
        carrier:lats_shipping_carriers(id, name, tracking_url)
      `)
      .eq('purchase_order_id', purchaseOrderId)
      .single();
    
    if (carrierError) {
      console.error('❌ Carrier query failed:', carrierError);
    } else {
      console.log('✅ Carrier query succeeded:', carrierData);
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
    process.exit(1);
  }
}

// Run the check
checkForeignKeys()
  .then(() => {
    console.log('✅ Foreign key check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Foreign key check failed:', error);
    process.exit(1);
  });
