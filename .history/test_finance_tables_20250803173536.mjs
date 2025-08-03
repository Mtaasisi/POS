import { createClient } from '@supabase/supabase-js';

// Use the same configuration as the app
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testFinanceTables() {
  console.log('🔍 Testing finance tables...');
  
  try {
    // Test if finance_expenses table exists
    const { data: expenses, error: expensesError } = await supabase
      .from('finance_expenses')
      .select('count')
      .limit(1);
    
    if (expensesError) {
      console.log('❌ finance_expenses table error:', expensesError.message);
      
      // Try to create the table
      console.log('📝 Attempting to create finance_expenses table...');
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS finance_expenses (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            title VARCHAR(255) NOT NULL,
            description TEXT,
            amount DECIMAL(15,2) NOT NULL,
            category VARCHAR(255),
            expense_date DATE NOT NULL,
            payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'card', 'transfer', 'mobile_money', 'check')),
            status VARCHAR(50) DEFAULT 'paid' CHECK (status IN ('paid', 'pending', 'cancelled')),
            receipt_url TEXT,
            account_id UUID,
            created_by UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createError) {
        console.log('❌ Failed to create finance_expenses table:', createError.message);
      } else {
        console.log('✅ finance_expenses table created successfully');
      }
    } else {
      console.log('✅ finance_expenses table exists');
    }
    
    // Test if finance_accounts table exists
    const { data: accounts, error: accountsError } = await supabase
      .from('finance_accounts')
      .select('count')
      .limit(1);
    
    if (accountsError) {
      console.log('❌ finance_accounts table error:', accountsError.message);
      
      // Try to create the table
      console.log('📝 Attempting to create finance_accounts table...');
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS finance_accounts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR(255) NOT NULL,
            type VARCHAR(50) NOT NULL CHECK (type IN ('bank', 'cash', 'mobile_money', 'credit_card', 'savings', 'investment')),
            balance DECIMAL(15,2) NOT NULL DEFAULT 0,
            account_number VARCHAR(100),
            bank_name VARCHAR(255),
            currency VARCHAR(10) DEFAULT 'KES',
            is_active BOOLEAN DEFAULT true,
            notes TEXT,
            created_by UUID,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
          );
        `
      });
      
      if (createError) {
        console.log('❌ Failed to create finance_accounts table:', createError.message);
      } else {
        console.log('✅ finance_accounts table created successfully');
      }
    } else {
      console.log('✅ finance_accounts table exists');
    }
    
  } catch (error) {
    console.error('❌ Error testing finance tables:', error);
  }
}

testFinanceTables(); 