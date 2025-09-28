import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyPaymentProvidersFix() {
  console.log('🔧 Applying Payment Providers Fix...\n');

  try {
    // 1. Try to insert payment providers directly
    console.log('📊 Inserting payment providers...');
    
    const providers = [
      { name: 'Cash', type: 'cash' },
      { name: 'Card', type: 'card' },
      { name: 'M-Pesa', type: 'mobile_money' },
      { name: 'CRDB', type: 'bank_transfer' }
    ];

    for (const provider of providers) {
      try {
        const { error } = await supabase
          .from('payment_providers')
          .insert(provider);

        if (error) {
          console.log(`❌ Failed to insert ${provider.name}:`, error.message);
        } else {
          console.log(`✅ Successfully inserted ${provider.name}`);
        }
      } catch (err) {
        console.log(`❌ Error inserting ${provider.name}:`, err.message);
      }
    }

    // 2. Check final state
    console.log('\n📋 Final payment providers:');
    const { data: finalProviders, error: finalError } = await supabase
      .from('payment_providers')
      .select('*');

    if (finalError) {
      console.error('Error fetching final providers:', finalError);
    } else {
      console.log(`Total providers: ${finalProviders?.length || 0}`);
      finalProviders?.forEach(provider => {
        console.log(`  • ${provider.name} (${provider.type})`);
      });
    }

    // 3. Test creating performance metrics
    if (finalProviders && finalProviders.length > 0) {
      console.log('\n🧪 Testing performance metrics creation...');
      
      const { data: testMetric, error: testError } = await supabase
        .from('payment_performance_metrics')
        .insert({
          provider_id: finalProviders[0].id,
          transaction_id: null,
          transaction_type: 'test',
          amount: 1000,
          currency: 'TZS',
          status: 'success',
          response_time_ms: 100
        })
        .select();

      if (testError) {
        console.log('❌ Performance metrics table needs to be created:', testError.message);
        console.log('\n📋 You need to run the SQL file in Supabase SQL Editor:');
        console.log('File: fix-payment-providers-complete.sql');
      } else {
        console.log('✅ Performance metrics table works!');
        
        // Clean up test data
        await supabase
          .from('payment_performance_metrics')
          .delete()
          .eq('id', testMetric[0].id);
      }
    }

    console.log('\n✅ Payment providers fix applied!');
    console.log('\n📋 Next steps:');
    console.log('1. If providers were inserted successfully, you can now use them');
    console.log('2. If performance metrics failed, run the SQL file in Supabase dashboard');
    console.log('3. The system will now track real performance data');

  } catch (error) {
    console.error('❌ Error applying payment providers fix:', error);
  }
}

// Run the function
applyPaymentProvidersFix();
