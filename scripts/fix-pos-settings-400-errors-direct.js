import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

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

const config = getConfig();
const supabase = createClient(config.url, config.key);

async function fixPOSSettings400ErrorsDirect() {
  console.log('🚀 Fixing POS Settings 400 Errors (Direct Method)...');
  console.log('📋 Testing record creation to identify missing columns...');

  try {
    // Test 1: Try to create a loyalty customer settings record
    console.log('🧪 Testing loyalty customer settings record creation...');
    const testLoyaltyData = {
      user_id: 'a15a9139-3be9-4028-b944-240caae9eeb2', // Use the user ID from the logs
      business_id: null,
      enable_loyalty_program: true,
      enable_points_system: true,
      enable_tier_system: true,
      points_per_currency: 1.00,
      currency_per_point: 0.01,
      minimum_points_redemption: 100,
      maximum_points_redemption: 10000,
      enable_birthday_rewards: true,
      birthday_points_bonus: 500,
      enable_referral_program: false,
      referral_points_bonus: 1000,
      enable_anniversary_rewards: true,
      anniversary_points_bonus: 250,
      enable_first_purchase_bonus: true,
      first_purchase_points_bonus: 200,
      enable_spending_tiers: true,
      bronze_tier_threshold: 0.00,
      silver_tier_threshold: 1000.00,
      gold_tier_threshold: 5000.00,
      platinum_tier_threshold: 10000.00,
      bronze_points_multiplier: 1.00,
      silver_points_multiplier: 1.25,
      gold_points_multiplier: 1.50,
      platinum_points_multiplier: 2.00,
      enable_points_expiry: false,
      points_expiry_days: 365,
      enable_auto_tier_upgrade: true,
      enable_auto_tier_downgrade: true
    };

    const { error: loyaltyTestError } = await supabase
      .from('lats_pos_loyalty_customer_settings')
      .insert(testLoyaltyData);

    if (loyaltyTestError) {
      console.error('❌ Loyalty test insert error:', loyaltyTestError);
      console.error('📋 Error details:', JSON.stringify(loyaltyTestError, null, 2));
    } else {
      console.log('✅ Loyalty test insert successful');
    }

    // Test 2: Try to create an analytics reporting settings record
    console.log('🧪 Testing analytics reporting settings record creation...');
    const testAnalyticsData = {
      user_id: 'a15a9139-3be9-4028-b944-240caae9eeb2',
      business_id: null,
      enable_sales_analytics: true,
      enable_inventory_analytics: true,
      enable_customer_analytics: true,
      enable_financial_analytics: true,
      enable_performance_analytics: true,
      enable_trend_analysis: true,
      enable_forecasting: false,
      enable_comparative_analysis: true,
      enable_segmentation_analysis: true,
      enable_correlation_analysis: false,
      enable_predictive_analytics: false,
      enable_real_time_analytics: true,
      enable_historical_analytics: true,
      enable_custom_reports: true,
      enable_scheduled_reports: false,
      enable_export_reports: true,
      enable_email_reports: false,
      enable_dashboard_analytics: true,
      enable_chart_visualizations: true,
      enable_table_visualizations: true,
      enable_metric_cards: true,
      enable_kpi_tracking: true,
      enable_goal_tracking: false,
      enable_alert_system: true,
      enable_anomaly_detection: false,
      enable_benchmarking: false,
      enable_competitor_analysis: false,
      enable_market_analysis: false,
      enable_customer_insights: true,
      enable_product_insights: true,
      enable_sales_insights: true,
      enable_inventory_insights: true
    };

    const { error: analyticsTestError } = await supabase
      .from('lats_pos_analytics_reporting_settings')
      .insert(testAnalyticsData);

    if (analyticsTestError) {
      console.error('❌ Analytics test insert error:', analyticsTestError);
      console.error('📋 Error details:', JSON.stringify(analyticsTestError, null, 2));
    } else {
      console.log('✅ Analytics test insert successful');
    }

    // Check current table structure
    console.log('🔍 Checking current table structure...');
    
    // Get table info for loyalty table
    const { data: loyaltyTableInfo, error: loyaltyTableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'lats_pos_loyalty_customer_settings')
      .eq('table_schema', 'public');

    if (loyaltyTableError) {
      console.error('❌ Error checking loyalty table structure:', loyaltyTableError);
    } else {
      console.log('📋 Loyalty table columns:', loyaltyTableInfo?.map(col => col.column_name));
    }

    // Get table info for analytics table
    const { data: analyticsTableInfo, error: analyticsTableError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default')
      .eq('table_name', 'lats_pos_analytics_reporting_settings')
      .eq('table_schema', 'public');

    if (analyticsTableError) {
      console.error('❌ Error checking analytics table structure:', analyticsTableError);
    } else {
      console.log('📋 Analytics table columns:', analyticsTableInfo?.map(col => col.column_name));
    }

    console.log('🎉 Testing completed');
    console.log('💡 Check the error details above to see which columns are missing');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the fix
fixPOSSettings400ErrorsDirect()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
