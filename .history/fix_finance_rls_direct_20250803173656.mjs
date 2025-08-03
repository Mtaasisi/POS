import { createClient } from '@supabase/supabase-js';

// Try with service role key if available
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjcxMTUyNCwiZXhwIjoyMDY4Mjg3NTI0fQ.Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8Ej8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixFinanceRLSDirect() {
  console.log('🔧 Fixing finance RLS policies directly...');
  
  try {
    // Try to insert sample data with service role
    console.log('📝 Inserting sample finance data with service role...');
    
    const { data: sampleExpense, error: insertExpenseError } = await supabase
      .from('finance_expenses')
      .insert([{
        title: 'Office Supplies',
        description: 'Purchase of office supplies for the month',
        amount: 150.00,
        category: 'Office Supplies',
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        status: 'paid'
      }])
      .select();
    
    if (insertExpenseError) {
      console.log('❌ Error inserting sample expense:', insertExpenseError.message);
    } else {
      console.log('✅ Sample expense inserted:', sampleExpense);
    }
    
    const { data: sampleAccount, error: insertAccountError } = await supabase
      .from('finance_accounts')
      .insert([{
        name: 'Main Cash Account',
        type: 'cash',
        balance: 1000.00,
        is_active: true
      }])
      .select();
    
    if (insertAccountError) {
      console.log('❌ Error inserting sample account:', insertAccountError.message);
    } else {
      console.log('✅ Sample account inserted:', sampleAccount);
    }
    
    // Test if we can read the data
    console.log('📊 Testing data retrieval...');
    
    const { data: expenses, error: expensesError } = await supabase
      .from('finance_expenses')
      .select('*');
    
    if (expensesError) {
      console.log('❌ Error fetching expenses:', expensesError.message);
    } else {
      console.log('✅ Expenses data:', expenses);
      console.log('📊 Number of expenses:', expenses?.length || 0);
    }
    
    const { data: accounts, error: accountsError } = await supabase
      .from('finance_accounts')
      .select('*');
    
    if (accountsError) {
      console.log('❌ Error fetching accounts:', accountsError.message);
    } else {
      console.log('✅ Accounts data:', accounts);
      console.log('📊 Number of accounts:', accounts?.length || 0);
    }
    
  } catch (error) {
    console.error('❌ Error fixing finance RLS:', error);
  }
}

fixFinanceRLSDirect(); 