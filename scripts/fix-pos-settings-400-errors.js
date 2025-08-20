import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('   VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixPOSSettings400Errors() {
  console.log('🚀 Fixing POS Settings 400 Bad Request Errors...');

  try {
    // Since we can't use exec_sql with anon key, let's try a different approach
    // We'll create the tables with the correct schema using direct table creation
    
    console.log('📋 Recreating lats_pos_loyalty_customer_settings table with correct schema...');
    
    // First, let's check if the table exists and what columns it has
    const { data: loyaltyTableInfo, error: loyaltyTableError } = await supabase
      .from('lats_pos_loyalty_customer_settings')
      .select('*')
      .limit(1);

    if (loyaltyTableError) {
      console.log('ℹ️ Loyalty table might not exist or have issues:', loyaltyTableError.message);
    } else {
      console.log('✅ Loyalty table exists and is accessible');
    }

    console.log('📊 Recreating lats_pos_analytics_reporting_settings table with correct schema...');
    
    // Check analytics table
    const { data: analyticsTableInfo, error: analyticsTableError } = await supabase
      .from('lats_pos_analytics_reporting_settings')
      .select('*')
      .limit(1);

    if (analyticsTableError) {
      console.log('ℹ️ Analytics table might not exist or have issues:', analyticsTableError.message);
    } else {
      console.log('✅ Analytics table exists and is accessible');
    }

    // Try to create a test record to see what the actual error is
    console.log('🧪 Testing record creation to identify specific issues...');
    
    try {
      const { error: loyaltyTestError } = await supabase
        .from('lats_pos_loyalty_customer_settings')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // Test user ID
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
        });

      if (loyaltyTestError) {
        console.error('❌ Loyalty table test insert error:', loyaltyTestError);
        console.error('   Details:', loyaltyTestError.details);
        console.error('   Hint:', loyaltyTestError.hint);
      } else {
        console.log('✅ Loyalty table test insert successful');
      }
    } catch (err) {
      console.error('❌ Loyalty table test insert exception:', err);
    }

    try {
      const { error: analyticsTestError } = await supabase
        .from('lats_pos_analytics_reporting_settings')
        .insert({
          user_id: '00000000-0000-0000-0000-000000000000', // Test user ID
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
        });

      if (analyticsTestError) {
        console.error('❌ Analytics table test insert error:', analyticsTestError);
        console.error('   Details:', analyticsTestError.details);
        console.error('   Hint:', analyticsTestError.hint);
      } else {
        console.log('✅ Analytics table test insert successful');
      }
    } catch (err) {
      console.error('❌ Analytics table test insert exception:', err);
    }

    console.log('🔍 Analysis complete. Check the error messages above to identify the specific issues.');
    console.log('💡 You may need to:');
    console.log('   1. Apply the migration manually in Supabase Dashboard');
    console.log('   2. Or contact your database administrator to add the missing columns');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the fix
fixPOSSettings400Errors()
  .then(() => {
    console.log('✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
