const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchPaymentData() {
  console.log('🔍 Fetching Payment Data from Database...\n');

  try {
    // 1. Check customer payments
    console.log('📊 CUSTOMER PAYMENTS:');
    const { data: customerPayments, error: customerError } = await supabase
      .from('customer_payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (customerError) {
      console.error('Error fetching customer payments:', customerError);
    } else {
      console.log(`Total customer payments found: ${customerPayments?.length || 0}`);
      if (customerPayments && customerPayments.length > 0) {
        console.log('Recent customer payments:');
        customerPayments.forEach((payment, index) => {
          console.log(`${index + 1}. Amount: ${payment.amount} ${payment.currency || 'TZS'}, Method: ${payment.method}, Date: ${payment.payment_date}, Status: ${payment.status}`);
        });
      } else {
        console.log('❌ No customer payments found');
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 2. Check purchase order payments
    console.log('📊 PURCHASE ORDER PAYMENTS:');
    const { data: purchasePayments, error: purchaseError } = await supabase
      .from('purchase_order_payments')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (purchaseError) {
      console.error('Error fetching purchase order payments:', purchaseError);
    } else {
      console.log(`Total purchase order payments found: ${purchasePayments?.length || 0}`);
      if (purchasePayments && purchasePayments.length > 0) {
        console.log('Recent purchase order payments:');
        purchasePayments.forEach((payment, index) => {
          console.log(`${index + 1}. Amount: ${payment.amount} ${payment.currency || 'TZS'}, Method: ${payment.payment_method}, Date: ${payment.payment_date}`);
        });
      } else {
        console.log('❌ No purchase order payments found');
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 3. Check account transactions
    console.log('📊 ACCOUNT TRANSACTIONS:');
    const { data: accountTransactions, error: accountError } = await supabase
      .from('account_transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (accountError) {
      console.error('Error fetching account transactions:', accountError);
    } else {
      console.log(`Total account transactions found: ${accountTransactions?.length || 0}`);
      if (accountTransactions && accountTransactions.length > 0) {
        console.log('Recent account transactions:');
        accountTransactions.forEach((transaction, index) => {
          console.log(`${index + 1}. Type: ${transaction.transaction_type}, Amount: ${transaction.amount} ${transaction.currency || 'TZS'}, Balance: ${transaction.balance_after}, Date: ${transaction.created_at}`);
        });
      } else {
        console.log('❌ No account transactions found');
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 4. Check payment providers
    console.log('📊 PAYMENT PROVIDERS:');
    const { data: paymentProviders, error: providersError } = await supabase
      .from('payment_providers')
      .select('*');

    if (providersError) {
      console.error('Error fetching payment providers:', providersError);
    } else {
      console.log(`Total payment providers found: ${paymentProviders?.length || 0}`);
      if (paymentProviders && paymentProviders.length > 0) {
        console.log('Payment providers:');
        paymentProviders.forEach((provider, index) => {
          console.log(`${index + 1}. Name: ${provider.name}, Status: ${provider.status}, Type: ${provider.type}`);
        });
      } else {
        console.log('❌ No payment providers found');
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 5. Check finance accounts
    console.log('📊 FINANCE ACCOUNTS:');
    const { data: financeAccounts, error: accountsError } = await supabase
      .from('finance_accounts')
      .select('*');

    if (accountsError) {
      console.error('Error fetching finance accounts:', accountsError);
    } else {
      console.log(`Total finance accounts found: ${financeAccounts?.length || 0}`);
      if (financeAccounts && financeAccounts.length > 0) {
        console.log('Finance accounts:');
        financeAccounts.forEach((account, index) => {
          console.log(`${index + 1}. Name: ${account.name}, Balance: ${account.balance} ${account.currency || 'TZS'}, Type: ${account.account_type}`);
        });
      } else {
        console.log('❌ No finance accounts found');
      }
    }

    console.log('\n' + '='.repeat(50) + '\n');

    // 6. Summary statistics
    console.log('📈 SUMMARY STATISTICS:');
    const totalCustomerPayments = customerPayments?.length || 0;
    const totalPurchasePayments = purchasePayments?.length || 0;
    const totalAccountTransactions = accountTransactions?.length || 0;
    const totalProviders = paymentProviders?.length || 0;
    const totalAccounts = financeAccounts?.length || 0;

    console.log(`• Customer Payments: ${totalCustomerPayments}`);
    console.log(`• Purchase Order Payments: ${totalPurchasePayments}`);
    console.log(`• Account Transactions: ${totalAccountTransactions}`);
    console.log(`• Payment Providers: ${totalProviders}`);
    console.log(`• Finance Accounts: ${totalAccounts}`);

    if (totalCustomerPayments === 0 && totalPurchasePayments === 0 && totalAccountTransactions === 0) {
      console.log('\n❌ CONCLUSION: No real payment data found - the performance metrics you showed are likely test/demo data');
    } else {
      console.log('\n✅ CONCLUSION: Real payment data exists in the database');
    }

  } catch (error) {
    console.error('❌ Error fetching payment data:', error);
  }
}

// Run the function
fetchPaymentData();
