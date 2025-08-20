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

async function identifyAllMissingColumns() {
  console.log('🔍 Identifying ALL missing columns in POS settings tables...');

  // Define all the columns that the application tries to insert
  const loyaltyColumns = [
    'user_id',
    'business_id',
    'enable_loyalty_program',
    'enable_points_system',
    'enable_tier_system',
    'points_per_currency',
    'currency_per_point',
    'minimum_points_redemption',
    'maximum_points_redemption',
    'enable_birthday_rewards',
    'birthday_points_bonus',
    'enable_referral_program',
    'referral_points_bonus',
    'enable_anniversary_rewards',
    'anniversary_points_bonus',
    'enable_first_purchase_bonus',
    'first_purchase_points_bonus',
    'enable_spending_tiers',
    'bronze_tier_threshold',
    'silver_tier_threshold',
    'gold_tier_threshold',
    'platinum_tier_threshold',
    'bronze_points_multiplier',
    'silver_points_multiplier',
    'gold_points_multiplier',
    'platinum_points_multiplier',
    'enable_points_expiry',
    'points_expiry_days',
    'enable_auto_tier_upgrade',
    'enable_auto_tier_downgrade'
  ];

  const analyticsColumns = [
    'user_id',
    'business_id',
    'enable_sales_analytics',
    'enable_inventory_analytics',
    'enable_customer_analytics',
    'enable_financial_analytics',
    'enable_performance_analytics',
    'enable_trend_analysis',
    'enable_forecasting',
    'enable_comparative_analysis',
    'enable_segmentation_analysis',
    'enable_correlation_analysis',
    'enable_predictive_analytics',
    'enable_real_time_analytics',
    'enable_historical_analytics',
    'enable_custom_reports',
    'enable_scheduled_reports',
    'enable_export_reports',
    'enable_email_reports',
    'enable_dashboard_analytics',
    'enable_chart_visualizations',
    'enable_table_visualizations',
    'enable_metric_cards',
    'enable_kpi_tracking',
    'enable_goal_tracking',
    'enable_alert_system',
    'enable_anomaly_detection',
    'enable_benchmarking',
    'enable_competitor_analysis',
    'enable_market_analysis',
    'enable_customer_insights',
    'enable_product_insights',
    'enable_sales_insights',
    'enable_inventory_insights'
  ];

  const missingLoyaltyColumns = [];
  const missingAnalyticsColumns = [];

  try {
    console.log('🧪 Testing loyalty customer settings columns...');
    
    // Test each loyalty column individually
    for (const column of loyaltyColumns) {
      try {
        const testData = { user_id: '00000000-0000-0000-0000-000000000000' };
        
        // Add the specific column we're testing
        if (column === 'user_id') {
          testData[column] = '00000000-0000-0000-0000-000000000000';
        } else if (column.includes('enable_')) {
          testData[column] = true;
        } else if (column.includes('points_') || column.includes('bonus') || column.includes('days')) {
          testData[column] = 100;
        } else if (column.includes('threshold') || column.includes('multiplier')) {
          testData[column] = 1.00;
        } else if (column === 'business_id') {
          testData[column] = null;
        } else {
          testData[column] = 'test';
        }

        const { error } = await supabase
          .from('lats_pos_loyalty_customer_settings')
          .insert(testData);

        if (error && error.message.includes(`Could not find the '${column}' column`)) {
          missingLoyaltyColumns.push(column);
          console.log(`❌ Missing column: ${column}`);
        }
      } catch (err) {
        // Ignore other errors, we only care about missing column errors
      }
    }

    console.log('🧪 Testing analytics reporting settings columns...');
    
    // Test each analytics column individually
    for (const column of analyticsColumns) {
      try {
        const testData = { user_id: '00000000-0000-0000-0000-000000000000' };
        
        // Add the specific column we're testing
        if (column === 'user_id') {
          testData[column] = '00000000-0000-0000-0000-000000000000';
        } else if (column.includes('enable_')) {
          testData[column] = true;
        } else if (column === 'business_id') {
          testData[column] = null;
        } else {
          testData[column] = 'test';
        }

        const { error } = await supabase
          .from('lats_pos_analytics_reporting_settings')
          .insert(testData);

        if (error && error.message.includes(`Could not find the '${column}' column`)) {
          missingAnalyticsColumns.push(column);
          console.log(`❌ Missing column: ${column}`);
        }
      } catch (err) {
        // Ignore other errors, we only care about missing column errors
      }
    }

    // Generate the SQL fix
    console.log('\n📋 Generating SQL fix...');
    console.log('\n-- Complete Fix for POS Settings Missing Columns');
    console.log('-- Copy this SQL and run it in your Supabase dashboard\n');

    if (missingLoyaltyColumns.length > 0) {
      console.log('-- Fix Loyalty Customer Settings Table');
      console.log('ALTER TABLE lats_pos_loyalty_customer_settings');
      const loyaltyAlters = missingLoyaltyColumns.map(column => {
        if (column.includes('enable_')) {
          return `ADD COLUMN IF NOT EXISTS ${column} BOOLEAN DEFAULT true`;
        } else if (column.includes('points_') || column.includes('bonus') || column.includes('days')) {
          return `ADD COLUMN IF NOT EXISTS ${column} INTEGER DEFAULT 100`;
        } else if (column.includes('threshold') || column.includes('multiplier')) {
          return `ADD COLUMN IF NOT EXISTS ${column} DECIMAL(10,2) DEFAULT 1.00`;
        } else if (column === 'currency_per_point') {
          return `ADD COLUMN IF NOT EXISTS ${column} DECIMAL(10,2) DEFAULT 0.01`;
        } else {
          return `ADD COLUMN IF NOT EXISTS ${column} VARCHAR(255) DEFAULT ''`;
        }
      });
      console.log(loyaltyAlters.join(',\n'));
      console.log(';');
    }

    if (missingAnalyticsColumns.length > 0) {
      console.log('\n-- Fix Analytics Reporting Settings Table');
      console.log('ALTER TABLE lats_pos_analytics_reporting_settings');
      const analyticsAlters = missingAnalyticsColumns.map(column => {
        if (column.includes('enable_')) {
          return `ADD COLUMN IF NOT EXISTS ${column} BOOLEAN DEFAULT true`;
        } else {
          return `ADD COLUMN IF NOT EXISTS ${column} VARCHAR(255) DEFAULT ''`;
        }
      });
      console.log(analyticsAlters.join(',\n'));
      console.log(';');
    }

    console.log('\n📊 Summary:');
    console.log(`Missing loyalty columns: ${missingLoyaltyColumns.length}`);
    console.log(`Missing analytics columns: ${missingAnalyticsColumns.length}`);
    
    if (missingLoyaltyColumns.length === 0 && missingAnalyticsColumns.length === 0) {
      console.log('✅ No missing columns found! The tables should be working correctly.');
    } else {
      console.log('\n💡 Apply the SQL above in your Supabase dashboard to fix all missing columns.');
    }

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

// Run the identification
identifyAllMissingColumns()
  .then(() => {
    console.log('\n✅ Column identification completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Identification failed:', error);
    process.exit(1);
  });
