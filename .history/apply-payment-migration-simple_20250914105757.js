import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createPaymentMethodsTable() {
  try {
    console.log('📋 Creating payment_methods table...');
    
    // Check if table already exists
    const { data: existing, error: checkError } = await supabase
      .from('payment_methods')
      .select('id')
      .limit(1);
    
    if (!checkError) {
      console.log('✅ payment_methods table already exists');
      return true;
    }
    
    // Create the table using a direct SQL approach
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS payment_methods (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(100) NOT NULL,
        description TEXT,
        account_id UUID REFERENCES finance_accounts(id),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    
    // Try to execute via a different method
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({ sql: createTableSQL })
    });
    
    if (response.ok) {
      console.log('✅ payment_methods table created');
      return true;
    } else {
      console.log('⚠️  Could not create table via exec_sql, trying alternative...');
      return false;
    }
  } catch (error) {
    console.log('⚠️  Error creating payment_methods table:', error.message);
    return false;
  }
}

async function insertDefaultPaymentMethods() {
  try {
    console.log('📋 Inserting default payment methods...');
    
    // Get finance accounts
    const { data: accounts, error: accountsError } = await supabase
      .from('finance_accounts')
      .select('id, name');
    
    if (accountsError) {
      console.log('⚠️  Could not fetch finance accounts:', accountsError.message);
      return false;
    }
    
    const cashAccount = accounts?.find(acc => acc.name === 'Cash');
    const crdbAccount = accounts?.find(acc => acc.name === 'CRDB');
    const cardAccount = accounts?.find(acc => acc.name === 'Card');
    
    const paymentMethods = [
      {
        name: 'Cash Payment',
        description: 'Cash payment method',
        account_id: cashAccount?.id || null,
        is_active: true
      },
      {
        name: 'Bank Transfer',
        description: 'Bank transfer payment method',
        account_id: crdbAccount?.id || null,
        is_active: true
      },
      {
        name: 'Card Payment',
        description: 'Card payment method',
        account_id: cardAccount?.id || null,
        is_active: true
      }
    ];
    
    const { data, error } = await supabase
      .from('payment_methods')
      .upsert(paymentMethods, { onConflict: 'name' })
      .select();
    
    if (error) {
      console.log('⚠️  Error inserting payment methods:', error.message);
      return false;
    }
    
    console.log('✅ Default payment methods inserted');
    return true;
  } catch (error) {
    console.log('⚠️  Error inserting payment methods:', error.message);
    return false;
  }
}

async function addPaymentColumnsToPurchaseOrders() {
  try {
    console.log('📋 Adding payment columns to purchase orders...');
    
    // Check if columns already exist
    const { data: existing, error: checkError } = await supabase
      .from('lats_purchase_orders')
      .select('total_paid, payment_status')
      .limit(1);
    
    if (!checkError && existing && existing.length > 0) {
      const order = existing[0];
      if (order.total_paid !== undefined && order.payment_status !== undefined) {
        console.log('✅ Payment columns already exist');
        return true;
      }
    }
    
    console.log('⚠️  Payment columns need to be added via SQL migration');
    return false;
  } catch (error) {
    console.log('⚠️  Error checking payment columns:', error.message);
    return false;
  }
}

async function createPaymentProcessingFunction() {
  try {
    console.log('📋 Creating payment processing function...');
    
    // Test if function exists by trying to call it
    const { data, error } = await supabase.rpc('process_purchase_order_payment', {
      purchase_order_id_param: '00000000-0000-0000-0000-000000000000',
      payment_account_id_param: '00000000-0000-0000-0000-000000000000',
      amount_param: 0,
      currency_param: 'USD',
      payment_method_param: 'test',
      payment_method_id_param: '00000000-0000-0000-0000-000000000000',
      user_id_param: '00000000-0000-0000-0000-000000000000'
    });
    
    if (error) {
      if (error.code === 'PGRST202') {
        console.log('❌ Function process_purchase_order_payment does not exist');
        return false;
      } else {
        console.log('✅ Function exists (got expected validation error)');
        return true;
      }
    }
    
    console.log('✅ Function exists and executed successfully');
    return true;
  } catch (error) {
    console.log('❌ Error checking function:', error.message);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting payment functionality setup...\n');
  
  let allSuccess = true;
  
  // Step 1: Create payment methods table
  const tableSuccess = await createPaymentMethodsTable();
  if (!tableSuccess) allSuccess = false;
  
  // Step 2: Insert default payment methods
  const methodsSuccess = await insertDefaultPaymentMethods();
  if (!methodsSuccess) allSuccess = false;
  
  // Step 3: Check payment columns
  const columnsSuccess = await addPaymentColumnsToPurchaseOrders();
  if (!columnsSuccess) allSuccess = false;
  
  // Step 4: Check payment processing function
  const functionSuccess = await createPaymentProcessingFunction();
  if (!functionSuccess) allSuccess = false;
  
  console.log('\n📊 Setup Summary:');
  console.log(`✅ Payment methods table: ${tableSuccess ? 'Ready' : 'Failed'}`);
  console.log(`✅ Default payment methods: ${methodsSuccess ? 'Ready' : 'Failed'}`);
  console.log(`✅ Payment columns: ${columnsSuccess ? 'Ready' : 'Failed'}`);
  console.log(`✅ Payment processing function: ${functionSuccess ? 'Ready' : 'Failed'}`);
  
  if (allSuccess) {
    console.log('\n🎉 Payment functionality is ready!');
  } else {
    console.log('\n⚠️  Some components failed. The payment functionality may not work correctly.');
    console.log('\n💡 You may need to apply the SQL migration manually via the Supabase dashboard.');
  }
}

main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
