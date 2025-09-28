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

async function checkAccountBalance() {
  console.log('💰 Checking Account Balances...\n');

  try {
    // Get all payment accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('finance_accounts')
      .select('*')
      .eq('is_payment_method', true)
      .eq('is_active', true);
    
    if (accountsError) {
      console.error('❌ Error fetching accounts:', accountsError);
      return;
    }

    console.log('📊 Payment Accounts:');
    accounts.forEach(account => {
      console.log(`  - ${account.name}: ${account.balance} ${account.currency}`);
    });

    // Check the specific account from the error
    const cashAccountId = 'deb92580-95dd-4018-9f6a-134b2157716c';
    const { data: cashAccount, error: cashError } = await supabase
      .from('finance_accounts')
      .select('*')
      .eq('id', cashAccountId)
      .single();

    if (cashError) {
      console.error('❌ Error fetching cash account:', cashError);
    } else {
      console.log('\n💵 Cash Account Details:');
      console.log(`  - Name: ${cashAccount.name}`);
      console.log(`  - Balance: ${cashAccount.balance} ${cashAccount.currency}`);
      console.log(`  - Type: ${cashAccount.type}`);
      console.log(`  - Active: ${cashAccount.is_active}`);
    }

    // Check the purchase order
    const purchaseOrderId = '286e5379-4508-4645-be6e-64a275d028ee';
    const { data: purchaseOrder, error: poError } = await supabase
      .from('lats_purchase_orders')
      .select('*')
      .eq('id', purchaseOrderId)
      .single();

    if (poError) {
      console.error('❌ Error fetching purchase order:', poError);
    } else {
      console.log('\n📋 Purchase Order Details:');
      console.log(`  - Order Number: ${purchaseOrder.order_number}`);
      console.log(`  - Total Amount: ${purchaseOrder.total_amount} ${purchaseOrder.currency}`);
      console.log(`  - Status: ${purchaseOrder.status}`);
    }

    // The issue: Currency mismatch
    console.log('\n⚠️ ISSUE IDENTIFIED:');
    console.log(`  - Cash Account Currency: ${cashAccount?.currency}`);
    console.log(`  - Purchase Order Currency: ${purchaseOrder?.currency}`);
    console.log(`  - Cash Account Balance: ${cashAccount?.balance} ${cashAccount?.currency}`);
    console.log(`  - Payment Amount: 1000 ${purchaseOrder?.currency}`);
    
    if (cashAccount?.currency !== purchaseOrder?.currency) {
      console.log('\n❌ CURRENCY MISMATCH:');
      console.log(`  The cash account is in ${cashAccount?.currency} but the purchase order is in ${purchaseOrder?.currency}`);
      console.log(`  The system is trying to pay 1000 ${purchaseOrder?.currency} from an account with 0 ${cashAccount?.currency}`);
    }

    if (cashAccount?.balance === 0) {
      console.log('\n❌ INSUFFICIENT BALANCE:');
      console.log(`  The cash account has 0 ${cashAccount?.currency} balance`);
      console.log(`  You need to add funds to the cash account or use a different payment method`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

checkAccountBalance().then(() => {
  console.log('\n🏁 Balance check complete');
  process.exit(0);
}).catch(error => {
  console.error('❌ Balance check failed:', error);
  process.exit(1);
});
