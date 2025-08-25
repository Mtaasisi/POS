import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   VITE_SUPABASE_ANON_KEY:', !!supabaseAnonKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function apply400ErrorsFix() {
  console.log('🔧 Testing database queries to identify 400 errors...');
  
  try {
    // Run verification queries to test the current state
    await runVerificationQueries();
    
  } catch (error) {
    console.error('💥 Test failed:', error);
    process.exit(1);
  }
}

async function runVerificationQueries() {
  console.log('\n🔍 Running verification queries...');
  
  try {
    // Test 1: Simple customers query
    console.log('1️⃣ Testing simple customers query...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, email, phone')
      .limit(5);
    
    if (customersError) {
      console.error('❌ Simple customers query failed:', customersError);
    } else {
      console.log(`✅ Simple customers query succeeded: ${customers?.length || 0} records`);
    }
    
    // Test 2: Simple devices query
    console.log('2️⃣ Testing simple devices query...');
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('id, brand, model, status')
      .limit(5);
    
    if (devicesError) {
      console.error('❌ Simple devices query failed:', devicesError);
    } else {
      console.log(`✅ Simple devices query succeeded: ${devices?.length || 0} records`);
    }
    
    // Test 3: Complex customers query (the one that was failing)
    console.log('3️⃣ Testing complex customers query...');
    const { data: complexCustomers, error: complexError } = await supabase
      .from('customers')
      .select(`
        id, name, email, phone, gender, city, joined_date, loyalty_level, color_tag, referred_by, total_spent, points, last_visit, is_active, whatsapp, birth_month, birth_day, referral_source, initial_notes, total_returns, profile_image, created_at, updated_at,
        customer_notes(*),
        customer_payments(
          *,
          devices(brand, model)
        ),
        promo_messages(*),
        devices(*)
      `)
      .limit(1);
    
    if (complexError) {
      console.error('❌ Complex customers query failed:', complexError);
      console.error('Error details:', {
        message: complexError.message,
        details: complexError.details,
        hint: complexError.hint,
        code: complexError.code
      });
    } else {
      console.log(`✅ Complex customers query succeeded: ${complexCustomers?.length || 0} records`);
    }
    
    // Test 4: Complex devices query (the one that was failing)
    console.log('4️⃣ Testing complex devices query...');
    const { data: complexDevices, error: complexDevicesError } = await supabase
      .from('devices')
      .select(`
        id, customer_id, brand, model, serial_number, issue_description, status, assigned_to, expected_return_date, created_at, updated_at, unlock_code, repair_cost, deposit_amount, diagnosis_required, device_notes, device_cost, estimated_hours, device_condition,
        customers(id, name, phone, email),
        remarks:device_remarks(*),
        transitions:device_transitions(*),
        ratings:device_ratings(*)
      `)
      .limit(1);
    
    if (complexDevicesError) {
      console.error('❌ Complex devices query failed:', complexDevicesError);
      console.error('Error details:', {
        message: complexDevicesError.message,
        details: complexDevicesError.details,
        hint: complexDevicesError.hint,
        code: complexDevicesError.code
      });
    } else {
      console.log(`✅ Complex devices query succeeded: ${complexDevices?.length || 0} records`);
    }
    
    console.log('\n🎉 Verification completed!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

// Run the migration
apply400ErrorsFix().then(() => {
  console.log('\n🏁 Migration process completed!');
  process.exit(0);
}).catch((error) => {
  console.error('\n💥 Migration process failed:', error);
  process.exit(1);
});
