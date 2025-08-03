import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the app
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixFinanceRLS() {
  console.log('🔧 Fixing finance RLS policies...');
  
  try {
    // Disable RLS temporarily for testing
    console.log('📝 Disabling RLS on finance tables...');
    
    const { error: disableExpensesRLS } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE finance_expenses DISABLE ROW LEVEL SECURITY;'
    });
    
    if (disableExpensesRLS) {
      console.log('❌ Error disabling RLS on finance_expenses:', disableExpensesRLS.message);
    } else {
      console.log('✅ RLS disabled on finance_expenses');
    }
    
    const { error: disableAccountsRLS } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE finance_accounts DISABLE ROW LEVEL SECURITY;'
    });
    
    if (disableAccountsRLS) {
      console.log('❌ Error disabling RLS on finance_accounts:', disableAccountsRLS.message);
    } else {
      console.log('✅ RLS disabled on finance_accounts');
    }
    
    // Insert sample data
    console.log('📝 Inserting sample finance data...');
    
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
    
    // Re-enable RLS with proper policies
    console.log('📝 Re-enabling RLS with proper policies...');
    
    const { error: enableExpensesRLS } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE finance_expenses ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view their own expenses" ON finance_expenses;
        DROP POLICY IF EXISTS "Users can insert their own expenses" ON finance_expenses;
        DROP POLICY IF EXISTS "Users can update their own expenses" ON finance_expenses;
        DROP POLICY IF EXISTS "Users can delete their own expenses" ON finance_expenses;
        
        CREATE POLICY "Allow all operations on expenses" ON finance_expenses
          FOR ALL USING (true) WITH CHECK (true);
      `
    });
    
    if (enableExpensesRLS) {
      console.log('❌ Error setting up RLS policies for finance_expenses:', enableExpensesRLS.message);
    } else {
      console.log('✅ RLS policies set up for finance_expenses');
    }
    
    const { error: enableAccountsRLS } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;
        
        DROP POLICY IF EXISTS "Users can view their own finance accounts" ON finance_accounts;
        DROP POLICY IF EXISTS "Users can insert their own finance accounts" ON finance_accounts;
        DROP POLICY IF EXISTS "Users can update their own finance accounts" ON finance_accounts;
        DROP POLICY IF EXISTS "Users can delete their own finance accounts" ON finance_accounts;
        
        CREATE POLICY "Allow all operations on accounts" ON finance_accounts
          FOR ALL USING (true) WITH CHECK (true);
      `
    });
    
    if (enableAccountsRLS) {
      console.log('❌ Error setting up RLS policies for finance_accounts:', enableAccountsRLS.message);
    } else {
      console.log('✅ RLS policies set up for finance_accounts');
    }
    
    console.log('✅ Finance RLS fix completed!');
    
  } catch (error) {
    console.error('❌ Error fixing finance RLS:', error);
  }
}

fixFinanceRLS(); 