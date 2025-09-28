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

async function updatePaymentIcons() {
  try {
    console.log('🔄 Updating payment method icons from emoji to SVG paths...');

    // Define the mapping from emoji to SVG paths
    const iconMappings = {
      '💵': '/icons/payment-methods/cash.svg',           // Cash
      '💳': '/icons/payment-methods/visa.svg',           // Card
      '📱': '/icons/payment-methods/mpesa.svg',          // Mobile Money (default)
      '🏦': '/icons/payment-methods/bank-transfer.svg'   // Bank Transfer
    };

    // Update each payment method
    const updates = [
      {
        name: 'Cash',
        newIcon: '/icons/payment-methods/cash.svg'
      },
      {
        name: 'Card',
        newIcon: '/icons/payment-methods/visa.svg'
      },
      {
        name: 'ZenoPay',
        newIcon: '/icons/payment-methods/mpesa.svg'
      },
      {
        name: 'M-Pesa',
        newIcon: '/icons/payment-methods/mpesa.svg'
      },
      {
        name: 'Airtel Money',
        newIcon: '/icons/payment-methods/airtel-money.svg'
      },
      {
        name: 'Bank Transfer',
        newIcon: '/icons/payment-methods/bank-transfer.svg'
      }
    ];

    for (const update of updates) {
      const { data, error } = await supabase
        .from('finance_accounts')
        .update({ payment_icon: update.newIcon })
        .eq('name', update.name)
        .eq('is_payment_method', true);

      if (error) {
        console.error(`❌ Error updating ${update.name}:`, error);
      } else {
        console.log(`✅ Updated ${update.name} icon to ${update.newIcon}`);
      }
    }

    // Also update any other payment methods that might have emoji icons
    const { data: allPaymentMethods, error: fetchError } = await supabase
      .from('finance_accounts')
      .select('id, name, payment_icon, type')
      .eq('is_payment_method', true);

    if (fetchError) {
      console.error('❌ Error fetching payment methods:', fetchError);
      return;
    }

    console.log('\n📋 Current payment method icons:');
    allPaymentMethods.forEach(method => {
      console.log(`  ${method.name}: ${method.payment_icon || 'No icon'}`);
    });

    console.log('\n✅ Payment icon update completed!');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the update
updatePaymentIcons();
