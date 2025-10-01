#!/usr/bin/env node

/**
 * Check the current schema of lats_purchase_orders table
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

async function checkCurrentSchema() {
  console.log('🔍 Checking current lats_purchase_orders table schema...\n');
  
  try {
    // Get a sample record to see all available columns
    const { data: sampleRecord, error: sampleError } = await supabase
      .from('lats_purchase_orders')
      .select('*')
      .eq('id', 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038')
      .single();
    
    if (sampleError) {
      console.error('❌ Error fetching sample record:', sampleError);
      return;
    }
    
    console.log('📋 Current table columns (from sample record):');
    console.log('=' .repeat(50));
    
    const columns = Object.keys(sampleRecord);
    columns.forEach((column, index) => {
      const value = sampleRecord[column];
      const type = typeof value;
      console.log(`${index + 1}. ${column}: ${type} = ${value}`);
    });
    
    console.log('\n📊 Total columns:', columns.length);
    
    // Test updating with all the fields that exist
    console.log('\n🧪 Testing update with all existing fields...');
    const updateData = {
      status: 'completed',
      updated_at: new Date().toISOString()
    };
    
    // Add all the fields that exist in the schema
    if (sampleRecord.shipping_status !== undefined) updateData.shipping_status = 'delivered';
    if (sampleRecord.tracking_number !== undefined) updateData.tracking_number = 'TEST123';
    if (sampleRecord.payment_status !== undefined) updateData.payment_status = 'paid';
    if (sampleRecord.total_paid !== undefined) updateData.total_paid = 7500;
    if (sampleRecord.quality_check_status !== undefined) updateData.quality_check_status = 'passed';
    if (sampleRecord.quality_check_passed !== undefined) updateData.quality_check_passed = true;
    if (sampleRecord.notes !== undefined) updateData.notes = 'Updated via schema test';
    
    const { data: updateResult, error: updateError } = await supabase
      .from('lats_purchase_orders')
      .update(updateData)
      .eq('id', 'c6292820-c3aa-4a33-bbfb-5abcc5b0b038')
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Update with all fields failed:', updateError);
    } else {
      console.log('✅ Update with all fields successful');
      console.log('Updated fields:', Object.keys(updateData));
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkCurrentSchema().catch(console.error);
