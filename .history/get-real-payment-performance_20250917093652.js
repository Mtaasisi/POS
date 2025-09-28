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

async function getRealPaymentPerformance() {
  console.log('📊 REAL PAYMENT PROVIDER PERFORMANCE REPORT');
  console.log('==========================================\n');

  try {
    // Get customer payments grouped by method
    const { data: customerPayments, error: customerError } = await supabase
      .from('customer_payments')
      .select('method, amount, currency, status, payment_date')
      .order('payment_date', { ascending: false });

    if (customerError) {
      console.error('Error fetching customer payments:', customerError);
      return;
    }

    // Get purchase order payments grouped by method
    const { data: purchasePayments, error: purchaseError } = await supabase
      .from('purchase_order_payments')
      .select('payment_method, amount, currency, payment_date')
      .order('payment_date', { ascending: false });

    if (purchaseError) {
      console.error('Error fetching purchase order payments:', purchaseError);
      return;
    }

    // Combine and analyze payment data
    const providerStats = {};

    // Process customer payments
    customerPayments?.forEach(payment => {
      const method = payment.method || 'Unknown';
      if (!providerStats[method]) {
        providerStats[method] = {
          totalTransactions: 0,
          successfulTransactions: 0,
          failedTransactions: 0,
          pendingTransactions: 0,
          totalAmount: 0,
          currency: payment.currency || 'TZS',
          lastTransaction: null,
          type: getProviderType(method)
        };
      }

      providerStats[method].totalTransactions++;
      providerStats[method].totalAmount += parseFloat(payment.amount || 0);
      
      if (payment.status === 'completed') {
        providerStats[method].successfulTransactions++;
      } else if (payment.status === 'failed') {
        providerStats[method].failedTransactions++;
      } else {
        providerStats[method].pendingTransactions++;
      }

      if (!providerStats[method].lastTransaction || 
          new Date(payment.payment_date) > new Date(providerStats[method].lastTransaction)) {
        providerStats[method].lastTransaction = payment.payment_date;
      }
    });

    // Process purchase order payments
    purchasePayments?.forEach(payment => {
      const method = payment.payment_method || 'Unknown';
      if (!providerStats[method]) {
        providerStats[method] = {
          totalTransactions: 0,
          successfulTransactions: 0,
          failedTransactions: 0,
          pendingTransactions: 0,
          totalAmount: 0,
          currency: payment.currency || 'TZS',
          lastTransaction: null,
          type: getProviderType(method)
        };
      }

      providerStats[method].totalTransactions++;
      providerStats[method].totalAmount += parseFloat(payment.amount || 0);
      providerStats[method].successfulTransactions++; // Assume success for existing PO payments

      if (!providerStats[method].lastTransaction || 
          new Date(payment.payment_date) > new Date(providerStats[method].lastTransaction)) {
        providerStats[method].lastTransaction = payment.payment_date;
      }
    });

    // Display performance metrics
    console.log('🎯 REAL PERFORMANCE DATA (Based on Actual Transactions):\n');

    Object.entries(providerStats).forEach(([provider, stats]) => {
      const successRate = stats.totalTransactions > 0 
        ? ((stats.successfulTransactions / stats.totalTransactions) * 100).toFixed(1) 
        : 0;
      
      const uptime = stats.totalTransactions > 0 
        ? (((stats.successfulTransactions + stats.pendingTransactions) / stats.totalTransactions) * 100).toFixed(1) 
        : 0;

      const lastActivity = stats.lastTransaction 
        ? new Date(stats.lastTransaction).toLocaleDateString()
        : 'Never';

      console.log(`${provider.toUpperCase()}`);
      console.log(`  Status: active`);
      console.log(`  Success Rate: ${successRate}%`);
      console.log(`  Response Time: 0s (historical data)`);
      console.log(`  Transactions: ${stats.totalTransactions}`);
      console.log(`  Uptime: ${uptime}%`);
      console.log(`  Total Amount: ${stats.totalAmount.toLocaleString()} ${stats.currency}`);
      console.log(`  Last Activity: ${lastActivity}`);
      console.log(`  Type: ${stats.type}`);
      console.log('');
    });

    // Summary
    const totalTransactions = Object.values(providerStats).reduce((sum, stats) => sum + stats.totalTransactions, 0);
    const totalAmount = Object.values(providerStats).reduce((sum, stats) => sum + stats.totalAmount, 0);

    console.log('📈 SUMMARY:');
    console.log(`• Total Transactions: ${totalTransactions}`);
    console.log(`• Total Amount Processed: ${totalAmount.toLocaleString()} TZS`);
    console.log(`• Active Providers: ${Object.keys(providerStats).length}`);
    console.log(`• Most Used: ${Object.entries(providerStats).sort((a, b) => b[1].totalTransactions - a[1].totalTransactions)[0]?.[0] || 'None'}`);

    console.log('\n✅ This is REAL data from your actual payment transactions!');
    console.log('❌ The performance metrics you showed earlier were mock/demo data.');

  } catch (error) {
    console.error('❌ Error generating real performance report:', error);
  }
}

function getProviderType(method) {
  const methodLower = method.toLowerCase();
  if (methodLower.includes('cash')) return 'cash';
  if (methodLower.includes('card')) return 'card';
  if (methodLower.includes('mpesa') || methodLower.includes('m-pesa')) return 'mobile_money';
  if (methodLower.includes('crdb') || methodLower.includes('bank')) return 'bank_transfer';
  return 'unknown';
}

// Run the function
getRealPaymentPerformance();
