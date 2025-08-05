import { createClient } from '@supabase/supabase-js';

// Online Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFinanceAccounts() {
  console.log('🏦 Checking finance accounts in online database...');
  
  try {
    // Check if finance_accounts table exists
    console.log('📋 Checking finance_accounts table...');
    const { data: accounts, error: accountsError } = await supabase
      .from('finance_accounts')
      .select('*')
      .order('name');
    
    if (accountsError) {
      console.error('❌ Error accessing finance_accounts:', accountsError.message);
      console.log('💡 The finance_accounts table might not exist yet');
      return;
    }
    
    console.log(`✅ finance_accounts table accessible. Found ${accounts?.length || 0} accounts`);
    
    if (accounts && accounts.length > 0) {
      console.log('\n📊 Current Finance Accounts:');
      console.log('┌─────────────────────┬─────────────────┬─────────────────┬─────────┐');
      console.log('│ Account Name        │ Type            │ Balance         │ Status  │');
      console.log('├─────────────────────┼─────────────────┼─────────────────┼─────────┤');
      
      accounts.forEach((account, index) => {
        const name = account.name.padEnd(19);
        const type = account.type.replace('_', ' ').padEnd(15);
        const balance = `Tsh ${account.balance.toLocaleString()}`.padEnd(15);
        const status = account.is_active ? 'Active' : 'Inactive';
        
        console.log(`│ ${name} │ ${type} │ ${balance} │ ${status} │`);
      });
      
      console.log('└─────────────────────┴─────────────────┴─────────────────┴─────────┘');
    } else {
      console.log('\n📝 No accounts found in the database');
      console.log('💡 You can add accounts through the Finance Management page');
    }
    
    // Check if the accounts you mentioned exist
    const expectedAccounts = ['M-PESA', 'Cash Account'];
    console.log('\n🔍 Checking for specific accounts:');
    
    for (const accountName of expectedAccounts) {
      const { data: specificAccount, error: specificError } = await supabase
        .from('finance_accounts')
        .select('*')
        .eq('name', accountName)
        .single();
      
      if (specificError) {
        console.log(`❌ "${accountName}" not found in database`);
      } else {
        console.log(`✅ "${accountName}" found:`);
        console.log(`   - Type: ${specificAccount.type}`);
        console.log(`   - Balance: Tsh ${specificAccount.balance.toLocaleString()}`);
        console.log(`   - Status: ${specificAccount.is_active ? 'Active' : 'Inactive'}`);
      }
    }
    
    console.log('\n💡 To add the accounts you mentioned, you can:');
    console.log('1. Go to the Finance Management page in your app');
    console.log('2. Click "Add Account" button');
    console.log('3. Add these accounts:');
    console.log('');
    console.log('   Account Name: M-PESA');
    console.log('   Type: mobile_money');
    console.log('   Balance: 100000');
    console.log('   Status: Active');
    console.log('');
    console.log('   Account Name: Cash Account');
    console.log('   Type: cash');
    console.log('   Balance: 0');
    console.log('   Status: Active');
    
  } catch (error) {
    console.error('❌ Error checking finance accounts:', error);
  }
}

// Run the check
checkFinanceAccounts(); 