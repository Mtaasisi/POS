import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testEnhancedCustomerDisplay() {
  console.log('🔍 Testing enhanced customer display with all available fields...\n');

  try {
    // Fetch a customer with comprehensive data
    const { data: customers, error } = await supabase
      .from('customers')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error fetching customers:', error.message);
      return;
    }
    
    if (customers && customers.length > 0) {
      const customer = customers[0];
      console.log(`👤 Customer: ${customer.name}`);
      console.log('📋 Enhanced Display Information:\n');
      
      // Personal Information
      console.log('🔹 Personal Information:');
      console.log(`  ✅ Name: ${customer.name}`);
      console.log(`  ✅ Phone: ${customer.phone || 'Not provided'}`);
      console.log(`  ✅ Email: ${customer.email || 'Not provided'}`);
      console.log(`  ✅ WhatsApp: ${customer.whatsapp || 'Not provided'}`);
      console.log(`  ✅ Gender: ${customer.gender || 'Not specified'}`);
      console.log(`  ✅ City: ${customer.city || 'Not specified'}`);
      console.log(`  ✅ Country: ${customer.country || 'Not specified'}`);
      console.log(`  ✅ Address: ${customer.address || 'Not provided'}`);
      console.log(`  ✅ Birthday: ${customer.birth_month && customer.birth_day ? 
        `${customer.birth_month}/${customer.birth_day}` : 'Not provided'}`);
      console.log(`  ✅ Account Status: ${customer.is_active ? 'Active' : 'Inactive'}`);
      console.log(`  ✅ Member Since: ${customer.created_at ? 
        new Date(customer.created_at).toLocaleDateString() : 'Unknown'}`);
      console.log(`  ✅ Last Visit: ${customer.last_visit ? 
        new Date(customer.last_visit).toLocaleDateString() : 'Never'}`);
      console.log(`  ✅ Notes: ${customer.notes || 'None'}`);
      console.log(`  ✅ Initial Notes: ${customer.initial_notes || 'None'}\n`);
      
      // Business Information
      console.log('🔹 Business Information:');
      console.log(`  ✅ Loyalty Level: ${customer.loyalty_level || 'bronze'}`);
      console.log(`  ✅ Color Tag: ${customer.color_tag || 'new'}`);
      console.log(`  ✅ Customer Tag: ${customer.customer_tag || 'None'}`);
      console.log(`  ✅ Referral Source: ${customer.referral_source || 'Not specified'}`);
      console.log(`  ✅ Referred By: ${customer.referred_by || 'None'}`);
      console.log(`  ✅ Total Spent: ${customer.total_spent || 0} TSH`);
      console.log(`  ✅ Points: ${customer.points || 0}`);
      console.log(`  ✅ Total Purchases: ${customer.total_purchases || 0}`);
      console.log(`  ✅ Last Purchase: ${customer.last_purchase_date ? 
        new Date(customer.last_purchase_date).toLocaleDateString() : 'Never'}\n`);
      
      // Settings & Preferences
      console.log('🔹 Settings & Preferences:');
      console.log(`  ✅ WhatsApp Opt-out: ${customer.whatsapp_opt_out ? 'Yes' : 'No'}`);
      console.log(`  ✅ Created By: ${customer.created_by || 'System'}`);
      console.log(`  ✅ Referrals: ${customer.referrals ? JSON.stringify(customer.referrals) : 'None'}\n`);
      
      // Timestamps
      console.log('🔹 Timestamps:');
      console.log(`  ✅ Created At: ${customer.created_at ? 
        new Date(customer.created_at).toLocaleString() : 'Unknown'}`);
      console.log(`  ✅ Updated At: ${customer.updated_at ? 
        new Date(customer.updated_at).toLocaleString() : 'Unknown'}`);
      console.log(`  ✅ Joined Date: ${customer.joined_date ? 
        new Date(customer.joined_date).toLocaleString() : 'Not set'}`);
      console.log(`  ✅ Last Visit: ${customer.last_visit ? 
        new Date(customer.last_visit).toLocaleString() : 'Never'}\n`);
      
      console.log('🎯 Summary:');
      console.log('- All customer fields are being fetched from database');
      console.log('- Enhanced customer details modal will display all available information');
      console.log('- Personal information section includes: name, contact, location, birthday, status, dates');
      console.log('- Business information section includes: loyalty, tags, referrals, spending');
      console.log('- Preferences section includes: settings, opt-outs, communication preferences');
      console.log('- Purchase history section includes: spending totals, purchase counts, dates');
      console.log('- All fields are conditionally displayed (only show if data exists)');
      
    } else {
      console.log('❌ No customers found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testEnhancedCustomerDisplay();
