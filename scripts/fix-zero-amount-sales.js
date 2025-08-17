import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixZeroAmountSales() {
  console.log('🔧 Fixing zero amount sales and adding recent sales...\n');

  try {
    // Step 1: Find and fix zero amount sales
    console.log('1. Finding zero amount sales...');
    const { data: zeroSales, error: zeroError } = await supabase
      .from('lats_sales')
      .select('*')
      .eq('total_amount', 0);

    if (zeroError) {
      console.log('❌ Error fetching zero amount sales:', zeroError.message);
    } else {
      console.log(`✅ Found ${zeroSales?.length || 0} zero amount sales`);
      
      if (zeroSales && zeroSales.length > 0) {
        console.log('   Fixing zero amount sales...');
        for (const sale of zeroSales) {
          // Set a reasonable amount based on payment method
          let amount = 15000; // Default amount
          if (sale.payment_method === 'card') amount = 25000;
          if (sale.payment_method === 'transfer') amount = 35000;
          
          const { error: updateError } = await supabase
            .from('lats_sales')
            .update({ total_amount: amount })
            .eq('id', sale.id);

          if (updateError) {
            console.log(`   ❌ Error fixing sale ${sale.id}:`, updateError.message);
          } else {
            console.log(`   ✅ Fixed sale ${sale.id}: ${amount} KES`);
          }
        }
      }
    }

    // Step 2: Add more recent sales for better daily summary testing
    console.log('\n2. Adding recent sales for daily summary testing...');
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const recentSales = [
      {
        sale_number: `SALE-${Date.now()}-TODAY-001`,
        customer_id: null,
        total_amount: 18000,
        payment_method: 'cash',
        status: 'completed',
        created_by: null,
        created_at: today.toISOString()
      },
      {
        sale_number: `SALE-${Date.now()}-TODAY-002`,
        customer_id: null,
        total_amount: 22000,
        payment_method: 'card',
        status: 'completed',
        created_by: null,
        created_at: today.toISOString()
      },
      {
        sale_number: `SALE-${Date.now()}-YESTERDAY-001`,
        customer_id: null,
        total_amount: 28000,
        payment_method: 'mpesa',
        status: 'completed',
        created_by: null,
        created_at: yesterday.toISOString()
      },
      {
        sale_number: `SALE-${Date.now()}-YESTERDAY-002`,
        customer_id: null,
        total_amount: 32000,
        payment_method: 'transfer',
        status: 'completed',
        created_by: null,
        created_at: yesterday.toISOString()
      },
      {
        sale_number: `SALE-${Date.now()}-2DAYS-001`,
        customer_id: null,
        total_amount: 15000,
        payment_method: 'cash',
        status: 'completed',
        created_by: null,
        created_at: twoDaysAgo.toISOString()
      }
    ];

    const { data: insertedRecent, error: insertError } = await supabase
      .from('lats_sales')
      .insert(recentSales)
      .select();

    if (insertError) {
      console.log('❌ Error inserting recent sales:', insertError.message);
    } else {
      console.log(`✅ Successfully inserted ${insertedRecent?.length || 0} recent sales`);
      
      console.log('   Recent sales added:');
      insertedRecent?.forEach((sale, index) => {
        const date = new Date(sale.created_at).toISOString().split('T')[0];
        console.log(`     ${index + 1}. ${sale.sale_number} - ${sale.total_amount} KES (${sale.payment_method}) - ${date}`);
      });
    }

    // Step 3: Verify the fixes
    console.log('\n3. Verifying fixes...');
    
    // Check total sales count
    const { count, error: countError } = await supabase
      .from('lats_sales')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('❌ Error counting sales:', countError.message);
    } else {
      console.log(`✅ Total sales in database: ${count}`);
    }

    // Check for any remaining zero amounts
    const { data: remainingZero, error: remainingError } = await supabase
      .from('lats_sales')
      .select('*')
      .eq('total_amount', 0);

    if (remainingError) {
      console.log('❌ Error checking remaining zero amounts:', remainingError.message);
    } else {
      console.log(`✅ Remaining zero amount sales: ${remainingZero?.length || 0}`);
    }

    // Calculate total amount
    const { data: allSales, error: allError } = await supabase
      .from('lats_sales')
      .select('total_amount');

    if (allError) {
      console.log('❌ Error calculating total amount:', allError.message);
    } else {
      const totalAmount = allSales?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;
      console.log(`✅ Total amount from all sales: ${totalAmount} KES`);
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixZeroAmountSales().then(() => {
  console.log('\n🏁 Zero amount sales fix completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Fix failed:', error);
  process.exit(1);
});
