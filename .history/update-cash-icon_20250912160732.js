import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateCashIcon() {
  try {
    console.log('🔄 Updating cash payment method icon to new design...');

    // Update cash payment method to use the new icon
    const { data, error } = await supabase
      .from('finance_accounts')
      .update({ payment_icon: '/icons/payment-methods/cash-new.svg' })
      .eq('name', 'Cash')
      .eq('is_payment_method', true);

    if (error) {
      console.error('❌ Error updating cash icon:', error);
    } else {
      console.log('✅ Updated Cash icon to new finance money logo design');
    }

    // Verify the update
    const { data: cashMethod, error: fetchError } = await supabase
      .from('finance_accounts')
      .select('name, payment_icon')
      .eq('name', 'Cash')
      .eq('is_payment_method', true)
      .single();

    if (fetchError) {
      console.error('❌ Error fetching cash method:', fetchError);
    } else {
      console.log(`📋 Cash method now uses: ${cashMethod.payment_icon}`);
    }

    console.log('✅ Cash icon update completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the update
updateCashIcon();
