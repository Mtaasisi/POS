import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMobilePaymentAccounts() {
  console.log('🚀 Adding mobile payment finance accounts...');
  
  try {
    // Mobile payment finance accounts
    const mobilePaymentAccounts = [
      {
        name: 'M-Pesa',
        type: 'mobile_money',
        balance: 0,
        currency: 'TZS',
        is_active: true,
        is_payment_method: true,
        payment_icon: '📱',
        payment_color: '#00A651',
        payment_description: 'Safaricom M-Pesa mobile money',
        notes: 'Primary mobile money payment method'
      },
      {
        name: 'Airtel Money',
        type: 'mobile_money',
        balance: 0,
        currency: 'TZS',
        is_active: true,
        is_payment_method: true,
        payment_icon: '📱',
        payment_color: '#FF0000',
        payment_description: 'Airtel Money mobile payments',
        notes: 'Airtel mobile money payment method'
      },
      {
        name: 'ZenoPay',
        type: 'mobile_money',
        balance: 0,
        currency: 'TZS',
        is_active: true,
        is_payment_method: true,
        payment_icon: '📱',
        payment_color: '#3B82F6',
        payment_description: 'ZenoPay mobile money gateway',
        notes: 'ZenoPay mobile money integration'
      },
      {
        name: 'Tigo Pesa',
        type: 'mobile_money',
        balance: 0,
        currency: 'TZS',
        is_active: true,
        is_payment_method: true,
        payment_icon: '📱',
        payment_color: '#FF6B35',
        payment_description: 'Tigo Pesa mobile money',
        notes: 'Tigo mobile money payment method'
      },
      {
        name: 'Halopesa',
        type: 'mobile_money',
        balance: 0,
        currency: 'TZS',
        is_active: true,
        is_payment_method: true,
        payment_icon: '📱',
        payment_color: '#8B5CF6',
        payment_description: 'Halopesa mobile money',
        notes: 'Halopesa mobile money payment method'
      }
    ];

    console.log('📝 Adding mobile payment accounts...');
    
    for (const account of mobilePaymentAccounts) {
      const { error } = await supabase
        .from('finance_accounts')
        .insert(account);
      
      if (error) {
        console.log(`⚠️  Account ${account.name}: ${error.message}`);
      } else {
        console.log(`✅ Added mobile payment account: ${account.name}`);
      }
    }

    // Add traditional payment methods
    const traditionalPaymentAccounts = [
      {
        name: 'Cash Register',
        type: 'cash',
        balance: 0,
        currency: 'TZS',
        is_active: true,
        is_payment_method: true,
        payment_icon: '💵',
        payment_color: '#10B981',
        payment_description: 'Physical cash payments',
        notes: 'Main cash register for physical payments'
      },
      {
        name: 'Credit Card Terminal',
        type: 'credit_card',
        balance: 0,
        currency: 'TZS',
        is_active: true,
        is_payment_method: true,
        payment_icon: '💳',
        payment_color: '#3B82F6',
        payment_description: 'Credit and debit card payments',
        notes: 'Card payment terminal'
      },
      {
        name: 'Bank Transfer Account',
        type: 'bank',
        balance: 0,
        currency: 'TZS',
        is_active: true,
        is_payment_method: true,
        payment_icon: '🏦',
        payment_color: '#059669',
        payment_description: 'Direct bank transfers',
        notes: 'Bank transfer payment method'
      }
    ];

    console.log('📝 Adding traditional payment accounts...');
    
    for (const account of traditionalPaymentAccounts) {
      const { error } = await supabase
        .from('finance_accounts')
        .insert(account);
      
      if (error) {
        console.log(`⚠️  Account ${account.name}: ${error.message}`);
      } else {
        console.log(`✅ Added traditional payment account: ${account.name}`);
      }
    }

    console.log('🎉 Mobile payment accounts added successfully!');
    
    // Verify the accounts
    console.log('🔍 Verifying payment accounts...');
    const { data: paymentAccounts } = await supabase
      .from('finance_accounts')
      .select('*')
      .eq('is_payment_method', true)
      .eq('is_active', true);
    
    console.log(`📊 Total payment accounts: ${paymentAccounts?.length || 0}`);
    
    const mobileAccounts = paymentAccounts?.filter(acc => acc.type === 'mobile_money') || [];
    console.log(`📱 Mobile money accounts: ${mobileAccounts.length}`);
    
    mobileAccounts.forEach(account => {
      console.log(`  - ${account.name} (${account.payment_description})`);
    });

  } catch (error) {
    console.error('❌ Error adding mobile payment accounts:', error);
  }
}

addMobilePaymentAccounts();
