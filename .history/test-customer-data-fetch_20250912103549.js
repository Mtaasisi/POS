#!/usr/bin/env node

/**
 * Test script to verify customer data fetching is working properly
 * This script tests the customer API functions to ensure all fields are being fetched
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testCustomerDataFetch() {
  console.log('🧪 Testing Customer Data Fetching...\n');

  try {
    // Test 1: Fetch a single customer with all fields
    console.log('📋 Test 1: Fetching single customer with all fields');
    const { data: singleCustomer, error: singleError } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        phone,
        email,
        gender,
        city,
        color_tag,
        loyalty_level,
        points,
        total_spent,
        last_visit,
        is_active,
        referral_source,
        birth_month,
        birth_day,
        total_returns,
        profile_image,
        whatsapp,
        whatsapp_opt_out,
        initial_notes,
        notes,
        referrals,
        customer_tag,
        created_at,
        updated_at,
        created_by,
        last_purchase_date,
        total_purchases,
        birthday,
        referred_by
      `)
      .limit(1)
      .single();

    if (singleError) {
      console.error('❌ Error fetching single customer:', singleError);
    } else {
      console.log('✅ Single customer fetched successfully');
      console.log('📊 Customer data fields:');
      console.log('   - ID:', singleCustomer.id);
      console.log('   - Name:', singleCustomer.name);
      console.log('   - Phone:', singleCustomer.phone);
      console.log('   - Email:', singleCustomer.email);
      console.log('   - Gender:', singleCustomer.gender);
      console.log('   - City:', singleCustomer.city);
      console.log('   - Color Tag:', singleCustomer.color_tag);
      console.log('   - Loyalty Level:', singleCustomer.loyalty_level);
      console.log('   - Points:', singleCustomer.points);
      console.log('   - Total Spent:', singleCustomer.total_spent);
      console.log('   - Last Visit:', singleCustomer.last_visit);
      console.log('   - Is Active:', singleCustomer.is_active);
      console.log('   - Referral Source:', singleCustomer.referral_source);
      console.log('   - Birth Month:', singleCustomer.birth_month);
      console.log('   - Birth Day:', singleCustomer.birth_day);
      console.log('   - Total Returns:', singleCustomer.total_returns);
      console.log('   - Profile Image:', singleCustomer.profile_image);
      console.log('   - WhatsApp:', singleCustomer.whatsapp);
      console.log('   - WhatsApp Opt Out:', singleCustomer.whatsapp_opt_out);
      console.log('   - Initial Notes:', singleCustomer.initial_notes);
      console.log('   - Notes:', singleCustomer.notes);
      console.log('   - Referrals:', singleCustomer.referrals);
      console.log('   - Customer Tag:', singleCustomer.customer_tag);
      console.log('   - Created At:', singleCustomer.created_at);
      console.log('   - Updated At:', singleCustomer.updated_at);
      console.log('   - Created By:', singleCustomer.created_by);
      console.log('   - Last Purchase Date:', singleCustomer.last_purchase_date);
      console.log('   - Total Purchases:', singleCustomer.total_purchases);
      console.log('   - Birthday:', singleCustomer.birthday);
      console.log('   - Referred By:', singleCustomer.referred_by);
    }

    // Test 2: Fetch multiple customers with all fields
    console.log('\n📋 Test 2: Fetching multiple customers with all fields');
    const { data: multipleCustomers, error: multipleError, count } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        phone,
        email,
        gender,
        city,
        color_tag,
        loyalty_level,
        points,
        total_spent,
        last_visit,
        is_active,
        referral_source,
        birth_month,
        birth_day,
        total_returns,
        profile_image,
        whatsapp,
        whatsapp_opt_out,
        initial_notes,
        notes,
        referrals,
        customer_tag,
        created_at,
        updated_at,
        created_by,
        last_purchase_date,
        total_purchases,
        birthday,
        referred_by
      `, { count: 'exact' })
      .limit(5);

    if (multipleError) {
      console.error('❌ Error fetching multiple customers:', multipleError);
    } else {
      console.log(`✅ Multiple customers fetched successfully (${multipleCustomers.length} customers, total: ${count})`);
      console.log('📊 Sample customer data:');
      multipleCustomers.forEach((customer, index) => {
        console.log(`   Customer ${index + 1}:`);
        console.log(`     - Name: ${customer.name}`);
        console.log(`     - Phone: ${customer.phone}`);
        console.log(`     - Email: ${customer.email}`);
        console.log(`     - Gender: ${customer.gender}`);
        console.log(`     - City: ${customer.city}`);
        console.log(`     - Color Tag: ${customer.color_tag}`);
        console.log(`     - Loyalty Level: ${customer.loyalty_level}`);
        console.log(`     - Points: ${customer.points}`);
        console.log(`     - Total Spent: ${customer.total_spent}`);
        console.log(`     - Is Active: ${customer.is_active}`);
      });
    }

    // Test 3: Check for missing fields
    console.log('\n📋 Test 3: Checking for missing fields');
    const expectedFields = [
      'id', 'name', 'phone', 'email', 'gender', 'city', 'color_tag',
      'loyalty_level', 'points', 'total_spent', 'last_visit', 'is_active',
      'referral_source', 'birth_month', 'birth_day', 'total_returns',
      'profile_image', 'whatsapp', 'whatsapp_opt_out', 'initial_notes',
      'notes', 'referrals', 'customer_tag', 'created_at', 'updated_at',
      'created_by', 'last_purchase_date', 'total_purchases', 'birthday',
      'referred_by'
    ];

    if (singleCustomer) {
      const missingFields = expectedFields.filter(field => !(field in singleCustomer));
      const nullFields = expectedFields.filter(field => singleCustomer[field] === null || singleCustomer[field] === undefined);
      
      console.log('📊 Field Analysis:');
      console.log(`   - Total expected fields: ${expectedFields.length}`);
      console.log(`   - Missing fields: ${missingFields.length}`);
      console.log(`   - Null/undefined fields: ${nullFields.length}`);
      
      if (missingFields.length > 0) {
        console.log('   - Missing fields:', missingFields.join(', '));
      }
      
      if (nullFields.length > 0) {
        console.log('   - Null/undefined fields:', nullFields.join(', '));
      }
    }

    // Test 4: Test search functionality
    console.log('\n📋 Test 4: Testing search functionality');
    const { data: searchResults, error: searchError } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        phone,
        email,
        gender,
        city,
        color_tag,
        loyalty_level,
        points,
        total_spent,
        last_visit,
        is_active,
        referral_source,
        birth_month,
        birth_day,
        total_returns,
        profile_image,
        whatsapp,
        whatsapp_opt_out,
        initial_notes,
        notes,
        referrals,
        customer_tag,
        created_at,
        updated_at,
        created_by,
        last_purchase_date,
        total_purchases,
        birthday,
        referred_by
      `)
      .ilike('name', '%a%')
      .limit(3);

    if (searchError) {
      console.error('❌ Error in search:', searchError);
    } else {
      console.log(`✅ Search completed successfully (${searchResults.length} results)`);
      console.log('📊 Search results:');
      searchResults.forEach((customer, index) => {
        console.log(`   Result ${index + 1}: ${customer.name} (${customer.phone})`);
      });
    }

    console.log('\n🎉 Customer data fetching tests completed!');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testCustomerDataFetch();
