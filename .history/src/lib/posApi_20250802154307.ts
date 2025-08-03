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
import { getProductById, getProductVariants, updateStock } from './inventoryApi';
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
        await updateStock(item.variant_id, 'out', item.quantity, 'sale', order.id);
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
    const product = await getProductById(productId);
    const variants = await getProductVariants(productId);
    const variant = variants.find(v => v.id === variantId);

    if (!variant) {
      throw new Error('Product variant not found');
    }

    // For now, we'll use the selling_price for both retail and wholesale
    // In the future, you can implement different pricing logic here
    let price = variant.selling_price;

    if (customerType === 'wholesale') {
      // Apply wholesale discount (e.g., 10% off)
      price = price * 0.9;
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
    await updateStock(variantId, 'out', quantity, 'sale');
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
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        category:inventory_categories(*),
        supplier:suppliers(*),
        variants:product_variants(*)
      `)
      .or(`name.ilike.%${query}%,product_code.ilike.%${query}%,barcode.ilike.%${query}%`)
      .eq('is_active', true)
      .limit(20);

    if (error) throw error;
    return products || [];
  } catch (error) {
    console.error('Error searching products:', error);
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

// Fetch all customers for POS
export async function getAllCustomersForPOS(): Promise<Customer[]> {
  try {
    const { data: customers, error } = await supabase
      .from('customers')
      .select(`
        *,
        orders:sales_orders(count)
      `)
      .order('name', { ascending: true });

    if (error) throw error;
    return customers || [];
  } catch (error) {
    console.error('Error fetching customers for POS:', error);
    return [];
  }
}

// Fetch all products for POS
export async function getAllProductsForPOS(): Promise<Product[]> {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        category:inventory_categories(*),
        supplier:suppliers(*),
        variants:product_variants(*)
      `)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;
    return products || [];
  } catch (error) {
    console.error('Error fetching products for POS:', error);
    return [];
  }
}

// Fetch all categories for POS
export async function getAllCategoriesForPOS(): Promise<any[]> {
  try {
    const { data: categories, error } = await supabase
      .from('inventory_categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return categories || [];
  } catch (error) {
    console.error('Error fetching categories for POS:', error);
    return [];
  }
}

// Fetch all suppliers for POS
export async function getAllSuppliersForPOS(): Promise<any[]> {
  try {
    const { data: suppliers, error } = await supabase
      .from('suppliers')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    return suppliers || [];
  } catch (error) {
    console.error('Error fetching suppliers for POS:', error);
    return [];
  }
}

// Fetch recent sales orders for POS
export async function getRecentSalesOrders(limit: number = 10): Promise<SaleOrder[]> {
  try {
    const { data: orders, error } = await supabase
      .from('sales_orders')
      .select(`
        *,
        customer:customers(name, phone, city),
        items:sales_order_items(count)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return orders || [];
  } catch (error) {
    console.error('Error fetching recent sales orders:', error);
    return [];
  }
}

// Fetch sales orders by date range
export async function getSalesOrdersByDateRange(
  startDate: string,
  endDate: string,
  status?: SaleOrder['status']
): Promise<SaleOrder[]> {
  try {
    let query = supabase
      .from('sales_orders')
      .select(`
        *,
        customer:customers(name, phone, city),
        items:sales_order_items(count),
        installment_payments:installment_payments(count)
      `)
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: orders, error } = await query;

    if (error) throw error;
    return orders || [];
  } catch (error) {
    console.error('Error fetching sales orders by date range:', error);
    return [];
  }
}

// Fetch low stock products for POS
export async function getLowStockProducts(threshold: number = 10): Promise<Product[]> {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select(`
        *,
        category:inventory_categories(*),
        variants:product_variants(*)
      `)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) throw error;

    // Filter products with low stock variants
    const lowStockProducts = products?.filter(product => 
      product.variants?.some((variant: any) => variant.stock_quantity <= threshold)
    ) || [];

    return lowStockProducts;
  } catch (error) {
    console.error('Error fetching low stock products:', error);
    return [];
  }
}

// Fetch top selling products for POS
export async function getTopSellingProducts(limit: number = 10): Promise<any[]> {
  try {
    const { data: topProducts, error } = await supabase
      .from('sales_order_items')
      .select(`
        product_id,
        product:products(name, product_code),
        total_quantity:quantity,
        total_revenue:item_total
      `)
      .not('product_id', 'is', null);

    if (error) throw error;

    // Group by product and calculate totals
    const productStats = topProducts?.reduce((acc: any, item: any) => {
      const productId = item.product_id;
      if (!acc[productId]) {
        acc[productId] = {
          product_id: productId,
          name: item.product?.name,
          product_code: item.product?.product_code,
          total_quantity: 0,
          total_revenue: 0
        };
      }
      acc[productId].total_quantity += item.total_quantity || 0;
      acc[productId].total_revenue += item.total_revenue || 0;
      return acc;
    }, {});

    // Convert to array and sort by revenue
    const sortedProducts = Object.values(productStats || {})
      .sort((a: any, b: any) => b.total_revenue - a.total_revenue)
      .slice(0, limit);

    return sortedProducts;
  } catch (error) {
    console.error('Error fetching top selling products:', error);
    return [];
  }
}

// Fetch customer purchase history
export async function getCustomerPurchaseHistory(customerId: string): Promise<SaleOrder[]> {
  try {
    const { data: orders, error } = await supabase
      .from('sales_orders')
      .select(`
        *,
        items:sales_order_items(*)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return orders || [];
  } catch (error) {
    console.error('Error fetching customer purchase history:', error);
    return [];
  }
}

// Fetch all data for POS dashboard
export async function getAllPOSData(): Promise<{
  customers: Customer[];
  products: Product[];
  categories: any[];
  suppliers: any[];
  recentOrders: SaleOrder[];
  lowStockProducts: Product[];
  topSellingProducts: any[];
  stats: {
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
    todaySales: number;
    todayOrders: number;
  };
}> {
  try {
    // Fetch all data in parallel
    const [
      customers,
      products,
      categories,
      suppliers,
      recentOrders,
      lowStockProducts,
      topSellingProducts,
      stats
    ] = await Promise.all([
      getAllCustomersForPOS(),
      getAllProductsForPOS(),
      getAllCategoriesForPOS(),
      getAllSuppliersForPOS(),
      getRecentSalesOrders(5),
      getLowStockProducts(10),
      getTopSellingProducts(5),
      getPOSStats()
    ]);

    return {
      customers,
      products,
      categories,
      suppliers,
      recentOrders,
      lowStockProducts,
      topSellingProducts,
      stats
    };
  } catch (error) {
    console.error('Error fetching all POS data:', error);
    return {
      customers: [],
      products: [],
      categories: [],
      suppliers: [],
      recentOrders: [],
      lowStockProducts: [],
      topSellingProducts: [],
      stats: {
        totalSales: 0,
        totalOrders: 0,
        averageOrderValue: 0,
        todaySales: 0,
        todayOrders: 0
      }
    };
  }
} 