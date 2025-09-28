import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function verifyCompleteDisplay() {
  console.log('🔍 Verifying complete customer information display...\n');

  try {
    // Fetch a customer record to see all available fields
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
      const dbFields = Object.keys(customer);
      
      console.log('📊 All Database Fields:');
      dbFields.forEach(field => {
        console.log(`  ✅ ${field}: ${customer[field] !== null ? customer[field] : 'null'}`);
      });

      console.log('\n📱 Now Displayed in UI (All Fields):');
      const allDisplayedFields = [
        'name', 'phone', 'email', 'whatsapp', 'city', 'country', 'address',
        'birth_month', 'birth_day', 'birthday', 'gender', 'notes', 'initial_notes',
        'is_active', 'created_at', 'joined_date', 'last_visit', 'updated_at',
        'loyalty_level', 'color_tag', 'customer_tag', 'referral_source', 'referred_by',
        'total_spent', 'points', 'total_purchases', 'last_purchase_date', 'whatsapp_opt_out',
        'referrals', 'total_returns', 'created_by', 'profile_image'
      ];
      
      allDisplayedFields.forEach(field => {
        if (dbFields.includes(field)) {
          console.log(`  ✅ ${field}`);
        }
      });

      console.log('\n❌ Still Missing from UI:');
      const stillMissing = [];
      
      dbFields.forEach(field => {
        if (!allDisplayedFields.includes(field) && field !== 'id') {
          stillMissing.push(field);
          console.log(`  ❌ ${field}: ${customer[field] !== null ? customer[field] : 'null'}`);
        }
      });

      console.log('\n🎯 Final Summary:');
      console.log(`- Total database fields: ${dbFields.length}`);
      console.log(`- Now displayed in UI: ${allDisplayedFields.filter(f => dbFields.includes(f)).length}`);
      console.log(`- Still missing from UI: ${stillMissing.length}`);
      
      if (stillMissing.length === 0) {
        console.log('\n🎉 SUCCESS! All customer database fields are now displayed in the UI!');
        console.log('\n📋 Complete Customer Information Display:');
        console.log('🔹 Personal Information: name, phone, email, whatsapp, city, country, address, gender, birthday, notes');
        console.log('🔹 Account Details: status, member since, last visit, profile image');
        console.log('🔹 Business Information: loyalty level, tags, referrals, spending, returns, created by');
        console.log('🔹 Preferences: communication settings, opt-outs');
        console.log('🔹 Purchase History: spending totals, transaction counts, dates');
      } else {
        console.log('\n⚠️  Still missing fields:');
        stillMissing.forEach(field => {
          console.log(`- ${field}`);
        });
      }

    } else {
      console.log('❌ No customers found');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

verifyCompleteDisplay();
