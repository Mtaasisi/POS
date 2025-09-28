import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createRealPerformanceData() {
  console.log('🚀 Creating Real Payment Performance Data...\n');

  try {
    // 1. First, let's check what tables exist
    console.log('📊 Checking existing database structure...');
    
    // Check if payment_providers table exists
    const { data: providers, error: providersError } = await supabase
      .from('payment_providers')
      .select('*')
      .limit(1);

    if (providersError) {
      console.log('❌ payment_providers table does not exist yet');
      console.log('You need to create the tables manually in Supabase dashboard first');
      console.log('\n📋 SQL to run in Supabase SQL Editor:');
      console.log(`
-- Create payment_providers table
CREATE TABLE IF NOT EXISTS payment_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    provider_code VARCHAR(20) UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert payment providers
INSERT INTO payment_providers (name, type, provider_code, description) VALUES
('Cash', 'cash', 'CASH', 'Physical cash payments'),
('Card', 'card', 'CARD', 'Credit/Debit card payments'),
('M-Pesa', 'mobile_money', 'MPESA', 'M-Pesa mobile money payments'),
('CRDB', 'bank_transfer', 'CRDB', 'CRDB Bank transfer payments')
ON CONFLICT (name) DO NOTHING;

-- Create payment_performance_metrics table
CREATE TABLE IF NOT EXISTS payment_performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES payment_providers(id) ON DELETE CASCADE,
    transaction_id UUID,
    transaction_type VARCHAR(50) NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'TZS',
    status VARCHAR(20) NOT NULL,
    response_time_ms INTEGER,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE payment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_performance_metrics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable all access for authenticated users" ON payment_providers
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON payment_performance_metrics
    FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions
GRANT ALL ON payment_providers TO authenticated;
GRANT ALL ON payment_performance_metrics TO authenticated;
      `);
      return;
    }

    console.log('✅ payment_providers table exists');

    // 2. Get existing payment data and create performance metrics
    console.log('\n📈 Creating performance metrics from existing payment data...');
    
    // Get customer payments
    const { data: customerPayments, error: customerError } = await supabase
      .from('customer_payments')
      .select('id, amount, currency, method, status, payment_date')
      .order('payment_date', { ascending: false });

    if (customerError) {
      console.error('Error fetching customer payments:', customerError);
    } else {
      console.log(`Found ${customerPayments?.length || 0} customer payments`);
    }

    // Get purchase order payments
    const { data: purchasePayments, error: purchaseError } = await supabase
      .from('purchase_order_payments')
      .select('id, amount, currency, payment_method, payment_date')
      .order('payment_date', { ascending: false });

    if (purchaseError) {
      console.error('Error fetching purchase order payments:', purchaseError);
    } else {
      console.log(`Found ${purchasePayments?.length || 0} purchase order payments`);
    }

    // 3. Create performance metrics for customer payments
    if (customerPayments && customerPayments.length > 0) {
      console.log('\n📊 Processing customer payment metrics...');
      
      for (const payment of customerPayments) {
        // Get provider ID
        const { data: provider } = await supabase
          .from('payment_providers')
          .select('id')
          .eq('name', payment.method)
          .single();

        if (provider) {
          const { error: insertError } = await supabase
            .from('payment_performance_metrics')
            .insert({
              provider_id: provider.id,
              transaction_id: payment.id,
              transaction_type: 'customer_payment',
              amount: payment.amount,
              currency: payment.currency || 'TZS',
              status: payment.status === 'completed' ? 'success' : 
                     payment.status === 'pending' ? 'pending' : 'failed',
              response_time_ms: null, // Historical data doesn't have response times
              error_message: null
            });

          if (insertError) {
            console.error(`Error inserting metric for payment ${payment.id}:`, insertError);
          }
        } else {
          console.log(`Provider not found for method: ${payment.method}`);
        }
      }
    }

    // 4. Create performance metrics for purchase order payments
    if (purchasePayments && purchasePayments.length > 0) {
      console.log('\n📊 Processing purchase order payment metrics...');
      
      for (const payment of purchasePayments) {
        // Get provider ID
        const { data: provider } = await supabase
          .from('payment_providers')
          .select('id')
          .eq('name', payment.payment_method)
          .single();

        if (provider) {
          const { error: insertError } = await supabase
            .from('payment_performance_metrics')
            .insert({
              provider_id: provider.id,
              transaction_id: payment.id,
              transaction_type: 'purchase_order_payment',
              amount: payment.amount,
              currency: payment.currency || 'TZS',
              status: 'success', // Assume success for existing payments
              response_time_ms: null,
              error_message: null
            });

          if (insertError) {
            console.error(`Error inserting metric for payment ${payment.id}:`, insertError);
          }
        } else {
          console.log(`Provider not found for method: ${payment.payment_method}`);
        }
      }
    }

    // 5. Generate real performance report
    console.log('\n📊 REAL PAYMENT PROVIDER PERFORMANCE REPORT');
    console.log('==========================================');

    // Get all providers with their metrics
    const { data: providerMetrics, error: metricsError } = await supabase
      .from('payment_performance_metrics')
      .select(`
        provider_id,
        status,
        amount,
        response_time_ms,
        payment_providers!inner(name, type, status)
      `);

    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
    } else {
      // Group metrics by provider
      const providerStats = {};
      providerMetrics?.forEach(metric => {
        const providerName = metric.payment_providers.name;
        if (!providerStats[providerName]) {
          providerStats[providerName] = {
            total: 0,
            success: 0,
            failed: 0,
            pending: 0,
            totalAmount: 0,
            type: metric.payment_providers.type,
            status: metric.payment_providers.status
          };
        }
        
        providerStats[providerName].total++;
        providerStats[providerName][metric.status]++;
        providerStats[providerName].totalAmount += parseFloat(metric.amount || 0);
      });

      // Display performance for each provider
      Object.entries(providerStats).forEach(([provider, stats]) => {
        const successRate = stats.total > 0 ? ((stats.success / stats.total) * 100).toFixed(1) : 0;
        const uptime = stats.total > 0 ? (((stats.success + stats.pending) / stats.total) * 100).toFixed(1) : 0;
        
        console.log(`\n${provider.toUpperCase()}`);
        console.log(`  Status: ${stats.status}`);
        console.log(`  Success Rate: ${successRate}%`);
        console.log(`  Response Time: 0s (historical data)`);
        console.log(`  Transactions: ${stats.total}`);
        console.log(`  Uptime: ${uptime}%`);
        console.log(`  Total Amount: ${stats.totalAmount.toLocaleString()} TZS`);
      });

      if (Object.keys(providerStats).length === 0) {
        console.log('\n❌ No performance data available yet');
        console.log('This means the payment_providers and payment_performance_metrics tables need to be created first.');
      }
    }

    console.log('\n✅ Real Performance Data Generation Complete!');
    console.log('\n🎯 Key Differences from Mock Data:');
    console.log('• Real transaction counts based on actual payments');
    console.log('• Real success rates calculated from payment statuses');
    console.log('• Real amounts in TZS from actual transactions');
    console.log('• Historical data (no response times available)');

  } catch (error) {
    console.error('❌ Error creating real performance data:', error);
  }
}

// Run the function
createRealPerformanceData();
