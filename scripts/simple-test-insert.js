import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function simpleTestInsert() {
  console.log('🧪 Simple test insert...');

  try {
    // Test with minimal data for loyalty settings
    console.log('\n📋 Testing minimal loyalty settings insert...');
    
    const minimalLoyalty = {
      user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      business_id: null,
      enable_loyalty_program: true
    };

    const { data: loyaltyData, error: loyaltyError } = await supabase
      .from('lats_pos_loyalty_customer_settings')
      .insert(minimalLoyalty)
      .select();

    if (loyaltyError) {
      console.error('❌ Loyalty settings insert error:', loyaltyError);
      console.error('🔍 Error details:', {
        code: loyaltyError.code,
        message: loyaltyError.message,
        details: loyaltyError.details,
        hint: loyaltyError.hint
      });
    } else {
      console.log('✅ Loyalty settings inserted successfully:', loyaltyData);
    }

    // Test with minimal data for analytics settings
    console.log('\n📊 Testing minimal analytics settings insert...');
    
    const minimalAnalytics = {
      user_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
      business_id: null,
      enable_analytics: true
    };

    const { data: analyticsData, error: analyticsError } = await supabase
      .from('lats_pos_analytics_reporting_settings')
      .insert(minimalAnalytics)
      .select();

    if (analyticsError) {
      console.error('❌ Analytics settings insert error:', analyticsError);
      console.error('🔍 Error details:', {
        code: analyticsError.code,
        message: analyticsError.message,
        details: analyticsError.details,
        hint: analyticsError.hint
      });
    } else {
      console.log('✅ Analytics settings inserted successfully:', analyticsData);
    }

  } catch (error) {
    console.error('❌ Error in simple test insert:', error);
  }
}

// Run the test
simpleTestInsert();
