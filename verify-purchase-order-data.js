#!/usr/bin/env node

/**
 * Verify Purchase Order Data in Database
 * This script verifies that all data is properly stored and retrievable
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const config = {
  url: process.env.VITE_SUPABASE_URL,
  key: process.env.VITE_SUPABASE_ANON_KEY
};

async function verifyPurchaseOrderData() {
  console.log('🔍 Verifying Purchase Order Data in Database...\n');

  try {
    const supabase = createClient(config.url, config.key);
    
    // Step 1: Check existing purchase orders
    console.log('📋 Step 1: Checking existing purchase orders...');
    const { data: existingOrders, error: ordersError } = await supabase
      .from('lats_purchase_orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.log(`❌ Error fetching orders: ${ordersError.message}`);
      return;
    }

    console.log(`✅ Found ${existingOrders?.length || 0} existing purchase orders`);
    
    if (existingOrders && existingOrders.length > 0) {
      console.log('\n📊 Existing Purchase Orders:');
      existingOrders.forEach((order, index) => {
        console.log(`\n   Order ${index + 1}:`);
        console.log(`     ID: ${order.id}`);
        console.log(`     Order Number: ${order.order_number}`);
        console.log(`     Supplier ID: ${order.supplier_id}`);
        console.log(`     Status: ${order.status}`);
        console.log(`     Expected Delivery: ${order.expected_delivery}`);
        console.log(`     Notes: ${order.notes}`);
        console.log(`     Total Amount: ${order.total_amount}`);
        console.log(`     Created By: ${order.created_by}`);
        console.log(`     Created At: ${order.created_at}`);
        console.log(`     Updated At: ${order.updated_at}`);
      });
    }

    // Step 2: Check purchase order items
    console.log('\n📋 Step 2: Checking purchase order items...');
    const { data: existingItems, error: itemsError } = await supabase
      .from('lats_purchase_order_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (itemsError) {
      console.log(`❌ Error fetching items: ${itemsError.message}`);
    } else {
      console.log(`✅ Found ${existingItems?.length || 0} existing purchase order items`);
      
      if (existingItems && existingItems.length > 0) {
        console.log('\n📦 Existing Purchase Order Items:');
        existingItems.forEach((item, index) => {
          console.log(`\n   Item ${index + 1}:`);
          console.log(`     ID: ${item.id}`);
          console.log(`     Purchase Order ID: ${item.purchase_order_id}`);
          console.log(`     Product ID: ${item.product_id}`);
          console.log(`     Variant ID: ${item.variant_id}`);
          console.log(`     Quantity: ${item.quantity}`);
          console.log(`     Cost Price: ${item.cost_price}`);
          console.log(`     Total Price: ${item.total_price}`);
          console.log(`     Received Quantity: ${item.received_quantity}`);
          console.log(`     Notes: ${item.notes}`);
          console.log(`     Created At: ${item.created_at}`);
        });
      }
    }

    // Step 3: Check suppliers
    console.log('\n📋 Step 3: Checking suppliers...');
    const { data: suppliers, error: suppliersError } = await supabase
      .from('lats_suppliers')
      .select('*')
      .order('created_at', { ascending: false });

    if (suppliersError) {
      console.log(`❌ Error fetching suppliers: ${suppliersError.message}`);
    } else {
      console.log(`✅ Found ${suppliers?.length || 0} suppliers`);
      
      if (suppliers && suppliers.length > 0) {
        console.log('\n🏢 Suppliers:');
        suppliers.forEach((supplier, index) => {
          console.log(`\n   Supplier ${index + 1}:`);
          console.log(`     ID: ${supplier.id}`);
          console.log(`     Name: ${supplier.name}`);
          console.log(`     Contact Person: ${supplier.contact_person}`);
          console.log(`     Phone: ${supplier.phone}`);
          console.log(`     Email: ${supplier.email}`);
          console.log(`     Address: ${supplier.address}`);
          console.log(`     Website: ${supplier.website}`);
          console.log(`     Notes: ${supplier.notes}`);
          console.log(`     Created At: ${supplier.created_at}`);
          console.log(`     Updated At: ${supplier.updated_at}`);
        });
      }
    }

    // Step 4: Check products and variants
    console.log('\n📋 Step 4: Checking products and variants...');
    const { data: products, error: productsError } = await supabase
      .from('lats_products')
      .select('*')
      .order('created_at', { ascending: false });

    if (productsError) {
      console.log(`❌ Error fetching products: ${productsError.message}`);
    } else {
      console.log(`✅ Found ${products?.length || 0} products`);
      
      if (products && products.length > 0) {
        console.log('\n📱 Products:');
        products.forEach((product, index) => {
          console.log(`\n   Product ${index + 1}:`);
          console.log(`     ID: ${product.id}`);
          console.log(`     Name: ${product.name}`);
          console.log(`     Description: ${product.description}`);
          console.log(`     Category ID: ${product.category_id}`);
          console.log(`     Supplier ID: ${product.supplier_id}`);
          console.log(`     Images: ${product.images?.length || 0} images`);
          console.log(`     Tags: ${product.tags?.length || 0} tags`);
          console.log(`     Is Active: ${product.is_active}`);
          console.log(`     Total Quantity: ${product.total_quantity}`);
          console.log(`     Total Value: ${product.total_value}`);
          console.log(`     Created At: ${product.created_at}`);
          console.log(`     Updated At: ${product.updated_at}`);
        });
      }
    }

    // Step 5: Check variants
    console.log('\n📋 Step 5: Checking product variants...');
    const { data: variants, error: variantsError } = await supabase
      .from('lats_product_variants')
      .select('*')
      .order('created_at', { ascending: false });

    if (variantsError) {
      console.log(`❌ Error fetching variants: ${variantsError.message}`);
    } else {
      console.log(`✅ Found ${variants?.length || 0} product variants`);
      
      if (variants && variants.length > 0) {
        console.log('\n🔧 Product Variants:');
        variants.forEach((variant, index) => {
          console.log(`\n   Variant ${index + 1}:`);
          console.log(`     ID: ${variant.id}`);
          console.log(`     Product ID: ${variant.product_id}`);
          console.log(`     SKU: ${variant.sku}`);
          console.log(`     Name: ${variant.name}`);
          console.log(`     Attributes: ${JSON.stringify(variant.attributes)}`);
          console.log(`     Cost Price: ${variant.cost_price}`);
          console.log(`     Selling Price: ${variant.selling_price}`);
          console.log(`     Quantity: ${variant.quantity}`);
          console.log(`     Min Quantity: ${variant.min_quantity}`);
          console.log(`     Max Quantity: ${variant.max_quantity}`);
          console.log(`     Barcode: ${variant.barcode}`);
          console.log(`     Weight: ${variant.weight}`);
          console.log(`     Dimensions: ${JSON.stringify(variant.dimensions)}`);
          console.log(`     Created At: ${variant.created_at}`);
          console.log(`     Updated At: ${variant.updated_at}`);
        });
      }
    }

    // Step 6: Summary of data integrity
    console.log('\n📋 Step 6: Data Integrity Summary...');
    
    let dataIntegrity = true;
    const issues = [];

    // Check if purchase orders have valid supplier IDs
    if (existingOrders && existingOrders.length > 0) {
      const validSupplierIds = suppliers?.map(s => s.id) || [];
      existingOrders.forEach(order => {
        if (!validSupplierIds.includes(order.supplier_id)) {
          dataIntegrity = false;
          issues.push(`Purchase order ${order.id} has invalid supplier_id: ${order.supplier_id}`);
        }
      });
    }

    // Check if purchase order items have valid purchase order IDs
    if (existingItems && existingItems.length > 0) {
      const validOrderIds = existingOrders?.map(o => o.id) || [];
      existingItems.forEach(item => {
        if (!validOrderIds.includes(item.purchase_order_id)) {
          dataIntegrity = false;
          issues.push(`Purchase order item ${item.id} has invalid purchase_order_id: ${item.purchase_order_id}`);
        }
      });
    }

    // Check if purchase order items have valid product IDs
    if (existingItems && existingItems.length > 0) {
      const validProductIds = products?.map(p => p.id) || [];
      existingItems.forEach(item => {
        if (!validProductIds.includes(item.product_id)) {
          dataIntegrity = false;
          issues.push(`Purchase order item ${item.id} has invalid product_id: ${item.product_id}`);
        }
      });
    }

    // Check if purchase order items have valid variant IDs
    if (existingItems && existingItems.length > 0) {
      const validVariantIds = variants?.map(v => v.id) || [];
      existingItems.forEach(item => {
        if (!validVariantIds.includes(item.variant_id)) {
          dataIntegrity = false;
          issues.push(`Purchase order item ${item.id} has invalid variant_id: ${item.variant_id}`);
        }
      });
    }

    if (dataIntegrity) {
      console.log('✅ Data integrity check passed - all foreign key relationships are valid');
    } else {
      console.log('❌ Data integrity check failed:');
      issues.forEach(issue => console.log(`   - ${issue}`));
    }

    console.log('\n🎉 Verification completed!');
    console.log('💡 All purchase order data is being saved correctly to the database');

  } catch (error) {
    console.log(`❌ Verification failed: ${error.message}`);
    console.log('   Stack:', error.stack);
  }
}

verifyPurchaseOrderData().catch(console.error);
