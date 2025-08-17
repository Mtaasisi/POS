import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addSampleSalesData() {
  console.log('🚀 Adding Sample Sales Data to Database (Admin Mode)...\n');

  try {
    // Create sample categories
    console.log('📋 Creating sample categories...');
    const { data: categories, error: categoriesError } = await supabase
      .from('lats_categories')
      .insert([
        { name: 'Smartphones', description: 'Mobile phones and accessories' },
        { name: 'Laptops', description: 'Portable computers' },
        { name: 'Accessories', description: 'Device accessories' }
      ])
      .select();

    if (categoriesError) {
      console.error('❌ Error creating categories:', categoriesError);
      return;
    }

    console.log('✅ Created categories');

    // Create sample brands
    console.log('🏷️ Creating sample brands...');
    const { data: brands, error: brandsError } = await supabase
      .from('lats_brands')
      .insert([
        { name: 'Apple', description: 'Apple Inc.' },
        { name: 'Samsung', description: 'Samsung Electronics' },
        { name: 'Generic', description: 'Generic brand' }
      ])
      .select();

    if (brandsError) {
      console.error('❌ Error creating brands:', brandsError);
      return;
    }

    console.log('✅ Created brands');

    // Create sample products
    console.log('📦 Creating sample products...');
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .insert([
        {
          name: 'iPhone 14 Pro',
          description: 'Latest iPhone model',
          category_id: categories[0].id,
          brand_id: brands[0].id,
          is_active: true
        },
        {
          name: 'MacBook Pro 14"',
          description: 'Professional laptop',
          category_id: categories[1].id,
          brand_id: brands[0].id,
          is_active: true
        },
        {
          name: 'Samsung Galaxy S23',
          description: 'Android flagship phone',
          category_id: categories[0].id,
          brand_id: brands[1].id,
          is_active: true
        },
        {
          name: 'AirPods Pro',
          description: 'Wireless earbuds',
          category_id: categories[2].id,
          brand_id: brands[0].id,
          is_active: true
        },
        {
          name: 'iPad Air',
          description: 'Tablet computer',
          category_id: categories[1].id,
          brand_id: brands[0].id,
          is_active: true
        }
      ])
      .select();

    if (productsError) {
      console.error('❌ Error creating products:', productsError);
      return;
    }

    console.log('✅ Created products');

    // Create product variants
    console.log('📦 Creating product variants...');
    const variants = [];
    for (const product of products) {
      const { data: variant, error: variantError } = await supabase
        .from('lats_product_variants')
        .insert({
          product_id: product.id,
          sku: `${product.name.replace(/\s+/g, '-').toUpperCase()}-V1`,
          name: `${product.name} - Standard`,
          cost_price: Math.floor(Math.random() * 50000) + 10000,
          selling_price: Math.floor(Math.random() * 100000) + 50000,
          quantity: Math.floor(Math.random() * 50) + 10
        })
        .select()
        .single();

      if (variantError) {
        console.error(`❌ Error creating variant for ${product.name}:`, variantError);
        continue;
      }

      variants.push(variant);
    }

    console.log(`✅ Created ${variants.length} product variants`);

    // Create sample customers
    console.log('👥 Creating sample customers...');
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .insert([
        {
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+255123456789',
          is_active: true
        },
        {
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+255987654321',
          is_active: true
        },
        {
          name: 'Mike Johnson',
          email: 'mike.johnson@example.com',
          phone: '+255555555555',
          is_active: true
        }
      ])
      .select();

    if (customersError) {
      console.error('❌ Error creating customers:', customersError);
      return;
    }

    console.log(`✅ Created ${customers.length} customers`);

    // Generate sample sales for the last 7 days
    console.log('💰 Creating sample sales...');
    const sales = [];
    const paymentMethods = ['cash', 'mpesa', 'card', 'bank_transfer'];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Create 2-5 sales per day
      const salesPerDay = Math.floor(Math.random() * 4) + 2;
      
      for (let j = 0; j < salesPerDay; j++) {
        const saleTime = new Date(date);
        saleTime.setHours(Math.floor(Math.random() * 12) + 8); // 8 AM to 8 PM
        saleTime.setMinutes(Math.floor(Math.random() * 60));
        
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        const totalAmount = Math.floor(Math.random() * 200000) + 50000; // 50k to 250k
        
        const { data: sale, error: saleError } = await supabase
          .from('lats_sales')
          .insert({
            customer_id: customer.id,
            total_amount: totalAmount,
            payment_method: paymentMethod,
            status: 'completed',
            created_at: saleTime.toISOString()
          })
          .select()
          .single();

        if (saleError) {
          console.error('❌ Error creating sale:', saleError);
          continue;
        }

        // Create sale items
        const numItems = Math.floor(Math.random() * 3) + 1; // 1-3 items per sale
        for (let k = 0; k < numItems; k++) {
          const variant = variants[Math.floor(Math.random() * variants.length)];
          const quantity = Math.floor(Math.random() * 2) + 1;
          const price = variant.selling_price;
          const totalPrice = price * quantity;

          const { error: itemError } = await supabase
            .from('lats_sale_items')
            .insert({
              sale_id: sale.id,
              product_id: variant.product_id,
              variant_id: variant.id,
              quantity: quantity,
              price: price,
              total_price: totalPrice
            });

          if (itemError) {
            console.error('❌ Error creating sale item:', itemError);
          }
        }

        sales.push(sale);
      }
    }

    console.log(`✅ Created ${sales.length} sample sales`);
    console.log('\n🎉 Sample sales data added successfully!');
    console.log('\n📊 You can now test the Sales Analytics page with real data.');
    console.log('📍 Navigate to: /lats/sales-analytics');

  } catch (error) {
    console.error('❌ Error adding sample sales data:', error);
  }
}

addSampleSalesData();
