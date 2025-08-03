import { supabase } from './supabaseClient';
import { 
  SaleOrder, 
  SaleOrderItem, 
  InstallmentPayment, 
  CartItem, 
  CustomerType, 
  PaymentMethod,
  Customer,
  Product,
  ProductVariant
} from '../types';
import { 
  getProductById, 
  getProductVariants, 
  updateStock, 
  searchSpareParts, 
  getSpareParts, 
  SparePart,
  updateSparePartStock
} from './inventoryApi';
import { fetchCustomerById } from './customerApi';

// Create a new sales order
export async function createSaleOrder(orderData: {
  customer_id: string;
  customer_type: CustomerType;
  payment_method: PaymentMethod;
  amount_paid: number;
  delivery_address?: string;
  delivery_city?: string;
  delivery_method?: string;
  delivery_notes?: string;
  discount_amount?: number;
  tax_amount?: number;
  shipping_cost?: number;
  items: CartItem[];
  created_by: string;
}): Promise<SaleOrder> {
  try {
    // Calculate totals
    const subtotal = orderData.items.reduce((sum, item) => sum + item.item_total, 0);
    const discount = orderData.discount_amount || 0;
    const tax = orderData.tax_amount || 0;
    const shipping = orderData.shipping_cost || 0;
    const finalAmount = subtotal - discount + tax + shipping;
    const balanceDue = finalAmount - orderData.amount_paid;

    // Determine status based on payment method and amount
    let status: SaleOrder['status'] = 'completed';
    if (orderData.payment_method === 'payment_on_delivery') {
      status = 'payment_on_delivery';
    } else if (orderData.payment_method === 'installment' && balanceDue > 0) {
      status = 'partially_paid';
    }

    // Create the sales order
    const { data: order, error: orderError } = await supabase
      .from('sales_orders')
      .insert({
        customer_id: orderData.customer_id,
        customer_type: orderData.customer_type,
        payment_method: orderData.payment_method,
        total_amount: subtotal,
        discount_amount: discount,
        tax_amount: tax,
        shipping_cost: shipping,
        final_amount: finalAmount,
        amount_paid: orderData.amount_paid,
        balance_due: balanceDue,
        status,
        delivery_address: orderData.delivery_address,
        delivery_city: orderData.delivery_city,
        delivery_method: orderData.delivery_method,
        delivery_notes: orderData.delivery_notes,
        created_by: orderData.created_by
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItems = orderData.items.map(item => ({
      order_id: order.id,
      product_id: item.product_id,
      variant_id: item.variant_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      unit_cost: item.unit_cost,
      item_total: item.item_total,
      is_external_product: item.is_external_product,
      external_product_details: item.external_product_details
    }));

    const { error: itemsError } = await supabase
      .from('sales_order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Update inventory for non-external products
    for (const item of orderData.items) {
      if (!item.is_external_product && item.variant_id) {
        // Update spare part stock instead of regular inventory
        await updateSparePartStock(item.variant_id, item.quantity, 'subtract');
      }
    }

    // Update customer total spent
    await updateCustomerTotalSpent(orderData.customer_id, finalAmount);

    return order;
  } catch (error) {
    console.error('Error creating sale order:', error);
    throw error;
  }
}

// Update an existing sales order
export async function updateSaleOrder(orderId: string, updates: Partial<SaleOrder>): Promise<SaleOrder> {
  try {
    const { data: order, error } = await supabase
      .from('sales_orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return order;
  } catch (error) {
    console.error('Error updating sale order:', error);
    throw error;
  }
}

// Record an installment payment
export async function recordInstallmentPayment(paymentData: {
  order_id: string;
  amount: number;
  payment_method: PaymentMethod;
  notes?: string;
  created_by: string;
}): Promise<InstallmentPayment> {
  try {
    // Create the installment payment record
    const { data: payment, error: paymentError } = await supabase
      .from('installment_payments')
      .insert({
        order_id: paymentData.order_id,
        amount: paymentData.amount,
        payment_method: paymentData.payment_method,
        notes: paymentData.notes,
        created_by: paymentData.created_by
      })
      .select()
      .single();

    if (paymentError) throw paymentError;

    // Update the sales order
    const { data: order, error: orderError } = await supabase
      .from('sales_orders')
      .select('amount_paid, balance_due, final_amount')
      .eq('id', paymentData.order_id)
      .single();

    if (orderError) throw orderError;

    const newAmountPaid = order.amount_paid + paymentData.amount;
    const newBalanceDue = order.final_amount - newAmountPaid;
    let newStatus: SaleOrder['status'] = order.balance_due > 0 ? 'partially_paid' : 'completed';

    if (newBalanceDue <= 0) {
      newStatus = 'completed';
    }

    await supabase
      .from('sales_orders')
      .update({
        amount_paid: newAmountPaid,
        balance_due: newBalanceDue,
        status: newStatus
      })
      .eq('id', paymentData.order_id);

    return payment;
  } catch (error) {
    console.error('Error recording installment payment:', error);
    throw error;
  }
}

// Get product price based on customer type
export async function getProductPrice(
  productId: string, 
  variantId: string, 
  customerType: CustomerType
): Promise<number> {
  try {
    // Handle sample data
    if (productId.startsWith('sample-')) {
      const samplePrices = {
        'sample-1': 120, // iPhone 13 Screen
        'sample-2': 45,  // Samsung Galaxy Battery
        'sample-3': 30   // iPhone Charging Port
      };
      
      let price = samplePrices[productId as keyof typeof samplePrices] || 50;
      
      // Apply wholesale discount if customer type is wholesale
      if (customerType === 'wholesale') {
        price = price * 0.9; // 10% discount for wholesale
      }
      
      return price;
    }
    
    // Get spare part price from inventory
    const { data: sparePart, error } = await supabase
      .from('spare_parts')
      .select('price')
      .eq('id', productId)
      .single();

    if (error) {
      console.error('Error fetching spare part price for ID:', productId, error);
      // Return a default price if the spare part is not found
      return customerType === 'wholesale' ? 45 : 50;
    }
    
    let price = sparePart.price;
    
    // Apply wholesale discount if customer type is wholesale
    if (customerType === 'wholesale') {
      price = price * 0.9; // 10% discount for wholesale
    }
    
    return price;
  } catch (error) {
    console.error('Error getting product price:', error);
    throw error;
  }
}

// Deduct inventory for sold items
export async function deductInventory(variantId: string, quantity: number): Promise<boolean> {
  try {
    // Handle sample data - just return true without updating database
    if (variantId.startsWith('sample-')) {
      console.log('Sample data sale - no inventory update needed');
      return true;
    }
    
    // Update spare part stock instead of regular inventory
    await updateSparePartStock(variantId, quantity, 'subtract');
    return true;
  } catch (error) {
    console.error('Error deducting inventory:', error);
    return false;
  }
}

// Get sales orders with filters
export async function getSalesOrders(filters?: {
  status?: SaleOrder['status'];
  customer_id?: string;
  date_from?: string;
  date_to?: string;
  payment_method?: PaymentMethod;
}): Promise<SaleOrder[]> {
  try {
    let query = supabase
      .from('sales_orders')
      .select(`
        *,
        customer:customers(*),
        items:sales_order_items(*),
        installment_payments:installment_payments(*),
        created_by_user:auth_users(name, email)
      `)
      .order('created_at', { ascending: false });

    if (filters?.status) {
      query = query.eq('status', filters.status);
    }
    if (filters?.customer_id) {
      query = query.eq('customer_id', filters.customer_id);
    }
    if (filters?.date_from) {
      query = query.gte('created_at', filters.date_from);
    }
    if (filters?.date_to) {
      query = query.lte('created_at', filters.date_to);
    }
    if (filters?.payment_method) {
      query = query.eq('payment_method', filters.payment_method);
    }

    const { data: orders, error } = await query;

    if (error) throw error;
    return orders || [];
  } catch (error) {
    console.error('Error fetching sales orders:', error);
    throw error;
  }
}

// Get a single sales order by ID
export async function getSaleOrderById(orderId: string): Promise<SaleOrder | null> {
  try {
    const { data: order, error } = await supabase
      .from('sales_orders')
      .select(`
        *,
        customer:customers(*),
        items:sales_order_items(*),
        installment_payments:installment_payments(*),
        created_by_user:auth_users(name, email)
      `)
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return order;
  } catch (error) {
    console.error('Error fetching sale order:', error);
    return null;
  }
}

// Search products for POS
export async function searchProductsForPOS(query: string): Promise<Product[]> {
  try {
    console.log('POS searching for query:', query);
    
    let allProducts: Product[] = [];
    
    // First, try to search the products table
    try {
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          *,
          variants:product_variants(*)
        `)
        .or(`name.ilike.%${query}%,brand.ilike.%${query}%,model.ilike.%${query}%,product_code.ilike.%${query}%`)
        .eq('is_active', true)
        .order('name');

      if (!error && products) {
        console.log('Found products from products table:', products.length);
        allProducts = [...allProducts, ...products];
      }
    } catch (error) {
      console.log('Products table not available or empty, continuing with spare parts');
    }
    
    // Also search spare parts from inventory
    try {
      const spareParts = await searchSpareParts(query);
      console.log('Found spare parts:', spareParts.length);
      
      // Convert spare parts to Product format for POS compatibility
      const sparePartProducts: Product[] = spareParts.map(sparePart => ({
        id: sparePart.id,
        name: sparePart.name,
        description: sparePart.description || '',
        brand: sparePart.brand || '',
        model: sparePart.model_compatibility?.join(', ') || '',
        category_id: sparePart.category,
        supplier_id: sparePart.supplier || '',
        product_code: sparePart.part_number || '',
        barcode: sparePart.part_number || '',
        minimum_stock_level: sparePart.min_stock_level,
        maximum_stock_level: sparePart.min_stock_level * 2, // Estimate
        reorder_point: sparePart.min_stock_level,
        is_active: sparePart.is_active,
        tags: [sparePart.category],
        images: [],
        specifications: {
          category: sparePart.category,
          brand: sparePart.brand,
          model_compatibility: sparePart.model_compatibility
        },
        warranty_period_months: 0,
        created_at: sparePart.created_at,
        updated_at: sparePart.updated_at,
        // Create a single variant for each spare part
        variants: [{
          id: sparePart.id, // Use spare part ID as variant ID
          product_id: sparePart.id,
          sku: sparePart.part_number || sparePart.id,
          variant_name: sparePart.name,
          attributes: {
            category: sparePart.category,
            brand: sparePart.brand,
            model_compatibility: sparePart.model_compatibility
          },
          cost_price: sparePart.cost,
          selling_price: sparePart.price,
          quantity_in_stock: sparePart.stock_quantity,
          reserved_quantity: 0,
          available_quantity: sparePart.stock_quantity,
          weight_kg: 0,
          dimensions_cm: '',
          is_active: sparePart.is_active,
          created_at: sparePart.created_at,
          updated_at: sparePart.updated_at
        }]
      }));

      allProducts = [...allProducts, ...sparePartProducts];
    } catch (error) {
      console.log('Spare parts not available, continuing');
    }

    console.log('Total products found:', allProducts.length);
    
    // If no products found, return sample data for testing
    if (allProducts.length === 0) {
      console.log('No products found, returning sample data');
      return [
        {
          id: 'sample-1',
          name: 'iPhone 13 Screen',
          description: 'Original replacement screen for iPhone 13',
          brand: 'Apple',
          model: 'iPhone 13',
          category_id: 'screen',
          supplier_id: 'supplier-1',
          product_code: 'IP13-SCR-001',
          barcode: 'IP13-SCR-001',
          minimum_stock_level: 5,
          maximum_stock_level: 20,
          reorder_point: 5,
          is_active: true,
          tags: ['screen'],
          images: [],
          specifications: { category: 'screen', brand: 'Apple' },
          warranty_period_months: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          variants: [{
            id: 'sample-1',
            product_id: 'sample-1',
            sku: 'IP13-SCR-001',
            variant_name: 'iPhone 13 Screen',
            attributes: { category: 'screen', brand: 'Apple' },
            cost_price: 80,
            selling_price: 120,
            quantity_in_stock: 15,
            reserved_quantity: 0,
            available_quantity: 15,
            weight_kg: 0.1,
            dimensions_cm: '10x5x0.1',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]
        },
        {
          id: 'sample-2',
          name: 'Samsung Galaxy Battery',
          description: 'High capacity battery for Samsung Galaxy series',
          brand: 'Samsung',
          model: 'Galaxy S21, S22',
          category_id: 'battery',
          supplier_id: 'supplier-2',
          product_code: 'SAMS-BAT-001',
          barcode: 'SAMS-BAT-001',
          minimum_stock_level: 3,
          maximum_stock_level: 15,
          reorder_point: 3,
          is_active: true,
          tags: ['battery'],
          images: [],
          specifications: { category: 'battery', brand: 'Samsung' },
          warranty_period_months: 6,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          variants: [{
            id: 'sample-2',
            product_id: 'sample-2',
            sku: 'SAMS-BAT-001',
            variant_name: 'Samsung Galaxy Battery',
            attributes: { category: 'battery', brand: 'Samsung' },
            cost_price: 25,
            selling_price: 45,
            quantity_in_stock: 8,
            reserved_quantity: 0,
            available_quantity: 8,
            weight_kg: 0.05,
            dimensions_cm: '5x3x0.2',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]
        },
        {
          id: 'sample-3',
          name: 'iPhone Charging Port',
          description: 'Replacement charging port for iPhone models',
          brand: 'Apple',
          model: 'iPhone 12, 13, 14',
          category_id: 'charging_port',
          supplier_id: 'supplier-1',
          product_code: 'IP-CHG-001',
          barcode: 'IP-CHG-001',
          minimum_stock_level: 4,
          maximum_stock_level: 12,
          reorder_point: 4,
          is_active: true,
          tags: ['charging_port'],
          images: [],
          specifications: { category: 'charging_port', brand: 'Apple' },
          warranty_period_months: 3,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          variants: [{
            id: 'sample-3',
            product_id: 'sample-3',
            sku: 'IP-CHG-001',
            variant_name: 'iPhone Charging Port',
            attributes: { category: 'charging_port', brand: 'Apple' },
            cost_price: 15,
            selling_price: 30,
            quantity_in_stock: 6,
            reserved_quantity: 0,
            available_quantity: 6,
            weight_kg: 0.02,
            dimensions_cm: '2x1x0.1',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]
        }
      ];
    }
    
    return allProducts;
  } catch (error) {
    console.error('Error searching products for POS:', error);
    return [];
  }
}

// Update customer total spent
async function updateCustomerTotalSpent(customerId: string, amount: number): Promise<void> {
  try {
    const { data: customer, error } = await supabase
      .from('customers')
      .select('total_spent')
      .eq('id', customerId)
      .single();

    if (error) throw error;

    const newTotalSpent = (customer.total_spent || 0) + amount;

    await supabase
      .from('customers')
      .update({ total_spent: newTotalSpent })
      .eq('id', customerId);
  } catch (error) {
    console.error('Error updating customer total spent:', error);
  }
}

// Get POS statistics
export async function getPOSStats(): Promise<{
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  todaySales: number;
  todayOrders: number;
}> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all orders
    const { data: allOrders, error: allError } = await supabase
      .from('sales_orders')
      .select('final_amount, created_at')
      .eq('status', 'completed');

    if (allError) throw allError;

    // Get today's orders
    const { data: todayOrders, error: todayError } = await supabase
      .from('sales_orders')
      .select('final_amount, created_at')
      .eq('status', 'completed')
      .gte('created_at', today.toISOString());

    if (todayError) throw todayError;

    const totalSales = allOrders?.reduce((sum, order) => sum + order.final_amount, 0) || 0;
    const totalOrders = allOrders?.length || 0;
    const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;
    const todaySales = todayOrders?.reduce((sum, order) => sum + order.final_amount, 0) || 0;
    const todayOrdersCount = todayOrders?.length || 0;

    return {
      totalSales,
      totalOrders,
      averageOrderValue,
      todaySales,
      todayOrders: todayOrdersCount
    };
  } catch (error) {
    console.error('Error getting POS stats:', error);
    return {
      totalSales: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      todaySales: 0,
      todayOrders: 0
    };
  }
} 