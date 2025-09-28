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

async function addFundsToCash() {
  console.log('💰 Adding funds to Cash account...\n');

  try {
    const cashAccountId = 'deb92580-95dd-4018-9f6a-134b2157716c';
    
    // Add 3,000,000 TZS (enough to cover 1000 USD at 2500 TZS/USD rate)
    const newBalance = 3000000;
    
    const { data: updatedAccount, error: updateError } = await supabase
      .from('finance_accounts')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', cashAccountId)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Error updating cash account balance:', updateError);
    } else {
      console.log('✅ Cash account balance updated successfully:');
      console.log(`  - Name: ${updatedAccount.name}`);
      console.log(`  - New Balance: ${updatedAccount.balance.toLocaleString()} ${updatedAccount.currency}`);
      console.log(`  - This should be enough to cover 1000 USD (2,500,000 TZS)`);
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addFundsToCash().then(() => {
  console.log('\n🏁 Funds added successfully');
  process.exit(0);
}).catch(error => {
  console.error('❌ Failed to add funds:', error);
  process.exit(1);
});
