#!/usr/bin/env node

/**
 * Check Database Schema
 * 
 * This script checks the database schema for foreign key constraints
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

async function checkSchema() {
  try {
    console.log('🔍 Checking database schema...');
    
    // Check if we can query the information_schema to see foreign keys
    console.log('📋 Checking foreign key constraints...');
    
    const { data: constraints, error: constraintsError } = await supabase
      .rpc('get_foreign_keys', { table_name: 'lats_shipping_info' });
    
    if (constraintsError) {
      console.log('ℹ️  Cannot query foreign keys directly:', constraintsError.message);
    } else {
      console.log('✅ Foreign key constraints:', constraints);
    }
    
    // Try a simpler approach - test if the foreign key reference works
    console.log('\n📋 Testing foreign key references...');
    
    // Test without the foreign key reference
    const { data: simpleData, error: simpleError } = await supabase
      .from('lats_shipping_info')
      .select('*')
      .limit(1);
    
    if (simpleError) {
      console.error('❌ Simple query failed:', simpleError);
    } else {
      console.log('✅ Simple query works, found', simpleData?.length || 0, 'records');
    }
    
    // Test with just the carrier reference (no foreign key)
    const { data: carrierData, error: carrierError } = await supabase
      .from('lats_shipping_info')
      .select(`
        *,
        carrier:lats_shipping_carriers(id, name, tracking_url)
      `)
      .limit(1);
    
    if (carrierError) {
      console.error('❌ Carrier reference failed:', carrierError);
    } else {
      console.log('✅ Carrier reference works');
    }
    
    // Test with agent reference using the foreign key
    const { data: agentData, error: agentError } = await supabase
      .from('lats_shipping_info')
      .select(`
        *,
        agent:lats_shipping_agents!lats_shipping_info_agent_id_fkey(id, name, company, phone, email, is_active)
      `)
      .limit(1);
    
    if (agentError) {
      console.error('❌ Agent foreign key reference failed:', agentError);
      console.log('💡 This suggests the foreign key constraint does not exist');
    } else {
      console.log('✅ Agent foreign key reference works');
    }
    
    // Test with manager reference using the foreign key
    const { data: managerData, error: managerError } = await supabase
      .from('lats_shipping_info')
      .select(`
        *,
        manager:lats_shipping_managers!lats_shipping_info_manager_id_fkey(id, name, department, phone, email)
      `)
      .limit(1);
    
    if (managerError) {
      console.error('❌ Manager foreign key reference failed:', managerError);
      console.log('💡 This suggests the foreign key constraint does not exist');
    } else {
      console.log('✅ Manager foreign key reference works');
    }
    
  } catch (error) {
    console.error('❌ Schema check failed:', error);
    process.exit(1);
  }
}

// Run the check
checkSchema()
  .then(() => {
    console.log('✅ Schema check completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Schema check failed:', error);
    process.exit(1);
  });
