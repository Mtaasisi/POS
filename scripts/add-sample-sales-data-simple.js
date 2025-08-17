import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const addSampleSalesData = async () => {
  try {
    console.log('📊 Adding sample sales data...');
    
    // Generate sample sales for the last 7 days
    const sales = [];
    const now = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Generate 2-5 sales per day
      const salesCount = Math.floor(Math.random() * 4) + 2;
      
      for (let j = 0; j < salesCount; j++) {
        const saleTime = new Date(date);
        saleTime.setHours(Math.floor(Math.random() * 12) + 8); // 8 AM to 8 PM
        saleTime.setMinutes(Math.floor(Math.random() * 60));
        
        const paymentMethods = ['cash', 'mpesa', 'card', 'zenopay'];
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        
        // Generate random total amount between 10000 and 100000
        const totalAmount = Math.floor(Math.random() * 90000) + 10000;
        
        sales.push({
          sale_number: `SALE-${date.getTime()}-${j}`,
          customer_id: null, // Walk-in customers for simplicity
          total_amount: totalAmount,
          payment_method: paymentMethod,
          status: 'completed',
          created_at: saleTime.toISOString(),
          created_by: null
        });
      }
    }
    
    console.log(`📦 Generated ${sales.length} sample sales`);
    
    // Insert sales data
    const { data: insertedSales, error: salesError } = await supabase
      .from('lats_sales')
      .insert(sales)
      .select();
    
    if (salesError) {
      console.error('❌ Error inserting sales:', salesError);
      return;
    }
    
    console.log(`✅ Successfully inserted ${insertedSales.length} sales`);
    
    // Generate sample sale items for each sale
    const sampleProducts = [
      { name: 'iPhone 14 Pro', price: 159999 },
      { name: 'Samsung Galaxy S23', price: 129999 },
      { name: 'MacBook Pro 14"', price: 299999 },
      { name: 'Dell XPS 13', price: 189999 },
      { name: 'AirPods Pro', price: 45999 },
      { name: 'Samsung Galaxy Watch', price: 35999 },
      { name: 'iPad Air', price: 89999 },
      { name: 'Logitech MX Master 3', price: 12999 }
    ];
    
    const saleItems = [];
    
    insertedSales.forEach(sale => {
      // Generate 1-3 items per sale
      const itemCount = Math.floor(Math.random() * 3) + 1;
      
      for (let i = 0; i < itemCount; i++) {
        const product = sampleProducts[Math.floor(Math.random() * sampleProducts.length)];
        const quantity = Math.floor(Math.random() * 2) + 1;
        const unitPrice = product.price;
        const totalPrice = unitPrice * quantity;
        
        saleItems.push({
          sale_id: sale.id,
          product_id: null, // Using null for demo products
          variant_id: null,
          quantity: quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          product_name: product.name, // Store product name directly
          variant_name: 'Standard',
          sku: `DEMO-${product.name.replace(/\s+/g, '-').toUpperCase()}-${Date.now()}`
        });
      }
    });
    
    // Insert sale items
    const { data: items, error: itemsError } = await supabase
      .from('lats_sale_items')
      .insert(saleItems)
      .select();
    
    if (itemsError) {
      console.error('❌ Error inserting sale items:', itemsError);
      return;
    }
    
    console.log(`✅ Successfully inserted ${items.length} sale items`);
    console.log('🎉 Sample sales data added successfully!');
    
    // Show summary
    const totalRevenue = insertedSales.reduce((sum, sale) => sum + sale.total_amount, 0);
    console.log(`📊 Summary:`);
    console.log(`   - Total Sales: ${insertedSales.length}`);
    console.log(`   - Total Revenue: ${totalRevenue.toLocaleString()} TZS`);
    console.log(`   - Average Sale: ${(totalRevenue / insertedSales.length).toLocaleString()} TZS`);
    console.log(`   - Total Items: ${items.length}`);
    
    // Show sample sales by day
    console.log('\n📅 Sales by day:');
    const salesByDay = {};
    insertedSales.forEach(sale => {
      const date = new Date(sale.created_at).toLocaleDateString();
      if (!salesByDay[date]) {
        salesByDay[date] = { count: 0, revenue: 0 };
      }
      salesByDay[date].count++;
      salesByDay[date].revenue += sale.total_amount;
    });
    
    Object.entries(salesByDay).forEach(([date, data]) => {
      console.log(`   ${date}: ${data.count} sales, ${data.revenue.toLocaleString()} TZS`);
    });
    
  } catch (error) {
    console.error('❌ Error adding sample sales data:', error);
  }
};

// Run the script
addSampleSalesData();
