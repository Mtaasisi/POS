import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(supabaseUrl, supabaseKey);

// Comprehensive data fetching function
async function fetchAllPaymentInformation() {
  console.log('🔄 Starting comprehensive payment data fetch...');
  
  const allData = {
    timestamp: new Date().toISOString(),
    summary: {},
    data: {}
  };

  try {
    // 1. Customer Payments
    console.log('📊 Fetching customer payments...');
    const { data: customerPayments, error: customerError } = await supabase
      .from('customer_payments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (customerError) {
      console.error('❌ Error fetching customer payments:', customerError);
    } else {
      allData.data.customerPayments = customerPayments || [];
      allData.summary.customerPayments = customerPayments?.length || 0;
      console.log(`✅ Fetched ${customerPayments?.length || 0} customer payments`);
    }

    // 2. Purchase Order Payments
    console.log('📊 Fetching purchase order payments...');
    const { data: purchaseOrderPayments, error: poError } = await supabase
      .from('purchase_order_payments')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (poError) {
      console.error('❌ Error fetching purchase order payments:', poError);
    } else {
      allData.data.purchaseOrderPayments = purchaseOrderPayments || [];
      allData.summary.purchaseOrderPayments = purchaseOrderPayments?.length || 0;
      console.log(`✅ Fetched ${purchaseOrderPayments?.length || 0} purchase order payments`);
    }

    // 3. Payment Transactions
    console.log('📊 Fetching payment transactions...');
    const { data: paymentTransactions, error: ptError } = await supabase
      .from('payment_transactions')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (ptError) {
      console.error('❌ Error fetching payment transactions:', ptError);
    } else {
      allData.data.paymentTransactions = paymentTransactions || [];
      allData.summary.paymentTransactions = paymentTransactions?.length || 0;
      console.log(`✅ Fetched ${paymentTransactions?.length || 0} payment transactions`);
    }

    // 4. Payment Providers
    console.log('📊 Fetching payment providers...');
    const { data: paymentProviders, error: ppError } = await supabase
      .from('payment_providers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (ppError) {
      console.error('❌ Error fetching payment providers:', ppError);
    } else {
      allData.data.paymentProviders = paymentProviders || [];
      allData.summary.paymentProviders = paymentProviders?.length || 0;
      console.log(`✅ Fetched ${paymentProviders?.length || 0} payment providers`);
    }

    // 5. Finance Accounts
    console.log('📊 Fetching finance accounts...');
    const { data: financeAccounts, error: faError } = await supabase
      .from('finance_accounts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (faError) {
      console.error('❌ Error fetching finance accounts:', faError);
    } else {
      allData.data.financeAccounts = financeAccounts || [];
      allData.summary.financeAccounts = financeAccounts?.length || 0;
      console.log(`✅ Fetched ${financeAccounts?.length || 0} finance accounts`);
    }

    // 6. Payment Audit Log
    console.log('📊 Fetching payment audit log...');
    const { data: paymentAuditLog, error: palError } = await supabase
      .from('payment_audit_log')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (palError) {
      console.error('❌ Error fetching payment audit log:', palError);
    } else {
      allData.data.paymentAuditLog = paymentAuditLog || [];
      allData.summary.paymentAuditLog = paymentAuditLog?.length || 0;
      console.log(`✅ Fetched ${paymentAuditLog?.length || 0} payment audit log entries`);
    }

    // 7. Payment Reconciliation
    console.log('📊 Fetching payment reconciliation...');
    const { data: paymentReconciliation, error: prError } = await supabase
      .from('payment_reconciliation')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (prError) {
      console.error('❌ Error fetching payment reconciliation:', prError);
    } else {
      allData.data.paymentReconciliation = paymentReconciliation || [];
      allData.summary.paymentReconciliation = paymentReconciliation?.length || 0;
      console.log(`✅ Fetched ${paymentReconciliation?.length || 0} payment reconciliation entries`);
    }

    // 8. Customers (for reference)
    console.log('📊 Fetching customers...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (customersError) {
      console.error('❌ Error fetching customers:', customersError);
    } else {
      allData.data.customers = customers || [];
      allData.summary.customers = customers?.length || 0;
      console.log(`✅ Fetched ${customers?.length || 0} customers`);
    }

    // 9. Purchase Orders (for reference)
    console.log('📊 Fetching purchase orders...');
    const { data: purchaseOrders, error: poRefError } = await supabase
      .from('purchase_orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (poRefError) {
      console.error('❌ Error fetching purchase orders:', poRefError);
    } else {
      allData.data.purchaseOrders = purchaseOrders || [];
      allData.summary.purchaseOrders = purchaseOrders?.length || 0;
      console.log(`✅ Fetched ${purchaseOrders?.length || 0} purchase orders`);
    }

    // 10. Devices (for reference)
    console.log('📊 Fetching devices...');
    const { data: devices, error: devicesError } = await supabase
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (devicesError) {
      console.error('❌ Error fetching devices:', devicesError);
    } else {
      allData.data.devices = devices || [];
      allData.summary.devices = devices?.length || 0;
      console.log(`✅ Fetched ${devices?.length || 0} devices`);
    }

    // 11. Repair Orders (for reference)
    console.log('📊 Fetching repair orders...');
    const { data: repairOrders, error: roError } = await supabase
      .from('repair_orders')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (roError) {
      console.error('❌ Error fetching repair orders:', roError);
    } else {
      allData.data.repairOrders = repairOrders || [];
      allData.summary.repairOrders = repairOrders?.length || 0;
      console.log(`✅ Fetched ${repairOrders?.length || 0} repair orders`);
    }

    // Calculate totals and analytics
    const totalPayments = (allData.summary.customerPayments || 0) + 
                         (allData.summary.purchaseOrderPayments || 0) + 
                         (allData.summary.paymentTransactions || 0);
    
    const totalAmount = [...(allData.data.customerPayments || []), 
                        ...(allData.data.purchaseOrderPayments || []), 
                        ...(allData.data.paymentTransactions || [])]
      .reduce((sum, payment) => sum + (payment.amount || payment.total_amount || 0), 0);

    allData.summary.totalPayments = totalPayments;
    allData.summary.totalAmount = totalAmount;
    allData.summary.totalRecords = Object.values(allData.summary).reduce((sum, count) => sum + (count || 0), 0);

    // Save to file
    const filename = `payment-data-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(__dirname, filename);
    
    fs.writeFileSync(filepath, JSON.stringify(allData, null, 2));
    
    console.log('\n🎉 Comprehensive data fetch completed!');
    console.log('📊 Summary:');
    console.log(`   Total Payment Records: ${totalPayments}`);
    console.log(`   Total Amount: ${totalAmount.toLocaleString()} TZS`);
    console.log(`   Total Records: ${allData.summary.totalRecords}`);
    console.log(`   Data saved to: ${filename}`);
    
    // Print detailed summary
    console.log('\n📋 Detailed Summary:');
    Object.entries(allData.summary).forEach(([key, value]) => {
      if (key !== 'totalPayments' && key !== 'totalAmount' && key !== 'totalRecords') {
        console.log(`   ${key}: ${value} records`);
      }
    });

    return allData;

  } catch (error) {
    console.error('❌ Critical error during data fetch:', error);
    throw error;
  }
}

// Export function for use in other scripts
module.exports = { fetchAllPaymentInformation };

// Run if called directly
if (require.main === module) {
  fetchAllPaymentInformation()
    .then(() => {
      console.log('✅ Script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}
