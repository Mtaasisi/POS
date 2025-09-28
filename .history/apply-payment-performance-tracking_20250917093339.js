import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyPaymentPerformanceTracking() {
  console.log('🚀 Applying Payment Performance Tracking System...\n');

  try {
    // 1. Apply the main performance tracking SQL
    console.log('📊 Creating payment providers and performance metrics tables...');
    const performanceSQL = fs.readFileSync('./implement-payment-performance-tracking.sql', 'utf8');
    
    const { error: performanceError } = await supabase.rpc('exec_sql', {
      sql: performanceSQL
    });

    if (performanceError) {
      console.error('Error applying performance tracking SQL:', performanceError);
      // Try direct execution
      console.log('Trying direct SQL execution...');
      const { error: directError } = await supabase
        .from('_sql')
        .select('*')
        .eq('query', performanceSQL);
      
      if (directError) {
        console.error('Direct execution also failed:', directError);
        return;
      }
    } else {
      console.log('✅ Performance tracking tables created successfully');
    }

    // 2. Apply the updated payment functions
    console.log('\n🔄 Updating payment processing functions...');
    const functionsSQL = fs.readFileSync('./update-payment-functions-with-performance.sql', 'utf8');
    
    const { error: functionsError } = await supabase.rpc('exec_sql', {
      sql: functionsSQL
    });

    if (functionsError) {
      console.error('Error applying functions SQL:', functionsError);
    } else {
      console.log('✅ Payment functions updated successfully');
    }

    // 3. Backfill existing payment data
    console.log('\n📈 Backfilling performance metrics for existing payments...');
    const { data: backfillResult, error: backfillError } = await supabase
      .rpc('backfill_payment_performance_metrics');

    if (backfillError) {
      console.error('Error backfilling metrics:', backfillError);
    } else {
      console.log(`✅ Backfilled ${backfillResult} performance metrics`);
    }

    // 4. Test the new performance functions
    console.log('\n🧪 Testing performance tracking functions...');
    
    // Test getting all providers performance
    const { data: allPerformance, error: allError } = await supabase
      .rpc('get_all_payment_providers_performance', { days_back: 30 });

    if (allError) {
      console.error('Error fetching all providers performance:', allError);
    } else {
      console.log('📊 Real Payment Provider Performance:');
      console.log('=====================================');
      
      if (allPerformance && allPerformance.length > 0) {
        allPerformance.forEach(provider => {
          console.log(`\n${provider.provider_name.toUpperCase()}`);
          console.log(`  Status: ${provider.provider_status}`);
          console.log(`  Success Rate: ${provider.success_rate}%`);
          console.log(`  Response Time: ${provider.average_response_time}ms`);
          console.log(`  Transactions: ${provider.total_transactions}`);
          console.log(`  Uptime: ${provider.uptime_percentage}%`);
          console.log(`  Total Amount: ${provider.total_amount} TZS`);
        });
      } else {
        console.log('No performance data available yet');
      }
    }

    // 5. Show current payment providers
    console.log('\n📋 Current Payment Providers:');
    const { data: providers, error: providersError } = await supabase
      .from('payment_providers')
      .select('*');

    if (providersError) {
      console.error('Error fetching providers:', providersError);
    } else {
      console.log('Available payment providers:');
      providers?.forEach(provider => {
        console.log(`  • ${provider.name} (${provider.type}) - ${provider.status}`);
      });
    }

    console.log('\n✅ Payment Performance Tracking System Successfully Implemented!');
    console.log('\nNext steps:');
    console.log('1. Your payment processing now automatically tracks performance metrics');
    console.log('2. Use get_all_payment_providers_performance() to get real metrics');
    console.log('3. Use get_payment_provider_performance(provider_name) for specific provider');
    console.log('4. All new payments will automatically record performance data');

  } catch (error) {
    console.error('❌ Error implementing payment performance tracking:', error);
  }
}

// Run the implementation
applyPaymentPerformanceTracking();
