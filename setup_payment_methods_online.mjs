import { createClient } from '@supabase/supabase-js';

// Online Supabase configuration
const supabaseUrl = 'https://jxhzveborezjhsmzsgbc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp4aHp2ZWJvcmV6amhzbXpzZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI3MTE1MjQsImV4cCI6MjA2ODI4NzUyNH0.pIug4PlJ3Q14GxcYilW-u0blByYoyeOfN3q9RNIjgfw';

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

async function setupPaymentMethods() {
  console.log('🔧 Setting up payment methods in online database...');
  
  try {
    // Check if payment_methods table exists
    console.log('📋 Checking payment_methods table...');
    const { data: existingMethods, error: checkError } = await supabase
      .from('payment_methods')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error checking payment_methods table:', checkError.message);
      console.log('💡 You may need to run the unified payment methods setup first');
      return;
    }
    
    console.log(`✅ payment_methods table exists. Found ${existingMethods?.length || 0} existing methods`);
    
    // Insert default payment methods if they don't exist
    console.log('💳 Inserting default payment methods...');
    
    const defaultMethods = [
      {
        name: 'Cash',
        code: 'cash',
        type: 'cash',
        icon: 'dollar-sign',
        color: '#10B981',
        description: 'Physical cash payments',
        is_active: true
      },
      {
        name: 'Cash on Delivery',
        code: 'cash_on_delivery',
        type: 'cash',
        icon: 'truck',
        color: '#F59E0B',
        description: 'Cash payment upon delivery',
        is_active: true
      },
      {
        name: 'Credit Card',
        code: 'credit_card',
        type: 'card',
        icon: 'credit-card',
        color: '#3B82F6',
        description: 'Credit card payments',
        is_active: true
      },
      {
        name: 'Debit Card',
        code: 'debit_card',
        type: 'card',
        icon: 'credit-card',
        color: '#8B5CF6',
        description: 'Debit card payments',
        is_active: true
      },
      {
        name: 'Bank Transfer',
        code: 'bank_transfer',
        type: 'transfer',
        icon: 'building',
        color: '#059669',
        description: 'Direct bank transfers',
        is_active: true
      },
      {
        name: 'Mobile Money',
        code: 'mobile_money',
        type: 'mobile_money',
        icon: 'smartphone',
        color: '#DC2626',
        description: 'Mobile money payments',
        is_active: true
      },
      {
        name: 'Installment',
        code: 'installment',
        type: 'installment',
        icon: 'credit-card',
        color: '#7C3AED',
        description: 'Installment payments',
        is_active: true
      },
      {
        name: 'Payment on Delivery',
        code: 'payment_on_delivery',
        type: 'delivery',
        icon: 'truck',
        color: '#EA580C',
        description: 'Payment upon delivery',
        is_active: true
      }
    ];
    
    // Insert each method
    for (const method of defaultMethods) {
      try {
        const { data, error } = await supabase
          .from('payment_methods')
          .upsert([method], { onConflict: 'code' })
          .select();
        
        if (error) {
          console.warn(`⚠️  Warning inserting ${method.name}:`, error.message);
        } else {
          console.log(`✅ ${method.name} payment method ready`);
        }
      } catch (err) {
        console.warn(`⚠️  Error inserting ${method.name}:`, err.message);
      }
    }
    
    // Verify the setup
    console.log('\n🧪 Verifying payment methods...');
    const { data: finalMethods, error: finalError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('is_active', true)
      .order('name');
    
    if (finalError) {
      console.error('❌ Error checking final payment methods:', finalError.message);
    } else {
      console.log(`✅ Total active payment methods: ${finalMethods?.length || 0}`);
      console.log('\n📋 Available payment methods:');
      finalMethods?.forEach((method, index) => {
        console.log(`  ${index + 1}. ${method.name} (${method.code}) - ${method.type}`);
      });
    }
    
    console.log('\n🎉 Payment methods setup completed!');
    console.log('📱 Your POS system will now use these payment methods from the finance management system.');
    
  } catch (error) {
    console.error('❌ Error setting up payment methods:', error);
  }
}

// Run the setup
setupPaymentMethods(); 