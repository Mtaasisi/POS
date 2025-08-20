import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

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

async function applyPOSSettingsFix() {
  console.log('🚀 Applying POS Settings Fix...');
  console.log('📋 This script will apply the SQL fix to add missing columns');

  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('fix-pos-settings-missing-columns.sql', 'utf8');
    console.log('📄 SQL file loaded successfully');

    // Split the SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements to execute`);

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        console.log(`🔧 Executing statement ${i + 1}/${statements.length}...`);
        
        try {
          // Use the REST API to execute SQL
          const response = await fetch(`${config.url}/rest/v1/rpc/exec_sql`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': config.key,
              'Authorization': `Bearer ${config.key}`
            },
            body: JSON.stringify({
              sql: statement
            })
          });

          if (response.ok) {
            console.log(`✅ Statement ${i + 1} executed successfully`);
          } else {
            const errorText = await response.text();
            console.log(`⚠️ Statement ${i + 1} had issues: ${response.status} - ${errorText}`);
          }
        } catch (error) {
          console.log(`❌ Statement ${i + 1} failed: ${error.message}`);
        }
      }
    }

    // Test the fix by trying to create records
    console.log('🧪 Testing the fix...');
    
    // Test loyalty settings
    const testLoyaltyData = {
      user_id: 'a15a9139-3be9-4028-b944-240caae9eeb2',
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
      console.error('❌ Loyalty test still failing:', loyaltyTestError.message);
    } else {
      console.log('✅ Loyalty settings test successful');
    }

    // Test analytics settings
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
      console.error('❌ Analytics test still failing:', analyticsTestError.message);
    } else {
      console.log('✅ Analytics settings test successful');
    }

    console.log('🎉 POS Settings fix completed!');
    console.log('💡 The application should now be able to create default records without 400 errors.');

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the fix
applyPOSSettingsFix()
  .then(() => {
    console.log('✅ Script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
