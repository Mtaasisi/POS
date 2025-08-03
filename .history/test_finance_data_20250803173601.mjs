import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the app
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinanceData() {
  console.log('🔍 Testing finance data...');
  
  try {
    // Check expenses data
    const { data: expenses, error: expensesError } = await supabase
      .from('finance_expenses')
      .select('*')
      .limit(10);
    
    if (expensesError) {
      console.log('❌ Error fetching expenses:', expensesError.message);
    } else {
      console.log('📊 Expenses data:', expenses);
      console.log('📊 Number of expenses:', expenses?.length || 0);
    }
    
    // Check accounts data
    const { data: accounts, error: accountsError } = await supabase
      .from('finance_accounts')
      .select('*')
      .limit(10);
    
    if (accountsError) {
      console.log('❌ Error fetching accounts:', accountsError.message);
    } else {
      console.log('📊 Accounts data:', accounts);
      console.log('📊 Number of accounts:', accounts?.length || 0);
    }
    
    // Check if we need to insert some sample data
    if (!expenses || expenses.length === 0) {
      console.log('📝 No expenses found, inserting sample data...');
      
      const { data: sampleExpense, error: insertError } = await supabase
        .from('finance_expenses')
        .insert([{
          title: 'Sample Office Supplies',
          description: 'Purchase of office supplies for the month',
          amount: 150.00,
          category: 'Office Supplies',
          expense_date: new Date().toISOString().split('T')[0],
          payment_method: 'cash',
          status: 'paid'
        }])
        .select();
      
      if (insertError) {
        console.log('❌ Error inserting sample expense:', insertError.message);
      } else {
        console.log('✅ Sample expense inserted:', sampleExpense);
      }
    }
    
    if (!accounts || accounts.length === 0) {
      console.log('📝 No accounts found, inserting sample data...');
      
      const { data: sampleAccount, error: insertError } = await supabase
        .from('finance_accounts')
        .insert([{
          name: 'Main Cash Account',
          type: 'cash',
          balance: 1000.00,
          is_active: true
        }])
        .select();
      
      if (insertError) {
        console.log('❌ Error inserting sample account:', insertError.message);
      } else {
        console.log('✅ Sample account inserted:', sampleAccount);
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing finance data:', error);
  }
}

testFinanceData(); 