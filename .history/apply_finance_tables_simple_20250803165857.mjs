import { createClient } from '@supabase/supabase-js';

// Load environment variables
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_ROLE_KEY are set');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupFinanceTables() {
  try {
    console.log('🔧 Setting up finance tables...');
    
    // 1. Create finance_accounts table
    console.log('📝 Creating finance_accounts table...');
    const { error: accountsError } = await supabase.rpc('exec_sql', {
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
          created_by UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (accountsError) {
      console.log('ℹ️  finance_accounts table might already exist or error:', accountsError.message);
    } else {
      console.log('✅ finance_accounts table created');
    }
    
    // 2. Create finance_expense_categories table
    console.log('📝 Creating finance_expense_categories table...');
    const { error: categoriesError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS finance_expense_categories (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name VARCHAR(255) NOT NULL,
          color VARCHAR(7) DEFAULT '#3B82F6',
          icon VARCHAR(50),
          budget_limit DECIMAL(15,2),
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (categoriesError) {
      console.log('ℹ️  finance_expense_categories table might already exist or error:', categoriesError.message);
    } else {
      console.log('✅ finance_expense_categories table created');
    }
    
    // 3. Create finance_expenses table
    console.log('📝 Creating finance_expenses table...');
    const { error: expensesError } = await supabase.rpc('exec_sql', {
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
          account_id UUID REFERENCES finance_accounts(id),
          created_by UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (expensesError) {
      console.log('ℹ️  finance_expenses table might already exist or error:', expensesError.message);
    } else {
      console.log('✅ finance_expenses table created');
    }
    
    // 4. Create finance_transfers table
    console.log('📝 Creating finance_transfers table...');
    const { error: transfersError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS finance_transfers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          from_account_id UUID NOT NULL REFERENCES finance_accounts(id),
          to_account_id UUID NOT NULL REFERENCES finance_accounts(id),
          amount DECIMAL(15,2) NOT NULL,
          description TEXT,
          transfer_date DATE NOT NULL,
          reference_number VARCHAR(100),
          status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
          created_by UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (transfersError) {
      console.log('ℹ️  finance_transfers table might already exist or error:', transfersError.message);
    } else {
      console.log('✅ finance_transfers table created');
    }
    
    // 5. Enable RLS
    console.log('🔒 Enabling Row Level Security...');
    await supabase.rpc('exec_sql', { sql: 'ALTER TABLE finance_accounts ENABLE ROW LEVEL SECURITY;' });
    await supabase.rpc('exec_sql', { sql: 'ALTER TABLE finance_expense_categories ENABLE ROW LEVEL SECURITY;' });
    await supabase.rpc('exec_sql', { sql: 'ALTER TABLE finance_expenses ENABLE ROW LEVEL SECURITY;' });
    await supabase.rpc('exec_sql', { sql: 'ALTER TABLE finance_transfers ENABLE ROW LEVEL SECURITY;' });
    
    // 6. Insert default data
    console.log('📊 Inserting default data...');
    
    // Insert default expense categories
    const { error: insertCategoriesError } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO finance_expense_categories (name, color, icon, budget_limit) VALUES
        ('Office Supplies', '#3B82F6', 'briefcase', 5000),
        ('Utilities', '#10B981', 'zap', 15000),
        ('Rent', '#F59E0B', 'home', 50000),
        ('Transportation', '#EF4444', 'truck', 8000),
        ('Marketing', '#8B5CF6', 'megaphone', 20000),
        ('Equipment', '#06B6D4', 'settings', 30000),
        ('Insurance', '#84CC16', 'shield', 12000),
        ('Maintenance', '#F97316', 'wrench', 10000),
        ('Software', '#EC4899', 'monitor', 15000),
        ('Miscellaneous', '#6B7280', 'more-horizontal', 5000)
        ON CONFLICT DO NOTHING;
      `
    });
    
    if (insertCategoriesError) {
      console.log('ℹ️  Default categories might already exist or error:', insertCategoriesError.message);
    } else {
      console.log('✅ Default expense categories inserted');
    }
    
    // Insert default cash account
    const { error: insertAccountError } = await supabase.rpc('exec_sql', {
      sql: `
        INSERT INTO finance_accounts (name, type, balance, currency) VALUES
        ('Cash Account', 'cash', 0, 'KES')
        ON CONFLICT DO NOTHING;
      `
    });
    
    if (insertAccountError) {
      console.log('ℹ️  Default account might already exist or error:', insertAccountError.message);
    } else {
      console.log('✅ Default cash account inserted');
    }
    
    console.log('\n🎉 Finance tables setup completed!');
    console.log('The following tables are now available:');
    console.log('• finance_accounts');
    console.log('• finance_expense_categories');
    console.log('• finance_expenses');
    console.log('• finance_transfers');
    
  } catch (error) {
    console.error('❌ Error setting up finance tables:', error);
  }
}

// Run the setup
setupFinanceTables(); 