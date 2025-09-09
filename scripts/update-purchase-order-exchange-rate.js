// Script to update existing purchase order with exchange rate data
import { supabase } from '../src/lib/supabaseClient.ts';

async function updatePurchaseOrderWithExchangeRate() {
  console.log('🔍 Updating purchase order with exchange rate data...\n');

  try {
    // Update the specific purchase order (PO-1757143347.307897)
    // You can change this to any purchase order ID you want to update
    const purchaseOrderId = 'eb084eb0-fc7e-4a19-b073-9d7cb6298a98'; // Replace with actual ID
    
    // Example exchange rate: 1 AED = 2.5000 TZS
    const exchangeRate = 2.5000;
    const currency = 'AED';
    const baseCurrency = 'TZS';
    const totalAmount = 260000; // AED 260,000
    const totalAmountBaseCurrency = totalAmount * exchangeRate; // TZS 650,000

    console.log('📊 Exchange Rate Information:');
    console.log(`  Currency: ${currency}`);
    console.log(`  Exchange Rate: 1 ${currency} = ${exchangeRate} ${baseCurrency}`);
    console.log(`  Original Amount: ${currency} ${totalAmount.toLocaleString()}`);
    console.log(`  TZS Amount: ${baseCurrency} ${totalAmountBaseCurrency.toLocaleString()}\n`);

    const { data, error } = await supabase
      .from('lats_purchase_orders')
      .update({
        exchange_rate: exchangeRate,
        base_currency: baseCurrency,
        exchange_rate_source: 'manual',
        exchange_rate_date: new Date().toISOString(),
        total_amount_base_currency: totalAmountBaseCurrency
      })
      .eq('id', purchaseOrderId)
      .select();

    if (error) {
      console.error('❌ Error updating purchase order:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ Purchase order updated successfully!');
      console.log('📋 Updated data:', data[0]);
      console.log('\n🔄 Now refresh the purchase order details page to see the TZS information!');
    } else {
      console.log('⚠️  No purchase order found with that ID');
    }

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the update
updatePurchaseOrderWithExchangeRate();
