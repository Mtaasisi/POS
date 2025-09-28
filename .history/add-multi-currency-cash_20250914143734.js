import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMultiCurrencyCashMethods() {
  console.log('🚀 Adding multi-currency cash payment methods...');
  
  try {
    // Add USD Cash
    const { error: usdError } = await supabase
      .from('finance_accounts')
      .upsert({
        id: '550e8400-e29b-41d4-a716-446655440007',
        name: 'Cash (USD)',
        type: 'cash',
        balance: 0,
        currency: 'USD',
        is_active: true,
        is_payment_method: true,
        payment_icon: '💵',
        payment_color: '#10B981',
        payment_description: 'Cash payments in US Dollars',
        requires_reference: false,
        requires_account_number: false,
        notes: 'USD cash payment method for foreign currency transactions'
      });
    
    if (usdError) {
      console.log('⚠️  USD Cash:', usdError.message);
    } else {
      console.log('✅ Added USD Cash payment method');
    }
    
    // Add EUR Cash
    const { error: eurError } = await supabase
      .from('finance_accounts')
      .upsert({
        id: '550e8400-e29b-41d4-a716-446655440008',
        name: 'Cash (EUR)',
        type: 'cash',
        balance: 0,
        currency: 'EUR',
        is_active: true,
        is_payment_method: true,
        payment_icon: '💵',
        payment_color: '#10B981',
        payment_description: 'Cash payments in Euros',
        requires_reference: false,
        requires_account_number: false,
        notes: 'EUR cash payment method for foreign currency transactions'
      });
    
    if (eurError) {
      console.log('⚠️  EUR Cash:', eurError.message);
    } else {
      console.log('✅ Added EUR Cash payment method');
    }
    
    // Add GBP Cash
    const { error: gbpError } = await supabase
      .from('finance_accounts')
      .upsert({
        id: '550e8400-e29b-41d4-a716-446655440009',
        name: 'Cash (GBP)',
        type: 'cash',
        balance: 0,
        currency: 'GBP',
        is_active: true,
        is_payment_method: true,
        payment_icon: '💵',
        payment_color: '#10B981',
        payment_description: 'Cash payments in British Pounds',
        requires_reference: false,
        requires_account_number: false,
        notes: 'GBP cash payment method for foreign currency transactions'
      });
    
    if (gbpError) {
      console.log('⚠️  GBP Cash:', gbpError.message);
    } else {
      console.log('✅ Added GBP Cash payment method');
    }
    
    // Update original cash method name
    const { error: updateError } = await supabase
      .from('finance_accounts')
      .update({
        name: 'Cash (TZS)',
        payment_description: 'Cash payments in Tanzanian Shillings',
        notes: 'TZS cash payment method for local currency transactions'
      })
      .eq('id', '550e8400-e29b-41d4-a716-446655440001');
    
    if (updateError) {
      console.log('⚠️  Update TZS Cash:', updateError.message);
    } else {
      console.log('✅ Updated TZS Cash payment method name');
    }
    
    // Verify all cash methods
    const { data: cashMethods, error: fetchError } = await supabase
      .from('finance_accounts')
      .select('*')
      .eq('type', 'cash')
      .eq('is_payment_method', true)
      .order('currency');
    
    if (fetchError) {
      console.error('❌ Error fetching cash methods:', fetchError);
      return;
    }
    
    console.log('\n📋 Available cash payment methods:');
    cashMethods?.forEach(method => {
      console.log(`  - ${method.name} (${method.currency}) - ID: ${method.id}`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

addMultiCurrencyCashMethods();
