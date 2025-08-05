import { createClient } from '@supabase/supabase-js';

// Online Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function addSampleAccounts() {
  console.log('🏦 Adding sample accounts to the database...');
  
  try {
    // Check if finance_accounts table exists
    console.log('📋 Checking finance_accounts table...');
    const { data: existingAccounts, error: checkError } = await supabase
      .from('finance_accounts')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error checking finance_accounts table:', checkError.message);
      console.log('💡 The finance_accounts table might not exist yet');
      return;
    }
    
    console.log(`✅ finance_accounts table accessible. Found ${existingAccounts?.length || 0} existing accounts`);
    
    // Sample accounts to add
    const sampleAccounts = [
      {
        name: 'M-PESA',
        type: 'mobile_money',
        balance: 100000,
        account_number: 'MPESA001',
        bank_name: 'Safaricom',
        is_active: true
      },
      {
        name: 'Cash Account',
        type: 'cash',
        balance: 0,
        account_number: null,
        bank_name: null,
        is_active: true
      },
      {
        name: 'CRDB Bank',
        type: 'bank',
        balance: 2500000,
        account_number: 'CRDB123456789',
        bank_name: 'CRDB Bank',
        is_active: true
      },
      {
        name: 'NMB Bank',
        type: 'bank',
        balance: 1500000,
        account_number: 'NMB987654321',
        bank_name: 'NMB Bank',
        is_active: true
      },
      {
        name: 'Tigo Pesa',
        type: 'mobile_money',
        balance: 75000,
        account_number: 'TIGO001',
        bank_name: 'Tigo',
        is_active: true
      },
      {
        name: 'Airtel Money',
        type: 'mobile_money',
        balance: 45000,
        account_number: 'AIRTEL001',
        bank_name: 'Airtel',
        is_active: true
      },
      {
        name: 'Visa Credit Card',
        type: 'credit_card',
        balance: 500000,
        account_number: 'VISA123456789',
        bank_name: 'CRDB Bank',
        is_active: true
      },
      {
        name: 'Business Savings',
        type: 'savings',
        balance: 5000000,
        account_number: 'SAVINGS001',
        bank_name: 'NMB Bank',
        is_active: true
      }
    ];
    
    console.log('💳 Adding sample accounts...');
    
    // Insert each account
    for (const account of sampleAccounts) {
      try {
        const { data, error } = await supabase
          .from('finance_accounts')
          .insert([account])
          .select();
        
        if (error) {
          console.warn(`⚠️  Warning inserting ${account.name}:`, error.message);
        } else {
          console.log(`✅ ${account.name} account ready`);
        }
      } catch (err) {
        console.warn(`⚠️  Error inserting ${account.name}:`, err.message);
      }
    }
    
    // Verify the setup
    console.log('\n🧪 Verifying accounts...');
    const { data: finalAccounts, error: finalError } = await supabase
      .from('finance_accounts')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (finalError) {
      console.error('❌ Error checking final accounts:', finalError.message);
    } else {
      console.log(`✅ Total active accounts: ${finalAccounts?.length || 0}`);
      console.log('\n📋 Available accounts:');
      finalAccounts?.forEach((account, index) => {
        console.log(`  ${index + 1}. ${account.name} (${account.type}) - ${account.balance.toLocaleString()} Tsh`);
      });
    }
    
    console.log('\n🎉 Sample accounts setup completed!');
    console.log('📱 You can now visit the Payments Accounts page to see these accounts.');
    console.log('🌐 URL: http://localhost:3000/payments-accounts');
    
  } catch (error) {
    console.error('❌ Error adding sample accounts:', error);
  }
}

// Run the setup
addSampleAccounts(); 