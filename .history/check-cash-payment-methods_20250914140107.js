import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkCashPaymentMethods() {
  console.log('🔍 Checking for cash payment methods...');
  
  try {
    // Check finance_accounts table
    const { data: financeAccounts, error: financeError } = await supabase
      .from('finance_accounts')
      .select('*')
      .eq('is_payment_method', true)
      .eq('is_active', true);

    if (financeError) {
      console.error('❌ Error fetching finance accounts:', financeError);
      return;
    }

    console.log('📋 Finance Accounts (Payment Methods):');
    financeAccounts?.forEach(account => {
      console.log(`  - ${account.name} (${account.type}) - ${account.is_payment_method ? 'Payment Method' : 'Not Payment Method'}`);
    });

    // Check for cash specifically
    const cashAccounts = financeAccounts?.filter(account => account.type === 'cash');
    console.log(`\n💰 Cash Payment Methods Found: ${cashAccounts?.length || 0}`);
    
    if (cashAccounts && cashAccounts.length > 0) {
      cashAccounts.forEach(account => {
        console.log(`  - ${account.name} (ID: ${account.id})`);
      });
    } else {
      console.log('⚠️  No cash payment methods found!');
    }

    // Check payment_methods table if it exists
    const { data: paymentMethods, error: paymentError } = await supabase
      .from('payment_methods')
      .select('*');

    if (paymentError) {
      console.log('ℹ️  payment_methods table does not exist or has errors:', paymentError.message);
    } else {
      console.log('\n📋 Payment Methods Table:');
      paymentMethods?.forEach(method => {
        console.log(`  - ${method.name} (${method.type || 'no type'})`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkCashPaymentMethods();
