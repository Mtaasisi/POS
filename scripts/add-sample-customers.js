#!/usr/bin/env node

/**
 * Add Sample Customers Script
 * This script adds sample customers to test the customer search functionality
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase configuration
const getConfig = () => {
  const envUrl = process.env.VITE_SUPABASE_URL;
  const envKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (envUrl && envKey) {
    console.log('🔧 Using environment variables for Supabase configuration');
    return {
      url: envUrl,
      key: envKey
    };
  }
  
  // Fallback to hardcoded configuration
  console.log('🔧 Using fallback Supabase configuration');
  return {
    url: 'https://jxhzveborezjhsmzsgbc.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw'
  };
};

async function addSampleCustomers() {
  try {
    console.log('🚀 Adding sample customers to test search functionality...');
    
    const config = getConfig();
    const supabase = createClient(config.url, config.key);
    
    // Sample customers with various searchable fields
    const sampleCustomers = [
      {
        name: 'John Doe',
        email: 'john.doe@email.com',
        phone: '+254700123456',
        city: 'Nairobi',
        gender: 'male',
        loyalty_level: 'gold',
        color_tag: 'vip',
        total_spent: 150000,
        points: 1500,
        is_active: true,
        whatsapp: '+254700123456',
        referral_source: 'social_media',
        initial_notes: 'VIP customer, prefers premium products'
      },
      {
        name: 'Jane Smith',
        email: 'jane.smith@email.com',
        phone: '+254700234567',
        city: 'Mombasa',
        gender: 'female',
        loyalty_level: 'silver',
        color_tag: 'new',
        total_spent: 75000,
        points: 750,
        is_active: true,
        whatsapp: '+254700234567',
        referral_source: 'referral',
        initial_notes: 'New customer, interested in accessories'
      },
      {
        name: 'Mike Johnson',
        email: 'mike.johnson@email.com',
        phone: '+254700345678',
        city: 'Kisumu',
        gender: 'male',
        loyalty_level: 'bronze',
        color_tag: 'regular',
        total_spent: 25000,
        points: 250,
        is_active: true,
        whatsapp: '+254700345678',
        referral_source: 'walk_in',
        initial_notes: 'Regular customer, budget conscious'
      },
      {
        name: 'Sarah Wilson',
        email: 'sarah.wilson@email.com',
        phone: '+254700456789',
        city: 'Nakuru',
        gender: 'female',
        loyalty_level: 'platinum',
        color_tag: 'vip',
        total_spent: 300000,
        points: 3000,
        is_active: true,
        whatsapp: '+254700456789',
        referral_source: 'online',
        initial_notes: 'Premium customer, tech enthusiast'
      },
      {
        name: 'David Brown',
        email: 'david.brown@email.com',
        phone: '+254700567890',
        city: 'Eldoret',
        gender: 'male',
        loyalty_level: 'silver',
        color_tag: 'complainer',
        total_spent: 50000,
        points: 500,
        is_active: false,
        whatsapp: '+254700567890',
        referral_source: 'advertisement',
        initial_notes: 'Inactive customer, had complaints'
      },
      {
        name: 'Lisa Davis',
        email: 'lisa.davis@email.com',
        phone: '+254700678901',
        city: 'Thika',
        gender: 'female',
        loyalty_level: 'gold',
        color_tag: 'purchased',
        total_spent: 120000,
        points: 1200,
        is_active: true,
        whatsapp: '+254700678901',
        referral_source: 'social_media',
        initial_notes: 'Active buyer, prefers online shopping'
      },
      {
        name: 'Robert Miller',
        email: 'robert.miller@email.com',
        phone: '+254700789012',
        city: 'Nairobi',
        gender: 'male',
        loyalty_level: 'bronze',
        color_tag: 'new',
        total_spent: 15000,
        points: 150,
        is_active: true,
        whatsapp: '+254700789012',
        referral_source: 'walk_in',
        initial_notes: 'New customer, interested in phone repairs'
      },
      {
        name: 'Emily Taylor',
        email: 'emily.taylor@email.com',
        phone: '+254700890123',
        city: 'Mombasa',
        gender: 'female',
        loyalty_level: 'platinum',
        color_tag: 'vip',
        total_spent: 250000,
        points: 2500,
        is_active: true,
        whatsapp: '+254700890123',
        referral_source: 'referral',
        initial_notes: 'VIP customer, business client'
      },
      {
        name: 'James Anderson',
        email: 'james.anderson@email.com',
        phone: '+254700901234',
        city: 'Kisumu',
        gender: 'male',
        loyalty_level: 'silver',
        color_tag: 'regular',
        total_spent: 80000,
        points: 800,
        is_active: true,
        whatsapp: '+254700901234',
        referral_source: 'online',
        initial_notes: 'Regular customer, prefers Samsung products'
      },
      {
        name: 'Maria Garcia',
        email: 'maria.garcia@email.com',
        phone: '+254700012345',
        city: 'Nakuru',
        gender: 'female',
        loyalty_level: 'bronze',
        color_tag: 'new',
        total_spent: 20000,
        points: 200,
        is_active: true,
        whatsapp: '+254700012345',
        referral_source: 'advertisement',
        initial_notes: 'New customer, interested in laptop accessories'
      }
    ];

    console.log('📝 Adding sample customers...');
    
    let addedCount = 0;
    let skippedCount = 0;
    
    for (const customer of sampleCustomers) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .insert([customer])
          .select();
        
        if (error) {
          if (error.code === '23505') { // Unique constraint violation
            console.log(`⚠️  Customer ${customer.name} already exists, skipping...`);
            skippedCount++;
          } else {
            console.log(`❌ Error adding customer ${customer.name}: ${error.message}`);
          }
        } else {
          console.log(`✅ Added customer: ${customer.name} (${customer.phone})`);
          addedCount++;
        }
      } catch (err) {
        console.log(`❌ Error adding customer ${customer.name}: ${err.message}`);
      }
    }
    
    console.log(`\n📊 Summary:`);
    console.log(`- Added: ${addedCount} customers`);
    console.log(`- Skipped: ${skippedCount} customers (already exist)`);
    
    if (addedCount > 0) {
      console.log('\n🎉 Sample customers added successfully!');
      console.log('\n📋 Test the customer search functionality:');
      console.log('1. Open your application in the browser');
      console.log('2. Navigate to the Customers page');
      console.log('3. Try searching by:');
      console.log('   - Name: "John", "Jane", "Mike"');
      console.log('   - Phone: "254700"');
      console.log('   - Email: "email.com"');
      console.log('   - City: "Nairobi", "Mombasa"');
      console.log('   - Loyalty level: "gold", "platinum"');
      console.log('   - Color tag: "vip", "new"');
      console.log('4. Test filters and sorting');
    } else {
      console.log('\n⚠️  No new customers were added. They might already exist.');
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

// Run the script
addSampleCustomers();
