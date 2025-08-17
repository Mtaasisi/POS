import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function showDatabaseTables() {
  console.log('🗄️  Payment Data Database Tables Location\n');

  try {
    // 1. Customer Payments Table (Device Repair Payments)
    console.log('1️⃣  CUSTOMER_PAYMENTS TABLE (Device Repair Payments)');
    console.log('   📍 Table: customer_payments');
    console.log('   📊 Purpose: Stores payments for device repairs');
    console.log('   🔗 Related: customers, devices, auth_users tables\n');

    const { data: customerPayments, error: cpError } = await supabase
      .from('customer_payments')
      .select(`
        *,
        customers(name),
        devices(brand, model),
        auth_users(name)
      `)
      .order('payment_date', { ascending: false });

    if (!cpError && customerPayments) {
      console.log(`   📈 Records: ${customerPayments.length} payments`);
      console.log('   📋 Sample Records:');
      customerPayments.forEach((payment, index) => {
        const date = new Date(payment.payment_date).toISOString().split('T')[0];
        console.log(`      ${index + 1}. ${payment.customers?.name || 'Unknown'} - ${payment.amount} KES (${payment.method}) - ${payment.devices?.brand} ${payment.devices?.model} - ${date}`);
      });
    }
    console.log('');

    // 2. POS Sales Table (Point of Sale Sales)
    console.log('2️⃣  LATS_SALES TABLE (POS Sales)');
    console.log('   📍 Table: lats_sales');
    console.log('   📊 Purpose: Stores POS system sales transactions');
    console.log('   🔗 Related: customers, lats_sale_items tables\n');

    const { data: posSales, error: psError } = await supabase
      .from('lats_sales')
      .select(`
        *,
        customers(name)
      `)
      .order('created_at', { ascending: false });

    if (!psError && posSales) {
      console.log(`   📈 Records: ${posSales.length} sales`);
      console.log('   📋 Sample Records:');
      posSales.slice(0, 5).forEach((sale, index) => {
        const date = new Date(sale.created_at).toISOString().split('T')[0];
        console.log(`      ${index + 1}. ${sale.sale_number} - ${sale.customers?.name || 'Walk-in'} - ${sale.total_amount} KES (${sale.payment_method}) - ${date}`);
      });
    }
    console.log('');

    // 3. POS Sale Items Table (Individual Items in Sales)
    console.log('3️⃣  LATS_SALE_ITEMS TABLE (POS Sale Items)');
    console.log('   📍 Table: lats_sale_items');
    console.log('   📊 Purpose: Stores individual items sold in each POS transaction');
    console.log('   🔗 Related: lats_sales, lats_products, lats_product_variants tables\n');

    const { data: saleItems, error: siError } = await supabase
      .from('lats_sale_items')
      .select(`
        *,
        lats_sales(sale_number)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    if (!siError && saleItems) {
      console.log(`   📈 Records: ${saleItems.length} items (showing first 5)`);
      console.log('   📋 Sample Records:');
      saleItems.forEach((item, index) => {
        const productName = `Product ${item.product_id?.slice(0, 8) || 'Unknown'}`;
        const variantName = `Variant ${item.variant_id?.slice(0, 8) || 'Unknown'}`;
        console.log(`      ${index + 1}. ${item.lats_sales?.sale_number} - ${productName} ${variantName} - Qty: ${item.quantity} - ${item.total_price} KES`);
      });
    }
    console.log('');

    // 4. Customers Table
    console.log('4️⃣  CUSTOMERS TABLE');
    console.log('   📍 Table: customers');
    console.log('   📊 Purpose: Stores customer information');
    console.log('   🔗 Related: customer_payments, lats_sales tables\n');

    const { data: customers, error: cError } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false });

    if (!cError && customers) {
      console.log(`   📈 Records: ${customers.length} customers`);
      console.log('   📋 Sample Records:');
      customers.slice(0, 3).forEach((customer, index) => {
        console.log(`      ${index + 1}. ${customer.name} - ${customer.phone || 'No phone'} - ${customer.email || 'No email'}`);
      });
    }
    console.log('');

    // 5. Devices Table
    console.log('5️⃣  DEVICES TABLE');
    console.log('   📍 Table: devices');
    console.log('   📊 Purpose: Stores device information for repairs');
    console.log('   🔗 Related: customer_payments table\n');

    const { data: devices, error: dError } = await supabase
      .from('devices')
      .select('*')
      .order('created_at', { ascending: false });

    if (!dError && devices) {
      console.log(`   📈 Records: ${devices.length} devices`);
      console.log('   📋 Sample Records:');
      devices.slice(0, 3).forEach((device, index) => {
        console.log(`      ${index + 1}. ${device.brand} ${device.model} - ${device.serial_number || 'No serial'} - ${device.customer_id || 'No customer'}`);
      });
    }
    console.log('');

    // 6. Summary
    console.log('📊 PAYMENT TRACKING DATA SUMMARY');
    console.log('================================');
    console.log(`✅ Customer Payments: ${customerPayments?.length || 0} records`);
    console.log(`✅ POS Sales: ${posSales?.length || 0} records`);
    console.log(`✅ Total Transactions: ${(customerPayments?.length || 0) + (posSales?.length || 0)} records`);
    console.log(`✅ Customers: ${customers?.length || 0} records`);
    console.log(`✅ Devices: ${devices?.length || 0} records`);
    console.log('');

    // 7. How Payment Tracking Works
    console.log('🔗 HOW PAYMENT TRACKING WORKS');
    console.log('=============================');
    console.log('1. Payment Tracking Service fetches data from TWO sources:');
    console.log('   📍 customer_payments table → Device repair payments');
    console.log('   📍 lats_sales table → POS system sales');
    console.log('');
    console.log('2. Data is combined and transformed into PaymentTransaction objects');
    console.log('3. Metrics are calculated from the combined data');
    console.log('4. Payment methods are summarized across both sources');
    console.log('5. Daily summaries aggregate data by date');
    console.log('');

    // 8. Table Relationships
    console.log('🔗 TABLE RELATIONSHIPS');
    console.log('======================');
    console.log('customer_payments → customers (customer_id)');
    console.log('customer_payments → devices (device_id)');
    console.log('customer_payments → auth_users (created_by)');
    console.log('lats_sales → customers (customer_id)');
    console.log('lats_sale_items → lats_sales (sale_id)');
    console.log('lats_sale_items → lats_products (product_id)');
    console.log('lats_sale_items → lats_product_variants (variant_id)');

  } catch (error) {
    console.error('❌ Error showing database tables:', error);
  }
}

showDatabaseTables().then(() => {
  console.log('\n🏁 Database tables overview completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Database overview failed:', error);
  process.exit(1);
});
