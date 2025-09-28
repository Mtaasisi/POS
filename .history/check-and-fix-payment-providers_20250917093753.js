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

async function checkAndFixPaymentProviders() {
  console.log('🔍 Checking payment_providers table structure...\n');

  try {
    // First, try to get the table structure by selecting one record
    const { data: sampleData, error: sampleError } = await supabase
      .from('payment_providers')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.error('Error accessing payment_providers table:', sampleError);
      return;
    }

    console.log('✅ payment_providers table exists');
    
    if (sampleData && sampleData.length > 0) {
      console.log('📋 Current table structure (from sample data):');
      console.log('Columns:', Object.keys(sampleData[0]));
    } else {
      console.log('📋 Table is empty, checking structure by attempting insert...');
    }

    // Try to insert with different column combinations
    const providers = [
      { name: 'Cash', type: 'cash', description: 'Physical cash payments' },
      { name: 'Card', type: 'card', description: 'Credit/Debit card payments' },
      { name: 'M-Pesa', type: 'mobile_money', description: 'M-Pesa mobile money payments' },
      { name: 'CRDB', type: 'bank_transfer', description: 'CRDB Bank transfer payments' }
    ];

    console.log('\n📊 Inserting payment providers...');
    
    for (const provider of providers) {
      try {
        // Try with description first
        const { error: insertError } = await supabase
          .from('payment_providers')
          .insert(provider);

        if (insertError) {
          console.log(`❌ Failed to insert ${provider.name} with description:`, insertError.message);
          
          // Try without description
          const { name, type } = provider;
          const { error: simpleError } = await supabase
            .from('payment_providers')
            .insert({ name, type });

          if (simpleError) {
            console.log(`❌ Failed to insert ${provider.name} without description:`, simpleError.message);
          } else {
            console.log(`✅ Successfully inserted ${provider.name} (without description)`);
          }
        } else {
          console.log(`✅ Successfully inserted ${provider.name}`);
        }
      } catch (err) {
        console.log(`❌ Error inserting ${provider.name}:`, err.message);
      }
    }

    // Check final state
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

    console.log('\n✅ Payment providers setup complete!');

  } catch (error) {
    console.error('❌ Error checking and fixing payment providers:', error);
  }
}

// Run the function
checkAndFixPaymentProviders();
